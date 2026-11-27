import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import {
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Path,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  type Group,
} from 'three'
import { Block, Instanced, PI, type Placement } from '../../kit'
import type { Vec3 } from '../../mutations'
import { FacesYou } from '../living/oddities'
import { BAY_OF, corkscrewCurve, LOCKERS, lockerBayX, MAT_SIZE, OFFICER_BAY, RIDER_NAMES, ROOM } from './layout'
import { nameStripTexture, targetTexture } from './textures'

/*
 * The kit wall and the pole: open lockers with each rider's helmet on the
 * shelf, tunic on the rail and leggings pushed down over their boots on the
 * floor in front, ready to step into. The pole drops in beside them.
 *
 * Locker space: x along the wall, the wall at z = 0, the open fronts at +z.
 */

const FRAME_RED = '#a3221e'
const L = LOCKERS
const WIDTH = L.bays * L.bay

/** The row of open lockers. */
export function Lockers() {
  const names = useMemo(() => nameStripTexture(RIDER_NAMES), [])
  return (
    <>
      <Block size={[WIDTH, L.height, 0.02]} position={[0, L.height / 2, 0.01]} color="#7c858d" roughness={0.6} radius={0.004} />
      <Block size={[WIDTH, 0.08, L.depth]} position={[0, 0.04, L.depth / 2]} color="#3b3f44" roughness={0.7} radius={0.006} />
      {Array.from({ length: L.bays + 1 }, (_, i) => (
        <Block key={i} size={[0.025, L.height, L.depth]} position={[-WIDTH / 2 + i * L.bay, L.height / 2, L.depth / 2]} color={FRAME_RED} roughness={0.45} radius={0.004} paint />
      ))}
      <Block size={[WIDTH + 0.03, 0.03, L.depth]} position={[0, L.height - 0.015, L.depth / 2]} color={FRAME_RED} roughness={0.45} radius={0.004} paint />
      <Block size={[WIDTH + 0.03, 0.13, 0.02]} position={[0, L.height - 0.095, L.depth - 0.01]} color={FRAME_RED} roughness={0.45} radius={0.004} paint />
      <mesh position={[0, L.height - 0.095, L.depth + 0.001]}>
        <planeGeometry args={[WIDTH, 0.085]} />
        <meshStandardMaterial map={names} roughness={0.5} />
      </mesh>
      {/* helmet shelf and the hanging rail under it */}
      <Block size={[WIDTH, 0.02, L.depth - 0.02]} position={[0, L.shelf - 0.01, L.depth / 2]} color="#9aa1a8" metalness={0.5} roughness={0.4} radius={0.004} />
      <mesh position={[0, L.rail, L.depth / 2]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, WIDTH, 10]} />
        <meshStandardMaterial color="#d5d9dd" metalness={0.9} roughness={0.25} />
      </mesh>
    </>
  )
}

