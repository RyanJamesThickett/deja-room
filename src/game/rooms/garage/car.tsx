import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { MeshStandardMaterial, TorusGeometry, type Group } from 'three'
import { Block, PI } from '../../kit'
import type { Vec3 } from '../../mutations'
import { FacesYou } from '../living/oddities'
import { bonnetPoint, CAR, CABIN_GEO, FRONT_GEO, HUB_GEO, NUT_GEO, REAR_GEO, RIM_GEO, TYRE_GEO, WHEEL_SPOTS, WING_GEO, wobbleAt } from './carShapes'
import { barBetween, LIFT_POST_X, LIFT_POST_Z, LIFT_RAISE, LIFT_TOP, rodBetween } from './layout'
import { plateTexture } from './textures'

/*
 * The two cars and the lift. Car space: standing on y = 0, nose towards -z,
 * +x is the car's right-hand side. Bodies, wheels, headlights, bonnet and
 * engine are separate pieces so each can be its own changeable item.
 */

const TYRE = new MeshStandardMaterial({ color: '#1b1b1d', roughness: 0.85 })
const RIM = new MeshStandardMaterial({ color: '#c9ced4', metalness: 0.85, roughness: 0.3 })
const DARK = new MeshStandardMaterial({ color: '#202225', roughness: 0.7 })
const GLASS = new MeshStandardMaterial({ color: '#1a252d', metalness: 0.6, roughness: 0.08 })
const CHROME = new MeshStandardMaterial({ color: '#e4e8ec', metalness: 1, roughness: 0.15 })
const BEZEL_GEO = new TorusGeometry(0.075, 0.014, 10, 32)

const NUTS: Vec3[] = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * PI * 2
  return [0.09, Math.cos(a) * 0.075, Math.sin(a) * 0.075]
})

/** A thin rod from `from` to `to`. */
export function Strut({ from, to, radius, color, metal = true }: { from: Vec3; to: Vec3; radius: number; color: string; metal?: boolean }) {
  const { position, quaternion, length } = useMemo(() => rodBetween(from, to), [from, to])
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 10]} />
      <meshStandardMaterial color={color} metalness={metal ? 0.8 : 0} roughness={metal ? 0.3 : 0.7} />
    </mesh>
  )
}

/** Painted panel material for a car body. */
function Paint({ colour }: { colour: string }) {
  return <meshStandardMaterial color={colour} metalness={0.35} roughness={0.32} />
}

/**
 * The body shell. `open` leaves the engine bay hollow under a raised bonnet
 * (the bonnet itself is a separate piece); `lights` adds plain headlights for
 * a car whose headlights aren't their own item.
 */
