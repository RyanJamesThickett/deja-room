import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Group, Mesh } from 'three'
import { Block, PanelLight, PI } from '../../kit'
import type { Vec3 } from '../../mutations'
import { Outside, OutsideMask } from '../../outside'
import { dayStreet, nightStreet } from '../shop/textures'
import { Watches } from './equipment'
import { DOORWAY } from './layout'
import { ghostName, makeMirror } from './mirror'
import { BOTTLE_GEO, WATER_GEO } from './shapes'
import {
  checkInTexture,
  clockTexture,
  planOffset,
  posterTexture,
  pushTexture,
  signTexture,
  tvPlanTexture,
  tvShowTexture,
  vinylTexture,
  type PosterKind,
} from './textures'

/*
 * The gym's fixtures and fittings: the mirror wall, TV, signs, posters, the
 * water cooler and towels, the shopfront, reception and the ceiling lights.
 * Wall-hung things are built with their back on the wall, facing +z.
 */

const ALU = { color: '#8d939a', metalness: 0.8, roughness: 0.35 }
const BLACK = { color: '#151517', roughness: 0.5 }
const ORANGE = '#ff6a1a'

// ---------------------------------------------------------------------------
// The mirror wall
// ---------------------------------------------------------------------------

/**
 * The mirror wall (see makeMirror). The figure stands at `figureAt`, relative
 * to the mirror, and only ever appears in the reflection.
 */
export function MirrorWall({ width, height, item, omit, figureAt }: { width: number; height: number; item: string; omit: string; figureAt: Vec3 }) {
  const glass = useMemo(() => makeMirror(width, height, item, omit), [width, height, item, omit])
  useEffect(() => () => glass.dispose(), [glass])

  const seams = [-1, 0, 1].map((i) => (i * width) / 4)
  return (
    <>
      <primitive object={glass} position={[0, 0, 0.012]} />
      {/* joins between the mirror panels, and a slim aluminium trim */}
      {seams.map((x) => (
        <mesh key={x} position={[x, 0, 0.014]}>
          <planeGeometry args={[0.004, height]} />
          <meshBasicMaterial color="#5d6166" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[width + 0.04, 0.025, 0.02]} position={[0, s * (height / 2 + 0.0125), 0.01]} {...ALU} radius={0.004} />
          <Block size={[0.025, height, 0.02]} position={[s * (width / 2 + 0.0125), 0, 0.01]} {...ALU} radius={0.004} />
        </group>
      ))}
      {/* the one who isn't there: hidden except while the reflection is drawn */}
      <group name={ghostName(item)} position={figureAt} rotation={[0, PI, 0]} visible={false}>
        <mesh position={[0, 0.78, 0]} scale={[1, 1, 0.65]}>
          <capsuleGeometry args={[0.2, 0.95, 6, 16]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.13, 20, 16]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.9} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.045, 1.63, 0.12]}>
            <sphereGeometry args={[0.016, 10, 8]} />
            <meshBasicMaterial color="#fff6c8" toneMapped={false} />
          </mesh>
        ))}
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// TV, sign, clock, posters
// ---------------------------------------------------------------------------

const TV_W = 1.04
const TV_H = 0.59

