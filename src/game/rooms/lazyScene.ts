import { type ComponentType, lazy } from 'react'

/**
 * A room's 3D scene, downloaded only when it's needed. Rooms are most of the
 * game's code, so the menu loads without any of them, and each room arrives
 * as its own file when it's played (or a little before, via `preload`).
 *
 *   ...lazyScene(() => import('./GymRoom').then((m) => m.GymRoom))
 *
 * gives a RoomDef its `Scene` and `preload`. The scene suspends while its
 * code downloads, like a model does while it fetches.
 */
export function lazyScene(load: () => Promise<ComponentType>) {
  let pending: Promise<{ default: ComponentType }> | undefined
  const get = () =>
    (pending ??= load().then(
      (Scene) => ({ default: Scene }),
      (e: unknown) => {
        // let a later try fetch it again (a blip on the connection, say)
        pending = undefined
        throw e
      },
    ))
  return { Scene: lazy(get), preload: () => void get().catch(() => {}) }
}
