import { EYE_HEIGHT } from '../../layout'
import { lazyScene } from '../lazyScene'
import type { RoomDef } from '../types'
import { STATION_BOUNDS } from './bounds'
import { STATION_ITEMS } from './items'

export const station: RoomDef = {
  id: 'station',
  name: 'the train station',
  label: 'Train station',
  blurb:
    "Teatime at the big city station: a clattering departures board, a piano anyone can play, a queue for coffee and pigeons without tickets. Split up, keep an eye on the board, and don't trust the clock.",
  changes: 14,
  huntSeconds: 75,
  studySeconds: 150,
  items: STATION_ITEMS,
  bounds: STATION_BOUNDS,
  // just inside the main doors, looking up the concourse past the clock to the departures board
  start: { position: [0, EYE_HEIGHT, 9.3], target: [0, 3.6, -10] },
  ...lazyScene(() => import('./StationRoom').then((m) => m.StationRoom)),
}
