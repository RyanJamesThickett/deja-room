import { CylinderGeometry, PlaneGeometry, type BufferGeometry } from 'three'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { MARKET_BOUNDS as B } from './bounds'
import { Builder, cached, cell, type Vec3 } from './build'
import { BRICK_TILE, SIGN_ROWS, signAtlas, STONE_TILE, type SignSpec } from './textures'

/*
 * The buildings round the square, and down the street and the alley that
 * lead off it. Each side is a row of buildings built in its own facade
 * space: the fronts at z = 0 facing +z, x running left to right as you face
 * them, the buildings behind at negative z. Everything is baked into a
 * handful of meshes (one per surface: brick, stone, render, trim, windows,
 * shopfronts, signs), so the whole city costs about ten draw calls.
 */

type Kind = 'brick' | 'stone' | 'render'

/** What's on the ground floor. `look` is a shopAtlas cell: 0 shelves, 1 café, 2 shutter, 3 launderette. */
type Ground =
  | { type: 'shop'; sign: string; bg: string; ink: string; look: 0 | 1 | 2 | 3; serif?: boolean }
  | { type: 'open'; sign: string; bg: string; ink: string }
  | { type: 'pub'; sign: string }
  | { type: 'house' }

interface Building {
  from: number
  to: number
  storeys: number
  kind: Kind
  colour: string
  ground: Ground
  /** Upper windows left out (`storey:index`), where something else hangs. */
  skip?: string[]
  /** Upper floors with no windows at all (a blank party wall, the advert). */
  blank?: number[]
}

interface Side {
  at: Vec3
  turn: number
  depth: number
  buildings: Building[]
}

export const GROUND = 3.6
export const STOREY = 3.0
export const heightOf = (storeys: number) => GROUND + (storeys - 1) * STOREY + 0.8

const PI = Math.PI
const { halfX, halfZ } = B

