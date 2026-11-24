import type { Vec3 } from '../../mutations'
import { GYM_BOUNDS as B } from './bounds'

/*
 * Where everything stands, shared by the scene and the TV's bird's-eye view.
 *
 * Front wall (+z): the shop window onto the street, with the cardio row in
 * front of it facing out, and the glass door at the right-hand end.
 * Reception is just inside the door against the right wall, the receptionist
 * facing across the entrance. Back wall (-z): the mirror, with the dumbbell
 * rack in front of it and the benches facing it; kettlebells and the plate
 * tree past the end of the mirror. Right wall: squat rack in the back
 * corner, then the cable machine, then reception. Left wall: the papered
 * feature wall with posters, towels and the water cooler.
 */

export const TREADMILL_XS = [-3.7, -2.75, -1.8]
export const TREADMILL_Z = 2.15
export const BIKE_AT: Vec3 = [-0.8, 0, 2.5]
export const ROWER_AT: Vec3 = [0.5, 0, 1.9]
export const TV_AT: Vec3 = [-2.75, 2.5, 3.1]

export const WINDOW = { x: -1.35, y: 1.25, width: 5.9, height: 1.9 }
export const DOOR_X = 2.6
/** The doorway the glass door fills: a notch in the front wall, open to the street. */
export const DOORWAY = { width: 0.94, height: 2.1 }
/** Where the door is along the street outside, which has x 0 at the middle of the window. */
export const DOOR_ALONG = WINDOW.x - DOOR_X

export const MIRROR = { x: -1.6, y: 1.35, width: 5.4, height: 2.0 }
export const RACK_AT: Vec3 = [-2.25, 0, -B.halfZ + 0.33]
export const BENCH_AT: Vec3 = [-2.9, 0, -1.65]
export const FLAT_BENCH_AT: Vec3 = [-1.5, 0, -1.65]
export const KETTLEBELLS_AT: Vec3 = [1.35, 0, -B.halfZ + 0.3]
export const PLATE_TREE_AT: Vec3 = [2.5, 0, -B.halfZ + 0.4]

export const POWER_RACK_AT: Vec3 = [B.halfX - 0.75, 0, -2.2]
export const CABLE_AT: Vec3 = [B.halfX - 0.42, 0, 0]
export const DESK_AT: Vec3 = [B.halfX - 0.9, 0, 2.25]

export const COOLER_AT: Vec3 = [-B.halfX + 0.2, 0, 0.25]
export const BALL_AT: Vec3 = [-1.0, 0, -0.2]
/** Where the figure in the mirror stands: open floor nobody can see. */
export const FIGURE_AT: Vec3 = [0.2, 0, -1.4]

/** Footprints (centre x, centre z, width along x, depth along z) for the TV's floor plan. */
export const FLOOR_PLAN: [number, number, number, number][] = [
  ...TREADMILL_XS.map((x): [number, number, number, number] => [x, TREADMILL_Z, 0.8, 1.9]),
  [BIKE_AT[0], BIKE_AT[2], 0.55, 1.1],
  [ROWER_AT[0], ROWER_AT[2], 0.56, 2.4],
  [RACK_AT[0], RACK_AT[2], 3.0, 0.6],
  [BENCH_AT[0], BENCH_AT[2], 0.32, 1.25],
  [FLAT_BENCH_AT[0], FLAT_BENCH_AT[2], 0.32, 1.25],
  [KETTLEBELLS_AT[0], KETTLEBELLS_AT[2], 1.45, 0.25],
  [PLATE_TREE_AT[0], PLATE_TREE_AT[2], 0.5, 0.5],
  [POWER_RACK_AT[0], POWER_RACK_AT[2], 1.3, 1.25],
  [CABLE_AT[0], CABLE_AT[2], 0.75, 1.6],
  [DESK_AT[0], DESK_AT[2], 0.6, 1.5],
  [COOLER_AT[0], COOLER_AT[2], 0.32, 0.32],
  [-2.8, 0.1, 1.6, 0.8],
]
