import { EYE_HEIGHT } from '../../layout'
import type { RoomDef } from '../types'
import { GYM_BOUNDS } from './bounds'
import { GymRoom } from './GymRoom'
import { GYM_ITEMS } from './items'

export const gym: RoomDef = {
  id: 'gym',
  name: 'the gym',
  label: 'Gym',
  blurb:
    "Treadmills, free weights and one great big mirror. Easy to lose track of what's real and what's a reflection.",
  changes: 10,
  items: GYM_ITEMS,
  bounds: GYM_BOUNDS,
  // just inside the front door, reception on your right, looking across to the mirror wall
  start: { position: [2.4, EYE_HEIGHT, 2.6], target: [-1.2, 1.1, -2.2] },
  Scene: GymRoom,
}
