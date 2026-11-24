import { useLayoutEffect, useRef } from 'react'
import { Color, Object3D, type BufferGeometry, type InstancedMesh, type Material } from 'three'
import type { Placement } from '../../kit'

/**
 * Like the kit's <Instanced>, but every copy has its own colour (cobbles,
 * record sleeves, bunting flags, flower heads). Pass memoised or module-level
 * `items` and `colours` of the same length.
 */
export function Tinted({
  geometry,
  material,
  items,
  colours,
  castShadow = false,
}: {
  geometry: BufferGeometry
  material: Material
  items: Placement[]
  colours: string[]
  castShadow?: boolean
}) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new Object3D()
    const c = new Color()
    items.forEach((p, i) => {
      o.position.set(...p.at)
      o.rotation.set(...(p.rot ?? [0, 0, 0]))
      o.scale.set(...(p.scale ?? [1, 1, 1]))
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      m.setColorAt(i, c.set(colours[i % colours.length]))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingBox()
    m.computeBoundingSphere()
  }, [items, colours])
  if (items.length === 0) return null
  return <instancedMesh key={items.length} ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow />
}
