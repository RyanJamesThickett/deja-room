import { RepeatWrapping, type Texture } from 'three'
import { gridTexture } from './labels'

/** Bounds of the item check world: long enough for every room's rows, with room to spare. */
export const CHECK_BOUNDS = { halfX: 58, halfZ: 262, height: 12 }

/** The floor: a bit beyond the bounds all round. */
export const CHECK_FLOOR = { x: 0, z: 0, width: CHECK_BOUNDS.halfX * 2 + 20, depth: CHECK_BOUNDS.halfZ * 2 + 20 }

/** The floor's grid, one square per metre (made once). */
export const floorTexture = (() => {
  let texture: Texture | undefined
  return (repeatX: number, repeatY: number) => {
    if (!texture) {
      texture = gridTexture()
      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.repeat.set(repeatX, repeatY)
    }
    return texture
  }
})()
