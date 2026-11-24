import { Quaternion, Vector3 } from 'three'
import type { Vec3 } from '../../mutations'
import { WORKSHOP as B } from './bounds'

/*
 * Where everything in the workshop sits. Cars come in nose first through the
 * two roller doors in the front wall (+z) and point at the workbench along
 * the back wall (-z). The office is through the right-hand wall (+x).
 */

/** Centre of each car on the floor. Both point nose-first at the back wall (-z). */
export const LIFT_BAY = { x: -2.7, z: 0.3 }
export const FLOOR_BAY = { x: 1.6, z: 0.6 }

/** How high the lift holds its car: wheels at chest height, for brake work. */
export const LIFT_RAISE = 1.15
/** The lift posts stand a little ahead of the car's middle, under its centre of gravity. */
export const LIFT_POST_Z = -0.15
export const LIFT_POST_X = 1.5
export const LIFT_TOP = 3.3

/** The long bench along the back wall, between the tool chest and the parts shelf. */
export const BENCH = { x: -1.5, length: 4.2, depth: 0.75, height: 0.92 }
export const BENCH_Z = -B.halfZ + BENCH.depth / 2

/** The roller doors, one per bay, in the front wall. */
export const DOOR = { width: 3.0, height: 3.0 }

/*
 * The street outside (see outsideLayers.ts) is shared between the two doors,
 * with street x 0 at the middle of the lift bay's door, +x to your right
 * looking out, so the other door is at negative x.
 */
export const FLOOR_DOOR_ALONG = LIFT_BAY.x - FLOOR_BAY.x
/** The lift bay's door draws the street from here rightwards, the other door from here leftwards. */
export const STREET_SPLIT = (-DOOR.width / 2 + FLOOR_DOOR_ALONG + DOOR.width / 2) / 2

/** The office: its doorway and the reception window, both in the right wall. */
export const OFFICE_DOOR_Z = -1.6
/** Half the doorway's clear width, and its height. */
export const OFFICE_DOORWAY = { half: 0.44, height: 2.05 }
// its bottom clears the painted band along the wall
export const OFFICE_WINDOW = { z: 1.1, y: 1.66, width: 1.5, height: 0.84 }
/** The office's own window, in the front wall, onto the forecourt. */
export const STREET_WINDOW = { x: 7.0, y: 1.55, width: 1.3, height: 1.05 }

/** Where the office window is along the street, and where its slice of the street meets the floor bay door's. */
export const STREET_WINDOW_ALONG = LIFT_BAY.x - STREET_WINDOW.x
export const OFFICE_SPLIT = (FLOOR_DOOR_ALONG - DOOR.width / 2 + STREET_WINDOW_ALONG + STREET_WINDOW.width / 2) / 2

/*
 * Inside the office (see OFFICE in bounds.ts): the door opens back against
 * the store room wall; the filing cabinet in the far back corner; the desk
 * and its chair along the side wall, under a poster; the kettle corner at the
 * front by the window; the reception counter under the hatch into the
 * workshop, and the waiting chairs past it.
 */
export const CABINET_AT: Vec3 = [7.93, 0, -2.18]
export const DESK = { x: 7.925, z: -0.1, length: 1.5, depth: 0.75, height: 0.74 }
export const CHAIR_AT: Vec3 = [7.12, 0, -0.15]
export const WORKTOP = { x: 8.0, z: 3.22, length: 1.4, depth: 0.6, height: 0.9 }
export const COUNTER = { x: 5.87, z: 1.1, length: 1.6, depth: 0.5, height: 1.1 }

/** Fluorescent battens hang on short chains below the ceiling. */
export const BATTEN = { length: 2.4, y: B.height - 0.35 }

/** Position and rotation that stretch a unit-length rod (along +y) from `a` to `b`. */
export function rodBetween(a: Vec3, b: Vec3) {
  const from = new Vector3(...a)
  const dir = new Vector3(...b).sub(from)
  const length = dir.length()
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize())
  const mid = from.add(dir.multiplyScalar(0.5))
  return { position: mid.toArray() as Vec3, quaternion: q.toArray() as [number, number, number, number], length }
}

/** Yaw and length for a flat bar running from `a` to `b` in the ground plane (along local +x). */
export function barBetween(a: Vec3, b: Vec3) {
  const dx = b[0] - a[0]
  const dz = b[2] - a[2]
  return {
    position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] as Vec3,
    yaw: -Math.atan2(dz, dx),
    length: Math.hypot(dx, dz),
  }
}
