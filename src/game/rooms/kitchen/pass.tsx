import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import { CylinderGeometry, DoubleSide, ExtrudeGeometry, MeshStandardMaterial, Path, Shape, type Group, type Mesh } from 'three'
import { ShadowFigure } from '../../figure'
import { Block, PI } from '../../kit'
import type { Vec3 } from '../../mutations'
import { once } from '../../outsideLayers'
import { Hover } from '../living/oddities'
import { BRUSHED, DARK_STEEL, PASS, PASS_DEPTH, PORTHOLE, STAINLESS, STEEL_MAT, WHITE_CHINA } from './layout'
import { longTicketTexture, signTexture, ticketTexture, TICKETS } from './textures'

/*
 * The front wall: the pass with its heat lamps and ticket rail, the swing
 * door to the dining room, the hand-wash sink and the coat hooks. All built
 * facing +z and placed against the front wall turned round (rotation PI).
 */

// ---------------------------------------------------------------------------
// The pass counter and the plates waiting on it
// ---------------------------------------------------------------------------

const PLATE = new CylinderGeometry(0.14, 0.11, 0.022, 32)
const PLATE_STACK = new CylinderGeometry(0.135, 0.135, 0.3, 28)

/** Kitchen side of the pass: a stainless counter with plate shelves underneath. Front (+z) faces the line. */
export function PassCounter({ width }: { width: number }) {
  const d = PASS_DEPTH
  const h = PASS.sill
  return (
    <>
      <Block size={[width, h - 0.1, d - 0.04]} position={[0, 0.1 + (h - 0.1) / 2 - 0.02, -0.02]} {...BRUSHED} radius={0.008} />
      <Block size={[width + 0.04, 0.04, d]} position={[0, h - 0.02, 0]} {...STAINLESS} radius={0.006} />
      {/* open shelf of warm plates under the counter */}
      <mesh position={[0, 0.5, d / 2 - 0.015]}>
        <planeGeometry args={[width - 0.1, 0.62]} />
        <meshStandardMaterial color="#1b1c1f" roughness={0.9} />
      </mesh>
      <Block size={[width - 0.1, 0.02, d - 0.1]} position={[0, 0.42, -0.02]} {...STAINLESS} radius={0.004} />
      {[-1.2, -0.8, -0.4, 0.4, 0.8, 1.2].map((x) => (
        <mesh key={x} geometry={PLATE_STACK} material={WHITE_CHINA} position={[x, 0.58, 0]} />
      ))}
      <Block size={[width, 0.08, 0.02]} position={[0, 0.06, d / 2 - 0.03]} {...DARK_STEEL} radius={0.004} />
    </>
  )
}

function Plate({ at, children }: { at: Vec3; children?: ReactNode }) {
  return (
    <group position={at}>
      <mesh geometry={PLATE} material={WHITE_CHINA} position={[0, 0.011, 0]} castShadow />
      <group position={[0, 0.022, 0]}>{children}</group>
    </group>
  )
}

/** A steak with chips and a sprig of something. */
function SteakPlate() {
  return (
    <>
      <Block size={[0.11, 0.025, 0.08]} position={[-0.02, 0.0125, 0]} rotation={[0, 0.3, 0]} color="#5a2a1c" roughness={0.6} radius={0.012} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Block key={i} size={[0.07, 0.014, 0.014]} position={[0.06, 0.01 + (i % 2) * 0.012, -0.03 + i * 0.016]} rotation={[0, 0.4 - i * 0.2, 0]} color="#e8b44a" roughness={0.6} radius={0.004} />
      ))}
      <mesh position={[-0.05, 0.03, 0.05]}>
        <sphereGeometry args={[0.016, 10, 8]} />
        <meshStandardMaterial color="#3f8a2a" roughness={0.8} />
      </mesh>
    </>
  )
}

/** A bowl of tomato soup. */
function SoupPlate() {
  return (
    <>
      <mesh position={[0, 0.03, 0]} material={WHITE_CHINA}>
        <cylinderGeometry args={[0.085, 0.06, 0.06, 28, 1, true]} />
      </mesh>
      <mesh position={[0, 0.002, 0]} material={WHITE_CHINA}>
        <cylinderGeometry args={[0.06, 0.06, 0.004, 28]} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.078, 0.078, 0.004, 28]} />
        <meshStandardMaterial color="#c9452a" roughness={0.35} />
      </mesh>
    </>
  )
}