/** A steel door over the end bay, with vents top and bottom. */
export function LockerDoor() {
  return (
    <group position={[lockerBayX(BAY_OF.shut), 0, L.depth + 0.013]}>
      <Block size={[0.69, 1.96, 0.025]} position={[0, 1.06, 0]} color={FRAME_RED} roughness={0.45} radius={0.006} paint />
      {[1.75, 1.82, 1.89, 0.3, 0.37, 0.44].map((y) => (
        <Block key={y} size={[0.36, 0.025, 0.006]} position={[0, y, 0.014]} color="#2a1210" roughness={0.6} radius={0.002} />
      ))}
      <Block size={[0.03, 0.16, 0.035]} position={[0.28, 1.1, 0.025]} color="#d5d9dd" metalness={0.9} roughness={0.25} radius={0.01} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Helmets
// ---------------------------------------------------------------------------

/*
 * A modern UK structural fire helmet: a rounded shell with a short peak, the
 * gold face visor half down under it, reflective bands round the sides and
 * back, the chin strap, and the fabric neck protector at the back. Sitting on
 * a shelf it rests on its visor, strap and the curtain bunched behind it.
 */
const SHELL_R = 0.13
/** Shell centre above whatever it sits on. */
const SHELL_Y = 0.072
const SHELL_SCALE: Vec3 = [1, 1.2, 1.22]
const SHELL = new SphereGeometry(SHELL_R, 32, 20, 0, PI * 2, 0, PI * 0.55)
const SHELL_LINING = new SphereGeometry(SHELL_R * 0.97, 24, 12, 0, PI * 2, PI * 0.42, PI * 0.13)
const VISOR = new SphereGeometry(SHELL_R + 0.012, 28, 12, PI / 2 - 0.95, 1.9, PI * 0.43, PI * 0.19)
const VISOR_MAT = new MeshStandardMaterial({ color: '#d9a21e', metalness: 0.95, roughness: 0.12 })
const RIM_MAT = new MeshStandardMaterial({ color: '#1b1c1e', roughness: 0.6 })
const RIM = new TorusGeometry(SHELL_R * 0.988, 0.008, 8, 40)
/** The peak: half a disc sticking out of the front of the shell. */
const PEAK = new CylinderGeometry(0.155, 0.155, 0.01, 28, 1, false, -PI / 2, PI)
/** Reflective bands round the sides and back (the visor covers the front). */
const BAND_THETA = [0.75, PI * 2 - 1.5] as const
const BANDS = [
  { y: SHELL_Y + 0.013, geo: new CylinderGeometry(0.1315, 0.1316, 0.022, 32, 1, true, ...BAND_THETA), colour: '#e9eef0' },
  { y: SHELL_Y + 0.067, geo: new CylinderGeometry(0.1165, 0.122, 0.018, 32, 1, true, ...BAND_THETA), colour: '#d9e021' },
]
const STRAP = new TorusGeometry(0.115, 0.005, 6, 28, PI)
const NECK = new CylinderGeometry(SHELL_R * 0.96, 0.15, SHELL_Y - 0.025, 24, 1, true, PI - 1.55, 3.1)
const NECK_MAT = new MeshStandardMaterial({ color: '#1d2333', roughness: 0.95, side: DoubleSide })

/** A modern UK fire helmet sitting on a shelf, visor facing +z. */
export function Helmet({ colour = '#f2c200' }: { colour?: string }) {
  const y = SHELL_Y
  return (
    <>
      <mesh geometry={SHELL} position={[0, y, 0]} scale={SHELL_SCALE} castShadow userData={{ paint: true }}>
        <meshStandardMaterial color={colour} roughness={0.28} metalness={0.05} />
      </mesh>
      {/* black lining showing under the rim */}
      <mesh geometry={SHELL_LINING} material={RIM_MAT} position={[0, y, 0]} scale={SHELL_SCALE} />
      <mesh geometry={RIM} material={RIM_MAT} position={[0, y - 0.024, 0]} rotation={[PI / 2, 0, 0]} scale={[1, 1.22, 1]} />
      {/* the short peak over the visor, tipped down a touch */}
      <mesh geometry={PEAK} position={[0, y + 0.048, 0.012]} rotation={[0.14, 0, 0]} scale={[0.93, 1, 1.24]} castShadow userData={{ paint: true }}>
        <meshStandardMaterial color={colour} roughness={0.28} metalness={0.05} />
      </mesh>
      <mesh geometry={VISOR} material={VISOR_MAT} position={[0, y, 0]} scale={SHELL_SCALE} />
      {/* visor pivots, one each side */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={RIM_MAT} position={[s * 0.136, y + 0.02, 0.02]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.016, 16]} />
        </mesh>
      ))}
      {BANDS.map((b) => (
        <mesh key={b.y} geometry={b.geo} position={[0, b.y, 0]} scale={[1, 1, 1.22]}>
          <meshStandardMaterial color={b.colour} roughness={0.25} metalness={0.45} />
        </mesh>
      ))}
      {/* the service crest on the front of the shell, just above the peak */}
      <mesh position={[0, y + 0.082, 0.137]} rotation={[-0.5, 0, 0]}>
        <circleGeometry args={[0.018, 20]} />
        <meshStandardMaterial color="#e4e6e8" metalness={0.2} roughness={0.35} />
      </mesh>
      {/* neck protector, bunched up on the shelf behind */}
      <mesh geometry={NECK} material={NECK_MAT} position={[0, (y - 0.025) / 2, -0.01]} scale={[1, 1, 1.2]} />
      <Block size={[0.2, 0.006, 0.06]} position={[0, 0.003, -0.2]} color="#1d2333" roughness={0.95} radius={0.002} />
      {/* the chin strap lying in a loop on the shelf in front, and its buckle */}
      <mesh geometry={STRAP} material={RIM_MAT} position={[0, 0.005, 0.06]} rotation={[PI / 2, 0, 0]} scale={[1, 1.2, 1]} />
      <Block size={[0.035, 0.008, 0.022]} position={[0.07, 0.005, 0.15]} rotation={[0, -0.6, 0]} color="#9aa1a8" metalness={0.5} roughness={0.3} radius={0.002} />
    </>
  )
}

