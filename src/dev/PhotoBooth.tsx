import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useLayoutEffect, useState } from 'react'
import type { Mutation, Vec3 } from '../game/mutations'
import { ROOMS } from '../game/rooms'
import { CameraRig, House } from '../game/scene'
import { overlapReport } from './overlaps'

/*
 * Dev-only "photo mode" for checking the room layout without playing.
 *
 *   /?shot=x,y,z,tx,ty,tz               camera position and look-at target
 *   /?shot=start&room=gym                   the room's own first-look view (menu previews)
 *   /?shot=...&swap=plant:bush,books:more   show swap variants
 *   /?shot=...&room=spaceship               pick the room (default: the first)
 *   /?shot=...&move=tv:0                    apply an item's move (by index)
 *   /?shot=...&drop=3                       where the player is dropped after change 3
 *   /?shot=...&overlaps=1                   list things that clip each other or the walls
 *                                           (read it with: msedge --headless --dump-dom)
 *
 * Only reachable from `pnpm dev` (see main.tsx).
 */

/** Writes the overlap report into the page once the room is on the GPU. */
function Overlaps({ room, ready, onReport }: { room: (typeof ROOMS)[number]; ready: boolean; onReport: (lines: string[]) => void }) {
  const get = useThree((s) => s.get)
  useLayoutEffect(() => {
    if (!ready) return
    const house = get().scene.getObjectByName('house')
    if (house) onReport(overlapReport(house, room))
  }, [ready, room, get, onReport])
  return null
}

/** Puts the scene and camera on `window.__scene` / `window.__camera` so they can be poked at from DevTools. */
function Expose() {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useLayoutEffect(() => {
    const w = window as unknown as { __scene: unknown; __camera: unknown }
    w.__scene = scene
    w.__camera = camera
  }, [scene, camera])
  return null
}

function Aim({ from, to }: { from: Vec3; to: Vec3 }) {
  const get = useThree((s) => s.get)
  useLayoutEffect(() => {
    const cam = get().camera
    cam.position.set(...from)
    cam.lookAt(...to)
  }, [from, to, get])
  return null
}

export function PhotoBooth({ params }: { params: URLSearchParams }) {
  const room = ROOMS.find((r) => r.id === params.get('room')) ?? ROOMS[0]
  const n = (params.get('shot') ?? '').split(',').map(Number)
  const fromStart = params.get('shot') === 'start'
  const from: Vec3 = fromStart ? room.start.position : [n[0], n[1], n[2]]
  const to: Vec3 = fromStart ? room.start.target : [n[3], n[4], n[5]]
  const mutations: Mutation[] = (params.get('swap') ?? '')
    .split(',')
    .filter(Boolean)
    .map((s) => {
      const [target, variant] = s.split(':')
      if (!room.items[target]) throw new Error(`unknown item ${target}`)
      return { target, kind: 'swap', variant, description: '' }
    })
  // ?move=tv:0 applies that item's first move
  for (const s of (params.get('move') ?? '').split(',').filter(Boolean)) {
    const [target, index] = s.split(':')
    const move = room.items[target]?.moves?.[Number(index)]
    if (!move) throw new Error(`no move ${s}`)
    mutations.push({ target, kind: 'move', offset: [...move.offset], description: '' })
  }
  const [ready, setReady] = useState(false)
  const [report, setReport] = useState<string[] | null>(null)
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {report && (
        <pre id="overlaps" style={{ position: 'absolute', zIndex: 1, margin: 0, color: '#fff', background: '#000a', fontSize: 11 }}>
          {report.length ? report.join('\n') : 'no overlaps'}
        </pre>
      )}
      <Canvas shadows camera={{ fov: 72, near: 0.03, far: 200 }}>
        <color attach="background" args={['#111111']} />
        <Suspense fallback={null}>
          <House
            room={room}
            mutations={mutations}
            onReady={() => {
              setReady(true)
              // lets a screenshot script wait for the room instead of guessing
              document.body.dataset.ready = '1'
            }}
          />
        </Suspense>
        {params.has('drop') ? (
          ready && <CameraRig token={1} idle={false} room={room} scatterSeed={`photo:${room.id}:${params.get('drop')}`} />
        ) : (
          <Aim from={from} to={to} />
        )}
        {params.has('overlaps') && <Overlaps room={room} ready={ready} onReport={setReport} />}
        <Expose />
      </Canvas>
    </div>
  )
}
