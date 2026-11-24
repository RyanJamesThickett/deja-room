import { Box3, BoxGeometry, CircleGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three'
import { once } from '../../outsideLayers'
import type { Vec3 } from '../../mutations'
import { OFFICE, PARTITION, WORKSHOP } from './bounds'
import { OFFICE_DOOR_Z, OFFICE_DOORWAY, OFFICE_WINDOW } from './layout'

/*
 * Shared geometry and the solid wall sections for the office.
 */

/**
 * Takes no space in the layout check and can't be clicked (clicks go to the
 * door in front of it): for someone standing outside, beyond the wall.
 */
function ghost<T extends BufferGeometry>(g: T) {
  g.computeBoundingSphere()
  g.boundingBox = new Box3()
  return g
}

/** The legs of whoever is standing outside the half-raised roller door: work trousers and boots. */
export const visitorParts = once(() => ({
  leg: ghost(new CylinderGeometry(0.075, 0.062, 0.86, 16)),
  boot: ghost(new SphereGeometry(1, 18, 12)),
  ankle: ghost(new CylinderGeometry(0.055, 0.06, 0.14, 14)),
  sole: ghost(new BoxGeometry(0.115, 0.03, 0.3)),
  shadow: ghost(new CircleGeometry(1, 28)),
  trousers: new MeshStandardMaterial({ color: '#2b3240', roughness: 0.92 }),
  leather: new MeshStandardMaterial({ color: '#3b2516', roughness: 0.5 }),
  rubber: new MeshStandardMaterial({ color: '#141414', roughness: 0.9 }),
  shade: new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3, depthWrite: false }),
}))

/** Key board bits: hook, ring, key blade and fob. */
export const keyParts = once(() => ({
  hook: new CylinderGeometry(0.005, 0.005, 0.04, 8),
  ring: new TorusGeometry(0.014, 0.0025, 6, 16),
  blade: new BoxGeometry(0.012, 0.05, 0.003),
  fob: new BoxGeometry(0.026, 0.04, 0.008),
  chrome: new MeshStandardMaterial({ color: '#c9ced6', metalness: 0.9, roughness: 0.25 }),
  brass: new MeshStandardMaterial({ color: '#c9a227', metalness: 0.85, roughness: 0.3 }),
  fobs: ['#d8342c', '#1f6bff', '#111111', '#f2c230', '#2fbf71', '#f4f1e8'].map((color) => new MeshStandardMaterial({ color, roughness: 0.5 })),
}))

export const MUG_COLOURS = ['#f4f1ea', '#d8342c', '#1f4fa0', '#2e5e4e', '#f2c230', '#f4f1ea', '#111111']

/** One solid block of wall: its centre and size, in workshop space. */
export type WallBlock = { at: Vec3; size: Vec3 }

const block = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): WallBlock => ({
  at: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  size: [x1 - x0, y1 - y0, z1 - z0],
})

/**
 * The wall between the workshop and the office, one block per section round
 * the doorway and the reception hatch, and the store room behind the office's
 * back wall, which nobody gets into. Each block is its own solid.
 */
export const OFFICE_WALLS: WallBlock[] = (() => {
  const x0 = WORKSHOP.halfX + 0.004
  const x1 = WORKSHOP.halfX + PARTITION - 0.004
  const h = WORKSHOP.height
  const door = { z0: OFFICE_DOOR_Z - OFFICE_DOORWAY.half, z1: OFFICE_DOOR_Z + OFFICE_DOORWAY.half }
  const hatch = {
    z0: OFFICE_WINDOW.z - OFFICE_WINDOW.width / 2,
    z1: OFFICE_WINDOW.z + OFFICE_WINDOW.width / 2,
    y0: OFFICE_WINDOW.y - OFFICE_WINDOW.height / 2,
    y1: OFFICE_WINDOW.y + OFFICE_WINDOW.height / 2,
  }
  return [
    block(x0, x1, 0, h, OFFICE.z0, door.z0),
    block(x0, x1, OFFICE_DOORWAY.height, h, door.z0, door.z1),
    block(x0, x1, 0, h, door.z1, hatch.z0),
    block(x0, x1, 0, hatch.y0, hatch.z0, hatch.z1),
    block(x0, x1, hatch.y1, h, hatch.z0, hatch.z1),
    block(x0, x1, 0, h, hatch.z1, OFFICE.z1),
    // the store room, behind the office's back wall
    block(x0, OFFICE.x1, 0, h, -WORKSHOP.halfZ, OFFICE.z0 - 0.004),
  ]
})()
