import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import {
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  LatheGeometry,
  MeshStandardMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import { Block, Instanced, PI, type Placement } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { Outside } from '../../outside'
import { Helmet, TrafficCone } from './gear'
import { BAY_DOOR, BAY_DOOR_WIDTH, dryKnotCurve, KNOT_HOSE, LAMP_SPOTS, MESS_DOOR, PANE_W, PANE_XS, ROOM } from './layout'
import {
  baySea,
  bayStreet,
  corkTexture,
  exitSignTexture,
  hoseEndTexture,
  posterTexture,
  rawBrickTexture,
  rosterTexture,
  signTexture,
  wiredGlassTexture,
} from './textures'

/*
 * Everything fixed to the bay's walls and ceiling: the hose rack, breathing
 * apparatus, shelving and mop sink along the equipment wall; the doors; the
 * boards; the high-bay lamps; and the odds and ends that never change.
 *
 * Each is built against a wall at z = 0, facing +z.
 */

const STEEL = { color: '#a9b0b6', metalness: 0.6, roughness: 0.4 }
const CHROME = { color: '#d5d9dd', metalness: 0.9, roughness: 0.25 }

// ---------------------------------------------------------------------------
// Hose rack: rolled lengths standing on edge, three shelves of them
// ---------------------------------------------------------------------------

const RACK = { width: 2.0, depth: 0.46, levels: [0.1, 0.65, 1.2], height: 1.68 }
const ROLL_R = 0.21
const ROLL_T = 0.075
const ROLL_STEP = 0.095
const ROLLS_PER_SHELF = Math.floor((RACK.width - 0.1) / ROLL_STEP)
const ROLL_GEO = new CylinderGeometry(ROLL_R, ROLL_R, ROLL_T, 28)
const HOSE_COLOURS = ['#efe6cf', '#c8302a', '#efe6cf', '#e0b82e']
/** The two rolls the swaps touch: [shelf, slot]. */
const KNOT_ROLL: [number, number] = [1, 9]
const LOOSE_ROLL: [number, number] = [2, 13]

const rollAt = (shelf: number, slot: number): Vec3 => [
  -RACK.width / 2 + 0.1 + slot * ROLL_STEP,
  RACK.levels[shelf] + 0.015 + ROLL_R,
  RACK.depth / 2 + 0.01,
]
const rollColour = (shelf: number, slot: number) => (slot * 7 + shelf * 3) % HOSE_COLOURS.length

function useHoseMaterials() {
  return useMemo(
    () =>
      HOSE_COLOURS.map((c) => {
        const side = new MeshStandardMaterial({ color: c, roughness: 0.8 })
        const end = new MeshStandardMaterial({ map: hoseEndTexture(c), roughness: 0.8 })
        return [side, end, end]
      }),
    [],
  )
}

function Roll({ shelf, slot }: { shelf: number; slot: number }) {
  const materials = useHoseMaterials()
  return <mesh geometry={ROLL_GEO} material={materials[rollColour(shelf, slot)]} position={rollAt(shelf, slot)} rotation={[0, 0, PI / 2]} />
}

/** The rack and every roll that never changes. */
export function HoseRack() {
  const materials = useHoseMaterials()
  const byColour = useMemo(() => {
    const out: Placement[][] = HOSE_COLOURS.map(() => [])
    RACK.levels.forEach((_, shelf) => {
      for (let slot = 0; slot < ROLLS_PER_SHELF; slot++) {
        if ((shelf === KNOT_ROLL[0] && slot === KNOT_ROLL[1]) || (shelf === LOOSE_ROLL[0] && slot === LOOSE_ROLL[1])) continue
        out[rollColour(shelf, slot)].push({ at: rollAt(shelf, slot), rot: [0, 0, PI / 2] })
      }
    })
    return out
  }, [])
  return (
    <>
      {[-1, 1].flatMap((sx) =>
        [0.03, RACK.depth - 0.03].map((z) => (
          <Block key={`${sx}${z}`} size={[0.04, RACK.height, 0.04]} position={[sx * (RACK.width / 2 - 0.02), RACK.height / 2, z]} {...STEEL} radius={0.004} paint />
        )),
      )}
      {RACK.levels.map((y) => (
        <group key={y}>
          <Block size={[RACK.width, 0.03, RACK.depth]} position={[0, y, RACK.depth / 2]} {...STEEL} radius={0.004} paint />
          {/* lip along the front so the rolls can't roll off */}
          <Block size={[RACK.width, 0.06, 0.02]} position={[0, y + 0.03, RACK.depth - 0.01]} {...STEEL} radius={0.004} paint />
        </group>
      ))}
      {byColour.map((items, c) => (
        <Instanced key={c} geometry={ROLL_GEO} material={materials[c]} items={items} />
      ))}
    </>
  )
}

const BOW_HOSE = '#c8302a'
const BOW_MAT = new MeshStandardMaterial({ color: BOW_HOSE, roughness: 0.8 })
const BOW_TAILS = [-1, 1].map(
  (s) =>
    new TubeGeometry(
      new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(s * 0.05, -0.12, 0.012), new Vector3(s * 0.11, -0.26, 0.004), new Vector3(s * 0.16, -0.36, 0)]),
      24,
      0.026,
      10,
    ),
)