const CONE_MAT = new MeshStandardMaterial({ color: '#ff6a13', roughness: 0.55 })
const BAND_MAT = new MeshStandardMaterial({ color: '#f4f4f0', roughness: 0.4 })

/** A traffic cone `h` tall, standing on its square base. */
export function TrafficCone({ h }: { h: number }) {
  const r = h * 0.17
  return (
    <>
      <mesh material={RIM_MAT} position={[0, h * 0.02, 0]} castShadow>
        <boxGeometry args={[r * 2.3, h * 0.04, r * 2.3]} />
      </mesh>
      <mesh material={CONE_MAT} position={[0, h * 0.52, 0]} castShadow>
        <cylinderGeometry args={[r * 0.15, r, h * 0.96, 24]} />
      </mesh>
      <mesh material={BAND_MAT} position={[0, h * 0.6, 0]}>
        <cylinderGeometry args={[r * 0.46, r * 0.58, h * 0.16, 24]} />
      </mesh>
    </>
  )
}

const helmetAt = (i: number): Vec3 => [lockerBayX(i), L.shelf, L.depth / 2]

/** A helmet on the shelf of every bay that never changes. */
export function Helmets() {
  return (
    <>
      {Array.from({ length: L.bays }, (_, i) =>
        i === BAY_OF.watching || i === BAY_OF.cone ? null : (
          <group key={i} position={helmetAt(i)}>
            <Helmet colour={i === OFFICER_BAY ? '#f4f4f0' : '#f2c200'} />
          </group>
        ),
      )}
    </>
  )
}

