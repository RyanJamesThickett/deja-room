import {
  BoxGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Quaternion,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
} from 'three'
import type { Placement } from '../../kit'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { Builder, type Vec3 } from './build'
import { lathe } from './stallParts'

/*
 * Shapes for the things standing about the square: the fountain, lamps,
 * bunting, benches, pigeons, the busker's guitar, trees and bikes.
 */

const PI = Math.PI
const UNIT_CYL = new CylinderGeometry(1, 1, 1, 10)
const UNIT_BALL = new SphereGeometry(1, 12, 8)

/** Adds a round bar from `a` to `b` to a builder. */
export function rod(b: Builder, a: Vec3, c: Vec3, r: number, colour: string, geo: BufferGeometry = UNIT_CYL) {
  const d = new Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2])
  const len = d.length()
  const g = geo.clone()
  g.scale(r, len, r)
  g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.normalize()))
  b.add(g, colour, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2])
  g.dispose()
}

// ---------------------------------------------------------------------------
// Fountain
// ---------------------------------------------------------------------------

export const FOUNTAIN = { outer: 2.14, inner: 1.86, water: 0.44, plinthTop: 1.86 }

/** The basin wall: up the outside, over the coping, down the inside. */
export const BASIN = lathe(
  [
    [2.16, 0],
    [2.1, 0.08],
    [2.1, 0.44],
    [2.14, 0.5],
    [2.12, 0.56],
    [2.02, 0.6],
    [1.9, 0.58],
    [1.86, 0.52],
    [1.86, 0.02],
  ],
  64,
)

/** A spout of water arcing from a lion's mouth into the basin, along +z. */
export const waterArc = once(() => {
  const pts = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8
    return new Vector3(0, 1.2 + 0.12 * Math.sin(t * PI * 0.6) - t * t * 0.78, 0.62 + t * 0.62)
  })
  return new TubeGeometry(new CatmullRomCurve3(pts), 24, 0.028, 8, false)
})
export const ICICLE = new ConeGeometry(0.035, 0.32, 6).rotateX(PI)

// ---------------------------------------------------------------------------
// Lamps and bunting
// ---------------------------------------------------------------------------

export const LAMP = { height: 4.3, hook: 3.55, armY: 3.25 }
export const LAMP_BASE = lathe(
  [
    [0.2, 0],
    [0.2, 0.08],
    [0.16, 0.13],
    [0.15, 0.45],
    [0.12, 0.52],
    [0.1, 0.9],
    [0.075, 1.02],
    [0, 1.04],
  ],
  16,
)
export const LAMP_COLUMN = new CylinderGeometry(0.05, 0.065, 2.7, 12)
export const LANTERN_ROOF = new ConeGeometry(0.24, 0.22, 4).rotateY(PI / 4)

/** A whole lamppost but its glass, baked into one mesh: with or without bunting hooks and hanging baskets. */
export const lampGeometry = once(() => {
  const iron = '#1f3a2a'
  const make = (hook: boolean, basket: boolean) => {
    const b = new Builder()
    b.add(LAMP_BASE, iron, [0, 0, 0])
    b.add(LAMP_COLUMN, iron, [0, 2.35, 0])
    b.add(UNIT_CYL, iron, [0, 1.08, 0], undefined, [0.085, 0.05, 0.085])
    // the ladder bar, for the lamplighter's ladder, with ball ends
    b.box([0.62, 0.035, 0.035], [0, LAMP.armY, 0], iron)
    for (const s of [-1, 1]) b.add(UNIT_BALL, iron, [s * 0.31, LAMP.armY, 0], undefined, [0.03, 0.03, 0.03])
    if (hook) for (const s of [-1, 1]) b.box([0.02, 0.02, 0.1], [0, LAMP.hook, s * 0.08], iron)
    // the lantern's frame: a tray, four corner posts, a pyramid roof and a finial
    const ly = 3.7
    b.box([0.28, 0.04, 0.28], [0, ly + 0.02, 0], iron)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box([0.025, 0.4, 0.025], [sx * 0.125, ly + 0.24, sz * 0.125], iron)
    b.add(LANTERN_ROOF, iron, [0, ly + 0.54, 0])
    b.add(UNIT_BALL, iron, [0, ly + 0.68, 0], undefined, [0.035, 0.035, 0.035])
    if (basket) {
      // hanging baskets of flowers off each end of the bar
      const bowl = lathe([[0, 0], [0.18, 0.06], [0.22, 0.2]], 14)
      for (const s of [-1, 1]) {
        const y = LAMP.armY - 0.45
        b.add(bowl, iron, [s * 0.31, y, 0])
        b.add(UNIT_BALL, '#3f7a2f', [s * 0.31, y + 0.2, 0], undefined, [0.25, 0.14, 0.25])
        for (let k = 0; k < 5; k++) b.add(UNIT_BALL, k % 2 ? '#e8402a' : '#ff9fc4', [s * 0.31 + Math.cos(k * 1.3) * 0.17, y + 0.25 + (k % 3) * 0.03, Math.sin(k * 1.3) * 0.17], undefined, [0.05, 0.05, 0.05])
        b.box([0.01, 0.25, 0.01], [s * 0.31, y + 0.33, 0], iron)
      }
      bowl.dispose()
    }
    return b.merge()
  }
  return { plain: make(false, false), hooked: make(true, false), hookedBaskets: make(true, true), baskets: make(false, true) }
})