/** A length of hose tied in a big bow, hung on the front of the rack. Built round the knot, facing +z. */
function HoseBow() {
  return (
    <>
      {/* the two loops, flattened like a ribbon */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={BOW_MAT} position={[s * 0.16, 0.03, 0]} rotation={[0, 0, s * 0.22]} scale={[1.35, 0.8, 0.45]} castShadow>
          <torusGeometry args={[0.11, 0.032, 12, 32]} />
        </mesh>
      ))}
      <mesh material={BOW_MAT} scale={[1, 1.1, 0.8]} castShadow>
        <sphereGeometry args={[0.05, 16, 12]} />
      </mesh>
      {BOW_TAILS.map((geo, i) => (
        <mesh key={i} geometry={geo} material={BOW_MAT} castShadow />
      ))}
      {/* a brass coupling on each end */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.165, -0.39, 0]} rotation={[0, 0, s * 0.45]}>
          <cylinderGeometry args={[0.032, 0.032, 0.07, 16]} />
          <meshStandardMaterial color="#d4a94a" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </>
  )
}

/** The two rolls the swaps touch: one is untied and done up in a bow on the front of the rack, the other unrolled down to the floor. */
export function HoseRolls({ mode }: { mode: 'default' | 'bow' | 'unrolled' }) {
  const [ks, kslot] = KNOT_ROLL
  const [ls, lslot] = LOOSE_ROLL
  const loose = rollAt(ls, lslot)
  return (
    <>
      {mode === 'bow' ? (
        <group position={[rollAt(ks, kslot)[0], RACK.levels[ks] + 0.26, RACK.depth + 0.075]}>
          <HoseBow />
        </group>
      ) : (
        <Roll shelf={ks} slot={kslot} />
      )}
      {mode === 'unrolled' ? (
        <group position={[loose[0], 0, 0]}>
          {/* what's left of the roll, the hose over the lip, down the front and out across the floor */}
          <mesh geometry={ROLL_GEO} position={[0, RACK.levels[ls] + 0.1, RACK.depth / 2]} rotation={[0, 0, PI / 2]} scale={[0.45, 1, 0.45]}>
            <meshStandardMaterial color={HOSE_COLOURS[rollColour(ls, lslot)]} roughness={0.8} />
          </mesh>
          <Block size={[0.075, 0.008, 0.28]} position={[0, RACK.levels[ls] + 0.07, RACK.depth - 0.1]} color={HOSE_COLOURS[rollColour(ls, lslot)]} roughness={0.8} radius={0.003} />
          <Block size={[0.075, RACK.levels[ls] + 0.06, 0.008]} position={[0, (RACK.levels[ls] + 0.06) / 2, RACK.depth + 0.02]} color={HOSE_COLOURS[rollColour(ls, lslot)]} roughness={0.8} radius={0.003} />
          <Block size={[0.075, 0.008, 0.95]} position={[0.02, 0.004, RACK.depth + 0.5]} rotation={[0, 0.12, 0]} color={HOSE_COLOURS[rollColour(ls, lslot)]} roughness={0.8} radius={0.003} />
          <mesh position={[0.08, 0.04, RACK.depth + 0.98]} rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.09, 16]} />
            <meshStandardMaterial color="#d4a94a" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ) : (
        <Roll shelf={ls} slot={lslot} />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Breathing apparatus sets on a wall board
// ---------------------------------------------------------------------------

const BA_XS = [-0.66, -0.22, 0.22, 0.66]
const BA_BALLOON = 1
const BA_SNORKEL = 2
const CYL = new CylinderGeometry(0.085, 0.085, 0.5, 24)
const CYL_MAT = new MeshStandardMaterial({ color: '#c4c9ce', metalness: 0.75, roughness: 0.3 })
const RUBBER = new MeshStandardMaterial({ color: '#141518', roughness: 0.6 })
const VISOR = new MeshStandardMaterial({ color: '#cfe6ff', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.45 })

function BaCylinder() {
  return (
    <group position={[0, 1.27, 0.16]}>
      <mesh geometry={CYL} material={CYL_MAT} castShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} material={CYL_MAT} position={[0, s * 0.25, 0]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.085, 20, 10, 0, PI * 2, s > 0 ? 0 : PI / 2, PI / 2]} />
        </mesh>
      ))}
      {/* valve at the bottom, the way they're carried */}
      <Block size={[0.05, 0.08, 0.05]} position={[0, -0.33, 0]} {...CHROME} radius={0.01} />
      <mesh material={RUBBER} position={[0, -0.36, 0.04]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
      </mesh>
      <Block size={[0.18, 0.04, 0.18]} position={[0, 0.05, 0]} color="#141518" roughness={0.6} radius={0.01} />
    </group>
  )
}

function BaMask() {
  return (
    <group position={[0, 1.62, 0.12]}>
      <mesh material={RUBBER} scale={[1, 1.25, 0.6]}>
        <sphereGeometry args={[0.1, 24, 16]} />
      </mesh>
      <mesh material={VISOR} position={[0, 0.02, 0.03]} scale={[0.92, 1.1, 0.6]}>
        <sphereGeometry args={[0.1, 24, 16, PI * 0.15, PI * 0.7, PI * 0.15, PI * 0.5]} />
      </mesh>
      <mesh position={[0, -0.08, 0.06]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.03, 0.06, 16]} />
        <meshStandardMaterial color="#d8241c" roughness={0.5} />
      </mesh>
    </group>
  )
}

