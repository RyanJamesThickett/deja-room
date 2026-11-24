import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Box3,
  BoxGeometry,
  EdgesGeometry,
  Euler,
  Frustum,
  Matrix4,
  Raycaster,
  Vector2,
  Vector3,
  type Group,
  type LineBasicMaterial,
  type LineSegments,
  type Mesh,
  type Object3D,
} from 'three'
import type { ItemId } from './items'
import { CROUCH_HEIGHT, EYE_HEIGHT } from './layout'
import { applyMutations, balanceVariantLights, decoyOf, isVisibleInScene, itemIdOf, visibleParts, tagItems, visibleBounds, type Mutation, type Vec3 } from './mutations'
import { requestLock } from './pointerLock'
import { hashString, mulberry32 } from './rng'
import type { Bounds, RoomDef } from './rooms/types'
import { warmUp } from './warmup'

const PLAYER_RADIUS = 0.25
/** Radians of turn per pixel of mouse movement. */
const LOOK_SPEED = 0.0022
/** Ignore single mouse events bigger than this (px): they're glitches, not hands. */
const MAX_LOOK_STEP = 250
const MAX_PITCH = Math.PI / 2 - 0.01
const GRAVITY = 9.8
/** Take-off speed in m/s; about 72cm of air, enough to clamber onto a table or a crate. */
const JUMP_SPEED = 3.75
/** Anything this low (m) the player just steps up onto without jumping. */
const STEP_UP = 0.25
const GUESS_GRACE_MS = 500
const WALK_SPEED = 2.2

/** Bounding boxes of everything the player can't walk through. */
/** What blocks the player: a bounding box, or for `round` things the ellipse inside it. */
type Solid = Box3 & { round?: boolean }

function solidBoxes(scene: Object3D) {
  const boxes: Solid[] = []
  scene.getObjectByName('house')?.traverse((o) => {
    if (!o.userData.solid) return
    // round things collide as one ellipse; everything else part by part, so
    // the air between a tall rack and a hose on the floor doesn't block
    const parts: Solid[] = o.userData.round ? [visibleBounds(o, new Box3())] : visibleParts(o)
    for (const b of parts) {
      if (b.isEmpty() || b.max.y <= 0.15) continue
      if (o.userData.round) b.round = true
      boxes.push(b)
    }
  })
  return boxes
}

/** Is (x, z) within `margin` of this solid's footprint? */
function nearSolid(b: Solid, x: number, z: number, margin: number) {
  if (!b.round) return x > b.min.x - margin && x < b.max.x + margin && z > b.min.z - margin && z < b.max.z + margin
  const rx = (b.max.x - b.min.x) / 2 + margin
  const rz = (b.max.z - b.min.z) / 2 + margin
  const dx = (x - (b.min.x + b.max.x) / 2) / rx
  const dz = (z - (b.min.z + b.max.z) / 2) / rz
  return dx * dx + dz * dz < 1
}

function clampToRoom(p: Vector3, bounds: Bounds, margin: number) {
  p.x = Math.min(bounds.halfX - margin, Math.max(-bounds.halfX + margin, p.x))
  p.z = Math.min(bounds.halfZ - margin, Math.max(-bounds.halfZ + margin, p.z))
}

/**
 * The current room with its changes applied. Remount (key by room id) when the
 * room changes. Rendering pauses while the room's textures and shaders get onto
 * the GPU, then `onReady` fires with the room id.
 */
export function House({ room, mutations, onReady }: { room: RoomDef; mutations: readonly Mutation[]; onReady: (roomId: string) => void }) {
  const ref = useRef<Group>(null)
  const get = useThree((s) => s.get)
  const ready = useEffectEvent(onReady)
  useLayoutEffect(() => {
    if (!ref.current) return
    tagItems(ref.current, room.items)
    balanceVariantLights(ref.current)
  }, [room])
  useLayoutEffect(() => {
    if (ref.current) applyMutations(ref.current, mutations)
  }, [mutations])
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    let cancelled = false
    const { gl, scene, camera, setFrameloop } = get()
    setFrameloop('never')
    warmUp(gl, scene, camera, root, () => cancelled)
      .catch((e: unknown) => console.warn('Warm-up failed; the first frames may stutter', e))
      .finally(() => {
        if (cancelled) return
        setFrameloop('always')
        ready(room.id)
      })
    return () => {
      cancelled = true
      setFrameloop('always')
    }
  }, [room, get])
  const { Scene } = room
  return (
    <group ref={ref} name="house">
      <Scene />
    </group>
  )
}

