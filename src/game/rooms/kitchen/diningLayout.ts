import {
  BoxGeometry,
  BufferAttribute,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  Euler,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'

/*
 * The restaurant's dining room, beyond the kitchen's front wall: seen only
 * through the pass and the swing door's porthole. It's real, low-poly
 * geometry, so it shifts in depth as you walk past the openings: tables
 * with white cloths, bentwood chairs, a red banquette along the back wall,
 * people eating, framed pictures and wall lights.
 *
 * Everything solid is baked into one vertex-coloured mesh, and everything
 * that glows into another, so the whole room costs a handful of draw calls.
 *
 * Dining-room space: x is the kitchen's x, z is metres out from the front
 * wall (the dining room is at +z), y up from the floor.
 */

export const DINING = { halfX: 4.5, depth: 6.4, height: 3.0 }

type Vec3 = [number, number, number]

class Builder {
  parts: BufferGeometry[] = []
  private m = new Matrix4()
  private q = new Quaternion()
  private e = new Euler(0, 0, 0, 'YXZ')
  private c = new Color()

  /** `rot` turns the part about its own x and z, then about y (so y is the way it faces). */
  add(geo: BufferGeometry, colour: string, at: Vec3, rot: Vec3 = [0, 0, 0], scale: Vec3 = [1, 1, 1]) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    this.m.compose(new Vector3(...at), this.q.setFromEuler(this.e.set(rot[0], rot[1], rot[2], 'YXZ')), new Vector3(...scale))
    g.applyMatrix4(this.m)
    this.c.set(colour)
    const n = g.attributes.position.count
    const col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) col.set([this.c.r, this.c.g, this.c.b], i * 3)
    g.setAttribute('color', new BufferAttribute(col, 3))
    this.parts.push(g)
  }

  /** A box by its size and centre. */
  box(size: Vec3, at: Vec3, colour: string, rot?: Vec3) {
    this.add(UNIT_BOX, colour, at, rot, size)
  }

  merge() {
    const g = mergeGeometries(this.parts)
    this.parts.forEach((p) => p.dispose())
    return g
  }
}

const UNIT_BOX = new BoxGeometry(1, 1, 1)
const CYL = new CylinderGeometry(1, 1, 1, 16)
const CYL_LOW = new CylinderGeometry(1, 1, 1, 8)
const BALL = new SphereGeometry(1, 14, 10)
const CAPSULE = new CapsuleGeometry(1, 1, 4, 10)
const PLANE = new PlaneGeometry(1, 1)

const WOOD = '#4a2a1a'
const CLOTH = '#ece6d8'
const CHINA = '#f6f4ee'
const GLASS = '#b9c4c8'
const BRASS = '#b8913f'

/** A bentwood chair at `at`, facing `facing` radians (0: its sitter faces +z). */
function chair(b: Builder, at: Vec3, facing: number) {
  const [x, , z] = at
  const s = Math.sin(facing)
  const c = Math.cos(facing)
  const p = (dx: number, y: number, dz: number): Vec3 => [x + dx * c + dz * s, y, z - dx * s + dz * c]
  b.box([0.42, 0.04, 0.42], p(0, 0.45, 0), WOOD, [0, facing, 0])
  for (const [dx, dz] of [
    [-0.18, -0.18],
    [0.18, -0.18],
    [-0.18, 0.18],
    [0.18, 0.18],
  ]) {
    b.add(CYL_LOW, WOOD, p(dx, 0.22, dz), [0, 0, 0], [0.016, 0.45, 0.016])
  }
  // the back: two uprights and a curved top rail, behind the sitter (-z)
  for (const dx of [-0.17, 0.17]) b.add(CYL_LOW, WOOD, p(dx, 0.72, -0.19), [-0.08, facing, 0], [0.016, 0.52, 0.016])
  b.box([0.38, 0.07, 0.03], p(0, 0.95, -0.21), WOOD, [0, facing, 0])
  b.box([0.34, 0.03, 0.02], p(0, 0.7, -0.2), WOOD, [0, facing, 0])
}

