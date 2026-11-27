import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import { CylinderGeometry, DoubleSide, MeshStandardMaterial, TorusGeometry, type Group } from 'three'
import { Block, PI } from '../../kit'
import type { Vec3 } from '../../mutations'
import { FacesYou } from '../living/oddities'
import { BODY, fishParts, skin, TAIL } from './fishParts'
import { carrotTop, cheeseSlab, HOOK_DROP, plateStack, sHook, slottedBlade, whiskWires } from './fx'
import { BENCH, BRUSHED, CHINA_OPEN, DARK_STEEL, STAINLESS, STEEL_MAT, STEEL_OPEN, WHITE_CHINA } from './layout'
import { fireBlanketTexture } from './textures'

/*
 * The prep area: stainless tables with what's being prepped on them, the
 * utensil rack over them, and the wall bench with the knife rack. Wall
 * things are built facing +z with their back on the wall.
 */

const LEG = new CylinderGeometry(0.02, 0.02, 1, 10)
const LEAVES = new MeshStandardMaterial({ color: '#4e9a2e', roughness: 0.7, side: DoubleSide })

/** A stainless table: top, legs, undershelf, and an optional upstand at the back. */
export function SteelTable({ width, depth, height = BENCH, upstand = false, children }: { width: number; depth: number; height?: number; upstand?: boolean; children?: ReactNode }) {
  return (
    <>
      <Block size={[width, 0.04, depth]} position={[0, height - 0.02, 0]} {...STAINLESS} radius={0.006} />
      {upstand && <Block size={[width, 0.12, 0.02]} position={[0, height + 0.06, -depth / 2 + 0.01]} {...STAINLESS} radius={0.004} />}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            geometry={LEG}
            material={STEEL_MAT}
            position={[sx * (width / 2 - 0.05), (height - 0.04) / 2, sz * (depth / 2 - 0.05)]}
            scale={[1, height - 0.04, 1]}
          />
        )),
      )}
      <Block size={[width - 0.08, 0.02, depth - 0.08]} position={[0, 0.2, 0]} {...BRUSHED} radius={0.004} />
      {children}
    </>
  )
}

// ---------------------------------------------------------------------------
// The fish on the prep table
// ---------------------------------------------------------------------------

const EYE = skin(0.875, 0.3, -0.002)
const IRIS = new MeshStandardMaterial({ color: '#c9a33f', roughness: 0.25, metalness: 0.2 })
const PUPIL = new MeshStandardMaterial({ color: '#050505', roughness: 0.05 })
const CORNEA = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.0, metalness: 0.1, transparent: true, opacity: 0.22 })

function FishEye({ side }: { side: 1 | -1 }) {
  return (
    <group position={[EYE.x, EYE.y, side * EYE.z]} rotation={[0, side > 0 ? 0.15 : PI - 0.15, 0]}>
      <mesh material={IRIS} scale={[1, 1, 0.5]}>
        <sphereGeometry args={[0.0115, 16, 12]} />
      </mesh>
      <mesh material={PUPIL} position={[0, 0, 0.0045]} scale={[1, 1, 0.45]}>
        <sphereGeometry args={[0.0068, 14, 10]} />
      </mesh>
      <mesh material={CORNEA} position={[0, 0, 0.001]} scale={[1, 1, 0.7]}>
        <sphereGeometry args={[0.012, 16, 12]} />
      </mesh>
    </group>
  )
}

/** The head's details: eyes, gill covers and mouth, both sides. */
function FishFace() {
  const f = fishParts()
  return (
    <>
      <FishEye side={1} />
      <FishEye side={-1} />
      {f.gills.map((g, i) => (
        <mesh key={`g${i}`} geometry={g} material={f.gillMat} />
      ))}
      {f.mouth.map((g, i) => (
        <mesh key={`m${i}`} geometry={g} material={f.gillMat} />
      ))}
    </>
  )
}

/** A pectoral fin laid back along the side, behind the gills, or a pelvic fin under the belly. */
function SideFin({ side, s, a, tilt }: { side: 1 | -1; s: number; a: number; tilt: number }) {
  const f = fishParts()
  const p = skin(s, a, 0.0015)
  return (
    <group position={[p.x, p.y, side * p.z]} rotation={[0, side * 0.22, tilt]}>
      <mesh geometry={f.pectoral} material={f.finMat} />
    </group>
  )
}

