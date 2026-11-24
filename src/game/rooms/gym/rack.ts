/*
 * The dumbbell rack's layout: two tiers along local x, handles running front
 * to back. Light pairs on the upper (back) tier, heavy ones on the lower
 * (front) tier, smallest on the left, the way gyms always stack them.
 */

export const RACK_LENGTH = 3.0

export const TIERS = [
  // lower, front: heavy pairs
  { y: 0.42, z: 0.08, radii: [0.075, 0.08, 0.085, 0.09, 0.095, 0.1] },
  // upper, set back: light pairs
  { y: 0.78, z: -0.1, radii: [0.045, 0.05, 0.055, 0.06, 0.065, 0.07, 0.075, 0.08] },
]

export interface Dumbbell {
  x: number
  y: number
  z: number
  r: number
  tier: number
  pair: number
  /** 0 = left one of the pair, 1 = right. */
  side: number
}

const IN_PAIR = 0.02
const BETWEEN_PAIRS = 0.06

/** Every dumbbell on the rack, centred on its tier. `y` is the centre of the heads. */
export const DUMBBELLS: Dumbbell[] = TIERS.flatMap((tier, t) => {
  const width = tier.radii.reduce((sum, r) => sum + 4 * r + IN_PAIR, 0) + BETWEEN_PAIRS * (tier.radii.length - 1)
  let x = -width / 2
  const out: Dumbbell[] = []
  tier.radii.forEach((r, pair) => {
    for (const side of [0, 1]) {
      // hex heads rest on a flat face
      out.push({ x: x + r, y: tier.y + r * 0.866, z: tier.z, r, tier: t, pair, side })
      x += 2 * r + (side === 0 ? IN_PAIR : 0)
    }
    x += BETWEEN_PAIRS
  })
  return out
})

/** Length of one hex head along the handle. */
export const headLength = (r: number) => r * 0.95

/** The dumbbell that turns into cheese, and the pair that goes missing. */
export const CHEESE = { tier: 0, pair: 2, side: 0 }
export const GAP = { tier: 1, pair: 3 }

export const isCheese = (d: Dumbbell) => d.tier === CHEESE.tier && d.pair === CHEESE.pair && d.side === CHEESE.side
export const isGap = (d: Dumbbell) => d.tier === GAP.tier && d.pair === GAP.pair
