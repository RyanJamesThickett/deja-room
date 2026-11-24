import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CylinderGeometry, DoubleSide, MeshStandardMaterial, ShaderMaterial, TorusGeometry, type Group, type Mesh } from 'three'
import { Block, PI } from '../../kit'
import type { Vec3 } from '../../mutations'
import { Outside } from '../../outside'
import { Hover } from '../living/oddities'
import { FRIDGE, KITCHEN, MESS_WINDOW, TABLE, TV, WALL_UNIT } from './layout'
import { dartboardTexture, drillYard, magnetTexture, signTexture } from './textures'

/*
 * The things in the mess: the kitchen along the far wall, the fridge, the
 * big table and its chairs, the TV corner and the dartboard. Each is built
 * standing on the floor (or a worktop) at its origin, front facing +z unless
 * it says otherwise.
 */

const STEEL = { color: '#c7ccd1', metalness: 0.8, roughness: 0.28 }
const CHROME = { color: '#d5d9dd', metalness: 0.9, roughness: 0.25 }
const UNIT_DOOR = '#e7e1d2'
const WORKTOP = '#4a4642'

// ---------------------------------------------------------------------------
// Kitchen
// ---------------------------------------------------------------------------

/** Base units along a wall: `length` along x, the wall at z = 0, worktop on top. */
export function BaseUnits({ length }: { length: number }) {
  const d = KITCHEN.depth
  const top = KITCHEN.top
  const doors = Math.round(length / 0.6)
  const dw = length / doors
  return (
    <>
      <Block size={[length, top - 0.14, d - 0.04]} position={[0, 0.1 + (top - 0.14) / 2, (d - 0.04) / 2]} color="#d8d2c2" roughness={0.6} radius={0.004} />
      <Block size={[length, 0.1, d - 0.1]} position={[0, 0.05, (d - 0.1) / 2]} color="#3a3633" roughness={0.8} radius={0.004} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -length / 2 + dw * (i + 0.5)
        return (
          <group key={i}>
            <Block size={[dw - 0.006, top - 0.16, 0.018]} position={[x, 0.1 + (top - 0.14) / 2, d - 0.031]} color={UNIT_DOOR} roughness={0.45} radius={0.004} />
            <Block size={[0.012, 0.14, 0.022]} position={[x + (i % 2 ? -1 : 1) * (dw / 2 - 0.05), top - 0.2, d - 0.01]} {...CHROME} radius={0.004} />
          </group>
        )
      })}
      <Block size={[length, 0.04, d + 0.02]} position={[0, top - 0.02, (d + 0.02) / 2]} color={WORKTOP} roughness={0.35} radius={0.006} />
    </>
  )
}

/** Wall cupboards: `length` along x, the wall at z = 0. */
export function WallUnits({ length }: { length: number }) {
  const { y0, y1, depth } = WALL_UNIT
  const doors = Math.max(1, Math.round(length / 0.5))
  const dw = length / doors
  return (
    <>
      <Block size={[length, y1 - y0, depth - 0.02]} position={[0, (y0 + y1) / 2, (depth - 0.02) / 2]} color="#d8d2c2" roughness={0.6} radius={0.004} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -length / 2 + dw * (i + 0.5)
        return (
          <group key={i}>
            <Block size={[dw - 0.006, y1 - y0 - 0.01, 0.018]} position={[x, (y0 + y1) / 2, depth - 0.011]} color={UNIT_DOOR} roughness={0.45} radius={0.004} />
            <Block size={[0.012, 0.12, 0.022]} position={[x + (i % 2 ? -1 : 1) * (dw / 2 - 0.05), y0 + 0.1, depth + 0.006]} {...CHROME} radius={0.004} />
          </group>
        )
      })}
    </>
  )
}

/** The sink let into the worktop, with its mixer tap; the wall at z = 0. */
export function MessSink() {
  const top = KITCHEN.top
  return (
    <>
      <Block size={[0.5, 0.012, 0.46]} position={[0, top + 0.006, 0.3]} {...STEEL} radius={0.004} />
      <mesh position={[0, top + 0.013, 0.3]} rotation={[-PI / 2, 0, 0]}>
        <planeGeometry args={[0.4, 0.34]} />
        <meshStandardMaterial color="#8d9399" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, top + 0.04, 0.06]}>
        <cylinderGeometry args={[0.025, 0.03, 0.06, 16]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* a low mixer, so it clears the window board */}
      <mesh position={[0, top + 0.09, 0.06]}>
        <cylinderGeometry args={[0.013, 0.013, 0.14, 12]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <mesh position={[0, top + 0.16, 0.12]} rotation={[0, PI / 2, 0]}>
        <torusGeometry args={[0.06, 0.013, 8, 20, PI]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* washing-up liquid by the tap */}
      <mesh position={[0.2, top + 0.1, 0.1]}>
        <cylinderGeometry args={[0.03, 0.035, 0.2, 14]} />
        <meshStandardMaterial color="#3fae4b" roughness={0.2} />
      </mesh>
    </>
  )
}