/** Grid spacing (m) for finding somewhere to stand. */
const CELL = 0.25
/** Keep this far (m) from walls and furniture when dropping the player somewhere. */
const DROP_MARGIN = PLAYER_RADIUS + 0.25

/**
 * Every spot the player could walk to from the room's start: a flood fill
 * over a grid of the floor, stopping at walls and furniture. Spots behind an
 * inner wall or in a sealed-off corner are never reached, so never chosen.
 */
function reachableSpots(scene: Object3D, bounds: Bounds, from: Vec3): [number, number][] {
  const solids = solidBoxes(scene)
  const nx = Math.floor((bounds.halfX * 2) / CELL)
  const nz = Math.floor((bounds.halfZ * 2) / CELL)
  const at = (i: number, j: number): [number, number] => [-bounds.halfX + (i + 0.5) * CELL, -bounds.halfZ + (j + 0.5) * CELL]
  const open = (i: number, j: number) => {
    const [x, z] = at(i, j)
    return (
      Math.abs(x) < bounds.halfX - DROP_MARGIN &&
      Math.abs(z) < bounds.halfZ - DROP_MARGIN &&
      !solids.some((b) => nearSolid(b, x, z, DROP_MARGIN))
    )
  }
  // walking needs less room than dropping in, so the fill itself uses the player's own radius
  const passable = (i: number, j: number) => {
    const [x, z] = at(i, j)
    return !solids.some((b) => nearSolid(b, x, z, PLAYER_RADIUS))
  }
  const seen = new Uint8Array(nx * nz)
  const si = Math.min(nx - 1, Math.max(0, Math.floor((from[0] + bounds.halfX) / CELL)))
  const sj = Math.min(nz - 1, Math.max(0, Math.floor((from[2] + bounds.halfZ) / CELL)))
  const queue: number[] = [sj * nx + si]
  seen[sj * nx + si] = 1
  const spots: [number, number][] = []
  while (queue.length) {
    const k = queue.pop()!
    const i = k % nx
    const j = (k - i) / nx
    if (open(i, j)) spots.push(at(i, j))
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const ni = i + di
      const nj = j + dj
      if (ni < 0 || nj < 0 || ni >= nx || nj >= nz || seen[nj * nx + ni]) continue
      seen[nj * nx + ni] = 1
      if (passable(ni, nj)) queue.push(nj * nx + ni)
    }
  }
  return spots
}

/**
 * Puts the player in place whenever `token` changes. For the first look
 * they stand at the room's start; after a change they're dropped somewhere
 * different each time (chosen from `scatterSeed`), looking straight down at
 * the floor, so no view is ever the same twice to compare against. While
 * `idle` (title screen) the camera slowly looks around the room on its own.
 */
export function CameraRig({
  token,
  idle,
  room,
  scatterSeed,
}: {
  token: number
  idle: boolean
  room: RoomDef
  /** Set to scatter the player (any string, e.g. seed + round); leave out for the start spot. */
  scatterSeed?: string
}) {
  const get = useThree((s) => s.get)
  const look = useRef(new Vector3())
  const { start } = room
  useLayoutEffect(() => {
    const { camera, scene } = get()
    if (scatterSeed !== undefined) {
      const spots = reachableSpots(scene, room.bounds, room.start.position)
      if (spots.length > 0) {
        const rng = mulberry32(hashString(scatterSeed))
        const [x, z] = spots[Math.floor(rng() * spots.length)]
        camera.position.set(x, EYE_HEIGHT, z)
        // straight down at the floor, facing a random way
        camera.quaternion.setFromEuler(new Euler(-Math.PI / 2 + 0.02, rng() * Math.PI * 2, 0, 'YXZ'))
        return
      }
    }
    camera.position.set(...start.position)
    camera.lookAt(...start.target)
  }, [token, get, room, start, scatterSeed])
  useFrame(({ camera, clock }) => {
    if (!idle) return
    const t = clock.elapsedTime * 0.12
    const [x, y, z] = start.target
    look.current.set(x + Math.sin(t) * 1.6, y + Math.sin(t * 1.7) * 0.2, z + Math.cos(t) * 1.2)
    camera.position.set(...start.position)
    camera.lookAt(look.current)
  })
  return null
}

