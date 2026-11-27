import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import {
  BackSide,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  TorusGeometry,
  type ShaderMaterial,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import { Block, PanelLight, PI } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { cheeseCurtain, cheeseString, flameParts, ovenElement, ovenRack } from './fx'
import { BRUSHED, CAST_IRON, DARK_STEEL, LINE, STAINLESS, STEEL_MAT, STEEL_OPEN } from './layout'
import { wireMeshTexture } from './textures'

/*
 * The cooking line, built as an island suite: each appliance is 0.9 deep,
 * centred on its own origin with the controls facing +z (towards the pass),
 * and its worktop at LINE.top. The salamander sits on a riser off the back
 * upstand; the hood hangs from the ceiling over the lot.
 */

const DEPTH = LINE.front - LINE.back
const TOP = LINE.top
const KNOB = new CylinderGeometry(0.022, 0.022, 0.025, 16)
const KNOB_MAT = new MeshStandardMaterial({ color: '#141518', roughness: 0.5 })
const LEG = new CylinderGeometry(0.025, 0.03, 0.1, 12)
const RING = new TorusGeometry(0.07, 0.012, 8, 32)
/** A rolled rim for the top of a pan, scaled to its radius. */
const RIM = new TorusGeometry(1, 0.05, 6, 40)

/** The oven's cavity in the range: its width, floor, roof and how far back it goes. */
const OVEN = { w: 0.96, y0: 0.22, y1: 0.64, back: -0.3 }

/** A cabinet body with the oven's cavity hollowed out of the front. */
function OvenBody({ width }: { width: number }) {
  const d = DEPTH - 0.02
  const h = TOP - 0.14
  const side = (width - 0.01 - OVEN.w) / 2
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[side, h, d]} position={[(s * (OVEN.w + side)) / 2, 0.1 + h / 2, 0]} {...BRUSHED} radius={0.01} />
      ))}
      <Block size={[OVEN.w + 0.01, OVEN.y0 - 0.1, d]} position={[0, (0.1 + OVEN.y0) / 2, 0]} {...BRUSHED} radius={0.004} />
      <Block size={[OVEN.w + 0.01, TOP - 0.04 - OVEN.y1, d]} position={[0, (OVEN.y1 + TOP - 0.04) / 2, 0]} {...BRUSHED} radius={0.004} />
      <Block
        size={[OVEN.w + 0.01, OVEN.y1 - OVEN.y0 + 0.01, d / 2 + OVEN.back]}
        position={[0, (OVEN.y0 + OVEN.y1) / 2, (-d / 2 + OVEN.back) / 2]}
        {...BRUSHED}
        radius={0.004}
      />
    </>
  )
}

/** Stainless cabinet on legs with a control strip; `children` dress the front. `oven`: hollow, with an oven in it. */
function Cabinet({ width, oven = false, children }: { width: number; oven?: boolean; children?: ReactNode }) {
  return (
    <>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={LEG} material={STEEL_MAT} position={[sx * (width / 2 - 0.06), 0.05, sz * (DEPTH / 2 - 0.06)]} />),
      )}
      {oven ? (
        <OvenBody width={width} />
      ) : (
        <Block size={[width - 0.01, TOP - 0.14, DEPTH - 0.02]} position={[0, 0.1 + (TOP - 0.14) / 2, 0]} {...BRUSHED} radius={0.01} />
      )}
      <Block size={[width, 0.04, DEPTH]} position={[0, TOP - 0.02, 0]} {...STAINLESS} radius={0.006} />
      {/* control strip along the front */}
      <Block size={[width - 0.02, 0.1, 0.03]} position={[0, TOP - 0.1, DEPTH / 2 - 0.0]} {...STAINLESS} radius={0.006} />
      {children}
    </>
  )
}

function Knobs({ xs }: { xs: number[] }) {
  return (
    <>
      {xs.map((x) => (
        <mesh key={x} geometry={KNOB} material={KNOB_MAT} position={[x, TOP - 0.1, DEPTH / 2 + 0.025]} rotation={[PI / 2, 0, 0]} />
      ))}
    </>
  )
}

/** A hinged cupboard door on the front of a cabinet. */
function CabinetDoor({ x, width }: { x: number; width: number }) {
  return (
    <>
      <Block size={[width, 0.55, 0.02]} position={[x, 0.45, DEPTH / 2]} {...STAINLESS} radius={0.006} />
      <Block size={[0.02, 0.18, 0.025]} position={[x + width / 2 - 0.05, 0.5, DEPTH / 2 + 0.02]} {...DARK_STEEL} radius={0.006} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Range: six burners over one big oven
// ---------------------------------------------------------------------------

const BURNERS: Vec3[] = [-0.38, 0, 0.38].flatMap((x) => [-0.2, 0.2].map((z): Vec3 => [x, TOP, z]))

export function Range({ width }: { width: number }) {
  return (
    <Cabinet width={width} oven>
      <Knobs xs={[-0.48, -0.32, -0.16, 0.16, 0.32, 0.48]} />
      {BURNERS.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          {/* the burner and its cast-iron trivet */}
          <mesh position={[0, 0.008, 0]} material={CAST_IRON}>
            <cylinderGeometry args={[0.08, 0.09, 0.016, 24]} />
          </mesh>
          {[0, 1].map((k) => (
            <mesh key={k} position={[0, 0.03, 0]} rotation={[0, k * (PI / 2), 0]} material={CAST_IRON}>
              <boxGeometry args={[0.34, 0.012, 0.02]} />
            </mesh>
          ))}
          <mesh position={[0, 0.03, 0]} rotation={[PI / 2, 0, 0]} material={CAST_IRON}>
            <torusGeometry args={[0.15, 0.008, 6, 32]} />
          </mesh>
        </group>
      ))}
      {/* oven door frame */}
      <Block size={[width - 0.1, 0.06, 0.02]} position={[0, 0.7, DEPTH / 2]} {...STAINLESS} radius={0.006} />
    </Cabinet>
  )
}

