import { CatmullRomCurve3, Vector3 } from 'three'
import type { Vec3 } from '../../mutations'
import { FIRESTATION_BOUNDS as B } from './bounds'

/*
 * Where everything goes, in bay coordinates: +x is the front of the station
 * (the big folding doors), -x the back wall with the door through to the
 * mess, -z the kit wall, +z the equipment wall. The mess lies behind the back
 * wall, and the whole scene is shifted along x by SHIFT so the bay and the
 * mess together sit centred in the room's bounds.
 */

/** The appliance bay's own walls. */
export const ROOM = { halfX: 6, halfZ: B.halfZ, height: B.height }

/** How far the scene is moved along x so that bay + wall + mess fill the bounds. */
export const SHIFT = B.halfX - ROOM.halfX

/** The wall between the bay and the mess (bay face at x1). */
export const PARTITION = { x0: -ROOM.halfX - 0.2, x1: -ROOM.halfX }

/** The engine's group offset. Built nose-first along +x, so it drives straight out of the doors. */
export const ENGINE_X = 0.15

/** Yellow box painted round the engine's parking spot. */
export const BAY_BOX = { x0: -4.15, x1: 4.45, z0: -1.85, z1: 1.85 }

/** Hatched keep-clear zone inside the doors. */
export const KEEP_CLEAR = { x0: 4.8, z0: -2.35, z1: 2.35 }

/** Open kit lockers along the -z wall, one bay per rider. */
export const LOCKERS = { x: -0.62, bays: 8, bay: 0.72, depth: 0.5, height: 2.2, shelf: 1.72, rail: 1.62 }
export const lockerBayX = (i: number) => -((LOCKERS.bays - 1) * LOCKERS.bay) / 2 + i * LOCKERS.bay
export const RIDER_NAMES = ['HARDY', 'BLAKE', 'PATEL', 'KHAN', "O'BRIEN", 'SMITH', 'OKAFOR', 'NOVAK']
/**
 * Which bay each change touches. Each is a different bay, so no change can
 * hide another: the door only ever closes over bay 7, which nothing else uses.
 */
export const BAY_OF = { watching: 4, cone: 6, ghost: 2, tiny: 5, goldfish: 1, backwards: 3, shut: 7 }
/** Bay 0 is the watch manager's: a white helmet. */
export const OFFICER_BAY = 0

/** The fire pole lands at the back of the bay, right by the first locker. */
export const POLE = { x: -4.6, z: -2.8 }
export const MAT_SIZE = 1.4

/** Door to the mess, in the back wall. */
export const MESS_DOOR = { z: 2.2, width: 0.9, height: 2.05 }

/** Four folding leaves across the front of the bay. */
export const BAY_DOOR = { leaves: 4, leaf: 1.1, height: 4.0, glassY: 2.45, glassH: 0.8 }
export const BAY_DOOR_WIDTH = BAY_DOOR.leaves * BAY_DOOR.leaf

/** High-bay lamps between the roof beams. */
export const LAMP_SPOTS: [number, number][] = [-2.6, 0, 2.6].flatMap((x) => [
  [x, -1.7],
  [x, 1.7],
])
export const BEAM_XS = [-3.9, -1.3, 1.3, 3.9]

/** Pane centres along the bay door (local x) for slicing the view outside. */
export const PANE_XS = Array.from({ length: BAY_DOOR.leaves }, (_, i) => (i - (BAY_DOOR.leaves - 1) / 2) * BAY_DOOR.leaf).flatMap((x) => [x - 0.25, x + 0.25])
export const PANE_W = 0.42

/** Equipment wall (+z), from the back: sink, shelf, tool chest, BA sets, hoses, drying rack, extinguishers. */
export const EQUIP = {
  sink: -5.3,
  bucket: -4.55,
  shelf: -3.2,
  chest: -1.85,
  ba: -0.3,
  hoses: 1.9,
  drying: 3.8,
  extinguishers: 5.3,
}

/** The safety-sign feature wall behind the BA sets and hoses. */
export const SIGN_WALL = { x0: -1.5, x1: 3.0, height: 2.5 }


/** Path of the hose that creeps out under the engine's locker, in the locker's space. */
export const SNAKE_CURVE = new CatmullRomCurve3(
  (
    [
      [0, 1.1, 0.03],
      [0.02, 0.85, 0.09],
      [0.08, 0.3, 0.2],
      [0.2, 0.04, 0.42],
      [0.48, 0.04, 0.72],
      [0.12, 0.04, 1.02],
      [-0.12, 0.05, 1.3],
      [0.05, 0.12, 1.52],
      [0.16, 0.3, 1.62],
    ] as Vec3[]
  ).map((p) => new Vector3(...p)),
)

/** Roller shutters down each side of the engine, in engine space: x from, x to, bottom, top. */
export const SHUTTERS: [number, number, number, number][] = [
  [0.15, 1.6, 1.12, 2.92],
  [-1.2, 0.05, 1.12, 2.92],
  [-2.55, -1.3, 1.12, 2.92],
  [-3.75, -2.65, 1.12, 2.92],
]

