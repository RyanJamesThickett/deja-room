import { BoxGeometry, CylinderGeometry, LatheGeometry, MeshStandardMaterial, Vector2, type Material } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Instanced, PI, type Placement } from '../../kit'
import { FRIDGE_SHELVES, type FridgeKind } from './fridgeLayout'
import { cartonTexture, DRINK_CANS, drinkCanTexture, milkLabelTexture, multipackTexture, popLabelTexture } from './textures'

/*
 * What's in a drinks fridge. A run of shop fridges is usually split up: one
 * of fizzy drinks, one of water and juice, one of milk. Five shelves each,
 * stock two or three deep. Positions are in the fridge's own frame (see
 * Fridge in parts.tsx: interior 1.08 wide, front of the shelves at z 0.28).
 */


const lathe = (profile: [number, number][]) => new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 20)
const frontStrip = (r: number, h: number) => new CylinderGeometry(r, r, h, 16, 1, true, -PI / 2, PI)

const CAN = new CylinderGeometry(0.033, 0.033, 0.122, 20)
const SLIM = new CylinderGeometry(0.027, 0.027, 0.155, 18)
const POP = lathe([
  [0, 0],
  [0.031, 0],
  [0.033, 0.02],
  [0.033, 0.15],
  [0.016, 0.2],
  [0.012, 0.23],
  [0, 0.23],
])
const POP_LABEL = frontStrip(0.0335, 0.06)
const WATER = lathe([
  [0, 0],
  [0.03, 0],
  [0.032, 0.02],
  [0.03, 0.06],
  [0.032, 0.1],
  [0.03, 0.14],
  [0.032, 0.17],
  [0.014, 0.22],
  [0.012, 0.24],
  [0, 0.24],
])
const CAP = new CylinderGeometry(0.013, 0.013, 0.018, 12)
const CARTON = new BoxGeometry(0.075, 0.2, 0.075)
const MILK = new RoundedBoxGeometry(0.1, 0.19, 0.1, 3, 0.02)
const MILK_LABEL = new BoxGeometry(0.102, 0.05, 0.102)
const MILK_CAP = new CylinderGeometry(0.02, 0.02, 0.02, 14)
const MULTIPACK = new BoxGeometry(0.27, 0.126, 0.137)

const MILKS = [
  { cap: '#2fa84f', name: 'SEMI' },
  { cap: '#1f5fd8', name: 'WHOLE' },
  { cap: '#d81e1e', name: 'SKIMMED' },
]
const POP_COLOURS = ['#5a1a10', '#ff8a1f', '#9be07a']

// Shared by every fridge and every swap, made on first use (labels need the DOM).
const sharedMaterials = (() => {
  let made: ReturnType<typeof makeMaterials> | null = null
  return () => (made ??= makeMaterials())
})()
function makeMaterials() {
  const plain = (color: string, extra: Partial<MeshStandardMaterial> = {}) => new MeshStandardMaterial({ color, roughness: 0.3, ...extra })
  const lid = plain('#c9ced6', { metalness: 0.9, roughness: 0.3 })
  const card = plain('#d81e1e')
  const printed = (map: ReturnType<typeof drinkCanTexture>, extra: Partial<MeshStandardMaterial> = {}) => new MeshStandardMaterial({ map, roughness: 0.35, ...extra })
  return {
    // cylinder faces: side, top, bottom
    cans: DRINK_CANS.map((_, i): Material[] => [printed(drinkCanTexture(i), { metalness: 0.4 }), lid, lid]),
    pop: POP_COLOURS.map((color) => plain(color, { transparent: true, opacity: 0.85, roughness: 0.1 })),
    popLabel: [0, 1, 2].map((i) => printed(popLabelTexture(i))),
    popCap: plain('#f4f4f0'),
    water: plain('#cfe9ff', { transparent: true, opacity: 0.5, roughness: 0.05 }),
    waterCap: plain('#1f5fd8'),
    cartons: [printed(cartonTexture('orange')), printed(cartonTexture('apple'))],
    milk: plain('#f7f7f2', { roughness: 0.4 }),
    milkLabel: MILKS.map((m) => printed(milkLabelTexture(m.cap, m.name))),
    milkCap: MILKS.map((m) => plain(m.cap)),
    // box faces: +x, -x, +y, -y, +z (front), -z
    multipack: [card, card, card, card, printed(multipackTexture()), card],
  }
}

type Rows = Record<string, Placement[]>

// the layout only depends on the kind, so each one is worked out once
const stockCache = new Map<FridgeKind, Rows>()
const stockFor = (kind: FridgeKind) => {
  let rows = stockCache.get(kind)
  if (!rows) stockCache.set(kind, (rows = layoutStock(kind)))
  return rows
}