/** A balloon tied to the harness where the cylinder should be, bobbing. */
function BaBalloon() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = 1.95 + Math.sin(t * 1.3) * 0.03
    ref.current.rotation.z = Math.sin(t * 0.8) * 0.08
  })
  return (
    <>
      <mesh position={[0, 1.55, 0.28]} rotation={[-0.5, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.45, 6]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>
      <group ref={ref} position={[0, 1.95, 0.36]}>
        <mesh scale={[1, 1.22, 1]} castShadow>
          <sphereGeometry args={[0.13, 28, 20]} />
          <meshStandardMaterial color="#e0262a" roughness={0.15} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.165, 0]}>
          <coneGeometry args={[0.02, 0.03, 10]} />
          <meshStandardMaterial color="#e0262a" roughness={0.15} />
        </mesh>
      </group>
    </>
  )
}

/** Diving goggles and a snorkel hung up in place of the mask. */
function Snorkel() {
  return (
    <group position={[0, 1.62, 0.12]}>
      <Block size={[0.2, 0.11, 0.05]} color="#1aa0d8" roughness={0.5} radius={0.03} />
      <mesh material={VISOR} position={[0, 0, 0.028]}>
        <planeGeometry args={[0.16, 0.075]} />
      </mesh>
      <mesh position={[0.13, 0.05, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.36, 12]} />
        <meshStandardMaterial color="#ffde21" roughness={0.4} />
      </mesh>
      <mesh position={[0.1, -0.14, 0.02]} rotation={[0, 0, PI / 2]}>
        <torusGeometry args={[0.03, 0.015, 8, 16, PI]} />
        <meshStandardMaterial color="#ffde21" roughness={0.4} />
      </mesh>
    </group>
  )
}

function BaHarness() {
  return (
    <>
      <Block size={[0.3, 0.64, 0.035]} position={[0, 1.27, 0.05]} color="#1c1d20" roughness={0.5} radius={0.02} />
      {[-0.09, 0.09].map((x) => (
        <Block key={x} size={[0.05, 0.58, 0.02]} position={[x, 1.3, 0.255]} color="#25272b" roughness={0.8} radius={0.005} />
      ))}
      <Block size={[0.34, 0.07, 0.04]} position={[0, 0.98, 0.1]} color="#25272b" roughness={0.8} radius={0.01} />
      <Block size={[0.05, 0.06, 0.06]} position={[0, 1.66, 0.04]} {...CHROME} radius={0.01} />
    </>
  )
}

/** The board and the sets that never change. */
export function BaBoard() {
  return (
    <>
      <Block size={[1.8, 0.98, 0.03]} position={[0, 1.33, 0.015]} color="#4f5b66" roughness={0.6} radius={0.008} paint />
      {BA_XS.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <BaHarness />
          {i !== BA_BALLOON && <BaCylinder />}
          {i !== BA_SNORKEL && <BaMask />}
        </group>
      ))}
    </>
  )
}

/** The cylinder and the mask the swaps touch. */
export function BaParts({ mode }: { mode: 'default' | 'balloon' | 'snorkel' }) {
  return (
    <>
      <group position={[BA_XS[BA_BALLOON], 0, 0]}>{mode === 'balloon' ? <BaBalloon /> : <BaCylinder />}</group>
      <group position={[BA_XS[BA_SNORKEL], 0, 0]}>{mode === 'snorkel' ? <Snorkel /> : <BaMask />}</group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Equipment shelf
// ---------------------------------------------------------------------------

const SHELF = { width: 1.6, depth: 0.5, levels: [0.1, 0.6, 1.1, 1.6], height: 2.0 }

export function EquipmentShelf() {
  return (
    <>
      {[-1, 1].flatMap((sx) =>
        [0.02, SHELF.depth - 0.02].map((z) => (
          <Block key={`${sx}${z}`} size={[0.04, SHELF.height, 0.04]} position={[sx * (SHELF.width / 2 - 0.02), SHELF.height / 2, z]} {...STEEL} radius={0.004} paint />
        )),
      )}
      {SHELF.levels.map((y) => (
        <Block key={y} size={[SHELF.width, 0.025, SHELF.depth]} position={[0, y, SHELF.depth / 2]} {...STEEL} radius={0.004} paint />
      ))}
      {/* bottom: foam drums and folded salvage sheets */}
      {[-0.62, -0.36].map((x) => (
        <group key={x}>
          <Block size={[0.22, 0.34, 0.3]} position={[x, 0.1125 + 0.17, 0.25]} color="#f2c500" roughness={0.6} radius={0.03} />
          <Block size={[0.08, 0.04, 0.03]} position={[x, 0.1125 + 0.36, 0.2]} color="#f2c500" roughness={0.6} radius={0.01} />
        </group>
      ))}
      <Block size={[0.6, 0.2, 0.4]} position={[0.35, 0.2125, 0.25]} color="#3d6b3a" roughness={0.9} radius={0.04} />
      {/* third shelf: torches and tape */}
      {[-0.65, -0.52, -0.39].map((x) => (
        <group key={x}>
          <Block size={[0.09, 0.2, 0.12]} position={[x, 1.1125 + 0.1, 0.22]} color="#f2c500" roughness={0.5} radius={0.02} />
          <mesh position={[x, 1.1125 + 0.16, 0.29]} rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
            <meshStandardMaterial color="#fffbe6" roughness={0.1} />
          </mesh>
        </group>
      ))}
      {[-0.1, 0.08].map((x) => (
        <mesh key={x} position={[x, 1.1125 + 0.05, 0.25]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.1, 24]} />
          <meshStandardMaterial color={x < 0 ? '#d8241c' : '#f4f4f0'} roughness={0.5} />
        </mesh>
      ))}
      {/* top: spare helmets and a line bag */}
      {[-0.45, -0.1].map((x) => (
        <group key={x} position={[x, 1.6125, 0.25]}>
          <Helmet colour="#f4f4f0" />
        </group>
      ))}
      <mesh position={[0.4, 1.6125 + 0.13, 0.25]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.26, 24]} />
        <meshStandardMaterial color="#c8211b" roughness={0.8} />
      </mesh>
    </>
  )
}

