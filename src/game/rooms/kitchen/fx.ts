import {
  AdditiveBlending,
  Box3,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Path,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { once } from '../../outsideLayers'

/*
 * Geometry and shaders made once for the kitchen's moving and glowing parts:
 * the roaring burner, the oven's racks and elements, the salamander's
 * cheese.
 */

// ---------------------------------------------------------------------------
// A gas flame far too big for its burner
// ---------------------------------------------------------------------------

const FLAME_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  varying float vH;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 p = position;
    float h = clamp(p.y, 0.0, 1.0);
    float t = uTime + uPhase;
    // licks running up the flame, and the whole tongue whipping about
    p.xz *= 1.0 + 0.22 * sin(h * 11.0 - t * 15.0) * h;
    p.x += (0.05 * sin(h * 6.0 - t * 9.0) + 0.06 * sin(t * 3.1)) * h * h;
    p.z += (0.04 * cos(h * 5.0 - t * 8.0) + 0.05 * sin(t * 2.3 + 1.0)) * h * h;
    p.y *= 1.0 + 0.14 * sin(t * 12.0) + 0.07 * sin(t * 29.0);
    vH = h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const FLAME_FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uMid;
  uniform vec3 uTip;
  uniform float uOpacity;
  varying float vH;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    vec3 col = mix(uBase, uMid, smoothstep(0.02, 0.16, vH));
    col = mix(col, uTip, smoothstep(0.4, 0.95, vH));
    float a = uOpacity * pow(facing, 1.3) * (1.0 - smoothstep(0.7, 1.0, vH));
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function flameMaterial(time: { value: number }, phase: number, opacity: number, base: string, mid: string, tip: string, glow = 1) {
  const c = (s: string) => new Color(s).multiplyScalar(glow)
  return new ShaderMaterial({
    vertexShader: FLAME_VERT,
    fragmentShader: FLAME_FRAG,
    uniforms: {
      uTime: time,
      uPhase: { value: phase },
      uOpacity: { value: opacity },
      uBase: { value: c(base) },
      uMid: { value: c(mid) },
      uTip: { value: c(tip) },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
}

/** One tongue of flame, 1 m tall from the burner up, made to be scaled. */
const TONGUE = [
  [0.0, 0.0],
  [0.09, 0.015],
  [0.135, 0.07],
  [0.15, 0.18],
  [0.14, 0.32],
  [0.115, 0.47],
  [0.085, 0.62],
  [0.055, 0.77],
  [0.025, 0.9],
  [0.0, 1.0],
]

export const flameParts = once(() => {
  const time = { value: 0 }
  const geometry = new LatheGeometry(
    TONGUE.map(([r, y]) => new Vector2(r, y)),
    20,
  )
  // lathe geometry is built round y with height 0..1, which is what the shader wants. It's
  // all light, not a thing: leave it out of the range's size (it would seem to clip the pans)
  geometry.computeBoundingSphere()
  geometry.boundingBox = new Box3()
  return {
    geometry,
    outer: flameMaterial(time, 0, 0.75, '#1f45ff', '#ff8a1a', '#ff3a08', 1.4),
    side: flameMaterial(time, 1.7, 0.6, '#2a55ff', '#ff9a2a', '#ff4a10', 1.3),
    core: flameMaterial(time, 0.6, 0.9, '#5a8aff', '#fff2b8', '#ffc04a', 1.8),
  }
})

// ---------------------------------------------------------------------------
// The oven's insides
// ---------------------------------------------------------------------------

/** A wire oven shelf, `w` wide and `d` deep, centred on its origin. */
export const ovenRack = once(() => {
  const w = 0.92
  const d = 0.66
  const parts: BufferGeometry[] = []
  const rod = (len: number, at: [number, number, number], alongX: boolean, r = 0.004) => {
    const g = new CylinderGeometry(r, r, len, 6)
    g.rotateZ(alongX ? Math.PI / 2 : 0)
    if (!alongX) g.rotateX(Math.PI / 2)
    g.translate(...at)
    parts.push(g)
  }
  for (const s of [-1, 1]) {
    rod(w, [0, 0, (s * d) / 2], true, 0.005)
    rod(d, [(s * w) / 2, 0, 0], false, 0.005)
  }
  for (let i = 1; i < 12; i++) rod(d, [-w / 2 + (i * w) / 12, 0.004, 0], false)
  return mergeGeometries(parts)
})

/** A heating element snaking across the oven floor or roof. */
export const ovenElement = once(() => {
  const pts: Vector3[] = []
  const w = 0.42
  for (let i = 0; i <= 6; i++) {
    const z = -0.26 + i * 0.085
    const x = i % 2 ? w : -w
    pts.push(new Vector3(-x, 0, z), new Vector3(x, 0, z))
  }
  const curve = new CatmullRomCurve3(pts, false, 'catmullrom', 0.1)
  return new TubeGeometry(curve, 160, 0.006, 6, false)
})

// ---------------------------------------------------------------------------
// Melted cheese
// ---------------------------------------------------------------------------

/**
 * A curtain of cheese slumped over an edge: it lies on the shelf behind the
 * edge (z < 0), rolls over it, and hangs down in front in uneven drapes,
 * thick and rounded at the bottom. `width` along x.
 */
export const cheeseCurtain = once(() => {
  const width = 0.5
  const cols = 40
  const rows = 26
  const g = new PlaneGeometry(1, 1, cols, rows)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5 // 0..1 across
    const v = 0.5 - pos.getY(i) // 0 at the back of the shelf, 1 at the very bottom
    const x = (u - 0.5) * width
    // how far each part of the curtain hangs: a few heavy lobes
    const hang = 0.07 + 0.05 * Math.abs(Math.sin(u * 9.4)) + 0.06 * Math.max(0, Math.sin(u * 4.1 + 0.7)) ** 3
    // the edge of the curtain is ragged, not straight
    const sag = 1 - 0.25 * (1 - Math.sin(u * Math.PI)) ** 2
    let y: number
    let z: number
    if (v < 0.35) {
      // lying flat on the shelf, bulging up a little
      const k = v / 0.35
      z = -0.08 * (1 - k)
      y = 0.008 + 0.012 * Math.sin(k * Math.PI)
    } else if (v < 0.5) {
      // rolling over the edge
      const a = ((v - 0.35) / 0.15) * (Math.PI / 2)
      z = Math.sin(a) * 0.014
      y = Math.cos(a) * 0.014 - 0.006
    } else {
      const k = (v - 0.5) / 0.5
      y = -0.006 - k * hang * sag
      // the bottom of each lobe swells forward, thick with its own weight
      z = 0.014 + 0.01 * Math.sin(k * Math.PI * 0.9) * (0.5 + hang * 4)
    }
    pos.setXYZ(i, x, y, z)
  }
  g.computeVertexNormals()
  return g
})

/** A thick string of cheese hanging from the edge: a tube that tapers, ending in a heavy bead. */
export function cheeseString(length: number, thickness: number) {
  const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0.003, -length * 0.35, 0.004), new Vector3(-0.002, -length * 0.75, 0.002), new Vector3(0, -length, 0)])
  const g = new TubeGeometry(curve, 24, 1, 8, false)
  // pinch it in the middle and swell it at the end, like a stretched drip
  const pos = g.attributes.position
  const p = new Vector3()
  const c = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    const ring = Math.floor(i / 9)
    const t = ring / 24
    curve.getPointAt(Math.min(t, 1), c)
    const r = thickness * (1 - 0.55 * Math.sin(t * Math.PI) ** 0.7 + 0.5 * Math.max(0, t - 0.8) * 5)
    p.fromBufferAttribute(pos, i).sub(c).normalize().multiplyScalar(r).add(c)
    pos.setXYZ(i, p.x, p.y, p.z)
  }
  g.computeVertexNormals()
  return g
}

