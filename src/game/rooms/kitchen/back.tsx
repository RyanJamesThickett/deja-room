import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CylinderGeometry, DoubleSide, MeshStandardMaterial, Quaternion, TorusGeometry, Vector3, type BufferGeometry, type Group, type Mesh } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Block, Instanced, PI, type Placement } from '../../kit'
import { once } from '../../outsideLayers'
import type { Vec3 } from '../../mutations'
import { BENCH, BRUSHED, DARK_STEEL, POT_SHELF, STAINLESS, STEEL_MAT, STEEL_OPEN, WHITE_CHINA } from './layout'
import { Sack } from './prep'
import { ThrashingSpray } from './spray'
import { signTexture, walkInWindowTexture, whiteboardTexture } from './textures'

/*
 * Storage and washing up: the walk-in, the pot shelves, the reach-in
 * fridge and dry store, and the dish run (soiled table, pot-wash sink,
 * dishwasher, clean table). Everything faces +z with its back to a wall.
 */

// ---------------------------------------------------------------------------
// Walk-in fridge door
// ---------------------------------------------------------------------------

const DOOR_W = 0.95
const DOOR_H = 2.0

const noClick = () => null

/** Cold mist spilling out along the floor through a door left open. */
export function ColdMist() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ref.current?.children.forEach((c, i) => {
      const k = (t * 0.12 + i * 0.33) % 1
      c.position.z = 0.2 + k * 0.4
      c.scale.set(0.25 + k * 0.3, 0.03 + k * 0.02, 0.18 + k * 0.2)
      const m = (c as Mesh).material as MeshStandardMaterial
      m.opacity = 0.12 * Math.sin(k * PI)
    })
  })
  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.35, 0.1, 0.1]} raycast={noClick}>
          <sphereGeometry args={[1, 14, 8]} />
          <meshStandardMaterial color="#eef8ff" transparent opacity={0.15} depthWrite={false} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}


export function WalkInDoor({ mode }: { mode: 'normal' | 'frost' | 'ajar' }) {
  const glass = useMemo(() => walkInWindowTexture(mode === 'frost'), [mode])
  const sign = useMemo(() => signTexture(['COLD ROOM', 'KEEP SHUT'], '#e8f2fa', '#1d4f8a', 512, 192), [])
  const ajar = mode === 'ajar'
  return (
    <>
      {/* insulated surround; the walk-in itself is behind the wall (WalkInRoom) */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.12, DOOR_H + 0.12, 0.1]} position={[s * (DOOR_W / 2 + 0.06), (DOOR_H + 0.12) / 2, 0.05]} {...STAINLESS} radius={0.01} />
      ))}
      <Block size={[DOOR_W + 0.24, 0.12, 0.1]} position={[0, DOOR_H + 0.06, 0.05]} {...STAINLESS} radius={0.01} />
      {ajar && (
        <>
          {/* the cold light on inside, a breath of mist on the floor, and the doorway itself to click */}
          <pointLight position={[0, 2.1, -1.5]} intensity={4} distance={2.6} decay={1.3} color="#a8d8ff" />
          <ColdMist />
          <mesh position={[0, DOOR_H / 2, 0.003]}>
            <planeGeometry args={[DOOR_W, DOOR_H]} />
            <meshBasicMaterial colorWrite={false} depthWrite={false} />
          </mesh>
        </>
      )}
      <group position={[-DOOR_W / 2, 0, 0.06]} rotation={[0, ajar ? -0.22 : 0, 0]}>
        <Block size={[DOOR_W, DOOR_H, 0.1]} position={[DOOR_W / 2, DOOR_H / 2, 0]} color="#e9edf0" roughness={0.35} metalness={0.2} radius={0.012} />
        {/* the little window and its frame */}
        <mesh position={[DOOR_W / 2, 1.5, 0.051]}>
          <planeGeometry args={[0.3, 0.38]} />
          <meshStandardMaterial map={glass} roughness={0.2} />
        </mesh>
        {[-1, 1].map((s) => (
          <Block key={`v${s}`} size={[0.025, 0.42, 0.02]} position={[DOOR_W / 2 + s * 0.16, 1.5, 0.055]} {...STAINLESS} radius={0.004} />
        ))}
        {[-1, 1].map((s) => (
          <Block key={`h${s}`} size={[0.345, 0.025, 0.02]} position={[DOOR_W / 2, 1.5 + s * 0.2, 0.055]} {...STAINLESS} radius={0.004} />
        ))}
        <mesh position={[DOOR_W / 2, 1.88, 0.051]}>
          <planeGeometry args={[0.4, 0.15]} />
          <meshStandardMaterial map={sign} roughness={0.5} />
        </mesh>
        {/* big latch handle and the hinges */}
        <Block size={[0.06, 0.3, 0.07]} position={[DOOR_W - 0.08, 1.05, 0.08]} {...STAINLESS} radius={0.015} />
        <Block size={[0.14, 0.05, 0.05]} position={[DOOR_W - 0.13, 1.05, 0.1]} {...STAINLESS} radius={0.015} />
        {[0.35, 1.65].map((y) => (
          <Block key={y} size={[0.16, 0.08, 0.05]} position={[0.07, y, 0.07]} {...STAINLESS} radius={0.01} />
        ))}
        <Block size={[DOOR_W - 0.06, 0.18, 0.01]} position={[DOOR_W / 2, 0.12, 0.052]} {...BRUSHED} radius={0.003} />
      </group>
      {/* the temperature display beside the door */}
      <Block size={[0.14, 0.08, 0.03]} position={[DOOR_W / 2 + 0.06, 1.55, 0.115]} color="#1a1c1e" roughness={0.4} radius={0.006} />
      <mesh position={[DOOR_W / 2 + 0.06, 1.55, 0.131]}>
        <planeGeometry args={[0.1, 0.04]} />
        <meshStandardMaterial color="#ff3b2a" emissive="#ff3b2a" emissiveIntensity={1.2} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// Wire shelving with stockpots and pans
