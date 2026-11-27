import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import {
  CylinderGeometry,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import { Block, Instanced, PI, type Placement } from '../../kit'
import type { Vec3 } from '../../mutations'
import { Hover } from '../living/oddities'
import { CHEESE, DUMBBELLS, headLength, isCheese, isGap, RACK_LENGTH, TIERS, type Dumbbell } from './rack'
import { KB_HANDLE_GEO, PLATE_GEO } from './shapes'
import { beltTexture, lcdTexture, wickerTexture } from './textures'

/*
 * The machines and the free weights. Everything is built facing +z (the way
 * its user faces, or its open side), standing on y = 0.
 */

const STEEL = { color: '#1e1f22', metalness: 0.5, roughness: 0.45 }
const CHROME = { color: '#d5d9de', metalness: 0.95, roughness: 0.2 }
const RUBBER = { color: '#151517', roughness: 0.9 }
const ORANGE = '#ff6a1a'

/** Turns its +z side towards the player, round the vertical only (it stays upright). */
export function Watches({ position, children }: { position?: Vec3; children: ReactNode }) {
  const ref = useRef<Group>(null)
  const at = useMemo(() => new Vector3(), [])
  useFrame(({ camera }) => {
    const g = ref.current
    if (!g) return
    g.getWorldPosition(at)
    g.lookAt(camera.position.x, at.y, camera.position.z)
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Cardio
// ---------------------------------------------------------------------------

/** A treadmill, console end at +z. `running` scrolls the belt with nobody on it; `incline` tilts the deck up. */
export function Treadmill({ mode = 'idle' }: { mode?: 'idle' | 'running' | 'incline' }) {
  const belt = useMemo(() => beltTexture(), [])
  const beltMesh = useRef<Mesh>(null)
  const screen = useMemo(() => lcdTexture(mode === 'running' ? ['12.0', 'KM/H'] : [], mode === 'running'), [mode])
  useFrame((_, dt) => {
    const map = (beltMesh.current?.material as MeshStandardMaterial | undefined)?.map
    if (mode === 'running' && map) map.offset.y -= dt * 2.5
  })
  return (
    <>
      {/* the deck pivots on its back edge when it inclines */}
      <group position={[0, 0, -0.95]} rotation={[mode === 'incline' ? -0.13 : 0, 0, 0]}>
        <group position={[0, 0, 0.95]}>
          <Block size={[0.72, 0.16, 1.9]} position={[0, 0.08, 0]} color="#2a2b2e" roughness={0.6} radius={0.02} />
          <mesh ref={beltMesh} position={[0, 0.162, -0.12]} rotation={[-PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.5, 1.45]} />
            <meshStandardMaterial map={belt} roughness={0.9} />
          </mesh>
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.1, 0.02, 1.5]} position={[s * 0.3, 0.17, -0.12]} color="#4a4d52" roughness={0.7} radius={0.005} />
          ))}
          <Block size={[0.72, 0.12, 0.34]} position={[0, 0.22, 0.78]} color="#1b1c1f" roughness={0.4} radius={0.03} />
          <Block size={[0.6, 0.02, 0.02]} position={[0, 0.25, 0.6]} color={ORANGE} roughness={0.4} radius={0.005} />
        </group>
      </group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[0.06, 1.15, 0.08]} position={[s * 0.39, 0.6, 0.84]} {...STEEL} radius={0.02} />
          <Block size={[0.04, 0.04, 0.42]} position={[s * 0.39, 1.06, 0.6]} {...RUBBER} radius={0.015} />
        </group>
      ))}
      {/* console, tilted back towards the runner */}
      <group position={[0, 1.3, 0.8]} rotation={[0.5, 0, 0]}>
        <Block size={[0.82, 0.26, 0.1]} {...STEEL} radius={0.03} />
        <mesh position={[0, 0.01, -0.052]} rotation={[0, PI, 0]}>
          <planeGeometry args={[0.3, 0.15]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        <Block size={[0.7, 0.025, 0.02]} position={[0, -0.1, -0.05]} color={ORANGE} radius={0.005} />
      </group>
    </>
  )
}