/** The two bays whose helmets can change: 4 turns to watch you, 6 becomes a cone. */
export function HelmetBays({ mode }: { mode: 'default' | 'watching' | 'cone' }) {
  const at = helmetAt
  return (
    <>
      {mode === 'watching' ? (
        <FacesYou position={at(BAY_OF.watching)}>
          <Helmet />
        </FacesYou>
      ) : (
        <group position={at(BAY_OF.watching)}>
          <Helmet />
        </group>
      )}
      <group position={at(BAY_OF.cone)}>{mode === 'cone' ? <TrafficCone h={0.3} /> : <Helmet />}</group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tunics
// ---------------------------------------------------------------------------

const TUNIC = '#1e2533'
const TUNIC_DARK = '#141923'
const HIVIS = '#d9e021'
const SILVER = '#cfd4d8'

/** A fire tunic hanging from its hook at the origin, front facing +z. `reach` lifts the sleeves forward. */
export function Tunic({ reach = 0 }: { reach?: number }) {
  return (
    <>
      <mesh position={[0, -0.02, 0]} rotation={[0, PI / 2, 0]}>
        <torusGeometry args={[0.022, 0.004, 6, 16, PI * 1.4]} />
        <meshStandardMaterial color="#d5d9dd" metalness={0.9} roughness={0.25} />
      </mesh>
      <Block size={[0.38, 0.015, 0.015]} position={[0, -0.07, 0]} color="#d5d9dd" metalness={0.9} roughness={0.25} radius={0.005} />
      {/* the stand-up collar, open at the front */}
      <Block size={[0.24, 0.075, 0.16]} position={[0, -0.1, -0.005]} color={TUNIC_DARK} roughness={0.85} radius={0.03} />
      <Block size={[0.42, 0.62, 0.14]} position={[0, -0.42, 0]} color={TUNIC} roughness={0.85} radius={0.04} paint />
      {[
        [-0.55, HIVIS],
        [-0.6, SILVER],
        [-0.65, HIVIS],
      ].map(([y, c]) => (
        <Block key={y} size={[0.425, 0.03, 0.145]} position={[0, y as number, 0]} color={c as string} roughness={0.4} metalness={c === SILVER ? 0.5 : 0} radius={0.012} />
      ))}
      {/* storm flap down the front over the zip, and a chest pocket each side with its flap */}
      <Block size={[0.045, 0.6, 0.01]} position={[0, -0.42, 0.072]} color={TUNIC_DARK} roughness={0.85} radius={0.004} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.115, -0.29, 0.071]}>
          <Block size={[0.12, 0.11, 0.012]} color={TUNIC} roughness={0.85} radius={0.005} paint />
          <Block size={[0.13, 0.035, 0.018]} position={[0, 0.05, 0.002]} color={TUNIC_DARK} roughness={0.85} radius={0.006} />
          <Block size={[0.06, 0.012, 0.004]} position={[0, -0.02, 0.008]} color={HIVIS} roughness={0.4} radius={0.002} />
        </group>
      ))}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.265, -0.14, 0]} rotation={[-reach, 0, s * 0.07]}>
          {/* rounded shoulder where the sleeve is set in */}
          <Block size={[0.12, 0.09, 0.13]} position={[-s * 0.01, -0.02, 0]} color={TUNIC} roughness={0.85} radius={0.04} paint />
          <Block size={[0.11, 0.56, 0.12]} position={[0, -0.28, 0]} color={TUNIC} roughness={0.85} radius={0.04} paint />
          <Block size={[0.115, 0.03, 0.125]} position={[0, -0.44, 0]} color={HIVIS} roughness={0.4} radius={0.012} />
          <Block size={[0.115, 0.025, 0.125]} position={[0, -0.48, 0]} color={SILVER} roughness={0.3} metalness={0.5} radius={0.011} />
          {/* knitted cuff */}
          <Block size={[0.095, 0.045, 0.105]} position={[0, -0.575, 0]} color={TUNIC_DARK} roughness={0.95} radius={0.02} />
        </group>
      ))}
    </>
  )
}

