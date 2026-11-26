import { fireStation } from './firestation'
import { garage } from './garage'
import { gym } from './gym'
import { kitchen } from './kitchen'
import { livingRoom } from './living'
import { market } from './market'
import { museum } from './museum'
import { cornerShop } from './shop'
import { spaceship } from './spaceship'
import { station } from './station'
import type { RoomDef } from './types'

/** The rooms you go through, in order. */
export const ROOMS: RoomDef[] = [livingRoom, cornerShop, spaceship, gym, kitchen, museum, fireStation, garage]

/** Bigger levels made for co-op teams; only reachable from the co-op lobby. */
export const COOP_ROOMS: RoomDef[] = [market, station]

/** Every room, for looking one up by id (multiplayer, photo mode). */
export const ALL_ROOMS: RoomDef[] = [...ROOMS, ...COOP_ROOMS]