/** A whole sea bass, in fish space (see fishParts): tail at the back, snout forward along +x. */
function WholeFish() {
  const f = fishParts()
  return (
    <>
      <mesh geometry={f.body} material={f.skinMat} castShadow />
      <mesh geometry={f.tail} material={f.finMat} />
      <mesh geometry={f.dorsal1} material={f.finMat} />
      <mesh geometry={f.dorsal2} material={f.finMat} />
      <mesh geometry={f.anal} material={f.finMat} />
      {([1, -1] as const).map((side) => (
        <group key={side}>
          <SideFin side={side} s={0.74} a={-0.2} tilt={-0.2} />
          <SideFin side={side} s={0.66} a={-1.35} tilt={-0.55} />
        </group>
      ))}
      <FishFace />
    </>
  )
}

/** What's left after filleting: the head, the backbone and ribs, and the tail. */
function FishBones() {
  const f = fishParts()
  return (
    <>
      <mesh geometry={f.head} material={f.skinMat} />
      <FishFace />
      <mesh geometry={f.bones} material={f.boneMat} />
      <mesh geometry={f.tail} material={f.finMat} />
    </>
  )
}

/** How high its middle is when it lies on its side on the board. */
const LIE = 0.027

/** The fish lying on its side along local x, head to +x, back away from you; staring, it stands on its tail and points its face at you. */
export function Fish({ mode }: { mode: 'whole' | 'staring' | 'bones' }) {
  if (mode === 'staring') {
    return (
      <group position={[-(BODY + TAIL) / 2 + 0.02, 0.03, 0]}>
        <FacesYou position={[0, 0, 0]}>
          {/* fish space's +x (its snout) turned to face along +z */}
          <group rotation={[0, -PI / 2, 0]}>
            <group position={[TAIL, 0, 0]}>
              <WholeFish />
            </group>
          </group>
        </FacesYou>
      </group>
    )
  }
  return (
    // on its right side: its back towards -z, its left side up
    <group position={[-(BODY - TAIL) / 2, LIE, 0]} rotation={[-PI / 2, 0, 0]}>
      {mode === 'bones' ? <FishBones /> : <WholeFish />}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Colour-coded chopping boards in a rack
// ---------------------------------------------------------------------------

/** The UK colour code, back to front: raw meat, raw fish, salad, cooked meat, dairy, veg. */
const BOARD_COLOURS = ['#c62a2a', '#2a5fc6', '#3a9a3a', '#e8c21f', '#f4f4ef', '#8a5a2e']
const CHEESE_MAT = new MeshStandardMaterial({ color: '#f5cf4c', roughness: 0.55, emissive: '#3a2600', emissiveIntensity: 0.15 })

/** The boards standing in a rack, faces to the front (+z); `cheese`: the front one is a slab of Emmental. */
export function BoardRack({ cheese }: { cheese: boolean }) {
  return (
    <>
      <Block size={[0.46, 0.03, 0.28]} position={[0, 0.015, 0]} {...STAINLESS} radius={0.006} />
      {/* wire dividers at each end */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.215, 0.03, 0]}>
          {[-0.12, -0.072, -0.024, 0.024, 0.072, 0.12].map((z) => (
            <mesh key={z} position={[0, 0.06, z]} material={STEEL_MAT}>
              <cylinderGeometry args={[0.004, 0.004, 0.12, 6]} />
            </mesh>
          ))}
          <mesh position={[0, 0.12, 0]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT}>
            <cylinderGeometry args={[0.005, 0.005, 0.26, 6]} />
          </mesh>
        </group>
      ))}
      {BOARD_COLOURS.map((c, i) => {
        const z = -0.12 + i * 0.048
        const h = 0.34 - i * 0.014
        if (cheese && i === BOARD_COLOURS.length - 1) {
          return <mesh key={c} geometry={cheeseSlab()} material={CHEESE_MAT} position={[0, 0.03, z + 0.01]} rotation={[-0.05, 0, 0]} castShadow />
        }
        return <Block key={c} size={[0.4, h, 0.018]} position={[0, 0.03 + h / 2, z]} rotation={[-0.05, 0, 0]} color={c} roughness={0.6} radius={0.006} />
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Magnetic knife rack (on the wall, blades down)
// ---------------------------------------------------------------------------

function Knife({ x, blade, width, handle = '#1b1b1d' }: { x: number; blade: number; width: number; handle?: string }) {
  return (
    <group position={[x, 0, 0.025]}>
      <Block size={[0.024, 0.12, 0.022]} position={[0, 0.07, 0]} color={handle} roughness={0.5} radius={0.008} />
      <Block size={[width, blade, 0.003]} position={[0, -blade / 2 + 0.01, 0]} color="#d9dde1" metalness={0.9} roughness={0.2} radius={0.0012} />
    </group>
  )
}

export function KnifeRack({ mode }: { mode: 'normal' | 'spoon' | 'cleaver' }) {
  return (
    <>
      <Block size={[0.6, 0.05, 0.02]} position={[0, 0, 0.01]} color="#26282b" roughness={0.4} radius={0.006} />
      <Knife x={-0.24} blade={0.24} width={0.045} />
      <Knife x={-0.15} blade={0.26} width={0.03} handle="#3a2618" />
      {mode === 'spoon' ? (
        // a big serving spoon where the paring knife should be
        <group position={[-0.06, 0, 0.03]}>
          <Block size={[0.018, 0.2, 0.01]} position={[0, -0.02, 0]} {...STAINLESS} radius={0.004} />
          <mesh position={[0, -0.16, 0.006]} scale={[1, 1.4, 0.35]} material={STEEL_MAT}>
            <sphereGeometry args={[0.03, 16, 10]} />
          </mesh>
        </group>
      ) : (
        <Knife x={-0.06} blade={0.1} width={0.018} />
      )}
      <Knife x={0.03} blade={0.2} width={0.025} />
      <Knife x={0.12} blade={0.22} width={0.04} handle="#3a2618" />
      {mode !== 'cleaver' && <Knife x={0.23} blade={0.16} width={0.1} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Hanging utensil rack over the prep tables
// ---------------------------------------------------------------------------

const RAIL_Y = 2.35
const RAIL_LEN = 1.7
const LOOP = new TorusGeometry(0.009, 0.0022, 6, 16)

/** Each utensil hangs from its loop at the origin, down -y, its working face to the front (+z). */
function Ladle() {
  return (
    <>
      <mesh geometry={LOOP} material={STEEL_MAT} position={[0, -0.008, 0]} />
      <Block size={[0.016, 0.3, 0.005]} position={[0, -0.168, 0]} {...STAINLESS} radius={0.002} />
      {/* the bowl, open to the front, the handle meeting its rim */}
      <mesh position={[0, -0.36, 0.004]} rotation={[PI / 2, 0, 0]} material={BOWL}>
        <sphereGeometry args={[0.045, 24, 12, 0, PI * 2, PI / 2, PI / 2]} />
      </mesh>
      <mesh position={[0, -0.36, 0.004]} material={STEEL_MAT}>
        <torusGeometry args={[0.045, 0.002, 6, 32]} />
      </mesh>
    </>
  )
}

function Whisk() {
  return (
    <>
      <mesh geometry={LOOP} material={STEEL_MAT} position={[0, -0.008, 0]} />
      <mesh position={[0, -0.085, 0]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.011, 0.009, 0.13, 14]} />
      </mesh>
      <mesh position={[0, -0.152, 0]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.008, 0.011, 0.012, 14]} />
      </mesh>
      <mesh geometry={whiskWires()} material={STEEL_MAT} position={[0, -0.155, 0]} />
    </>
  )
}

function Tongs() {
  return (
    <>
      <mesh geometry={LOOP} material={STEEL_MAT} position={[0, -0.008, 0]} />
      <mesh position={[0, -0.022, 0]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.01, 0.01, 0.012, 14]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.008, -0.025, 0]} rotation={[0, 0, s * 0.04]}>
          <Block size={[0.015, 0.26, 0.003]} position={[0, -0.13, 0]} {...STAINLESS} radius={0.0012} />
          {/* scalloped grabbing ends */}
          <Block size={[0.03, 0.045, 0.004]} position={[s * 0.004, -0.275, 0.002]} rotation={[0, 0, -s * 0.08]} {...STAINLESS} radius={0.003} />
        </group>
      ))}
    </>
  )
}