/** A saucepan front-middle and a sauté pan at the back on the right; same origin as the range. */
export function StovePans() {
  return (
    <>
      <group position={[0, TOP + 0.036, 0.2]}>
        <mesh position={[0, 0.06, 0]} material={STEEL_OPEN} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.12, 28, 1, true]} />
        </mesh>
        <mesh geometry={RIM} material={STEEL_MAT} position={[0, 0.12, 0]} rotation={[PI / 2, 0, 0]} scale={[0.1, 0.1, 0.12]} />
        <mesh position={[0, 0.003, 0]} material={STEEL_MAT}>
          <cylinderGeometry args={[0.1, 0.1, 0.006, 28]} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.096, 0.096, 0.004, 28]} />
          <meshStandardMaterial color="#c86b2a" roughness={0.3} />
        </mesh>
        <Block size={[0.03, 0.02, 0.2]} position={[0, 0.1, 0.19]} {...DARK_STEEL} radius={0.008} />
      </group>
      <group position={[0.38, TOP + 0.036, -0.2]}>
        <mesh position={[0, 0.03, 0]} material={STEEL_OPEN} castShadow>
          <cylinderGeometry args={[0.14, 0.13, 0.06, 28, 1, true]} />
        </mesh>
        <mesh geometry={RIM} material={STEEL_MAT} position={[0, 0.06, 0]} rotation={[PI / 2, 0, 0]} scale={[0.14, 0.14, 0.12]} />
        <mesh position={[0, 0.003, 0]} material={STEEL_MAT}>
          <cylinderGeometry args={[0.13, 0.13, 0.006, 28]} />
        </mesh>
        {/* a creamy sauce, a little way up the sides */}
        <mesh position={[0, 0.016, 0]}>
          <cylinderGeometry args={[0.133, 0.13, 0.02, 28]} />
          <meshStandardMaterial color="#d8c27a" roughness={0.6} />
        </mesh>
        <Block size={[0.03, 0.02, 0.24]} position={[0.12, 0.05, 0.17]} rotation={[0, 0.5, 0]} {...DARK_STEEL} radius={0.008} />
      </group>
    </>
  )
}

/** The lit burner, front right. */
const LIT: Vec3 = [0.38, TOP + 0.02, 0.2]

/** The lit burner's ring of blue flame. */
export function Flame() {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 17) * 0.04)
  })
  return (
    <mesh ref={ref} geometry={RING} position={LIT} rotation={[PI / 2, 0, 0]}>
      <meshStandardMaterial color="#4f9bff" emissive="#4f9bff" emissiveIntensity={3} toneMapped={false} transparent opacity={0.85} />
    </mesh>
  )
}

const noClick = () => null

/** The same burner roaring away with a flame most of a metre tall, licking up towards the hood. */
export function RoaringFlame() {
  const { geometry, outer, side, core } = flameParts()
  const tongue = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // every tongue shares the one clock uniform
    const m = tongue.current?.material as ShaderMaterial | undefined
    if (m) m.uniforms.uTime.value = t
  })
  return (
    <group position={LIT}>
      <mesh ref={tongue} geometry={geometry} material={outer} scale={[1.05, 0.85, 1.05]} renderOrder={3} raycast={noClick} />
      <mesh geometry={geometry} material={side} position={[0.05, 0, 0.03]} scale={[0.7, 0.62, 0.7]} renderOrder={3} raycast={noClick} />
      <mesh geometry={geometry} material={side} position={[-0.05, 0, -0.03]} scale={[0.65, 0.7, 0.65]} rotation={[0, 2, 0]} renderOrder={3} raycast={noClick} />
      <mesh geometry={geometry} material={core} scale={[0.55, 0.5, 0.55]} renderOrder={4} raycast={noClick} />
    </group>
  )
}

// no lamp inside (lights are dear): the enamel glows with the heat instead
const ENAMEL = new MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.35, metalness: 0.15, emissive: '#6a2a0a', emissiveIntensity: 1.3, side: BackSide })
const RACK_MAT = new MeshStandardMaterial({ color: '#b9bec4', metalness: 0.85, roughness: 0.3 })
const ELEMENT_MAT = new MeshStandardMaterial({ color: '#ff6a1a', emissive: '#ff4a0a', emissiveIntensity: 2.5, toneMapped: false })
const ROAST = new MeshStandardMaterial({ color: '#b8642a', roughness: 0.38 })
const SPUD = new MeshStandardMaterial({ color: '#dea040', roughness: 0.5 })

const SPUDS: [number, number][] = [
  [0.18, 0.12],
  [0.2, -0.12],
  [-0.2, 0.13],
  [-0.21, -0.11],
  [0.15, 0.0],
  [-0.22, 0.01],
]

