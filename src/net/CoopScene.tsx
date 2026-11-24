import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { type CSSProperties, type RefObject, useRef } from 'react'
import { DoubleSide, Euler, type Group, Vector3 } from 'three'
import { ShadowFigure } from '../game/figure'
import { EYE_HEIGHT } from '../game/layout'
import { type Player, PLAYER_COLOURS, type Vote } from './protocol'

/*
 * Co-op in the 3D view: everyone else wandering about (the game's faceless
 * figure, with a marker and name tag in their colour), the vote pins, and
 * sending your own position so the others can see you.
 */

type Poses = RefObject<Map<string, { p: [number, number, number]; yaw: number; at: number }>>

/** Sends where you are about ten times a second, and only when you've moved or turned. */
export function PoseSender({ send }: { send: (p: [number, number, number], yaw: number) => void }) {
  const last = useRef({ t: -1, x: 0, y: 0, z: 0, yaw: 0 })
  const look = useRef(new Euler(0, 0, 0, 'YXZ'))
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime
    const l = last.current
    if (t - l.t < 0.1) return
    look.current.setFromQuaternion(camera.quaternion)
    const yaw = look.current.y
    const { x, y, z } = camera.position
    const moved = Math.abs(x - l.x) + Math.abs(y - l.y) + Math.abs(z - l.z) > 0.01 || Math.abs(yaw - l.yaw) > 0.02
    // a heartbeat every couple of seconds, so someone who joins late still sees you standing still
    if (!moved && t - l.t < 2) return
    last.current = { t, x, y, z, yaw }
    send([x, Math.max(0, y - EYE_HEIGHT), z], yaw)
  })
  return null
}

/** Everyone else in the game, where the server last said they were. */
export function Teammates({ players, me, poses }: { players: readonly Player[]; me: string; poses: Poses }) {
  return (
    <>
      {players
        .filter((p) => p.id !== me && p.connected)
        .map((p) => (
          <Teammate key={p.id} player={p} poses={poses} />
        ))}
    </>
  )
}

const TURN = Math.PI * 2

function Teammate({ player, poses }: { player: Player; poses: Poses }) {
  const body = useRef<Group>(null)
  const marker = useRef<Group>(null)
  const target = useRef(new Vector3())
  const placed = useRef(false)
  const colour = PLAYER_COLOURS[player.colour]
  useFrame(({ clock }, dt) => {
    const g = body.current
    const pose = poses.current.get(player.id)
    if (!g) return
    g.visible = pose !== undefined
    if (!pose) return
    target.current.set(...pose.p)
    // glide between the ten-a-second updates instead of jumping
    if (!placed.current) g.position.copy(target.current)
    else g.position.lerp(target.current, 1 - Math.exp(-dt * 12))
    placed.current = true
    // the camera's yaw 0 looks down -z; the figure faces +z
    const want = pose.yaw + Math.PI
    const diff = ((((want - g.rotation.y) % TURN) + TURN * 1.5) % TURN) - Math.PI
    g.rotation.y += diff * (1 - Math.exp(-dt * 10))
    if (marker.current) {
      marker.current.rotation.y = clock.elapsedTime * 1.6
      marker.current.position.y = 2.12 + Math.sin(clock.elapsedTime * 2.2 + player.colour) * 0.04
    }
  })
  return (
    <group ref={body} visible={false}>
      <ShadowFigure height={1.75} phase={player.colour * 1.7} />
      <group ref={marker} position={[0, 2.12, 0]}>
        <mesh>
          <octahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={0.6} roughness={0.4} />
        </mesh>
      </group>
      <Html position={[0, 2.38, 0]} center distanceFactor={9} zIndexRange={[5, 0]}>
        <span className="teammate-tag" style={{ '--player': colour } as CSSProperties}>
          {player.name}
        </span>
      </Html>
    </group>
  )
}

/** A pin for each player's vote, in their colour, stuck where they clicked. */
export function VotePins({ votes, players }: { votes: Record<string, Vote>; players: readonly Player[] }) {
  return (
    <>
      {Object.entries(votes).map(([id, vote]) => {
        const p = players.find((q) => q.id === id)
        return p ? <Pin key={id} point={vote.point} colour={PLAYER_COLOURS[p.colour]} /> : null
      })}
    </>
  )
}

/** A map pin: a ball on a short needle, point down where the vote was cast, gently bobbing. */
function Pin({ point, colour }: { point: [number, number, number]; colour: string }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = point[1] + 0.02 + Math.abs(Math.sin(clock.elapsedTime * 3 + point[0])) * 0.04
  })
  return (
    <group ref={ref} position={point}>
      <mesh position={[0, 0.09, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.012, 0.14, 8]} />
        <meshStandardMaterial color="#d9d9d9" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <sphereGeometry args={[0.055, 18, 12]} />
        <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={0.35} roughness={0.35} />
      </mesh>
      {/* a ring on the surface, so you can see where it's stuck from further away */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.075, 24]} />
        <meshBasicMaterial color={colour} side={DoubleSide} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