function Spatula() {
  return (
    <>
      <mesh geometry={LOOP} material={STEEL_MAT} position={[0, -0.008, 0]} />
      <Block size={[0.024, 0.13, 0.014]} position={[0, -0.085, 0]} color="#17181b" roughness={0.55} radius={0.006} />
      <Block size={[0.012, 0.06, 0.004]} position={[0, -0.178, 0]} {...STAINLESS} radius={0.0015} />
      <mesh geometry={slottedBlade()} material={STEEL_MAT} position={[0, -0.205, 0.002]} rotation={[-0.1, 0, 0]} />
    </>
  )
}

const BOWL = new MeshStandardMaterial({ color: '#c3c9cf', metalness: 0.75, roughness: 0.3, side: DoubleSide })

function Swinging({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.x = Math.sin(t * 2.4) * 0.55
    ref.current.rotation.z = Math.sin(t * 1.7) * 0.06
  })
  return <group ref={ref}>{children}</group>
}

/** Left to right along the rail. */
const HUNG = ['ladle', 'whisk', 'spatula', 'tongs', 'ladle', 'whisk', 'spatula', 'tongs'] as const
const SWING_HOOK = 4
const BIG_WHISK = 5

/** A steel rail hung from the ceiling, with utensils on S-hooks; one ladle can swing by itself, one whisk can be enormous. */
export function UtensilRack({ mode, ceiling }: { mode: 'normal' | 'swing' | 'whisk'; ceiling: number }) {
  return (
    <>
      <mesh position={[0, RAIL_Y, 0]} rotation={[0, 0, PI / 2]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.012, 0.012, RAIL_LEN, 14]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * RAIL_LEN) / 2, RAIL_Y, 0]}>
          <mesh material={STEEL_MAT}>
            <sphereGeometry args={[0.018, 14, 10]} />
          </mesh>
        </group>
      ))}
      {/* drop rods to plates on the ceiling */}
      {[-1, 1].map((s) => (
        <group key={`r${s}`} position={[s * (RAIL_LEN / 2 - 0.1), 0, 0]}>
          <mesh position={[0, (RAIL_Y + ceiling) / 2, 0]} material={STEEL_MAT}>
            <cylinderGeometry args={[0.008, 0.008, ceiling - RAIL_Y, 8]} />
          </mesh>
          <Block size={[0.1, 0.015, 0.1]} position={[0, ceiling - 0.008, 0]} {...STAINLESS} radius={0.004} />
        </group>
      ))}
      {HUNG.map((kind, i) => {
        const x = -0.7 + i * 0.2
        const thing = kind === 'ladle' ? <Ladle /> : kind === 'whisk' ? <Whisk /> : kind === 'tongs' ? <Tongs /> : <Spatula />
        return (
          <group key={i} position={[x, RAIL_Y, 0]}>
            <mesh geometry={sHook()} material={STEEL_MAT} />
            <group position={[0, -HOOK_DROP, 0]}>
              {mode === 'swing' && i === SWING_HOOK ? (
                <Swinging>{thing}</Swinging>
              ) : mode === 'whisk' && i === BIG_WHISK ? (
                <group scale={2.6}>{thing}</group>
              ) : (
                thing
              )}
            </group>
          </group>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Static prep clutter
// ---------------------------------------------------------------------------

/** Veg prep on the second table: a board of carrots, a tub of onions, a stack of bowls. */
export function VegPrep() {
  const carrot = useMemo(() => new MeshStandardMaterial({ color: '#e8761f', roughness: 0.6 }), [])
  return (
    <>
      <Block size={[0.45, 0.025, 0.3]} position={[-0.35, BENCH + 0.0125, 0.05]} color="#3a9a3a" roughness={0.6} radius={0.006} />
      {/* a bunch of carrots, tips one way and their leafy tops the other */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[-0.38 + (i % 2) * 0.02, BENCH + 0.043, -0.04 + i * 0.038]} rotation={[0, 0.12 * (i - 2), 0]}>
          <mesh material={carrot} position={[0.08, 0, 0]} rotation={[0, 0, -PI / 2]}>
            <coneGeometry args={[0.016, 0.18, 12]} />
          </mesh>
          <mesh material={carrot} position={[-0.012, 0, 0]} scale={[0.6, 1, 1]}>
            <sphereGeometry args={[0.016, 12, 8]} />
          </mesh>
          <mesh geometry={carrotTop()} material={LEAVES} position={[-0.015, 0.004, 0]} />
        </group>
      ))}
      <Block size={[0.025, 0.003, 0.2]} position={[-0.2, BENCH + 0.027, 0.08]} rotation={[0, 0.5, 0]} color="#d9dde1" metalness={0.9} roughness={0.2} radius={0.001} />
      {/* gastronorm of chopped onion */}
      <Block size={[0.32, 0.1, 0.26]} position={[0.1, BENCH + 0.05, -0.05]} color="#d3d8dc" metalness={0.7} roughness={0.3} radius={0.006} />
      <Block size={[0.3, 0.02, 0.24]} position={[0.1, BENCH + 0.09, -0.05]} color="#efe9d8" roughness={0.8} radius={0.005} />
      {/* a stack of steel bowls */}
      {[0, 1, 2].map((k) => (
        <group key={k} position={[-0.05, BENCH + 0.035 + k * 0.025, 0.25]}>
          <mesh material={STEEL_OPEN}>
            <cylinderGeometry args={[0.12, 0.07, 0.07, 24, 1, true]} />
          </mesh>
          <mesh position={[0, 0.035, 0]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT}>
            <torusGeometry args={[0.12, 0.004, 6, 32]} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.05, BENCH + 0.002, 0.25]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.07, 0.07, 0.004, 24]} />
      </mesh>
    </>
  )
}

const PEPPER_MILL = new MeshStandardMaterial({ color: '#3a2618', roughness: 0.45 })
/** Lemons down in the bowl, and two more on top of the heap. */
const LEMONS: Vec3[] = [
  [0.05, 0.045, 0.0],
  [-0.025, 0.045, 0.045],
  [-0.03, 0.045, -0.045],
  [0.015, 0.085, 0.015],
  [-0.03, 0.08, -0.005],
]

/** A bowl of lemons and a pepper mill, sitting on the worktop (origin). */
export function Lemons() {
  return (
    <>
      {/* a hollow china bowl: its sides, a foot, and the floor inside */}
      <mesh position={[0, 0.04, 0]} material={CHINA_OPEN}>
        <cylinderGeometry args={[0.12, 0.07, 0.07, 28, 1, true]} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[PI / 2, 0, 0]} material={WHITE_CHINA}>
        <torusGeometry args={[0.12, 0.005, 6, 36]} />
      </mesh>
      <mesh position={[0, 0.006, 0]} material={WHITE_CHINA}>
        <cylinderGeometry args={[0.07, 0.065, 0.012, 28]} />
      </mesh>
      {LEMONS.map((at, i) => (
        <mesh key={i} position={at} rotation={[0, i * 1.3, 0.3]} scale={[1, 0.78, 0.78]}>
          <sphereGeometry args={[0.035, 16, 12]} />
          <meshStandardMaterial color="#f2d23a" roughness={0.5} />
        </mesh>
      ))}
      {/* the pepper mill: a waisted body and a knob on top */}
      <group position={[0.15, 0, 0.28]}>
        <mesh position={[0, 0.06, 0]} material={PEPPER_MILL}>
          <cylinderGeometry args={[0.024, 0.03, 0.12, 16]} />
        </mesh>
        <mesh position={[0, 0.14, 0]} material={PEPPER_MILL}>
          <cylinderGeometry args={[0.026, 0.024, 0.04, 16]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} material={PEPPER_MILL} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.026, 16, 8, 0, PI * 2, 0, PI / 2]} />
        </mesh>
        <mesh position={[0, 0.182, 0]} material={STEEL_MAT}>
          <sphereGeometry args={[0.009, 10, 8]} />
        </mesh>
      </group>
    </>
  )
}

