/*
 * The ship runs along x: the bridge at the -x end, a short corridor through
 * two bulkheads, and the engine room at the +x end. The game clamps the
 * player to the outer hull; the bulkheads are solid, so the corridor is the
 * only way between the two rooms.
 */

/** Inner faces of the outer hull and the ceiling height, in metres. */
export const SPACESHIP_BOUNDS = {
  halfX: 7.75,
  halfZ: 2.6,
  height: 2.6,
}

/** Each room's own size: the bridge and the engine room are the same. */
export const ROOM = { halfX: 3.2, halfZ: 2.6, height: SPACESHIP_BOUNDS.height }

/** Thickness of a bulkhead between a room and the corridor. */
export const BULKHEAD = 0.15

/** The corridor, centred on the origin; doors are cut in each bulkhead. */
export const CORRIDOR = { halfX: 1.2, halfZ: 0.85, door: 0.6, doorHeight: 2.1 }

/** Centre of the bridge and of the engine room along the ship. */
export const BRIDGE_X = -(CORRIDOR.halfX + BULKHEAD + ROOM.halfX)
export const ENGINE_X = -BRIDGE_X
