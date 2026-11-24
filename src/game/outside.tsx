import { useEffect, useMemo } from 'react'
import { layerGeometry, layerOrder, MASK_ORDER, type OutsideLayer, type Slice } from './outsideLayers'

/**
 * The world outside one opening: its layers, standing behind the wall at
 * their own depths. Built in the opening's space, wall at z = 0 and the room
 * towards +z, with the floor `y` below the origin. They only show through a
 * real hole in the wall, so the wall must have one here. `pass`: see
 * layerOrder.
 */
export function Outside({
  layers,
  y = 0,
  pass = 0,
  along = 0,
  from = -Infinity,
  to = Infinity,
}: { layers: OutsideLayer[]; y?: number; pass?: number } & Slice) {
  const geometries = useMemo(() => layers.map((l) => layerGeometry(l, -y, { along, from, to })), [layers, y, along, from, to])
  useEffect(() => () => geometries.forEach((g) => g?.dispose()), [geometries])
  return (
    <>
      {layers.map((l, i) => {
        const geometry = geometries[i]
        if (!geometry) return null
        return (
          <mesh key={i} geometry={geometry} renderOrder={layerOrder(l, pass)}>
            <meshBasicMaterial map={l.map} toneMapped={false} transparent depthWrite={false} />
          </mesh>
        )
      })}
    </>
  )
}

/**
 * Keeps a later pass's world out of this opening: an invisible pane in it
 * that only writes depth. `size` and `position` of the opening, in its space.
 */
export function OutsideMask({ size, position }: { size: [number, number]; position: [number, number, number] }) {
  return (
    <mesh position={position} renderOrder={MASK_ORDER} raycast={() => null}>
      <planeGeometry args={size} />
      <meshBasicMaterial colorWrite={false} transparent />
    </mesh>
  )
}
