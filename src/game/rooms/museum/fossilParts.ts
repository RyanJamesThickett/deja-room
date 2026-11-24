import {
  type BufferGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Path,
  Quaternion,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type Curve,
} from 'three'
import type { Placement } from '../../kit'
import type { Vec3 } from '../../mutations'
import { mulberry32 } from '../../rng'

/*
 * Geometry, materials and layout maths for the natural history gallery,
 * built once at module level and shared by every variant.
 */

export const FOSSIL = new MeshStandardMaterial({ color: '#8a6f4e', roughness: 0.78 })
export const FOSSIL_DARK = new MeshStandardMaterial({ color: '#5e4a33', roughness: 0.8 })
export const FOSSIL_2S = new MeshStandardMaterial({ color: '#8a6f4e', roughness: 0.78, side: DoubleSide })
export const TOOTH_MAT = new MeshStandardMaterial({ color: '#d9c8a4', roughness: 0.5 })
export const STEEL = new MeshStandardMaterial({ color: '#1e1f21', metalness: 0.7, roughness: 0.4 })

/** A unit bone: radius 1, length 1 along y, centred. Scaled per bone. */
export const BONE_GEO = new CylinderGeometry(1, 0.85, 1, 10)
export const KNOB_GEO = new SphereGeometry(1, 12, 10)
export const CENTRUM_GEO = new CylinderGeometry(0.05, 0.05, 0.075, 10)
export const SPINE_GEO = new CapsuleGeometry(0.016, 0.12, 3, 6)
export const TOOTH_GEO = new CylinderGeometry(0, 0.012, 0.05, 6)

/** Where a straight bone from a to b sits: its centre, its turn and its length. */
export function boneAt(a: Vec3, b: Vec3) {
  const d = new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const length = d.length()
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.normalize())
  const mid: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  return { mid, q, length }
}

// ---------------------------------------------------------------------------
// The tyrannosaur
// ---------------------------------------------------------------------------

/*
 * Skeleton coordinates: origin on the plinth top under the hips' midpoint,
 * +x towards the head, y up, z across. The backbone runs from the tail tip to
 * the base of the neck; the neck and skull, and the tail, are their own
 * pieces so they can move.
 */

/** Top of the plinth the skeleton stands on. */
export const DINO_PLINTH = { length: 4.1, width: 1.5, height: 0.3, x: -0.05 }

/** Base of the neck: the head turns about this point. */
export const NECK: Vec3 = [0.72, 1.53, 0]

/** Where the tail joins the hips; it wags from here. */
export const TAIL_ROOT: Vec3 = [-0.45, 1.49, 0]

const BACK = new CatmullRomCurve3([new Vector3(...TAIL_ROOT), new Vector3(-0.25, 1.53, 0), new Vector3(0.15, 1.56, 0), new Vector3(0.5, 1.53, 0), new Vector3(...NECK)])
const TAIL = new CatmullRomCurve3([
  new Vector3(...TAIL_ROOT),
  new Vector3(-0.9, 1.38, 0),
  new Vector3(-1.4, 1.22, 0),
  new Vector3(-1.75, 1.1, 0),
  new Vector3(-2.02, 1.02, 0),
])
const NECK_CURVE = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0.18, 0.12, 0), new Vector3(0.3, 0.28, 0), new Vector3(0.38, 0.36, 0)])

/** Where the skull hinges on the neck, relative to the neck base. */
export const SKULL_AT: Vec3 = [0.38, 0.36, 0]

/** Vertebrae along a curve: centrum discs along it and a spine sticking up from each. */
type Path3 = { getPointAt(t: number): Vector3; getTangentAt(t: number): Vector3 }

function vertebrae(curve: Path3, n: number, size: (t: number) => number, spine: (t: number) => number, origin = new Vector3()) {
  const centra: Placement[] = []
  const spines: Placement[] = []
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const p = curve.getPointAt(t).sub(origin)
    const tan = curve.getTangentAt(t)
    const a = Math.atan2(tan.y, tan.x) - Math.PI / 2
    const s = size(t)
    centra.push({ at: [p.x, p.y, p.z], rot: [0, 0, a], scale: [s, s, s] })
    const h = spine(t)
    // straight up off the backbone whichever way the curve runs, leaning back a little like the real thing
    const phi = Math.atan2(tan.y, tan.x)
    const up = (tan.x >= 0 ? phi + Math.PI / 2 : phi - Math.PI / 2) + 0.25
    spines.push({ at: [p.x + Math.cos(up) * h * 0.09, p.y + Math.sin(up) * h * 0.09, p.z], rot: [0, 0, up - Math.PI / 2], scale: [s, h, s] })
  }
  return { centra, spines }
}