function useHeldKeys() {
  const keys = useRef(new Set<string>())
  useEffect(() => {
    const held = keys.current
    const down = (e: KeyboardEvent) => held.add(e.code)
    const up = (e: KeyboardEvent) => held.delete(e.code)
    const clear = () => held.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
  return keys
}

/**
 * First-person walking: click to grab the mouse, WASD to move, Esc to let go.
 * Collision is "stay inside the walls and out of the bounding boxes of solid
 * furniture", which is plenty for one room.
 */
export function WalkView({
  enabled,
  frozen = false,
  bounds,
  layoutKey,
  onLockChange,
}: {
  bounds: Bounds
  /** Off releases the mouse (title screen, pause menu). */
  enabled: boolean
  /** Keeps the mouse captured but stops walking (during the "something changed" splash). */
  frozen?: boolean
  layoutKey: string
  onLockChange: (locked: boolean) => void
}) {
  const gl = useThree((s) => s.gl)
  const get = useThree((s) => s.get)
  const keys = useHeldKeys()
  const solids = useRef<Solid[]>([])
  const builtFor = useRef<string | null>(null)
  const forward = useRef(new Vector3())
  const right = useRef(new Vector3())
  const up = useRef(new Vector3(0, 1, 0))
  const eye = useRef(EYE_HEIGHT)
  // Crouch is a toggle on C. Not Ctrl: Ctrl plus a movement key is a browser
  // shortcut (Ctrl+W closes the tab).
  const crouched = useRef(false)
  // feet: height of the player's feet above the floor (standing on something,
  // or mid-jump), vertical speed, and whether they're standing on something
  const hop = useRef({ y: 0, v: 0, grounded: true })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!enabled) return
      if (e.code === 'Space' && document.pointerLockElement === gl.domElement) {
        e.preventDefault() // don't scroll or press a focused button
        if (!e.repeat && hop.current.grounded) {
          hop.current.v = JUMP_SPEED
          hop.current.grounded = false
        }
        return
      }
      if (e.repeat) return
      if (e.code === 'KeyC' && !e.ctrlKey && !e.metaKey) crouched.current = !crouched.current
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, gl])

  useEffect(() => {
    if (!enabled && document.pointerLockElement) document.exitPointerLock()
  }, [enabled])

  // --- mouse look -------------------------------------------------------
  const lockChanged = useEffectEvent(onLockChange)
  useEffect(() => {
    const el = gl.domElement
    const look = new Euler(0, 0, 0, 'YXZ')
    const onClick = () => {
      if (enabled && document.pointerLockElement !== el) requestLock(el).catch(() => {})
    }
    const onChange = () => lockChanged(document.pointerLockElement === el)
    const onMove = (e: MouseEvent) => {
      if (!enabled || document.pointerLockElement !== el) return
      // Chrome occasionally reports one enormous bogus movement while the
      // mouse is captured, which flicks the view somewhere random. Real
      // hand movement never gets close to this in a single event.
      if (Math.abs(e.movementX) > MAX_LOOK_STEP || Math.abs(e.movementY) > MAX_LOOK_STEP) return
      const camera = get().camera
      look.setFromQuaternion(camera.quaternion)
      look.y -= e.movementX * LOOK_SPEED
      look.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, look.x - e.movementY * LOOK_SPEED))
      look.z = 0
      camera.quaternion.setFromEuler(look)
    }
    el.addEventListener('click', onClick)
    document.addEventListener('pointerlockchange', onChange)
    document.addEventListener('mousemove', onMove)
    return () => {
      el.removeEventListener('click', onClick)
      document.removeEventListener('pointerlockchange', onChange)
      document.removeEventListener('mousemove', onMove)
    }
  }, [enabled, gl, get])

  useFrame(({ camera, scene }, dt) => {
    if (!enabled || frozen || document.pointerLockElement !== gl.domElement) return

    if (builtFor.current !== layoutKey) {
      builtFor.current = layoutKey
      solids.current = solidBoxes(scene)
    }

    const held = keys.current
    const ax = (held.has('KeyD') || held.has('ArrowRight') ? 1 : 0) - (held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0)
    const az = (held.has('KeyW') || held.has('ArrowUp') ? 1 : 0) - (held.has('KeyS') || held.has('ArrowDown') ? 1 : 0)
    const pos = camera.position
    const feet = hop.current
    const step = Math.min(dt, 0.05)

    // Something else moved the camera (back to the door, "Show me"): start from the floor there.
    if (Math.abs(pos.y - (feet.y + eye.current)) > 0.25) {
      feet.y = Math.max(0, pos.y - eye.current)
      feet.v = 0
    }

    // Collision has height: low things can be stepped or jumped onto and stood
    // on, things overhead can be walked under, and only the rest blocks.
    const over = (b: Solid, x: number, z: number) => nearSolid(b, x, z, PLAYER_RADIUS)
    const climbable = (b: Box3) => b.max.y <= feet.y + STEP_UP
    const overhead = (b: Box3) => b.min.y > feet.y + eye.current + 0.1
    const blocked = (x: number, z: number) => solids.current.some((b) => over(b, x, z) && !climbable(b) && !overhead(b))
    const groundAt = (x: number, z: number) =>
      solids.current.reduce((g, b) => (over(b, x, z) && climbable(b) ? Math.max(g, b.max.y) : g), 0)

    if (ax !== 0 || az !== 0) {
      const f = forward.current.set(0, 0, -1).applyQuaternion(camera.quaternion)
      f.y = 0
      f.normalize()
      const r = right.current.crossVectors(f, up.current)
      const low = eye.current < EYE_HEIGHT - 0.2
      const pace = low ? 0.5 : held.has('ShiftLeft') || held.has('ShiftRight') ? 1.6 : 1
      const dist = pace * WALK_SPEED * step
      const len = Math.hypot(ax, az)
      const mx = ((f.x * az + r.x * ax) / len) * dist
      const mz = ((f.z * az + r.z * ax) / len) * dist
      // If a change dropped furniture on top of the player, let them walk out.
      const stuck = blocked(pos.x, pos.z)
      if (stuck || !blocked(pos.x + mx, pos.z)) pos.x += mx
      if (stuck || !blocked(pos.x, pos.z + mz)) pos.z += mz
    }
    // eased so it feels like ducking rather than teleporting
    const target = crouched.current ? CROUCH_HEIGHT : EYE_HEIGHT
    eye.current += (target - eye.current) * Math.min(1, dt * 12)

    const ground = groundAt(pos.x, pos.z)
    if (feet.v > 0 || feet.y > ground + 0.001) {
      // in the air: rise, fall, land on whatever is underneath
      feet.v -= GRAVITY * step
      feet.y += feet.v * step
      const ceiling = bounds.height - eye.current - 0.1
      if (feet.y > ceiling) {
        feet.y = ceiling
        feet.v = Math.min(0, feet.v)
      }
      if (feet.y <= ground) {
        feet.y = ground
        feet.v = 0
      }
    } else {
      // stepping up onto something low is quick but not a teleport
      feet.y += (ground - feet.y) * Math.min(1, dt * 18)
      feet.v = 0
    }
    feet.grounded = feet.v === 0 && feet.y <= ground + 0.02
    pos.y = feet.y + eye.current
    clampToRoom(pos, bounds, PLAYER_RADIUS)
  })

  return null
}

