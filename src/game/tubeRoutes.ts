import { Vector3 } from 'three'
import type { Vec3 } from './mutations'

/* Paths the jelly tube can take through the living room (world coordinates). */

/** Out of the left wall, up and across the ceiling, into the back wall. */
const ROUTE_WALL: Vec3[] = [
  [-3.45, 0.95, 2.3],
  [-3.05, 0.95, 2.3],
  [-2.75, 1.5, 2.05],
  [-3.1, 2.15, 1.55],
  [-2.5, 2.55, 1.0],
  [-1.3, 2.6, 0.2],
  [-0.2, 2.6, -0.9],
  [0.55, 2.6, -2.3],
  [0.55, 2.62, -2.95],
]

/** Same route, but it dives into a loop-de-loop halfway across the ceiling. */
const ROUTE_LOOP: Vec3[] = (() => {
  const before = ROUTE_WALL.slice(0, 5)
  const after = ROUTE_WALL.slice(6)
  // loop in the vertical plane along the direction of travel, shifted sideways
  // a little as it goes round so the tube doesn't pass through itself
  const dir = new Vector3(1.1, 0, -1.1).normalize()
  const side = new Vector3(dir.z, 0, -dir.x)
  const centre = new Vector3(-0.75, 1.95, -0.35)
  const r = 0.55
  const loop: Vec3[] = []
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const p = centre
      .clone()
      .addScaledVector(dir, Math.sin(a) * r)
      .addScaledVector(new Vector3(0, 1, 0), Math.cos(a) * r)
      .addScaledVector(side, (i / 16 - 0.5) * 0.3)
    loop.push([p.x, p.y, p.z])
  }
  return [...before, [-1.3, 2.55, 0.2], ...loop, [-0.2, 2.55, -0.9], ...after]
})()

/** Corkscrews up out of the floorboards by the bookshelf instead. */
const ROUTE_FLOOR: Vec3[] = (() => {
  const pts: Vec3[] = [
    [-2.1, -0.05, -1.6],
    [-2.1, 0.25, -1.6],
  ]
  for (let i = 1; i <= 20; i++) {
    const a = (i / 20) * Math.PI * 4
    pts.push([-2.1 + Math.sin(a) * 0.3, 0.25 + (i / 20) * 1.9, -1.6 + Math.cos(a) * 0.3 - 0.3])
  }
  pts.push([-1.4, 2.55, -1.6], [-0.2, 2.6, -2.0], [0.55, 2.6, -2.5], [0.55, 2.62, -2.95])
  return pts
})()

export const TUBE_ROUTES = { wall: ROUTE_WALL, loop: ROUTE_LOOP, floor: ROUTE_FLOOR }
