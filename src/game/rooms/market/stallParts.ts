import {
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  LatheGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Placement } from '../../kit'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { Builder, cached, type Vec3 } from './build'
import { awningTexture, iceTexture, melonTexture, valanceTexture } from './textures'

/*
 * Shapes, materials and layouts for the market stalls. A stall is built in
 * its own space: 2.8 m wide along x, its front (where customers stand)
 * towards +z, the counter top at COUNTER_TOP.
 */

export const STALL = {
  /** Pole positions: x either side, front and back. */
  poleX: 1.36,
  frontZ: 1.05,
  backZ: -1.05,
  frontH: 2.2,
  backH: 2.7,
  /** The awning reaches this far past the front poles. */
  overhang: 0.3,
}
/** Counter: a trestle table under a cloth, its front edge just inside the front poles. */
export const COUNTER = { width: 2.6, depth: 0.8, z: 0.62, top: 0.87 }

export const lathe = (profile: [number, number][], segments = 20) =>
  new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), segments)

export const POLE = new CylinderGeometry(0.025, 0.025, 1, 8)
export const UNIT_BOX = new BoxGeometry(1, 1, 1)
export const BALL = new SphereGeometry(1, 12, 9)
export const BALL_LOW = new SphereGeometry(1, 8, 6)
export const DISC = new CylinderGeometry(1, 1, 1, 20)

/** The awning's canvas and its scalloped valance, in a stall's colour, stripes along (front to back) or across. */
export const awningMaterials = cached((key: string) => ({
  canvas: new MeshStandardMaterial({ map: awningTexture(key), roughness: 0.85, side: DoubleSide }),
  valance: new MeshStandardMaterial({ map: valanceTexture(key), roughness: 0.85, side: DoubleSide, alphaTest: 0.5 }),
  sheet: new MeshStandardMaterial({ color: key.split('|')[0], roughness: 0.9, side: DoubleSide }),
}))

/** Cloths over the counters, one per colour. */
export const clothMaterial = cached((colour: string) => new MeshStandardMaterial({ color: colour, roughness: 0.95 }))

/** Plain coloured, slightly glossy (fruit, cheese wax, buttons): one per colour. */
export const glossMaterial = cached((colour: string) => new MeshStandardMaterial({ color: colour, roughness: 0.4 }))
export const matteMaterial = cached((colour: string) => new MeshStandardMaterial({ color: colour, roughness: 0.85 }))

// ---------------------------------------------------------------------------
// Crates: a slatted wooden produce crate, open on top, as one mesh
// ---------------------------------------------------------------------------

/** A crate `w` × `d`, `h` deep, origin at the bottom centre. Vertex-coloured. */
export const crateGeometry = cached((key: string) => {
  const [w, d, h] = key.split(',').map(Number)
  const b = new Builder()
  const wood = '#c79a5e'
  const dark = '#9c7240'
  b.box([w, 0.012, d], [0, 0.006, 0], dark)
  const slats = Math.max(2, Math.round(h / 0.06))
  for (let k = 0; k < slats; k++) {
    const y = 0.02 + ((h - 0.03) * (k + 0.5)) / slats
    const sh = (h / slats) * 0.6
    b.box([w, sh, 0.012], [0, y, d / 2 - 0.006], wood)
    b.box([w, sh, 0.012], [0, y, -d / 2 + 0.006], wood)
    b.box([0.012, sh, d], [w / 2 - 0.006, y, 0], wood)
    b.box([0.012, sh, d], [-w / 2 + 0.006, y, 0], wood)
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box([0.035, h, 0.035], [sx * (w / 2 - 0.018), h / 2, sz * (d / 2 - 0.018)], dark)
  return b.merge()
})
export const CRATE_MAT = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })

/** Fruit heaped in a crate: a full bottom layer and a rounded heap on top, `r` the fruit's radius. */
export function heap(at: Vec3, w: number, d: number, r: number, seed: number, squash = 1): Placement[] {
  const rng = mulberry32(seed)
  const out: Placement[] = []
  const nx = Math.max(1, Math.floor(w / (r * 2.05)))
  const nz = Math.max(1, Math.floor(d / (r * 2.05)))
  for (let layer = 0; layer < 3; layer++) {
    const inset = layer * r
    for (let i = 0; i < nx - layer; i++)
      for (let j = 0; j < nz - layer; j++) {
        if (layer === 2 && rng() < 0.4) continue
        const x = -w / 2 + r + inset + i * r * 2.05 + (rng() - 0.5) * r * 0.3
        const z = -d / 2 + r + inset + j * r * 2.05 + (rng() - 0.5) * r * 0.3
        const s = r * (0.9 + rng() * 0.2)
        out.push({
          at: [at[0] + x, at[1] + r * squash + layer * r * 1.5 * squash, at[2] + z],
          rot: [rng() * 6, rng() * 6, rng() * 6],
          scale: [s, s * squash, s],
        })
      }
  }
  return out
}