// ---------------------------------------------------------------------------

export interface Guess {
  item: ItemId | null
  /** Label of the red herring that was clicked, if it wasn't a real item. */
  decoy: string | null
  point: Vec3
}

/** While the mouse is captured, a click guesses whatever is under the crosshair. */
export function GuessPicker({ enabled, onPick }: { enabled: boolean; onPick: (guess: Guess) => void }) {
  const get = useThree((s) => s.get)
  // Always calls the latest handler without re-running the effect below.
  // (The hunt timer re-renders the app 4x a second; re-subscribing each time
  // used to restart the grace period forever, so no click ever counted.)
  const pick = useEffectEvent(onPick)

  useEffect(() => {
    if (!enabled) return
    const { gl } = get()
    const el = gl.domElement
    const raycaster = new Raycaster()
    const centre = new Vector2(0, 0)
    // A click already on its way when the hunt starts shouldn't count as a guess.
    const armedAt = performance.now() + GUESS_GRACE_MS

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || document.pointerLockElement !== el) return
      if (performance.now() < armedAt) return
      const { camera, scene } = get()
      raycaster.setFromCamera(centre, camera)
      const house = scene.getObjectByName('house')
      if (!house) return
      for (const hit of raycaster.intersectObject(house, true)) {
        if (!isVisibleInScene(hit.object)) continue
        pick({ item: itemIdOf(hit.object), decoy: decoyOf(hit.object), point: [hit.point.x, hit.point.y, hit.point.z] })
        return
      }
    }

    el.addEventListener('pointerdown', onDown)
    return () => el.removeEventListener('pointerdown', onDown)
  }, [enabled, get])

  return null
}