/** The inside of the oven: enamel walls, runners, two wire shelves, glowing elements and a chicken roasting. */
function OvenInside() {
  const { w, y0, y1, back } = OVEN
  const front = (DEPTH - 0.02) / 2
  const d = front - back
  const zc = (front + back) / 2
  return (
    <>
      <mesh position={[0, (y0 + y1) / 2, zc]} material={ENAMEL}>
        <boxGeometry args={[w, y1 - y0, d]} />
      </mesh>
      {/* runners down each side wall */}
      {[-1, 1].flatMap((s) =>
        [0.31, 0.43, 0.55].map((y) => (
          <Block key={`${s}${y}`} size={[0.02, 0.012, d - 0.04]} position={[s * (w / 2 - 0.01), y - 0.012, zc]} color="#7d838a" metalness={0.7} roughness={0.4} radius={0.004} />
        )),
      )}
      {/* one wire shelf, low down; the upper runners are empty so you can see in */}
      <mesh geometry={ovenRack()} material={RACK_MAT} position={[0, 0.31, zc]} />
      <mesh geometry={ovenElement()} material={ELEMENT_MAT} position={[0, y0 + 0.02, zc]} />
      <mesh geometry={ovenElement()} material={ELEMENT_MAT} position={[0, y1 - 0.02, zc]} />
      {/* the fan's cover on the back wall */}
      <mesh position={[0, (y0 + y1) / 2, back + 0.002]}>
        <circleGeometry args={[0.12, 28]} />
        <meshStandardMaterial color="#3a3c42" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* a roasting tin on the lower shelf: a chicken and potatoes */}
      <group position={[0.02, 0.316, zc + 0.04]}>
        <Block size={[0.56, 0.045, 0.4]} position={[0, 0.0225, 0]} color="#2b2c31" metalness={0.5} roughness={0.45} radius={0.008} />
        <mesh position={[0, 0.046, 0]} rotation={[-PI / 2, 0, 0]}>
          <planeGeometry args={[0.52, 0.36]} />
          <meshStandardMaterial color="#7a3e14" roughness={0.15} />
        </mesh>
        <group position={[-0.04, 0.11, 0]} scale={1.2}>
          <mesh material={ROAST} scale={[0.13, 0.08, 0.1]}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
          <mesh material={ROAST} position={[0.02, 0.035, 0]} scale={[0.09, 0.055, 0.07]}>
            <sphereGeometry args={[1, 20, 12]} />
          </mesh>
          {/* drumsticks, knuckles out to the front */}
          {[-1, 1].map((s) => (
            <group key={s} position={[0.1, -0.015, s * 0.06]} rotation={[0, s * 0.35, -0.5]}>
              <mesh material={ROAST} position={[0.04, 0, 0]} rotation={[0, 0, PI / 2]}>
                <capsuleGeometry args={[0.03, 0.06, 6, 12]} />
              </mesh>
              <mesh position={[0.105, 0, 0]}>
                <sphereGeometry args={[0.013, 10, 8]} />
                <meshStandardMaterial color="#f2e6cc" roughness={0.5} />
              </mesh>
            </group>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`w${s}`} material={ROAST} position={[-0.06, 0.0, s * 0.095]} scale={[0.06, 0.03, 0.025]}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
          ))}
        </group>
        {SPUDS.map(([x, z], i) => (
          <mesh key={i} material={SPUD} position={[x, 0.07, z]} rotation={[i, i * 2, 0]} scale={[0.032, 0.024, 0.028]}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ))}
      </group>
    </>
  )
}

