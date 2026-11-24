import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  CylinderGeometry,
  Quaternion,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { once } from '../../outsideLayers'

/*
 * A whole sea bass, built from its outline rather than from blobs. Fish
 * space: x runs from the root of the tail (0) forward to the tip of the snout
 * (BODY), y is up towards the back, z out of its right side. The tail fin
 * reaches back behind x = 0.
 */

/** Body length, root of the tail to the snout; the tail fin adds TAIL behind it. */
export const BODY = 0.4
export const TAIL = 0.1

/** Smooth interpolation through (s, value) points. */
function curve(points: [number, number][]) {
  return (s: number) => {
    const t = Math.min(1, Math.max(0, s))
    let i = 0
    while (i < points.length - 2 && t > points[i + 1][0]) i++
    const [s0, v0] = points[i]
    const [s1, v1] = points[i + 1]
    const k = (t - s0) / (s1 - s0)
    const e = k * k * (3 - 2 * k)
    return v0 + (v1 - v0) * e
  }
}

/** Half the body's depth (back to belly) along its length, s = 0 at the tail, 1 at the snout. */
const depth = curve([
  [0, 0.015],
  [0.15, 0.024],
  [0.35, 0.043],
  [0.55, 0.054],
  [0.72, 0.052],
  [0.85, 0.042],
  [0.93, 0.028],
  [0.98, 0.014],
  [1, 0.004],
])
/** Half its thickness side to side. */
const thick = curve([
  [0, 0.005],
  [0.15, 0.011],
  [0.35, 0.019],
  [0.55, 0.025],
  [0.72, 0.026],
  [0.85, 0.023],
  [0.93, 0.017],
  [0.98, 0.009],
  [1, 0.003],
])
/** How far the middle of the body sits above the line from tail to snout: a humped back, a low snout. */
const rise = curve([
  [0, 0],
  [0.5, 0.004],
  [0.8, 0.002],
  [1, -0.008],
])

/** A point on the skin: `s` along the fish, `a` round it (PI/2 the top of the back, -PI/2 the belly). */
export function skin(s: number, a: number, out = 0) {
  const sin = Math.sin(a)
  const h = depth(s) + out
  const w = thick(s) + out
  return new Vector3(s * BODY, rise(s) + h * sin, w * Math.cos(a) * (1 - 0.18 * Math.max(0, sin)))
}

const DARK = new Color('#3a4955')
const SILVER = new Color('#b8c3cb')
const BELLY = new Color('#f1f2ee')
const LINE = new Color('#47545e')

/** The body's skin from `s0` to `s1`, coloured dark on the back, silver on the sides and white underneath. `cap`: close the s0 end. */
function loft(s0: number, s1: number, cap: boolean) {
  const rings = Math.round((s1 - s0) * 90) + 2
  const round = 32
  const pos: number[] = []
  const col: number[] = []
  const uv: number[] = []
  const c = new Color()
  for (let i = 0; i <= rings; i++) {
    const s = s0 + ((s1 - s0) * i) / rings
    for (let j = 0; j <= round; j++) {
      const a = (j / round) * Math.PI * 2 - Math.PI / 2
      const p = skin(s, a)
      pos.push(p.x, p.y, p.z)
      const up = Math.sin(a)
      c.copy(SILVER).lerp(DARK, Math.min(1, Math.max(0, (up - 0.15) / 0.55)))
      if (up < -0.2) c.lerp(BELLY, Math.min(1, (-0.2 - up) / 0.45))
      // the lateral line, from behind the gills to the tail
      if (Math.abs(up - 0.3) < 0.05 && s < 0.76) c.lerp(LINE, 0.7)
      col.push(c.r, c.g, c.b)
      uv.push(s * 16, (j / round) * 8)
    }
  }
  const index: number[] = []
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < round; j++) {
      const a = i * (round + 1) + j
      const b = a + round + 1
      index.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  if (cap) {
    // a fan over the cut end, in the pink of the flesh
    const centre = pos.length / 3
    pos.push(s0 * BODY, rise(s0), 0)
    col.push(0.85, 0.62, 0.58)
    uv.push(0, 0)
    for (let j = 0; j < round; j++) index.push(centre, j, j + 1)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** Overlapping scales, printed faintly over the skin colours. */
function scaleTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 64, 64)
  g.strokeStyle = 'rgba(40,50,60,0.35)'
  g.lineWidth = 2
  for (let row = 0; row < 5; row++) {
    for (let col = -1; col < 5; col++) {
      const x = col * 16 + (row % 2) * 8
      const y = row * 16
      g.beginPath()
      g.arc(x, y, 10, 0.15 * Math.PI, 0.85 * Math.PI)
      g.stroke()
    }
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

/** Fin rays: fine dark lines, for the see-through fins. */
function rayTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 64, 64)
  g.fillStyle = 'rgba(30,38,46,0.45)'
  for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 2, 64)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(40, 40)
  return t
}

/** A fin standing on a line of skin: `base` from tail to head end, `tip` its outline above it, back to front. */
function fin(base: Vector3[], tip: [number, number][]) {
  const shape = new Shape()
  shape.moveTo(base[0].x, base[0].y)
  for (const p of base.slice(1)) shape.lineTo(p.x, p.y)
  for (const [x, y] of [...tip].reverse()) shape.lineTo(x, y)
  shape.closePath()
  return new ShapeGeometry(shape, 6)
}

