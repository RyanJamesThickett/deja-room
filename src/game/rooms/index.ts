import { fireStation } from './firestation'
import { garage } from './garage'
import { gym } from './gym'
import { kitchen } from './kitchen'
import { livingRoom } from './living'
import { museum } from './museum'
import { cornerShop } from './shop'
import { spaceship } from './spaceship'
import type { RoomDef } from './types'

/** The rooms you go through, in order. */
export const ROOMS: RoomDef[] = [livingRoom, cornerShop, spaceship, gym, kitchen, museum, fireStation, garage]