// ---------------------------------------------------------------------------

const CHROME = { color: '#d4d9de', metalness: 0.85, roughness: 0.25 }

export function WireShelf({ width, depth, height, levels }: { width: number; depth: number; height: number; levels: number[] }) {
  return (
    <>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (width / 2 - 0.015), height / 2, sz * (depth / 2 - 0.015)]} material={STEEL_MAT}>
            <cylinderGeometry args={[0.013, 0.013, height, 10]} />
          </mesh>
        )),
      )}
      {levels.map((y) => (
        <group key={y}>
          <Block size={[width - 0.02, 0.012, depth - 0.02]} position={[0, y, 0]} color="#9aa1a8" metalness={0.7} roughness={0.35} radius={0.004} />
          {[-1, 1].map((s) => (
            <Block key={s} size={[width - 0.02, 0.03, 0.01]} position={[0, y + 0.01, s * (depth / 2 - 0.01)]} {...CHROME} radius={0.003} />
          ))}
        </group>
      ))}
    </>
  )
}

function Pot({ r, h, at }: { r: number; h: number; at: Vec3 }) {
  return (
    <group position={at}>
      <mesh position={[0, h / 2, 0]} material={STEEL_MAT} castShadow>
        <cylinderGeometry args={[r, r, h, 28]} />
      </mesh>
      {/* the lid's rolled edge and its knob */}
      <mesh position={[0, h, 0]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT} scale={[r, r, 0.1]}>
        <torusGeometry args={[1, 0.035, 6, 32]} />
      </mesh>
      <mesh position={[0, h + 0.006, 0]} material={STEEL_MAT}>
        <cylinderGeometry args={[r * 0.8, r * 0.97, 0.012, 28]} />
      </mesh>
      <mesh position={[0, h + 0.022, 0]} material={DARK_PAN}>
        <cylinderGeometry args={[0.022, 0.016, 0.02, 14]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (r + 0.02), h - 0.04, 0]} rotation={[0, 0, PI / 2]} material={STEEL_MAT}>
          <torusGeometry args={[0.02, 0.006, 6, 12, PI]} />
        </mesh>
      ))}
    </group>
  )
}

const SHELF_PAN = new CylinderGeometry(0.13, 0.12, 0.05, 24)
const PAN_HANDLE = new CylinderGeometry(0.01, 0.01, 0.2, 8)
const DARK_PAN = new MeshStandardMaterial({ color: '#2a2b2e', metalness: 0.6, roughness: 0.5 })