/** A bent lamppost's column: up from its base, over, and down to hang its lantern in front. */
export const bentColumn = once(
  () =>
    new TubeGeometry(
      new CatmullRomCurve3([new Vector3(0, 1.0, 0), new Vector3(0, 2.2, 0), new Vector3(0, 2.85, 0.15), new Vector3(0, 3.0, 0.55), new Vector3(0, 2.8, 0.95), new Vector3(0, 2.5, 1.12)]),
      40,
      0.055,
      10,
      false,
    ),
)

export const FLAG = (() => {
  const s = new Shape()
  s.moveTo(-0.15, 0)
  s.lineTo(0.15, 0)
  s.lineTo(0, -0.36)
  s.closePath()
  return new ShapeGeometry(s)
})()
export const FLAG_UP = FLAG.clone().rotateZ(PI)
export const FLAG_MAT = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, side: DoubleSide })
export const FLAG_COLOURS = ['#e8402a', '#f2d23a', '#1f6bff', '#2fbf71', '#ff3fa4', '#ffffff', '#ff8a1f']

/** A sock hanging by its top from the line, heel at the back, toe pointing along +x, with a turned-over cuff. */
export const SOCK = (() => {
  const s = new Shape()
  s.moveTo(-0.06, 0)
  s.lineTo(0.06, 0)
  s.lineTo(0.06, -0.2)
  s.quadraticCurveTo(0.07, -0.25, 0.14, -0.26)
  s.quadraticCurveTo(0.2, -0.27, 0.2, -0.31)
  s.quadraticCurveTo(0.2, -0.35, 0.14, -0.35)
  s.lineTo(0.0, -0.35)
  s.quadraticCurveTo(-0.075, -0.35, -0.07, -0.27)
  s.closePath()
  const sock = new ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 8 })
  return sock.translate(0, 0, -0.0125)
})()

/** Height of a rope hung between two points `span` apart, `sag` low in the middle, at `x` from the centre. */
export const ropeY = (x: number, span: number, sag: number) => -sag * (1 - (2 * x) / span) * (1 + (2 * x) / span)

/** The rope between two lamps, in the bunting's own space (centred, along x, ends at y = 0). */
export function ropeGeometry(span: number, sag: number) {
  const pts = Array.from({ length: 21 }, (_, i) => {
    const x = -span / 2 + (span * i) / 20
    return new Vector3(x, ropeY(x, span, sag), 0)
  })
  return new TubeGeometry(new CatmullRomCurve3(pts), 60, 0.008, 5, false)
}

/** Flags (or socks) every `step` along a sagging rope, turned to follow it. */
export function alongRope(span: number, sag: number, step: number, up = false): Placement[] {
  const n = Math.floor((span - 0.4) / step)
  return Array.from({ length: n }, (_, i) => {
    const x = -((n - 1) * step) / 2 + i * step
    const slope = Math.atan((ropeY(x + 0.01, span, sag) - ropeY(x - 0.01, span, sag)) / 0.02)
    return { at: [x, ropeY(x, span, sag) - (up ? -0.005 : 0.005), 0] as Vec3, rot: [0, 0, slope] as Vec3 }
  })
}