/** The window over the sink: frame, sill, the drill yard outside. Item-style space: the wall at z = 0, centred on the opening, floor at y = 0. */
export function MessWindow() {
  const w = MESS_WINDOW.z1 - MESS_WINDOW.z0
  const { y0, y1 } = MESS_WINDOW
  const frame = { color: '#f3f2ee', roughness: 0.4 }
  const h = y1 - y0
  return (
    <>
      <Outside layers={drillYard()} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, h, 0.06]} position={[s * (w / 2 - 0.03), (y0 + y1) / 2, 0.025]} {...frame} radius={0.006} />
      ))}
      {[y0 + 0.03, y1 - 0.03].map((y) => (
        <Block key={y} size={[w, 0.06, 0.06]} position={[0, y, 0.025]} {...frame} radius={0.006} />
      ))}
      <Block size={[0.05, h, 0.05]} position={[0, (y0 + y1) / 2, 0.025]} {...frame} radius={0.006} />
      {/* window board */}
      <Block size={[w + 0.1, 0.025, 0.12]} position={[0, y0 - 0.0125, 0.06]} {...frame} radius={0.004} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * w) / 4, (y0 + y1) / 2, 0.02]} renderOrder={2}>
          <planeGeometry args={[w / 2 - 0.08, h - 0.12]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} clearcoat={1} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

/** Microwave on the worktop, door facing +z. */
export function Microwave() {
  return (
    <>
      <Block size={[0.5, 0.29, 0.38]} position={[0, 0.145, 0]} color="#e9e9e6" roughness={0.4} radius={0.015} />
      <Block size={[0.36, 0.23, 0.01]} position={[-0.06, 0.145, 0.19]} color="#141518" roughness={0.1} radius={0.006} />
      <Block size={[0.1, 0.23, 0.008]} position={[0.19, 0.145, 0.19]} color="#2a2d31" roughness={0.3} radius={0.004} />
    </>
  )
}

/** Tea, coffee and sugar tins. */
export function Canisters() {
  return (
    <>
      {['TEA', 'COFFEE', 'SUGAR'].map((t, i) => (
        <group key={t} position={[i * 0.15, 0, 0]}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.16, 20]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[0, 0.165, 0]}>
            <cylinderGeometry args={[0.057, 0.057, 0.02, 20]} />
            <meshStandardMaterial color="#1a1b1d" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Kettle and toaster
// ---------------------------------------------------------------------------

const KETTLE_BODY = new CylinderGeometry(0.075, 0.09, 0.2, 28)
const KETTLE_MAT = new MeshStandardMaterial({ color: '#cfd3d6', metalness: 0.85, roughness: 0.22 })
const PUFFS = 10
const STEAM_MAT = new MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, roughness: 1, depthWrite: false })

/** Puffs of steam rising from a point, each fading as it climbs. */
function Steam() {
  const puffs = useRef<(Mesh | null)[]>([])
  const mats = useMemo(() => Array.from({ length: PUFFS }, () => STEAM_MAT.clone()), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    puffs.current.forEach((m, i) => {
      if (!m) return
      const k = (t * 0.55 + i / PUFFS) % 1
      m.position.set(Math.sin(t * 1.3 + i) * 0.04 * k + k * 0.06, k * 0.5, Math.cos(t + i) * 0.03 * k)
      m.scale.setScalar(0.03 + k * 0.1)
      ;(m.material as MeshStandardMaterial).opacity = 0.7 * (1 - k) * Math.min(1, k * 6)
    })
  })
  return (
    <>
      {Array.from({ length: PUFFS }, (_, i) => (
        <mesh key={i} ref={(m) => void (puffs.current[i] = m)} material={mats[i]}>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
      ))}
    </>
  )
}