/** Fish and peas. */
function FishPlate() {
  return (
    <>
      <mesh position={[-0.01, 0.018, 0]} scale={[0.09, 0.02, 0.045]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#d9a44a" roughness={0.7} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0.06 + (i % 2) * 0.015, 0.008, -0.03 + i * 0.012]}>
          <sphereGeometry args={[0.008, 8, 6]} />
          <meshStandardMaterial color="#5aa02c" roughness={0.6} />
        </mesh>
      ))}
    </>
  )
}

function Jelly() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * 9
    ref.current.scale.set(1 + Math.sin(t) * 0.05, 1 - Math.sin(t) * 0.07, 1 + Math.sin(t) * 0.05)
  })
  return (
    <group ref={ref}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.055, 0.08, 0.1, 6]} />
        <meshStandardMaterial color="#3fdc4a" emissive="#0f5a14" emissiveIntensity={0.5} roughness={0.08} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.115, 0]}>
        <sphereGeometry args={[0.018, 12, 8]} />
        <meshStandardMaterial color="#d81e2c" roughness={0.2} />
      </mesh>
    </group>
  )
}

/** Plated food along the pass; the swaps cover one plate with a cloche or add a jelly. */
export function PassPlates({ mode }: { mode: 'normal' | 'cloche' | 'jelly' }) {
  return (
    <>
      <Plate at={[-1.2, PASS.sill, 0.05]}>
        <SteakPlate />
      </Plate>
      <Plate at={[0.4, PASS.sill, 0.0]}>
        <FishPlate />
      </Plate>
      <Plate at={[1.2, PASS.sill, 0.06]}>
        <SoupPlate />
      </Plate>
      {mode === 'cloche' ? (
        <group position={[-0.4, PASS.sill, -0.02]}>
          <mesh geometry={PLATE} material={WHITE_CHINA} position={[0, 0.011, 0]} />
          <mesh position={[0, 0.022, 0]} material={STEEL_MAT} castShadow>
            <sphereGeometry args={[0.13, 32, 16, 0, PI * 2, 0, PI / 2]} />
          </mesh>
          <mesh position={[0, 0.16, 0]} material={STEEL_MAT}>
            <sphereGeometry args={[0.018, 12, 8]} />
          </mesh>
        </group>
      ) : (
        <Plate at={[-0.4, PASS.sill, -0.02]}>
          <SteakPlate />
        </Plate>
      )}
      {mode === 'jelly' && (
        <Plate at={[0.0, PASS.sill, 0.12]}>
          <Jelly />
        </Plate>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Heat lamps on cords from the ceiling
// ---------------------------------------------------------------------------

const LAMP_XS = [-1.2, -0.4, 0.4, 1.2]
const LAMP_Y = 1.55
/** Which lamp drops or turns blue: the one over the empty end of the pass. */
const ODD_LAMP = 0

const SHADE_MAT = new MeshStandardMaterial({ color: '#b3231c', metalness: 0.4, roughness: 0.4, side: DoubleSide })

function HeatLamp({ y, ceiling, colour }: { y: number; ceiling: number; colour: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, (ceiling - y) / 2 + 0.1, 0]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.005, 0.005, ceiling - y - 0.2, 6]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} material={SHADE_MAT} castShadow>
        <cylinderGeometry args={[0.03, 0.11, 0.16, 24, 1, true]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} material={SHADE_MAT}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.06, 20, 12]} />
        <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function HeatLamps({ mode, ceiling }: { mode: 'normal' | 'blue' | 'low'; ceiling: number }) {
  return (
    <>
      {LAMP_XS.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <HeatLamp
            y={mode === 'low' && i === ODD_LAMP ? LAMP_Y - 0.3 : LAMP_Y}
            ceiling={ceiling}
            colour={mode === 'blue' && i === ODD_LAMP ? '#4fb0ff' : '#ff7a2a'}
          />
        </group>
      ))}
      {/* the warm glow they throw on the plates */}
      <pointLight position={[0, LAMP_Y - 0.1, 0]} intensity={1.6} distance={2.5} decay={1.8} color="#ff9a4a" />
    </>
  )
}