/** Upright exercise bike, handlebars at +z. */
export function ExerciseBike({ mode = 'idle' }: { mode?: 'idle' | 'pedalling' | 'basket' }) {
  const crank = useRef<Group>(null)
  const wicker = useMemo(() => (mode === 'basket' ? wickerTexture() : null), [mode])
  useFrame((_, dt) => {
    // positive about x takes the front pedal down, as a rider facing +z pedals
    if (mode === 'pedalling' && crank.current) crank.current.rotation.x += dt * 5
  })
  return (
    <>
      {[-0.45, 0.42].map((z) => (
        <Block key={z} size={[0.5, 0.05, 0.07]} position={[0, 0.025, z]} {...STEEL} radius={0.02} />
      ))}
      <Block size={[0.08, 0.08, 0.95]} position={[0, 0.09, -0.02]} {...STEEL} radius={0.02} />
      {/* the flywheel's round cover, with a chrome hub each side */}
      <mesh position={[0, 0.4, 0.2]} rotation={[0, 0, PI / 2]} castShadow receiveShadow userData={{ paint: true }}>
        <cylinderGeometry args={[0.25, 0.25, 0.12, 40]} />
        <meshStandardMaterial color={ORANGE} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.4, 0.2]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.135, 24]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* the crank's bottom bracket */}
      <mesh position={[0, 0.33, -0.02]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.17, 20]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <Block size={[0.06, 0.62, 0.06]} position={[0, 0.45, -0.3]} rotation={[-0.25, 0, 0]} {...STEEL} radius={0.02} />
      <Block size={[0.18, 0.06, 0.27]} position={[0, 0.79, -0.39]} {...RUBBER} radius={0.03} />
      <Block size={[0.06, 0.75, 0.06]} position={[0, 0.62, 0.34]} rotation={[-0.3, 0, 0]} {...STEEL} radius={0.02} />
      <Block size={[0.46, 0.035, 0.035]} position={[0, 0.98, 0.24]} {...RUBBER} radius={0.015} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.035, 0.035, 0.2]} position={[s * 0.215, 0.98, 0.15]} {...RUBBER} radius={0.015} />
      ))}
      <Block size={[0.18, 0.12, 0.04]} position={[0, 1.06, 0.29]} rotation={[0.5, 0, 0]} color="#0b0c0e" roughness={0.3} radius={0.01} />
      <group ref={crank} position={[0, 0.33, -0.02]}>
        {[-1, 1].map((s) => (
          <group key={s} rotation={[s === 1 ? 0 : PI, 0, 0]}>
            <Block size={[0.03, 0.17, 0.025]} position={[s * 0.1, 0.075, 0]} {...CHROME} radius={0.008} />
            <Block size={[0.1, 0.025, 0.06]} position={[s * 0.15, 0.15, 0]} {...RUBBER} radius={0.008} />
          </group>
        ))}
      </group>
      {wicker && (
        <group position={[0, 0.92, 0.38]}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.2, 0.24]} />
            <meshStandardMaterial map={wicker} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.101, 0]} rotation={[-PI / 2, 0, 0]}>
            <planeGeometry args={[0.32, 0.2]} />
            <meshStandardMaterial color="#4a2e14" roughness={1} />
          </mesh>
        </group>
      )}
    </>
  )
}