/** The four sides of the square, then the street off the south side, its far end, and the alley off the west. */
export const SIDES: Record<'north' | 'east' | 'south' | 'west' | 'streetEast' | 'streetWest' | 'streetEnd' | 'alleyNorth' | 'alleySouth' | 'alleyEnd', Side> = {
  north: {
    at: [0, 0, -halfZ],
    turn: 0,
    depth: 9,
    buildings: [
      { from: -14, to: -8, storeys: 5, kind: 'brick', colour: '#b3634a', ground: { type: 'open', sign: 'PAWNBROKERS', bg: '#1d2b4a', ink: '#e8c870' } },
      { from: -8, to: -3, storeys: 4, kind: 'brick', colour: '#7c5442', ground: { type: 'shop', sign: 'SUDS LAUNDERETTE', bg: '#e9f1f5', ink: '#1f6bb0', look: 3 } },
      { from: -3, to: 4, storeys: 6, kind: 'stone', colour: '#efe4cc', ground: { type: 'shop', sign: 'CAFÉ DÉJÀ', bg: '#18402f', ink: '#f4e7c4', look: 1, serif: true }, skip: ['5:1'] },
      { from: 4, to: 9, storeys: 5, kind: 'brick', colour: '#d8b57a', ground: { type: 'shop', sign: 'BOOKS & MAPS', bg: '#5a1f24', ink: '#f2e2b8', look: 0, serif: true }, skip: ['1:1'] },
      { from: 9, to: 14, storeys: 4, kind: 'render', colour: '#e7c2bd', ground: { type: 'shop', sign: 'NEWSAGENT', bg: '#c8242c', ink: '#ffffff', look: 2 } },
    ],
  },
  east: {
    at: [halfX, 0, 0],
    turn: -PI / 2,
    depth: 9,
    buildings: [
      { from: -11, to: -3, storeys: 5, kind: 'stone', colour: '#dcd3c0', ground: { type: 'shop', sign: 'CITY SAVINGS BANK', bg: '#20262e', ink: '#d9c48a', look: 0, serif: true } },
      { from: -3, to: 4, storeys: 4, kind: 'brick', colour: '#9a503e', ground: { type: 'shop', sign: 'BARBER', bg: '#f4f0e6', ink: '#b0202a', look: 0 } },
      { from: 4, to: 11, storeys: 6, kind: 'brick', colour: '#c4845a', ground: { type: 'shop', sign: 'PHARMACY', bg: '#1d7a4a', ink: '#ffffff', look: 0 }, skip: ['1:1'] },
    ],
  },
  south: {
    at: [0, 0, halfZ],
    turn: PI,
    depth: 9,
    buildings: [
      { from: -14, to: -8, storeys: 5, kind: 'brick', colour: '#a9604c', ground: { type: 'shop', sign: 'FISH & CHIPS', bg: '#1f5fa8', ink: '#ffe36b', look: 0 } },
      { from: -8, to: -2, storeys: 4, kind: 'stone', colour: '#e4d8bf', ground: { type: 'shop', sign: 'TAILOR', bg: '#2a2a2a', ink: '#f2f2f2', look: 0, serif: true } },
      { from: 2, to: 8, storeys: 6, kind: 'brick', colour: '#86463a', ground: { type: 'shop', sign: 'HARDWARE', bg: '#e8a020', ink: '#1a1a1a', look: 2 } },
      { from: 8, to: 14, storeys: 4, kind: 'render', colour: '#efe3c6', ground: { type: 'pub', sign: "THE KING'S HEAD" } },
    ],
  },
  west: {
    at: [-halfX, 0, 0],
    turn: PI / 2,
    depth: 9,
    buildings: [
      { from: -11, to: -5.5, storeys: 4, kind: 'brick', colour: '#b46e50', ground: { type: 'shop', sign: 'KEBAB HOUSE', bg: '#c8242c', ink: '#ffe36b', look: 0 } },
      { from: -3.5, to: 3, storeys: 6, kind: 'stone', colour: '#d9ccb2', ground: { type: 'shop', sign: 'PICTURE HOUSE', bg: '#3a1a40', ink: '#ffd34a', look: 2, serif: true } },
      { from: 3, to: 11, storeys: 5, kind: 'brick', colour: '#94573f', ground: { type: 'shop', sign: 'GREENGROCER', bg: '#2f6a2f', ink: '#ffffff', look: 0 }, blank: [3, 4] },
    ],
  },
  // the street leading off the south side, between the tailor and the hardware shop
  streetEast: {
    at: [1.98, 0, 0],
    turn: -PI / 2,
    depth: 8,
    buildings: [
      { from: 11.05, to: 19, storeys: 5, kind: 'brick', colour: '#9c5c48', ground: { type: 'house' } },
      { from: 19, to: 27, storeys: 4, kind: 'render', colour: '#dfe6e8', ground: { type: 'shop', sign: 'DRY CLEANERS', bg: '#2a6fb0', ink: '#ffffff', look: 0 } },
      { from: 27, to: 36, storeys: 5, kind: 'brick', colour: '#b77a55', ground: { type: 'house' } },
      { from: 36, to: 45, storeys: 4, kind: 'stone', colour: '#d6ccb6', ground: { type: 'house' } },
    ],
  },
  streetWest: {
    at: [-1.98, 0, 0],
    turn: PI / 2,
    depth: 8,
    buildings: [
      { from: -45, to: -36, storeys: 5, kind: 'brick', colour: '#8f4f3e', ground: { type: 'house' } },
      { from: -36, to: -27, storeys: 6, kind: 'stone', colour: '#e0d5bd', ground: { type: 'house' } },
      { from: -27, to: -19, storeys: 4, kind: 'brick', colour: '#c08a5c', ground: { type: 'shop', sign: 'LAUNDRY', bg: '#f0f0f0', ink: '#1f6bb0', look: 3 } },
      { from: -19, to: -11.05, storeys: 6, kind: 'brick', colour: '#a35a44', ground: { type: 'house' } },
    ],
  },
  streetEnd: {
    at: [0, 0, 45],
    turn: PI,
    depth: 8,
    buildings: [{ from: -6, to: 6, storeys: 6, kind: 'stone', colour: '#e2d8c2', ground: { type: 'shop', sign: 'GRAND HOTEL', bg: '#202020', ink: '#d9b44a', look: 1, serif: true } }],
  },
  // the alley off the west side: two blank-ish walls and a door at the end
  alleyNorth: {
    at: [0, 0, 3.48],
    turn: 0,
    depth: 0.5,
    buildings: [{ from: -24, to: -14.05, storeys: 4, kind: 'brick', colour: '#8a5a48', ground: { type: 'house' }, blank: [2, 3] }],
  },
  alleySouth: {
    at: [0, 0, 5.48],
    turn: PI,
    depth: 0.5,
    buildings: [{ from: 14.05, to: 24, storeys: 4, kind: 'brick', colour: '#7a4c3c', ground: { type: 'house' }, blank: [1, 3] }],
  },
  alleyEnd: {
    at: [-24, 0, 4.5],
    turn: PI / 2,
    depth: 1,
    buildings: [{ from: -1.6, to: 1.6, storeys: 4, kind: 'brick', colour: '#6e4a3c', ground: { type: 'house' }, blank: [1, 2, 3] }],
  },
}