/** Ceiling-hung TV, screen at +z, centre at the origin, poles up to `toCeiling` above it. */
export function Tv({ mode, toCeiling }: { mode: 'show' | 'plan' | 'off'; toCeiling: number }) {
  const map = useMemo(() => (mode === 'show' ? tvShowTexture() : mode === 'plan' ? tvPlanTexture() : null), [mode])
  const dot = useRef<Mesh>(null)
  useFrame(({ camera, clock }) => {
    if (!dot.current) return
    const [u, v] = planOffset(camera.position.x, camera.position.z)
    dot.current.position.set(u * TV_W, v * TV_H, 0.034)
    dot.current.scale.setScalar(Math.sin(clock.elapsedTime * 6) > 0 ? 1 : 0.7)
  })
  const pole = toCeiling - 0.335
  return (
    <>
      <Block size={[1.12, 0.67, 0.06]} {...BLACK} radius={0.012} />
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={[TV_W, TV_H]} />
        {map ? <meshBasicMaterial map={map} toneMapped={false} /> : <meshStandardMaterial color="#050507" roughness={0.15} metalness={0.3} />}
      </mesh>
      {mode === 'plan' && (
        <mesh ref={dot}>
          <circleGeometry args={[0.018, 20]} />
          <meshBasicMaterial color="#ff2a2a" toneMapped={false} />
        </mesh>
      )}
      <mesh position={[0.5, -0.31, 0.032]}>
        <circleGeometry args={[0.006, 10]} />
        <meshBasicMaterial color={mode === 'off' ? '#ff2a1a' : '#2aff6a'} toneMapped={false} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.335 + pole / 2, -0.01]}>
          <cylinderGeometry args={[0.015, 0.015, pole, 10]} />
          <meshStandardMaterial {...ALU} />
        </mesh>
      ))}
      <Block size={[0.7, 0.02, 0.08]} position={[0, toCeiling - 0.01, -0.01]} {...ALU} radius={0.004} />
    </>
  )
}

/** Backlit sign: an orange box with the gym's name lit up on its face. */
export function GymSign({ name }: { name: string }) {
  const map = useMemo(() => signTexture(name), [name])
  return (
    <>
      <Block size={[1.62, 0.56, 0.08]} position={[0, 0, 0.04]} color={ORANGE} roughness={0.4} radius={0.015} paint />
      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[1.5, 0.45]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </>
  )
}