/** Someone sitting at a table: on a seat at `at` (height `seat`), facing `facing`. */
function diner(b: Builder, at: Vec3, facing: number, seat: number, look: { coat: string; skin: string; hair: string; long?: boolean }) {
  const [x, , z] = at
  const s = Math.sin(facing)
  const c = Math.cos(facing)
  const p = (dx: number, y: number, dz: number): Vec3 => [x + dx * c + dz * s, y, z - dx * s + dz * c]
  const r: Vec3 = [0, facing, 0]
  // thighs forward under the table, then the body upright
  b.box([0.34, 0.14, 0.4], p(0, seat + 0.09, 0.08), '#2a2a30', r)
  b.add(CAPSULE, look.coat, p(0, seat + 0.38, -0.02), [0, facing, 0], [0.17, 0.2, 0.12])
  b.add(CAPSULE, look.coat, p(0, seat + 0.55, -0.02), [0, facing, PI2], [0.075, 0.11, 0.075])
  b.add(CYL_LOW, look.skin, p(0, seat + 0.62, -0.01), r, [0.045, 0.1, 0.045])
  b.add(BALL, look.skin, p(0, seat + 0.74, 0.0), r, [0.085, 0.105, 0.095])
  b.add(BALL, look.hair, p(0, seat + 0.77, -0.02), r, [0.092, 0.095, 0.098])
  if (look.long) b.add(CAPSULE, look.hair, p(0, seat + 0.62, -0.06), r, [0.09, 0.12, 0.05])
  // arms down to the elbows, forearms on the table
  for (const side of [-1, 1]) {
    b.add(CAPSULE, look.coat, p(side * 0.2, seat + 0.42, 0.04), [0.35, facing, side * 0.08], [0.045, 0.09, 0.045])
    b.add(CAPSULE, look.coat, p(side * 0.16, seat + 0.3, 0.2), [PI2, facing + side * 0.4, 0], [0.04, 0.08, 0.04])
    b.add(BALL, look.skin, p(side * 0.12, seat + 0.29, 0.35), r, [0.035, 0.03, 0.045])
  }
}

const PI2 = Math.PI / 2

/** A laid place: a plate, a wine glass and cutlery, centred at `at` on a tabletop at `top`. */
function place(b: Builder, at: [number, number], top: number, eaten = false) {
  const [x, z] = at
  b.add(CYL, CHINA, [x, top + 0.008, z], [0, 0, 0], [0.13, 0.014, 0.13])
  if (eaten) b.add(BALL, '#8a4a28', [x + 0.02, top + 0.02, z], [0, 0, 0], [0.06, 0.02, 0.045])
  b.add(CYL_LOW, GLASS, [x + 0.15, top + 0.05, z - 0.08], [0, 0, 0], [0.005, 0.1, 0.005])
  b.add(CYL, GLASS, [x + 0.15, top + 0.13, z - 0.08], [0, 0, 0], [0.035, 0.08, 0.035])
  b.add(CYL, '#6a1020', [x + 0.15, top + 0.115, z - 0.08], [0, 0, 0], [0.032, 0.03, 0.032])
  for (const dx of [-0.17, 0.17]) b.box([0.02, 0.006, 0.18], [x + dx, top + 0.004, z], '#c9ccd0')
}

type Glow = { at: Vec3; size: number; colour: string }

