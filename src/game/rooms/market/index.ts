import { EYE_HEIGHT } from '../../layout'
import { lazyScene } from '../lazyScene'
import type { RoomDef } from '../types'
import { MARKET_BOUNDS } from './bounds'
import { MARKET_ITEMS } from './items'

export const market: RoomDef = {
  id: 'market',
  name: 'the city market',
  label: 'City market',
  blurb:
    "Sunday market in the big city square: fish on ice, cheese, records, a busker and far too many pigeons. Split up, keep your eyes open, and don't trust the statue.",
  changes: 14,
  huntSeconds: 75,
  studySeconds: 150,
  items: MARKET_ITEMS,
  bounds: MARKET_BOUNDS,
  // at the east end of the square, looking along it past the fountain to the food van
  start: { position: [13.2, EYE_HEIGHT, 0.8], target: [0, 1.5, 0] },
  ...lazyScene(() => import('./MarketRoom').then((m) => m.MarketRoom)),
}
