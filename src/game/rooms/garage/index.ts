import { EYE_HEIGHT } from '../../layout'
import type { RoomDef } from '../types'
import { GARAGE_BOUNDS, WORKSHOP_SHIFT } from './bounds'
import { GarageRoom } from './GarageRoom'
import { GARAGE_ITEMS } from './items'

/** Room space from workshop space (see bounds.ts). */
const X = (x: number) => x + WORKSHOP_SHIFT

export const garage: RoomDef = {
  id: 'garage',
  name: "the mechanic's garage",
  label: 'Garage',
  blurb:
    "A car up on the lift, another with its bonnet open and an office drowning in paperwork. The last room, and everything's coming loose.",
  changes: 12,
  items: GARAGE_ITEMS,
  bounds: GARAGE_BOUNDS,
  // just out of the office door, looking across the yellow car's open bonnet to the lift
  start: { position: [X(4.75), EYE_HEIGHT, -1.6], target: [X(-1.2), 1.1, 0.1] },
  Scene: GarageRoom,
}