/** Stockpots, saucepans and frying pans on the shelves; the swaps take one away or stack the top shelf to the ceiling. */
export function PotStock({ mode, ceiling }: { mode: 'normal' | 'missing' | 'tower'; ceiling: number }) {
  const [, mid, high, top] = POT_SHELF.levels
  const base = POT_SHELF.levels[0] + 0.006
  const pans = useMemo(() => {
    const bodies: Placement[] = []
    const handles: Placement[] = []
    for (const x of [-0.55, -0.15, 0.25]) {
      for (let k = 0; k < 3; k++) {
        bodies.push({ at: [x, high + 0.031 + k * 0.05, 0] })
        handles.push({ at: [x, high + 0.04 + k * 0.05, 0.22], rot: [PI / 2, 0, 0] })
      }
    }
    return { bodies, handles }
  }, [high])
  const tower = useMemo(() => {
    const out: Placement[] = []
    const n = Math.floor((ceiling - 0.06 - top) / 0.05)
    for (let k = 0; k < n; k++) out.push({ at: [0.35 + Math.sin(k * 0.7) * 0.01, top + 0.031 + k * 0.05, 0], rot: [0, k * 0.3, 0] })
    return out
  }, [ceiling, top])
  return (
    <>
      {/* bottom: three big stockpots */}
      <Pot r={0.21} h={0.42} at={[-0.6, base, 0]} />
      {mode !== 'missing' && <Pot r={0.2} h={0.4} at={[-0.05, base, 0]} />}
      <Pot r={0.19} h={0.36} at={[0.5, base, 0]} />
      {/* saucepans with their handles out */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <group key={x}>
          <Pot r={0.11 + (i % 2) * 0.02} h={0.15} at={[x, mid + 0.006, -0.03]} />
          <mesh material={DARK_PAN} geometry={PAN_HANDLE} position={[x, mid + 0.13, 0.17]} rotation={[PI / 2, 0, 0]} />
        </group>
      ))}
      {/* stacks of frying pans */}
      <Instanced geometry={SHELF_PAN} material={DARK_PAN} items={pans.bodies} />
      <Instanced geometry={PAN_HANDLE} material={DARK_PAN} items={pans.handles} />
      <Block size={[0.5, 0.025, 0.36]} position={[0.6, high + 0.019, 0]} color="#b8bec4" metalness={0.7} roughness={0.35} radius={0.003} />
      <Block size={[0.5, 0.025, 0.36]} position={[0.6, high + 0.046, 0]} color="#b8bec4" metalness={0.7} roughness={0.35} radius={0.003} />
      {/* top: two wide rondeaux and a colander */}
      <Pot r={0.18} h={0.12} at={[-0.5, top + 0.006, 0]} />
      <group position={[0.05, top + 0.006, 0]}>
        <mesh position={[0, 0.13, 0]} material={STEEL_OPEN}>
          <sphereGeometry args={[0.14, 28, 12, 0, PI * 2, PI / 2, PI / 2]} />
        </mesh>
        <mesh position={[0, 0.13, 0]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT}>
          <torusGeometry args={[0.14, 0.006, 6, 36]} />
        </mesh>
        <mesh position={[0, 0.012, 0]} material={STEEL_OPEN}>
          <cylinderGeometry args={[0.07, 0.08, 0.024, 24, 1, true]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.15, 0.12, 0]} rotation={[0, 0, PI / 2]} material={STEEL_MAT}>
            <torusGeometry args={[0.025, 0.005, 6, 12, PI]} />
          </mesh>
        ))}
      </group>
      {mode === 'tower' ? (
        <Instanced geometry={SHELF_PAN} material={DARK_PAN} items={tower} castShadow />
      ) : (
        <Pot r={0.17} h={0.12} at={[0.5, top + 0.006, 0]} />
      )}
    </>
  )
}

export function PotShelves() {
  return <WireShelf {...POT_SHELF} />
}

// ---------------------------------------------------------------------------
// Reach-in fridge, dry store, whiteboard, bin
// ---------------------------------------------------------------------------

export function ReachInFridge() {
  return (
    <>
      <Block size={[0.74, 1.9, 0.76]} position={[0, 1.05, -0.02]} {...BRUSHED} radius={0.012} />
      <Block size={[0.7, 1.6, 0.03]} position={[0, 0.95, 0.37]} {...STAINLESS} radius={0.01} />
      <Block size={[0.03, 0.5, 0.04]} position={[0.3, 1.05, 0.41]} {...STAINLESS} radius={0.012} />
      <Block size={[0.7, 0.2, 0.02]} position={[0, 1.88, 0.36]} color="#22262a" roughness={0.4} radius={0.006} />
      <mesh position={[0.2, 1.88, 0.371]}>
        <planeGeometry args={[0.1, 0.04]} />
        <meshStandardMaterial color="#3fd0ff" emissive="#3fd0ff" emissiveIntensity={1.2} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} position={[sx * 0.3, 0.05, sz * 0.3]} material={STEEL_MAT} geometry={FOOT} />),
      )}
    </>
  )
}