// ---------------------------------------------------------------------------
// Benches
// ---------------------------------------------------------------------------

export const BENCH = { length: 1.8, seatY: 0.44 }

/** A bench slat, segmented along its length so it can sag. */
const slat = (w: number, h: number, d: number) => new BoxGeometry(w, h, d, 24, 1, 1)

/** Bends a slat down in the middle, ends held up by the iron frames. */
function sagged(g: BufferGeometry, depth: number) {
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (BENCH.length / 2)
    p.setY(i, p.getY(i) - depth * Math.max(0, 1 - x * x) ** 1.5)
  }
  g.computeVertexNormals()
  return g
}

export const benchSlats = once(() => ({
  seat: slat(BENCH.length, 0.03, 0.08),
  back: slat(BENCH.length, 0.075, 0.03),
  meltedSeat: sagged(slat(BENCH.length, 0.03, 0.08), 0.36),
  meltedBack: sagged(slat(BENCH.length, 0.075, 0.03), 0.5),
}))

// ---------------------------------------------------------------------------
// Pigeons
// ---------------------------------------------------------------------------

/** A feral pigeon, about 32 cm long, standing and facing +z; `pecking` has its head down at the ground. */
export const pigeonGeometry = once(() => {
  const make = (pecking: boolean) => {
    const b = new Builder()
    const grey = '#8b93a0'
    const dark = '#4e5560'
    // body, breast and rump
    b.add(UNIT_BALL, grey, [0, 0.13, 0], [0.25, 0, 0], [0.075, 0.07, 0.13])
    b.add(UNIT_BALL, '#7d8592', [0, 0.14, 0.06], undefined, [0.065, 0.065, 0.07])
    // folded wings with two dark bars
    for (const s of [-1, 1]) {
      b.add(UNIT_BALL, '#a3aab5', [s * 0.05, 0.15, -0.03], [0.3, 0, s * 0.15], [0.035, 0.05, 0.12])
      for (const z of [-0.04, -0.075]) b.box([0.012, 0.012, 0.05], [s * 0.078, 0.16 - z * 0.25, z], dark, [0.3, 0, s * 0.3])
    }
    // tail, dark-tipped
    b.box([0.07, 0.015, 0.11], [0, 0.12, -0.15], dark, [-0.25, 0, 0])
    // the neck shimmers green and purple; the head is small and darker
    const hx: Vec3 = pecking ? [0, 0.07, 0.14] : [0, 0.25, 0.08]
    const nx: Vec3 = pecking ? [0, 0.1, 0.1] : [0, 0.205, 0.07]
    b.add(UNIT_BALL, '#4f8a6e', [nx[0], nx[1], nx[2]], undefined, [0.042, 0.045, 0.042])
    b.add(UNIT_BALL, '#7a5a8a', [nx[0], nx[1] - 0.02, nx[2] + 0.01], undefined, [0.044, 0.03, 0.04])
    b.add(UNIT_BALL, '#6d7480', hx, undefined, [0.032, 0.032, 0.036])
    const beak = new ConeGeometry(0.008, 0.03, 6).rotateX(PI / 2)
    b.add(beak, '#2a2a2a', [hx[0], hx[1] - 0.004, hx[2] + 0.044], pecking ? [0.9, 0, 0] : [0.15, 0, 0])
    b.add(UNIT_BALL, '#e8e4dc', [hx[0], hx[1] + 0.004, hx[2] + 0.03], undefined, [0.008, 0.006, 0.006])
    for (const s of [-1, 1]) {
      b.add(UNIT_BALL, '#e86a1a', [hx[0] + s * 0.026, hx[1] + 0.008, hx[2] + 0.012], undefined, [0.0065, 0.0065, 0.0065])
      b.add(UNIT_BALL, '#111111', [hx[0] + s * 0.0305, hx[1] + 0.008, hx[2] + 0.014], undefined, [0.003, 0.003, 0.003])
      // pink legs and feet
      rod(b, [s * 0.025, 0.08, 0.0], [s * 0.028, 0.0, 0.01], 0.006, '#d0707a')
      b.box([0.012, 0.006, 0.045], [s * 0.028, 0.003, 0.025], '#d0707a')
    }
    beak.dispose()
    return b.merge()
  }
  return { standing: make(false), pecking: make(true) }
})