/** Second shelf: a delivery of boxes (cleared in one swap) and the spot where a stone cat turns up. */
export function ShelfStock({ mode }: { mode: 'default' | 'cat' | 'empty' }) {
  return (
    <>
      {mode !== 'empty' &&
        [-0.42, 0.18].map((x, i) => (
          <Model key={x} id="cardboard_box_01" position={[x, 0.6125, 0.25]} rotation={[0, PI / 2 + (i ? 0.06 : -0.04), 0]} />
        ))}
      {mode === 'cat' && <Model id="concrete_cat_statue" position={[0.45, 1.1125, 0.25]} rotation={[0, -0.3, 0]} paint={false} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Mop sink
// ---------------------------------------------------------------------------

const SINK = { width: 0.6, depth: 0.45, y0: 0.5, y1: 0.85 }
const STAINLESS = { color: '#c7ccd1', metalness: 0.8, roughness: 0.28 }
const WATER = new MeshStandardMaterial({ color: '#6fa9cf', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.55 })

export function MopSink() {
  const { width: w, depth: d, y0, y1 } = SINK
  const h = y1 - y0
  return (
    <>
      <Block size={[w, 0.03, d]} position={[0, y0 + 0.015, d / 2]} {...STAINLESS} radius={0.006} />
      <Block size={[w, h, 0.03]} position={[0, y0 + h / 2, 0.015]} {...STAINLESS} radius={0.006} />
      <Block size={[w, h, 0.03]} position={[0, y0 + h / 2, d - 0.015]} {...STAINLESS} radius={0.006} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, h, d]} position={[s * (w / 2 - 0.015), y0 + h / 2, d / 2]} {...STAINLESS} radius={0.006} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.04, y0, 0.04]} position={[s * (w / 2 - 0.04), y0 / 2, d - 0.05]} {...STAINLESS} radius={0.006} />
      ))}
      {/* bucket grate across the front */}
      <Block size={[w - 0.06, 0.02, 0.16]} position={[0, y1 - 0.05, d - 0.11]} {...STAINLESS} radius={0.004} />
      {/* wall tap */}
      <Block size={[0.06, 0.06, 0.08]} position={[0, 1.1, 0.04]} {...CHROME} radius={0.01} />
      <mesh position={[0, 1.1, 0.15]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.18, 12]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <mesh position={[0, 1.07, 0.235]}>
        <cylinderGeometry args={[0.014, 0.012, 0.06, 12]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.08, 0.02, 0.02]} position={[s * 0.09, 1.16, 0.05]} color={s < 0 ? '#c8211b' : '#1f5fbf'} roughness={0.4} radius={0.005} />
      ))}
    </>
  )
}

/** A running tap: a thin stream and rings spreading where it lands. */
function TapRunning() {
  const ring = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (!ring.current) return
    const k = (clock.elapsedTime * 1.8) % 1
    ring.current.scale.setScalar(0.4 + k * 1.6)
    ;(ring.current.material as MeshStandardMaterial).opacity = 0.6 * (1 - k)
  })
  return (
    <>
      <mesh material={WATER} position={[0, (1.04 + SINK.y0 + 0.04) / 2, 0.235]}>
        <cylinderGeometry args={[0.008, 0.011, 1.04 - SINK.y0 - 0.04, 10]} />
      </mesh>
      <mesh material={WATER} position={[0, SINK.y0 + 0.05, SINK.depth / 2]} rotation={[-PI / 2, 0, 0]}>
        <planeGeometry args={[SINK.width - 0.06, SINK.depth - 0.06]} />
      </mesh>
      <mesh ref={ring} position={[0, SINK.y0 + 0.052, 0.235]} rotation={[-PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.04, 24]} />
        <meshStandardMaterial color="#e8f4ff" transparent opacity={0.5} />
      </mesh>
    </>
  )
}

/** The sink full of water with a rubber duck bobbing in it. */
function SinkDuck() {
  const duck = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!duck.current) return
    const t = clock.elapsedTime
    duck.current.position.y = SINK.y0 + 0.2 + Math.sin(t * 1.7) * 0.006
    duck.current.rotation.y = 0.5 + Math.sin(t * 0.4) * 0.6
  })
  return (
    <>
      <mesh material={WATER} position={[0, SINK.y0 + 0.24, SINK.depth / 2]} rotation={[-PI / 2, 0, 0]}>
        <planeGeometry args={[SINK.width - 0.06, SINK.depth - 0.06]} />
      </mesh>
      <group ref={duck} position={[0.05, SINK.y0 + 0.2, SINK.depth / 2]}>
        <Model id="rubber_duck_toy" scale={0.45} paint={false} />
      </group>
    </>
  )
}

export function SinkContents({ mode }: { mode: 'default' | 'running' | 'duck' }) {
  if (mode === 'running') return <TapRunning />
  if (mode === 'duck') return <SinkDuck />
  // a scrubbing brush left on the grate
  return <Block size={[0.18, 0.04, 0.06]} position={[0.12, SINK.y1 - 0.02, SINK.depth - 0.11]} color="#2f6bd8" roughness={0.6} radius={0.01} />
}

// ---------------------------------------------------------------------------
// Doors
// ---------------------------------------------------------------------------

