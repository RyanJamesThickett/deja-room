import { EYE_HEIGHT } from '../../layout'
import type { RoomDef } from '../types'
import { KITCHEN_BOUNDS } from './bounds'
import { KitchenRoom } from './KitchenRoom'
import { KITCHEN_ITEMS } from './items'

export const kitchen: RoomDef = {
  id: 'kitchen',
  name: 'the restaurant kitchen',
  label: 'Kitchen',
  blurb:
    "A restaurant kitchen mid-service: a hot range, a pass full of tickets and a walk-in that's colder than it should be. Something's off, and it isn't the fish.",
  changes: 11,
  items: KITCHEN_ITEMS,
  bounds: KITCHEN_BOUNDS,
  // just in through the swing door from the dining room, the pass on your left, looking across the line to the prep tables
  start: { position: [2.6, EYE_HEIGHT, 2.7], target: [-1.4, 1.1, -0.9] },
  Scene: KitchenRoom,
}