/** Little flocks round the fountain: where each is, and its birds relative to that, a few standing, most pecking. */
export const FLOCKS: { at: Vec3; birds: [number, number][] }[] = [
  { at: [-1.3, 0, 2.85], birds: [[-0.3, -0.15], [0.2, 0.25], [0.6, -0.25], [-0.6, 0.45], [0, -0.45]] },
  { at: [0.9, 0, -3.1], birds: [[0, 0.2], [0.5, -0.1], [-0.5, -0.2]] },
  { at: [-2.75, 0, -2.15], birds: [[0.15, 0.25], [-0.15, -0.25]] },
]
export const flockLayout = once(() => {
  const rng = mulberry32(61)
  return FLOCKS.map((f) => {
    const standing: Placement[] = []
    const pecking: Placement[] = []
    f.birds.forEach(([x, z], i) => {
      const p: Placement = { at: [x + (rng() - 0.5) * 0.1, 0, z + (rng() - 0.5) * 0.1], rot: [0, rng() * PI * 2, 0] }
      ;(i % 3 === 0 ? standing : pecking).push(p)
    })
    return { standing, pecking }
  })
})

// ---------------------------------------------------------------------------
// The busker's guitar
// ---------------------------------------------------------------------------

/** An acoustic guitar's outline, body at the origin, neck up +y. `s` scales the body (a case is a bit bigger). */
export function guitarShape(s: number) {
  const sh = new Shape()
  sh.moveTo(0, -0.24 * s)
  sh.bezierCurveTo(0.24 * s, -0.24 * s, 0.22 * s, 0.02 * s, 0.11 * s, 0.06 * s)
  sh.bezierCurveTo(0.2 * s, 0.12 * s, 0.18 * s, 0.3 * s, 0.05 * s, 0.3 * s)
  sh.lineTo(0.05 * s, 0.82 * s)
  sh.lineTo(-0.05 * s, 0.82 * s)
  sh.lineTo(-0.05 * s, 0.3 * s)
  sh.bezierCurveTo(-0.18 * s, 0.3 * s, -0.2 * s, 0.12 * s, -0.11 * s, 0.06 * s)
  sh.bezierCurveTo(-0.22 * s, 0.02 * s, -0.24 * s, -0.24 * s, 0, -0.24 * s)
  return sh
}

export const guitarParts = once(() => {
  const body = new Shape()
  body.moveTo(0, -0.24)
  body.bezierCurveTo(0.24, -0.24, 0.22, 0.02, 0.11, 0.06)
  body.bezierCurveTo(0.2, 0.12, 0.18, 0.3, 0, 0.3)
  body.bezierCurveTo(-0.18, 0.3, -0.2, 0.12, -0.11, 0.06)
  body.bezierCurveTo(-0.22, 0.02, -0.24, -0.24, 0, -0.24)
  return {
    body: new ExtrudeGeometry(body, { depth: 0.09, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 16 }).translate(0, 0, -0.045),
    // the case is open: a rim round a thin base, so the lining and the money show
    caseShell: (() => {
      const rim = guitarShape(1.12)
      rim.holes.push(guitarShape(1.0))
      return new ExtrudeGeometry(rim, { depth: 0.11, bevelEnabled: false, curveSegments: 16 })
    })(),
    caseBase: new ExtrudeGeometry(guitarShape(1.12), { depth: 0.015, bevelEnabled: false, curveSegments: 16 }),
    caseLid: new ExtrudeGeometry(guitarShape(1.12), { depth: 0.035, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 16 }),
    plush: new ShapeGeometry(guitarShape(1.04), 16),
  }
})

/** Coins (or buttons) lying in the case's plush, mostly in the body. */
export function moneyIn(n: number, r: number, seed: number): Placement[] {
  const rng = mulberry32(seed)
  return Array.from({ length: n }, () => {
    const y = -0.2 + rng() * 0.45
    const w = y < 0.05 ? 0.17 : 0.12
    return { at: [(rng() - 0.5) * 2 * w, y, 0.004] as Vec3, rot: [PI / 2 + (rng() - 0.5) * 0.4, rng() * 6, 0] as Vec3, scale: [r, 0.003, r] as Vec3 }
  })
}