/** Big red digital clock, the sort that doubles as an interval timer. */
export function LedClock({ text }: { text: string }) {
  const map = useMemo(() => clockTexture(text), [text])
  return (
    <>
      <Block size={[0.74, 0.25, 0.06]} position={[0, 0, 0.03]} {...BLACK} radius={0.01} />
      <mesh position={[0, 0, 0.061]}>
        <planeGeometry args={[0.68, 0.21]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </>
  )
}

/** A0-ish poster in a thin black clip frame. */
export function Poster({ kind, paint = false }: { kind: PosterKind; paint?: boolean }) {
  const map = useMemo(() => posterTexture(kind), [kind])
  return (
    <>
      <Block size={[0.66, 0.9, 0.02]} position={[0, 0, 0.01]} {...BLACK} radius={0.004} />
      <mesh position={[0, 0, 0.021]} userData={{ paint }}>
        <planeGeometry args={[0.6, 0.84]} />
        <meshStandardMaterial map={map} roughness={0.6} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// Water cooler and towels
// ---------------------------------------------------------------------------

/** Bottle-top water cooler, taps at +z. */
export function WaterCooler({ mode }: { mode: 'full' | 'fish' | 'empty' }) {
  const fish = useRef<Group>(null)
  useFrame(({ clock }) => {
    // turning this way round, each fish travels head first
    if (fish.current) fish.current.rotation.y = -clock.elapsedTime * 0.8
  })
  return (
    <>
      <Block size={[0.32, 1.0, 0.32]} position={[0, 0.5, 0]} color="#f1f1ee" roughness={0.4} radius={0.02} />
      <Block size={[0.2, 0.26, 0.02]} position={[0, 0.8, 0.16]} color="#a9afb6" roughness={0.4} radius={0.005} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, 0.05, 0.04]} position={[s * 0.05, 0.88, 0.18]} color={s < 0 ? '#1f6bff' : '#e0262a'} roughness={0.4} radius={0.008} />
      ))}
      <Block size={[0.2, 0.02, 0.07]} position={[0, 0.69, 0.19]} color="#5d6166" roughness={0.5} radius={0.005} />
      {/* paper cups on the side: a tube with a cup showing at the bottom */}
      <mesh position={[0.2, 0.76, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.28, 16]} />
        <meshStandardMaterial color="#e8f2ff" roughness={0.5} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.2, 0.91, 0]}>
        <cylinderGeometry args={[0.044, 0.044, 0.025, 16]} />
        <meshStandardMaterial color="#5d6166" roughness={0.5} />
      </mesh>
      <mesh position={[0.2, 0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.05, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>
      {/* the socket the bottle stands upside down in */}
      <mesh position={[0, 1.015, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.03, 24]} />
        <meshStandardMaterial color="#d9dde2" roughness={0.4} />
      </mesh>
      <mesh geometry={BOTTLE_GEO} position={[0, 1.0, 0]} renderOrder={2}>
        <meshPhysicalMaterial color="#bfe2ff" transparent opacity={0.3} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      {mode !== 'empty' && (
        <mesh geometry={WATER_GEO} position={[0, 1.0, 0]} renderOrder={1}>
          <meshStandardMaterial color="#5fb6f2" roughness={0.1} transparent opacity={0.45} depthWrite={false} />
        </mesh>
      )}
      {mode === 'fish' && (
        <group ref={fish} position={[0, 1.22, 0]}>
          {[0, 1].map((i) => (
            <group key={i} position={[i ? -0.07 : 0.07, i ? 0.08 : -0.04, 0]} rotation={[0, i ? PI : 0, 0]}>
              <mesh scale={[0.6, 0.5, 1]}>
                <sphereGeometry args={[0.04, 14, 10]} />
                <meshStandardMaterial color="#ff8a1f" emissive="#ff5a00" emissiveIntensity={0.5} roughness={0.4} />
              </mesh>
              {[-1, 1].map((e) => (
                <mesh key={e} position={[e * 0.02, 0.006, 0.026]}>
                  <sphereGeometry args={[0.006, 8, 6]} />
                  <meshBasicMaterial color="#111" />
                </mesh>
              ))}
              <mesh position={[0, 0, -0.045]} rotation={[PI / 2, 0, 0]}>
                <coneGeometry args={[0.025, 0.03, 10]} />
                <meshStandardMaterial color="#ff6a1a" emissive="#ff5a00" emissiveIntensity={0.5} roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </>
  )
}

const TOWEL_XS = [-0.36, -0.12, 0.12, 0.36]
const TOWEL_COLOURS = ['#f4f4f0', '#d9dde2', '#f4f4f0', '#d9dde2']

/** Wall rail with towels folded over it; the origin is at the rail. `upward` makes one hang the wrong way. */
export function TowelRail({ upward }: { upward: boolean }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, 0.05, 0.1]} position={[s * 0.5, 0, 0.05]} {...ALU} radius={0.008} />
      ))}
      <mesh position={[0, 0, 0.09]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 1.02, 12]} />
        <meshStandardMaterial {...ALU} />
      </mesh>
      {TOWEL_XS.map((x, i) => {
        const up = upward && i === 2
        return (
          // folded over the rail: a long fall in front, a shorter one behind, and the fold round the top
          <group key={x} position={[x, 0, 0.09]} rotation={[0, 0, up ? PI : 0]}>
            <Block size={[0.22, 0.44, 0.018]} position={[0, -0.21, 0.02]} color={TOWEL_COLOURS[i]} roughness={1} radius={0.008} />
            <Block size={[0.22, 0.3, 0.018]} position={[0, -0.14, -0.02]} color={TOWEL_COLOURS[i]} roughness={1} radius={0.008} />
            <mesh rotation={[0, 0, PI / 2]} castShadow>
              <cylinderGeometry args={[0.029, 0.029, 0.22, 16]} />
              <meshStandardMaterial color={TOWEL_COLOURS[i]} roughness={1} />
            </mesh>
            <Block size={[0.222, 0.03, 0.02]} position={[0, -0.36, 0.021]} color={ORANGE} roughness={1} radius={0.006} />
          </group>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Shopfront: the window and the door
// ---------------------------------------------------------------------------

/**
 * The front window onto the high street, with the gym's name on the glass. `y`: how high its middle is.
 * Its street is drawn after the door's (see layerOrder), so even by day it can't show through the door.
 */
export function GymWindow({ width, height, y, day }: { width: number; height: number; y: number; day: boolean }) {
  const vinyl = useMemo(() => vinylTexture(), [])
  return (
    <>
      <Outside layers={day ? dayStreet() : nightStreet()} y={y} pass={1} />
      <mesh position={[0, height / 2 - 0.32, 0.02]}>
        <planeGeometry args={[2.8, 0.44]} />
        <meshBasicMaterial map={vinyl} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.025]} renderOrder={2}>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <Block key={s} size={[width + 0.1, 0.06, 0.08]} position={[0, s * (height / 2 + 0.03), 0.04]} color="#2a2c30" metalness={0.6} roughness={0.4} radius={0.01} />
      ))}
      {[-0.5, -1 / 6, 1 / 6, 0.5].map((f) => (
        <Block key={f} size={[0.06, height, 0.08]} position={[f * (width + 0.02), 0, 0.04]} color="#2a2c30" metalness={0.6} roughness={0.4} radius={0.01} />
      ))}
    </>
  )
}