const FOOT = new CylinderGeometry(0.025, 0.03, 0.1, 10)
const SACK = '#d9c9a0'
const ONION_SACK = '#b5462a'

/** Dry store shelving: flour, rice and onions in sacks, tins and tubs. */
export function DryStore() {
  const spec = { width: 1.2, depth: 0.5, height: 1.8, levels: [0.12, 0.55, 1.0, 1.45] }
  return (
    <>
      <WireShelf {...spec} />
      <Sack at={[-0.36, 0.126, 0]} size={[0.32, 0.38, 0.3]} colour={SACK} band="#2a5fc6" rotation={[0, 0.1, 0]} />
      <Sack at={[0.03, 0.126, 0]} size={[0.3, 0.36, 0.28]} colour={ONION_SACK} rotation={[0, -0.15, 0]} />
      <Sack at={[0.39, 0.126, 0]} size={[0.28, 0.32, 0.26]} colour={SACK} band="#c8302c" rotation={[0, 0.2, 0]} />
      {[-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42].map((x, i) => (
        <mesh key={x} position={[x, 0.62, 0.05]}>
          <cylinderGeometry args={[0.055, 0.055, 0.14, 16]} />
          <meshStandardMaterial color={['#c8302c', '#e8b72a', '#3a8a3a'][i % 3]} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {[-0.35, 0, 0.35].map((x) => (
        <Block key={x} size={[0.3, 0.26, 0.36]} position={[x, 1.14, 0]} color="#f2efe6" roughness={0.5} radius={0.02} />
      ))}
      {[-0.4, -0.15, 0.1, 0.35].map((x, i) => (
        <Block key={x} size={[0.16, 0.24, 0.12]} position={[x, 1.58, 0.05]} color={['#e9e1cc', '#2a5fc6', '#e9e1cc', '#c8302c'][i]} roughness={0.8} radius={0.01} />
      ))}
    </>
  )
}

export function Whiteboard({ you = false }: { you?: boolean }) {
  const map = useMemo(() => whiteboardTexture(you), [you])
  return (
    <>
      <Block size={[0.92, 0.62, 0.02]} position={[0, 0, 0.01]} color="#c9ced3" metalness={0.6} roughness={0.3} radius={0.006} />
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[0.88, 0.58]} />
        <meshStandardMaterial map={map} roughness={0.3} />
      </mesh>
      <Block size={[0.6, 0.03, 0.05]} position={[0, -0.33, 0.03]} color="#c9ced3" metalness={0.6} roughness={0.3} radius={0.006} />
    </>
  )
}

export function KitchenBin() {
  return (
    <>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.22, 0.84, 28]} />
        <meshStandardMaterial color="#5f6f7a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 28]} />
        <meshStandardMaterial color="#4a5761" roughness={0.5} />
      </mesh>
      <Block size={[0.14, 0.04, 0.1]} position={[0, 0.03, 0.25]} {...DARK_STEEL} radius={0.01} />
    </>
  )
}

// ---------------------------------------------------------------------------
// The dish run
// ---------------------------------------------------------------------------

/** A rack of clean glasses for the clean table and the shelf above. */
export function GlassRack() {
  const glasses = useMemo(() => {
    const out: Placement[] = []
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) out.push({ at: [-0.18 + i * 0.12, 0.08, -0.18 + j * 0.12] })
    return out
  }, [])
  return (
    <>
      <Block size={[0.5, 0.1, 0.5]} position={[0, 0.05, 0]} color="#2f6bb5" roughness={0.6} radius={0.01} />
      <Instanced geometry={GLASS} material={GLASS_MAT} items={glasses} />
    </>
  )
}

const GLASS = new CylinderGeometry(0.035, 0.03, 0.12, 14, 1, true)
const GLASS_MAT = new MeshStandardMaterial({ color: '#e6f2f6', roughness: 0.05, transparent: true, opacity: 0.45, side: DoubleSide })