/** A steel jug kettle on its base, spout facing +z; `boiling` has it rumbling away with nobody there, steam pouring out. */
export function Kettle({ boiling }: { boiling: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current || !boiling) return
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 40) * 0.008
  })
  return (
    <>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.1, 0.105, 0.024, 28]} />
        <meshStandardMaterial color="#1a1b1d" roughness={0.5} />
      </mesh>
      {/* the switch light at the base: blue when it's on */}
      <mesh position={[0, 0.012, 0.102]}>
        <boxGeometry args={[0.03, 0.01, 0.006]} />
        <meshStandardMaterial color={boiling ? '#4aa3ff' : '#20252b'} emissive="#4aa3ff" emissiveIntensity={boiling ? 3 : 0} />
      </mesh>
      <group ref={ref}>
        <mesh geometry={KETTLE_BODY} material={KETTLE_MAT} position={[0, 0.125, 0]} castShadow />
        <mesh material={KETTLE_MAT} position={[0, 0.228, 0]}>
          <cylinderGeometry args={[0.055, 0.075, 0.012, 24]} />
        </mesh>
        <mesh position={[0, 0.242, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 0.018, 12]} />
          <meshStandardMaterial color="#1a1b1d" roughness={0.5} />
        </mesh>
        {/* spout and handle */}
        <mesh material={KETTLE_MAT} position={[0, 0.19, 0.09]} rotation={[0.9, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.024, 0.07, 12]} />
        </mesh>
        <mesh position={[0, 0.14, -0.09]} rotation={[0, PI / 2, 0]}>
          <torusGeometry args={[0.07, 0.014, 8, 20, PI]} />
          <meshStandardMaterial color="#1a1b1d" roughness={0.5} />
        </mesh>
        {boiling && (
          <group position={[0, 0.22, 0.12]}>
            <Steam />
          </group>
        )}
      </group>
    </>
  )
}

const TOAST = { color: '#cf9550', roughness: 0.9 }

function Slice({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      <Block size={[0.012, 0.115, 0.11]} {...TOAST} radius={0.004} />
      <Block size={[0.014, 0.008, 0.112]} position={[0, 0.058, 0]} color="#8a5524" roughness={0.9} radius={0.003} />
    </group>
  )
}