/** Rowing machine, flywheel at +z. `oars` sprouts a pair of oars; `seat` slides the seat to the far end. */
export function Rower({ mode = 'idle' }: { mode?: 'idle' | 'oars' | 'seat' }) {
  const screen = useMemo(() => lcdTexture(['0:00', '500M'], true), [])
  return (
    <>
      <Block size={[0.12, 0.06, 2.0]} position={[0, 0.36, -0.2]} color="#c9ced6" metalness={0.7} roughness={0.3} radius={0.015} />
      <Block size={[0.5, 0.05, 0.08]} position={[0, 0.025, -1.14]} {...STEEL} radius={0.02} />
      <Block size={[0.07, 0.31, 0.07]} position={[0, 0.19, -1.14]} {...STEEL} radius={0.02} />
      <Block size={[0.55, 0.05, 0.25]} position={[0, 0.025, 0.95]} {...STEEL} radius={0.02} />
      <Block size={[0.1, 0.36, 0.1]} position={[0, 0.2, 0.72]} {...STEEL} radius={0.02} />
      <mesh position={[0, 0.46, 0.92]} rotation={[0, 0, PI / 2]} castShadow>
        <cylinderGeometry args={[0.27, 0.27, 0.2, 40]} />
        <meshStandardMaterial color="#1b1c1f" roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.101, 0.46, 0.92]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.01, 32]} />
          <meshStandardMaterial color={ORANGE} roughness={0.4} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.13, 0.26, 0.03]} position={[s * 0.09, 0.47, 0.5]} rotation={[0.6, 0, 0]} {...RUBBER} radius={0.01} />
      ))}
      <Block size={[0.5, 0.035, 0.035]} position={[0, 0.52, 0.66]} {...RUBBER} radius={0.015} />
      <Block size={[0.04, 0.55, 0.04]} position={[0, 0.95, 0.9]} {...STEEL} radius={0.015} />
      <group position={[0, 1.24, 0.86]} rotation={[0.4, 0, 0]}>
        <Block size={[0.22, 0.17, 0.05]} color="#0b0c0e" roughness={0.3} radius={0.015} />
        <mesh position={[0, 0, -0.026]} rotation={[0, PI, 0]}>
          <planeGeometry args={[0.18, 0.11]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
      </group>
      <Block size={[0.3, 0.06, 0.3]} position={[0, 0.42, mode === 'seat' ? -0.95 : 0.05]} {...RUBBER} radius={0.03} />
      {mode === 'oars' &&
        [-1, 1].map((s) => (
          // swept back like a boat at rest, blades just off the floor
          <group key={s}>
            {/* outrigger from the rail out to the rowlock the oar turns in */}
            <Block size={[0.16, 0.03, 0.04]} position={[s * 0.13, 0.4, 0.3]} {...STEEL} radius={0.01} />
            <mesh position={[s * 0.2, 0.47, 0.3]}>
              <cylinderGeometry args={[0.018, 0.018, 0.14, 12]} />
              <meshStandardMaterial {...CHROME} />
            </mesh>
            <group position={[s * 0.2, 0.52, 0.3]} rotation={[0, s * 0.35, s * -0.3]}>
              <mesh position={[s * 0.33, 0, 0]} rotation={[0, 0, PI / 2]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.66, 12]} />
                <meshStandardMaterial color="#c98a4b" roughness={0.6} />
              </mesh>
              <Block size={[0.32, 0.12, 0.02]} position={[s * 0.81, 0, 0]} color="#f2efe8" roughness={0.5} radius={0.01} />
            </group>
          </group>
        ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Dumbbells
// ---------------------------------------------------------------------------

const HEAD_GEO = new CylinderGeometry(1, 1, 1, 6)
const HANDLE_GEO = new CylinderGeometry(0.016, 0.016, 0.13, 12)
const HEAD_MAT = new MeshStandardMaterial({ color: '#19191b', roughness: 0.85 })
const HANDLE_MAT = new MeshStandardMaterial({ ...CHROME })

/** Instance placements for some dumbbells: two hex heads and a handle each, lying front to back. */
function dumbbellPlacements(list: Dumbbell[]) {
  const heads: Placement[] = []
  const handles: Placement[] = []
  for (const d of list) {
    const len = headLength(d.r)
    for (const s of [-1, 1]) heads.push({ at: [d.x, d.y, d.z + s * (0.065 + len / 2)], rot: [PI / 2, PI / 6, 0], scale: [d.r, len, d.r] })
    handles.push({ at: [d.x, d.y, d.z], rot: [PI / 2, 0, 0] })
  }
  return { heads, handles }
}

const STATIC_BELLS = dumbbellPlacements(DUMBBELLS.filter((d) => !isCheese(d) && !isGap(d)))
const CHEESE_BELL = dumbbellPlacements(DUMBBELLS.filter(isCheese))
const GAP_BELLS = dumbbellPlacements(DUMBBELLS.filter(isGap))

function Bells({ set }: { set: ReturnType<typeof dumbbellPlacements> }) {
  return (
    <>
      <Instanced geometry={HEAD_GEO} material={HEAD_MAT} items={set.heads} castShadow />
      <Instanced geometry={HANDLE_GEO} material={HANDLE_MAT} items={set.handles} />
    </>
  )
}

/** A wheel of cheese with a wedge cut out, lying flat. */
function Cheese({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const s = new Shape()
    s.moveTo(0, 0)
    s.absarc(0, 0, radius, 0.35, PI * 2 - 0.35, false)
    s.lineTo(0, 0)
    const g = new ExtrudeGeometry(s, { depth: radius * 0.75, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 40 })
    // lie flat, the cut facing the front
    g.rotateX(PI / 2)
    g.rotateY(-PI / 2)
    g.translate(0, radius * 0.75 + 0.006, 0)
    return g
  }, [radius])
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color="#ffc928" roughness={0.6} />
    </mesh>
  )
}

/** Two-tier dumbbell rack, built along x, the dumbbells' heads to the front and back (all but the few that change). */
export function DumbbellRack() {
  const half = RACK_LENGTH / 2
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (half - 0.03), 0, 0]}>
          <Block size={[0.06, 0.04, 0.58]} position={[0, 0.02, 0]} {...STEEL} radius={0.01} paint />
          <Block size={[0.06, 0.78, 0.06]} position={[0, 0.39, -0.24]} {...STEEL} radius={0.01} paint />
          <Block size={[0.06, 0.42, 0.06]} position={[0, 0.21, 0.24]} {...STEEL} radius={0.01} paint />
        </group>
      ))}
      {TIERS.map((t, i) => (
        <group key={i}>
          <Block size={[RACK_LENGTH, 0.025, i === 0 ? 0.36 : 0.34]} position={[0, t.y - 0.0125, t.z]} {...STEEL} radius={0.005} paint />
          <Block size={[RACK_LENGTH - 0.1, 0.05, 0.015]} position={[0, t.y - 0.03, t.z + (i === 0 ? 0.18 : 0.17)]} color={ORANGE} roughness={0.5} radius={0.004} />
        </group>
      ))}
      <Bells set={STATIC_BELLS} />
    </>
  )
}

