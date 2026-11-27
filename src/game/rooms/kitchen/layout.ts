import { DoubleSide, MeshStandardMaterial } from 'three'
import type { Look } from '../../kit'
import { KITCHEN_BOUNDS as B } from './bounds'

/*
 * Where the big pieces of the kitchen go, shared by the scene and its parts.
 *
 * The dining room is through the front wall (+z): the swing door and the
 * pass are both in it. The cooking line is an island suite facing the pass
 * across a 1.2 m aisle, so a chef turns round from the stove to plate up.
 * Behind the line are the prep tables, and behind those the walk-in and the
 * pot shelves on the back wall. Dirty plates come in through the swing door
 * and go straight down the dish run on the right wall.
 */

/** The hatch through to the dining room, in the front wall. */
export const PASS = { x: -1.1, width: 3.2, sill: 0.95, top: 1.95 }

/** Kitchen-side pass counter depth (from the front wall into the room). */
export const PASS_DEPTH = 0.6

/** The island cooking line: appliances 0.9 deep facing +z, with a back upstand behind. */
export const LINE = { front: 1.7, back: 0.8, spine: 0.7, top: 0.9, upstand: 1.05 }

/** Appliance centres and widths along the line, left to right. */
export const FRYER = { x: -2.6, width: 0.6 }
export const GRIDDLE = { x: -1.85, width: 0.9 }
export const RANGE = { x: -0.8, width: 1.2 }
export const COLD = { x: 0.25, width: 0.9 }
export const LINE_LEFT = FRYER.x - FRYER.width / 2
export const LINE_RIGHT = COLD.x + COLD.width / 2

/** Prep tables behind the line. */
export const PREP = { z: -0.95, depth: 0.75, width: 1.6, xs: [-2.05, -0.35], top: 0.9 }

export const SWING_DOOR_X = 2.65
/** The swing door's porthole: its centre's height and radius. */
export const PORTHOLE = { y: 1.5, r: 0.15 }

/** Worktop height of the stainless benches. */
export const BENCH = 0.9

export const STAINLESS: Look = { color: '#c3c9cf', metalness: 0.75, roughness: 0.32 }
export const BRUSHED: Look = { color: '#aeb5bc', metalness: 0.7, roughness: 0.45 }
export const DARK_STEEL: Look = { color: '#3b3f45', metalness: 0.6, roughness: 0.45 }

export const STEEL_MAT = new MeshStandardMaterial({ color: '#c3c9cf', metalness: 0.75, roughness: 0.32 })
export const CAST_IRON = new MeshStandardMaterial({ color: '#1d1e21', metalness: 0.5, roughness: 0.6 })
export const WHITE_CHINA = new MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.25 })
/** The same steel and china, drawn on both sides: for the walls of open pots, pans and bowls, so you can see in. */
export const STEEL_OPEN = new MeshStandardMaterial({ color: '#c3c9cf', metalness: 0.75, roughness: 0.32, side: DoubleSide })
export const CHINA_OPEN = new MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.25, side: DoubleSide })

export const ROOM = B

/** The wire shelving on the back wall that holds the pots. */
export const POT_SHELF = { width: 1.8, depth: 0.5, height: 1.9, levels: [0.15, 0.62, 1.1, 1.58] }