export const BACK_BONES = vertebrae(
  BACK,
  13,
  () => 1.1,
  (t) => 1.0 + 0.3 * Math.sin(t * Math.PI),
)

export const NECK_BONES = vertebrae(
  NECK_CURVE,
  6,
  () => 1.05,
  () => 0.55,
)

/** The tail in four pieces, each with its own pivot (relative to the one before) and vertebrae. */
export const TAIL_SECTIONS = (() => {
  const n = 22
  const per = [6, 6, 5, 5]
  const sections: { pivot: Vec3; centra: Placement[]; spines: Placement[] }[] = []
  let start = 0
  let prev = new Vector3(...TAIL_ROOT)
  for (const count of per) {
    const pivot = TAIL.getPointAt(start / n)
    const k = start
    const sub: Path3 = {
      getPointAt: (t: number) => TAIL.getPointAt((k + t * count) / n),
      getTangentAt: (t: number) => TAIL.getTangentAt((k + t * count) / n),
    }
    const { centra, spines } = vertebrae(
      sub,
      count,
      (t) => 1.05 - ((k + t * count) / n) * 0.7,
      (t) => 0.9 - ((k + t * count) / n) * 0.8,
      pivot,
    )
    sections.push({ pivot: [pivot.x - prev.x, pivot.y - prev.y, pivot.z - prev.z], centra, spines })
    prev = pivot
    start += count
  }
  return sections
})()

/** One rib: out from the backbone, down and round under the chest. Mirrored for the left side. */
const RIB_GEO = new TubeGeometry(
  new CatmullRomCurve3([new Vector3(0, 0, 0.04), new Vector3(0.0, -0.08, 0.2), new Vector3(-0.04, -0.35, 0.26), new Vector3(-0.08, -0.62, 0.16)]),
  16,
  0.016,
  6,
)
export { RIB_GEO }

export const RIBS: Placement[] = (() => {
  const out: Placement[] = []
  const n = 9
  for (let i = 0; i < n; i++) {
    const t = 0.4 + (i / (n - 1)) * 0.55
    const p = BACK.getPointAt(t)
    // longest in the middle of the chest, short towards the hips
    const len = 0.4 + 0.55 * Math.sin(((i + 1) / (n + 1)) * Math.PI)
    for (const side of [1, -1]) out.push({ at: [p.x, p.y - 0.03, 0], rot: [0, 0, -0.08], scale: [1, len, side] })
  }
  return out
})()

/** Narrows an extruded side profile towards its front (+x), as a skull narrows to the snout. */
function taper<T extends BufferGeometry>(g: T, length: number, by: number) {
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const f = 1 - by * Math.min(1, Math.max(0, pos.getX(i) / length))
    pos.setZ(i, pos.getZ(i) * f)
  }
  g.computeVertexNormals()
  return g
}

/** Profile of the skull from the side (x forward from the back of the skull, y up), with its openings. */
export const SKULL_GEO = (() => {
  const s = new Shape()
  const pts: [number, number][] = [
    [-0.02, 0.04],
    [0.08, 0.03],
    [0.7, 0.02],
    [0.77, 0.07],
    [0.75, 0.15],
    [0.56, 0.2],
    [0.32, 0.28],
    [0.13, 0.35],
    [0.03, 0.33],
    [-0.04, 0.2],
  ]
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)))
  s.closePath()
  const hole = (x: number, y: number, rx: number, ry: number) => {
    const h = new Path()
    h.absellipse(x, y, rx, ry, 0, Math.PI * 2, true, 0)
    s.holes.push(h)
  }
  hole(0.15, 0.25, 0.045, 0.05) // eye socket
  hole(0.38, 0.14, 0.09, 0.045) // the big opening in front of the eye
  hole(0.66, 0.12, 0.025, 0.018) // nostril
  hole(0.04, 0.15, 0.03, 0.05) // behind the eye
  const g = new ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.012, bevelSegments: 2, curveSegments: 16 })
  g.translate(0, 0, -0.08)
  return taper(g, 0.77, 0.5)
})()