/** A slab of Emmental the size of a chopping board, holes right through it. Face towards +z, standing on y = 0. */
export const cheeseSlab = once(() => {
  const w = 0.4
  const h = 0.29
  const b = 0.008
  const shape = new Shape()
  shape.moveTo(-w / 2 + b, b)
  shape.lineTo(w / 2 - b, b)
  shape.lineTo(w / 2 - b, h - b)
  shape.lineTo(-w / 2 + b, h - b)
  shape.closePath()
  const holes: [number, number, number][] = [
    [-0.12, 0.2, 0.035],
    [0.05, 0.22, 0.026],
    [0.13, 0.1, 0.042],
    [-0.04, 0.09, 0.03],
    [-0.15, 0.07, 0.02],
    [0.1, 0.235, 0.016],
    [-0.06, 0.17, 0.014],
  ]
  for (const [x, y, r] of holes) {
    const p = new Path()
    p.absarc(x, y, r, 0, Math.PI * 2, true)
    shape.holes.push(p)
  }
  const g = new ExtrudeGeometry(shape, { depth: 0.05 - b * 2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 24 })
  g.translate(0, 0, -0.025 + b)
  return g
})

/** An S-hook over a rail at the origin (the rail runs along x); what hangs on it hangs from HOOK_DROP below. */
export const HOOK_DROP = 0.072
export const sHook = once(() => {
  const zy: [number, number][] = [
    [-0.013, -0.012],
    [-0.019, 0.0],
    [-0.013, 0.014],
    [0.0, 0.02],
    [0.013, 0.014],
    [0.019, 0.0],
    [0.016, -0.02],
    [0.008, -0.04],
    [0.0, -0.052],
    [-0.006, -0.063],
    [0.0, -0.072],
    [0.01, -0.068],
    [0.014, -0.058],
  ]
  const curve = new CatmullRomCurve3(zy.map(([z, y]) => new Vector3(0, y, z)))
  return new TubeGeometry(curve, 48, 0.0025, 6, false)
})

