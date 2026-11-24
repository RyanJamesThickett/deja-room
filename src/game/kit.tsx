import { RoundedBox } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { Object3D, Vector3, type BufferGeometry, type InstancedMesh, type Material, type RectAreaLight } from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import type { Surface } from './assets'
import type { Vec3 } from './mutations'
import { wallpaperTexture, type WallpaperKind } from './wallpaper'

/*
 * Building blocks every room uses. A changeable object is an <Item>: a group
 * named after its id in the room's catalogue. Swappable items have child
 * <Variant>s named `${id}:default` and `${id}:${variant}`.
 */

export const PI = Math.PI

RectAreaLightUniformsLib.init()

/** A changeable, clickable thing. `id` must be a key of the room's item catalogue. */
export function Item({ id, position, rotation, children }: { id: string; position: Vec3; rotation?: Vec3; children: ReactNode }) {
  return (
    <group name={id} position={position} rotation={rotation} userData={{ itemId: id }}>
      {children}
    </group>
  )
}

/**
 * A red herring: something that never changes but can be clicked as a guess
 * (a wrong one, costing a try) just like a real item. Anything a player could
 * bump into should be `solid`, so walking through it doesn't give it away.
 */
export function Decoy({
  label,
  position,
  rotation,
  solid = false,
  round = false,
  children,
}: {
  label: string
  position: Vec3
  rotation?: Vec3
  solid?: boolean
  /** Round in plan: collides as the ellipse inside its box. */
  round?: boolean
  children: ReactNode
}) {
  return (
    <group position={position} rotation={rotation} userData={{ decoy: label, solid, round }}>
      {children}
    </group>
  )
}

/** One look of a swappable item. Only `default` starts visible. */
export function Variant({ of, name, children }: { of: string; name: string; children: ReactNode }) {
  return (
    <group name={`${of}:${name}`} visible={name === 'default'}>
      {children}
    </group>
  )
}

export type Look = {
  color: string
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
  surface?: Surface
}

export function Mat({ color, roughness = 0.8, metalness = 0, emissive = '#000000', emissiveIntensity = 1, surface }: Look) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      {...surface}
    />
  )
}

/** Rounded box with shadows; `paint` marks it as recolourable. */
export function Block({
  size,
  position,
  rotation,
  radius = 0.006,
  paint,
  ...look
}: Look & { size: Vec3; position?: Vec3; rotation?: Vec3; radius?: number; paint?: boolean }) {
  return (
    <RoundedBox
      args={size}
      radius={Math.min(radius, Math.min(...size) / 2 - 0.0005)}
      smoothness={3}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      userData={{ paint }}
    >
      <Mat {...look} />
    </RoundedBox>
  )
}

/** Soft light from a window or panel, shining into the room (no shadows). */
export function PanelLight({
  position,
  size,
  facing,
  color = '#ffb3d1',
  intensity = 6,
}: {
  position: Vec3
  size: [number, number]
  /** A point the light shines towards, in the same space as `position`. */
  facing: Vec3
  color?: string
  intensity?: number
}) {
  const ref = useRef<RectAreaLight>(null)
  useLayoutEffect(() => {
    const light = ref.current
    if (!light) return
    // `facing` is in the same space as `position`; lookAt wants world space
    const target = new Vector3(...facing)
    if (light.parent) {
      light.parent.updateWorldMatrix(true, false)
      light.parent.localToWorld(target)
    }
    light.lookAt(target)
  }, [facing])
  return <rectAreaLight ref={ref} position={position} width={size[0]} height={size[1]} intensity={intensity} color={color} />
}


export type Placement = { at: Vec3; rot?: Vec3; scale?: Vec3 }

/**
 * Many copies of one mesh in a single draw call (tins, bottles, crisps...).
 * Pass a memoised `items` array.
 */
export function Instanced({
  geometry,
  material,
  items,
  castShadow = false,
}: {
  geometry: BufferGeometry
  material: Material | Material[]
  items: Placement[]
  castShadow?: boolean
}) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new Object3D()
    items.forEach((p, i) => {
      o.position.set(...p.at)
      o.rotation.set(...(p.rot ?? [0, 0, 0]))
      o.scale.set(...(p.scale ?? [1, 1, 1]))
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingBox()
    m.computeBoundingSphere()
  }, [items])
  if (items.length === 0) return null
  return <instancedMesh key={items.length} ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow />
}

/**
 * A papered feature wall: a patterned panel laid just in front of a wall.
 * `position` is the centre of the panel on the wall's face, `rotation` turns
 * it to face into the room (like a wall-hung item). Keep it off walls with
 * windows, or it will paper over them.
 */
export function Wallpaper({
  kind,
  width,
  height,
  position,
  rotation,
}: {
  kind: WallpaperKind
  width: number
  height: number
  position: Vec3
  rotation?: Vec3
}) {
  const map = useMemo(() => wallpaperTexture(kind, width, height), [kind, width, height])
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.002]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={map} roughness={0.85} />
      </mesh>
    </group>
  )
}