export const JAW_GEO = (() => {
  const s = new Shape()
  const pts: [number, number][] = [
    [0, 0],
    [0.68, -0.01],
    [0.72, -0.05],
    [0.45, -0.09],
    [0.15, -0.14],
    [-0.02, -0.09],
  ]
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)))
  s.closePath()
  const h = new Path()
  h.absellipse(0.16, -0.075, 0.05, 0.025, 0, Math.PI * 2, true, 0)
  s.holes.push(h)
  const g = new ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.01, bevelSegments: 2 })
  g.translate(0, 0, -0.06)
  return taper(g, 0.72, 0.55)
})()

/** Teeth along the upper jaw (pointing down) and the lower (pointing up), both sides. */
export const UPPER_TEETH: Placement[] = (() => {
  const out: Placement[] = []
  for (let i = 0; i < 11; i++)
    for (const z of [-0.07, 0.07]) {
      const x = 0.16 + i * 0.053
      const s = 1.3 - i * 0.07
      out.push({ at: [x, 0.02 - 0.025 * s, z], rot: [Math.PI, 0, 0], scale: [s, s, s] })
    }
  return out
})()

export const LOWER_TEETH: Placement[] = (() => {
  const out: Placement[] = []
  for (let i = 0; i < 10; i++)
    for (const z of [-0.055, 0.055]) {
      const x = 0.2 + i * 0.05
      const s = 1.1 - i * 0.05
      out.push({ at: [x, 0.02 * s, z], scale: [s, s * 0.9, s] })
    }
  return out
})()

/** The pelvis blade beside the hips (from the side). */
export const ILIUM_GEO = (() => {
  const s = new Shape()
  s.moveTo(-0.42, 0)
  s.quadraticCurveTo(-0.4, 0.16, -0.15, 0.17)
  s.lineTo(0.2, 0.17)
  s.quadraticCurveTo(0.38, 0.14, 0.34, -0.02)
  s.quadraticCurveTo(0.05, -0.1, -0.42, 0)
  const g = new ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 })
  g.translate(0, 0, -0.015)
  return g
})()

/** Legs: hip, knee, ankle, ball of the foot and the toes' tips, for the left (z+) and right legs. */
export const LEGS: { joints: Vec3[]; toes: Vec3[] }[] = [
  {
    joints: [
      [-0.25, 1.36, 0.19],
      [0.02, 0.86, 0.23],
      [-0.24, 0.33, 0.21],
      [-0.06, 0.05, 0.2],
    ],
    toes: [
      [0.16, 0.025, 0.12],
      [0.2, 0.025, 0.2],
      [0.15, 0.025, 0.29],
    ],
  },
  {
    joints: [
      [-0.25, 1.36, -0.19],
      [-0.1, 0.87, -0.23],
      [-0.5, 0.38, -0.21],
      [-0.42, 0.06, -0.2],
    ],
    toes: [
      [-0.22, 0.025, -0.12],
      [-0.18, 0.025, -0.2],
      [-0.23, 0.025, -0.29],
    ],
  },
]

export const LEG_RADII = [0.046, 0.038, 0.028]

/** The tiny arms: shoulder blade top, shoulder, elbow, wrist, then two fingers. */
export const ARMS: Vec3[][] = [1, -1].map((s) => [
  [0.42, 1.52, s * 0.16],
  [0.6, 1.3, s * 0.19],
  [0.7, 1.12, s * 0.21],
  [0.84, 1.1, s * 0.19],
])

// ---------------------------------------------------------------------------
// Tapered tubes: tusk, ammonite, tentacles
// ---------------------------------------------------------------------------

/** A tube along `curve` whose radius at t (0..1) is `radius(t)`. */
export function taperedTube(curve: Curve<Vector3>, segments: number, radial: number, radius: (t: number) => number) {
  const g = new TubeGeometry(curve, segments, 1, radial, false)
  const pos = g.attributes.position
  const v = new Vector3()
  for (let i = 0; i <= segments; i++) {
    const c = curve.getPointAt(i / segments)
    const r = radius(i / segments)
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c)
      pos.setXYZ(k, v.x, v.y, v.z)
    }
  }
  g.computeVertexNormals()
  return g
}