function room() {
  const b = new Builder()
  const glow = new Builder()
  const halos: Glow[] = []
  const { halfX, depth, height } = DINING
  const rng = mulberry32(77)

  // --- walls: dark wood panelling to dado height, deep green above, a brass rail between
  const walls: { len: number; at: Vec3; rot: number }[] = [
    { len: halfX * 2, at: [0, 0, depth], rot: Math.PI },
    { len: depth, at: [-halfX, 0, depth / 2], rot: PI2 },
    { len: depth, at: [halfX, 0, depth / 2], rot: -PI2 },
  ]
  for (const w of walls) {
    const n: Vec3 = [Math.sin(w.rot), 0, Math.cos(w.rot)]
    const off = (d: number): Vec3 => [w.at[0] + n[0] * d, 0, w.at[2] + n[2] * d]
    const [ax, , az] = off(0)
    b.add(PLANE, '#22382c', [ax, height / 2, az], [0, w.rot, 0], [w.len, height, 1])
    const [px, , pz] = off(0.02)
    b.box([w.len, 1.05, 0.04], [px, 0.525, pz], '#3b2216', [0, w.rot, 0])
    const [rx, , rz] = off(0.045)
    b.box([w.len, 0.04, 0.03], [rx, 1.06, rz], BRASS, [0, w.rot, 0])
    // panel mouldings
    for (let k = -w.len / 2 + 0.45; k < w.len / 2 - 0.2; k += 0.9) {
      const t: Vec3 = [Math.cos(w.rot), 0, -Math.sin(w.rot)]
      const [mx, , mz] = off(0.045)
      b.box([0.7, 0.7, 0.012], [mx + t[0] * k, 0.53, mz + t[2] * k], '#4a2c1d', [0, w.rot, 0])
    }
    // picture rail and cornice
    const [cx, , cz] = off(0.04)
    b.box([w.len, 0.12, 0.08], [cx, height - 0.06, cz], '#d8cbb0', [0, w.rot, 0])
  }
  // floor: dark boards; ceiling: warm plaster
  for (let i = 0; i < Math.ceil((halfX * 2) / 0.14); i++) {
    const x = -halfX + 0.07 + i * 0.14
    const shade = ['#5a3420', '#4f2d1b', '#633a24', '#56321e'][Math.floor(rng() * 4)]
    b.box([0.135, 0.02, depth], [x, -0.01, depth / 2], shade)
  }
  b.add(PLANE, '#3a2a20', [0, height, depth / 2], [PI2, 0, 0], [halfX * 2, depth, 1])

  // --- the waiters' side of the pass: a shelf, and a station cupboard under it
  b.box([3.3, 0.04, 0.42], [-1.1, 0.93, 0.21], '#c3c9cf')
  b.box([3.3, 0.88, 0.36], [-1.1, 0.45, 0.18], '#3b2216')
  b.box([3.3, 0.03, 0.4], [-1.1, 0.9, 0.2], '#2a160f')

  // --- the banquette along the back wall, red leather, with two-tops in front
  const benchZ = depth - 0.3
  b.box([halfX * 2 - 0.4, 0.42, 0.55], [0, 0.21, benchZ], '#6a1418')
  b.box([halfX * 2 - 0.4, 0.08, 0.55], [0, 0.46, benchZ], '#8a1c22')
  b.box([halfX * 2 - 0.4, 0.62, 0.14], [0, 0.8, depth - 0.08], '#7a181e', [-0.1, 0, 0])
  for (let x = -halfX + 0.5; x < halfX - 0.3; x += 0.42) b.box([0.02, 0.6, 0.15], [x, 0.8, depth - 0.07], '#5a1014', [-0.1, 0, 0])

  const LOOKS = [
    { coat: '#1f2a44', skin: '#e0b896', hair: '#2a1a10' },
    { coat: '#7a1e2a', skin: '#c58c63', hair: '#140c08', long: true },
    { coat: '#c9a646', skin: '#f0c8a8', hair: '#8a5a2a', long: true },
    { coat: '#2e2e33', skin: '#8a5a3a', hair: '#0c0806' },
    { coat: '#3f6a6a', skin: '#e8c0a0', hair: '#b8b0a0' },
    { coat: '#e6dccb', skin: '#d8a882', hair: '#3a2214', long: true },
    { coat: '#4a3a5e', skin: '#f2cfb4', hair: '#6a3a1a' },
    { coat: '#1a1a1c', skin: '#b07a52', hair: '#1a100a' },
  ]
  let who = 0
  const next = () => LOOKS[who++ % LOOKS.length]

  for (const [i, x] of [-3.4, -1.7, 0, 1.7, 3.4].entries()) {
    const z = benchZ - 0.75
    tableSquare(b, [x, 0, z], 0.75)
    place(b, [x - 0.15, z + 0.2], 0.76, true)
    place(b, [x + 0.12, z - 0.2], 0.76, i % 2 === 0)
    candle(b, glow, halos, [x + 0.2, 0.76, z + 0.05])
    chair(b, [x, 0, z - 0.6], 0)
    // most of the banquette is taken
    if (i !== 2) diner(b, [x - 0.05, 0, benchZ - 0.08], Math.PI, 0.5, next())
    if (i % 2 === 1) diner(b, [x, 0, z - 0.6], 0, 0.47, next())
  }

  // --- round tables in the middle of the room
  for (const [i, x] of [-2.7, -0.5, 1.8].entries()) {
    const z = 3.4
    tableRound(b, [x, 0, z], 0.55)
    const seats = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]
    seats.forEach((a, k) => {
      const at: Vec3 = [x - Math.sin(a) * 0.85, 0, z - Math.cos(a) * 0.85]
      chair(b, at, a)
      place(b, [x - Math.sin(a) * 0.38, z - Math.cos(a) * 0.38], 0.77, k % 2 === 0)
      if ((i + k) % 3 !== 0) diner(b, at, a, 0.47, next())
    })
    candle(b, glow, halos, [x + 0.05, 0.77, z - 0.05])
    // a pendant lamp on a long flex above
    b.add(CYL_LOW, '#111', [x, height - 0.35, z], [0, 0, 0], [0.006, 0.7, 0.006])
    b.add(CYL, BRASS, [x, 2.2, z], [0, 0, 0], [0.16, 0.18, 0.16])
    glow.add(BALL, '#ffe2a8', [x, 2.1, z], [0, 0, 0], [0.07, 0.05, 0.07])
    halos.push({ at: [x, 2.05, z], size: 0.9, colour: '#ffcc88' })
  }

  // --- two-tops near the kitchen, keeping the waiters' aisle and the door clear
  for (const [x, z] of [
    [-3.6, 1.9],
    [3.85, 2.3],
  ] as [number, number][]) {
    tableSquare(b, [x, 0, z], 0.7)
    place(b, [x, z - 0.18], 0.76)
    place(b, [x, z + 0.18], 0.76, true)
    chair(b, [x, 0, z - 0.6], 0)
    chair(b, [x, 0, z + 0.6], Math.PI)
    diner(b, [x, 0, z + 0.6], Math.PI, 0.47, next())
    candle(b, glow, halos, [x + 0.2, 0.76, z])
  }

  // --- pictures and wall lights on the back and side walls
  for (const x of [-3.4, -1.7, 0, 1.7, 3.4]) {
    painting(b, [x, 1.75, depth - 0.03], Math.PI, rng)
  }
  for (const x of [-2.55, -0.85, 0.85, 2.55]) sconce(b, glow, halos, [x, 1.85, depth - 0.02], Math.PI)
  for (const z of [1.4, 3.4, 5.0]) {
    painting(b, [-halfX + 0.03, 1.7, z], PI2, rng)
    painting(b, [halfX - 0.03, 1.7, z], -PI2, rng)
  }
  for (const z of [2.4, 4.3]) {
    sconce(b, glow, halos, [-halfX + 0.02, 1.85, z], PI2)
    sconce(b, glow, halos, [halfX - 0.02, 1.85, z], -PI2)
  }

  // --- a waiter by the side station, with a tray of drinks
  waiter(b, [-3.95, 0, 3.0], PI2)
  b.box([0.5, 0.95, 0.4], [-halfX + 0.22, 0.475, 4.3], '#3b2216')
  b.box([0.52, 0.03, 0.42], [-halfX + 0.22, 0.96, 4.3], '#2a160f')

  return { solid: b.merge(), glow: glow.merge(), halos }
}