/** A two-slot chrome toaster, slots running along z; `floating` has both slices hanging in the air above it, perfectly still apart from a slow turn. */
export function Toaster({ floating }: { floating: boolean }) {
  return (
    <>
      <Block size={[0.18, 0.19, 0.28]} position={[0, 0.095, 0]} {...CHROME} radius={0.03} />
      {[-0.035, 0.035].map((x) => (
        <Block key={x} size={[0.02, 0.004, 0.2]} position={[x, 0.19, 0]} color="#141414" roughness={0.6} radius={0.001} />
      ))}
      <Block size={[0.02, 0.025, 0.05]} position={[0.1, 0.13, 0.04]} color="#1a1b1d" roughness={0.5} radius={0.006} />
      {floating ? (
        <Hover height={0.46}>
          {[-0.035, 0.035].map((x) => (
            <Slice key={x} at={[x, 0, 0]} />
          ))}
        </Hover>
      ) : (
        // popped, waiting
        [-0.035, 0.035].map((x) => <Slice key={x} at={[x, 0.2, 0]} />)
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Fridge
// ---------------------------------------------------------------------------

const FRIDGE_WHITE = { color: '#f1f1ee', roughness: 0.35 }
const MILK = new CylinderGeometry(0.045, 0.05, 0.2, 16)
const MILK_MAT = new MeshStandardMaterial({ color: '#f8f8f6', roughness: 0.3 })
const MILK_CAP = new CylinderGeometry(0.02, 0.02, 0.02, 12)
const CAP_MAT = new MeshStandardMaterial({ color: '#2f7fd8', roughness: 0.4 })

/** Magnet letters on the fridge door, facing +z. */
function Magnets({ lines }: { lines: string[] }) {
  const map = useMemo(() => magnetTexture(lines), [lines])
  return (
    <mesh position={[0, 1.42, 0.013]}>
      <planeGeometry args={[0.48, 0.48]} />
      <meshStandardMaterial map={map} transparent roughness={0.3} />
    </mesh>
  )
}

/** The fridge's upper door, hinged on its left edge (x = 0), spanning +x. */
function FridgeDoor({ lines }: { lines: string[] }) {
  const w = FRIDGE.width
  return (
    <group position={[w / 2, 0, 0]}>
      <Block size={[w, FRIDGE.height - 0.82, 0.05]} position={[0, (0.8 + FRIDGE.height - 0.02) / 2, 0.025]} {...FRIDGE_WHITE} radius={0.015} paint />
      <Block size={[0.03, 0.45, 0.04]} position={[w / 2 - 0.05, 1.25, 0.065]} color="#9aa1a8" metalness={0.6} roughness={0.3} radius={0.01} />
      <group position={[0, 0, 0.05]}>
        <Magnets lines={lines} />
      </group>
    </group>
  )
}

const LINES_DEFAULT = ['RED', 'WATCH']
const LINES_BEHIND = ['BEHIND', 'YOU']

/** A tall fridge-freezer, doors facing +z, hinged on the -x side; `open` has the top door left open on shelves of nothing but milk. */
export function Fridge({ mode }: { mode: 'default' | 'open' | 'letters' }) {
  const { width: w, depth: d, height: h } = FRIDGE
  const front = d / 2
  const open = mode === 'open'
  const milk = useMemo(() => {
    const out: Vec3[] = []
    for (const y of [0.85, 1.17, 1.48])
      for (let i = 0; i < 5; i++)
        for (let j = 0; j < 2; j++) out.push([-w / 2 + 0.1 + i * 0.115, y, -d / 2 + 0.15 + j * 0.13])
    return out
  }, [w, d])
  return (
    <>
      {/* the freezer below and its door */}
      <Block size={[w, 0.78, d]} position={[0, 0.39, 0]} {...FRIDGE_WHITE} radius={0.015} paint />
      <Block size={[w, 0.7, 0.05]} position={[0, 0.43, front + 0.025]} {...FRIDGE_WHITE} radius={0.015} paint />
      <Block size={[0.3, 0.03, 0.04]} position={[0, 0.72, front + 0.065]} color="#9aa1a8" metalness={0.6} roughness={0.3} radius={0.01} />
      {open ? (
        <>
          {/* the cabinet, hollow, its light on */}
          <Block size={[w, 0.04, d]} position={[0, h - 0.02, 0]} {...FRIDGE_WHITE} radius={0.01} paint />
          <Block size={[w, h - 0.82, 0.04]} position={[0, (0.78 + h) / 2, -d / 2 + 0.02]} {...FRIDGE_WHITE} radius={0.01} paint />
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.04, h - 0.82, d]} position={[s * (w / 2 - 0.02), (0.78 + h) / 2, 0]} {...FRIDGE_WHITE} radius={0.01} paint />
          ))}
          {[1.1, 1.42].map((y) => (
            <Block key={y} size={[w - 0.08, 0.008, d - 0.08]} position={[0, y, 0]} color="#dfeef2" roughness={0.1} radius={0.002} />
          ))}
          <Block size={[0.12, 0.03, 0.08]} position={[0, h - 0.06, -d / 2 + 0.1]} color="#fffaf0" emissive="#fff6d8" emissiveIntensity={2.5} radius={0.01} />
          {milk.map((at, i) => (
            <group key={i} position={at}>
              <mesh geometry={MILK} material={MILK_MAT} position={[0, 0.1, 0]} />
              <mesh geometry={MILK_CAP} material={CAP_MAT} position={[0, 0.21, 0]} />
            </group>
          ))}
          <group position={[-w / 2, 0, front]} rotation={[0, -0.32, 0]}>
            <FridgeDoor lines={LINES_DEFAULT} />
          </group>
        </>
      ) : (
        <>
          <Block size={[w, h - 0.8, d]} position={[0, (0.8 + h) / 2, 0]} {...FRIDGE_WHITE} radius={0.015} paint />
          <group position={[-w / 2, 0, front]}>
            <FridgeDoor lines={mode === 'letters' ? LINES_BEHIND : LINES_DEFAULT} />
          </group>
        </>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// The table and chairs
// ---------------------------------------------------------------------------

const MUG = new CylinderGeometry(0.04, 0.037, 0.095, 18, 1, true)
const MUG_BASE = new CylinderGeometry(0.037, 0.037, 0.006, 18)
const MUG_HANDLE = new TorusGeometry(0.025, 0.007, 6, 14, PI)
const MUG_COLOURS = ['#c8211b', '#f4f4f0', '#1d3fb8', '#f2c500', '#2a8a3a', '#f4f4f0']
const mugMats = (() => {
  let made: MeshStandardMaterial[] | undefined
  return () => (made ??= MUG_COLOURS.map((c) => new MeshStandardMaterial({ color: c, roughness: 0.3, side: DoubleSide })))
})()

function Mug({ at, colour, turn = 0 }: { at: Vec3; colour: number; turn?: number }) {
  const mat = mugMats()[colour % MUG_COLOURS.length]
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <mesh geometry={MUG} material={mat} position={[0, 0.0475, 0]} castShadow />
      <mesh geometry={MUG_BASE} material={mat} position={[0, 0.003, 0]} />
      <mesh geometry={MUG_HANDLE} material={mat} position={[0.04, 0.05, 0]} rotation={[0, 0, -PI / 2]} />
    </group>
  )
}

const TOP = TABLE.height

/** The mess table: a long laminate top on steel legs, long side along x. */
export function MessTable() {
  const { length: l, width: w } = TABLE
  return (
    <>
      <Block size={[l, 0.035, w]} position={[0, TOP - 0.0175, 0]} color="#b48a5a" roughness={0.5} radius={0.008} />
      <Block size={[l - 0.1, 0.07, w - 0.1]} position={[0, TOP - 0.07, 0]} color="#5b5f64" metalness={0.4} roughness={0.5} radius={0.006} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Block key={`${sx}${sz}`} size={[0.05, TOP - 0.035, 0.05]} position={[sx * (l / 2 - 0.08), (TOP - 0.035) / 2, sz * (w / 2 - 0.08)]} color="#5b5f64" metalness={0.5} roughness={0.4} radius={0.006} />
        )),
      )}
    </>
  )
}