export function CarBody({ colour, open = false, lights = false, plate }: { colour: string; open?: boolean; lights?: boolean; plate: string }) {
  const front = useMemo(() => plateTexture(plate, false), [plate])
  const rear = useMemo(() => plateTexture(plate, true), [plate])
  const side = CAR.width / 2 - 0.02
  return (
    <>
      {open ? (
        <>
          {[0.88, -0.83].map((x) => (
            <mesh key={x} geometry={WING_GEO} position={[x, 0, 0]} rotation={[0, -PI / 2, 0]} castShadow receiveShadow userData={{ paint: true }}>
              <Paint colour={colour} />
            </mesh>
          ))}
          {/* front panel, slam panel and radiator across the nose */}
          <Block size={[1.64, 0.4, 0.07]} position={[0, 0.5, -2.04]} color={colour} metalness={0.35} roughness={0.32} paint />
          <Block size={[1.64, 0.05, 0.1]} position={[0, 0.69, -1.95]} color="#3a3d40" roughness={0.6} />
          <Block size={[1.2, 0.36, 0.05]} position={[0, 0.48, -1.87]} color="#18191b" roughness={0.8} />
          {/* bay floor, inner wings and strut tops */}
          <Block size={[1.64, 0.03, 1.12]} position={[0, 0.31, -1.46]} color="#2a2b2d" roughness={0.9} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Block size={[0.04, 0.42, 0.78]} position={[s * 0.66, 0.51, -1.3]} color="#3a3d40" roughness={0.6} />
              <Block size={[0.18, 0.03, 0.78]} position={[s * 0.74, 0.72, -1.3]} color="#3a3d40" roughness={0.6} />
              <mesh position={[s * 0.62, 0.75, -1.3]} material={DARK}>
                <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
              </mesh>
            </group>
          ))}
        </>
      ) : (
        <mesh geometry={FRONT_GEO} position={[side, 0, 0]} rotation={[0, -PI / 2, 0]} castShadow receiveShadow userData={{ paint: true }}>
          <Paint colour={colour} />
        </mesh>
      )}
      <mesh geometry={REAR_GEO} position={[side, 0, 0]} rotation={[0, -PI / 2, 0]} castShadow receiveShadow userData={{ paint: true }}>
        <Paint colour={colour} />
      </mesh>
      <mesh geometry={CABIN_GEO} material={GLASS} position={[0.72, 0, 0]} rotation={[0, -PI / 2, 0]} castShadow />
      {/* roof and pillars in body colour */}
      <Block size={[1.52, 0.04, 1.3]} position={[0, 1.4, 0.415]} color={colour} metalness={0.35} roughness={0.32} radius={0.015} paint />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[0.04, 0.82, 0.06]} position={[s * 0.745, 1.11, -0.54]} rotation={[0.907, 0, 0]} color={colour} metalness={0.35} roughness={0.32} paint />
          <Block size={[0.04, 0.72, 0.08]} position={[s * 0.745, 1.14, 1.315]} rotation={[2.307, 0, 0]} color={colour} metalness={0.35} roughness={0.32} paint />
          <Block size={[0.03, 0.5, 0.08]} position={[s * 0.75, 1.12, 0.36]} color="#16181a" roughness={0.5} />
          {/* door shut lines and handles */}
          {[-0.84, 0.36, 1.32].map((z) => (
            <Block key={z} size={[0.006, 0.52, 0.008]} position={[s * 0.891, 0.6, z]} color="#111" roughness={0.9} radius={0.002} />
          ))}
          {[0.15, 1.15].map((z) => (
            <Block key={z} size={[0.02, 0.03, 0.14]} position={[s * 0.895, 0.78, z]} color="#2a2c2e" metalness={0.5} roughness={0.4} radius={0.008} />
          ))}
          {/* wing mirror */}
          <Block size={[0.14, 0.09, 0.07]} position={[s * 0.96, 0.98, -0.66]} color={colour} metalness={0.35} roughness={0.32} radius={0.02} paint />
        </group>
      ))}
      {/* bumpers, grille, tail lights, plates */}
      <Block size={[1.82, 0.2, 0.14]} position={[0, 0.38, -2.05]} color="#2b2d30" roughness={0.6} radius={0.04} />
      <Block size={[1.82, 0.2, 0.14]} position={[0, 0.4, 2.05]} color="#2b2d30" roughness={0.6} radius={0.04} />
      {!open && <Block size={[0.9, 0.1, 0.04]} position={[0, 0.54, -2.08]} color="#111" roughness={0.5} />}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.32, 0.13, 0.05]} position={[s * 0.62, 0.72, 2.05]} color="#9c1010" emissive="#ff1a1a" emissiveIntensity={0.25} roughness={0.2} />
      ))}
      <mesh position={[0, 0.38, -2.125]} rotation={[0, PI, 0]}>
        <planeGeometry args={[0.52, 0.11]} />
        <meshStandardMaterial map={front} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.4, 2.125]}>
        <planeGeometry args={[0.52, 0.11]} />
        <meshStandardMaterial map={rear} roughness={0.4} />
      </mesh>
      {/* underneath: floor pan, exhaust, sump */}
      <Block size={[1.5, 0.02, 2.0]} position={[0, 0.27, 0.2]} color="#1c1d1f" roughness={0.9} />
      <mesh position={[0.35, 0.235, 0.5]} rotation={[PI / 2, 0, 0]} material={DARK}>
        <cylinderGeometry args={[0.03, 0.03, 3.0, 10]} />
      </mesh>
      <Block size={[0.3, 0.14, 0.5]} position={[0.35, 0.24, 1.6]} color="#4a4540" metalness={0.5} roughness={0.5} />
      <Block size={[0.4, 0.1, 0.34]} position={[0, 0.24, -1.45]} color="#2a2b2d" metalness={0.4} roughness={0.6} />
      {lights && <Headlights mode="normal" />}
    </>
  )
}