/** The dumbbells the swaps change: one that may be cheese, and a pair that may be gone. */
export function OddDumbbells({ mode }: { mode: 'normal' | 'cheese' | 'gap' }) {
  const cheese = DUMBBELLS.find(isCheese)!
  return (
    <>
      {mode !== 'gap' && <Bells set={GAP_BELLS} />}
      {mode === 'cheese' ? (
        <group position={[cheese.x - 0.015, TIERS[CHEESE.tier].y, cheese.z]}>
          <Cheese radius={0.115} />
        </group>
      ) : (
        <Bells set={CHEESE_BELL} />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Bench
// ---------------------------------------------------------------------------

/** Adjustable bench along z: seat at -z, backrest hinged up at +z unless `flat`. */
export function Bench({ flat = false, pad = '#1b1c1f' }: { flat?: boolean; pad?: string }) {
  return (
    <>
      <Block size={[0.1, 0.08, 1.2]} position={[0, 0.1, 0]} {...STEEL} radius={0.015} />
      {[-0.55, 0.55].map((z) => (
        <Block key={z} size={[0.46, 0.05, 0.08]} position={[0, 0.025, z]} {...STEEL} radius={0.015} />
      ))}
      <Block size={[0.06, 0.3, 0.06]} position={[0, 0.27, -0.36]} {...STEEL} radius={0.015} />
      <Block size={[0.3, 0.07, 0.4]} position={[0, 0.455, -0.38]} color={pad} roughness={0.55} radius={0.03} paint />
      <group position={[0, 0.455, -0.15]} rotation={[flat ? 0 : -1.0, 0, 0]}>
        <Block size={[0.3, 0.07, 0.76]} position={[0, 0, 0.4]} color={pad} roughness={0.55} radius={0.03} paint />
      </group>
      {flat ? (
        <Block size={[0.06, 0.3, 0.06]} position={[0, 0.27, 0.35]} {...STEEL} radius={0.015} />
      ) : (
        // the ladder strut propping the backrest up
        <Block size={[0.05, 0.67, 0.05]} position={[0, 0.445, 0.21]} rotation={[-0.43, 0, 0]} {...STEEL} radius={0.015} />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Kettlebells
// ---------------------------------------------------------------------------

const BELL_COLOURS = ['#ff3fa4', '#1f6bff', '#ffde21', '#8a4dff', '#2fbf71', '#ff8a1f']
const BELL_RADII = [0.075, 0.083, 0.091, 0.099, 0.107, 0.115]
const BELL_GAP = 0.06
const BODY_GEO = new SphereGeometry(1, 28, 20)
/** The flat foot a kettlebell stands on. */
const FOOT_GEO = new CylinderGeometry(0.62, 0.66, 0.1, 24)
/** Body centre height (in bell radii): the ball sits on its foot. */
const BODY_Y = 1.06

/** Kettlebell centre x positions along the row, centred on 0. */
const BELL_XS = (() => {
  const width = BELL_RADII.reduce((s, r) => s + 2 * r, 0) + BELL_GAP * (BELL_RADII.length - 1)
  let x = -width / 2
  return BELL_RADII.map((r) => {
    const at = x + r
    x += 2 * r + BELL_GAP
    return at
  })
})()

function Kettlebell({ r, colour, face = false }: { r: number; colour: string; face?: boolean }) {
  return (
    // each bell blocks the player on its own, as a circle (the row isn't one solid box)
    <group scale={r} userData={{ solid: true, round: true }}>
      <mesh geometry={BODY_GEO} position={[0, BODY_Y, 0]} castShadow>
        <meshStandardMaterial color={colour} roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh geometry={FOOT_GEO} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#1b1c1f" roughness={0.7} />
      </mesh>
      <mesh geometry={KB_HANDLE_GEO} position={[0, BODY_Y - 1, 0]} castShadow>
        <meshStandardMaterial color={colour} roughness={0.45} metalness={0.2} />
      </mesh>
      {face && (
        <>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.32, BODY_Y + 0.2, 0.92]}>
              <mesh>
                <sphereGeometry args={[0.17, 14, 10]} />
                <meshStandardMaterial color="#fffbe6" roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0.14]}>
                <sphereGeometry args={[0.07, 10, 8]} />
                <meshBasicMaterial color="#111" />
              </mesh>
            </group>
          ))}
          {/* a flat, unimpressed mouth */}
          <mesh position={[0, BODY_Y - 0.18, 0.97]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.36, 0.06, 0.04]} />
            <meshBasicMaterial color="#111" />
          </mesh>
        </>
      )}
    </group>
  )
}