/** What's on the table: mugs, papers and sauces; or every mug stacked into one tower; or a birthday cake with its candles lit. */
export function TableTop({ mode }: { mode: 'default' | 'tower' | 'cake' }) {
  const flames = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!flames.current) return
    flames.current.children.forEach((f, i) => f.scale.set(1, 0.85 + Math.sin(clock.elapsedTime * 14 + i * 2) * 0.15, 1))
  })
  const mugs: { at: Vec3; turn: number }[] = [
    { at: [-0.75, TOP, -0.2], turn: 0.4 },
    { at: [-0.35, TOP, 0.25], turn: 2.2 },
    { at: [0.15, TOP, -0.25], turn: -1.2 },
    { at: [0.62, TOP, 0.18], turn: 3.0 },
    { at: [0.85, TOP, -0.22], turn: 1.1 },
  ]
  return (
    <>
      {/* a paper, the sauces, salt and pepper: always there */}
      <Block size={[0.3, 0.008, 0.4]} position={[-0.05, TOP + 0.004, 0.05]} rotation={[0, 0.35, 0]} color="#efece4" roughness={0.9} radius={0.002} />
      <mesh position={[0.4, TOP + 0.09, -0.05]}>
        <cylinderGeometry args={[0.03, 0.035, 0.18, 14]} />
        <meshStandardMaterial color="#c8211b" roughness={0.3} />
      </mesh>
      <mesh position={[0.48, TOP + 0.09, -0.02]}>
        <cylinderGeometry args={[0.03, 0.035, 0.18, 14]} />
        <meshStandardMaterial color="#5a3420" roughness={0.3} />
      </mesh>
      {mode === 'tower' ? (
        // every mug in the mess in one wobbly column, each balanced on the rim of the one below
        Array.from({ length: 14 }, (_, i) => <Mug key={i} at={[0.15 + Math.sin(i * 1.7) * 0.012, TOP + i * 0.097, -0.05 + Math.cos(i * 2.3) * 0.01]} colour={i} turn={i * 0.9} />)
      ) : (
        mugs.map((m, i) => <Mug key={i} at={m.at} colour={i} turn={m.turn} />)
      )}
      {mode === 'cake' && (
        <group position={[-0.45, TOP, -0.05]}>
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
            <meshStandardMaterial color="#e8e8e4" roughness={0.3} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.14, 32]} />
            <meshStandardMaterial color="#fbeff2" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.12, 0]} rotation={[PI / 2, 0, 0]}>
            <torusGeometry args={[0.16, 0.012, 8, 40]} />
            <meshStandardMaterial color="#e2707a" roughness={0.5} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.1, 0.2, Math.sin(a) * 0.1]}>
                <cylinderGeometry args={[0.006, 0.006, 0.08, 8]} />
                <meshStandardMaterial color={['#4aa3ff', '#f2c500', '#e2707a'][i % 3]} roughness={0.5} />
              </mesh>
            )
          })}
          <group ref={flames}>
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i / 6) * PI * 2
              return (
                <mesh key={i} position={[Math.cos(a) * 0.1, 0.255, Math.sin(a) * 0.1]} scale={[0.6, 1, 0.6]}>
                  <sphereGeometry args={[0.014, 10, 8]} />
                  <meshStandardMaterial color="#ffcf5a" emissive="#ffb020" emissiveIntensity={4} />
                </mesh>
              )
            })}
          </group>
        </group>
      )}
    </>
  )
}

const CHAIR_FRAME = { color: '#3b3f44', metalness: 0.5, roughness: 0.4 }
const CHAIR_WOOD = { color: '#9c7048', roughness: 0.6 }

/** A stacking chair: steel legs, wooden seat and back, seat front facing +z. */
export function Chair() {
  return (
    <>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Block key={`${sx}${sz}`} size={[0.025, 0.44, 0.025]} position={[sx * 0.19, 0.22, sz * 0.19]} {...CHAIR_FRAME} radius={0.006} />
        )),
      )}
      <Block size={[0.42, 0.025, 0.42]} position={[0, 0.455, 0]} {...CHAIR_WOOD} radius={0.01} paint />
      {[-1, 1].map((sx) => (
        <Block key={sx} size={[0.025, 0.42, 0.025]} position={[sx * 0.19, 0.67, -0.2]} rotation={[-0.08, 0, 0]} {...CHAIR_FRAME} radius={0.006} />
      ))}
      <Block size={[0.4, 0.2, 0.02]} position={[0, 0.76, -0.215]} rotation={[-0.08, 0, 0]} {...CHAIR_WOOD} radius={0.008} paint />
    </>
  )
}