/** The blue (fish) chopping board, sitting on the worktop (origin). */
export function FishBoard() {
  return <Block size={[0.62, 0.025, 0.4]} position={[0, 0.0125, 0]} color="#2a5fc6" roughness={0.6} radius={0.006} />
}

const SACK_TIE = new TorusGeometry(1, 0.18, 6, 16)

/** A sack standing on its bottom (`at`), tied off at the neck; `band`: a printed stripe round its front. */
export function Sack({ at, size, colour, band, rotation }: { at: Vec3; size: Vec3; colour: string; band?: string; rotation?: Vec3 }) {
  const [w, h, d] = size
  const body = h * 0.78
  return (
    <group position={at} rotation={rotation}>
      <Block size={[w, body, d]} position={[0, body / 2, 0]} color={colour} roughness={0.95} radius={Math.min(w, d) * 0.38} />
      {/* gathered in at the top, tied, and the ends fanning out above the tie */}
      <mesh position={[0, body - 0.01 + h * 0.07, 0]}>
        <cylinderGeometry args={[w * 0.12, w * 0.3, h * 0.16, 14]} />
        <meshStandardMaterial color={colour} roughness={0.95} />
      </mesh>
      <mesh geometry={SACK_TIE} position={[0, body + h * 0.13, 0]} rotation={[PI / 2, 0, 0]} scale={[w * 0.12, w * 0.12, w * 0.12]}>
        <meshStandardMaterial color="#8a6a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0, body + h * 0.19, 0]} scale={[w * 0.2, h * 0.07, w * 0.2]}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshStandardMaterial color={colour} roughness={0.95} />
      </mesh>
      {band && <Block size={[w * 0.72, h * 0.12, 0.006]} position={[0, body * 0.5, d / 2 + 0.001]} color={band} roughness={0.8} radius={0.002} />}
    </group>
  )
}

