import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import { Box3, Group, Vector3, type Mesh, type MeshStandardMaterial, type Object3D } from 'three'
import { modelUrl, type ModelId } from './assets'
import type { Vec3 } from './mutations'

/**
 * A Poly Haven model at real-world scale, re-centred so its origin is where
 * you'd expect to hold it:
 *  - `base`: bottom centre (floor and table-top things)
 *  - `wall`: centre of its back face (things hung on a wall, front facing +z)
 */
export function Model({
  id,
  anchor = 'base',
  position,
  rotation,
  scale,
  paint = true,
  castShadow = true,
  adjust,
}: {
  id: ModelId
  anchor?: 'base' | 'wall'
  position?: Vec3
  rotation?: Vec3
  /** Uniform, or per axis (e.g. to match another model's height exactly). */
  scale?: number | Vec3
  /** Whether a recolour mutation tints this model. */
  paint?: boolean
  /** Off for things a light sits inside (the pendant shade would shadow the whole room). */
  castShadow?: boolean
  /**
   * Poses parts of the model after it is centred, e.g. swinging cabinet doors
   * open. Must be a stable (module-level) function.
   */
  adjust?: (root: Object3D) => void
}) {
  const { scene } = useGLTF(modelUrl(id))
  const object = useMemo(() => {
    const inner = scene.clone(true)
    inner.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = castShadow
      mesh.receiveShadow = true
      mesh.userData.paint = paint
      // Picture frames ship a glass pane and metallic artwork; in this lighting both
      // mirror the dark side of the room and hide the picture, so drop the glass and
      // make the artwork matte.
      const material = mesh.material as MeshStandardMaterial
      if (material.name?.endsWith('_glass')) mesh.visible = false
      if (material.name?.endsWith('_artwork')) {
        mesh.material = material.clone()
        ;(mesh.material as MeshStandardMaterial).metalness = 0
      }
    })
    const box = new Box3().setFromObject(inner)
    const centre = box.getCenter(new Vector3())
    if (anchor === 'base') inner.position.set(-centre.x, -box.min.y, -centre.z)
    else inner.position.set(-centre.x, -centre.y, -box.min.z)
    adjust?.(inner)
    const outer = new Group()
    outer.add(inner)
    return outer
  }, [scene, anchor, paint, castShadow, adjust])

  return <primitive object={object} position={position} rotation={rotation} scale={scale} />
}