/**
 * Aluminium-framed glass door, hinged on its left (as seen from inside); opens inwards when `ajar`.
 * It's always night through this one, whatever the window shows.
 */
export function GlassDoor({ ajar, along }: { ajar: boolean; along: number }) {
  const sticker = useMemo(() => pushTexture(), [])
  const frame = { color: '#2a2c30', metalness: 0.6, roughness: 0.4, radius: 0.008 }
  return (
    <>
      {/* the street outside, through the doorway; `along`: where the door is on it */}
      <Outside layers={nightStreet()} along={along} />
      <OutsideMask size={[DOORWAY.width, DOORWAY.height]} position={[0, DOORWAY.height / 2, 0.002]} />
      <group position={[-0.47, 0, 0.035]} rotation={[0, ajar ? -0.22 : 0, 0]}>
        {[0.03, 0.91].map((x) => (
          <Block key={x} size={[0.06, 2.08, 0.045]} position={[x, 1.05, 0]} {...frame} />
        ))}
        {[0.06, 2.06].map((y) => (
          <Block key={y} size={[0.94, y < 1 ? 0.12 : 0.06, 0.045]} position={[0.47, y, 0]} {...frame} />
        ))}
        <mesh position={[0.47, 1.06, 0]} renderOrder={2}>
          <planeGeometry args={[0.82, 1.9]} />
          <meshPhysicalMaterial color="#d8ecff" transparent opacity={0.14} roughness={0.05} clearcoat={1} depthWrite={false} />
        </mesh>
        <mesh position={[0.47, 1.4, 0.003]}>
          <planeGeometry args={[0.24, 0.09]} />
          <meshStandardMaterial map={sticker} roughness={0.6} />
        </mesh>
        <Block size={[0.03, 0.6, 0.03]} position={[0.82, 1.0, 0.07]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.01} />
      </group>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, 2.18, 0.08]} position={[s * 0.5, 1.09, 0.04]} {...frame} />
      ))}
      <Block size={[1.06, 0.08, 0.08]} position={[0, 2.14, 0.04]} {...frame} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Reception
// ---------------------------------------------------------------------------