/** World position of a point given in a side's facade space. */
export function onSide(side: keyof typeof SIDES, x: number, y: number, z = 0): Vec3 {
  const s = SIDES[side]
  const c = Math.cos(s.turn)
  const sn = Math.sin(s.turn)
  return [s.at[0] + x * c + z * sn, s.at[1] + y, s.at[2] - x * sn + z * c]
}

/** Where things hung on the buildings go: world position (on the facade) and the turn that faces them into the square. */
export const ON_WALL = {
  clock: { at: onSide('north', 0.5, heightOf(6) - 2.6), turn: SIDES.north.turn },
  window: { at: onSide('north', 7.75, GROUND + 0.85 + 0.875, 0.03), turn: SIDES.north.turn },
  fireEscape: { at: onSide('north', -5.5, 0), turn: SIDES.north.turn },
  shutter: { at: onSide('north', -11, 0), turn: SIDES.north.turn },
  cafe: { at: onSide('north', 0.5, 0), turn: SIDES.north.turn },
  flag: { at: onSide('north', 1.67, GROUND + STOREY + 0.4, 0.12), turn: SIDES.north.turn },
  dish: { at: onSide('north', 11.5, GROUND + STOREY + 1.4), turn: SIDES.north.turn },
  billboard: { at: onSide('west', 7, GROUND + 2 * STOREY + 2.6), turn: SIDES.west.turn },
  pubSign: { at: onSide('south', 9.2, 3.9), turn: SIDES.south.turn },
  pharmacy: { at: onSide('east', 7.5, GROUND + 0.85 + 0.875), turn: SIDES.east.turn },
  barberPole: { at: onSide('east', 3.3, 2.0), turn: SIDES.east.turn },
}

/** The pawnbroker's open shopfront: the hole in the north side's ground floor, in facade space. */
export const PAWN = { x0: -12.6, x1: -9.4, top: 3.0, depth: 2.6 }

/** The signs on every shopfront, in the order of their rows in the sign atlas, then the stalls' own. */
export const SIGNS: SignSpec[] = []
const signRow = (spec: SignSpec) => {
  const i = SIGNS.findIndex((s) => s.text === spec.text && s.bg === spec.bg)
  if (i >= 0) return i
  SIGNS.push(spec)
  return SIGNS.length - 1
}
export const signRect = (row: number) => cell(row, 1, SIGN_ROWS)

/** Fascia height and the board on it. */
const FASCIA = { y: 3.15, h: 0.62 }

