import { EYE_HEIGHT } from '../../layout'
import type { RoomDef } from '../types'
import { BRIDGE_X, SPACESHIP_BOUNDS } from './bounds'
import { SPACESHIP_ITEMS } from './items'
import { SpaceshipRoom } from './SpaceshipRoom'

export const spaceship: RoomDef = {
  id: 'spaceship',
  name: 'the spaceship',
  label: 'Spaceship',
  blurb:
    "A cargo ship's bridge, a long corridor and a rumbling engine room, a very long way from anywhere. Space does funny things to furniture.",
  changes: 11,
  items: SPACESHIP_ITEMS,
  bounds: SPACESHIP_BOUNDS,
  // at the back of the bridge, looking out of the viewport
  start: { position: [BRIDGE_X + 0.4, EYE_HEIGHT, 2.0], target: [BRIDGE_X, 1.25, -2.6] },
  Scene: SpaceshipRoom,
}
