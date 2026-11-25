import { EYE_HEIGHT } from '../../layout'
import { lazyScene } from '../lazyScene'
import type { RoomDef } from '../types'
import { MUSEUM_BOUNDS } from './bounds'
import { MUSEUM_ITEMS } from './items'
import { HALL_X } from './plan'

export const museum: RoomDef = {
  id: 'museum',
  name: 'the museum',
  label: 'Museum',
  blurb:
    "Old masters, a giant stone head and a hall of fossils behind velvet rope. The exhibits are supposed to stay put.",
  changes: 12,
  items: MUSEUM_ITEMS,
  bounds: MUSEUM_BOUNDS,
  // just inside the roped-off doorway, looking down the hall past the head
  start: { position: [HALL_X + 4.2, EYE_HEIGHT, 0.3], target: [HALL_X - 2.4, 1.2, -0.7] },
  ...lazyScene(() => import('./MuseumRoom').then((m) => m.MuseumRoom)),
}