/** Bobs and sways a little, as if somebody invisible were wearing it. */
function Worn({ position, children }: { position: Vec3; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = position[1] + Math.sin(t * 1.1) * 0.025
    ref.current.rotation.y = Math.sin(t * 0.6) * 0.12
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

const hook = (i: number): Vec3 => [lockerBayX(i), L.rail, L.depth / 2]

/** A tunic on the rail of every bay that never changes. */
export function Tunics() {
  return (
    <>
      {Array.from({ length: L.bays }, (_, i) =>
        i === BAY_OF.ghost || i === BAY_OF.tiny ? null : (
          <group key={i} position={hook(i)}>
            <Tunic />
          </group>
        ),
      )}
    </>
  )
}

/** The two bays whose tunics can change: 2 steps out on its own, 5 shrinks. */
export function TunicBays({ mode }: { mode: 'default' | 'ghost' | 'tiny' }) {
  return (
    <>
      {mode === 'ghost' ? (
        // stepped out of the locker and standing in front of it, arms reaching out
        <Worn position={[lockerBayX(BAY_OF.ghost), L.rail - 0.02, L.depth + 0.55]}>
          <Tunic reach={1.35} />
        </Worn>
      ) : (
        <group position={hook(BAY_OF.ghost)}>
          <Tunic />
        </group>
      )}
      <group position={hook(BAY_OF.tiny)} scale={mode === 'tiny' ? 0.45 : 1}>
        <Tunic />
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Boots and leggings
// ---------------------------------------------------------------------------

const RUBBER = new MeshStandardMaterial({ color: '#16171a', roughness: 0.55 })
const SHAFT = new CylinderGeometry(0.058, 0.062, 0.34, 20)
/** The boot with the goldfish in it: open at the top, so the water inside shows. */
const SHAFT_OPEN = new CylinderGeometry(0.058, 0.062, 0.34, 20, 1, true)
const RUBBER_OPEN = new MeshStandardMaterial({ color: '#16171a', roughness: 0.55, side: DoubleSide })
const FOOT = new SphereGeometry(0.07, 18, 12)
const OPENING = new CircleGeometry(0.05, 18)
const FOLD = new TorusGeometry(0.078, 0.03, 8, 20)
const FOLD_MAT = new MeshStandardMaterial({ color: TUNIC, roughness: 0.85 })
const STRIPE = new TorusGeometry(0.082, 0.012, 6, 20)
const STRIPE_MAT = new MeshStandardMaterial({ color: HIVIS, roughness: 0.4 })
const BOOT_XS = [-0.09, 0.09]
const FOLD_YS = [0.16, 0.22, 0.28]

/** Pairs of boots with leggings concertinaed down over them; toes point +z. */
export function BootPairs({ spots }: { spots: { x: number; turn?: number; full?: boolean }[] }) {
  const { folds, stripes } = useMemo(() => {
    const folds: Placement[] = []
    const stripes: Placement[] = []
    for (const { x, turn = 0 } of spots)
      for (const bx of BOOT_XS) {
        const px = x + Math.cos(turn) * bx
        const pz = -Math.sin(turn) * bx
        for (const y of FOLD_YS) folds.push({ at: [px, y, pz], rot: [PI / 2, 0, 0] })
        stripes.push({ at: [px, 0.25, pz], rot: [PI / 2, 0, 0] })
      }
    return { folds, stripes }
  }, [spots])
  return (
    <>
      {spots.map(({ x, turn = 0, full = false }) => (
        <group key={x} position={[x, 0, 0]} rotation={[0, turn, 0]}>
          {BOOT_XS.map((bx, k) => {
            // the left boot of a full pair is open-topped, with water in it
            const open = full && k === 0
            return (
              <group key={bx} position={[bx, 0, 0]}>
                <mesh geometry={open ? SHAFT_OPEN : SHAFT} material={open ? RUBBER_OPEN : RUBBER} position={[0, 0.2, -0.02]} castShadow userData={{ paint: true }} />
                <mesh geometry={FOOT} material={RUBBER} position={[0, 0.045, 0.06]} scale={[0.85, 0.7, 1.6]} userData={{ paint: true }} />
                <mesh geometry={OPENING} position={[0, open ? 0.24 : 0.371, -0.02]} rotation={[-PI / 2, 0, 0]}>
                  <meshBasicMaterial color="#060607" />
                </mesh>
              </group>
            )
          })}
          {/* braces trailing on the floor behind */}
          {[-0.07, 0.07].map((bx) => (
            <Block key={bx} size={[0.035, 0.008, 0.16]} position={[bx, 0.004, -0.11]} color="#b3201f" roughness={0.7} radius={0.003} />
          ))}
        </group>
      ))}
      <Instanced geometry={FOLD} material={FOLD_MAT} items={folds} />
      <Instanced geometry={STRIPE} material={STRIPE_MAT} items={stripes} />
    </>
  )
}

/** A goldfish living in a boot: circles under the water, and every few seconds leaps out and back. Built head first along +z. */
function BootGoldfish() {
  const fish = useRef<Group>(null)
  useFrame(({ clock }) => {
    const f = fish.current
    if (!f) return
    const t = clock.elapsedTime % 4
    if (t < 0.9) {
      // the leap: up out of the boot and back in, in a little arc along +x, nose up then nose down
      const k = t / 0.9
      f.position.set(-0.03 + k * 0.06, 0.345 + Math.sin(k * PI) * 0.3, 0)
      f.rotation.set(-(0.5 - k) * 2.2, PI / 2, 0, 'YXZ')
    } else {
      // swimming round anticlockwise seen from above, head along the direction of travel
      const a = clock.elapsedTime * 2.4
      f.position.set(Math.cos(a) * 0.022, 0.343, -Math.sin(a) * 0.022)
      f.rotation.set(0, a + PI, 0, 'YXZ')
    }
  })
  return (
    <>
      <mesh position={[0, 0.352, 0]} rotation={[-PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[0.057, 20]} />
        <meshStandardMaterial color="#3d7fb3" roughness={0.05} metalness={0.2} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <group ref={fish}>
        <mesh scale={[0.6, 0.75, 1.6]}>
          <sphereGeometry args={[0.018, 12, 10]} />
          <meshStandardMaterial color="#ff7a12" roughness={0.35} emissive="#ff5a00" emissiveIntensity={0.25} />
        </mesh>
        {/* eyes near the front, tail fin at the back */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.009, 0.004, 0.017]}>
            <sphereGeometry args={[0.0035, 8, 6]} />
            <meshBasicMaterial color="#0a0a0a" />
          </mesh>
        ))}
        <mesh position={[0, 0, -0.034]} rotation={[PI / 2, 0, 0]} scale={[0.4, 1, 1]}>
          {/* narrow end into the body, the fin fanning out behind */}
          <coneGeometry args={[0.018, 0.024, 10]} />
          <meshStandardMaterial color="#ff9a3c" roughness={0.4} />
        </mesh>
      </group>
      {/* splashes on the floor beside it */}
      <mesh position={[0.05, 0.002, 0.16]} rotation={[-PI / 2, 0, 0]} scale={[1.4, 1, 1]}>
        <circleGeometry args={[0.09, 24]} />
        <meshStandardMaterial color="#2b2d30" roughness={0.04} metalness={0.3} transparent opacity={0.6} />
      </mesh>
    </>
  )
}

const BOOT_Z = L.depth + 0.2

/** Boots on the floor in front of every bay that never changes. */
export function Boots() {
  const rest = useMemo(
    () =>
      Array.from({ length: L.bays }, (_, i) => i)
        .filter((i) => i !== BAY_OF.goldfish && i !== BAY_OF.backwards)
        .map((i) => ({ x: lockerBayX(i) })),
    [],
  )
  return (
    <group position={[0, 0, BOOT_Z]}>
      <BootPairs spots={rest} />
    </group>
  )
}

/** The two bays whose boots can change: 1 fills with water and a fish, 3 turns round. */
export function BootBays({ mode }: { mode: 'default' | 'goldfish' | 'backwards' }) {
  const spots = useMemo(
    () => [{ x: lockerBayX(BAY_OF.goldfish), full: mode === 'goldfish' }, { x: lockerBayX(BAY_OF.backwards), turn: mode === 'backwards' ? PI : 0 }],
    [mode],
  )
  return (
    <group position={[0, 0, BOOT_Z]}>
      <BootPairs spots={spots} />
      {mode === 'goldfish' && (
        <group position={[lockerBayX(BAY_OF.goldfish) + BOOT_XS[0], 0, -0.02]}>
          <BootGoldfish />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The fire pole and its crash mat
// ---------------------------------------------------------------------------

const POLE_R = 0.045
const POLE_MAT = new MeshStandardMaterial({ color: '#d9b25a', roughness: 0.18, metalness: 1 })
const TWIST = { bottom: 1.3, top: 3.1 }

/** The pole, from the hole in the ceiling to the floor (or through it). */
export function Pole({ mode }: { mode: 'default' | 'through' | 'twist' }) {
  const h = ROOM.height
  const coil = useMemo(() => (mode === 'twist' ? new TubeGeometry(corkscrewCurve(TWIST.bottom, TWIST.top, 0.09, 3), 160, POLE_R, 12, false) : null), [mode])
  const straight = (y0: number, y1: number) => (
    <mesh material={POLE_MAT} position={[0, (y0 + y1) / 2, 0]} castShadow>
      <cylinderGeometry args={[POLE_R, POLE_R, y1 - y0, 20]} />
    </mesh>
  )
  return (
    <>
      {coil ? (
        <>
          {straight(0, TWIST.bottom)}
          <mesh geometry={coil} material={POLE_MAT} castShadow />
          {straight(TWIST.top, h)}
        </>
      ) : (
        straight(0, h)
      )}
      {/* the hole in the ceiling it drops through */}
      <mesh position={[0, h - 0.003, 0]} rotation={[PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 40]} />
        <meshBasicMaterial color="#050506" />
      </mesh>
      {/* a steel collar lining the hole, and its rolled lip */}
      <mesh position={[0, h - 0.06, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.12, 40, 1, true]} />
        <meshStandardMaterial color="#5f666d" metalness={0.6} roughness={0.45} side={DoubleSide} />
      </mesh>
      <mesh position={[0, h - 0.12, 0]} rotation={[PI / 2, 0, 0]}>
        <torusGeometry args={[0.43, 0.025, 10, 48]} />
        <meshStandardMaterial color="#8d949a" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, h - 0.01, 0]} rotation={[PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.56, 40]} />
        <meshStandardMaterial color="#8d949a" metalness={0.6} roughness={0.4} />
      </mesh>
      {mode === 'through' ? (
        <>
          <mesh position={[0, 0.003, 0]} rotation={[-PI / 2, 0, 0]}>
            <circleGeometry args={[0.24, 36]} />
            <meshBasicMaterial color="#050506" />
          </mesh>
          <mesh material={POLE_MAT} position={[0, 0.012, 0]} rotation={[PI / 2, 0, 0]}>
            <torusGeometry args={[0.245, 0.014, 8, 40]} />
          </mesh>
        </>
      ) : (
        <mesh material={POLE_MAT} position={[0, 0.008, 0]}>
          <cylinderGeometry args={[0.11, 0.12, 0.016, 28]} />
        </mesh>
      )}
    </>
  )
}

const MAT_HOLE = 0.3
const MAT_THICK = 0.12

/** Square crash mat with a hole in the middle for the pole. */
export function CrashMat({ target }: { target: boolean }) {
  const geometry = useMemo(() => {
    const s = MAT_SIZE / 2 - 0.015
    const shape = new Shape()
    shape.moveTo(-s, -s)
    shape.lineTo(s, -s)
    shape.lineTo(s, s)
    shape.lineTo(-s, s)
    shape.closePath()
    const hole = new Path()
    hole.absarc(0, 0, MAT_HOLE + 0.015, 0, PI * 2, true)
    shape.holes.push(hole)
    return new ExtrudeGeometry(shape, { depth: MAT_THICK - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 32 })
  }, [])
  const map = useMemo(() => (target ? targetTexture() : null), [target])
  return (
    <>
      <mesh geometry={geometry} position={[0, 0.015, 0]} rotation={[-PI / 2, 0, 0]} castShadow receiveShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#1f4fa8" roughness={0.55} />
      </mesh>
      {map && (
        <mesh position={[0, MAT_THICK + 0.003, 0]} rotation={[-PI / 2, 0, 0]}>
          <planeGeometry args={[MAT_SIZE - 0.04, MAT_SIZE - 0.04]} />
          <meshStandardMaterial map={map} transparent roughness={0.5} />
        </mesh>
      )}
    </>
  )
}