/** The oven door, hinged at the bottom; dropped right open it shows the oven inside, hot and roasting. */
export function OvenDoor({ width, open }: { width: number; open: boolean }) {
  const w = width - 0.14
  return (
    <>
      {open && <OvenInside />}
      <group position={[0, 0.2, DEPTH / 2 + 0.01]} rotation={[open ? 1.42 : 0, 0, 0]}>
        <Block size={[w, 0.46, 0.03]} position={[0, 0.23, 0]} {...STAINLESS} radius={0.008} />
        <mesh position={[0, 0.25, 0.017]}>
          <planeGeometry args={[w - 0.2, 0.2]} />
          <meshStandardMaterial color="#141414" roughness={0.1} metalness={0.4} />
        </mesh>
        {/* the inner glass, seen when it's down */}
        <mesh position={[0, 0.25, -0.016]} rotation={[0, PI, 0]}>
          <planeGeometry args={[w - 0.12, 0.3]} />
          <meshStandardMaterial color="#2a2522" roughness={0.15} metalness={0.3} />
        </mesh>
        <Block size={[w - 0.1, 0.025, 0.025]} position={[0, 0.42, 0.05]} {...STAINLESS} radius={0.01} />
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Stockpot (on the back-left burner)
// ---------------------------------------------------------------------------

const POT_R = 0.17
const POT_H = 0.32

export function Stockpot({ contents }: { contents: 'stock' | 'purple' | 'tentacle' }) {
  const foam = useRef<Group>(null)
  const arm = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (foam.current) foam.current.scale.set(1, 1 + Math.sin(t * 3.1) * 0.12, 1)
    if (arm.current) arm.current.rotation.set(Math.sin(t * 0.8) * 0.12, Math.sin(t * 0.5) * 0.3, Math.sin(t * 0.7) * 0.1)
  })
  const tentacle = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0.02, 0.12, 0.03),
      new Vector3(0.06, 0.24, 0.1),
      new Vector3(0.05, 0.33, 0.2),
      new Vector3(-0.01, 0.34, 0.27),
      new Vector3(-0.04, 0.28, 0.27),
    ])
    const geo = new TubeGeometry(curve, 48, 0.03, 12, false)
    // taper towards the tip
    const pos = geo.attributes.position
    const centre = new Vector3()
    const p = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      const ring = Math.floor(i / 13)
      const u = ring / 48
      curve.getPointAt(Math.min(u, 1), centre)
      p.fromBufferAttribute(pos, i).sub(centre).multiplyScalar(1 - u * 0.8).add(centre)
      pos.setXYZ(i, p.x, p.y, p.z)
    }
    geo.computeVertexNormals()
    return { geo, suckers: [0.35, 0.5, 0.62, 0.74, 0.84].map((u) => curve.getPointAt(u)) }
  }, [])
  return (
    <>
      <mesh position={[0, POT_H / 2, 0]} material={STEEL_OPEN} castShadow>
        <cylinderGeometry args={[POT_R, POT_R, POT_H, 32, 1, true]} />
      </mesh>
      <mesh position={[0, 0.004, 0]} material={STEEL_MAT}>
        <cylinderGeometry args={[POT_R, POT_R, 0.008, 32]} />
      </mesh>
      <mesh position={[0, POT_H, 0]} rotation={[PI / 2, 0, 0]} material={STEEL_MAT}>
        <torusGeometry args={[POT_R, 0.006, 6, 40]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (POT_R + 0.025), POT_H - 0.05, 0]} rotation={[0, 0, PI / 2]} material={STEEL_MAT}>
          <torusGeometry args={[0.025, 0.007, 6, 16, PI]} />
        </mesh>
      ))}
      {/* brown stock, a little below the rim */}
      <mesh position={[0, POT_H - 0.04, 0]}>
        <cylinderGeometry args={[POT_R - 0.005, POT_R - 0.005, 0.01, 32]} />
        <meshStandardMaterial color={contents === 'purple' ? '#7a1fb8' : '#7a4a22'} roughness={0.2} />
      </mesh>
      {contents === 'purple' && (
        <>
          <group ref={foam} position={[0, POT_H - 0.02, 0]}>
            <mesh scale={[1, 0.45, 1]}>
              <sphereGeometry args={[POT_R + 0.015, 28, 14, 0, PI * 2, 0, PI / 2]} />
              <meshStandardMaterial color="#a63ff0" emissive="#5a0f9a" emissiveIntensity={0.4} roughness={0.35} />
            </mesh>
          </group>
          {/* drips running down the outside of the pot */}
          {[0.3, 1.4, 2.3, 3.6, 4.9].map((a, i) => (
            <mesh key={a} position={[Math.cos(a) * (POT_R + 0.008), POT_H - 0.06 - i * 0.015, Math.sin(a) * (POT_R + 0.008)]}>
              <capsuleGeometry args={[0.014, 0.08 + i * 0.03, 4, 8]} />
              <meshStandardMaterial color="#a63ff0" roughness={0.35} />
            </mesh>
          ))}
        </>
      )}
      {contents === 'tentacle' && (
        <group ref={arm} position={[0.02, POT_H - 0.04, 0.02]}>
          <mesh geometry={tentacle.geo} castShadow>
            <meshStandardMaterial color="#b0406a" roughness={0.45} />
          </mesh>
          {tentacle.suckers.map((p, i) => (
            <mesh key={i} position={[p.x, p.y - 0.018, p.z]}>
              <sphereGeometry args={[0.009, 8, 6]} />
              <meshStandardMaterial color="#f2b6c8" roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}
      {contents === 'stock' && (
        // a ladle left in the pot
        <group position={[0.06, POT_H - 0.05, 0.04]} rotation={[0.25, 0, -0.35]}>
          <mesh position={[0, 0.17, 0]} material={STEEL_MAT}>
            <cylinderGeometry args={[0.007, 0.007, 0.34, 8]} />
          </mesh>
          {/* the hook on the end of the handle */}
          <mesh position={[0.018, 0.34, 0]} material={STEEL_MAT}>
            <torusGeometry args={[0.018, 0.006, 6, 16, PI]} />
          </mesh>
        </group>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Griddle
// ---------------------------------------------------------------------------

const PATTY = { color: '#5a3320', roughness: 0.8 }

function Egg({ at, square = false }: { at: Vec3; square?: boolean }) {
  return (
    <group position={at}>
      {square ? (
        <Block size={[0.13, 0.008, 0.13]} position={[0, 0.004, 0]} color="#fbfaf2" roughness={0.4} radius={0.003} />
      ) : (
        <mesh position={[0, 0.004, 0]} scale={[1, 1, 0.85]}>
          <cylinderGeometry args={[0.07, 0.075, 0.008, 20]} />
          <meshStandardMaterial color="#fbfaf2" roughness={0.4} />
        </mesh>
      )}
      {square ? (
        <Block size={[0.05, 0.02, 0.05]} position={[0.005, 0.01, -0.005]} color="#ffb21f" roughness={0.25} radius={0.008} />
      ) : (
        <mesh position={[0.008, 0.006, -0.006]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.03, 16, 10]} />
          <meshStandardMaterial color="#ffb21f" roughness={0.25} />
        </mesh>
      )}
    </group>
  )
}

function Patty({ at }: { at: Vec3 }) {
  return <Block size={[0.1, 0.018, 0.1]} position={[at[0], at[1] + 0.009, at[2]]} {...PATTY} radius={0.009} />
}

/** Flat-top griddle on a cupboard base, the food is drawn by GriddleFood. */
export function Griddle({ width }: { width: number }) {
  return (
    <Cabinet width={width}>
      <Knobs xs={[-0.3, 0, 0.3]} />
      <CabinetDoor x={-width / 4} width={width / 2 - 0.04} />
      <CabinetDoor x={width / 4} width={width / 2 - 0.04} />
      {/* the plate, its splash guards and the grease trough at the front */}
      <Block size={[width - 0.04, 0.025, DEPTH - 0.14]} position={[0, TOP + 0.012, -0.03]} color="#2a2b2e" metalness={0.6} roughness={0.5} radius={0.004} />
      <Block size={[width - 0.04, 0.09, 0.015]} position={[0, TOP + 0.045, -DEPTH / 2 + 0.03]} {...STAINLESS} radius={0.004} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.015, 0.09, DEPTH - 0.14]} position={[s * (width / 2 - 0.025), TOP + 0.045, -0.03]} {...STAINLESS} radius={0.004} />
      ))}
      <Block size={[width - 0.08, 0.02, 0.05]} position={[0, TOP + 0.01, DEPTH / 2 - 0.05]} {...DARK_STEEL} radius={0.004} />
    </Cabinet>
  )
}