// ---------------------------------------------------------------------------
// Trees: a London plane in a grate
// ---------------------------------------------------------------------------

/** Trunk and branches as one mesh; the bare variant shows them all. */
export const treeParts = once(() => {
  const rng = mulberry32(71)
  const b = new Builder()
  const bark = '#9a9a7a'
  rod(b, [0, 0, 0], [0, 3.0, 0], 0.17, bark)
  const grow = (from: Vec3, dir: Vector3, len: number, r: number, depth: number) => {
    const to: Vec3 = [from[0] + dir.x * len, from[1] + dir.y * len, from[2] + dir.z * len]
    rod(b, from, to, r, depth > 1 ? '#a8a88a' : '#8a8a6e')
    if (depth === 0) return
    for (let k = 0; k < 3; k++) {
      const d = dir.clone().add(new Vector3((rng() - 0.5) * 1.2, rng() * 0.5, (rng() - 0.5) * 1.2)).normalize()
      grow(to, d, len * 0.65, r * 0.6, depth - 1)
    }
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * PI * 2 + 0.4
    grow([0, 2.8, 0], new Vector3(Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6).normalize(), 1.4, 0.1, 2)
  }
  const wood = b.merge()

  // the crown: overlapping lumpy blobs, darker underneath
  const crown = (colours: string[]) => {
    const c = new Builder()
    const crng = mulberry32(72)
    const blobs: [Vec3, number][] = [
      [[0, 5.0, 0], 2.0],
      [[1.3, 4.6, 0.5], 1.5],
      [[-1.2, 4.7, -0.4], 1.6],
      [[0.4, 4.5, -1.3], 1.4],
      [[-0.5, 4.4, 1.3], 1.4],
      [[0.2, 6.1, 0.2], 1.4],
      [[-1.0, 5.6, 0.8], 1.1],
      [[1.1, 5.7, -0.7], 1.1],
    ]
    for (const [at, r] of blobs) {
      // a lumpy ball: bumps from the vertex's own position, so seams stay shut
      const g = new SphereGeometry(1, 16, 12)
      const p = g.attributes.position
      const seed = crng() * 10
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i)
        const y = p.getY(i)
        const z = p.getZ(i)
        const k = 1 + 0.12 * Math.sin(x * 5 + seed) * Math.sin(y * 4 + seed * 2) * Math.sin(z * 5 - seed)
        p.setXYZ(i, x * k, y * k * 0.8, z * k)
      }
      g.computeVertexNormals()
      c.add(g, colours[Math.floor(crng() * colours.length)], at, [0, crng() * 6, 0], [r * 0.82, r * 0.82, r * 0.82])
      g.dispose()
    }
    return c.merge()
  }
  return {
    wood,
    summer: crown(['#4f7a32', '#5a8a3a', '#46702c', '#64913f']),
    autumn: crown(['#d9761f', '#c8452a', '#e8a62a', '#b85a1f']),
  }
})

// ---------------------------------------------------------------------------
// Bikes
// ---------------------------------------------------------------------------

/** A wheel of radius `r`: tyre and spokes, standing in the x-y plane. */
export function wheelGeometry(r: number) {
  const b = new Builder()
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * PI * 2
    const a2 = ((k + 1) / 40) * PI * 2
    rod(b, [Math.cos(a) * r, Math.sin(a) * r, 0], [Math.cos(a2) * r, Math.sin(a2) * r, 0], 0.019, '#1a1a1a')
  }
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * PI * 2
    rod(b, [0, 0, (k % 2 ? 1 : -1) * 0.02], [Math.cos(a) * (r - 0.02), Math.sin(a) * (r - 0.02), 0], 0.0018, '#c8ccd0')
  }
  b.add(UNIT_CYL, '#9aa0a6', [0, 0, 0], [PI / 2, 0, 0], [0.025, 0.08, 0.025])
  return b.merge()
}