function tableSquare(b: Builder, at: Vec3, size: number) {
  const [x, , z] = at
  b.box([size, 0.02, size], [x, 0.75, z], CLOTH)
  // the cloth hangs down all round
  b.box([size + 0.02, 0.28, size + 0.02], [x, 0.62, z], '#e3dccc')
  b.add(CYL_LOW, '#1c120c', [x, 0.25, z], [0, 0, 0], [0.04, 0.5, 0.04])
  b.add(CYL, '#1c120c', [x, 0.01, z], [0, 0, 0], [0.22, 0.02, 0.22])
}

function tableRound(b: Builder, at: Vec3, r: number) {
  const [x, , z] = at
  b.add(CYL, CLOTH, [x, 0.755, z], [0, 0, 0], [r, 0.02, r])
  b.add(CYL, '#e3dccc', [x, 0.58, z], [0, 0, 0], [r + 0.01, 0.34, r + 0.01])
  b.add(CYL, '#1c120c', [x, 0.2, z], [0, 0, 0], [0.05, 0.42, 0.05])
}

function candle(b: Builder, glow: Builder, halos: Glow[], at: Vec3) {
  const [x, y, z] = at
  b.add(CYL, BRASS, [x, y + 0.01, z], [0, 0, 0], [0.035, 0.02, 0.035])
  b.add(CYL, '#f3ecd6', [x, y + 0.07, z], [0, 0, 0], [0.012, 0.11, 0.012])
  glow.add(BALL, '#ffd27a', [x, y + 0.14, z], [0, 0, 0], [0.008, 0.018, 0.008])
  halos.push({ at: [x, y + 0.14, z], size: 0.22, colour: '#ffb060' })
}