function layoutStock(kind: FridgeKind): Rows {
  const rows: Rows = {}
  const put = (key: string, p: Placement) => (rows[key] ??= []).push(p)
  // a row across a shelf, `deep` rows back from the front
  const across = (y: number, spacing: number, deep: number, depth: number, add: (x: number, y: number, z: number, i: number) => void) => {
    const n = Math.floor(1.02 / spacing)
    const x0 = -((n - 1) * spacing) / 2
    for (let d = 0; d < deep; d++) for (let i = 0; i < n; i++) add(x0 + i * spacing, y, 0.2 - d * depth, i)
  }
  // turn cans so their names face out
  const can = (key: string, x: number, y: number, z: number, h: number) => put(key, { at: [x, y + h / 2, z], rot: [0, -PI / 2, 0] })
  const [s0, s1, s2, s3, s4] = FRIDGE_SHELVES
  if (kind === 'fizzy') {
    across(s4, 0.06, 3, 0.07, (x, y, z, i) => can(`can${i % 4 < 2 ? 1 : 0}`, x, y, z, i % 4 < 2 ? 0.155 : 0.122))
    across(s3, 0.07, 3, 0.075, (x, y, z, i) => can(`can${Math.floor(i / 5) % 2 ? 2 : 0}`, x, y, z, 0.122))
    across(s2, 0.07, 3, 0.075, (x, y, z, i) => can(`can${Math.floor(i / 5) % 2 ? 3 : 0}`, x, y, z, 0.122))
    for (const [shelf, first] of [
      [s1, 0],
      [s0, 1],
    ] as const)
      across(shelf, 0.072, 3, 0.08, (x, y, z, i) => {
        const c = (first + Math.floor(i / 5)) % 3
        put(`pop${c}`, { at: [x, y, z] })
        put(`popLabel${c}`, { at: [x, y + 0.1, z] })
        put('popCap', { at: [x, y + 0.239, z] })
      })
  } else if (kind === 'water') {
    for (const shelf of [s4, s3, s2])
      across(shelf, 0.068, 3, 0.075, (x, y, z) => {
        put('water', { at: [x, y, z] })
        put('waterCap', { at: [x, y + 0.249, z] })
      })
    for (const shelf of [s1, s0]) across(shelf, 0.085, 3, 0.085, (x, y, z, i) => put(`carton${Math.floor(i / 6) % 2}`, { at: [x, y + 0.1, z] }))
  } else {
    for (const [shelf, first] of [
      [s4, 0],
      [s3, 1],
      [s2, 2],
    ] as const)
      across(shelf, 0.112, 2, 0.115, (x, y, z, i) => {
        const m = (first + Math.floor(i / 3)) % 3
        put('milk', { at: [x, y + 0.095, z] })
        put(`milkLabel${m}`, { at: [x, y + 0.1, z] })
        put(`milkCap${m}`, { at: [x + 0.025, y + 0.2, z] })
      })
    for (const shelf of [s1, s0]) across(shelf, 0.29, 2, 0.15, (x, y, z) => put('multipack', { at: [x, y + 0.063, z] }))
  }
  return rows
}

/** The stock in one fridge. */
export function FridgeStock({ kind }: { kind: FridgeKind }) {
  const m = sharedMaterials()
  const rows = stockFor(kind)
  const parts: [string, Parameters<typeof Instanced>[0]['geometry'], Material | Material[]][] = [
    ['can0', CAN, m.cans[0]],
    ['can1', SLIM, m.cans[1]],
    ['can2', CAN, m.cans[2]],
    ['can3', CAN, m.cans[3]],
    ...[0, 1, 2].map((i): [string, typeof POP, Material] => [`pop${i}`, POP, m.pop[i]]),
    ...[0, 1, 2].map((i): [string, typeof POP_LABEL, Material] => [`popLabel${i}`, POP_LABEL, m.popLabel[i]]),
    ['popCap', CAP, m.popCap],
    ['water', WATER, m.water],
    ['waterCap', CAP, m.waterCap],
    ['carton0', CARTON, [m.cartons[0], m.cartons[0], m.cartons[0], m.cartons[0], m.cartons[0], m.cartons[0]]],
    ['carton1', CARTON, [m.cartons[1], m.cartons[1], m.cartons[1], m.cartons[1], m.cartons[1], m.cartons[1]]],
    ['milk', MILK, m.milk],
    ...[0, 1, 2].map((i): [string, typeof MILK_LABEL, Material] => [`milkLabel${i}`, MILK_LABEL, m.milkLabel[i]]),
    ...[0, 1, 2].map((i): [string, typeof MILK_CAP, Material] => [`milkCap${i}`, MILK_CAP, m.milkCap[i]]),
    ['multipack', MULTIPACK, m.multipack],
  ]
  return (
    <>
      {parts.map(([key, geometry, material]) => (rows[key] ? <Instanced key={key} geometry={geometry} material={material} items={rows[key]} /> : null))}
    </>
  )
}
