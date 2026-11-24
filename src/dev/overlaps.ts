import { Box3, Vector3, type Object3D } from 'three'
import { visibleBounds } from '../game/mutations'
import type { RoomDef } from '../game/rooms/types'

/*
 * Dev-only layout check: which items and red herrings intersect each other or
 * poke through the walls, in the room's default state and with each swap
 * variant and move applied. Things resting on each other only touch, so
 * every box is shrunk by a couple of centimetres first.
 */

const SLACK = 0.025

/**
 * Things whose bounding box says nothing useful: the jelly tube winds round
 * the whole room, the "outside" window variant is a landscape, the strip
 * lights span the ceiling, and the fish swim about.
 */
const IGNORE = new Set(['jelly-tube', 'window', 'lights', 'fish'])

type Thing = { name: string; obj: Object3D }

/** Items and red herrings, plus the room's own solid walls (inner walls, bulkheads). */
function things(root: Object3D) {
  const list: Thing[] = []
  const walls: Thing[] = []
  const walk = (o: Object3D) => {
    if (o.userData.itemId) {
      if (!IGNORE.has(o.userData.itemId as string)) list.push({ name: o.userData.itemId as string, obj: o })
    } else if (o.userData.decoy) list.push({ name: `decoy "${o.userData.decoy as string}"`, obj: o })
    else if (o.userData.solid) walls.push({ name: 'a solid wall', obj: o })
    else o.children.forEach(walk)
  }
  walk(root)
  return { list, walls }
}

function box(o: Object3D) {
  const b = visibleBounds(o, new Box3())
  if (b.isEmpty()) return b
  return b.expandByScalar(-SLACK)
}

function overlap(a: Box3, b: Box3) {
  if (a.isEmpty() || b.isEmpty() || !a.intersectsBox(b)) return null
  const size = a.clone().intersect(b).getSize(new Vector3())
  return `${size.x.toFixed(2)}×${size.y.toFixed(2)}×${size.z.toFixed(2)}m`
}

function outside(b: Box3, room: RoomDef) {
  const { halfX, halfZ, height } = room.bounds
  const out: string[] = []
  if (b.isEmpty()) return out
  if (b.min.x < -halfX) out.push(`${(-halfX - b.min.x).toFixed(2)}m through the left wall`)
  if (b.max.x > halfX) out.push(`${(b.max.x - halfX).toFixed(2)}m through the right wall`)
  if (b.min.z < -halfZ) out.push(`${(-halfZ - b.min.z).toFixed(2)}m through the back wall`)
  if (b.max.z > halfZ) out.push(`${(b.max.z - halfZ).toFixed(2)}m through the front wall`)
  if (b.max.y > height) out.push(`${(b.max.y - height).toFixed(2)}m through the ceiling`)
  if (b.min.y < 0) out.push(`${(-b.min.y).toFixed(2)}m through the floor`)
  return out
}

/** Lines describing every clash, with `state` saying which variant or move was applied. */
function check(list: Thing[], walls: Thing[], room: RoomDef, only: Thing | null, state: string) {
  const lines: string[] = []
  const boxes = new Map(list.map((t) => [t, box(t.obj)]))
  const wallBoxes = walls.map((w) => box(w.obj))
  for (const a of list) {
    if (only && a !== only) continue
    for (const why of outside(boxes.get(a)!, room)) lines.push(`${state}${a.name}: ${why}`)
    for (const w of wallBoxes) {
      const o = overlap(boxes.get(a)!, w)
      if (o) lines.push(`${state}${a.name} goes into a solid wall by ${o}`)
    }
    for (const b of list) {
      if (a === b || (!only && list.indexOf(b) < list.indexOf(a))) continue
      const o = overlap(boxes.get(a)!, boxes.get(b)!)
      if (o) lines.push(`${state}${a.name} overlaps ${b.name} by ${o}`)
    }
  }
  return lines
}

export function overlapReport(root: Object3D, room: RoomDef) {
  root.updateWorldMatrix(true, true)
  const { list, walls } = things(root)
  const lines = check(list, walls, room, null, '')
  for (const t of list) {
    const def = room.items[t.name]
    if (!def) continue
    // each swap variant on its own
    for (const s of def.swaps ?? []) {
      const groups: Object3D[] = []
      t.obj.traverse((c) => {
        if (c.name.startsWith(`${t.name}:`)) groups.push(c)
      })
      const was = groups.map((g) => g.visible)
      groups.forEach((g) => (g.visible = g.name === `${t.name}:${s.variant}`))
      lines.push(...check(list, walls, room, t, `[${t.name}:${s.variant}] `))
      groups.forEach((g, i) => (g.visible = was[i]))
    }
    // each move on its own
    for (const [i, m] of (def.moves ?? []).entries()) {
      const start = t.obj.position.clone()
      t.obj.position.add(new Vector3(...m.offset).applyQuaternion(t.obj.quaternion))
      t.obj.updateWorldMatrix(false, true)
      lines.push(...check(list, walls, room, t, `[${t.name} move ${i}] `))
      t.obj.position.copy(start)
      t.obj.updateWorldMatrix(false, true)
    }
  }
  return lines
}