export const bikeParts = once(() => {
  const frame = new Builder()
  const red = '#b0202a'
  // a town bike: wheels at x = ±0.52, crank at the origin's x
  const rear: Vec3 = [-0.52, 0.34, 0]
  const front: Vec3 = [0.52, 0.34, 0]
  const crank: Vec3 = [-0.02, 0.3, 0]
  const seat: Vec3 = [-0.2, 0.86, 0]
  const head: Vec3 = [0.4, 0.86, 0]
  rod(frame, crank, seat, 0.017, red)
  rod(frame, crank, [0.36, 0.72, 0], 0.019, red)
  rod(frame, [-0.17, 0.78, 0], [0.38, 0.8, 0], 0.016, red)
  for (const s of [-1, 1]) {
    rod(frame, crank, [rear[0], rear[1], s * 0.05], 0.01, red)
    rod(frame, [-0.19, 0.8, 0], [rear[0], rear[1], s * 0.05], 0.009, red)
    rod(frame, [0.4, 0.78, 0], [front[0], front[1], s * 0.05], 0.011, '#c8ccd0')
  }
  rod(frame, head, [0.38, 0.98, 0], 0.014, '#c8ccd0')
  rod(frame, [0.34, 1.0, -0.26], [0.34, 1.0, 0.26], 0.012, '#c8ccd0')
  rod(frame, [-0.2, 0.86, 0], [-0.22, 0.95, 0], 0.012, '#c8ccd0')
  frame.box([0.26, 0.05, 0.13], [-0.24, 0.98, 0], '#2a1a12', [0, 0, 0.05])
  // chainring and a front basket
  frame.add(UNIT_CYL, '#6a6e72', crank, [PI / 2, 0, 0], [0.09, 0.01, 0.09])
  frame.box([0.28, 0.2, 0.32], [0.62, 0.88, 0], '#a77b45')

  // a penny-farthing: a great front wheel, a tiny one behind, the saddle on top
  const penny = new Builder()
  const curve = new CatmullRomCurve3([new Vector3(0.1, 1.55, 0), new Vector3(-0.25, 1.45, 0), new Vector3(-0.5, 1.0, 0), new Vector3(-0.62, 0.45, 0), new Vector3(-0.7, 0.2, 0)])
  penny.add(new TubeGeometry(curve, 20, 0.022, 8, false), '#1a1a1a', [0, 0, 0])
  rod(penny, [0.1, 1.55, 0], [0.1, 0.78, 0.06], 0.014, '#1a1a1a')
  rod(penny, [0.1, 1.55, 0], [0.1, 0.78, -0.06], 0.014, '#1a1a1a')
  rod(penny, [0.15, 1.62, -0.3], [0.15, 1.62, 0.3], 0.012, '#c8ccd0')
  penny.box([0.24, 0.05, 0.13], [-0.12, 1.6, 0], '#2a1a12')
  return {
    frame: frame.merge(),
    wheel: wheelGeometry(0.34),
    bigWheel: wheelGeometry(0.78),
    smallWheel: wheelGeometry(0.2),
    penny: penny.merge(),
  }
})

/** A Sheffield stand: one bent steel tube, set in the paving, along x. */
export const SHEFFIELD = new TubeGeometry(
  new CatmullRomCurve3([new Vector3(-0.36, 0, 0), new Vector3(-0.36, 0.62, 0), new Vector3(-0.3, 0.76, 0), new Vector3(0.3, 0.76, 0), new Vector3(0.36, 0.62, 0), new Vector3(0.36, 0, 0)], false, 'catmullrom', 0.2),
  40,
  0.024,
  8,
  false,
)

// ---------------------------------------------------------------------------
// Balloons
// ---------------------------------------------------------------------------

export const BALLOON = new SphereGeometry(0.16, 18, 12).scale(1, 1.18, 1)
export const BALLOON_COLOURS = ['#e8202a', '#1f6bff', '#f2d23a', '#2fbf71', '#ff3fa4', '#8a4dff', '#ff8a1f', '#16d0ff']

/** Where each balloon floats over the cart, relative to where the strings are tied. */
export const balloonSpots = once(() => {
  const rng = mulberry32(81)
  return Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * PI * 2 * 2.3
    const r = 0.18 + rng() * 0.32
    return [Math.cos(a) * r, 0.75 + rng() * 0.75, Math.sin(a) * r] as Vec3
  })
})

/** Where they lie when they've sunk: on the paving round the cart. */
export const sunkSpots = once(() => {
  const rng = mulberry32(82)
  return Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * PI * 2 + rng() * 0.3
    const r = 0.5 + rng() * 0.28
    return [Math.cos(a) * r, 0.19, Math.sin(a) * r] as Vec3
  })
})