/** Clean plates standing in a dish rack. */
export function PlateRack() {
  const plates = useMemo(() => {
    const out: Placement[] = []
    for (let i = 0; i < 10; i++) out.push({ at: [0, 0.16, -0.2 + i * 0.045], rot: [PI / 2, 0, 0] })
    return out
  }, [])
  return (
    <>
      <Block size={[0.5, 0.06, 0.5]} position={[0, 0.03, 0]} color="#2f6bb5" roughness={0.6} radius={0.01} />
      <Instanced geometry={RACK_PLATE} material={WHITE_CHINA} items={plates} />
    </>
  )
}

const RACK_PLATE = new CylinderGeometry(0.13, 0.13, 0.015, 28)
const DIRTY_PLATE = new CylinderGeometry(0.14, 0.11, 0.02, 28)

/** Dirty plates piled up on the soiled table; `lean` tilts the pile far past falling over. */
export function PlateStack({ lean }: { lean: boolean }) {
  const plates = useMemo(() => {
    const out: Placement[] = []
    for (let k = 0; k < 16; k++) {
      const t = k / 15
      out.push({ at: [lean ? t * t * 0.22 : Math.sin(k * 2.1) * 0.006, 0.011 + k * 0.021, lean ? t * t * 0.05 : Math.cos(k * 1.7) * 0.006], rot: [0, 0, lean ? -t * 0.5 : 0] })
    }
    return out
  }, [lean])
  const top = plates[plates.length - 1]
  return (
    <>
      <Instanced geometry={DIRTY_PLATE} material={WHITE_CHINA} items={plates} castShadow />
      {/* leftovers on the top plate */}
      <group position={top.at} rotation={top.rot}>
        <mesh position={[0.02, 0.012, 0.01]} rotation={[-PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 20]} />
          <meshStandardMaterial color="#8a3a22" roughness={0.4} />
        </mesh>
        <Block size={[0.04, 0.012, 0.012]} position={[-0.04, 0.016, -0.03]} color="#e8b44a" roughness={0.6} radius={0.004} />
      </group>
    </>
  )
}

