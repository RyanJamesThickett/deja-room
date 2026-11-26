import { STATION_BOUNDS as B } from './bounds'

/*
 * The station's layout, in metres. The concourse runs east-west (x) and
 * north-south (z), with the floor at y = 0. The platforms are off the north
 * end (-z) beyond the ticket barriers; the main doors are in the south wall
 * (+z). The roof is a glass barrel vault springing from the tops of the east
 * and west walls and running north-south, with a glazed end screen over the
 * barriers and a fan window over the doors.
 */

export const HALL = {
  halfX: B.halfX,
  halfZ: B.halfZ,
  /** Height of the side walls, where the vault springs. */
  wallH: 9,
  /** The vault's crown, over the middle of the hall. */
  crown: 16,
}

/** The vault is an arc of this circle in the x-y plane (centre x = 0). */
const rise = HALL.crown - HALL.wallH
const r = (HALL.halfX ** 2 + rise ** 2) / (2 * rise)
export const VAULT = { r, cy: HALL.crown - r }

/** Height of the underside of the roof above a point `x` across the hall. */
export const roofY = (x: number) => VAULT.cy + Math.sqrt(VAULT.r ** 2 - x * x)

/** The red girder across the north end: the barriers below, the departures board and glass screen above. */
export const BEAM = { y0: 4.8, y1: 5.5, z: -B.halfZ, depth: 0.6 }

/** Where the ticket barriers stand, and how far they run each way. */
export const GATES = { z: -10.2, halfSpan: 14.6, pitch: 0.97 }

/** Tracks beyond the barriers, platforms 1 to 4, west to east. */
export const TRACKS = [-9, -3, 3, 9]
/** Each track runs in a pit this wide and deep between the platforms. */
export const PIT = { half: 1.3, depth: 1.1 }
/** The platforms and their canopy run this far north. */
export const PLATFORM_END = -62
/** The underside of the platforms' flat canopy. */
export const CANOPY_Y = 5.5

/** Cast-iron lamp standards round the middle of the concourse. */
export const LAMPS: [number, number][] = [
  [-6.5, -6.5],
  [6.5, -6.5],
  [-6.5, 6.5],
  [6.5, 6.5],
]

/** Doorways in the south wall: centre x, half width, and the height where the arch starts. */
export const DOORWAYS = [
  { x: 0, half: 2.6, spring: 4.4 },
  { x: -7, half: 1.8, spring: 3.4 },
  { x: 7, half: 1.8, spring: 3.4 },
]

/** The round information desk: its radius, and the height of its top. */
export const DESK = { r: 1.25, top: 1.06 }

/** Where the flocks stand, and where in each flock its birds are (x, z, turn, pecking). */
export const FLOCKS: { at: [number, number, number]; birds: [number, number, number, boolean][] }[] = [
  { at: [1.6, 0, -6.6], birds: [[0, 0, 0.4, false], [0.35, 0.2, 2.1, true], [-0.3, 0.35, -1.2, true], [0.1, -0.4, 3.0, false]] },
  { at: [-1.8, 0, 2.2], birds: [[0, 0, 1.2, true], [0.4, -0.2, -0.6, false], [-0.25, -0.3, 2.6, true]] },
  { at: [9.2, 0, 7.2], birds: [[0, 0, -2.2, false], [0.3, 0.3, 0.6, true]] },
]