/** Stall name boards share the atlas: their row by name. */
export const STALL_SIGNS = {
  fish: signRow({ text: 'FRESH FISH', bg: '#1c4f86', ink: '#ffffff', aspect: 2.4 / 0.36 }),
  cheese: signRow({ text: 'THE CHEESE BOARD', bg: '#f3d46a', ink: '#3a2a10', aspect: 2.4 / 0.36 }),
  bakery: signRow({ text: 'DOUGH BROS', bg: '#6b3a1f', ink: '#f8e3c0', aspect: 2.4 / 0.36, serif: true }),
  flowers: signRow({ text: 'BLOOMS', bg: '#f4f0e6', ink: '#b0306a', aspect: 2.4 / 0.36, serif: true }),
  fruit: signRow({ text: 'FRUIT & VEG', bg: '#2f7a35', ink: '#ffffff', aspect: 2.4 / 0.36 }),
  antiques: signRow({ text: 'CURIOS & ANTIQUES', bg: '#2a2030', ink: '#e8c870', aspect: 2.4 / 0.36, serif: true }),
  records: signRow({ text: 'SPIN AGAIN RECORDS', bg: '#111111', ink: '#ff5aa8', aspect: 2.4 / 0.36 }),
  hats: signRow({ text: 'MAD HATS', bg: '#7a2f8a', ink: '#ffffff', aspect: 2.4 / 0.36 }),
  hotdogs: signRow({ text: 'HOT DOGS', bg: '#c8242c', ink: '#ffe36b', aspect: 3.4 / 0.42 }),
  coffee: signRow({ text: 'COFFEE', bg: '#1f3d36', ink: '#f2e2b8', aspect: 1.2 / 0.24, serif: true }),
  parcels: signRow({ text: 'SPEEDY PARCELS', bg: '#f4f4f2', ink: '#d0302a', aspect: 3.2 / 0.5 }),
  telephone: signRow({ text: 'TELEPHONE', bg: '#f4f4ec', ink: '#111111', aspect: 0.7 / 0.12 }),
  cafeValance: signRow({ text: 'CAFÉ DÉJÀ', bg: '#18402f', ink: '#f4e7c4', aspect: 5.6 / 0.3, serif: true }),
}

// window and shopfront sizes
const WIN = { w: 1.05, h: 1.75, sill: 0.85 }

function trimColour(b: Building) {
  return b.kind === 'stone' ? '#f1ead8' : b.kind === 'render' ? '#fbf8f1' : '#e9e2d2'
}

