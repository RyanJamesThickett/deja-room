import { useMemo } from 'react'
import { BackSide, MeshStandardMaterial, SphereGeometry } from 'three'
import { Block, Instanced, PI, type Placement } from '../../kit'
import type { Vec3 } from '../../mutations'
import { WireShelf } from './back'
import { coldPanelTexture } from './textures'

/*
 * Inside the walk-in fridge, behind the back wall: a cold white room of
 * insulated panels with wire shelving round it, stacked with crates of veg,
 * boxes and tubs, under a bulkhead light, furred with frost. Only seen
 * through the door when it's left open a crack. Built in the door's space:
 * the doorway at z = 0, the walk-in going back to -z.
 */

const WALKIN = { halfW: 1.1, depth: 2.2, height: 2.4 }
const SHELF = { width: 1.6, depth: 0.5, height: 1.9, levels: [0.15, 0.6, 1.05, 1.5] }
// the back wall's shelves, then the left wall's (what you see through the gap) and the right's
const BACK: Vec3 = [0, 0, -WALKIN.depth + SHELF.depth / 2 + 0.03]
const LEFT: Vec3 = [-WALKIN.halfW + SHELF.depth / 2 + 0.03, 0, -WALKIN.depth / 2 - 0.1]
const RIGHT: Vec3 = [WALKIN.halfW - SHELF.depth / 2 - 0.03, 0, -WALKIN.depth / 2 - 0.1]

const noClick = () => null

const PRODUCE = new SphereGeometry(1, 10, 8)
const LETTUCE = new MeshStandardMaterial({ color: '#6fae3a', roughness: 0.8 })
const TOMATO = new MeshStandardMaterial({ color: '#d8321e', roughness: 0.35 })
const ORANGE = new MeshStandardMaterial({ color: '#f08a1a', roughness: 0.6 })
const FROST = new MeshStandardMaterial({ color: '#f4fbff', roughness: 0.9, emissive: '#9fc8e8', emissiveIntensity: 0.15 })

/** A plastic crate, open at the top. */
function Crate({ at, colour, size = [0.4, 0.2, 0.3] }: { at: Vec3; colour: string; size?: Vec3 }) {
  const [w, h, d] = size
  const t = 0.012
  return (
    <group position={at}>
      <Block size={[w, t, d]} position={[0, t / 2, 0]} color={colour} roughness={0.6} radius={0.004} />
      {[-1, 1].map((s) => (
        <Block key={`x${s}`} size={[t, h, d]} position={[(s * (w - t)) / 2, h / 2, 0]} color={colour} roughness={0.6} radius={0.004} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={`z${s}`} size={[w, h, t]} position={[0, h / 2, (s * (d - t)) / 2]} color={colour} roughness={0.6} radius={0.004} />
      ))}
    </group>
  )
}

/** Spheres heaped in a crate `size` big at `at`, `r` across. */
function heap(at: Vec3, size: [number, number], r: number, seed: number): Placement[] {
  const out: Placement[] = []
  const nx = Math.floor(size[0] / (r * 2))
  const nz = Math.floor(size[1] / (r * 2))
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const k = i * 7 + j * 3 + seed
      out.push({
        at: [at[0] - size[0] / 2 + r + i * r * 2, at[1] + r * (0.9 + ((k % 3) * 0.15)), at[2] - size[1] / 2 + r + j * r * 2],
        scale: [r, r * 0.9, r],
      })
    }
  }
  return out
}

const L = SHELF.levels
/** Lettuces, tomatoes and oranges heaped in the crates. */
const LETTUCES = [...heap([-0.45, L[1] + 0.02, BACK[2]], [0.38, 0.28], 0.07, 1), ...heap([LEFT[0], L[2] + 0.02, LEFT[2] - 0.45], [0.28, 0.38], 0.07, 2)]
const TOMATOES = [...heap([0.05, L[1] + 0.02, BACK[2]], [0.38, 0.28], 0.035, 3), ...heap([LEFT[0], L[1] + 0.02, LEFT[2] + 0.1], [0.28, 0.38], 0.035, 4)]
const ORANGES = [...heap([0.5, L[2] + 0.02, BACK[2]], [0.38, 0.28], 0.045, 5), ...heap([RIGHT[0], L[1] + 0.02, RIGHT[2] - 0.3], [0.28, 0.38], 0.045, 6)]