// ---------------------------------------------------------------------------
// The ticket rail
// ---------------------------------------------------------------------------

const TICKET_XS = [-1.3, -0.95, -0.5, -0.1, 0.35, 0.75, 1.2]
/** Which ticket says HELP, and which one keeps going. */
const HELP_TICKET = 3
const LONG_TICKET = 5

export function TicketRail({ mode, width }: { mode: 'normal' | 'help' | 'long'; width: number }) {
  const maps = useMemo(() => TICKETS.map((t, i) => ticketTexture(t.lines, t.table, mode === 'help' && i === HELP_TICKET ? 'help' : 'normal')), [mode])
  const long = useMemo(() => (mode === 'long' ? longTicketTexture() : null), [mode])
  return (
    <>
      <Block size={[width, 0.03, 0.03]} position={[0, 0, 0.015]} color="#d4d8dc" metalness={0.8} roughness={0.3} radius={0.006} />
      {TICKET_XS.map((x, i) => {
        const isLong = long && i === LONG_TICKET
        const h = isLong ? 0.72 : 0.16
        return (
          <mesh key={x} position={[x, -h / 2 + 0.005, 0.034]} rotation={[0, 0, ((i * 37) % 7) * 0.012 - 0.036]}>
            <planeGeometry args={[0.08, h]} />
            <meshStandardMaterial map={isLong ? long : maps[i]} roughness={0.9} side={DoubleSide} />
          </mesh>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Swing door to the dining room
// ---------------------------------------------------------------------------

const DOOR = { width: 0.86, height: 2.02, thick: 0.05 }
const BEVEL = 0.006

/** The door leaf: a slab with a round hole for the porthole, rounded off at the edges. */
const doorLeaf = once(() => {
  const w = DOOR.width / 2 - BEVEL
  const h = DOOR.height - BEVEL
  const shape = new Shape()
  shape.moveTo(-w, BEVEL)
  shape.lineTo(w, BEVEL)
  shape.lineTo(w, h)
  shape.lineTo(-w, h)
  shape.closePath()
  const hole = new Path()
  hole.absarc(0, PORTHOLE.y, PORTHOLE.r + BEVEL, 0, PI * 2, true)
  shape.holes.push(hole)
  const g = new ExtrudeGeometry(shape, { depth: DOOR.thick - BEVEL * 2, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 2, curveSegments: 40 })
  g.translate(0, 0, BEVEL + 0.005)
  return g
})

/** The swing door to the dining room, with a real porthole you can see through; `face`: someone stands behind it. */
export function SwingDoor({ face }: { face: boolean }) {
  return (
    <>
      <mesh geometry={doorLeaf()} castShadow receiveShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#6f8796" roughness={0.45} />
      </mesh>
      {/* the porthole's glass and its steel ring */}
      <mesh position={[0, PORTHOLE.y, 0.03]} renderOrder={2}>
        <circleGeometry args={[PORTHOLE.r, 40]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.1} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      <mesh position={[0, PORTHOLE.y, 0.058]}>
        <torusGeometry args={[PORTHOLE.r + 0.005, 0.018, 10, 40]} />
        <meshStandardMaterial {...STAINLESS} />
      </mesh>
      {face && (
        // somebody from the dining room, a step back from the door, looking in
        <group position={[0.02, 0, -0.45]}>
          <ShadowFigure height={1.64} phase={3} />
        </group>
      )}
      {/* kick plate and push plate */}
      <Block size={[0.8, 0.28, 0.01]} position={[0, 0.16, 0.06]} {...STAINLESS} radius={0.003} />
      <Block size={[0.12, 0.35, 0.01]} position={[0.28, 1.1, 0.06]} {...STAINLESS} radius={0.003} />
      {/* frame */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, 2.1, 0.07]} position={[s * 0.46, 1.05, 0.035]} color="#e9e7e1" roughness={0.45} />
      ))}
      <Block size={[0.98, 0.06, 0.07]} position={[0, 2.1, 0.035]} color="#e9e7e1" roughness={0.45} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Hand-wash sink
// ---------------------------------------------------------------------------

export function HandSink({ mode }: { mode: 'normal' | 'running' | 'sign' }) {
  const sign = useMemo(() => signTexture(['NOW WASH', mode === 'sign' ? 'MY HANDS' : 'YOUR HANDS'], '#1f5fbf', '#ffffff'), [mode])
  const water = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (water.current) water.current.scale.x = 1 + Math.sin(clock.elapsedTime * 40) * 0.15
  })
  return (
    <>
      {/* bowl on a wall bracket */}
      <Block size={[0.44, 0.16, 0.34]} position={[0, 0.8, 0.17]} {...STAINLESS} radius={0.02} />
      <mesh position={[0, 0.881, 0.18]} rotation={[-PI / 2, 0, 0]}>
        <planeGeometry args={[0.34, 0.24]} />
        <meshStandardMaterial color="#8d949a" metalness={0.8} roughness={0.25} />
      </mesh>
      <Block size={[0.44, 0.2, 0.02]} position={[0, 0.98, 0.01]} {...STAINLESS} radius={0.006} />
      {/* knee-operated tap: spout from the splashback */}
      <mesh position={[0, 1.02, 0.08]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.012, 0.012, 0.14, 10]} />
      </mesh>
      <mesh position={[0, 1.0, 0.145]} material={STEEL_MAT}>
        <cylinderGeometry args={[0.012, 0.012, 0.05, 10]} />
      </mesh>
      {mode === 'running' && (
        <mesh ref={water} position={[0, 0.93, 0.145]}>
          <cylinderGeometry args={[0.006, 0.008, 0.1, 10]} />
          <meshPhysicalMaterial color="#cfe8ff" transparent opacity={0.6} roughness={0.05} />
        </mesh>
      )}
      <Block size={[0.06, 0.18, 0.06]} position={[0, 0.55, 0.06]} {...STAINLESS} radius={0.01} />
      {/* soap, paper towels and the sign */}
      <Block size={[0.1, 0.18, 0.08]} position={[-0.17, 1.22, 0.04]} color="#f2f2ee" roughness={0.4} radius={0.01} />
      <Block size={[0.3, 0.36, 0.12]} position={[0.08, 1.38, 0.06]} color="#f2f2ee" roughness={0.4} radius={0.015} />
      <Block size={[0.18, 0.02, 0.06]} position={[0.08, 1.19, 0.1]} color="#f7f4ea" roughness={0.9} radius={0.004} />
      <mesh position={[0, 1.8, 0.005]}>
        <planeGeometry args={[0.42, 0.21]} />
        <meshStandardMaterial map={sign} roughness={0.5} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// Hooks by the door: an apron and the chef's hat
// ---------------------------------------------------------------------------

function ChefHat() {
  return (
    <>
      <mesh position={[0, 0.06, 0]} castShadow userData={{ paint: true }}>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 28]} />
        <meshStandardMaterial color="#fbfbf8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.17, 0]} scale={[1, 0.7, 1]} castShadow userData={{ paint: true }}>
        <sphereGeometry args={[0.135, 24, 16]} />
        <meshStandardMaterial color="#fbfbf8" roughness={0.9} />
      </mesh>
    </>
  )
}

export function CoatHooks({ floating }: { floating: boolean }) {
  return (
    <>
      <Block size={[0.4, 0.06, 0.02]} position={[0, 1.65, 0.01]} color="#7a5634" roughness={0.6} radius={0.006} />
      {[-0.12, 0.12].map((x) => (
        <Block key={x} size={[0.015, 0.015, 0.07]} position={[x, 1.65, 0.05]} rotation={[0.4, 0, 0]} {...DARK_STEEL} radius={0.005} />
      ))}
      {/* a striped apron on the left hook */}
      <Block size={[0.3, 0.7, 0.02]} position={[-0.12, 1.3, 0.04]} rotation={[0.04, 0, 0]} color="#2d4f8a" roughness={0.95} radius={0.006} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Block key={i} size={[0.012, 0.7, 0.002]} position={[-0.24 + i * 0.06, 1.3, 0.052]} rotation={[0.04, 0, 0]} color="#e8e8e2" roughness={0.95} radius={0.0009} />
      ))}
      {floating ? (
        <group position={[0.12, 0, 0.12]}>
          <Hover height={1.95}>
            <ChefHat />
          </Hover>
        </group>
      ) : (
        <group position={[0.12, 1.55, 0.2]} rotation={[-0.3, 0, 0]}>
          <ChefHat />
        </group>
      )}
    </>
  )
}