function Monitor() {
  const screen = useMemo(() => checkInTexture(), [])
  return (
    <>
      <Block size={[0.18, 0.015, 0.12]} position={[0, 0.0075, 0]} {...BLACK} radius={0.005} />
      <Block size={[0.04, 0.2, 0.025]} position={[0, 0.11, -0.02]} {...BLACK} radius={0.005} />
      <Block size={[0.46, 0.29, 0.03]} position={[0, 0.3, 0]} {...BLACK} radius={0.008} />
      <mesh position={[0, 0.3, 0.016]}>
        <planeGeometry args={[0.43, 0.26]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
    </>
  )
}

/** Reception desk built along x: customers at +z, the receptionist at -z. `stare` turns the computer to face you. */
export function ReceptionDesk({ stare }: { stare: boolean }) {
  const logo = useMemo(() => signTexture('IRONWORKS'), [])
  return (
    <>
      <Block size={[1.5, 1.08, 0.05]} position={[0, 0.54, 0.275]} color="#1b1c1f" roughness={0.45} radius={0.01} paint />
      <mesh position={[0, 0.66, 0.301]}>
        <planeGeometry args={[0.96, 0.29]} />
        <meshBasicMaterial map={logo} toneMapped={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.05, 1.08, 0.6]} position={[s * 0.725, 0.54, 0]} color="#1b1c1f" roughness={0.45} radius={0.01} paint />
      ))}
      <Block size={[1.6, 0.04, 0.34]} position={[0, 1.1, 0.13]} color="#e9e4da" roughness={0.35} radius={0.01} />
      <Block size={[1.4, 0.03, 0.4]} position={[0, 0.75, -0.08]} color="#e9e4da" roughness={0.35} radius={0.006} />
      <Block size={[1.4, 0.08, 0.5]} position={[0, 0.04, 0]} color="#111" roughness={0.8} radius={0.006} />
      {/* card reader and a bell on the counter */}
      <Block size={[0.08, 0.03, 0.15]} position={[0.5, 1.135, 0.2]} rotation={[0.2, 0, 0]} {...BLACK} radius={0.008} />
      <group position={[-0.55, 1.12, 0.2]}>
        <mesh position={[0, 0.008, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.016, 20]} />
          <meshStandardMaterial color="#1b1c1f" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.016, 0]}>
          <sphereGeometry args={[0.04, 20, 10, 0, PI * 2, 0, PI / 2]} />
          <meshStandardMaterial color="#d8b04a" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
      {/* the computer faces the receptionist, unless it has taken an interest */}
      <group position={[0, 1.12, 0.02]}>
        {stare ? (
          <Watches>
            <Monitor />
          </Watches>
        ) : (
          <group rotation={[0, PI, 0]}>
            <Monitor />
          </group>
        )}
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Lights, ball, and odds and ends
// ---------------------------------------------------------------------------

/** Long LED batten lights running along x at each z, just under the ceiling. */
export function Battens({ zs, length, height }: { zs: number[]; length: number; height: number }) {
  return (
    <>
      {zs.map((z) => (
        <group key={z}>
          <Block size={[length + 0.06, 0.04, 0.14]} position={[0, height - 0.02, z]} color="#2a2c30" metalness={0.5} roughness={0.4} radius={0.008} />
          <Block size={[length, 0.02, 0.1]} position={[0, height - 0.045, z]} color="#ffffff" emissive="#ffffff" emissiveIntensity={2.2} radius={0.006} />
          <PanelLight position={[0, height - 0.06, z]} size={[length, 0.3]} facing={[0, 0, z]} color="#f4f8ff" intensity={3.2} />
        </group>
      ))}
    </>
  )
}

/** A 65cm exercise ball, or what's left of one. */
export function ExerciseBall({ flat }: { flat: boolean }) {
  return (
    <mesh position={[0, flat ? 0.1 : 0.33, 0]} scale={flat ? [1.25, 0.32, 1.15] : 1} castShadow userData={{ paint: true }}>
      <sphereGeometry args={[0.33, 40, 28]} />
      <meshStandardMaterial color="#1f6bff" roughness={0.35} />
    </mesh>
  )
}

/** Soft plyo boxes stacked in the corner. */
export function PlyoBoxes() {
  return (
    <>
      <Block size={[0.6, 0.45, 0.75]} position={[0, 0.225, 0]} color="#1b1c1f" roughness={0.8} radius={0.04} />
      <Block size={[0.5, 0.3, 0.6]} position={[0, 0.6, 0.02]} color={ORANGE} roughness={0.8} radius={0.04} />
      <Block size={[0.45, 0.15, 0.5]} position={[0, 0.825, -0.02]} color="#1b1c1f" roughness={0.8} radius={0.03} />
    </>
  )
}

