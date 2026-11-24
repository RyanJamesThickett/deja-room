/** Dimensions of a shelving unit, built along local x with its (first) face towards +z. */
export interface ShelfSpec {
  width: number
  depth: number
  height: number
  /** Heights of the shelf boards. */
  levels: number[]
  /** Double-sided aisle unit: stocked on both the +z and -z faces. */
  double?: boolean
}

/** Single-sided bay that stands against a wall. */
export const WALL_BAY: ShelfSpec = { width: 2.6, depth: 0.4, height: 1.9, levels: [0.12, 0.5, 0.88, 1.26, 1.64] }

/** Double-sided aisle unit (gondola). */
export const AISLE_UNIT: ShelfSpec = { width: 1.9, depth: 0.8, height: 1.5, levels: [0.12, 0.5, 0.88, 1.26], double: true }

/** Shelf positions along one face of a unit: x, shelf height, and where the front row sits. */
export function slots(spec: ShelfSpec, spacing: number) {
  const n = Math.floor((spec.width - 0.12) / spacing)
  const start = -((n - 1) * spacing) / 2
  return spec.levels.map((y) => ({ y: y + 0.0125, xs: Array.from({ length: n }, (_, i) => start + i * spacing) }))
}

/** Front-row depth on a face: just back from the shelf edge. */
export function rowZ(spec: ShelfSpec, back: number) {
  return spec.depth / 2 - back
}