/** Bobbing arrow + outline box over whichever item changed. */
/**
 * Walks the player over to `target` whenever `token` changes: the closest spot
 * in a ring around it that's inside the room, clear of furniture and has a
 * clear view, facing it.
 */
export function ShowMe({ target, token, bounds }: { target: ItemId; token: number; bounds: Bounds }) {
  const get = useThree((s) => s.get)
  useEffect(() => {
    if (token === 0) return
    const { scene, camera } = get()
    const obj = scene.getObjectByName(target)
    const house = scene.getObjectByName('house')
    if (!obj || !house) return
    const box = visibleBounds(obj, new Box3())
    if (box.isEmpty()) return
    const centre = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const solids = solidBoxes(scene)
    const margin = PLAYER_RADIUS + 0.05
    const inside = (p: Vector3) =>
      Math.abs(p.x) < bounds.halfX - margin &&
      Math.abs(p.z) < bounds.halfZ - margin &&
      !solids.some((b) => nearSolid(b, p.x, p.z, margin))
    const ray = new Raycaster()
    const canSee = (p: Vector3) => {
      const to = centre.clone().sub(p)
      const far = to.length()
      ray.set(p, to.normalize())
      ray.far = far
      const hit = ray.intersectObject(house, true).find((h) => isVisibleInScene(h.object))
      return !hit || itemIdOf(hit.object) === target || hit.distance > far - 0.3
    }
    const here = camera.position.clone()
    let best: { p: Vector3; score: number } | null = null
    // try a few distances, nearest first, each at 24 points round the item
    for (const extra of [1.1, 1.6, 2.2]) {
      const dist = Math.max(size.x, size.z) / 2 + extra
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2
        const p = new Vector3(centre.x + Math.cos(a) * dist, EYE_HEIGHT, centre.z + Math.sin(a) * dist)
        if (!inside(p) || !canSee(p)) continue
        const score = p.distanceTo(here)
        if (!best || score < best.score) best = { p, score }
      }
      if (best) break
    }
    if (!best) return
    camera.position.copy(best.p)
    camera.lookAt(centre)
  }, [token, target, bounds, get])
  return null
}

/** What the player is looking at when they write a bug note (hold P). */
export interface Snapshot {
  position: Vec3
  /** Compass heading and pitch, in degrees. */
  yaw: number
  pitch: number
  aiming: { item: ItemId | null; decoy: string | null; point: Vec3 | null; distance: number | null }
  /** Changeable things in view, nearest first. */
  inView: { id: ItemId; distance: number }[]
}

const round2 = (n: number) => Math.round(n * 100) / 100
const vec = (v: Vector3): Vec3 => [round2(v.x), round2(v.y), round2(v.z)]

/** Each time `token` changes, records where the player is and what they can see. */
export function SnapshotProbe({ token, onSnapshot }: { token: number; onSnapshot: (s: Snapshot) => void }) {
  const get = useThree((s) => s.get)
  const report = useEffectEvent(onSnapshot)
  useEffect(() => {
    if (token === 0) return
    const { camera, scene } = get()
    const house = scene.getObjectByName('house')
    const look = new Euler().setFromQuaternion(camera.quaternion, 'YXZ')
    const ray = new Raycaster()
    ray.setFromCamera(new Vector2(0, 0), camera)
    const hit = house ? ray.intersectObject(house, true).find((h) => isVisibleInScene(h.object)) : undefined
    const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse))
    const inView: Snapshot['inView'] = []
    house?.traverse((o) => {
      const id = o.userData.itemId as ItemId | undefined
      if (!id) return
      const b = visibleBounds(o, new Box3())
      if (b.isEmpty() || !frustum.intersectsBox(b)) return
      const distance = round2(b.distanceToPoint(camera.position))
      if (distance < 8) inView.push({ id, distance })
    })
    inView.sort((a, b) => a.distance - b.distance)
    report({
      position: vec(camera.position),
      yaw: Math.round((look.y * 180) / Math.PI),
      pitch: Math.round((look.x * 180) / Math.PI),
      aiming: {
        item: hit ? itemIdOf(hit.object) : null,
        decoy: hit ? decoyOf(hit.object) : null,
        point: hit ? vec(hit.point) : null,
        distance: hit ? round2(hit.distance) : null,
      },
      inView: inView.slice(0, 12),
    })
  }, [token, get])
  return null
}

