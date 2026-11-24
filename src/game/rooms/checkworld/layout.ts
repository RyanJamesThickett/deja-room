import { Box3, type Light, type Object3D, Vector3 } from 'three'
import { visibleBounds } from '../../mutations'
import type { RoomDef } from '../types'

/*
 * The item check world's layout: every changeable thing from every room,
 * copied out of its room once per variant, lined up in labelled rows.
 *
 * Each room gets a band: a banner, then rows of columns. A column is one item,
 * its variants one behind another (default nearest), with a sign in front of
 * each. Walkways between columns and rows are wide enough to wander down.
 */

/** How wide a row gets before wrapping, in metres. */
export const ROW_WIDTH = 90
/** Where the first band starts (the player starts just in front of it, looking down -z). */
export const START_Z = 250
const WALKWAY = 1.8
const BETWEEN_VARIANTS = 1.3
const BETWEEN_ROWS = 3.5
const BETWEEN_ROOMS = 7
/** Anything bigger than this (in plan) is laid out as if it were this big, so one giant can't stretch a whole row. */
const MAX_FOOTPRINT = 9

export interface Copy {
  variant: string
  /** What the game says when this variant appears ("" for the default). */
  text: string
  object: Object3D
  size: Vector3
  /** Where it ends up: the middle of its footprint, on the floor. */
  at: Vector3
}

export interface Column {
  roomId: string
  roomLabel: string
  itemId: string
  label: string
  /** The item's other kinds of change, for its sign: "turns · resize · recolour · 2 moves". */
  extras: string
  copies: Copy[]
  /** Front middle of the column, where its sign goes. */
  front: Vector3
}

export interface Banner {
  roomId: string
  label: string
  count: string
  at: Vector3
}

export interface Failure {
  roomId: string
  itemId: string
  reason: string
}

const box = new Box3()
const centre = new Vector3()

/** One item as it looks with `variant` showing (or as it is, if it has no variants), without its lights, at the origin. */
function copyOf(source: Object3D, roomId: string, itemId: string, variant: string, hasVariants: boolean): Object3D {
  const copy = source.clone(true)
  copy.position.set(0, 0, 0)
  copy.rotation.set(0, 0, 0)
  copy.scale.set(1, 1, 1)
  if (hasVariants)
    copy.traverse((o) => {
      if (o.name.startsWith(`${itemId}:`)) o.visible = o.name === `${itemId}:${variant}`
    })
  // a few hundred copies' worth of lights would never compile; the check world has its own light
  const lights: Object3D[] = []
  copy.traverse((o) => {
    if ((o as Light).isLight) lights.push(o)
  })
  for (const l of lights) l.removeFromParent()
  // what a bug note (hold P) reports when aiming at it
  copy.userData = { itemId: `${roomId}/${itemId}:${variant}` }
  copy.name = `check:${roomId}/${itemId}:${variant}`
  return copy
}

function extrasOf(def: RoomDef['items'][string]) {
  const parts: string[] = []
  if (def.turns?.length) parts.push(def.turns.length === 1 ? 'turns' : `${def.turns.length} turns`)
  if (def.scale) parts.push(def.scale === 'both' ? 'grows / shrinks' : def.scale === 'up' ? 'grows' : 'shrinks')
  if (def.recolor) parts.push('recolour')
  if (def.moves?.length) parts.push(def.moves.length === 1 ? '1 move' : `${def.moves.length} moves`)
  return parts.join(' · ')
}

/** Copies every item (and each of its variants) out of a room's mounted scene. */
export function copyRoom(room: RoomDef, root: Object3D, failures: Failure[]): Column[] {
  const byId = new Map<string, Object3D>()
  root.traverse((o) => {
    const id = o.userData.itemId as string | undefined
    if (id && !byId.has(id)) byId.set(id, o)
  })
  const columns: Column[] = []
  for (const [itemId, def] of Object.entries(room.items)) {
    const source = byId.get(itemId)
    if (!source) {
      failures.push({ roomId: room.id, itemId, reason: 'not found in the scene' })
      continue
    }
    const swaps = def.swaps ?? []
    const variants = [{ variant: 'default', text: '' }, ...swaps.map((s) => ({ variant: s.variant, text: s.text }))]
    const copies: Copy[] = []
    for (const { variant, text } of variants) {
      try {
        const object = copyOf(source, room.id, itemId, variant, swaps.length > 0)
        visibleBounds(object, box)
        if (box.isEmpty()) {
          failures.push({ roomId: room.id, itemId, reason: `${variant}: nothing visible` })
          continue
        }
        const size = box.getSize(new Vector3())
        box.getCenter(centre)
        // stand it on the floor, centred on its own footprint
        object.position.set(-centre.x, -box.min.y, -centre.z)
        copies.push({ variant, text, object, size, at: new Vector3() })
      } catch (e) {
        failures.push({ roomId: room.id, itemId, reason: `${variant}: ${(e as Error).message}` })
      }
    }
    if (copies.length) columns.push({ roomId: room.id, roomLabel: room.label, itemId, label: def.label, extras: extrasOf(def), copies, front: new Vector3() })
  }
  return columns
}

/**
 * Places every column: rooms one after another down -z, each a banner then
 * rows of columns that wrap at ROW_WIDTH. Sets each copy's `at` and each
 * column's `front`; returns the banners and how far back it all goes.
 */
export function layOut(rooms: { room: RoomDef; columns: Column[] }[]) {
  const banners: Banner[] = []
  let z = START_Z
  for (const { room, columns } of rooms) {
    if (!columns.length) continue
    const variants = columns.reduce((n, c) => n + c.copies.length, 0)
    banners.push({ roomId: room.id, label: room.label, count: `${columns.length} items · ${variants} looks`, at: new Vector3(-ROW_WIDTH / 2 + 6, 0, z - 2) })
    z -= 5
    let x = -ROW_WIDTH / 2
    let rowDepth = 0
    for (const column of columns) {
      const width = Math.min(MAX_FOOTPRINT, Math.max(1.2, ...column.copies.map((c) => c.size.x)))
      const depth = column.copies.reduce((d, c) => d + Math.min(MAX_FOOTPRINT, c.size.z) + BETWEEN_VARIANTS, 1.2)
      if (x + width > ROW_WIDTH / 2 && x > -ROW_WIDTH / 2) {
        // wrap to a new row behind this one
        z -= rowDepth + BETWEEN_ROWS
        x = -ROW_WIDTH / 2
        rowDepth = 0
      }
      const cx = x + width / 2
      column.front.set(cx, 0, z)
      // the sign takes the first metre, then each variant one behind another
      let cz = z - 1.2
      for (const copy of column.copies) {
        const d = Math.min(MAX_FOOTPRINT, copy.size.z)
        copy.at.set(cx, 0, cz - d / 2)
        cz -= d + BETWEEN_VARIANTS
      }
      rowDepth = Math.max(rowDepth, depth)
      x += width + WALKWAY
    }
    z -= rowDepth + BETWEEN_ROOMS
  }
  return { banners, endZ: z }
}

/** Something only drawn when the player is near it: where it stands and how far it reaches from there. */
export interface Near {
  object: Object3D
  x: number
  z: number
  reach: number
}

/** Shows what's within `distance` (plus its own reach) of the player at x, z, and hides the rest. */
export function showNear(things: readonly Near[], x: number, z: number, distance: number) {
  for (const n of things) {
    const dx = n.x - x
    const dz = n.z - z
    const reach = distance + n.reach
    n.object.visible = dx * dx + dz * dz < reach * reach
  }
}