const FACE_BELL = 3
const FLOAT_BELL = 1

/** A row of colour-coded kettlebells along x, lightest on the left. */
export function Kettlebells({ mode = 'normal' }: { mode?: 'normal' | 'face' | 'float' }) {
  return (
    <>
      {BELL_RADII.map((r, i) => {
        const bell = <Kettlebell r={r} colour={BELL_COLOURS[i]} face={mode === 'face' && i === FACE_BELL} />
        if (mode === 'face' && i === FACE_BELL)
          return (
            <Watches key={i} position={[BELL_XS[i], 0, 0]}>
              {bell}
            </Watches>
          )
        if (mode === 'float' && i === FLOAT_BELL)
          return (
            <group key={i} position={[BELL_XS[i], 0, 0]}>
              <Hover height={0.32}>{bell}</Hover>
            </group>
          )
        return (
          <group key={i} position={[BELL_XS[i], 0, 0]}>
            {bell}
          </group>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Squat rack, barbell and plates
// ---------------------------------------------------------------------------

const PLATE = { red: { colour: '#d8262a', t: 0.06 }, blue: { colour: '#1f5fd8', t: 0.05 } }
const HOOK_X = 0.6
/** How far the bent bar tips at the hooks: the middle sags by HOOK_X × tan. */
const BEND = 0.2

/** One half of a barbell, from the middle out along +x, with plates on its sleeve. */
function HalfBar({ plates, bent }: { plates: boolean; bent: boolean }) {
  // a bent bar's halves cross a little past the middle, so the kink has no notch in it
  const from = bent ? -0.025 : 0
  let x = 0.7
  return (
    <>
      <mesh position={[(from + 0.66) / 2, 0, 0]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, 0.66 - from, 12]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <mesh position={[0.67, 0, 0]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.03, 20]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <mesh position={[0.89, 0, 0]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.42, 16]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {plates &&
        [PLATE.red, PLATE.blue].map((p) => {
          const at = x + p.t / 2
          x += p.t
          return (
            <mesh key={p.colour} geometry={PLATE_GEO} position={[at, 0, 0]} rotation={[0, 0, PI / 2]} scale={[0.225, p.t, 0.225]} castShadow>
              <meshStandardMaterial color={p.colour} roughness={0.7} />
            </mesh>
          )
        })}
      {plates && (
        // the spring collar holding them on
        <mesh position={[x + 0.02, 0, 0]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.038, 0.038, 0.04, 20]} />
          <meshStandardMaterial color={ORANGE} roughness={0.45} />
        </mesh>
      )}
    </>
  )
}

/** Olympic barbell along x, 2.2m. `bent` sags it in the middle; `lopsided` strips one end. */
function Barbell({ mode }: { mode: 'normal' | 'lopsided' | 'bent' }) {
  const tilt = mode === 'bent' ? BEND : 0
  return (
    <>
      {[1, -1].map((s) => (
        <group key={s} scale={[s, 1, 1]}>
          {/* each half pivots on its hook */}
          <group position={[HOOK_X, 0, 0]} rotation={[0, 0, tilt]}>
            <group position={[-HOOK_X, 0, 0]}>
              <HalfBar plates={!(mode === 'lopsided' && s === -1)} bent={mode === 'bent'} />
            </group>
          </group>
        </group>
      ))}
    </>
  )
}

/** The barbell as it sits on the power rack's J-hooks. */
export function RackedBar({ mode }: { mode: 'normal' | 'lopsided' | 'bent' }) {
  return (
    <group position={[0, 1.39, 0.66]}>
      <Barbell mode={mode} />
    </group>
  )
}

/** Power rack, open side +z (the barbell is separate: see RackedBar). */
export function PowerRack() {
  const frame = { ...STEEL, paint: true, radius: 0.01 }
  return (
    <>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <Block key={`${sx}${sz}`} size={[0.075, 2.3, 0.075]} position={[sx * HOOK_X, 1.15, sz * 0.6]} {...frame} />),
      )}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[1.275, 0.075, 0.075]} position={[0, 2.26, s * 0.6]} {...frame} />
          <Block size={[0.075, 0.075, 1.125]} position={[s * HOOK_X, 2.26, 0]} {...frame} />
          <Block size={[0.075, 0.06, 1.3]} position={[s * HOOK_X, 0.03, 0]} {...frame} />
          {/* safety arms, and the J-hooks on the front uprights */}
          <Block size={[0.05, 0.05, 1.125]} position={[s * (HOOK_X - 0.06), 0.62, 0]} {...CHROME} radius={0.01} />
          <group position={[s * HOOK_X, 0, 0]}>
            <Block size={[0.06, 0.16, 0.02]} position={[0, 1.33, 0.647]} color={ORANGE} roughness={0.5} radius={0.006} />
            <Block size={[0.05, 0.022, 0.09]} position={[0, 1.364, 0.675]} color={ORANGE} roughness={0.5} radius={0.006} />
            <Block size={[0.05, 0.06, 0.02]} position={[0, 1.39, 0.71]} color={ORANGE} roughness={0.5} radius={0.006} />
          </group>
        </group>
      ))}
      <Block size={[1.125, 0.06, 0.075]} position={[0, 0.03, -0.6]} {...frame} />
    </>
  )
}