const MESS_BLUE = '#41607a'
/** How far short of flat against the wall the open leaf stops. */
const HELD = 0.06

/** A cat flap with its flap still swinging, as if something has just gone through. Centred on the leaf, through its thickness. */
function CatFlap() {
  const flap = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!flap.current) return
    const t = clock.elapsedTime % 5
    flap.current.rotation.x = Math.sin(t * 7) * 0.7 * Math.exp(-t * 0.9)
  })
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.26, 0.26, 0.012]} position={[0, 0, s * 0.029]} color="#f0ede6" roughness={0.4} radius={0.01} />
      ))}
      <mesh>
        <boxGeometry args={[0.2, 0.2, 0.047]} />
        <meshStandardMaterial color="#1a1512" roughness={0.9} />
      </mesh>
      {/* the flap hangs from its top edge on the pull side, the one that faces the bay when the door is open */}
      <group ref={flap} position={[0, 0.095, -0.04]}>
        <mesh position={[0, -0.095, 0]}>
          <boxGeometry args={[0.19, 0.19, 0.005]} />
          <meshStandardMaterial color="#7a5a3a" roughness={0.2} />
        </mesh>
      </group>
    </>
  )
}

/**
 * The fire door to the mess, hinged on its left (seen from the bay) and held
 * open flat against the wall so the crew can come and go. `inwards` has it
 * swung the other way, back against the wall inside the mess. Item space: the
 * bay face of the wall at z = 0, the mess face at z = -wall.
 */
export function MessDoor({ mode, wall }: { mode: 'default' | 'flap' | 'inwards'; wall: number }) {
  const { width: w, height: h } = MESS_DOOR
  const wire = useMemo(() => {
    const t = wiredGlassTexture()
    t.repeat.set(0.3 / 0.025, 0.6 / 0.025)
    return t
  }, [])
  const plaque = useMemo(() => signTexture('MESS', '#f4f4f0', '#1b1b1b'), [])
  const leaf = { color: MESS_BLUE, roughness: 0.5 }
  const inwards = mode === 'inwards'
  // the hinge sits just proud of whichever face of the wall the leaf folds back against
  const pivot: Vec3 = inwards ? [-w / 2, 0, -wall - 0.105] : [-w / 2, 0, 0.105]
  return (
    <group position={pivot} rotation={[0, inwards ? PI - HELD : -(PI - HELD), 0]}>
      {/* the leaf, built round the vision panel */}
      <Block size={[w, 1.2, 0.045]} position={[w / 2, 0.6, 0]} {...leaf} radius={0.006} paint />
      <Block size={[w, h - 1.8, 0.045]} position={[w / 2, (1.8 + h) / 2, 0]} {...leaf} radius={0.006} paint />
      <Block size={[0.3, 0.6, 0.045]} position={[0.15, 1.5, 0]} {...leaf} radius={0.006} paint />
      <Block size={[0.3, 0.6, 0.045]} position={[w - 0.15, 1.5, 0]} {...leaf} radius={0.006} paint />
      <mesh position={[w / 2, 1.5, 0]} renderOrder={2}>
        <planeGeometry args={[0.3, 0.6]} />
        <meshStandardMaterial map={wire} color="#dfe9ee" transparent opacity={0.35} roughness={0.05} depthWrite={false} side={DoubleSide} />
      </mesh>
      {/* push side: kick plate and finger plate */}
      <Block size={[w - 0.1, 0.25, 0.006]} position={[w / 2, 0.15, 0.025]} {...CHROME} radius={0.003} />
      <Block size={[0.1, 0.3, 0.006]} position={[w - 0.12, 1.1, 0.025]} {...CHROME} radius={0.003} />
      {/* pull side: kick plate and a pull handle */}
      <Block size={[w - 0.1, 0.25, 0.006]} position={[w / 2, 0.15, -0.025]} {...CHROME} radius={0.003} />
      <Block size={[0.03, 0.3, 0.025]} position={[w - 0.1, 1.05, -0.06]} {...CHROME} radius={0.008} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.025, 0.02, 0.04]} position={[w - 0.1, 1.05 + s * 0.12, -0.04]} {...CHROME} radius={0.005} />
      ))}
      {/* the name plate on both faces */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[w / 2, 1.92, s * 0.024]} rotation={[0, s > 0 ? 0 : PI, 0]}>
          <planeGeometry args={[0.3, 0.11]} />
          <meshStandardMaterial map={plaque} roughness={0.5} />
        </mesh>
      ))}
      {mode === 'flap' && (
        <group position={[w / 2, 0.3, 0]}>
          <CatFlap />
        </group>
      )}
    </group>
  )
}

/** The lining and architraves round the doorway through to the mess, in the door's space (as MessDoor). */
export function MessDoorway({ wall }: { wall: number }) {
  const { width: w, height: h } = MESS_DOOR
  const trim = { color: '#e8e4da', roughness: 0.5 }
  const open = w + 0.12
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, h + 0.06, wall]} position={[s * (w / 2 + 0.03), (h + 0.06) / 2, -wall / 2]} {...trim} radius={0.004} />
      ))}
      <Block size={[open, 0.06, wall]} position={[0, h + 0.03, -wall / 2]} {...trim} radius={0.004} />
      {[0.0125, -wall - 0.0125].map((z) => (
        <group key={z}>
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.07, h + 0.13, 0.025]} position={[s * (open / 2 + 0.035), (h + 0.13) / 2, z]} {...trim} radius={0.004} />
          ))}
          <Block size={[open + 0.14, 0.07, 0.025]} position={[0, h + 0.095, z]} {...trim} radius={0.004} />
        </group>
      ))}
      {/* the hold-open magnet on the bay wall, where the open leaf's handle edge rests */}
      <Block size={[0.07, 0.07, 0.12]} position={[-w / 2 - w + 0.1, 0.25, 0.06]} color="#8d949a" metalness={0.5} roughness={0.4} radius={0.008} />
    </>
  )
}