const PLATE_Y = TOP + 0.025

/** What's cooking on the griddle: breakfast, or breakfast making a face. */
export function GriddleFood({ mode }: { mode: 'normal' | 'face' | 'square' }) {
  if (mode === 'face') {
    return (
      <>
        <Egg at={[-0.17, PLATE_Y, -0.15]} />
        <Egg at={[0.17, PLATE_Y, -0.15]} />
        {/* a sausage nose and a mouth of burgers */}
        <mesh position={[0, PLATE_Y + 0.016, 0.0]} rotation={[PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.016, 0.07, 4, 10]} />
          <meshStandardMaterial color="#8a4a2a" roughness={0.6} />
        </mesh>
        {[-0.28, -0.15, 0, 0.15, 0.28].map((x) => (
          <Patty key={x} at={[x, PLATE_Y, 0.17 - x * x * 1.6]} />
        ))}
      </>
    )
  }
  const square = mode === 'square'
  return (
    <>
      <Patty at={[-0.26, PLATE_Y, -0.1]} />
      <Patty at={[-0.12, PLATE_Y, -0.12]} />
      <Patty at={[-0.24, PLATE_Y, 0.06]} />
      <Patty at={[-0.1, PLATE_Y, 0.05]} />
      <Egg at={[0.12, PLATE_Y, -0.1]} square={square} />
      <Egg at={[0.27, PLATE_Y, 0.04]} square={square} />
      {/* rashers of bacon */}
      {[0, 1].map((k) => (
        <Block key={k} size={[0.16, 0.006, 0.035]} position={[0.08, PLATE_Y + 0.003, 0.1 + k * 0.05]} rotation={[0, 0.2, 0]} color="#b0473a" roughness={0.6} radius={0.002} />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Deep fryer
// ---------------------------------------------------------------------------

const WELL_X = [-0.14, 0.14]
const BASKET = { w: 0.2, d: 0.28, h: 0.14 }
/** The hanger the baskets hook onto to drain, along the back of the fryer. */
const HANGER = { y: TOP + 0.32, z: -DEPTH / 2 + 0.06 }

const WIRE_ROD = new CylinderGeometry(0.004, 0.004, 1, 6)
const BASKET_STEEL = new MeshStandardMaterial({ color: '#c9ced3', metalness: 0.85, roughness: 0.3 })

/** A rod of the basket's frame from a to b. */
function Rod({ a, b }: { a: Vec3; b: Vec3 }) {
  const d = new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const len = d.length()
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.normalize())
  return <mesh geometry={WIRE_ROD} material={BASKET_STEEL} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q} scale={[1, len, 1]} />
}

/**
 * A wire fryer basket, its origin at the middle of its rim. The handle comes
 * off the front of the rim (+z, towards the cook) and climbs out over the
 * front edge of the fryer, where a hand can grab it.
 */
function Basket({ chips = false }: { chips?: boolean }) {
  const mesh = useMemo(() => wireMeshTexture(), [])
  const { w, d, h } = BASKET
  const x = w / 2
  const z = d / 2
  return (
    <>
      {/* rim and bottom frame */}
      {[0, -h].flatMap((y) => [
        <Rod key={`f${y}`} a={[-x, y, z]} b={[x, y, z]} />,
        <Rod key={`b${y}`} a={[-x, y, -z]} b={[x, y, -z]} />,
        <Rod key={`l${y}`} a={[-x, y, -z]} b={[-x, y, z]} />,
        <Rod key={`r${y}`} a={[x, y, -z]} b={[x, y, z]} />,
      ])}
      {/* wire mesh sides and bottom */}
      {[
        { at: [0, -h / 2, z] as Vec3, rot: [0, 0, 0] as Vec3, size: [w, h] },
        { at: [0, -h / 2, -z] as Vec3, rot: [0, 0, 0] as Vec3, size: [w, h] },
        { at: [-x, -h / 2, 0] as Vec3, rot: [0, PI / 2, 0] as Vec3, size: [d, h] },
        { at: [x, -h / 2, 0] as Vec3, rot: [0, PI / 2, 0] as Vec3, size: [d, h] },
        { at: [0, -h, 0] as Vec3, rot: [PI / 2, 0, 0] as Vec3, size: [w, d] },
      ].map(({ at, rot, size }, i) => (
        <mesh key={i} position={at} rotation={rot}>
          <planeGeometry args={[size[0], size[1]]} />
          <meshStandardMaterial map={mesh} alphaTest={0.4} side={DoubleSide} color="#c9ced3" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      {chips && (
        // a heap of chips, still glistening
        <mesh position={[0, -h + 0.04, 0]} scale={[0.085, 0.05, 0.12]}>
          <sphereGeometry args={[1, 14, 8]} />
          <meshStandardMaterial color="#e7b54a" roughness={0.45} />
        </mesh>
      )}
      {/* the hook at the back that hangs it on the hanger */}
      <Rod a={[-0.03, 0, -z]} b={[-0.03, 0.035, -z - 0.02]} />
      <Rod a={[0.03, 0, -z]} b={[0.03, 0.035, -z - 0.02]} />
      {/* handle: two wires up from the front of the rim, joining in a black grip out over the edge */}
      <Rod a={[-0.04, 0, z]} b={[0, 0.05, z + 0.12]} />
      <Rod a={[0.04, 0, z]} b={[0, 0.05, z + 0.12]} />
      <group position={[0, 0.05, z + 0.12]} rotation={[-0.32, 0, 0]}>
        <Block size={[0.026, 0.026, 0.16]} position={[0, 0, 0.08]} color="#151515" roughness={0.6} radius={0.011} />
      </group>
    </>
  )
}

export function Fryer({ width }: { width: number }) {
  return (
    <Cabinet width={width}>
      <Knobs xs={[-0.14, 0.14]} />
      <CabinetDoor x={0} width={width - 0.08} />
      {WELL_X.map((x) => (
        <group key={x} position={[x, TOP, 0.0]}>
          {/* rim and the oil inside */}
          <Block size={[0.26, 0.01, 0.36]} position={[0, 0.005, 0]} color="#8a9096" metalness={0.7} roughness={0.35} radius={0.003} />
          <mesh position={[0, 0.011, 0]} rotation={[-PI / 2, 0, 0]}>
            <planeGeometry args={[0.23, 0.33]} />
            <meshStandardMaterial color="#c08a1e" roughness={0.08} metalness={0.2} />
          </mesh>
        </group>
      ))}
      {/* basket hanger along the back, up on two posts */}
      <Block size={[width - 0.04, 0.025, 0.025]} position={[0, HANGER.y, HANGER.z]} {...STAINLESS} radius={0.01} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.025, HANGER.y - TOP, 0.025]} position={[s * (width / 2 - 0.04), (HANGER.y + TOP) / 2, HANGER.z]} {...STAINLESS} radius={0.008} />
      ))}
    </Cabinet>
  )
}

/** Where a basket's rim sits down in the oil, with most of it under the surface. */
const DOWN_Y = TOP + 0.035

/** The two baskets: both down in the oil, one hung up to drain, or a duck in the oil. */
export function FryerBaskets({ mode }: { mode: 'normal' | 'basket' | 'duck' }) {
  const duck = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (duck.current) duck.current.position.y = TOP + 0.005 + Math.sin(clock.elapsedTime * 2.2) * 0.006
  })
  return (
    <>
      <group position={[WELL_X[0], DOWN_Y, 0]}>
        <Basket />
      </group>
      {mode === 'duck' ? (
        <group ref={duck} position={[WELL_X[1], TOP, 0]} rotation={[0, 0.6, 0]}>
          <Model id="rubber_duck_toy" scale={0.55} paint={false} />
        </group>
      ) : mode === 'basket' ? (
        // lifted out and hooked on the hanger by its back, tipped a little so the oil runs off
        <group position={[WELL_X[1], HANGER.y - 0.03, HANGER.z + BASKET.d / 2 + 0.03]} rotation={[0.12, 0, 0]}>
          <Basket chips />
        </group>
      ) : (
        <group position={[WELL_X[1], DOWN_Y, 0]}>
          <Basket />
        </group>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Salamander grill, on a riser from the back upstand
// ---------------------------------------------------------------------------

const SAL = { bottom: 1.45, height: 0.3, width: 0.72, depth: 0.42 }

const CHEESE = new MeshPhysicalMaterial({ color: '#ffae14', emissive: '#7a3a00', emissiveIntensity: 0.35, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2, side: DoubleSide })
const BROWNED = new MeshStandardMaterial({ color: '#b8641a', roughness: 0.45 })

/** Strings of cheese hanging out of the curtain: x, where they start below the lip, length, thickness. */
const STRINGS: [number, number, number, number][] = [
  [-0.19, -0.12, 0.14, 0.011],
  [-0.1, -0.16, 0.09, 0.009],
  [-0.02, -0.12, 0.18, 0.013],
  [0.07, -0.16, 0.11, 0.01],
  [0.16, -0.12, 0.16, 0.012],
]
/** How far below the lip a falling drop gets before it's gone (it's over the griddle down there). */
const DRIP_END = -0.43

/**
 * Far too much cheese, melted on toast on the rack and pouring out over the
 * front of the grill: a sagging curtain of it over the lip, thick strings
 * hanging off that, and drops stretching and falling. Its origin is the
 * front edge it pours over; `rack`: the top of the rack, relative to that.
 */
function MeltedCheese({ rack }: { rack: Vec3 }) {
  const strings = useMemo(() => STRINGS.map(([, , len, th]) => cheeseString(len, th)), [])
  useEffect(() => () => strings.forEach((g) => g.dispose()), [strings])
  const drips = useRef<Group>(null)
  const stretch = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // each drop swells at the end of its string, then lets go and falls
    drips.current?.children.forEach((d, i) => {
      const [, top, len] = STRINGS[i]
      const start = top - len - 0.02
      const k = (t * 0.45 + i * 0.37) % 1
      const fall = k < 0.65 ? 0 : (k - 0.65) / 0.35
      d.position.y = start + (DRIP_END - start) * fall * fall
      const grow = k < 0.65 ? 0.5 + k : 1.15 * (1 - fall * fall)
      d.scale.set(grow, grow * (1 + fall * 1.6), grow)
    })
    stretch.current?.children.forEach((s, i) => {
      s.scale.y = 1 + Math.sin(t * 0.9 + i * 1.3) * 0.06
    })
  })
  return (
    <>
      {/* on the rack: two slices of toast drowned in it, bubbled and browned */}
      <group position={rack}>
        {[-0.12, 0.12].map((x) => (
          <Block key={x} size={[0.2, 0.025, 0.18]} position={[x, 0.013, -0.12]} color="#c98a3e" roughness={0.85} radius={0.006} />
        ))}
        <mesh material={CHEESE} position={[0, 0.03, -0.1]} scale={[0.3, 0.022, 0.15]}>
          <sphereGeometry args={[1, 28, 12]} />
        </mesh>
        {[
          [-0.18, -0.08],
          [-0.05, -0.15],
          [0.08, -0.06],
          [0.2, -0.13],
          [0.0, -0.02],
        ].map(([x, z], i) => (
          <mesh key={i} material={BROWNED} position={[x, 0.047, z]} scale={[0.025, 0.006, 0.02]}>
            <sphereGeometry args={[1, 10, 6]} />
          </mesh>
        ))}
        {/* a sheet running down from the rack to the lip */}
        <mesh material={CHEESE} position={[0, -0.025, 0.012]} rotation={[0.9, 0, 0]} scale={[0.25, 0.04, 0.008]}>
          <sphereGeometry args={[1, 20, 8]} />
        </mesh>
      </group>
      <mesh geometry={cheeseCurtain()} material={CHEESE} scale={[1, 1.35, 1]} castShadow />
      <group ref={stretch}>
        {STRINGS.map(([x, top, len, th], i) => (
          <group key={x} position={[x, top, 0.028]}>
            <mesh geometry={strings[i]} material={CHEESE} />
            <mesh material={CHEESE} position={[0, -len, 0]} scale={[1, 1.4, 1]}>
              <sphereGeometry args={[th * 1.5, 12, 8]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* falling drops */}
      <group ref={drips}>
        {STRINGS.map(([x]) => (
          <mesh key={x} material={CHEESE} position={[x, -0.3, 0.028]}>
            <sphereGeometry args={[0.012, 10, 8]} />
          </mesh>
        ))}
      </group>
      {/* a long thin strand stretched between two of the strings, sagging */}
      <mesh material={CHEESE} position={[-0.06, -0.21, 0.03]} rotation={[0, 0, PI / 2 + 0.25]}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.09, 6]} />
      </mesh>
    </>
  )
}

export function Salamander({ mode }: { mode: 'normal' | 'glow' | 'drip' }) {
  const glow = mode === 'glow'
  const { bottom, height, width, depth } = SAL
  // its origin is level with the top of the back upstand, at the upstand's centre
  const z0 = (LINE.back - LINE.spine) / 2
  const cy = bottom - LINE.upstand + height / 2
  const front = z0 + depth
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.04, cy + height / 2, 0.06]} position={[s * (width / 2 - 0.05), (cy + height / 2) / 2, 0]} {...STAINLESS} radius={0.008} />
      ))}
      {/* casing: top, bottom, sides and back, open at the front */}
      <Block size={[width, 0.05, depth]} position={[0, cy + height / 2 - 0.025, z0 + depth / 2]} {...STAINLESS} radius={0.01} />
      <Block size={[width, 0.04, depth]} position={[0, cy - height / 2 + 0.02, z0 + depth / 2]} {...STAINLESS} radius={0.01} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.04, height, depth]} position={[s * (width / 2 - 0.02), cy, z0 + depth / 2]} {...STAINLESS} radius={0.01} />
      ))}
      <Block size={[width, height, 0.03]} position={[0, cy, z0 + 0.015]} {...STAINLESS} radius={0.008} />
      {/* dark inside, the heating elements across the top, a rack */}
      <mesh position={[0, cy, z0 + 0.035]}>
        <planeGeometry args={[width - 0.08, height - 0.09]} />
        <meshStandardMaterial color={glow ? '#5a1406' : '#151515'} emissive={glow ? '#ff3a0a' : '#000000'} emissiveIntensity={glow ? 0.6 : 0} />
      </mesh>
      {[0.1, 0.2, 0.3].map((d) => (
        <mesh key={d} position={[0, cy + height / 2 - 0.08, z0 + d]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.009, 0.009, width - 0.1, 10]} />
          <meshStandardMaterial
            color={glow ? '#ff5a1a' : '#4a2a20'}
            emissive={glow ? '#ff3a0a' : '#2a0800'}
            emissiveIntensity={glow ? 3 : 0.4}
            toneMapped={!glow}
          />
        </mesh>
      ))}
      <Block size={[width - 0.1, 0.012, depth - 0.08]} position={[0, cy - 0.06, z0 + depth / 2 + 0.02]} color="#8a9096" metalness={0.7} roughness={0.4} radius={0.003} />
      {/* knob panel on the right */}
      <mesh geometry={KNOB} material={KNOB_MAT} position={[width / 2 - 0.02, cy + 0.04, front - 0.08]} rotation={[0, 0, PI / 2]} />
      {glow && <pointLight position={[0, cy - 0.1, front + 0.1]} intensity={1.2} distance={2} decay={2} color="#ff5a1a" />}
      {mode === 'drip' && (
        // over the front lip of the casing's floor
        <group position={[0, cy - height / 2 + 0.04, front]}>
          <MeltedCheese rack={[0, 0.054, -0.02]} />
        </group>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Extraction hood (island canopy)
// ---------------------------------------------------------------------------

const HOOD = { bottom: 2.05, height: 0.5 }

/** The canopy's stainless shell, duct and hanging rods. Built centred, front at +z. */
export function HoodShell({ width, depth, ceiling }: { width: number; depth: number; ceiling: number }) {
  const { bottom, height } = HOOD
  const cy = bottom + height / 2
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={`z${s}`} size={[width, height, 0.03]} position={[0, cy, s * (depth / 2 - 0.015)]} {...STAINLESS} radius={0.008} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={`x${s}`} size={[0.03, height, depth]} position={[s * (width / 2 - 0.015), cy, 0]} {...STAINLESS} radius={0.008} />
      ))}
      <Block size={[width, 0.03, depth]} position={[0, bottom + height - 0.015, 0]} {...STAINLESS} radius={0.008} />
      {/* grease gutter round the bottom edge */}
      {[-1, 1].map((s) => (
        <Block key={`g${s}`} size={[width - 0.06, 0.04, 0.05]} position={[0, bottom + 0.02, s * (depth / 2 - 0.055)]} {...BRUSHED} radius={0.006} />
      ))}
      {/* duct up into the ceiling, and the rods it hangs from */}
      <Block size={[0.6, ceiling - bottom - height, 0.45]} position={[0, (ceiling + bottom + height) / 2, -0.1]} {...BRUSHED} radius={0.01} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (width / 2 - 0.2), (ceiling + bottom + height) / 2, sz * (depth / 2 - 0.15)]} material={STEEL_MAT}>
            <cylinderGeometry args={[0.012, 0.012, ceiling - bottom - height, 8]} />
          </mesh>
        )),
      )}
    </>
  )
}