/** Cat ears on the roof, in body colour. */
export function CatEars({ colour }: { colour: string }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.42, 1.42, 0.25]} rotation={[0, 0, -s * 0.18]}>
          <mesh position={[0, 0.1, 0]} rotation={[0, PI / 4, 0]} castShadow userData={{ paint: true }}>
            <coneGeometry args={[0.13, 0.22, 4]} />
            <Paint colour={colour} />
          </mesh>
          <mesh position={[0, 0.09, -0.035]} rotation={[0, PI / 4, 0]}>
            <coneGeometry args={[0.07, 0.15, 4]} />
            <meshStandardMaterial color="#ff9fbf" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  )
}

const ODD_DOOR = { color: '#d81e2c', metalness: 0.35, roughness: 0.3 }

/**
 * The front door on the car's right-hand side, swapped for one off a red
 * car: the panel and its window frame, sitting a little proud of the body,
 * with a chrome strip and handle the green car never had.
 */
export function OddDoor() {
  return (
    <group position={[0.006, 0, 0]} rotation={[0, 0, 0.012]}>
      <Block size={[0.02, 0.55, 1.18]} position={[0.9, 0.59, -0.24]} {...ODD_DOOR} radius={0.006} />
      <Block size={[0.024, 0.025, 1.1]} position={[0.904, 0.66, -0.24]} color="#e4e8ec" metalness={1} roughness={0.15} radius={0.006} />
      <Block size={[0.03, 0.04, 0.16]} position={[0.91, 0.78, 0.15]} color="#e4e8ec" metalness={1} roughness={0.15} radius={0.01} />
      {/* window frame: along the sill, up the door pillar, along the roof line */}
      <Block size={[0.03, 0.04, 1.0]} position={[0.86, 0.885, -0.16]} {...ODD_DOOR} radius={0.008} />
      <Block size={[0.03, 0.5, 0.06]} position={[0.77, 1.12, 0.33]} {...ODD_DOOR} radius={0.008} />
      <Block size={[0.03, 0.035, 0.6]} position={[0.765, 1.355, 0.04]} {...ODD_DOOR} radius={0.008} />
      <Block size={[0.03, 0.035, 0.7]} position={[0.768, 1.12, -0.5]} rotation={[0.907 - PI / 2, 0, 0]} {...ODD_DOOR} radius={0.008} />
    </group>
  )
}

export type WheelKind = 'normal' | 'square' | 'missing' | 'flat' | 'wooden'

function Hub({ y = 0 }: { y?: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh geometry={HUB_GEO} material={CHROME} position={[0.075, 0, 0]} rotation={[0, 0, PI / 2]} />
      {NUTS.map((p, i) => (
        <mesh key={i} geometry={NUT_GEO} material={CHROME} position={p} rotation={[0, 0, PI / 2]} />
      ))}
    </group>
  )
}

