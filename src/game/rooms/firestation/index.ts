import { EYE_HEIGHT } from '../../layout'
import { lazyScene } from '../lazyScene'
import type { RoomDef } from '../types'
import { FIRESTATION_BOUNDS } from './bounds'
import { FIRESTATION_ITEMS } from './items'
import { SHIFT } from './layout'

/** Bay coordinates (what layout.ts uses) to room coordinates. */
const at = (x: number, y: number, z: number): [number, number, number] => [x + SHIFT, y, z]

export const fireStation: RoomDef = {
  id: 'firestation',
  name: 'the fire station',
  label: 'Fire station',
  blurb:
    "A fire engine in the bay, a pole down from upstairs and the crew's mess room out back. Always ready to roll, and so are the changes.",
  changes: 12,
  items: FIRESTATION_ITEMS,
  bounds: FIRESTATION_BOUNDS,
  // just inside the door from the mess, looking past the back of the engine towards the bay doors
  start: { position: at(-5.3, EYE_HEIGHT, 2.2), target: at(2, 1.1, -2.4) },
  ...lazyScene(() => import('./FireStationRoom').then((m) => m.FireStationRoom)),
}