// ---------------------------------------------------------------------------
// Fruit and veg
// ---------------------------------------------------------------------------

/** A hand of five bananas curving up from a shared crown, about 20 cm long. */
export const BANANA_HAND = (() => {
  const parts: BufferGeometry[] = []
  for (let k = 0; k < 5; k++) {
    const spread = (k - 2) * 0.028
    const pts = Array.from({ length: 6 }, (_, i) => {
      const t = i / 5
      return new Vector3(t * 0.18, Math.sin(t * Math.PI * 0.55) * 0.07 * t + t * 0.02, spread * (0.4 + t))
    })
    const tube = new TubeGeometry(new CatmullRomCurve3(pts), 10, 0.016, 6, false)
    parts.push(tube)
  }
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
})()
export const BANANA = { yellow: glossMaterial('#f2d23a'), blue: glossMaterial('#2f6bff') }

/** Hands of bananas laid in a crate. */
export const bananaHands = (at: Vec3): Placement[] =>
  [0, 1, 2, 3, 4, 5].map((k) => ({
    at: [at[0] - 0.17 + (k % 3) * 0.12, at[1] + 0.03 + Math.floor(k / 3) * 0.035, at[2] - 0.12 + Math.floor(k / 3) * 0.1 + (k % 2) * 0.02],
    rot: [0, 0.3 + (k % 3) * 0.25, 0.15],
  }))

export const MELON_MAT = new MeshStandardMaterial({ map: melonTexture(), roughness: 0.45 })
export const MELON_CUBE = new BoxGeometry(0.26, 0.26, 0.26)
export const MELON = new SphereGeometry(0.15, 20, 14).scale(1, 0.9, 1.2)

/** A pumpkin: a ribbed squashed ball. */
export const PUMPKIN = (() => {
  const g = new SphereGeometry(0.17, 24, 14)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const v = new Vector3().fromBufferAttribute(p, i)
    const a = Math.atan2(v.z, v.x)
    const k = 1 + Math.cos(a * 10) * 0.05
    p.setXYZ(i, v.x * k, v.y * 0.72, v.z * k)
  }
  g.computeVertexNormals()
  return g
})()

// ---------------------------------------------------------------------------
// The fishmonger's
// ---------------------------------------------------------------------------

export const ICE_MAT = new MeshStandardMaterial({ map: iceTexture(), roughness: 0.18, metalness: 0.05 })
/** A prawn: a curled pink tube. */
export const PRAWN = new TorusGeometry(0.03, 0.011, 6, 10, Math.PI * 1.3)
/** A mussel shell: a long, flattened ball. */
export const MUSSEL = new SphereGeometry(0.03, 8, 6).scale(1, 0.45, 0.55)
export const LEMON = new SphereGeometry(0.035, 10, 8).scale(1.2, 1, 1)

export const trayFill = (at: Vec3, w: number, d: number, step: number, seed: number): Placement[] => {
  const rng = mulberry32(seed)
  const out: Placement[] = []
  for (let x = -w / 2 + step / 2; x < w / 2; x += step)
    for (let z = -d / 2 + step / 2; z < d / 2; z += step) {
      out.push({ at: [at[0] + x + (rng() - 0.5) * step * 0.4, at[1] + rng() * 0.02, at[2] + z + (rng() - 0.5) * step * 0.4], rot: [rng() * 0.6 - 0.3, rng() * 6, rng() * 0.6 - 0.3] })
    }
  return out
}

// ---------------------------------------------------------------------------
// Cheese
// ---------------------------------------------------------------------------

/** Cylinder groups: 0 the side (rind), 1 top, 2 bottom (the paste). */
export const WHEEL = new CylinderGeometry(0.2, 0.2, 0.13, 40)
export const WEDGE = new CylinderGeometry(0.2, 0.2, 0.13, 12, 1, false, 0, 0.7)
export const CHEESE = {
  rind: new MeshStandardMaterial({ color: '#c9902f', roughness: 0.7 }),
  paste: new MeshStandardMaterial({ color: '#f4d36a', roughness: 0.6 }),
  pale: new MeshStandardMaterial({ color: '#f7ecc8', roughness: 0.6 }),
  blue: new MeshStandardMaterial({ color: '#e8e6dc', roughness: 0.7 }),
  wax: new MeshStandardMaterial({ color: '#c8242c', roughness: 0.3 }),
  board: new MeshStandardMaterial({ color: '#b98a52', roughness: 0.7 }),
}