/** The wires of a balloon whisk: loops from the handle (origin) down, widest near the bottom. */
export const whiskWires = once(() => {
  const len = 0.17
  const r = 0.045
  const loops: BufferGeometry[] = []
  for (let k = 0; k < 4; k++) {
    const pts: Vector3[] = []
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2
      const x = r * Math.sin(a) * (0.35 + 0.65 * Math.sin(((1 - Math.cos(a)) / 2) * Math.PI * 0.62))
      pts.push(new Vector3(x, (-len * (1 - Math.cos(a))) / 2, 0))
    }
    const g = new TubeGeometry(new CatmullRomCurve3(pts, true), 64, 0.0013, 4, true)
    g.rotateY((k * Math.PI) / 4)
    loops.push(g)
  }
  return mergeGeometries(loops)
})

/** A fish slice's blade, slotted: 0.075 wide, 0.12 long, hanging down from the origin, face to +z. */
export const slottedBlade = once(() => {
  const w = 0.075
  const l = 0.12
  const shape = new Shape()
  shape.moveTo(-0.008, 0)
  shape.lineTo(0.008, 0)
  shape.lineTo(w / 2, -0.03)
  shape.lineTo(w / 2, -l + 0.008)
  shape.quadraticCurveTo(w / 2, -l, w / 2 - 0.008, -l)
  shape.lineTo(-w / 2 + 0.008, -l)
  shape.quadraticCurveTo(-w / 2, -l, -w / 2, -l + 0.008)
  shape.lineTo(-w / 2, -0.03)
  shape.closePath()
  for (const x of [-0.02, 0, 0.02]) {
    const p = new Path()
    p.moveTo(x - 0.004, -0.04)
    p.lineTo(x - 0.004, -0.1)
    p.lineTo(x + 0.004, -0.1)
    p.lineTo(x + 0.004, -0.04)
    p.closePath()
    shape.holes.push(p)
  }
  const g = new ExtrudeGeometry(shape, { depth: 0.002, bevelEnabled: false })
  g.translate(0, 0, -0.001)
  return g
})

/** A carrot's leafy top: feathery stalks fanning out from the crown (origin) along -x. */
export const carrotTop = once(() => {
  const parts: BufferGeometry[] = []
  const leaf = new SphereGeometry(1, 6, 4)
  for (let k = 0; k < 5; k++) {
    const spread = (k - 2) * 0.28
    const lift = 0.15 + (k % 2) * 0.12
    const len = 0.1 + (k % 3) * 0.025
    const dir = new Vector3(-Math.cos(spread), Math.sin(lift), Math.sin(spread)).normalize()
    const stalk = new CylinderGeometry(0.0022, 0.003, len, 5)
    stalk.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir))
    stalk.translate(dir.x * len * 0.5, dir.y * len * 0.5, dir.z * len * 0.5)
    parts.push(stalk)
    // feathery leaflets along the outer half of each stalk
    for (let i = 0; i < 4; i++) {
      const t = 0.45 + i * 0.17
      for (const side of [-1, 1]) {
        const l = leaf.clone()
        l.scale(0.016, 0.004, 0.007)
        l.rotateY(Math.atan2(dir.z, -dir.x) + side * 0.7)
        l.translate(dir.x * len * t + side * 0.004 * Math.sin(spread), dir.y * len * t + 0.002, dir.z * len * t + side * 0.006)
        parts.push(l)
      }
    }
  }
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))
  return merged
})

// ---------------------------------------------------------------------------
// Crockery
// ---------------------------------------------------------------------------

/** A stack of `n` plates (or bowls, `step` apart): one lathe, ridged where each plate's rim sits on the next. */
export function plateStack(r: number, n: number, step = 0.021) {
  const pts: Vector2[] = [new Vector2(0, 0), new Vector2(r * 0.8, 0)]
  for (let k = 0; k < n; k++) {
    const y = k * step
    pts.push(new Vector2(r * 0.97, y + step * 0.25), new Vector2(r, y + step * 0.75), new Vector2(r * 0.97, y + step))
  }
  // the top plate's well
  const top = n * step
  pts.push(new Vector2(r * 0.8, top - 0.004), new Vector2(0, top - 0.006))
  const g = new LatheGeometry(pts, 32)
  g.translate(0, -top / 2, 0)
  return g
}