// ---------------------------------------------------------------------------
// The TV corner
// ---------------------------------------------------------------------------

/** Low TV unit, front facing +z, the wall at z = 0. */
export function TvUnit() {
  const { width: w, depth: d, height: h } = TV.unit
  return (
    <>
      <Block size={[w, h - 0.06, d]} position={[0, 0.06 + (h - 0.06) / 2, d / 2]} color="#6e4f35" roughness={0.6} radius={0.01} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[w / 2 - 0.02, h - 0.12, 0.012]} position={[(s * w) / 4, 0.06 + (h - 0.06) / 2, d + 0.006]} color="#7d5c3f" roughness={0.55} radius={0.004} />
      ))}
      {[-1, 1].flatMap((sx) => [0.05, d - 0.05].map((z) => <Block key={`${sx}${z}`} size={[0.04, 0.06, 0.04]} position={[sx * (w / 2 - 0.05), 0.03, z]} color="#2a2d31" radius={0.006} />))}
    </>
  )
}

const STATIC_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 cell = floor(vUv * vec2(320.0, 180.0));
    float n = hash(cell + floor(uTime * 24.0) * 1.7);
    float roll = 0.85 + 0.15 * smoothstep(0.0, 0.08, abs(fract(vUv.y + uTime * 0.25) - 0.5));
    gl_FragColor = vec4(vec3(n * 0.9 * roll), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
const UV_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

/** A screen full of hissing snow. */
function Snow({ size }: { size: [number, number] }) {
  const ref = useRef<Mesh>(null)
  const material = useMemo(() => new ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: STATIC_FRAG, uniforms: { uTime: { value: 0 } } }), [])
  useFrame(({ clock }) => {
    const m = ref.current?.material as ShaderMaterial | undefined
    if (m?.uniforms?.uTime) m.uniforms.uTime.value = clock.elapsedTime
  })
  return (
    <mesh ref={ref} material={material}>
      <planeGeometry args={size} />
    </mesh>
  )
}

/** A flat-screen TV on its stand, screen facing +z; off, or on with nothing but static. */
export function Telly({ on }: { on: boolean }) {
  const [w, h] = TV.screen
  const y = 0.12 + h / 2
  return (
    <>
      <Block size={[0.36, 0.015, 0.22]} position={[0, 0.0075, 0]} color="#1a1b1d" roughness={0.4} radius={0.004} />
      <Block size={[0.06, 0.12, 0.03]} position={[0, 0.07, -0.02]} color="#1a1b1d" roughness={0.4} radius={0.006} />
      <Block size={[w + 0.03, h + 0.03, 0.045]} position={[0, y, 0]} color="#151618" roughness={0.35} radius={0.008} />
      <group position={[0, y, 0.0235]}>
        {on ? (
          <Snow size={[w, h]} />
        ) : (
          <mesh>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial color="#0b0c0e" roughness={0.12} metalness={0.4} />
          </mesh>
        )}
      </group>
    </>
  )
}

const TANK = { w: 1.0, h: 0.55, d: 0.34 }
const FISH_ORANGE = new MeshStandardMaterial({ color: '#ff7a12', roughness: 0.35, emissive: '#ff5a00', emissiveIntensity: 0.2 })
const FISH_FIN = new MeshStandardMaterial({ color: '#ffa04a', roughness: 0.4, transparent: true, opacity: 0.9, side: DoubleSide })

/** A goldfish built head first along +x: eyes at the front, tail fin fanning out at the back. */
function Goldfish() {
  return (
    <>
      <mesh material={FISH_ORANGE} scale={[1.7, 1, 0.65]}>
        <sphereGeometry args={[0.04, 18, 14]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.05, 0.01, s * 0.019]}>
          <sphereGeometry args={[0.007, 10, 8]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      ))}
      {/* tail: narrow end into the body, flat fan behind */}
      <mesh material={FISH_FIN} position={[-0.085, 0, 0]} rotation={[0, 0, -PI / 2]} scale={[1, 1, 0.2]}>
        <coneGeometry args={[0.04, 0.05, 14]} />
      </mesh>
      <mesh material={FISH_FIN} position={[0, 0.042, 0]} rotation={[0, 0, -0.3]} scale={[1.4, 1, 0.15]}>
        <coneGeometry args={[0.016, 0.03, 10]} />
      </mesh>
    </>
  )
}