/** Two stretching mats, a foam roller and a rolled-up yoga mat. Mats run along x. */
export function StretchMats() {
  return (
    <>
      {[-0.31, 0.31].map((z) => (
        <Block key={z} size={[1.5, 0.014, 0.6]} position={[0, 0.007, z]} color="#2f6b5c" roughness={0.95} radius={0.005} />
      ))}
      <mesh position={[0.45, 0.089, 0.31]} rotation={[PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.45, 24]} />
        <meshStandardMaterial color={ORANGE} roughness={0.8} />
      </mesh>
      <mesh position={[-0.5, 0.064, -0.31]} rotation={[PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 20]} />
        <meshStandardMaterial color="#8a4dff" roughness={0.9} />
      </mesh>
    </>
  )
}

/** Someone's holdall, left on the floor. */
export function GymBag() {
  return (
    <>
      <Block size={[0.55, 0.28, 0.3]} position={[0, 0.14, 0]} color="#1b1c1f" roughness={0.7} radius={0.1} />
      <Block size={[0.556, 0.04, 0.306]} position={[0, 0.14, 0]} color={ORANGE} roughness={0.7} radius={0.015} />
      {/* the carry handle, its ends sunk into the top */}
      <mesh position={[0, 0.265, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.1, 0.012, 8, 20, PI]} />
        <meshStandardMaterial color="#111" roughness={0.7} />
      </mesh>
    </>
  )
}

/** Wipes dispenser and spray bottle on a little wall shelf. */
export function WipesStation() {
  return (
    <>
      {/* the dispenser hangs high enough to clear the spray bottle on the shelf */}
      <Block size={[0.26, 0.34, 0.14]} position={[0, 0.27, 0.07]} color="#f1f1ee" roughness={0.4} radius={0.02} />
      <Block size={[0.12, 0.02, 0.02]} position={[0, 0.15, 0.145]} color="#5d6166" roughness={0.5} radius={0.004} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.02, 0.08, 0.1]} position={[s * 0.12, -0.17, 0.05]} color="#c9ced6" metalness={0.6} roughness={0.35} radius={0.004} />
      ))}
      <Block size={[0.3, 0.02, 0.14]} position={[0, -0.12, 0.07]} color="#c9ced6" metalness={0.6} roughness={0.35} radius={0.004} />
      <mesh position={[0.06, -0.02, 0.07]}>
        <cylinderGeometry args={[0.035, 0.038, 0.18, 16]} />
        <meshStandardMaterial color="#2fbf71" roughness={0.3} transparent opacity={0.85} />
      </mesh>
      <Block size={[0.03, 0.05, 0.06]} position={[0.06, 0.095, 0.08]} color="#1b1c1f" roughness={0.4} radius={0.006} />
    </>
  )
}

/** Pedal bin. */
export function Bin() {
  return (
    <>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.16, 0.6, 28]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.615, 0]}>
        <cylinderGeometry args={[0.172, 0.172, 0.03, 28]} />
        <meshStandardMaterial color="#1b1c1f" roughness={0.4} />
      </mesh>
      {/* black base band, the lid's hinge at the back and the pedal at the front (-z faces the room) */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.04, 28]} />
        <meshStandardMaterial color="#1b1c1f" roughness={0.5} />
      </mesh>
      <Block size={[0.08, 0.03, 0.03]} position={[0, 0.62, 0.17]} color="#1b1c1f" roughness={0.4} radius={0.008} />
      <Block size={[0.12, 0.025, 0.07]} position={[0, 0.03, -0.19]} color="#1b1c1f" roughness={0.5} radius={0.008} />
    </>
  )
}