/** A stand mixer and a sack of flour for the wall bench. */
export function MixerAndFlour() {
  const paint = { color: '#c8302c', roughness: 0.35, metalness: 0.2 }
  return (
    <>
      <Block size={[0.24, 0.06, 0.36]} position={[0, BENCH + 0.03, 0]} {...paint} radius={0.02} />
      <Block size={[0.12, 0.34, 0.12]} position={[0, BENCH + 0.2, -0.12]} {...paint} radius={0.03} />
      <Block size={[0.16, 0.12, 0.36]} position={[0, BENCH + 0.4, -0.02]} {...paint} radius={0.05} />
      {/* the bowl, and the beater coming down into it from the head */}
      <mesh position={[0, BENCH + 0.14, 0.05]} material={STEEL_OPEN}>
        <cylinderGeometry args={[0.1, 0.07, 0.16, 24, 1, true]} />
      </mesh>
      <mesh position={[0, BENCH + 0.22, 0.05]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT}>
        <torusGeometry args={[0.1, 0.005, 6, 32]} />
      </mesh>
      <mesh position={[0, BENCH + 0.07, 0.05]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.07, 0.07, 0.01, 24]} />
      </mesh>
      <mesh position={[0, BENCH + 0.29, 0.05]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 10]} />
      </mesh>
      <mesh position={[0, BENCH + 0.19, 0.05]} material={STEEL_MAT} scale={[1, 1.4, 1]}>
        <torusGeometry args={[0.035, 0.006, 6, 20]} />
      </mesh>
      {/* the speed lever and a chrome strip along the head */}
      <Block size={[0.02, 0.02, 0.06]} position={[0.07, BENCH + 0.36, -0.12]} color="#e9e7e1" roughness={0.4} radius={0.008} />
      <Block size={[0.004, 0.04, 0.12]} position={[0.081, BENCH + 0.4, 0.0]} {...STAINLESS} radius={0.0015} />
      {/* a sack of flour, slumped against the wall */}
      <Sack at={[-0.6, BENCH, 0.05]} size={[0.3, 0.34, 0.22]} colour="#e9e1cc" band="#c8302c" />
    </>
  )
}