/** One wheel, outer face towards +x. */
function Wheel({ kind }: { kind: WheelKind }) {
  switch (kind) {
    case 'normal':
      return (
        <>
          <mesh geometry={TYRE_GEO} material={TYRE} rotation={[0, 0, PI / 2]} castShadow />
          <mesh geometry={RIM_GEO} material={RIM} rotation={[0, 0, PI / 2]} />
          <Hub />
        </>
      )
    case 'flat':
      return (
        <>
          <group position={[0, -0.06, 0]} scale={[1, 0.8, 1.07]}>
            <mesh geometry={TYRE_GEO} material={TYRE} rotation={[0, 0, PI / 2]} castShadow />
          </group>
          <mesh geometry={RIM_GEO} material={RIM} position={[0, -0.045, 0]} rotation={[0, 0, PI / 2]} scale={[0.95, 1, 0.95]} />
          <Hub y={-0.045} />
        </>
      )
    case 'square':
      return (
        <>
          <Block size={[0.2, 0.6, 0.6]} color="#1b1b1d" roughness={0.85} radius={0.07} />
          <Block size={[0.205, 0.38, 0.38]} color="#c9ced4" metalness={0.85} roughness={0.3} radius={0.02} />
          <Hub />
        </>
      )
    case 'missing':
      // taken off for the brakes: disc, caliper and wheel studs
      return (
        <>
          <mesh material={RIM} position={[-0.02, 0, 0]} rotation={[0, 0, PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 0.025, 32]} />
          </mesh>
          <Block size={[0.07, 0.12, 0.13]} position={[-0.01, 0.11, 0.07]} color="#c0392b" roughness={0.4} radius={0.015} />
          <mesh material={CHROME} position={[0.01, 0, 0]} rotation={[0, 0, PI / 2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.04, 16]} />
          </mesh>
          {NUTS.map((p, i) => (
            <mesh key={i} material={CHROME} position={[0.04, p[1] * 0.7, p[2] * 0.7]} rotation={[0, 0, PI / 2]}>
              <cylinderGeometry args={[0.007, 0.007, 0.05, 6]} />
            </mesh>
          ))}
        </>
      )
    case 'wooden':
      // a cart wheel: wooden felloe, iron band, spokes
      return (
        <>
          <mesh rotation={[0, PI / 2, 0]} castShadow>
            <torusGeometry args={[0.27, 0.035, 10, 40]} />
            <meshStandardMaterial color="#8a5a2b" roughness={0.8} />
          </mesh>
          <mesh rotation={[0, PI / 2, 0]}>
            <torusGeometry args={[0.3, 0.012, 8, 40]} />
            <meshStandardMaterial color="#3a3530" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh rotation={[0, 0, PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.14, 16]} />
            <meshStandardMaterial color="#6e4520" roughness={0.8} />
          </mesh>
          {Array.from({ length: 10 }, (_, k) => {
            const a = (k / 10) * PI * 2
            return (
              <Block key={k} size={[0.025, 0.22, 0.025]} position={[0, Math.cos(a) * 0.15, Math.sin(a) * 0.15]} rotation={[a, 0, 0]} color="#9a6a38" roughness={0.8} radius={0.005} />
            )
          })}
        </>
      )
  }
}

/** All four wheels; wheel number `odd` (see WHEEL_SPOTS) is a `kind` wheel instead. */
export function Wheels({ odd = -1, kind = 'normal' }: { odd?: number; kind?: WheelKind }) {
  return (
    <>
      {WHEEL_SPOTS.map(({ at, side }, i) => (
        <group key={i} position={at} rotation={[0, side === 1 ? 0 : PI, 0]}>
          <Wheel kind={i === odd ? kind : 'normal'} />
        </group>
      ))}
    </>
  )
}

const LAMPS: Vec3[] = [
  [0.6, 0.6, -2.09],
  [-0.6, 0.6, -2.09],
]

/** Round twin headlights. `on`: lit, and each lamp turns to follow you. `lashes`: eyelashes. */
export function Headlights({ mode }: { mode: 'normal' | 'on' | 'lashes' }) {
  return (
    <>
      {LAMPS.map((at, i) => (
        <group key={i} position={at}>
          <mesh geometry={BEZEL_GEO} material={CHROME} />
          {mode === 'on' ? (
            <FacesYou position={[0, 0, 0]}>
              <mesh>
                <sphereGeometry args={[0.066, 24, 16]} />
                <meshStandardMaterial color="#f2f0e6" emissive="#fff1c4" emissiveIntensity={0.6} roughness={0.15} />
              </mesh>
              <mesh position={[0, 0, 0.062]}>
                <circleGeometry args={[0.04, 24]} />
                <meshBasicMaterial color="#fffbe8" toneMapped={false} />
              </mesh>
            </FacesYou>
          ) : (
            <mesh scale={[1, 1, 0.5]}>
              <sphereGeometry args={[0.068, 24, 16]} />
              <meshStandardMaterial color="#e8eef2" emissive="#fff6d8" emissiveIntensity={0.12} roughness={0.1} metalness={0.2} />
            </mesh>
          )}
          {mode === 'lashes' &&
            [0.45, 0.85, 1.25, 1.65, 2.05, 2.45].map((a) => (
              <Block
                key={a}
                size={[0.007, 0.065, 0.007]}
                position={[Math.cos(a) * 0.115, Math.sin(a) * 0.115, -0.01]}
                rotation={[0, 0, a - PI / 2]}
                color="#0b0b0b"
                roughness={0.6}
                radius={0.002}
              />
            ))}
        </group>
      ))}
      {mode === 'on' && <pointLight position={[0, 0.6, -2.6]} intensity={2.2} distance={4.5} decay={2} color="#fff1c8" />}
    </>
  )
}