/** The mammoth tusk, in wall coordinates (x along the wall, z out), centred on its brackets. */
export const TUSK_CURVE = new CatmullRomCurve3([
  new Vector3(-1.05, -0.12, 0.2),
  new Vector3(-0.55, -0.3, 0.27),
  new Vector3(0.05, -0.28, 0.3),
  new Vector3(0.6, -0.05, 0.27),
  new Vector3(0.95, 0.25, 0.2),
  new Vector3(1.0, 0.4, 0.15),
])
const tuskRadius = (t: number) => 0.085 * (1 - t * 0.82)
export const TUSK_GEO = taperedTube(TUSK_CURVE, 48, 14, tuskRadius)
/** Where the brackets hold the tusk, and how thick it is there. */
export const TUSK_HOLDS = [0.22, 0.62].map((t) => ({ p: TUSK_CURVE.getPointAt(t), r: tuskRadius(t) }))

/** A planispiral ammonite shell, the spiral in the xy plane facing +z, centred on its middle. */
export const AMMONITE = (() => {
  const turns = 2.6
  const a = 0.01
  const b = 0.19
  const pts: Vector3[] = []
  const end = turns * Math.PI * 2
  for (let i = 0; i <= 120; i++) {
    const th = (i / 120) * end
    const r = a * Math.exp(b * th)
    pts.push(new Vector3(Math.cos(th) * r, Math.sin(th) * r, 0))
  }
  const curve = new CatmullRomCurve3(pts)
  const geo = taperedTube(curve, 220, 14, (t) => {
    const r = a * Math.exp(b * t * end)
    // ribs across the whorl
    return r * 0.68 * (1 + 0.05 * Math.sin(t * end * 7))
  })
  const mouth = pts[pts.length - 1]
  const tangent = curve.getTangentAt(1)
  // stood on its edge with the mouth low on the right, tentacles (if any) out to the side
  const tilt = 1.47
  const pos = geo.attributes.position
  let bottom = 0
  for (let i = 0; i < pos.count; i++) bottom = Math.min(bottom, pos.getX(i) * Math.sin(tilt) + pos.getY(i) * Math.cos(tilt))
  return { geo, mouth, tangent, tilt, bottom }
})()

/** A wriggling arm: a short chain of capsules. */
export const TENTACLE_GEO = new CapsuleGeometry(0.02, 0.07, 3, 8)

// ---------------------------------------------------------------------------
// Meteorite
// ---------------------------------------------------------------------------

/** A lumpy, fused iron-stone, about 50 cm across, sitting on y = 0. */
export const METEORITE_GEO = (() => {
  const g = new IcosahedronGeometry(0.28, 5)
  const rng = mulberry32(19)
  const bumps = Array.from({ length: 14 }, () => ({ d: new Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(), k: (rng() - 0.4) * 0.12 }))
  const pos = g.attributes.position
  const v = new Vector3()
  let minY = 0
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = v.clone().normalize()
    let r = 1
    for (const b of bumps) r += b.k * Math.max(0, n.dot(b.d)) ** 3
    v.multiplyScalar(r)
    v.y *= 0.72
    v.x *= 1.15
    pos.setXYZ(i, v.x, v.y, v.z)
    minY = Math.min(minY, v.y)
  }
  g.translate(0, -minY, 0)
  g.computeVertexNormals()
  return g
})()

// ---------------------------------------------------------------------------
// Pteranodon
// ---------------------------------------------------------------------------

/** Its head from the side: a long beak forward (+x) and a crest swept back. */
export const PTERO_HEAD_GEO = (() => {
  const s = new Shape()
  s.moveTo(-0.32, 0.1)
  s.lineTo(-0.02, 0.04)
  s.lineTo(0.42, -0.005)
  s.lineTo(0.0, -0.035)
  s.lineTo(-0.06, -0.02)
  s.quadraticCurveTo(-0.1, 0.06, -0.32, 0.1)
  const g = new ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 1 })
  g.translate(0, 0, -0.015)
  return g
})()

/** One wing's membrane, flat in the xz plane, from the body out along +z. */
export const WING_GEO = (() => {
  const s = new Shape()
  s.moveTo(0.08, 0)
  s.lineTo(0.14, 0.32)
  s.lineTo(0.06, 0.52)
  s.lineTo(-0.02, 1.08)
  s.quadraticCurveTo(-0.12, 0.6, -0.24, 0.1)
  s.lineTo(-0.2, 0)
  const g = new ShapeGeometry(s)
  // shape is in xy; lay it into xz (y of the shape becomes +z)
  g.rotateX(Math.PI / 2)
  return g
})()

export const MEMBRANE = new MeshStandardMaterial({ color: '#7d5f45', roughness: 0.85, side: DoubleSide, transparent: true, opacity: 0.88 })