const FILTER_W = 0.45

/** Baffle filters along the back slope inside the canopy; `missing` leaves a gap. */
export function HoodFilters({ width, depth, missing }: { width: number; depth: number; missing?: number }) {
  const n = Math.floor((width - 0.1) / FILTER_W)
  const start = -((n - 1) * FILTER_W) / 2
  const y = HOOD.bottom + HOOD.height * 0.55
  return (
    <>
      {/* dark plenum behind the filters */}
      <mesh position={[0, y + 0.02, -depth / 2 + 0.15]} rotation={[PI / 4, 0, 0]}>
        <planeGeometry args={[width - 0.08, 0.36]} />
        <meshStandardMaterial color="#0c0c0d" roughness={0.9} side={DoubleSide} />
      </mesh>
      {/* the bank leans in at the top, its face down towards the cooks */}
      {Array.from({ length: n }, (_, i) =>
        i === missing ? null : (
          <group key={i} position={[start + i * FILTER_W, y, -depth / 2 + 0.17]} rotation={[PI / 4, 0, 0]}>
            <Block size={[FILTER_W - 0.02, 0.34, 0.02]} position={[0, 0, 0]} color="#9aa1a8" metalness={0.75} roughness={0.35} radius={0.004} />
            {[-0.12, -0.04, 0.04, 0.12].map((x) => (
              <Block key={x} size={[0.035, 0.3, 0.02]} position={[x, 0, 0.015]} color="#7f868d" metalness={0.75} roughness={0.4} radius={0.004} />
            ))}
          </group>
        ),
      )}
    </>
  )
}