const TREE_PLATE = PLATE_GEO

/** A plate tree: big plates on the low pegs, medium and small higher up. */
export function PlateTree({ donut = false }: { donut?: boolean }) {
  const big = <meshStandardMaterial color="#1b1c1f" roughness={0.75} />
  return (
    <>
      <Block size={[0.5, 0.04, 0.5]} position={[0, 0.02, 0]} {...STEEL} radius={0.01} />
      <Block size={[0.07, 1.2, 0.07]} position={[0, 0.62, 0]} {...STEEL} radius={0.01} />
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* pegs on ±x low, ±z middle, ±x high */}
          <mesh position={[s * 0.13, 0.3, 0]} rotation={[0, 0, PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 10]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
          <mesh position={[0, 0.75, s * 0.11]} rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.16, 10]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
          <mesh position={[s * 0.11, 1.06, 0]} rotation={[0, 0, PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.16, 10]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
          <mesh geometry={TREE_PLATE} position={[s * 0.09, 0.3, 0]} rotation={[0, 0, PI / 2]} scale={[0.225, 0.055, 0.225]} castShadow>
            {big}
          </mesh>
          <mesh geometry={TREE_PLATE} position={[s * 0.15, 0.3, 0]} rotation={[0, 0, PI / 2]} scale={[0.225, 0.055, 0.225]} castShadow>
            {big}
          </mesh>
          {donut && s === 1 ? (
            // on the middle peg that faces the room, icing outwards
            <group position={[0, 0.75, 0.11]}>
              <mesh castShadow>
                <torusGeometry args={[0.12, 0.062, 16, 40]} />
                <meshStandardMaterial color="#d99a52" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0, 0.024]} scale={[1, 1, 0.7]}>
                <torusGeometry args={[0.12, 0.06, 12, 40]} />
                <meshStandardMaterial color="#ff8fc8" roughness={0.4} />
              </mesh>
            </group>
          ) : (
            <mesh geometry={TREE_PLATE} position={[0, 0.75, s * 0.08]} rotation={[PI / 2, 0, 0]} scale={[0.17, 0.045, 0.17]} castShadow userData={{ paint: true }}>
              <meshStandardMaterial color="#1f5fd8" roughness={0.7} />
            </mesh>
          )}
          <mesh geometry={TREE_PLATE} position={[s * 0.08, 1.06, 0]} rotation={[0, 0, PI / 2]} scale={[0.12, 0.035, 0.12]} castShadow>
            <meshStandardMaterial color="#2fbf71" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Cable machine