const STAY_FROM: Vec3 = [-0.55, 0.72, -1.95]
const STAY_TO = bonnetPoint(-0.55, 0.95)

/** The open bonnet, hinged at the windscreen end, held up by its stay (or a baguette). */
export function Bonnet({ colour, stay }: { colour: string; stay: 'rod' | 'baguette' }) {
  const bread = useMemo(() => rodBetween(STAY_FROM, bonnetPoint(-0.55, 1.0)), [])
  return (
    <>
      <group position={CAR.hinge} rotation={[CAR.bonnetOpen, 0, 0]}>
        <Block size={[1.66, 0.035, CAR.bonnetLength]} position={[0, 0.018, -CAR.bonnetLength / 2]} color={colour} metalness={0.35} roughness={0.32} radius={0.012} paint />
        <Block size={[1.3, 0.012, 0.8]} position={[0, -0.006, -0.55]} color="#2a2a2a" roughness={0.95} />
      </group>
      {stay === 'rod' ? (
        <Strut from={STAY_FROM} to={STAY_TO} radius={0.007} color="#1c1c1c" />
      ) : (
        <group position={bread.position} quaternion={bread.quaternion}>
          <mesh castShadow>
            <capsuleGeometry args={[0.04, bread.length - 0.08, 8, 16]} />
            <meshStandardMaterial color="#d49a4f" roughness={0.75} />
          </mesh>
          {[-0.3, -0.1, 0.1, 0.3].map((y) => (
            <mesh key={y} position={[0, y, 0.036]} rotation={[0.5, 0, 0]}>
              <boxGeometry args={[0.03, 0.06, 0.012]} />
              <meshStandardMaterial color="#f1d9a8" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}
    </>
  )
}

/** An eyeball on a stalk, watching you. */
function StalkEye({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.012, 0.018, 0.07, 10]} />
        <meshStandardMaterial color="#7d5a5a" roughness={0.6} />
      </mesh>
      <FacesYou position={[0, 0.03, 0]}>
        <mesh>
          <sphereGeometry args={[0.06, 24, 16]} />
          <meshStandardMaterial color="#fffbe6" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.056]}>
          <circleGeometry args={[0.028, 24]} />
          <meshStandardMaterial color="#2fbf71" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.058]}>
          <circleGeometry args={[0.013, 16]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      </FacesYou>
    </group>
  )
}

/**
 * The engine, sitting on the floor of the open bay (origin at the bay floor's
 * centre). It may have grown eyes, or been replaced by a hamster in a wheel.
 */
