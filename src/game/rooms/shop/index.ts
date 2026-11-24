import { EYE_HEIGHT } from '../../layout'
import type { RoomDef } from '../types'
import { SHOP_BOUNDS } from './bounds'
import { SHOP_ITEMS } from './items'
import { ShopRoom } from './ShopRoom'

export const cornerShop: RoomDef = {
  id: 'shop',
  name: 'the corner shop',
  label: 'Corner shop',
  blurb:
    "Your local corner shop: crisps, fizzy drinks, a fridge humming in the corner and a till that's seen better days. Stock has a habit of wandering.",
  changes: 10,
  items: SHOP_ITEMS,
  bounds: SHOP_BOUNDS,
  // just inside the shop door, the counter on your right, looking down the aisles
  start: { position: [1.6, EYE_HEIGHT, 2.9], target: [-0.6, 1.1, -1.6] },
  Scene: ShopRoom,
}