/** The TV swapped for a fish tank the same size, a goldfish doing lengths. */
export function FishTank() {
  const fish = useRef<Group>(null)
  const bubbles = useRef<(Mesh | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const f = fish.current
    if (f) {
      const c = Math.cos(t * 0.6)
      // facing the way it's swimming: yaw 0 heads +x, PI heads -x, turning round at each end
      const k = Math.min(1, Math.max(0, (c + 0.2) / 0.4))
      f.position.set(Math.sin(t * 0.6) * 0.33, 0.3 + Math.sin(t * 1.1) * 0.04, 0.02 + Math.sin(t * 0.37) * 0.04)
      f.rotation.set(0, PI * (1 - k), Math.sin(t * 1.1) * 0.1)
    }
    bubbles.current.forEach((b, i) => {
      if (b) b.position.y = 0.06 + ((t * 0.18 + i / 5) % 1) * (TANK.h - 0.1)
    })
  })
  return (
    <>
      <Block size={[TANK.w + 0.04, 0.05, TANK.d + 0.04]} position={[0, 0.025, 0]} color="#151618" roughness={0.4} radius={0.006} />
      <Block size={[TANK.w + 0.04, 0.04, TANK.d + 0.04]} position={[0, TANK.h + 0.07, 0]} color="#151618" roughness={0.4} radius={0.006} />
      {/* water, gravel and weed */}
      <mesh position={[0, 0.05 + (TANK.h - 0.04) / 2, 0]} renderOrder={1}>
        <boxGeometry args={[TANK.w - 0.01, TANK.h - 0.04, TANK.d - 0.01]} />
        <meshStandardMaterial color="#6fb3d8" transparent opacity={0.28} roughness={0.05} depthWrite={false} />
      </mesh>
      <Block size={[TANK.w - 0.02, 0.05, TANK.d - 0.02]} position={[0, 0.075, 0]} color="#b49a6a" roughness={1} radius={0.004} />
      {[-0.38, -0.3, 0.32, 0.4].map((x, i) => (
        <mesh key={x} position={[x, 0.1 + 0.1 + (i % 2) * 0.04, -0.08]} scale={[1, 1, 0.4]}>
          <coneGeometry args={[0.03, 0.2 + (i % 2) * 0.08, 8]} />
          <meshStandardMaterial color="#3d8a3a" roughness={0.7} />
        </mesh>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} ref={(m) => void (bubbles.current[i] = m)} position={[0.42, 0.1, 0.08]}>
          <sphereGeometry args={[0.008 + (i % 2) * 0.004, 8, 6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      ))}
      <group ref={fish}>
        <Goldfish />
      </group>
      {/* glass edges */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Block key={`${sx}${sz}`} size={[0.012, TANK.h, 0.012]} position={[sx * (TANK.w / 2), 0.05 + TANK.h / 2, sz * (TANK.d / 2)]} color="#151618" roughness={0.4} radius={0.003} />
        )),
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Sofa sleeper and the dartboard
// ---------------------------------------------------------------------------

const BLANKET = new MeshStandardMaterial({ color: '#4d6b8a', roughness: 1 })

/** Somebody fast asleep under a blanket on the sofa, curled up, slowly breathing. Nobody's face shows. In the sofa's space, seat at `seat`. */
export function Sleeper({ seat }: { seat: number }) {
  const body = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!body.current) return
    const k = Math.sin(clock.elapsedTime * 1.4)
    body.current.scale.set(1, 1 + k * 0.06, 1 + k * 0.03)
  })
  return (
    <group position={[0, seat, 0.08]}>
      {/* pillow against the arm */}
      <Block size={[0.36, 0.12, 0.3]} position={[0.62, 0.06, 0.02]} rotation={[0, 0, 0.35]} color="#efece4" roughness={0.9} radius={0.05} />
      <group ref={body}>
        <mesh material={BLANKET} position={[0.42, 0.11, 0]} scale={[0.2, 0.13, 0.2]} castShadow>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        <mesh material={BLANKET} position={[0.05, 0.13, 0.02]} scale={[0.36, 0.17, 0.25]} castShadow>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        <mesh material={BLANKET} position={[-0.42, 0.09, 0.04]} scale={[0.34, 0.11, 0.21]} castShadow>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
      </group>
    </group>
  )
}