/** The snail's shell: a chain of balls winding outwards along a spiral, banded brown. */
export const snailShell = once(() => {
  const b = new Builder()
  const n = 46
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const a = t * Math.PI * 4.2
    const r = 0.02 + t * 0.15
    const size = 0.02 + t * 0.11
    b.add(BALL, i % 6 < 3 ? '#8a5a2e' : '#c9945a', [Math.cos(a) * r * 0.9, Math.sin(a) * r, (1 - t) * 0.06], undefined, [size, size, size * 1.1])
  }
  return b.merge()
})

// ---------------------------------------------------------------------------
// Bakery
// ---------------------------------------------------------------------------

export const DOUGHNUT = new TorusGeometry(0.045, 0.022, 10, 20)
export const ICING = new TorusGeometry(0.045, 0.0235, 8, 20, Math.PI * 2).scale(1, 1, 0.55)
export const LOAF = new SphereGeometry(1, 16, 10)
export const BAGUETTE = new CylinderGeometry(0.03, 0.03, 0.6, 10).translate(0, 0.3, 0)
export const BREAD = {
  crust: new MeshStandardMaterial({ color: '#c88a46', roughness: 0.75 }),
  dark: new MeshStandardMaterial({ color: '#8a5326', roughness: 0.8 }),
  dough: new MeshStandardMaterial({ color: '#d8a15a', roughness: 0.6 }),
  pink: new MeshStandardMaterial({ color: '#f28ab8', roughness: 0.35 }),
  choc: new MeshStandardMaterial({ color: '#4a2614', roughness: 0.35 }),
  wicker: new MeshStandardMaterial({ color: '#a77b45', roughness: 0.9 }),
}

/** Doughnuts in rows on a tray. */
export function doughnutTray(at: Vec3, nx: number, nz: number): Placement[] {
  const out: Placement[] = []
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) out.push({ at: [at[0] + (i - (nx - 1) / 2) * 0.11, at[1] + 0.022, at[2] + (j - (nz - 1) / 2) * 0.11], rot: [Math.PI / 2, 0, 0] })
  return out
}

// ---------------------------------------------------------------------------
// Flowers
// ---------------------------------------------------------------------------

export const BUCKET = lathe([
  [0, 0],
  [0.09, 0],
  [0.12, 0.26],
  [0.125, 0.27],
  [0.115, 0.27],
  [0.105, 0.02],
  [0, 0.02],
])
export const HEAD = new SphereGeometry(0.035, 8, 6)
export const STEM_CLUMP = new CylinderGeometry(0.07, 0.04, 0.3, 8)

/** A bunch of flower heads standing out of a bucket at `at` (the bucket's rim), in a dome. */
export function bunch(at: Vec3, seed: number, n = 13, spread = 0.11): Placement[] {
  const rng = mulberry32(seed)
  return Array.from({ length: n }, () => {
    const a = rng() * Math.PI * 2
    const r = Math.sqrt(rng()) * spread
    const s = 0.8 + rng() * 0.4
    return { at: [at[0] + Math.cos(a) * r, at[1] + 0.18 + (spread - r) * 0.8 + rng() * 0.04, at[2] + Math.sin(a) * r] as Vec3, scale: [s, s * 1.1, s] as Vec3 }
  })
}

/** Sunflower: a disc of petals round a dark centre, facing +z. */
export const SUNFLOWER = {
  petals: new CylinderGeometry(0.15, 0.15, 0.012, 16).rotateX(Math.PI / 2),
  centre: new SphereGeometry(0.075, 14, 8).scale(1, 1, 0.35),
  stem: new CylinderGeometry(0.012, 0.014, 1, 6).translate(0, -0.5, 0),
  petalMat: new MeshStandardMaterial({ color: '#f5c21a', roughness: 0.6 }),
  centreMat: new MeshStandardMaterial({ color: '#4a2a12', roughness: 0.9 }),
  stemMat: new MeshStandardMaterial({ color: '#4f7a2a', roughness: 0.8 }),
}

// ---------------------------------------------------------------------------
// Records and books
// ---------------------------------------------------------------------------

