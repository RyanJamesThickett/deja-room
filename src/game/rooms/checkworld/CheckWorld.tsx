import { Environment } from '@react-three/drei'
import { createPortal, useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef, useState } from 'react'
import { DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Scene, type Texture } from 'three'
import { ALL_ROOMS } from '..'
import { itemSign, roomBanner, variantSign } from './labels'
import { type Column, copyRoom, type Failure, layOut, type Near, showNear } from './layout'
import { CHECK_FLOOR, floorTexture } from './floor'

/*
 * The item check world (secret mode): every changeable thing from every room
 * on one big floor, each with all of its variants lined up behind it.
 *
 * Every room is mounted into a scene of its own that's never drawn, so its
 * lights, fog, background and reflections stay out of the way. Once they've
 * all loaded (they suspend like any room, so this sits behind the loading
 * screen), each item is copied out once per variant and placed in rows here.
 * New items and variants turn up by themselves: there's no list to keep.
 *
 * Keeping it quick: once copied, the rooms are unmounted (their animations,
 * and things like the gym's mirror, would otherwise keep running every
 * frame); the copies never move, so their matrices are worked out once; and
 * only what's within VIEW_DISTANCE of the player is drawn.
 */

/** Things further than this (m) from the player aren't drawn. Room banners always are, as landmarks. */
const VIEW_DISTANCE = 28
/** Re-check what's near every this many frames. */
const CULL_EVERY = 6

const SIGN_GEOMETRY = new PlaneGeometry(1, 1)

function sign(texture: Texture, width: number, height: number) {
  const material = new MeshBasicMaterial({ map: texture, side: DoubleSide })
  const mesh = new Mesh(SIGN_GEOMETRY, material)
  mesh.scale.set(width, height, 1)
  return mesh
}

export function CheckWorldScene() {
  // the rooms live here, never rendered, just to be copied from
  const [offscreen] = useState(() => new Scene())
  const shelf = useRef<Group>(null)
  /** Once everything's copied, the rooms are let go. */
  const [copied, setCopied] = useState(false)
  /** Everything that's only drawn when the player is near it: where it is, and how far it reaches. */
  const near = useRef<Near[]>([])
  const frame = useRef(0)

  useLayoutEffect(() => {
    const root = shelf.current
    if (!root) return
    // the rooms below have committed (children's effects run first), so they're all in `offscreen`
    const failures: Failure[] = []
    const rooms = ALL_ROOMS.map((room) => {
      const source = offscreen.getObjectByName(`source:${room.id}`)
      return { room, columns: source ? copyRoom(room, source, failures) : ([] as Column[]) }
    })
    const { banners } = layOut(rooms)
    const textures: Texture[] = []
    const keep = (t: Texture) => {
      textures.push(t)
      return t
    }

    for (const { columns } of rooms)
      for (const column of columns) {
        const head = sign(keep(itemSign(column.label, column.itemId, column.roomLabel, column.extras)), 1.9, 0.6)
        head.position.set(column.front.x, 1.0, column.front.z - 0.3)
        head.rotation.x = -0.35
        root.add(head)
        near.current.push({ object: head, x: head.position.x, z: head.position.z, reach: 1 })
        for (const copy of column.copies) {
          const holder = new Group()
          holder.position.copy(copy.at)
          holder.add(copy.object)
          root.add(holder)
          near.current.push({ object: holder, x: copy.at.x, z: copy.at.z, reach: Math.max(copy.size.x, copy.size.z) / 2 })
          const label = sign(keep(variantSign(copy.variant, copy.text)), 0.9, 0.225)
          // low, in front of it, leaning back so it reads from standing height
          label.position.set(copy.at.x, 0.3, copy.at.z + Math.min(9, copy.size.z) / 2 + 0.35)
          label.rotation.x = -0.9
          root.add(label)
          near.current.push({ object: label, x: label.position.x, z: label.position.z, reach: 0.5 })
        }
      }
    for (const b of banners) {
      const board = sign(keep(roomBanner(b.label, b.count)), 8, 2)
      board.position.set(b.at.x, 2.2, b.at.z)
      root.add(board)
    }
    if (failures.length) console.warn('Item check world: some items could not be shown', failures)

    // nothing here ever moves: work the matrices out once and stop three.js redoing them every frame
    root.updateMatrixWorld(true)
    root.traverse((o) => {
      if (o === root) return
      o.matrixAutoUpdate = false
      o.matrixWorldAutoUpdate = false
    })
    // the rooms have done their job (a tick later, so this commit finishes first)
    const letGo = setTimeout(() => setCopied(true), 0)

    return () => {
      clearTimeout(letGo)
      near.current = []
      root.clear()
      for (const t of textures) t.dispose()
    }
  }, [offscreen])

  useFrame(({ camera }) => {
    frame.current = (frame.current + 1) % CULL_EVERY
    if (frame.current !== 0) return
    showNear(near.current, camera.position.x, camera.position.z, VIEW_DISTANCE)
  })

  return (
    <>
      <color attach="background" args={['#bfe3ff']} />
      <hemisphereLight args={['#eaf6ff', '#8a826f', 1.1]} />
      <directionalLight position={[20, 30, 15]} intensity={1.6} />
      <Environment files="/hdri/lythwood_lounge.hdr" environmentIntensity={0.45} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CHECK_FLOOR.x, 0, CHECK_FLOOR.z]} receiveShadow>
        <planeGeometry args={[CHECK_FLOOR.width, CHECK_FLOOR.depth]} />
        <meshStandardMaterial map={floorTexture(CHECK_FLOOR.width, CHECK_FLOOR.depth)} roughness={0.95} />
      </mesh>
      <group ref={shelf} />
      {!copied &&
        createPortal(
          <>
            {ALL_ROOMS.map((room) => (
              // dispose={null}: the copies share these geometries, materials and textures, so they mustn't be freed on the way out
              <group key={room.id} name={`source:${room.id}`} dispose={null}>
                <room.Scene />
              </group>
            ))}
          </>,
          offscreen,
        )}
    </>
  )
}