/** Light fittings along the front inside of the hood; `on` false for the dark swap. */
export function HoodLights({ width, depth, on }: { width: number; depth: number; on: boolean }) {
  const y = HOOD.bottom + 0.35
  return (
    <>
      {[-1, 1].map((s) => (
        <Block
          key={s}
          size={[width * 0.35, 0.04, 0.08]}
          position={[s * width * 0.24, y, depth / 2 - 0.12]}
          color={on ? '#fffaf0' : '#7d8084'}
          emissive={on ? '#fff6e0' : '#000000'}
          emissiveIntensity={on ? 2 : 0}
          radius={0.01}
        />
      ))}
      {on && <PanelLight position={[0, y - 0.04, depth / 2 - 0.3]} size={[width * 0.8, 0.3]} facing={[0, 0, depth / 2 - 0.3]} color="#fff3dc" intensity={4} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Static bits of the line: the back upstand and the cold counter
// ---------------------------------------------------------------------------

/** The back of the island: an upstand panel the whole length, chef side clean. */
export function LineSpine({ length }: { length: number }) {
  return (
    <>
      <Block size={[length, LINE.upstand, LINE.back - LINE.spine]} position={[0, LINE.upstand / 2, 0]} {...BRUSHED} radius={0.008} />
      {/* a towel rail along the back */}
      <Block size={[length - 0.4, 0.02, 0.02]} position={[0, 0.75, -0.07]} {...STAINLESS} radius={0.008} />
      {[-0.9, 0.6].map((x, i) => (
        <Block key={x} size={[0.4, 0.42, 0.012]} position={[x, 0.56, -0.085]} color={i ? '#f2efe6' : '#2d4f8a'} roughness={0.95} radius={0.004} />
      ))}
    </>
  )
}

const GN_COLOURS = ['#4f9a3a', '#c8352a', '#efe6c8', '#e8b72a', '#7a3b6e', '#d96a2a']

/** Refrigerated counter at the end of the line, with a cold rail of garnishes. */
export function ColdCounter({ width }: { width: number }) {
  return (
    <Cabinet width={width}>
      <CabinetDoor x={-width / 4} width={width / 2 - 0.04} />
      <CabinetDoor x={width / 4} width={width / 2 - 0.04} />
      {GN_COLOURS.map((c, i) => (
        <group key={c} position={[-0.27 + (i % 3) * 0.27, TOP + 0.005, -0.25 + Math.floor(i / 3) * 0.2]}>
          <Block size={[0.25, 0.012, 0.18]} position={[0, 0, 0]} color="#d3d8dc" metalness={0.7} roughness={0.3} radius={0.003} />
          <mesh position={[0, 0.012, 0]} scale={[0.11, 0.012, 0.08]}>
            <sphereGeometry args={[1, 12, 6]} />
            <meshStandardMaterial color={c} roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* the white chopping board in front of the rail */}
      <Block size={[0.5, 0.02, 0.3]} position={[0, TOP + 0.01, 0.22]} color="#f4f4ef" roughness={0.6} radius={0.006} />
    </Cabinet>
  )
}
