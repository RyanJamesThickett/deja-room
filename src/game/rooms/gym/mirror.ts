import { PlaneGeometry, type Object3D } from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { isVisibleInScene } from '../../mutations'

/** Only the mirror's reflection camera sees this layer. */
export const GHOST_LAYER = 1

/** Name of the group holding the figure that only the mirror shows. */
export const ghostName = (item: string) => `${item}-ghost`

/**
 * A real mirror (it draws the room again from behind the glass). Its swaps
 * are empty variant groups it checks each time it draws the reflection:
 * `${item}:missing` leaves the `omit` item out, and `${item}:figure` shows
 * the group named ghostName(item), someone who exists only in the reflection.
 */
export function makeMirror(width: number, height: number, item: string, omit: string) {
  const glass = new Reflector(new PlaneGeometry(width, height), {
    textureWidth: 1024,
    textureHeight: Math.round((1024 * height) / width),
    color: '#c4c9ce',
    clipBias: 0.003,
    multisample: 2,
  })
  const draw = glass.onBeforeRender
  let missing: Object3D | undefined
  let ghost: Object3D | undefined
  let who: Object3D | undefined
  glass.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
    missing ??= scene.getObjectByName(`${item}:missing`)
    ghost ??= scene.getObjectByName(`${item}:figure`)
    const hide = missing && isVisibleInScene(missing) ? scene.getObjectByName(omit) : undefined
    who ??= scene.getObjectByName(ghostName(item))
    if (hide) hide.visible = false
    if (who) {
      who.traverse((o) => o.layers.set(GHOST_LAYER))
      who.visible = !!ghost && isVisibleInScene(ghost)
    }
    glass.getReflectionCamera(camera).layers.enable(GHOST_LAYER)
    draw.call(this, renderer, scene, camera, geometry, material, group)
    if (hide) hide.visible = true
    if (who) who.visible = false
  }
  return glass
}