/** Adds one building: its shell to `shell[kind]`, mouldings to `trim`, glass to `glass`, shop windows to `shop` and its sign to `signs`. */
function building(b: Building, depth: number, rng: () => number, out: Builders) {
  const { shell, trim, glass, shop, signs } = out
  const w = b.to - b.from
  const cx = (b.from + b.to) / 2
  const H = heightOf(b.storeys)
  const tile = b.kind === 'stone' ? STONE_TILE : BRICK_TILE
  const t = trimColour(b)
  const sh = shell[b.kind]
  const open = b.ground.type === 'open'

  // the shell: one box, or for the pawnbroker's a box over a ground floor with a hole in it
  if (open) {
    sh.box([w, H - PAWN.top, depth], [cx, PAWN.top + (H - PAWN.top) / 2, -depth / 2], b.colour, undefined, tile)
    sh.box([PAWN.x0 - b.from, PAWN.top, depth], [(b.from + PAWN.x0) / 2, PAWN.top / 2, -depth / 2], b.colour, undefined, tile)
    sh.box([b.to - PAWN.x1, PAWN.top, depth], [(b.to + PAWN.x1) / 2, PAWN.top / 2, -depth / 2], b.colour, undefined, tile)
    // the room behind: dim plaster, a dark floor, shelves of other people's things
    const d = PAWN.depth
    const ix = (PAWN.x0 + PAWN.x1) / 2
    const iw = PAWN.x1 - PAWN.x0
    trim.box([iw, 0.05, d], [ix, 0.02, -d / 2], '#4a3c30')
    trim.box([iw, 0.05, d], [ix, PAWN.top + 0.02, -d / 2], '#6c655a')
    trim.box([iw, PAWN.top, 0.05], [ix, PAWN.top / 2, -d - 0.02], '#7d6a52')
    for (const s of [-1, 1]) trim.box([0.05, PAWN.top, d], [ix + (s * iw) / 2 - s * 0.02, PAWN.top / 2, -d / 2], '#76654f')
    for (const y of [1.0, 1.55, 2.1]) {
      trim.box([iw - 0.3, 0.04, 0.4], [ix, y, -d + 0.22], '#5a4630')
      for (let k = 0; k < 9; k++) {
        const v = rng()
        const bw = 0.12 + v * 0.15
        const bh = 0.15 + rng() * 0.3
        trim.box([bw, bh, 0.22], [PAWN.x0 + 0.3 + k * 0.32, y + 0.02 + bh / 2, -d + 0.22], ['#b8913f', '#8c8c8c', '#5a3a2a', '#c8c0b0', '#3a5a7a'][Math.floor(v * 5)])
      }
    }
    // a glass counter
    trim.box([iw * 0.6, 0.95, 0.55], [ix + 0.3, 0.475, -d + 1.2], '#3a3430')
    trim.box([iw * 0.6 + 0.04, 0.03, 0.59], [ix + 0.3, 0.965, -d + 1.2], '#a9b8bd')
  } else {
    sh.box([w, H, depth], [cx, H / 2, -depth / 2], b.colour, undefined, tile)
  }

  // cornice and parapet coping, and the band between the shop and the flats
  trim.box([w + 0.06, 0.32, 0.36], [cx, H - 0.8, 0.16], t)
  trim.box([w + 0.02, 0.12, 0.42], [cx, H + 0.06, -0.1], t)
  trim.box([w, 0.18, 0.12], [cx, GROUND, 0.06], t)
  if (b.kind === 'stone') trim.box([w, 0.1, 0.08], [cx, GROUND + STOREY - 0.05, 0.04], t)

  // upper windows: evenly spaced in each storey, with stone sills and lintels
  const n = Math.max(1, Math.floor((w - 0.6) / 1.9))
  for (let s = 1; s < b.storeys; s++) {
    if (b.blank?.includes(s)) continue
    const top = s === b.storeys - 1
    const h = top ? WIN.h - 0.2 : WIN.h
    const y = GROUND + (s - 1) * STOREY + WIN.sill + h / 2
    for (let i = 0; i < n; i++) {
      if (b.skip?.includes(`${s}:${i}`)) continue
      const x = b.from + (w / n) * (i + 0.5)
      glass.panel(WIN.w, h, [x, y, 0.03], cell(Math.floor(rng() * 4), 2, 2))
      surround(trim, x, y, WIN.w, h, t, b.kind === 'stone' && s === 1)
    }
  }

  // chimney stacks on the roof, set back from the front
  for (let k = 0; k < Math.max(1, Math.floor(w / 4)); k++) {
    const x = b.from + 0.8 + rng() * (w - 1.6)
    const cz = -1.2 - rng() * (depth > 2 ? 2 : 0)
    if (depth < 2) break
    sh.box([0.9, 1.4, 0.6], [x, H + 0.7, cz], b.colour, undefined, tile)
    trim.box([1.0, 0.1, 0.7], [x, H + 1.45, cz], t)
    for (const dx of [-0.22, 0.22]) trim.add(POT, '#b4643c', [x + dx, H + 1.68, cz])
  }

  // the ground floor
  const g = b.ground
  if (g.type === 'house') {
    // a front door with a fanlight, and a window either side of it
    trim.box([1.1, 2.3, 0.08], [cx, 1.15, 0.04], ['#1f3b5a', '#2a5a3a', '#6a1f24', '#202020'][Math.floor(rng() * 4)])
    trim.box([1.4, 0.16, 0.16], [cx, 2.95, 0.08], t)
    glass.panel(1.1, 0.45, [cx, 2.6, 0.09], cell(2, 2, 2))
    for (const s of [-1, 1]) {
      const x = cx + s * Math.min(w / 4 + 0.3, 2.2)
      glass.panel(WIN.w, WIN.h, [x, 0.75 + WIN.h / 2, 0.03], cell(Math.floor(rng() * 4), 2, 2))
      surround(trim, x, 0.75 + WIN.h / 2, WIN.w, WIN.h, t, false)
    }
    return
  }
  // pilasters at each end, the fascia, and its little cornice
  const pub = g.type === 'pub'
  const front = pub ? '#173a28' : '#2a2a2a'
  for (const s of [-1, 1]) trim.box([0.34, GROUND - 0.1, 0.16], [cx + s * (w / 2 - 0.17), (GROUND - 0.1) / 2, 0.08], pub ? front : t)
  const fw = w - 0.68
  trim.box([fw, FASCIA.h + 0.1, 0.1], [cx, FASCIA.y, 0.05], front)
  trim.box([w - 0.3, 0.12, 0.24], [cx, FASCIA.y + FASCIA.h / 2 + 0.1, 0.12], t)
  const row = signRow(
    g.type === 'pub'
      ? { text: g.sign, bg: '#173a28', ink: '#e8c870', aspect: (fw - 0.2) / FASCIA.h, serif: true }
      : { text: g.sign, bg: g.bg, ink: g.ink, aspect: (fw - 0.2) / FASCIA.h, serif: 'serif' in g ? g.serif : false },
  )
  signs.panel(fw - 0.2, FASCIA.h - 0.08, [cx, FASCIA.y, 0.105], signRect(row))
  if (open) {
    // the shutter's roll box over the opening (the shutter itself is an item)
    trim.box([PAWN.x1 - PAWN.x0 + 0.1, 0.3, 0.3], [(PAWN.x0 + PAWN.x1) / 2, PAWN.top + 0.15, 0.15], '#7d8186')
    return
  }
  // a door at one end, the shop window beside it on a stall riser
  const doorX = cx + (rng() < 0.5 ? -1 : 1) * (w / 2 - 0.34 - 0.6)
  const winX0 = doorX < cx ? doorX + 0.62 : cx - w / 2 + 0.34
  const winX1 = doorX < cx ? cx + w / 2 - 0.34 : doorX - 0.62
  const ww = winX1 - winX0
  const wx = (winX0 + winX1) / 2
  trim.box([1.05, 2.5, 0.06], [doorX, 1.25, 0.03], pub ? '#2a1a12' : '#3a3a3a')
  glass.panel(0.7, 1.4, [doorX, 1.55, 0.065], cell(1, 2, 2))
  trim.box([1.2, 0.12, 0.12], [doorX, 2.56, 0.06], front)
  trim.box([ww, 0.6, 0.14], [wx, 0.3, 0.07], front)
  shop.panel(ww, 2.2, [wx, 1.72, 0.04], pub ? cell(1, 2, 2) : cell(g.type === 'shop' ? g.look : 0, 2, 2))
  // mullions and the transom bar
  trim.box([ww, 0.08, 0.1], [wx, 2.84, 0.06], front)
  for (let k = 1; k < Math.round(ww / 1.4); k++) trim.box([0.07, 2.2, 0.1], [winX0 + (ww * k) / Math.round(ww / 1.4), 1.72, 0.06], front)
}

