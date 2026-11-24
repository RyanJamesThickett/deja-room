import { useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three'
import { DINING, diningRoom } from './diningLayout'
import { glowTexture } from './textures'

const noClick = () => null

/** Soft glows round the lights, as one cloud of sprites per size. */
function Halos({ size }: { size: 'small' | 'big' }) {
  const { halos } = diningRoom()
  const geometry = useMemo(() => {
    const list = halos.filter((h) => (size === 'small' ? h.size < 0.5 : h.size >= 0.5))
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(list.flatMap((h) => h.at)), 3))
    const c = new Color()
    g.setAttribute('color', new BufferAttribute(new Float32Array(list.flatMap((h) => c.set(h.colour).toArray())), 3))
    return g
  }, [halos, size])
  const map = useMemo(() => glowTexture(), [])
  return (
    <points geometry={geometry} raycast={noClick}>
      <pointsMaterial
        map={map}
        size={size === 'small' ? 0.22 : 0.9}
        vertexColors
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
        opacity={size === 'small' ? 0.9 : 0.55}
      />
    </points>
  )
}

/**
 * The restaurant beyond the front wall, in front-wall space (the dining room
 * at +z). Only the pass and the swing door's porthole look into it.
 */
export function DiningRoom() {
  const { solid, glow } = diningRoom()
  return (
    <group>
      <mesh geometry={solid} raycast={noClick}>
        <meshStandardMaterial vertexColors roughness={0.75} />
      </mesh>
      <mesh geometry={glow} raycast={noClick}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
      <Halos size="small" />
      <Halos size="big" />
      {/* warm, low light for the diners; far enough out that it barely reaches the kitchen */}
      <pointLight position={[0, 2.5, DINING.depth * 0.62]} intensity={9} distance={6.5} decay={1.4} color="#ffc68a" />
    </group>
  )
}
