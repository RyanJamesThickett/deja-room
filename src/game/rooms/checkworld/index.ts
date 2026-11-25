import { EYE_HEIGHT } from '../../layout'
import { lazyScene } from '../lazyScene'
import type { RoomDef } from '../types'
import { CHECK_BOUNDS } from './floor'
import { START_Z } from './layout'

/**
 * Secret mode's item check world: every changeable thing from every room,
 * with each of its variants, in rows on one big floor. Not a level: nothing
 * changes here, and it's only reachable from the secret menu.
 */
export const checkWorld: RoomDef = {
  id: 'checkworld',
  name: 'the item check world',
  label: 'Item check world',
  blurb: 'Every changeable thing in the game, with all its variants.',
  items: {},
  changes: 0,
  bounds: CHECK_BOUNDS,
  // just in front of the first room's banner, looking down the rows
  start: { position: [0, EYE_HEIGHT, START_Z + 8], target: [0, 1.2, START_Z - 12] },
  ...lazyScene(() => import('./CheckWorld').then((m) => m.CheckWorldScene)),
}
