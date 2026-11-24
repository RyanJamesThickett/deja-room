import type { Vec3 } from '../../mutations'
import { MUSEUM_BOUNDS } from './bounds'

/*
 * The museum is two galleries in a row along x. The painting gallery (the
 * hall) is on the right and is laid out in its own coordinates, centred on
 * HALL_X; the natural history gallery is through its left-hand doorway,
 * centred on NH_X. The wall between them is PARTY thick.
 */

/** The painting gallery's own half-sizes. */
export const HALL = { halfX: 5, halfZ: MUSEUM_BOUNDS.halfZ, height: MUSEUM_BOUNDS.height }

/** Thickness of the wall between the two galleries (the depth of the doorway). */
export const PARTY = 0.3

/** Where the painting gallery's centre is, along x: its right-hand wall is the museum's. */
export const HALL_X = MUSEUM_BOUNDS.halfX - HALL.halfX

/** The natural history gallery: what is left of the museum past the party wall. */
export const NH = { halfX: (MUSEUM_BOUNDS.halfX * 2 - HALL.halfX * 2 - PARTY) / 2, halfZ: MUSEUM_BOUNDS.halfZ, height: MUSEUM_BOUNDS.height }

/** Where the natural history gallery's centre is, along x. */
export const NH_X = -MUSEUM_BOUNDS.halfX + NH.halfX

const B = HALL

/*
 * Where everything goes. The hall runs left to right (x), with a doorway in
 * the middle of each end wall. Visitors walk in from the right-hand door.
 * Back wall (-z): the papered wall with the star painting, the bench facing
 * it. Front wall (+z): smaller paintings with sculptures between them.
 * The colossal head stands roped off in the left half; the table case sits
 * in the right half, clear of the walkway from door to door.
 */

/** Doorways in the end walls (and the natural history gallery's far wall): width and height of the opening. */
export const DOOR = { width: 1.8, height: 2.7 }

/** Canvas sizes (without the frame), in metres. */
export const CANVAS = {
  landscape: [1.8, 1.2],
  portrait: [0.8, 1.0],
  stillLife: [0.9, 0.75],
  seascape: [1.3, 0.85],
  abstract: [1.1, 0.75],
  river: [0.7, 0.5],
  lady: [0.55, 0.7],
  botanical: [0.5, 0.7],
  pasture: [0.8, 0.56],
} as const satisfies Record<string, readonly [number, number]>

/** How far a frame sticks out past the canvas on each side. */
export const FRAME = 0.09

/** Depth of a frame off the wall; the canvas sits a little behind its front. */
export const FRAME_DEPTH = 0.06

/** The colossal head's platform and the rope barrier around it. */
export const COLOSSUS = { at: [-2.4, 0, 0.6] as Vec3, platform: 1.5, ropeHalf: 1.2 }

/** Stanchions round the colossus, in order round the loop (relative to its centre). */
export const STANCHIONS: [number, number][] = (() => {
  const h = COLOSSUS.ropeHalf
  return [
    [-h, -h],
    [0, -h],
    [h, -h],
    [h, 0],
    [h, h],
    [0, h],
    [-h, h],
    [-h, 0],
  ]
})()

/** Which rope comes unhooked: the one facing the entrance, from the front corner. */
export const LOOSE_ROPE = 3

export const BENCH = { at: [0, 0, -1.6] as Vec3, length: 1.6, depth: 0.5 }

export const PLINTH = { size: 0.45, height: 1.0 }

/** Painted eyes on the portrait canvas, as fractions of its width and height from the top left. */
export const PORTRAIT_EYES: [number, number][] = [
  [0.425, 0.33],
  [0.565, 0.33],
]

export const WALLS = {
  back: -B.halfZ,
  front: B.halfZ,
  left: -B.halfX,
  right: B.halfX,
}
