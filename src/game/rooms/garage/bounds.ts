/*
 * The building: the workshop, and the office beside it through the
 * workshop's right-hand wall. Everything in the scene is laid out in
 * workshop space (centred on the workshop floor); the scene shifts it all by
 * WORKSHOP_SHIFT so the whole building is centred, as the room bounds need.
 */

/** The workshop's own walls: inner faces and ceiling height, in metres. Tall, so the lift has headroom. */
export const WORKSHOP = {
  halfX: 5.5,
  halfZ: 4,
  height: 4,
}

/** How thick the block wall between the workshop and the office is. */
export const PARTITION = 0.12

/**
 * The office, in workshop space: from the partition to the building's side
 * wall, and from its back wall (with a store room shut off behind it) to the
 * front of the building. Its suspended ceiling is lower than the workshop's.
 */
export const OFFICE = {
  x0: WORKSHOP.halfX + PARTITION,
  x1: WORKSHOP.halfX + PARTITION + 2.68,
  z0: -2.5,
  z1: WORKSHOP.halfZ,
  ceiling: 2.7,
}

/** Workshop space to room space: the building is centred on the room's origin. */
export const WORKSHOP_SHIFT = -(OFFICE.x1 - WORKSHOP.halfX) / 2

/** Inner faces of the building's outer walls and the ceiling height, in metres. */
export const GARAGE_BOUNDS = {
  halfX: (OFFICE.x1 + WORKSHOP.halfX) / 2,
  halfZ: WORKSHOP.halfZ,
  height: WORKSHOP.height,
}