/** The big pot-wash sink, with the pre-rinse spray on its spring (which can come alive). Built 0.9 wide, 0.7 deep. */
export function PotSink({ mode }: { mode: 'normal' | 'thrash' | 'bubbles' }) {
  const bubbles = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (bubbles.current) bubbles.current.position.y = Math.sin(clock.elapsedTime * 1.3) * 0.008
  })
  const head = (
    <>
      <mesh position={[0, 0, 0.07]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.045, 0.028, 0.16, 18]} />
      </mesh>
      <mesh position={[0, 0, 0.155]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.047, 0.047, 0.014, 18]} />
        <meshStandardMaterial color="#26282b" roughness={0.4} />
      </mesh>
      <Block size={[0.025, 0.07, 0.06]} position={[0, -0.05, 0.03]} color="#2a5fc6" roughness={0.5} radius={0.008} />
    </>
  )
  return (
    <>
      {/* the worktop round a deep basin: strips front, back and sides */}
      <Block size={[0.9, 0.04, 0.08]} position={[0, BENCH - 0.02, 0.31]} {...STAINLESS} radius={0.006} />
      <Block size={[0.9, 0.04, 0.12]} position={[0, BENCH - 0.02, -0.29]} {...STAINLESS} radius={0.006} />
      {[-1, 1].map((s) => (
        <Block key={`t${s}`} size={[0.1, 0.04, 0.5]} position={[s * 0.4, BENCH - 0.02, BASIN.z]} {...STAINLESS} radius={0.004} />
      ))}
      {/* the basin: four walls down to a floor with a drain */}
      {[-1, 1].map((s) => (
        <Block key={`bx${s}`} size={[0.015, BASIN.depth, 0.5]} position={[s * 0.3575, BENCH - BASIN.depth / 2, BASIN.z]} color="#9aa1a8" metalness={0.8} roughness={0.3} radius={0.004} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={`bz${s}`} size={[0.7, BASIN.depth, 0.015]} position={[0, BENCH - BASIN.depth / 2, BASIN.z + s * 0.2425]} color="#9aa1a8" metalness={0.8} roughness={0.3} radius={0.004} />
      ))}
      <mesh position={[0, BENCH - BASIN.depth + 0.001, BASIN.z]} rotation={[-PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#5d646a" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, BENCH - BASIN.depth + 0.003, BASIN.z - 0.05]} rotation={[-PI / 2, 0, 0]}>
        <circleGeometry args={[0.035, 20]} />
        <meshStandardMaterial color="#22252a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* the cabinet under it: the base, an apron all round up to the worktop */}
      <Block size={[0.9, BENCH - BASIN.depth - 0.35, 0.68]} position={[0, (0.35 + BENCH - BASIN.depth) / 2, 0]} {...BRUSHED} radius={0.01} />
      <Block size={[0.9, BASIN.depth, 0.02]} position={[0, BENCH - BASIN.depth / 2 - 0.02, 0.33]} {...BRUSHED} radius={0.006} />
      <Block size={[0.9, BASIN.depth, 0.02]} position={[0, BENCH - BASIN.depth / 2 - 0.02, -0.33]} {...BRUSHED} radius={0.006} />
      {[-1, 1].map((s) => (
        <Block key={`a${s}`} size={[0.02, BASIN.depth, 0.68]} position={[s * 0.44, BENCH - BASIN.depth / 2 - 0.02, 0]} {...BRUSHED} radius={0.006} />
      ))}
      <Block size={[0.9, 0.14, 0.02]} position={[0, BENCH + 0.07, -0.34]} {...STAINLESS} radius={0.004} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={FOOT} material={STEEL_MAT} position={[sx * 0.38, 0.175, sz * 0.28]} scale={[1, 3.5, 1]} />),
      )}
      <Block size={[0.82, 0.02, 0.6]} position={[0, 0.12, 0]} {...BRUSHED} radius={0.004} />
      {/* mixer tap */}
      <mesh position={[-0.2, BENCH + 0.18, -0.3]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.014, 0.014, 0.22, 10]} />
      </mesh>
      <mesh position={[-0.2, BENCH + 0.28, -0.2]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.012, 0.012, 0.2, 10]} />
      </mesh>
      {/* pre-rinse riser, wall bracket and the spring */}
      <mesh position={[0.18, BENCH + 0.5, -0.3]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.014, 0.014, 0.9, 10]} />
      </mesh>
      <Block size={[0.06, 0.04, 0.08]} position={[0.18, BENCH + 0.82, -0.32]} {...STAINLESS} radius={0.008} />
      <mesh position={[0.18, BENCH + 0.96, -0.3]} rotation={[0, 0, PI / 2]} material={STEEL_MAT}>
        <torusGeometry args={[0.04, 0.012, 8, 20, PI]} />
      </mesh>
      <group position={[0.22, BENCH + 0.95, -0.3]}>
        <mesh position={[0, -0.18, 0]} material={STEEL_MAT}>
          <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
        </mesh>
        {Array.from({ length: 14 }, (_, k) => (
          <mesh key={k} geometry={COIL} material={STEEL_MAT} position={[0, -0.04 - k * 0.02, 0]} rotation={[PI / 2, 0, 0]} />
        ))}
      </group>
      {mode === 'thrash' ? (
        <ThrashingSpray anchor={[0.22, BENCH + 0.6, -0.3]} head={head} />
      ) : (
        <group position={[0.22, BENCH + 0.55, -0.3]} rotation={[PI / 2 - 0.15, 0, 0]}>
          {head}
        </group>
      )}
      {mode === 'bubbles' && (
        <group ref={bubbles}>
          {/* the basin brimming with foam */}
          <mesh position={[0, BENCH - 0.03, BASIN.z]} scale={[0.36, 0.08, 0.26]}>
            <sphereGeometry args={[1, 24, 12]} />
            <meshStandardMaterial color="#f6fbff" roughness={0.15} />
          </mesh>
          {Array.from({ length: 22 }, (_, k) => {
            const a = k * 2.4
            const r = 0.06 + (k % 5) * 0.06
            return (
              <mesh key={k} position={[Math.cos(a) * r * 1.2, BENCH + 0.02 + (k % 4) * 0.03, 0.02 + Math.sin(a) * r * 0.7]} scale={0.06 + (k % 3) * 0.02}>
                <sphereGeometry args={[1, 14, 10]} />
                <meshStandardMaterial color="#f6fbff" roughness={0.15} transparent opacity={0.9} />
              </mesh>
            )
          })}
          {/* spilling over the front edge */}
          {[-0.2, 0.05, 0.25].map((x) => (
            <mesh key={x} position={[x, BENCH - 0.06, 0.355]} scale={[0.07, 0.1, 0.03]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color="#f6fbff" roughness={0.15} />
            </mesh>
          ))}
        </group>
      )}
    </>
  )
}