/** The dartboard on its backboard, facing +z, the wall at z = 0; three darts in it, or a fire axe buried in the bull. */
export function Dartboard({ axe }: { axe: boolean }) {
  const map = useMemo(() => dartboardTexture(), [])
  const darts: Vec3[] = [
    [0.06, 0.1, 0],
    [-0.09, 0.03, 0],
    [0.02, -0.12, 0],
  ]
  return (
    <>
      <Block size={[0.7, 0.7, 0.02]} position={[0, 0, 0.01]} color="#1d1f22" roughness={0.8} radius={0.01} />
      <mesh position={[0, 0, 0.04]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.235, 0.235, 0.04, 48]} />
        <meshStandardMaterial color="#141414" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.0605]}>
        <circleGeometry args={[0.232, 48]} />
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
      {!axe &&
        darts.map((at, i) => (
          <group key={i} position={[at[0], at[1], 0.06]} rotation={[-0.1, 0.05 * i, 0]}>
            <mesh position={[0, 0, 0.05]} rotation={[PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.003, 0.1, 8]} />
              <meshStandardMaterial {...CHROME} />
            </mesh>
            {[0, PI / 2].map((r) => (
              <mesh key={r} position={[0, 0, 0.12]} rotation={[0, 0, r]}>
                <boxGeometry args={[0.04, 0.002, 0.04]} />
                <meshStandardMaterial color="#c8211b" roughness={0.5} />
              </mesh>
            ))}
          </group>
        ))}
      {axe && (
        // a fire axe chopped into the bull: blade buried, pick sticking out at you, the shaft hanging down the board
        <group position={[0, 0.02, 0.06]}>
          <Block size={[0.03, 0.17, 0.1]} position={[0, 0, 0.03]} color="#c8211b" roughness={0.4} metalness={0.3} radius={0.006} />
          <Block size={[0.04, 0.07, 0.06]} position={[0, 0, 0.1]} color="#c8211b" roughness={0.4} metalness={0.3} radius={0.008} />
          <mesh position={[0, 0, 0.2]} rotation={[PI / 2, 0, 0]}>
            <coneGeometry args={[0.022, 0.16, 12]} />
            <meshStandardMaterial color="#c8211b" roughness={0.4} metalness={0.3} />
          </mesh>
          <group position={[0, -0.03, 0.1]} rotation={[-0.12, 0, 0]}>
            <mesh position={[0, -0.34, 0]}>
              <cylinderGeometry args={[0.018, 0.02, 0.68, 12]} />
              <meshStandardMaterial color="#e8c21e" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.64, 0]}>
              <cylinderGeometry args={[0.023, 0.023, 0.1, 12]} />
              <meshStandardMaterial color="#1a1b1d" roughness={0.6} />
            </mesh>
          </group>
        </group>
      )}
    </>
  )
}

/** A radiator on the mess partition wall, facing +z. */
export function Radiator({ length }: { length: number }) {
  return (
    <>
      <Block size={[length, 0.55, 0.06]} position={[0, 0.42, 0.06]} color="#f1f1ee" roughness={0.4} radius={0.01} />
      {Array.from({ length: Math.floor(length / 0.06) }, (_, i) => (
        <Block key={i} size={[0.012, 0.5, 0.004]} position={[-length / 2 + 0.03 + i * 0.06, 0.42, 0.092]} color="#e4e4e0" roughness={0.4} radius={0.002} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.04, 0.15, 0.04]} position={[s * (length / 2 + 0.03), 0.12, 0.04]} {...CHROME} radius={0.008} />
      ))}
    </>
  )
}

/** The mess's own little board: takeaway menus and the tea fund. */
export function MessBoard() {
  const sign = useMemo(() => signTexture('TEA FUND £2', '#fff4a8', '#1b1b1b', 256, 80), [])
  return (
    <>
      <Block size={[0.9, 0.6, 0.02]} position={[0, 0, 0.01]} color="#7a5230" roughness={0.6} radius={0.006} />
      <Block size={[0.84, 0.54, 0.006]} position={[0, 0, 0.023]} color="#b98a57" roughness={0.9} radius={0.002} />
      <mesh position={[-0.2, 0.1, 0.027]} rotation={[0, 0, 0.05]}>
        <planeGeometry args={[0.32, 0.1]} />
        <meshStandardMaterial map={sign} roughness={0.6} />
      </mesh>
      {[
        [0.22, 0.08, '#d8241c'],
        [0.05, -0.12, '#f4f4f0'],
        [-0.25, -0.12, '#2a8a3a'],
      ].map(([x, y, c]) => (
        <Block key={c as string} size={[0.2, 0.26, 0.003]} position={[x as number, y as number, 0.028]} rotation={[0, 0, (x as number) * 0.3]} color={c as string} roughness={0.7} radius={0.001} />
      ))}
    </>
  )
}

/** Mess light fittings: flat panels flush with the ceiling. */
export function CeilingPanel() {
  return <Block size={[1.2, 0.03, 0.3]} position={[0, -0.015, 0]} color="#ffffff" emissive="#f4f8ff" emissiveIntensity={1.6} roughness={0.4} radius={0.004} />
}

