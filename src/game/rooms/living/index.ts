import { EYE_HEIGHT } from '../../layout'
import type { RoomDef } from '../types'
import { LIVING_BOUNDS } from './bounds'
import { LIVING_ITEMS } from './items'
import { LivingRoom } from './LivingRoom'

export const livingRoom: RoomDef = {
  id: 'living',
  name: 'the living room',
  label: 'Living room',
  blurb:
    "A perfectly ordinary living room. Sofa, telly, a bookshelf nobody reads and a rug that's seen things. Get comfy. It won't stay this way.",
  changes: 9,
  items: LIVING_ITEMS,
  bounds: LIVING_BOUNDS,
  // just inside the door, looking across the room
  start: { position: [2.6, EYE_HEIGHT, -1.3], target: [-1.2, 1.05, 0.6] },
  Scene: LivingRoom,
}