const COIL = new TorusGeometry(0.035, 0.005, 6, 18)
/** The pot-wash sink's basin: how deep it goes below the worktop, and its centre front to back. */
const BASIN = { depth: 0.28, z: 0.02 }

/** Hood-type pass-through dishwasher, 0.75 wide, 0.7 deep; `open` lifts the hood. */
export function Dishwasher({ open }: { open: boolean }) {
  const lift = open ? 0.42 : 0
  const steam = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (steam.current) steam.current.position.y = ((clock.elapsedTime * 0.15) % 0.12)
  })
  const rackPlates = useMemo(() => {
    const out: Placement[] = []
    for (let i = 0; i < 8; i++) out.push({ at: [-0.2 + i * 0.055, BENCH + 0.16, 0], rot: [0, 0, PI / 2] })
    return out
  }, [])
  return (
    <>
      <Block size={[0.72, BENCH - 0.12, 0.68]} position={[0, 0.12 + (BENCH - 0.12) / 2, 0]} {...BRUSHED} radius={0.01} />
      <Block size={[0.66, 0.6, 0.02]} position={[0, 0.5, 0.345]} {...STAINLESS} radius={0.006} />
      <Block size={[0.2, 0.05, 0.01]} position={[0, 0.72, 0.358]} color="#26282b" roughness={0.5} radius={0.004} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={FOOT} material={STEEL_MAT} position={[sx * 0.3, 0.06, sz * 0.28]} scale={[1, 1.2, 1]} />),
      )}
      {/* wash chamber floor, the rack and its plates */}
      <Block size={[0.7, 0.02, 0.66]} position={[0, BENCH + 0.0, 0]} {...STAINLESS} radius={0.004} />
      <Block size={[0.5, 0.06, 0.5]} position={[0, BENCH + 0.04, 0]} color="#2f6bb5" roughness={0.6} radius={0.01} />
      <Instanced geometry={RACK_PLATE} material={WHITE_CHINA} items={rackPlates} />
      {/* motor column at the back, with the controls on top */}
      <Block size={[0.72, 1.08, 0.12]} position={[0, BENCH + 0.54, -0.28]} {...BRUSHED} radius={0.01} />
      <Block size={[0.3, 0.1, 0.02]} position={[0, BENCH + 0.95, -0.21]} color="#26282b" roughness={0.4} radius={0.006} />
      <mesh position={[-0.08, BENCH + 0.95, -0.199]}>
        <planeGeometry args={[0.06, 0.03]} />
        <meshStandardMaterial color="#5fff7a" emissive="#5fff7a" emissiveIntensity={1.2} />
      </mesh>
      {/* the hood: three sides and a top, slid up when open */}
      <group position={[0, lift, 0.05]}>
        <Block size={[0.72, 0.5, 0.02]} position={[0, BENCH + 0.27, 0.27]} {...STAINLESS} radius={0.006} />
        {[-1, 1].map((s) => (
          <Block key={s} size={[0.02, 0.5, 0.56]} position={[s * 0.35, BENCH + 0.27, 0]} {...STAINLESS} radius={0.006} />
        ))}
        <Block size={[0.72, 0.02, 0.56]} position={[0, BENCH + 0.51, 0]} {...STAINLESS} radius={0.006} />
        <Block size={[0.5, 0.025, 0.025]} position={[0, BENCH + 0.42, 0.3]} {...STAINLESS} radius={0.01} />
      </group>
      {open && (
        <group ref={steam}>
          {[-0.15, 0.05, 0.2].map((x, i) => (
            <mesh key={x} position={[x, BENCH + 0.35 + i * 0.05, 0.05]} scale={[0.12, 0.08, 0.12]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
    </>
  )
}

const MOP_STRANDS = new MeshStandardMaterial({ color: '#d9d2bd', roughness: 1 })
const MOP_CLAMP_MAT = new MeshStandardMaterial({ color: '#2a5fc6', roughness: 0.5 })
const MOP_CLAMP = new CylinderGeometry(0.03, 0.04, 0.05, 14)

/** A string mop's head: thick strands splaying down and out from the clamp (origin), reaching 0.155 below it. */
const mopHead = once(() => {
  const parts: BufferGeometry[] = []
  const strand = (a: number, out: number, len: number) => {
    const dir = new Vector3(Math.cos(a) * out, -1, Math.sin(a) * out).normalize()
    const g = new CylinderGeometry(0.012, 0.01, len, 6)
    g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir))
    g.translate((dir.x * len) / 2, (dir.y * len) / 2, (dir.z * len) / 2)
    parts.push(g)
  }
  for (let k = 0; k < 14; k++) strand((k / 14) * PI * 2, 0.5, 0.17)
  for (let k = 0; k < 10; k++) strand((k / 10) * PI * 2 + 0.3, 1.1, 0.19)
  for (let k = 0; k < 5; k++) strand((k / 5) * PI * 2 + 0.6, 0.15, 0.155)
  return mergeGeometries(parts)
})

/** Yellow mop bucket on castors; the mop leans on the wall, or stands up by itself. */
export function MopBucket({ standing }: { standing: boolean }) {
  return (
    <>
      <Block size={[0.42, 0.3, 0.3]} position={[0, 0.2, 0]} color="#f2c21f" roughness={0.5} radius={0.04} paint />
      {/* a rolled rim round the top, and the dirty water inside it */}
      <Block size={[0.44, 0.03, 0.32]} position={[0, 0.345, 0]} color="#f2c21f" roughness={0.5} radius={0.012} paint />
      <mesh position={[0, 0.362, 0]} rotation={[-PI / 2, 0, 0]}>
        <planeGeometry args={[0.38, 0.26]} />
        <meshStandardMaterial color="#6a7a6a" roughness={0.2} />
      </mesh>
      {/* a WET FLOOR stripe on the front */}
      <Block size={[0.26, 0.05, 0.006]} position={[-0.04, 0.2, 0.152]} color="#1b1c1f" roughness={0.6} radius={0.002} />
      {/* wringer on one end */}
      <Block size={[0.16, 0.16, 0.26]} position={[0.14, 0.43, 0]} color="#2a2b2e" roughness={0.6} radius={0.02} />
      <Block size={[0.03, 0.3, 0.03]} position={[0.2, 0.62, 0]} rotation={[0, 0, -0.3]} color="#2a2b2e" roughness={0.6} radius={0.01} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.17, 0.03, sz * 0.12]}>
            <sphereGeometry args={[0.03, 10, 8]} />
            <meshStandardMaterial color="#222" roughness={0.6} />
          </mesh>
        )),
      )}
      {standing ? (
        // upright, on its own, next to the bucket
        <group position={[-0.34, 0, 0.0]}>
          <mesh geometry={mopHead()} material={MOP_STRANDS} position={[0, 0.155, 0]} />
          <mesh geometry={MOP_CLAMP} material={MOP_CLAMP_MAT} position={[0, 0.17, 0]} />
          <mesh position={[0, 0.83, 0]}>
            <cylinderGeometry args={[0.013, 0.013, 1.3, 10]} />
            <meshStandardMaterial color="#2a5fc6" roughness={0.5} />
          </mesh>
        </group>
      ) : (
        <group position={[-0.08, 0.25, -0.02]} rotation={[-0.24, 0, 0]}>
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.013, 0.013, 1.3, 10]} />
            <meshStandardMaterial color="#2a5fc6" roughness={0.5} />
          </mesh>
          <mesh geometry={mopHead()} material={MOP_STRANDS} />
          <mesh geometry={MOP_CLAMP} material={MOP_CLAMP_MAT} position={[0, 0.015, 0]} />
        </group>
      )}
    </>
  )
}

/** A tub of dirty cutlery, sitting on the soiled table (origin on the worktop). */
export function CutleryTub() {
  return (
    <>
      <Block size={[0.3, 0.14, 0.2]} position={[0, 0.07, 0]} color="#2f6bb5" roughness={0.6} radius={0.01} />
      {[-0.08, -0.03, 0.02, 0.07].map((x, i) => (
        <Block key={x} size={[0.012, 0.18, 0.004]} position={[x, 0.17, (i % 2) * 0.04 - 0.02]} rotation={[0, 0, (i - 1.5) * 0.12]} {...STAINLESS} radius={0.0015} />
      ))}
    </>
  )
}