const TUB = new CylinderGeometry(0.06, 0.055, 0.14, 16)
const TUB_LIDS = ['#c8302c', '#e8b72a', '#3a8a3a', '#2a5fc6', '#f4f4ef', '#7a3b6e', '#d96a2a', '#222']

/** A wall shelf of spice and dry-goods tubs. */
export function SpiceShelf({ length }: { length: number }) {
  return (
    <>
      <Block size={[length, 0.03, 0.3]} position={[0, 0, 0.15]} {...STAINLESS} radius={0.004} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.02, 0.18, 0.22]} position={[s * (length / 2 - 0.15), -0.1, 0.11]} rotation={[0, 0, 0]} {...STAINLESS} radius={0.004} />
      ))}
      {Array.from({ length: Math.floor(length / 0.15) }, (_, i) => (
        <group key={i} position={[-length / 2 + 0.1 + i * 0.15, 0.085, 0.15]}>
          <mesh geometry={TUB}>
            <meshStandardMaterial color="#f2efe6" roughness={0.4} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0.075, 0]}>
            <cylinderGeometry args={[0.062, 0.062, 0.015, 16]} />
            <meshStandardMaterial color={TUB_LIDS[i % TUB_LIDS.length]} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** A mobile rack of gastronorm trays. */
export function TrayTrolley() {
  return (
    <>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <Block key={`${sx}${sz}`} size={[0.03, 1.6, 0.03]} position={[sx * 0.22, 0.85, sz * 0.25]} {...STAINLESS} radius={0.006} />),
      )}
      {[0.3, 0.55, 0.8, 1.05, 1.3, 1.55].map((y, i) => (
        <Block key={y} size={[0.42, 0.03, 0.5]} position={[0, y, 0]} color={i % 2 ? '#d3d8dc' : '#b8bec4'} metalness={0.7} roughness={0.3} radius={0.004} />
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`w${sx}${sz}`} position={[sx * 0.22, 0.04, sz * 0.25]} rotation={[0, 0, PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 14]} />
            <meshStandardMaterial color="#222" roughness={0.7} />
          </mesh>
        )),
      )}
    </>
  )
}