export function Engine({ mode }: { mode: 'normal' | 'eyes' | 'hamster' }) {
  const wheel = useRef<Group>(null)
  const hamster = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (wheel.current) wheel.current.rotation.x = -t * 4
    if (hamster.current) hamster.current.position.y = Math.abs(Math.sin(t * 12)) * 0.012
  })
  return (
    <>
      {mode === 'hamster' ? (
        <>
          {[-1, 1].map((s) => (
            <group key={s}>
              <Block size={[0.02, 0.3, 0.03]} position={[s * 0.11, 0.15, -0.08]} rotation={[0.35, 0, 0]} color="#c9ced6" metalness={0.8} roughness={0.3} />
              <Block size={[0.02, 0.3, 0.03]} position={[s * 0.11, 0.15, 0.18]} rotation={[-0.35, 0, 0]} color="#c9ced6" metalness={0.8} roughness={0.3} />
            </group>
          ))}
          <group position={[0, 0.27, 0.05]}>
            <group ref={wheel}>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.08, 0, 0]} rotation={[0, PI / 2, 0]}>
                  <torusGeometry args={[0.2, 0.01, 8, 40]} />
                  <meshStandardMaterial color="#e94b8a" roughness={0.4} />
                </mesh>
              ))}
              {Array.from({ length: 16 }, (_, k) => {
                const a = (k / 16) * PI * 2
                return (
                  <mesh key={k} position={[0, Math.cos(a) * 0.2, Math.sin(a) * 0.2]} rotation={[0, 0, PI / 2]}>
                    <cylinderGeometry args={[0.005, 0.005, 0.16, 6]} />
                    <meshStandardMaterial color="#d9dde2" metalness={0.7} roughness={0.3} />
                  </mesh>
                )
              })}
              <mesh rotation={[0, 0, PI / 2]}>
                <cylinderGeometry args={[0.012, 0.012, 0.24, 8]} />
                <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
            {/* the hamster, running for its life at the bottom of the wheel */}
            <group ref={hamster} position={[0, -0.14, -0.02]}>
              <mesh scale={[0.8, 0.72, 1.15]} castShadow>
                <sphereGeometry args={[0.06, 20, 14]} />
                <meshStandardMaterial color="#d99a5b" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.02, -0.06]}>
                <sphereGeometry args={[0.035, 16, 12]} />
                <meshStandardMaterial color="#e2a86c" roughness={0.9} />
              </mesh>
              {[-1, 1].map((s) => (
                <group key={s}>
                  <mesh position={[s * 0.022, 0.05, -0.06]}>
                    <sphereGeometry args={[0.012, 10, 8]} />
                    <meshStandardMaterial color="#f2b8a0" roughness={0.8} />
                  </mesh>
                  <mesh position={[s * 0.016, 0.03, -0.09]}>
                    <sphereGeometry args={[0.005, 8, 6]} />
                    <meshBasicMaterial color="#111" />
                  </mesh>
                </group>
              ))}
            </group>
          </group>
        </>
      ) : (
        <>
          {/* block, cam cover, intake and exhaust manifolds, pulleys */}
          <Block size={[0.52, 0.3, 0.4]} position={[0, 0.2, 0.05]} color="#4a4d50" metalness={0.5} roughness={0.5} radius={0.02} />
          <Block size={[0.46, 0.08, 0.34]} position={[0, 0.39, 0.05]} color="#b8bcc0" metalness={0.8} roughness={0.35} radius={0.02} />
          {[-0.12, -0.04, 0.04, 0.12].map((x) => (
            <Block key={x} size={[0.02, 0.015, 0.28]} position={[x, 0.437, 0.05]} color="#9ea3a8" metalness={0.8} roughness={0.35} radius={0.004} />
          ))}
          <mesh position={[0.16, 0.445, 0.14]}>
            <cylinderGeometry args={[0.03, 0.03, 0.025, 16]} />
            <meshStandardMaterial color="#f2c230" roughness={0.4} />
          </mesh>
          <Block size={[0.36, 0.1, 0.12]} position={[0, 0.33, 0.3]} color="#2b2d30" roughness={0.6} radius={0.02} />
          <Block size={[0.4, 0.08, 0.06]} position={[0, 0.24, -0.19]} color="#7a4a2e" metalness={0.4} roughness={0.7} />
          {[0.12, 0.26].map((y) => (
            <mesh key={y} position={[0.29, y, -0.08]} rotation={[0, 0, PI / 2]} material={DARK}>
              <cylinderGeometry args={[0.06, 0.06, 0.04, 20]} />
            </mesh>
          ))}
          <Strut from={[0.12, 0.27, -0.2]} to={[0.12, 0.24, -0.4]} radius={0.02} color="#151515" metal={false} />
          {mode === 'eyes' && (
            <>
              <StalkEye at={[-0.1, 0.52, 0.02]} />
              <StalkEye at={[0.1, 0.52, 0.02]} />
            </>
          )}
        </>
      )}
      {/* air box, battery and coolant tank stay whatever the engine does */}
      <Block size={[0.26, 0.14, 0.32]} position={[-0.47, 0.3, -0.05]} color="#151618" roughness={0.6} radius={0.03} />
      <Block size={[0.18, 0.18, 0.25]} position={[0.47, 0.11, 0.18]} color="#1d1e20" roughness={0.6} radius={0.01} />
      {[
        { x: 0.42, c: '#c0392b' },
        { x: 0.52, c: '#111' },
      ].map(({ x, c }) => (
        <mesh key={x} position={[x, 0.215, 0.1]}>
          <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} />
          <meshStandardMaterial color={c} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.47, 0.28, -0.22]}>
        <cylinderGeometry args={[0.06, 0.06, 0.15, 20]} />
        <meshStandardMaterial color="#f4f1ea" transparent opacity={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0.47, 0.37, -0.22]}>
        <cylinderGeometry args={[0.03, 0.03, 0.03, 16]} />
        <meshStandardMaterial color="#e94b8a" roughness={0.5} />
      </mesh>
    </>
  )
}