/** The folding bay doors: four red leaves with a band of windows onto the street. */
export function BayDoor() {
  const { leaves, leaf, height, glassY, glassH } = BAY_DOOR
  const red = { color: '#b5181d', roughness: 0.45, metalness: 0.3 }
  return (
    <>
      {Array.from({ length: leaves }, (_, i) => {
        const x = (i - (leaves - 1) / 2) * leaf
        return (
          <group key={i} position={[x, 0, 0]}>
            <Block size={[leaf - 0.02, glassY, 0.06]} position={[0, glassY / 2, 0.03]} {...red} radius={0.008} paint />
            <Block size={[leaf - 0.02, height - glassY - glassH, 0.06]} position={[0, (glassY + glassH + height) / 2, 0.03]} {...red} radius={0.008} paint />
            {[-0.5, 0, 0.5].map((mx) => (
              <Block key={mx} size={[0.08, glassH, 0.06]} position={[mx, glassY + glassH / 2, 0.03]} {...red} radius={0.004} paint />
            ))}
            {/* pressed panels */}
            {[0.5, 1.0, 1.5, 2.0].map((y) => (
              <Block key={y} size={[leaf - 0.14, 0.02, 0.008]} position={[0, y, 0.064]} color="#8e1216" roughness={0.5} radius={0.003} />
            ))}
            <Block size={[leaf - 0.02, 0.05, 0.08]} position={[0, 0.025, 0.04]} color="#1a1b1d" roughness={0.8} radius={0.004} />
          </group>
        )
      })}
      {/* hinges between the leaves, and the handles on the middle pair */}
      {Array.from({ length: leaves - 1 }, (_, i) => (
        <Block key={i} size={[0.035, height - 0.1, 0.075]} position={[(i + 1 - leaves / 2) * leaf, height / 2, 0.035]} color="#2a2d31" roughness={0.5} metalness={0.5} radius={0.006} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.04, 0.6, 0.05]} position={[s * 0.12, 1.15, 0.09]} {...CHROME} radius={0.01} />
      ))}
      {/* frame and the track housing */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.1, height, 0.16]} position={[s * (BAY_DOOR_WIDTH / 2 + 0.05), height / 2, 0.08]} color="#3b3f44" roughness={0.5} metalness={0.4} radius={0.01} />
      ))}
      <Block size={[BAY_DOOR_WIDTH + 0.2, 0.3, 0.22]} position={[0, height + 0.15, 0.11]} color="#3b3f44" roughness={0.5} metalness={0.4} radius={0.01} />
    </>
  )
}