// ---------------------------------------------------------------------------

const STACK_PLATES = 14

/** Dual-stack cable machine (functional trainer), handles at the front (+z). `lifted` raises the left stack. */
export function CableMachine({ lifted = false }: { lifted?: boolean }) {
  const frame = { ...STEEL, paint: true, radius: 0.015 }
  return (
    <>
      <Block size={[1.6, 0.07, 0.75]} position={[0, 0.035, 0]} {...STEEL} radius={0.01} />
      <Block size={[1.6, 0.1, 0.1]} position={[0, 2.2, -0.3]} {...frame} />
      <Block size={[1.5, 0.05, 0.05]} position={[0, 2.12, 0.27]} {...CHROME} radius={0.015} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.55, 0, 0]}>
          <Block size={[0.1, 2.15, 0.1]} position={[s * 0.2, 1.125, -0.3]} {...frame} />
          <Block size={[0.1, 2.05, 0.1]} position={[s * 0.15, 1.07, 0.27]} {...frame} />
          <Block size={[0.12, 0.08, 0.66]} position={[s * 0.17, 2.12, -0.02]} {...frame} />
          {/* guide rods and the weight stack */}
          {[-1, 1].map((r) => (
            <Block key={r} size={[0.02, 1.7, 0.02]} position={[r * 0.08, 0.92, -0.15]} {...CHROME} radius={0.008} />
          ))}
          {Array.from({ length: STACK_PLATES }, (_, i) => {
            const up = lifted && s === -1 && i >= STACK_PLATES - 6 ? 0.5 : 0
            return (
              <Block
                key={i}
                size={[0.24, 0.045, 0.12]}
                position={[0, 0.1 + i * 0.05 + up, -0.15]}
                color={i === STACK_PLATES - 1 ? '#c9ced6' : '#2a2b2e'}
                metalness={0.5}
                roughness={0.4}
                radius={0.006}
              />
            )
          })}
          {/* cable up from the stack, and the pulley carriage on the front column */}
          <Block size={[0.008, lifted && s === -1 ? 0.83 : 1.33, 0.008]} position={[0, lifted && s === -1 ? 1.69 : 1.44, -0.15]} color="#111" radius={0.003} />
          <Block size={[0.14, 0.18, 0.14]} position={[s * 0.15, 1.3, 0.35]} color={ORANGE} roughness={0.45} radius={0.02} />
          <Block size={[0.008, 0.2, 0.008]} position={[s * 0.15, 1.12, 0.38]} color="#111" radius={0.003} />
          <mesh position={[s * 0.15, 0.99, 0.38]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.05, 0.012, 8, 20]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
        </group>
      ))}
    </>
  )
}