const POT = new CylinderGeometry(0.11, 0.13, 0.36, 8)

/** Sill, lintel and the reveals either side of a window, so it reads as set into the wall. */
function surround(trim: Builder, x: number, y: number, w: number, h: number, colour: string, pediment: boolean) {
  trim.box([w + 0.24, 0.08, 0.2], [x, y - h / 2 - 0.04, 0.1], colour)
  trim.box([w + 0.3, 0.24, 0.12], [x, y + h / 2 + 0.12, 0.06], colour)
  for (const s of [-1, 1]) trim.box([0.07, h, 0.1], [x + s * (w / 2 + 0.035), y, 0.05], colour)
  if (pediment) trim.box([w + 0.5, 0.12, 0.22], [x, y + h / 2 + 0.36, 0.11], colour)
}

interface Builders {
  shell: Record<Kind, Builder>
  trim: Builder
  glass: Builder
  shop: Builder
  signs: Builder
}

/** All the buildings, as one geometry per surface. */
export const cityGeometry = once(() => {
  const out: Builders = {
    shell: { brick: new Builder(), stone: new Builder(), render: new Builder() },
    trim: new Builder(),
    glass: new Builder(),
    shop: new Builder(),
    signs: new Builder(),
  }
  const all = [out.shell.brick, out.shell.stone, out.shell.render, out.trim, out.glass, out.shop, out.signs]
  const rng = mulberry32(2026)
  for (const side of Object.values(SIDES)) {
    all.forEach((b) => b.setFrame(side.at, side.turn))
    for (const b of side.buildings) building(b, side.depth, rng, out)
  }
  const merged: Record<string, BufferGeometry> = {
    brick: out.shell.brick.merge(),
    stone: out.shell.stone.merge(),
    render: out.shell.render.merge(),
    trim: out.trim.merge(),
    glass: out.glass.merge(),
    shop: out.shop.merge(),
    signs: out.signs.merge(),
  }
  return merged
})

/** The sign atlas, once every shopfront has claimed its row. */
export const signsTexture = once(() => {
  cityGeometry()
  return signAtlas(SIGNS)
})

/** A 1 × 1 panel showing one row of the sign atlas; scale it to the board. */
export const signPanel = cached((row: number) => {
  const g = new PlaneGeometry(1, 1)
  const uv = g.attributes.uv
  const [u0, v0, u1, v1] = signRect(row)
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0))
  return g
})