/** The view through the door windows (the wall behind has a hole for each pane); `bricked` fills one pane in. */
export function BayWindows({ view, bricked = false }: { view: 'day' | 'underwater'; bricked?: boolean }) {
  const brick = useMemo(() => (bricked ? rawBrickTexture() : null), [bricked])
  return (
    <>
      <Outside layers={view === 'day' ? bayStreet() : baySea()} />
      {PANE_XS.map((x, i) =>
        brick && i === 3 ? (
          <mesh key={x} position={[x, BAY_DOOR.glassY + BAY_DOOR.glassH / 2, 0.03]}>
            <planeGeometry args={[PANE_W, BAY_DOOR.glassH]} />
            <meshStandardMaterial map={brick} roughness={0.9} />
          </mesh>
        ) : (
          // glass sheen
          <mesh key={x} position={[x, BAY_DOOR.glassY + BAY_DOOR.glassH / 2, 0.03]} renderOrder={2}>
            <planeGeometry args={[PANE_W, BAY_DOOR.glassH]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} clearcoat={1} depthWrite={false} />
          </mesh>
        ),
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Boards on the back wall
// ---------------------------------------------------------------------------

export function Roster({ mode }: { mode: 'normal' | 'you' | 'clean' }) {
  const map = useMemo(() => rosterTexture(mode), [mode])
  return (
    <mesh position={[0, 0, 0.031]}>
      <planeGeometry args={[1.6, 1.1]} />
      <meshStandardMaterial map={map} roughness={0.25} />
    </mesh>
  )
}

/** Whiteboard frame and pen tray (the writing is the swap). */
export function RosterFrame() {
  return (
    <>
      <Block size={[1.66, 1.16, 0.03]} position={[0, 0, 0.015]} {...CHROME} radius={0.008} />
      <Block size={[1.0, 0.03, 0.07]} position={[0, -0.6, 0.05]} {...CHROME} radius={0.006} />
      {['#c8211b', '#1d3fb8', '#111'].map((c, i) => (
        <mesh key={c} position={[-0.2 + i * 0.13, -0.57, 0.06]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 10]} />
          <meshStandardMaterial color={c} roughness={0.5} />
        </mesh>
      ))}
    </>
  )
}

export function NoticeBoard() {
  const cork = useMemo(() => corkTexture(), [])
  return (
    <>
      <Block size={[1.26, 0.86, 0.03]} position={[0, 0, 0.015]} color="#7a5230" roughness={0.6} radius={0.008} />
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial map={cork} roughness={0.9} />
      </mesh>
    </>
  )
}

/** The big poster pinned on the right of the notice board. */
export function Poster({ kind, upside = false }: { kind: 'smoke' | 'missing'; upside?: boolean }) {
  const map = useMemo(() => posterTexture(kind), [kind])
  return (
    <group position={[0.36, 0.0, 0.034]} rotation={[0, 0, upside ? PI : 0]}>
      <mesh>
        <planeGeometry args={[0.32, 0.43]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.13, 0.19, 0.006]}>
          <sphereGeometry args={[0.012, 10, 8]} />
          <meshStandardMaterial color="#d8241c" roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// High-bay lamps
// ---------------------------------------------------------------------------

const LAMP_DROP = 0.45
const SWING_LAMP = 3
const DEAD_LAMP = 4
const LAMP_BODY = new MeshStandardMaterial({ color: '#2f3439', metalness: 0.6, roughness: 0.45 })
/** The shade: a short neck, a shoulder, then a wide flared bell. Closed on top, open below, drawn both sides so the inside shows. */
const SHADE = new LatheGeometry(
  [
    [0.0, 0.0],
    [0.07, 0.0],
    [0.075, -0.05],
    [0.12, -0.07],
    [0.2, -0.12],
    [0.255, -0.175],
  ].map(([r, y]) => new Vector2(r, y)),
  32,
)
const SHADE_MAT = new MeshStandardMaterial({ color: '#2f3439', metalness: 0.6, roughness: 0.45, side: DoubleSide })
/** The white enamel inside the bell, and the bright lens across the mouth. */
const REFLECTOR = new LatheGeometry(
  [
    [0.25, -0.172],
    [0.195, -0.118],
    [0.115, -0.07],
    [0.0, -0.07],
  ].map(([r, y]) => new Vector2(r, y)),
  32,
)
const LIP = new TorusGeometry(0.255, 0.01, 8, 40)
const ROSE = new CylinderGeometry(0.07, 0.07, 0.03, 20)

function Lamp({ lit = true }: { lit?: boolean }) {
  return (
    <>
      {/* ceiling rose and the drop rod */}
      <mesh geometry={ROSE} material={LAMP_BODY} position={[0, -0.015, 0]} />
      <mesh position={[0, -LAMP_DROP / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, LAMP_DROP, 8]} />
        <meshStandardMaterial color="#3b3f44" metalness={0.6} roughness={0.4} />
      </mesh>
      <group position={[0, -LAMP_DROP, 0]}>
        <mesh geometry={SHADE} material={SHADE_MAT} />
        <mesh geometry={REFLECTOR}>
          <meshStandardMaterial color={lit ? '#f1f1ec' : '#7d8389'} emissive="#f4f8ff" emissiveIntensity={lit ? 0.5 : 0} roughness={0.35} side={DoubleSide} />
        </mesh>
        <mesh geometry={LIP} material={LAMP_BODY} position={[0, -0.175, 0]} rotation={[PI / 2, 0, 0]} />
        {/* the lamp itself, a glowing dome filling the middle of the bell */}
        <mesh position={[0, -0.07, 0]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.17, 28, 12, 0, PI * 2, PI / 2, PI / 2]} />
          <meshStandardMaterial color={lit ? '#ffffff' : '#9aa0a6'} emissive="#f4f8ff" emissiveIntensity={lit ? 2.4 : 0} roughness={0.4} />
        </mesh>
      </group>
    </>
  )
}

function Swinging({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.set(Math.sin(t * 1.9) * 0.05, 0, Math.sin(t * 1.9 + 0.4) * 0.2)
  })
  return <group ref={ref}>{children}</group>
}

/** Every lamp that never changes. */
export function Lamps() {
  return (
    <>
      {LAMP_SPOTS.map(([x, z], i) =>
        i === SWING_LAMP || i === DEAD_LAMP ? null : (
          <group key={i} position={[x, ROOM.height, z]}>
            <Lamp />
          </group>
        ),
      )}
    </>
  )
}

/** The two lamps the swaps touch: one swings on its rod, the other goes out. */
export function LampPair({ mode }: { mode: 'default' | 'swinging' | 'out' }) {
  const [sx, sz] = LAMP_SPOTS[SWING_LAMP]
  const [dx, dz] = LAMP_SPOTS[DEAD_LAMP]
  return (
    <>
      <group position={[sx, ROOM.height, sz]}>
        {mode === 'swinging' ? (
          <Swinging>
            <Lamp />
          </Swinging>
        ) : (
          <Lamp />
        )}
      </group>
      <group position={[dx, ROOM.height, dz]}>
        <Lamp lit={mode !== 'out'} />
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Red herrings
// ---------------------------------------------------------------------------

export function ConeStack() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0, i * 0.07, 0]}>
          <TrafficCone h={0.72} />
        </group>
      ))}
    </>
  )
}

export function SpillKit() {
  const label = useMemo(() => signTexture('SPILL KIT', '#f2c500', '#111', 256, 80), [])
  return (
    <>
      <Block size={[0.58, 0.92, 0.55]} position={[0, 0.5, 0]} color="#f2c500" roughness={0.55} radius={0.03} />
      <Block size={[0.62, 0.05, 0.6]} position={[0, 0.985, -0.01]} color="#d9ad00" roughness={0.55} radius={0.02} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.22, 0.06, -0.24]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
          <meshStandardMaterial color="#1a1b1d" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0.277]}>
        <planeGeometry args={[0.4, 0.125]} />
        <meshStandardMaterial map={label} roughness={0.5} />
      </mesh>
    </>
  )
}