export function RevealMarker({ target }: { target: ItemId }) {
  const group = useRef<Group>(null)
  const outline = useRef<Mesh>(null)
  const box = useRef(new Box3())
  const size = useRef(new Vector3())
  const centre = useRef(new Vector3())

  useFrame(({ scene, clock }) => {
    const obj = scene.getObjectByName(target)
    if (!obj || !group.current || !outline.current) return
    visibleBounds(obj, box.current)
    if (box.current.isEmpty()) return
    box.current.getSize(size.current)
    box.current.getCenter(centre.current)
    group.current.position.set(centre.current.x, box.current.max.y + 0.25 + Math.sin(clock.elapsedTime * 3) * 0.05, centre.current.z)
    outline.current.position.copy(centre.current)
    outline.current.scale.set(size.current.x + 0.06, size.current.y + 0.06, size.current.z + 0.06)
  })

  return (
    <>
      <mesh ref={outline} renderOrder={10}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffde21" wireframe transparent opacity={0.95} depthTest={false} />
      </mesh>
      <group ref={group}>
        <mesh rotation={[Math.PI, 0, 0]} renderOrder={10}>
          <coneGeometry args={[0.07, 0.16, 16]} />
          <meshBasicMaterial color="#ffde21" depthTest={false} transparent />
        </mesh>
      </group>
    </>
  )
}

const CENTRE = new Vector2(0, 0)

/**
 * Secret-mode overlay: a wireframe box round every changeable object.
 * Cyan = changeable, yellow = under the crosshair, pink = selected.
 */
/** Outline slots per item: one per separate part (see `visibleParts`). */
const PARTS_SHOWN = 8

export function InspectorBoxes({
  ids,
  selected,
  onHover,
}: {
  ids: string[]
  selected: string | null
  onHover: (id: string | null) => void
}) {
  const meshes = useRef<(LineSegments | null)[]>([])
  const edges = useMemo(() => new EdgesGeometry(new BoxGeometry(1, 1, 1)), [])
  const size = useRef(new Vector3())
  const centre = useRef(new Vector3())
  const raycaster = useRef(new Raycaster())
  const hovered = useRef<string | null>(null)
  const frame = useRef(0)
  const parts = useRef<Box3[][]>([])

  useFrame(({ scene, camera, gl }) => {
    let hit: string | null = null
    const house = scene.getObjectByName('house')
    if (house && document.pointerLockElement === gl.domElement) {
      raycaster.current.setFromCamera(CENTRE, camera)
      for (const h of raycaster.current.intersectObject(house, true)) {
        if (!isVisibleInScene(h.object)) continue
        hit = itemIdOf(h.object)
        break
      }
    }
    if (hit !== hovered.current) {
      hovered.current = hit
      onHover(hit)
    }
    // splitting into parts is too much work for every frame; things rarely move here
    if (frame.current++ % 20 === 0) parts.current = ids.map((id) => {
      const obj = house?.getObjectByName(id)
      return obj ? visibleParts(obj) : []
    })
    ids.forEach((id, i) => {
      const state = id === selected ? 'selected' : id === hit ? 'hover' : 'idle'
      for (let k = 0; k < PARTS_SHOWN; k++) {
        const mesh = meshes.current[i * PARTS_SHOWN + k]
        if (!mesh) continue
        const box = parts.current[i]?.[k]
        mesh.visible = !!box
        if (!box) continue
        box.getSize(size.current)
        box.getCenter(centre.current)
        mesh.position.copy(centre.current)
        mesh.scale.set(size.current.x + 0.03, size.current.y + 0.03, size.current.z + 0.03)
        const material = mesh.material as LineBasicMaterial
        material.color.set(state === 'selected' ? '#ff3fa4' : state === 'hover' ? '#ffde21' : '#3dfcff')
        material.opacity = state === 'idle' ? 0.6 : 1
      }
    })
  })

  return (
    <>
      {ids.flatMap((id, i) =>
        Array.from({ length: PARTS_SHOWN }, (_, k) => (
          <lineSegments
            key={`${id}:${k}`}
            geometry={edges}
            ref={(m) => {
              meshes.current[i * PARTS_SHOWN + k] = m
            }}
            renderOrder={20}
            visible={false}
          >
            <lineBasicMaterial transparent depthTest={false} depthWrite={false} />
          </lineSegments>
        )),
      )}
    </>
  )
}

export function MissMarker({ point }: { point: Vec3 }) {
  return (
    <mesh position={point} renderOrder={9}>
      <sphereGeometry args={[0.035, 12, 8]} />
      <meshBasicMaterial color="#ff3131" depthTest={false} transparent opacity={0.9} />
    </mesh>
  )
}