export const SLEEVE = new BoxGeometry(0.31, 0.31, 0.005)
export const RECORD = new CylinderGeometry(0.15, 0.15, 0.004, 32)
export const BOOK = new BoxGeometry(0.035, 0.22, 0.16)
export const SLEEVE_COLOURS = ['#e8402a', '#1f6bff', '#f2d23a', '#111111', '#f4f0e6', '#2fbf71', '#ff3fa4', '#8a4dff', '#ff8a1f', '#16d0ff', '#6a3a22', '#c8c8c8']
export const BOOK_COLOURS = ['#7a2f3a', '#1f3d5a', '#2f5a3a', '#c9a13f', '#3a2a20', '#d8cfb8', '#5a2a5a', '#a0522d']

/** Record sleeves standing in a crate, front to back, each leaning a little. */
export function sleevesIn(at: Vec3, seed: number): Placement[] {
  const rng = mulberry32(seed)
  return Array.from({ length: 26 }, (_, i) => ({
    at: [at[0], at[1] + 0.155, at[2] - 0.15 + i * 0.012] as Vec3,
    rot: [-0.12 + rng() * 0.06, (rng() - 0.5) * 0.04, 0] as Vec3,
  }))
}

/** Books spine up in a tray, a row along x. */
export function booksIn(at: Vec3, seed: number, n = 16): Placement[] {
  const rng = mulberry32(seed)
  return Array.from({ length: n }, (_, i) => {
    const h = 0.85 + rng() * 0.3
    return { at: [at[0] - (n - 1) * 0.019 + i * 0.038, at[1] + 0.11 * h, at[2]] as Vec3, rot: [0, 0, (rng() - 0.5) * 0.08] as Vec3, scale: [1, h, 0.9 + rng() * 0.2] as Vec3 }
  })
}

/** A record drooping over an edge: a disc whose far half bends down, as if melted. */
export const meltedRecord = once(() => droop(new CylinderGeometry(0.15, 0.15, 0.004, 40, 1)))
/** The melted record's label, drooping the same way over the edge. */
export const meltedLabel = once(() => droop(new CylinderGeometry(0.05, 0.05, 0.002, 24, 1).translate(0, 0.0025, 0)))

function droop(g: BufferGeometry) {
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    // past the edge (z > 0) it hangs down and stretches
    if (z > 0) p.setXYZ(i, x * (1 - z * 0.8), p.getY(i) - z * z * 6 - z * 0.4, z * 0.35 + Math.abs(x) * z * 0.6)
  }
  g.computeVertexNormals()
  return g
}

// ---------------------------------------------------------------------------
// Hats
// ---------------------------------------------------------------------------

/** A hat's crown from its profile given top to bottom (lathes want it bottom to top). */
const crown = (profile: [number, number][]) => lathe([...profile].reverse(), 24)

/** Hats, each built with its crown on the origin, brim at y = 0. */
export const HATS = {
  bowler: { crown: crown([[0, 0.12], [0.06, 0.118], [0.09, 0.09], [0.1, 0.04], [0.1, 0]]), brim: new CylinderGeometry(0.15, 0.15, 0.012, 24), colour: '#1a1a1a' },
  trilby: { crown: crown([[0, 0.1], [0.05, 0.11], [0.085, 0.095], [0.1, 0.03], [0.1, 0]]), brim: new CylinderGeometry(0.16, 0.16, 0.01, 24), colour: '#6a5440' },
  boater: { crown: crown([[0, 0.08], [0.1, 0.08], [0.1, 0]]), brim: new CylinderGeometry(0.17, 0.17, 0.01, 24), colour: '#e4cf8a' },
  topper: { crown: crown([[0, 0.2], [0.085, 0.2], [0.09, 0.18], [0.085, 0.06], [0.095, 0]]), brim: new CylinderGeometry(0.15, 0.15, 0.012, 24), colour: '#262030' },
  sun: { crown: crown([[0, 0.1], [0.06, 0.1], [0.095, 0.07], [0.1, 0]]), brim: new CylinderGeometry(0.24, 0.24, 0.008, 28), colour: '#c84a6a' },
}
export type HatKind = keyof typeof HATS

/** Polystyrene display head on a little stand. */
export const DISPLAY_HEAD = new SphereGeometry(0.09, 16, 12).scale(0.92, 1.18, 1)
export const NECK = new CylinderGeometry(0.045, 0.06, 0.12, 12)
export const POLY = new MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.95 })

export const PLANE = new PlaneGeometry(1, 1)