/** A corkscrew section in the middle of the pole, in the pole's space. */
export function corkscrewCurve(bottom: number, top: number, radius: number, turns: number) {
  const pts: Vector3[] = []
  const n = 120
  for (let i = 0; i <= n; i++) {
    const t = i / n
    // ease the coil in and out so it joins the straight pole smoothly
    const r = radius * Math.sin(Math.PI * t) ** 0.6
    const a = t * turns * Math.PI * 2
    pts.push(new Vector3(Math.cos(a) * r, bottom + (top - bottom) * t, Math.sin(a) * r))
  }
  return new CatmullRomCurve3(pts)
}

// ---------------------------------------------------------------------------
// The drying rack's knotted hose
// ---------------------------------------------------------------------------

/** Which hose on the drying rack gets knotted (the red one). */
export const KNOT_HOSE = 1

/**
 * The front half of a hose hung over the drying rail, with a fat overhand
 * knot tied in it at head height. In the rack's space: the hose hangs at `x`,
 * from the rail at `top` to its coupling at `bottom`, 15.5 cm out from the
 * wall. The knot is an opened-out trefoil standing proud of the other hoses;
 * the strand from the rail drops behind it and feeds in from below.
 */
export function dryKnotCurve(x: number, top: number, bottom: number) {
  const line = 0.155
  const c = { y: 1.65, z: line + 0.17 }
  const s = 0.075
  const sz = 0.09
  const pts: Vector3[] = [
    new Vector3(x, top, line),
    new Vector3(x, top - 0.6, line),
    new Vector3(x, 1.95, line - 0.02),
    new Vector3(x, 1.6, line - 0.02),
    new Vector3(x + 0.01, 1.38, line + 0.01),
    new Vector3(x + 0.05, 1.33, line + 0.08),
    new Vector3(x + 0.08, 1.38, c.z + 0.04),
  ]
  for (let t = Math.PI + 0.35; t <= 3 * Math.PI - 0.35 + 1e-6; t += 0.05) {
    pts.push(new Vector3(x + s * (Math.sin(t) + 2 * Math.sin(2 * t)), c.y + s * (Math.cos(t) - 2 * Math.cos(2 * t)), c.z - sz * Math.sin(3 * t)))
  }
  pts.push(
    new Vector3(x - 0.09, 1.38, c.z - 0.09),
    new Vector3(x - 0.08, 1.25, line + 0.08),
    new Vector3(x - 0.03, 1.05, line + 0.02),
    new Vector3(x, bottom + 0.1, line),
    new Vector3(x, bottom, line),
  )
  return new CatmullRomCurve3(pts)
}

// ---------------------------------------------------------------------------
// The engine's own items, in engine space
// ---------------------------------------------------------------------------

/** The driver's compartment behind the near (+z) front door, hollow so the door can open on it. */
export const CAB = { x0: 3.0, x1: 3.62, y0: 1.16, y1: 2.84, z0: 0.42, side: 1.2 }
/** The lettering and chequer band along the cab sides, which the near front door carries its own slice of. */
export const CAB_LETTERS = { x0: 1.9, x1: 3.7, y0: 1.36, y1: 1.62 }
export const CAB_BAND = { x0: 1.8, x1: 3.75, y0: 1.12, y1: 1.3, tile: 1.2 }
/** The rear locker, hollow behind its shutter: the hose reels live in here. */
export const REAR = { x0: -3.85, x1: -3.15, y0: 1.42, y1: 2.92, half: 0.9 }

// ---------------------------------------------------------------------------
// The mess, behind the bay's back wall
// ---------------------------------------------------------------------------

/** The mess: x from its far wall to the partition, z the same as the bay, and a lower ceiling. */
export const MESS = { x0: -B.halfX - SHIFT, x1: PARTITION.x0, height: 3.0 }
/** Kitchen units along the far wall. */
export const KITCHEN = { depth: 0.62, top: 0.92, z0: -1.4, z1: 3.02 }
/** Wall cupboards over the worktop, either side of the window. */
export const WALL_UNITS: [number, number][] = [
  [-1.4, -0.5],
  [2.05, 3.02],
]
export const WALL_UNIT = { y0: 1.48, y1: 2.18, depth: 0.34 }
/** The window over the sink, onto the drill yard. */
export const MESS_WINDOW = { z0: 0.1, z1: 1.5, y0: 1.2, y1: 2.3 }
export const MESS_SINK_Z = 0.8
export const KETTLE_Z = 1.78
export const TOASTER_Z = -0.22
export const MICROWAVE_Z = -1.0
export const FRIDGE = { z: 3.38, width: 0.66, depth: 0.66, height: 1.85 }
/** The big table the watch eats at, long side along x. */
export const TABLE = { x: -8.6, z: 0.55, length: 2.2, width: 0.95, height: 0.75 }
export const CHAIR_XS = [-9.35, -8.6, -7.85]
/** Chairs either side of the table, pushed in a little. */
export const CHAIR_Z = TABLE.width / 2 + 0.3
/** The chair that's an item: nearest the door, on the +z side. */
export const CHAIR_ITEM = 2
/** Sofa facing the TV at the -z end. */
export const SOFA = { x: -8.7, z: -1.75 }
export const TV = { x: -8.7, unit: { width: 1.5, depth: 0.42, height: 0.5 }, screen: [1.2, 0.7] as [number, number] }
/** Dartboard on the +z wall, clear of the door swinging in. */
export const DARTBOARD = { x: -7.25, y: 1.73 }