const DRY_COLOURS = ['#efe6cf', '#c8302a', '#efe6cf', '#e0b82e', '#efe6cf']
const DRY_TOP = 3.5
const dryX = (i: number) => -0.4 + i * 0.2
const dryLength = (i: number) => 2.9 - (i % 2) * 0.25

/** Hose lengths hung doubled over a high rail to drain and dry. `knot`: the front half of one is tied in a fat overhand knot at head height. */
export function DryingRack({ knot }: { knot: boolean }) {
  const knotted = useMemo(() => (knot ? new TubeGeometry(dryKnotCurve(dryX(KNOT_HOSE), DRY_TOP, DRY_TOP - dryLength(KNOT_HOSE)), 420, 0.04, 14, false) : null), [knot])
  return (
    <>
      <Block size={[1.1, 0.06, 0.06]} position={[0, DRY_TOP, 0.12]} {...STEEL} radius={0.006} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.05, 0.1, 0.12]} position={[s * 0.5, DRY_TOP, 0.06]} {...STEEL} radius={0.006} />
      ))}
      {DRY_COLOURS.map((c, i) => {
        const len = dryLength(i)
        return (
          <group key={i} position={[dryX(i), 0, 0.12]}>
            {[-1, 1].map((s) =>
              knotted && i === KNOT_HOSE && s > 0 ? null : (
                <Block key={s} size={[0.075, len, 0.008]} position={[0, DRY_TOP - len / 2, s * 0.035]} color={c} roughness={0.8} radius={0.003} />
              ),
            )}
            <mesh position={[0, DRY_TOP - len - 0.04, 0.035]}>
              <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
              <meshStandardMaterial color="#d4a94a" metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        )
      })}
      {knotted && (
        <mesh geometry={knotted} castShadow>
          <meshStandardMaterial color={DRY_COLOURS[KNOT_HOSE]} roughness={0.75} />
        </mesh>
      )}
    </>
  )
}

export function MopBucket() {
  return (
    <>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.32, 24, 1, true]} />
        <meshStandardMaterial color="#f2c500" roughness={0.5} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 24]} />
        <meshStandardMaterial color="#f2c500" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-PI / 2, 0, 0]}>
        <circleGeometry args={[0.165, 24]} />
        <meshStandardMaterial color="#6d6a55" roughness={0.1} />
      </mesh>
      <Block size={[0.22, 0.12, 0.12]} position={[0, 0.36, -0.08]} color="#d9ad00" roughness={0.5} radius={0.02} />
      {/* the mop, leaning back against the wall */}
      <group position={[0.04, 0.2, 0.02]} rotation={[0.14, 0, 0]}>
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.013, 0.013, 1.3, 10]} />
          <meshStandardMaterial color="#2f6bd8" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.09, 12, 8]} />
          <meshStandardMaterial color="#d8d2c0" roughness={1} />
        </mesh>
      </group>
    </>
  )
}

export function ExitSign() {
  const map = useMemo(() => exitSignTexture(), [])
  return (
    <>
      <Block size={[0.4, 0.16, 0.05]} position={[0, 0, 0.025]} color="#f4f4f0" roughness={0.4} radius={0.008} />
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[0.36, 0.135]} />
        <meshStandardMaterial map={map} emissive="#ffffff" emissiveMap={map} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
    </>
  )
}

/** The turnout printer on its wall shelf, which has printed so many shouts the paper reaches the floor. */
export function TurnoutPrinter() {
  const label = useMemo(() => signTexture('TURNOUT', '#c8211b', '#ffffff', 256, 64), [])
  return (
    <>
      <Block size={[0.46, 0.03, 0.36]} position={[0, 1.15, 0.18]} color="#8d949a" roughness={0.5} metalness={0.4} radius={0.004} />
      <Block size={[0.4, 0.17, 0.3]} position={[0, 1.25, 0.16]} color="#e9e9e4" roughness={0.5} radius={0.02} />
      <Block size={[0.3, 0.02, 0.06]} position={[0, 1.34, 0.26]} color="#2a2d31" roughness={0.5} radius={0.006} />
      <mesh position={[0, 1.46, 0.004]}>
        <planeGeometry args={[0.3, 0.075]} />
        <meshStandardMaterial map={label} roughness={0.5} />
      </mesh>
      {/* paper out of the front, down to the floor, and piled up */}
      <Block size={[0.21, 0.003, 0.1]} position={[0, 1.335, 0.33]} color="#fbfaf5" roughness={0.9} radius={0.001} />
      <Block size={[0.21, 1.15, 0.003]} position={[0, 0.78, 0.38]} rotation={[0.04, 0, 0]} color="#fbfaf5" roughness={0.9} radius={0.001} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Block
          key={i}
          size={[0.21, 0.006, 0.29]}
          position={[0.01 * (i % 2), 0.004 + i * 0.012, 0.52]}
          rotation={[0, (i % 3) * 0.05, (i % 2 ? 1 : -1) * 0.03]}
          color="#fbfaf5"
          roughness={0.9}
          radius={0.001}
        />
      ))}
    </>
  )
}

/** A wall sign. */
export function WallSign({ text, bg, ink, size }: { text: string; bg: string; ink: string; size: [number, number] }) {
  const map = useMemo(() => signTexture(text, bg, ink, 512, Math.round((512 * size[1]) / size[0])), [text, bg, ink, size])
  return (
    <mesh position={[0, 0, 0.004]}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} roughness={0.5} />
    </mesh>
  )
}