const POST_W = 0.3
const POST_D = 0.36
const ARM_Y = LIFT_RAISE + 0.19
const PADS: Vec3[] = [
  [0.62, ARM_Y, -0.85],
  [0.62, ARM_Y, 0.8],
]

/** A post built as stacked slices, wobbling side to side like a strand of spaghetti. */
function WobblyPost({ colour }: { colour: string }) {
  const n = 28
  const h = LIFT_TOP / n
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const y = (i + 0.5) * h
        const x = wobbleAt(y)
        const slope = (wobbleAt(y + 0.01) - wobbleAt(y - 0.01)) / 0.02
        return (
          <Block
            key={i}
            size={[POST_W, h + 0.012, POST_D]}
            position={[x, y, 0]}
            rotation={[0, 0, -Math.atan(slope)]}
            color={colour}
            metalness={0.4}
            roughness={0.45}
            radius={0.004}
            paint
          />
        )
      })}
    </>
  )
}

/**
 * Two-post lift in bay space (floor at y = 0, car centre at the origin): a
 * post either side of the car, the overhead beam, and four swing arms with
 * rubber pads under the sills.
 */
export function Lift({ colour, wobbly = false }: { colour: string; wobbly?: boolean }) {
  const arms = useMemo(
    () => [-1, 1].flatMap((s) => PADS.map(([x, y, z]) => ({ s, pad: [s * x, y, z] as Vec3, ...barBetween([s * (LIFT_POST_X - 0.24), y, LIFT_POST_Z], [s * x, y, z]) }))),
    [],
  )
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * LIFT_POST_X, 0, LIFT_POST_Z]}>
          <Block size={[0.5, 0.02, 0.6]} position={[0, 0.01, 0]} color="#3a3d40" metalness={0.5} roughness={0.5} />
          {wobbly && s === 1 ? (
            <WobblyPost colour={colour} />
          ) : (
            <Block size={[POST_W, LIFT_TOP, POST_D]} position={[0, LIFT_TOP / 2, 0]} color={colour} metalness={0.4} roughness={0.45} paint />
          )}
          {/* carriage riding up the inside of the post */}
          <Block size={[0.18, 0.5, 0.3]} position={[-s * 0.24, ARM_Y - 0.15, 0]} color="#2c2f33" metalness={0.5} roughness={0.5} />
          {/* yellow and black warning stripe at knee height */}
          <Block size={[POST_W + 0.01, 0.12, POST_D + 0.01]} position={[wobbly && s === 1 ? wobbleAt(0.5) : 0, 0.5, 0]} color="#f2c230" roughness={0.5} />
        </group>
      ))}
      <Block size={[LIFT_POST_X * 2 + POST_W, 0.16, 0.24]} position={[0, LIFT_TOP + 0.08, LIFT_POST_Z]} color={colour} metalness={0.4} roughness={0.45} paint />
      {/* control box on the right-hand post */}
      <Block size={[0.12, 0.28, 0.18]} position={[LIFT_POST_X + POST_W / 2 + 0.06, 1.3, LIFT_POST_Z]} color="#e8e6df" roughness={0.5} />
      <mesh position={[LIFT_POST_X + POST_W / 2 + 0.125, 1.36, LIFT_POST_Z]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
        <meshStandardMaterial color="#2fbf71" roughness={0.4} />
      </mesh>
      <mesh position={[LIFT_POST_X + POST_W / 2 + 0.125, 1.25, LIFT_POST_Z]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
        <meshStandardMaterial color="#d8342c" roughness={0.4} />
      </mesh>
      {arms.map((a, i) => (
        <group key={i}>
          <Block size={[a.length, 0.08, 0.1]} position={a.position} rotation={[0, a.yaw, 0]} color="#2c2f33" metalness={0.5} roughness={0.5} />
          <mesh position={[a.pad[0], a.pad[1] + 0.065, a.pad[2]]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 20]} />
            <meshStandardMaterial color="#141414" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </>
  )
}