/** A framed oil painting on a wall, facing `facing` (radians round y; 0 faces +z). */
function painting(b: Builder, at: Vec3, facing: number, rng: () => number) {
  const n: Vec3 = [Math.sin(facing), 0, Math.cos(facing)]
  const t: Vec3 = [Math.cos(facing), 0, -Math.sin(facing)]
  const w = 0.55 + rng() * 0.25
  const h = 0.42 + rng() * 0.15
  const r: Vec3 = [0, facing, 0]
  b.box([w + 0.08, h + 0.08, 0.04], at, '#9a7430', r)
  const o = (dx: number, dy: number, d: number): Vec3 => [at[0] + t[0] * dx + n[0] * d, at[1] + dy, at[2] + t[2] * dx + n[2] * d]
  // a dusky landscape: sky, distant hills, a field
  const sky = ['#4a5a6a', '#6a5a4a', '#3a4a5a'][Math.floor(rng() * 3)]
  b.box([w, h * 0.55, 0.01], o(0, h * 0.225, 0.022), sky, r)
  b.box([w, h * 0.2, 0.01], o(0, -h * 0.15, 0.022), '#2f3f2a', r)
  b.box([w, h * 0.25, 0.01], o(0, -h * 0.375, 0.022), '#4a4020', r)
  b.box([w * 0.3, h * 0.12, 0.012], o(-w * 0.2 + rng() * w * 0.3, -h * 0.02, 0.024), '#232c1f', r)
}

/** A brass wall light with a little pleated shade. */
function sconce(b: Builder, glow: Builder, halos: Glow[], at: Vec3, facing: number) {
  const n: Vec3 = [Math.sin(facing), 0, Math.cos(facing)]
  const o = (d: number, dy = 0): Vec3 => [at[0] + n[0] * d, at[1] + dy, at[2] + n[2] * d]
  b.box([0.08, 0.14, 0.02], o(0.01), BRASS, [0, facing, 0])
  b.box([0.02, 0.02, 0.12], o(0.07, -0.02), BRASS, [0, facing, 0])
  glow.add(CYL, '#ffd9a0', o(0.13, 0.04), [0, 0, 0], [0.07, 0.12, 0.07])
  halos.push({ at: o(0.03, 0.05), size: 0.9, colour: '#ffbf7a' })
}

function waiter(b: Builder, at: Vec3, facing: number) {
  const [x, , z] = at
  const s = Math.sin(facing)
  const c = Math.cos(facing)
  const p = (dx: number, y: number, dz: number): Vec3 => [x + dx * c + dz * s, y, z - dx * s + dz * c]
  const r: Vec3 = [0, facing, 0]
  for (const dx of [-0.09, 0.09]) b.add(CAPSULE, '#141416', p(dx, 0.45, 0), r, [0.07, 0.75, 0.07])
  b.add(CAPSULE, '#f2f0ea', p(0, 1.22, 0), r, [0.17, 0.32, 0.11])
  // long black apron
  b.box([0.36, 0.7, 0.04], p(0, 0.62, 0.11), '#0e0e10', r)
  b.add(CYL_LOW, '#d8a882', p(0, 1.56, 0), r, [0.045, 0.1, 0.045])
  b.add(BALL, '#d8a882', p(0, 1.68, 0.01), r, [0.085, 0.105, 0.095])
  b.add(BALL, '#2a1a10', p(0, 1.71, -0.01), r, [0.09, 0.09, 0.095])
  b.add(CAPSULE, '#f2f0ea', p(-0.22, 1.12, 0), r, [0.045, 0.3, 0.045])
  // the other arm up, holding a tray of glasses
  b.add(CAPSULE, '#f2f0ea', p(0.22, 1.28, 0.08), [-0.9, facing, 0], [0.045, 0.18, 0.045])
  b.add(CYL, '#c3c9cf', p(0.24, 1.42, 0.24), r, [0.18, 0.015, 0.18])
  for (const [dx, dz] of [
    [0.2, 0.2],
    [0.3, 0.26],
    [0.22, 0.32],
  ]) {
    b.add(CYL, GLASS, p(dx, 1.5, dz), r, [0.03, 0.14, 0.03])
  }
}

/** The dining room's geometry, made once. */
export const diningRoom = once(room)