/** Points along the top (a = PI/2) or bottom (-PI/2) of the body, between s0 and s1, sunk just inside the skin. */
function ridge(s0: number, s1: number, a: number, n = 8) {
  return Array.from({ length: n + 1 }, (_, i) => skin(s0 + ((s1 - s0) * i) / n, a, -0.002))
}

export const fishParts = once(() => {
  const scales = scaleTexture()
  scales.repeat.set(1, 1)
  const rays = rayTexture()
  const skinMat = new MeshStandardMaterial({ vertexColors: true, map: scales, metalness: 0.45, roughness: 0.28 })
  const finMat = new MeshStandardMaterial({ color: '#66737d', map: rays, metalness: 0.2, roughness: 0.45, transparent: true, opacity: 0.88, side: DoubleSide })

  // first dorsal: tall spines, a sawtooth top
  const d1 = ridge(0.47, 0.66, Math.PI / 2)
  const d1Tip: [number, number][] = d1.map((p, i) => [p.x - 0.006, p.y + (i % 2 ? 0.024 : 0.036) * (1 - Math.abs(i - 3) / 9)])
  // second dorsal and the anal fin: soft, rounded
  const d2 = ridge(0.2, 0.42, Math.PI / 2)
  const d2Tip: [number, number][] = d2.map((p, i) => [p.x - 0.01, p.y + 0.024 * Math.sin(((i + 0.5) / d2.length) * Math.PI) + 0.004])
  const an = ridge(0.17, 0.33, -Math.PI / 2)
  const anTip: [number, number][] = an.map((p, i) => [p.x - 0.01, p.y - 0.02 * Math.sin(((i + 0.5) / an.length) * Math.PI) - 0.004])

  // forked tail, from the root of the tail back
  const tail = new Shape()
  tail.moveTo(0.006, 0.014)
  tail.quadraticCurveTo(-0.04, 0.03, -TAIL, 0.068)
  tail.quadraticCurveTo(-0.085, 0.03, -0.068, 0.0)
  tail.quadraticCurveTo(-0.085, -0.03, -TAIL, -0.068)
  tail.quadraticCurveTo(-0.04, -0.03, 0.006, -0.014)
  tail.closePath()

  // pectoral fin, laid back along the side behind the gills
  const pec = new Shape()
  pec.moveTo(0, 0)
  pec.quadraticCurveTo(-0.02, 0.016, -0.055, 0.008)
  pec.quadraticCurveTo(-0.03, -0.006, 0, -0.008)
  pec.closePath()

  // the gill cover's edge: an arc down the side of the head
  const gill = (side: 1 | -1) =>
    new TubeGeometry(
      new CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => {
        const a = -1.25 + (i / 8) * 2.4
        const p = skin(0.8 - 0.07 * Math.cos(a * 0.85), a, 0.0006)
        p.z *= side
        return p
      })),
      24,
      0.0011,
      5,
      false,
    )

  // the mouth: a dark line from the tip of the snout back under the eye, both sides
  const mouth = (side: 1 | -1) =>
    new TubeGeometry(
      new CatmullRomCurve3(Array.from({ length: 5 }, (_, i) => {
        const p = skin(0.93 + i * 0.0175, -0.45 + i * 0.05, 0.0006)
        p.z *= side
        return p
      })),
      12,
      0.0014,
      5,
      false,
    )

  // the skeleton: backbone, ribs down to the belly, spines up to the back
  const bones: BufferGeometry[] = []
  const rod = (a: Vector3, b: Vector3, r: number) => {
    const d = b.clone().sub(a)
    const g = new CylinderGeometry(r, r * 0.7, d.length(), 5)
    g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.normalize()))
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
    bones.push(g)
  }
  rod(new Vector3(-0.005, 0, 0), new Vector3(0.75 * BODY, 0.002, 0), 0.0045)
  for (let k = 0; k < 14; k++) {
    const s = 0.05 + k * 0.05
    const x = s * BODY
    const y = 0.002
    rod(new Vector3(x, y, 0), new Vector3(x - 0.018, y + depth(s) * 0.85, 0), 0.0018)
    rod(new Vector3(x, y, 0), new Vector3(x - 0.022, y - depth(s) * 0.9, 0), 0.0018)
  }

  return {
    mouth: [mouth(1), mouth(-1)],
    bones: mergeGeometries(bones),
    boneMat: new MeshStandardMaterial({ color: '#efe7d3', roughness: 0.55 }),
    body: loft(0, 1, false),
    head: loft(0.74, 1, true),
    skinMat,
    finMat,
    dorsal1: fin(d1, d1Tip),
    dorsal2: fin(d2, d2Tip),
    anal: fin(an, anTip),
    tail: new ShapeGeometry(tail, 12),
    pectoral: new ShapeGeometry(pec, 8),
    gills: [gill(1), gill(-1)],
    gillMat: new MeshStandardMaterial({ color: '#46535d', roughness: 0.5 }),
  }
})