const WARM_STACK = plateStack(0.14, 11)
const WARM_BOWLS = plateStack(0.12, 7, 0.024)

/** Hot cupboard by the pass: plates kept warm inside, a stack on top. */
export function PlateWarmer() {
  return (
    <>
      <Block size={[0.9, 0.82, 0.58]} position={[0, 0.49, 0]} {...BRUSHED} radius={0.01} />
      <Block size={[0.92, 0.04, 0.6]} position={[0, 0.92, 0]} {...STAINLESS} radius={0.006} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.43, 0.6, 0.02]} position={[s * 0.215, 0.5, 0.3]} {...STAINLESS} radius={0.006} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={`h${s}`} size={[0.1, 0.02, 0.02]} position={[s * 0.06, 0.62, 0.32]} {...DARK_STEEL} radius={0.006} />
      ))}
      <mesh geometry={WARM_STACK} material={WHITE_CHINA} position={[-0.2, 0.94 + 0.1155, 0]} />
      <mesh geometry={WARM_BOWLS} material={WHITE_CHINA} position={[0.18, 0.94 + 0.084, 0.02]} />
      {[-1, 1].map((s) => (
        <mesh key={`l${s}`} position={[s * 0.4, 0.04, 0]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 14]} />
          <meshStandardMaterial color="#222" roughness={0.7} />
        </mesh>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Fire blanket (on the wall)
// ---------------------------------------------------------------------------

export function FireBlanket({ pulled }: { pulled: boolean }) {
  const label = useMemo(() => fireBlanketTexture(), [])
  return (
    <>
      <Block size={[0.26, 0.32, 0.07]} position={[0, 0, 0.035]} color="#c4161c" roughness={0.5} radius={0.012} paint />
      <mesh position={[0, 0, 0.0705]}>
        <planeGeometry args={[0.22, 0.28]} />
        <meshStandardMaterial map={label} roughness={0.5} />
      </mesh>
      {pulled && <Block size={[0.22, 0.42, 0.012]} position={[0, -0.36, 0.05]} rotation={[0.05, 0, 0.03]} color="#d9d4c4" roughness={0.95} radius={0.004} />}
      {[-0.06, 0.06].map((x) => (
        <Block key={x} size={[0.03, 0.08, 0.008]} position={[x, pulled ? -0.6 : -0.19, pulled ? 0.06 : 0.05]} color="#111" roughness={0.7} radius={0.003} />
      ))}
    </>
  )
}