export function WalkInRoom() {
  const { halfW, depth, height } = WALKIN
  const panels = useMemo(() => coldPanelTexture(), [])
  const shelf = SHELF
  const back = BACK
  const left = LEFT
  const right = RIGHT
  return (
    <group>
      {/* the room: walls, floor and ceiling, seen from inside */}
      <mesh position={[0, height / 2, -depth / 2]} raycast={noClick}>
        <boxGeometry args={[halfW * 2, height, depth]} />
        <meshStandardMaterial attach="material-0" map={panels} side={BackSide} roughness={0.6} />
        <meshStandardMaterial attach="material-1" map={panels} side={BackSide} roughness={0.6} />
        <meshStandardMaterial attach="material-2" color="#e9eff3" side={BackSide} roughness={0.7} />
        <meshStandardMaterial attach="material-3" color="#7d868c" side={BackSide} roughness={0.85} />
        <meshStandardMaterial attach="material-4" map={panels} side={BackSide} roughness={0.6} />
        <meshStandardMaterial attach="material-5" map={panels} side={BackSide} roughness={0.6} />
      </mesh>
      {/* the thickness of the wall round the doorway */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, 2.0, 0.12]} position={[s * 0.49, 1.0, -0.06]} color="#d8dee2" roughness={0.5} radius={0.004} />
      ))}
      {/* the bulkhead light, and a strip of plastic curtain beside the door */}
      <Block size={[0.5, 0.06, 0.14]} position={[0, height - 0.04, -depth / 2]} color="#f2faff" emissive="#e6f4ff" emissiveIntensity={1.6} radius={0.02} />
      {[-0.35, -0.22].map((x) => (
        <mesh key={x} position={[x, 1.1, -0.15]} raycast={noClick}>
          <planeGeometry args={[0.12, 1.9]} />
          <meshStandardMaterial color="#cfe6f2" transparent opacity={0.35} roughness={0.1} />
        </mesh>
      ))}

      <group position={back}>
        <WireShelf {...shelf} />
      </group>
      <group position={left} rotation={[0, PI / 2, 0]}>
        <WireShelf {...shelf} />
      </group>
      <group position={right} rotation={[0, -PI / 2, 0]}>
        <WireShelf {...shelf} />
      </group>

      {/* back wall: crates of veg below, boxes and tubs above */}
      <Crate at={[-0.45, shelf.levels[1] + 0.006, back[2]]} colour="#2f6bb5" />
      <Crate at={[0.05, shelf.levels[1] + 0.006, back[2]]} colour="#3a8a3a" />
      <Crate at={[0.5, shelf.levels[2] + 0.006, back[2]]} colour="#2f6bb5" />
      {[-0.5, 0.0, 0.5].map((x, i) => (
        <Block key={x} size={[0.4, 0.3, 0.36]} position={[x, shelf.levels[0] + 0.156, back[2]]} color={i === 1 ? '#c9a46a' : '#b8925a'} roughness={0.9} radius={0.006} />
      ))}
      {[-0.55, -0.2, 0.15].map((x) => (
        <Block key={x} size={[0.3, 0.16, 0.36]} position={[x, shelf.levels[2] + 0.086, back[2]]} color="#f2efe6" roughness={0.3} radius={0.01} />
      ))}
      {[-0.5, -0.32, -0.14, 0.04].map((x) => (
        <Block key={x} size={[0.08, 0.2, 0.08]} position={[x, shelf.levels[3] + 0.106, back[2]]} color="#f6f6f2" roughness={0.5} radius={0.008} />
      ))}
      <Block size={[0.5, 0.25, 0.36]} position={[0.45, shelf.levels[3] + 0.131, back[2]]} color="#b8925a" roughness={0.9} radius={0.006} />

      {/* left wall: more crates, a stack of trays wrapped in film, a sack */}
      <group position={left} rotation={[0, PI / 2, 0]}>
        <Crate at={[-0.45, shelf.levels[2] + 0.006, 0]} colour="#3a8a3a" />
        <Crate at={[0.1, shelf.levels[1] + 0.006, 0]} colour="#c8302c" />
        {[0, 1, 2, 3].map((k) => (
          <Block key={k} size={[0.5, 0.06, 0.32]} position={[0.45, shelf.levels[2] + 0.04 + k * 0.065, 0]} color="#dfe6ea" metalness={0.5} roughness={0.25} radius={0.006} />
        ))}
        <Block size={[0.45, 0.28, 0.36]} position={[-0.4, shelf.levels[0] + 0.146, 0]} color="#b8925a" roughness={0.9} radius={0.006} />
        <mesh position={[0.3, shelf.levels[0] + 0.15, 0]} scale={[0.2, 0.15, 0.15]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color="#d9c9a0" roughness={0.95} />
        </mesh>
        <Block size={[0.3, 0.2, 0.3]} position={[-0.4, shelf.levels[3] + 0.106, 0]} color="#f2efe6" roughness={0.3} radius={0.01} />
      </group>

      {/* right wall: dairy, eggs, a crate of oranges */}
      <group position={right} rotation={[0, -PI / 2, 0]}>
        <Crate at={[0.3, shelf.levels[1] + 0.006, 0]} colour="#e8b72a" />
        {[-0.6, -0.45, -0.3, -0.15].map((x) => (
          <Block key={x} size={[0.1, 0.24, 0.1]} position={[x, shelf.levels[2] + 0.126, 0.05]} color="#f8f8f4" roughness={0.4} radius={0.01} />
        ))}
        {[0, 1, 2].map((k) => (
          <Block key={k} size={[0.32, 0.06, 0.32]} position={[0.3, shelf.levels[2] + 0.04 + k * 0.065, 0]} color="#c9b08a" roughness={0.95} radius={0.006} />
        ))}
        <Block size={[0.5, 0.3, 0.36]} position={[0, shelf.levels[0] + 0.156, 0]} color="#c9a46a" roughness={0.9} radius={0.006} />
      </group>

      <Instanced geometry={PRODUCE} material={LETTUCE} items={LETTUCES} />
      <Instanced geometry={PRODUCE} material={TOMATO} items={TOMATOES} />
      <Instanced geometry={PRODUCE} material={ORANGE} items={ORANGES} />

      {/* frost built up along the shelf fronts and on the floor in the corners */}
      {shelf.levels.slice(1).map((y) => (
        <Block key={y} size={[shelf.width - 0.04, 0.012, 0.04]} position={[0, y + 0.03, back[2] + shelf.depth / 2 - 0.02]} color="#f4fbff" roughness={0.9} radius={0.005} />
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} material={FROST} position={[s * (halfW - 0.15), 0.02, -depth + 0.15]} scale={[0.25, 0.04, 0.25]} raycast={noClick}>
          <sphereGeometry args={[1, 14, 8]} />
        </mesh>
      ))}
    </group>
  )
}
