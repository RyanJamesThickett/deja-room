import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import {
  Color,
  CylinderGeometry,
  DoubleSide,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
  type PointLight,
} from 'three'
import { Block, PI } from '../../kit'
import type { Vec3 } from '../../mutations'
import { LOCKER_SLATS, useDeckSignTexture, useGaugeTexture, useMonitorTexture, usePegboardTexture, useSlatEyesTexture } from './textures'

/*
 * The engine room and the corridor: the reactor in its cage, the coolant
 * tank, pipes, gauges, lockers and the rest of an engineer's clutter.
 */

const STEEL = new MeshStandardMaterial({ color: '#9aa3ad', metalness: 0.85, roughness: 0.3 })
const DARK = new MeshStandardMaterial({ color: '#3a3f46', metalness: 0.8, roughness: 0.4 })
const PIPE = new MeshStandardMaterial({ color: '#7f8a84', metalness: 0.75, roughness: 0.4 })
const BAR = new CylinderGeometry(0.018, 0.018, 1, 10)
const UNIT_PIPE = new CylinderGeometry(1, 1, 1, 20)

/** A straight pipe between two points that differ along one axis only. */
export function Pipe({ from, to, radius = 0.05 }: { from: Vec3; to: Vec3; radius?: number }) {
  const d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]
  const length = Math.hypot(d[0], d[1], d[2])
  const mid: Vec3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]
  // cylinders run along y; turn them onto x or z
  const rot: Vec3 = Math.abs(d[0]) > 0.001 ? [0, 0, PI / 2] : Math.abs(d[2]) > 0.001 ? [PI / 2, 0, 0] : [0, 0, 0]
  return (
    <mesh geometry={UNIT_PIPE} material={PIPE} position={mid} rotation={rot} scale={[radius, length, radius]} castShadow receiveShadow />
  )
}

// ---------------------------------------------------------------------------
// Reactor: a glowing core in a glass column, inside a cage
// ---------------------------------------------------------------------------

const CAGE_R = 0.7
/** The cage door fills this gap in the bars, facing the way in (-x). */
const DOOR_GAP = 0.9
const CAGE_BOTTOM = 0.18
const CAGE_TOP = 2.25
const HOOPS = [0.7, 1.45, 2.2]

/** Plinth, housings and the cage bars: everything but the core and the door. */
export function ReactorFrame() {
  const bars = useMemo(() => {
    const n = 12
    const step = (PI * 2 - DOOR_GAP) / (n - 1)
    return Array.from({ length: n }, (_, k) => PI + DOOR_GAP / 2 + k * step)
  }, [])
  const h = CAGE_TOP - CAGE_BOTTOM
  return (
    <>
      <mesh position={[0, 0.09, 0]} material={DARK} castShadow receiveShadow>
        <cylinderGeometry args={[0.78, 0.8, 0.18, 48]} />
      </mesh>
      <mesh position={[0, 0.38, 0]} material={STEEL} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.5, 0.4, 40]} />
      </mesh>
      <mesh position={[0, 2.075, 0]} material={STEEL} castShadow>
        <cylinderGeometry args={[0.5, 0.46, 0.35, 40]} />
      </mesh>
      {/* conduit up through the deckhead */}
      <mesh position={[0, 2.425, 0]} material={DARK} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.35, 24]} />
      </mesh>
      {bars.map((a) => (
        <mesh key={a} geometry={BAR} material={DARK} position={[Math.cos(a) * CAGE_R, CAGE_BOTTOM + h / 2, Math.sin(a) * CAGE_R]} scale={[1, h, 1]} castShadow />
      ))}
      {HOOPS.map((y) => (
        // a torus arc starts on +x and runs anticlockwise; turned so the gap faces -x
        <group key={y} position={[0, y, 0]} rotation={[0, DOOR_GAP / 2 - PI, 0]}>
          <mesh rotation={[-PI / 2, 0, 0]} material={DARK}>
            <torusGeometry args={[CAGE_R, 0.02, 8, 64, PI * 2 - DOOR_GAP]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** The cage door: a flat grille across the gap, hinged on its -z edge. */
export function CageDoor({ open }: { open: boolean }) {
  const hx = -Math.cos(DOOR_GAP / 2) * CAGE_R
  const hz = -Math.sin(DOOR_GAP / 2) * CAGE_R
  const width = -2 * hz
  const h = CAGE_TOP - CAGE_BOTTOM - 0.1
  return (
    <group position={[hx, 0, hz]} rotation={[0, open ? -0.22 : 0, 0]}>
      {[width * 0.25, width * 0.5, width * 0.75, width].map((z) => (
        <mesh key={z} geometry={BAR} material={DARK} position={[0, CAGE_BOTTOM + 0.05 + h / 2, z]} scale={[1, h, 1]} castShadow />
      ))}
      {HOOPS.map((y) => (
        <Block key={y} size={[0.03, 0.03, width]} position={[0, y, width / 2]} color="#3a3f46" metalness={0.8} roughness={0.4} />
      ))}
      <Block size={[0.012, 0.18, 0.3]} position={[-0.03, 1.2, width / 2]} color="#ffcc1a" roughness={0.6} />
      <Block size={[0.012, 0.05, 0.22]} position={[-0.037, 1.2, width / 2]} color="#16181c" roughness={0.6} />
      {/* handle on the free edge */}
      <Block size={[0.06, 0.14, 0.03]} position={[-0.04, 1.1, width - 0.05]} color="#c9ced6" metalness={0.85} roughness={0.3} />
    </group>
  )
}

const CORE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float bands = 0.5 + 0.5 * sin(vUv.y * 28.0 - uTime * 4.0);
    float pulse = 0.8 + 0.2 * sin(uTime * 2.2);
    vec3 col = uColor * (0.7 + 1.3 * bands * bands) * pulse + vec3(0.6) * pow(bands, 14.0);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
const UV_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

function GlassColumn() {
  return (
    <mesh position={[0, 1.24, 0]} renderOrder={2}>
      <cylinderGeometry args={[0.3, 0.3, 1.32, 40, 1, true]} />
      <meshPhysicalMaterial color="#e8fbff" transparent opacity={0.16} roughness={0.04} clearcoat={1} side={DoubleSide} depthWrite={false} />
    </mesh>
  )
}

/** The usual core: bands of light climbing a glowing rod, and a light that breathes with it. */
export function ReactorCore() {
  const core = useRef<Mesh>(null)
  const glow = useRef<PointLight>(null)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: UV_VERT,
        fragmentShader: CORE_FRAG,
        uniforms: { uTime: { value: 0 }, uColor: { value: new Color('#3dfcff') } },
        toneMapped: false,
      }),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // a recolour swaps in a copy of the material, so always update the current one
    const m = core.current?.material as ShaderMaterial | undefined
    if (m?.uniforms?.uTime) m.uniforms.uTime.value = t
    if (glow.current) glow.current.intensity = 2.6 + Math.sin(t * 2.2) * 0.6
  })
  return (
    <>
      <GlassColumn />
      <mesh ref={core} position={[0, 1.24, 0]} material={material} userData={{ paint: true }}>
        <cylinderGeometry args={[0.17, 0.17, 1.32, 32]} />
      </mesh>
      <pointLight ref={glow} position={[0, 1.3, 0]} distance={4.5} decay={2} color="#3dfcff" />
    </>
  )
}

/** The weird one: a heart beating where the core should be. */
export function ReactorHeart() {
  const heart = useRef<Group>(null)
  const glow = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 1.2
    // lub-dub
    const f = t % 1
    const beat = Math.exp(-((f - 0.1) ** 2) / 0.003) * 0.12 + Math.exp(-((f - 0.3) ** 2) / 0.003) * 0.07
    heart.current?.scale.setScalar(1 + beat)
    if (glow.current) glow.current.intensity = 1.6 + beat * 14
  })
  const flesh = <meshStandardMaterial color="#a3122a" emissive="#4a0010" roughness={0.35} />
  return (
    <>
      <GlassColumn />
      <mesh position={[0, 1.24, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 1.3, 32]} />
        <meshStandardMaterial color="#ff8a8a" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <group ref={heart} position={[0, 1.22, 0]} rotation={[0, 0, 0.25]}>
        <mesh scale={[1, 1.15, 0.85]} userData={{ paint: true }}>
          <sphereGeometry args={[0.14, 32, 20]} />
          {flesh}
        </mesh>
        <mesh position={[0.02, -0.16, 0]} rotation={[0, 0, PI + 0.15]} userData={{ paint: true }}>
          <coneGeometry args={[0.1, 0.16, 24]} />
          {flesh}
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.07, 0.12, -0.02]} userData={{ paint: true }}>
            <sphereGeometry args={[0.075, 20, 14]} />
            {flesh}
          </mesh>
        ))}
        {/* aorta and a vein, running up out of the top */}
        <mesh position={[0.0, 0.25, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.035, 0.04, 0.16, 16]} />
          <meshStandardMaterial color="#c23b4e" roughness={0.4} />
        </mesh>
        <mesh position={[-0.08, 0.22, 0.03]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.022, 0.025, 0.14, 12]} />
          <meshStandardMaterial color="#3d4fa8" roughness={0.4} />
        </mesh>
      </group>
      <pointLight ref={glow} position={[0, 1.3, 0]} distance={4.5} decay={2} color="#ff4a5a" />
    </>
  )
}

// ---------------------------------------------------------------------------
// Coolant tank (sight window faces +z)
// ---------------------------------------------------------------------------

const WINDOW = { bottom: 0.38, height: 1.14 }

export function CoolantShell() {
  const white = { color: '#e4e8ec', metalness: 0.4, roughness: 0.45 }
  return (
    <>
      <mesh position={[0, 0.1, 0]} material={DARK} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.43, 0.2, 40]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 1.5, 48]} />
        <meshStandardMaterial {...white} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.45, 48, 16, 0, PI * 2, 0, PI / 2]} />
        <meshStandardMaterial {...white} />
      </mesh>
      {[0.3, 1.62].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[PI / 2, 0, 0]} material={DARK}>
          <torusGeometry args={[0.452, 0.014, 8, 64]} />
        </mesh>
      ))}
      {/* a cyan band so you know what's in it */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.453, 0.453, 0.1, 48, 1, true]} />
        <meshStandardMaterial color="#16b8d8" roughness={0.5} />
      </mesh>
      {/* sight-glass frame */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, WINDOW.height + 0.06, 0.04]} position={[s * 0.085, WINDOW.bottom + WINDOW.height / 2, 0.45]} color="#2b2f36" metalness={0.8} roughness={0.35} />
      ))}
      {[WINDOW.bottom - 0.015, WINDOW.bottom + WINDOW.height + 0.015].map((y) => (
        <Block key={y} size={[0.2, 0.03, 0.04]} position={[0, y, 0.45]} color="#2b2f36" metalness={0.8} roughness={0.35} />
      ))}
      <mesh position={[0, WINDOW.bottom + WINDOW.height / 2, 0.455]}>
        <planeGeometry args={[0.14, WINDOW.height]} />
        <meshStandardMaterial color="#0b1418" roughness={0.3} />
      </mesh>
    </>
  )
}

/** What shows in the sight glass: coolant up to `level` (0 to 1), and possibly a fish. */
export function CoolantLevel({ level, fish = false }: { level: number; fish?: boolean }) {
  const h = WINDOW.height * level
  return (
    <>
      <mesh position={[0, WINDOW.bottom + h / 2, 0.458]} userData={{ paint: true }}>
        <planeGeometry args={[0.14, h]} />
        <meshBasicMaterial color="#38e0ff" />
      </mesh>
      {/* the meniscus */}
      <mesh position={[0, WINDOW.bottom + h, 0.459]}>
        <planeGeometry args={[0.14, 0.012]} />
        <meshBasicMaterial color="#d8fbff" />
      </mesh>
      {fish && <Goldfish top={WINDOW.bottom + h - 0.08} bottom={WINDOW.bottom + 0.1} />}
    </>
  )
}

/** A goldfish side on, head to +x, rising and sinking with its nose the way it's going. */
function Goldfish({ top, bottom }: { top: number; bottom: number }) {
  const ref = useRef<Group>(null)
  const tail = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ref.current) {
      ref.current.position.y = bottom + ((Math.sin(t * 0.5) + 1) / 2) * (top - bottom)
      ref.current.rotation.z = Math.cos(t * 0.5) * 0.35
    }
    // a small sweep: any more and the tail swings back behind the coolant
    if (tail.current) tail.current.rotation.y = Math.sin(t * 9) * 0.25
  })
  return (
    <group ref={ref} position={[0.012, top, 0.468]}>
      <mesh scale={[1, 0.62, 0.3]}>
        <sphereGeometry args={[0.04, 20, 14]} />
        <meshStandardMaterial color="#ff8a1f" emissive="#ff6a00" emissiveIntensity={0.3} roughness={0.35} />
      </mesh>
      {/* tail fin: narrow where it joins the body, fanning out behind */}
      <group ref={tail} position={[-0.034, 0, 0]}>
        <mesh position={[-0.02, 0, 0]} rotation={[0, 0, -PI / 2]} scale={[1, 1, 0.25]}>
          <coneGeometry args={[0.028, 0.04, 16]} />
          <meshStandardMaterial color="#ff6a00" roughness={0.4} />
        </mesh>
      </group>
      <mesh position={[0.025, 0.008, 0.009]}>
        <sphereGeometry args={[0.005, 8, 6]} />
        <meshBasicMaterial color="#050505" />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Engine control desk (faces +z)
// ---------------------------------------------------------------------------

export function DeskBody({ children }: { children?: ReactNode }) {
  return (
    <>
      <Block size={[1.5, 0.9, 0.55]} position={[0, 0.45, 0]} color="#5a6470" metalness={0.7} roughness={0.4} radius={0.03} paint />
      <group position={[0, 0.95, 0.08]} rotation={[0.45, 0, 0]}>
        <Block size={[1.42, 0.05, 0.42]} color="#2b3038" metalness={0.7} roughness={0.35} radius={0.015} />
      </group>
      {/* riser for the monitor and switches */}
      <Block size={[1.5, 0.6, 0.12]} position={[0, 1.2, -0.215]} color="#5a6470" metalness={0.7} roughness={0.4} radius={0.02} paint />
      <Block size={[0.62, 0.43, 0.03]} position={[-0.3, 1.22, -0.14]} color="#16181c" metalness={0.5} roughness={0.4} radius={0.01} />
      {[0.15, 0.3, 0.45, 0.6].map((x, i) => (
        <group key={x} position={[x, 1.25, -0.15]}>
          <Block size={[0.07, 0.1, 0.012]} color="#2b2f36" metalness={0.8} roughness={0.35} />
          <mesh position={[0, i % 2 ? 0.02 : -0.02, 0.025]} rotation={[i % 2 ? -0.5 : 0.5, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.05, 8]} />
            <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.07, 0.008]}>
            <circleGeometry args={[0.012, 12]} />
            <meshBasicMaterial color={i === 2 ? '#ff3131' : '#5dff9a'} />
          </mesh>
        </group>
      ))}
      {/* lever housing on the right-hand end */}
      <Block size={[0.06, 0.2, 0.14]} position={[0.78, 0.75, 0.05]} color="#2b2f36" metalness={0.8} roughness={0.35} />
      {children}
    </>
  )
}

export function DeskScreen({ kind }: { kind: 'trace' | 'smile' }) {
  const map = useMonitorTexture(kind)
  return (
    <mesh position={[-0.3, 1.22, -0.123]}>
      <planeGeometry args={[0.56, 0.37]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  )
}

/** The big lever: up and ready, or pulled right down. */
export function DeskLever({ pulled }: { pulled: boolean }) {
  return (
    <group position={[0.83, 0.75, 0.05]} rotation={[pulled ? 1.5 : -0.3, 0, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.4, 12]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.045, 20, 14]} />
        <meshStandardMaterial color="#ff2020" roughness={0.3} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Crew lockers (face +z): three in a row, the middle one hollow so it can open
// ---------------------------------------------------------------------------

const LOCKER = { w: 0.44, h: 1.9, d: 0.45 }
const LOCKER_BLUE = '#4c6a8a'

/** The vent slats on a locker door: dark gaps, each under a pressed louvre lip. */
function LockerVents({ x, z = LOCKER.d / 2 + 0.02 }: { x: number; z?: number }) {
  const { y, h, step, n, w } = LOCKER_SLATS
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[x, y + i * step, z]}>
          <mesh position={[0, h / 2, 0.002]}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial color="#0b0d10" />
          </mesh>
          <mesh position={[0, h + 0.003, 0.006]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[w, 0.006, 0.012]} />
            <meshStandardMaterial color={LOCKER_BLUE} metalness={0.6} roughness={0.45} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function LockerDoorPanel() {
  return (
    <>
      <Block size={[0.42, 1.8, 0.02]} position={[0.21, 0.97, 0]} color={LOCKER_BLUE} metalness={0.6} roughness={0.45} paint />
      <LockerVents x={0.21} z={0.0085} />
      <Block size={[0.025, 0.14, 0.03]} position={[0.37, 1.05, 0.02]} color="#c9ced6" metalness={0.9} roughness={0.25} />
      <mesh position={[0.21, 1.4, 0.0105]}>
        <planeGeometry args={[0.1, 0.05]} />
        <meshStandardMaterial color="#f2f4f7" roughness={0.6} />
      </mesh>
    </>
  )
}

export function LockerBank() {
  const metal = { color: LOCKER_BLUE, metalness: 0.6, roughness: 0.45 }
  const { w, h, d } = LOCKER
  return (
    <>
      {/* the outer two are closed boxes with a door face */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w + 0.01), 0, 0]}>
          <Block size={[w, h, d]} position={[0, h / 2, 0]} {...metal} />
          <Block size={[0.42, 1.8, 0.02]} position={[0, 0.97, d / 2 + 0.01]} {...metal} />
          <Block size={[0.025, 0.14, 0.03]} position={[0.16, 1.05, d / 2 + 0.03]} color="#c9ced6" metalness={0.9} roughness={0.25} />
          <LockerVents x={0} />
        </group>
      ))}
      {/* the middle one: back, sides, top and plinth, with a jumpsuit hanging inside */}
      <Block size={[w, h, 0.02]} position={[0, h / 2, -d / 2 + 0.01]} {...metal} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.02, h, d]} position={[s * (w / 2 - 0.01), h / 2, 0]} {...metal} />
      ))}
      <Block size={[w, 0.02, d]} position={[0, h - 0.01, 0]} {...metal} />
      <Block size={[w, 0.06, d]} position={[0, 0.03, 0]} {...metal} />
      <mesh position={[0, 1.78, 0]} material={STEEL} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, w - 0.04, 8]} />
      </mesh>
      {/* the coat hanger the jumpsuit hangs from */}
      <mesh position={[0, 1.735, 0]} material={STEEL}>
        <cylinderGeometry args={[0.006, 0.006, 0.08, 8]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`hg${s}`} position={[s * 0.08, 1.69, 0]} rotation={[0, 0, s * 1.2]} material={STEEL}>
          <cylinderGeometry args={[0.006, 0.006, 0.18, 8]} />
        </mesh>
      ))}
      <Block size={[0.3, 0.55, 0.08]} position={[0, 1.4, 0]} color="#ff7a1a" roughness={0.8} radius={0.03} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.12, 0.62, 0.07]} position={[s * 0.075, 0.82, 0]} color="#ff7a1a" roughness={0.8} radius={0.03} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={`a${s}`} size={[0.06, 0.48, 0.06]} position={[s * 0.17, 1.38, 0]} rotation={[0, 0, s * 0.1]} color="#ff7a1a" roughness={0.8} radius={0.02} />
      ))}
    </>
  )
}

/** The middle locker's door, hinged on its left edge. */
export function LockerDoor({ open }: { open: boolean }) {
  return (
    <group position={[-0.21, 0, LOCKER.d / 2 + 0.01]} rotation={[0, open ? -0.22 : 0, 0]}>
      <LockerDoorPanel />
    </group>
  )
}

/**
 * Two eyes inside the right-hand locker, showing only in the dark gaps
 * between its vent slats: something is standing in there, looking out.
 */
export function LockerEyes() {
  const map = useSlatEyesTexture()
  const ref = useRef<Mesh>(null)
  const { y, h, step, n, w } = LOCKER_SLATS
  const span = step * (n - 1) + h
  useFrame(({ clock }) => {
    const t = clock.elapsedTime % 4
    // blink now and then
    if (ref.current) ref.current.visible = !(t > 3.75 && t < 3.9)
  })
  return (
    <mesh ref={ref} position={[LOCKER.w + 0.01, y + span / 2, LOCKER.d / 2 + 0.023]}>
      <planeGeometry args={[w, span]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Pressure gauges on a panel (face +z)
// ---------------------------------------------------------------------------

/** Needle angle for a reading from 0 (bottom left) to 1 (bottom right, in the red). */
const needleAngle = (t: number) => -(PI * 0.75 + PI * 1.5 * t) - PI / 2

function Gauge({ x, reading, twitch = 0.01 }: { x: number; reading: number; twitch?: number }) {
  const face = useGaugeTexture()
  const needle = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (needle.current) needle.current.rotation.z = needleAngle(reading + Math.sin(t * 7 + x * 40) * twitch + Math.sin(t * 23) * twitch * 0.5)
  })
  return (
    <group position={[x, 0.02, 0]}>
      <GaugeBezel />
      <mesh position={[0, 0, 0.081]}>
        <circleGeometry args={[0.086, 40]} />
        <meshStandardMaterial map={face} roughness={0.5} />
      </mesh>
      <group ref={needle} position={[0, 0, 0.084]}>
        <mesh position={[0, 0.032, 0]}>
          <boxGeometry args={[0.007, 0.07, 0.003]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.086]}>
        <circleGeometry args={[0.009, 16]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
    </group>
  )
}

function GaugeBezel() {
  return (
    <>
      <mesh position={[0, 0, 0.055]} rotation={[PI / 2, 0, 0]} material={STEEL} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 40]} />
      </mesh>
      {/* a rolled lip round the face */}
      <mesh position={[0, 0, 0.081]} material={STEEL}>
        <torusGeometry args={[0.092, 0.01, 10, 40]} />
      </mesh>
    </>
  )
}

function EyeGauge({ x }: { x: number }) {
  const eye = useRef<Group>(null)
  const look = useRef(new Vector3())
  useFrame(({ camera }) => eye.current?.lookAt(look.current.copy(camera.position)))
  return (
    <group position={[x, 0.02, 0]}>
      <GaugeBezel />
      <group ref={eye} position={[0, 0, 0.075]}>
        <mesh>
          <sphereGeometry args={[0.078, 32, 20]} />
          <meshStandardMaterial color="#f6f1e7" roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.075]}>
          <circleGeometry args={[0.032, 24]} />
          <meshStandardMaterial color="#3d8f4a" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.0775]}>
          <circleGeometry args={[0.016, 20]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      </group>
    </group>
  )
}

export function GaugePanel({ kind }: { kind: 'normal' | 'redline' | 'eye' }) {
  return (
    <>
      <Gauge x={-0.24} reading={0.35} />
      {kind === 'eye' ? <EyeGauge x={0} /> : <Gauge x={0} reading={0.5} />}
      <Gauge x={0.24} reading={kind === 'redline' ? 0.93 : 0.42} twitch={kind === 'redline' ? 0.025 : 0.01} />
    </>
  )
}

export function GaugeBacking() {
  return (
    <>
      <Block size={[0.75, 0.32, 0.03]} position={[0, 0.02, 0.015]} color="#59626c" metalness={0.7} roughness={0.4} radius={0.01} paint />
      <Pipe from={[-0.36, -0.2, 0.06]} to={[0.36, -0.2, 0.06]} radius={0.022} />
      {[-0.24, 0, 0.24].map((x) => (
        <Pipe key={x} from={[x, -0.2, 0.06]} to={[x, -0.08, 0.06]} radius={0.012} />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Valve on a pipe (faces +z; the pipe runs along x, 0.12 out from the wall)
// ---------------------------------------------------------------------------

export function ValveBody() {
  return (
    <>
      <mesh position={[0, 0, 0.12]} rotation={[0, 0, PI / 2]} material={DARK} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.2, 24]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0, 0.12]} rotation={[0, 0, PI / 2]} material={DARK}>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 24]} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.26]} rotation={[PI / 2, 0, 0]} material={STEEL}>
        <cylinderGeometry args={[0.016, 0.016, 0.12, 12]} />
      </mesh>
    </>
  )
}

export function ValveWheel() {
  const red = <meshStandardMaterial color="#d42a1f" metalness={0.3} roughness={0.4} />
  return (
    <>
      <mesh castShadow userData={{ paint: true }}>
        <torusGeometry args={[0.15, 0.018, 12, 48]} />
        {red}
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * PI * 2) / 5]} position={[0, 0, 0]} userData={{ paint: true }}>
          <boxGeometry args={[0.018, 0.3, 0.014]} />
          {red}
        </mesh>
      ))}
      <mesh rotation={[PI / 2, 0, 0]} material={DARK}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// A flanged joint on a riser pipe (faces +z), which might be leaking
// ---------------------------------------------------------------------------

export function PipeJoint() {
  return (
    <group position={[0, 0, 0.12]}>
      {[-0.02, 0.02].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={DARK} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 24]} />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.085, 0, Math.sin(a) * 0.085]} material={STEEL}>
            <cylinderGeometry args={[0.009, 0.009, 0.08, 8]} />
          </mesh>
        )
      })}
    </group>
  )
}

const PUFF = new SphereGeometry(0.05, 12, 8)
const PUFFS = 14

/** Steam hissing out of the joint and drifting up into the room. */
export function SteamLeak() {
  const ref = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const t = clock.elapsedTime
    for (let i = 0; i < PUFFS; i++) {
      const f = (t * 0.9 + i / PUFFS) % 1
      dummy.position.set(Math.sin(i * 7.3 + t) * 0.04 * f, 0.03 + f * f * 0.35, 0.22 + f * 0.6)
      dummy.scale.setScalar(0.4 + f * 2.2)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[PUFF, undefined, PUFFS]} frustumCulled={false}>
      <meshStandardMaterial color="#f4f7fa" transparent opacity={0.22} depthWrite={false} roughness={1} />
    </instancedMesh>
  )
}

/** A giant sticking plaster wrapped round the joint, as if the pipe had hurt itself. */
export function PipePlaster() {
  return (
    <group position={[0, 0, 0.12]}>
      <mesh>
        <cylinderGeometry args={[0.108, 0.108, 0.11, 32]} />
        <meshStandardMaterial color="#e9c39b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.109]}>
        <planeGeometry args={[0.07, 0.07]} />
        <meshStandardMaterial color="#f6efe6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[0.05, 0.014]} />
        <meshBasicMaterial color="#e0261b" />
      </mesh>
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[0.014, 0.05]} />
        <meshBasicMaterial color="#e0261b" />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Tool board (faces +z): painted outlines show where each tool goes
// ---------------------------------------------------------------------------

const OUTLINE = <meshBasicMaterial color="#e8e8e0" />

export function ToolBoard() {
  const board = usePegboardTexture(12, 7.5)
  const steel = { color: '#c9ced6', metalness: 0.9, roughness: 0.3 }
  return (
    <>
      <mesh position={[0, 0, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.75, 0.02]} />
        <meshStandardMaterial map={board} roughness={0.8} />
      </mesh>
      {/* outlines: spanner, hammer, screwdriver, coil */}
      <mesh position={[-0.38, 0.0, 0.021]}>
        <planeGeometry args={[0.07, 0.5]} />
        {OUTLINE}
      </mesh>
      <mesh position={[-0.12, -0.02, 0.021]}>
        <planeGeometry args={[0.05, 0.42]} />
        {OUTLINE}
      </mesh>
      <mesh position={[-0.12, 0.17, 0.021]}>
        <planeGeometry args={[0.2, 0.08]} />
        {OUTLINE}
      </mesh>
      <mesh position={[0.12, 0.0, 0.021]}>
        <planeGeometry args={[0.05, 0.4]} />
        {OUTLINE}
      </mesh>
      {/* hammer */}
      <mesh position={[-0.12, -0.03, 0.035]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.016, 0.36, 12]} />
        <meshStandardMaterial color="#8a5a2b" roughness={0.6} />
      </mesh>
      <Block size={[0.17, 0.05, 0.04]} position={[-0.12, 0.17, 0.04]} {...steel} />
      {/* screwdriver */}
      <mesh position={[0.12, 0.1, 0.035]}>
        <cylinderGeometry args={[0.018, 0.018, 0.13, 12]} />
        <meshStandardMaterial color="#ffcc1a" roughness={0.5} />
      </mesh>
      <mesh position={[0.12, -0.08, 0.035]}>
        <cylinderGeometry args={[0.005, 0.005, 0.23, 8]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* a coil of cable on a hook */}
      <mesh position={[0.38, 0.0, 0.04]}>
        <torusGeometry args={[0.11, 0.025, 10, 32]} />
        <meshStandardMaterial color="#d42a1f" roughness={0.6} />
      </mesh>
      {[-0.38, -0.12, 0.12, 0.38].map((x) => (
        <mesh key={x} position={[x, 0.27, 0.03]} rotation={[PI / 2, 0, 0]} material={STEEL}>
          <cylinderGeometry args={[0.006, 0.006, 0.04, 6]} />
        </mesh>
      ))}
    </>
  )
}

/** The spanner that hangs on the left of the board. */
export function Spanner() {
  const steel = <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.3} />
  return (
    <group position={[-0.38, 0, 0.032]}>
      <mesh>
        <boxGeometry args={[0.035, 0.36, 0.012]} />
        {steel}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, s * 0.2, 0]} rotation={[0, 0, s > 0 ? 0 : PI]}>
          <torusGeometry args={[0.04, 0.012, 8, 24, PI * 1.5]} />
          {steel}
        </mesh>
      ))}
    </group>
  )
}

/** Hanging where the spanner should be. */
export function Spoon() {
  return (
    <group position={[-0.38, 0, 0.034]}>
      <mesh position={[0, -0.07, 0]}>
        <boxGeometry args={[0.03, 0.34, 0.01]} />
        <meshStandardMaterial color="#d8dde3" metalness={1} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.16, 0]} scale={[1, 1.4, 0.35]}>
        <sphereGeometry args={[0.06, 24, 16]} />
        <meshStandardMaterial color="#d8dde3" metalness={1} roughness={0.15} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Corridor bits
// ---------------------------------------------------------------------------

/** A pair of magnetic boots, toes towards +z. */
export function Boots() {
  const white = { color: '#e8e2d0', roughness: 0.6 }
  return (
    <>
      {[-0.085, 0.085].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Block size={[0.11, 0.04, 0.3]} position={[0, 0.02, 0.01]} color="#2b2f36" metalness={0.7} roughness={0.4} radius={0.012} />
          <Block size={[0.1, 0.1, 0.26]} position={[0, 0.09, 0.0]} {...white} radius={0.035} />
          <Block size={[0.1, 0.2, 0.12]} position={[0, 0.23, -0.07]} {...white} radius={0.03} />
          {/* padded cuff round the top, and a strap over the instep */}
          <Block size={[0.112, 0.035, 0.132]} position={[0, 0.325, -0.07]} color="#ff8a1f" roughness={0.5} radius={0.012} />
          <Block size={[0.108, 0.03, 0.045]} position={[0, 0.138, 0.04]} color="#ff8a1f" roughness={0.5} radius={0.01} />
          <mesh position={[0, 0.02, 0.161]}>
            <planeGeometry args={[0.08, 0.012]} />
            <meshBasicMaterial color="#3dfcff" />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** The deck sign; `lost` sends you back to the bridge whichever way you go. */
export function DeckSign({ lost }: { lost: boolean }) {
  const map = useDeckSignTexture(lost)
  return (
    <mesh position={[0, 0, 0.021]}>
      <planeGeometry args={[0.6, 0.3]} />
      <meshStandardMaterial map={map} roughness={0.5} />
    </mesh>
  )
}

const BLADE = new MeshStandardMaterial({ color: '#8d969f', metalness: 0.7, roughness: 0.4 })

/** A wall vent with a fan behind the grille (faces +z). */
export function VentFrame() {
  return (
    <>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.36, 0.36]} />
        <meshBasicMaterial color="#07090b" />
      </mesh>
      {[-1, 1].map((s) => (
        <Block key={`h${s}`} size={[0.46, 0.05, 0.04]} position={[0, s * 0.205, 0.02]} color="#59626c" metalness={0.7} roughness={0.4} paint />
      ))}
      {[-1, 1].map((s) => (
        <Block key={`v${s}`} size={[0.05, 0.36, 0.04]} position={[s * 0.205, 0, 0.02]} color="#59626c" metalness={0.7} roughness={0.4} paint />
      ))}
      {[-0.135, -0.09, -0.045, 0, 0.045, 0.09, 0.135].map((y) => (
        <mesh key={y} position={[0, y, 0.034]} rotation={[0, 0, PI / 2]} material={STEEL}>
          <cylinderGeometry args={[0.004, 0.004, 0.36, 6]} />
        </mesh>
      ))}
    </>
  )
}

/** How far out from the wall the fan's hub sits, between the backing and the grille. */
const FAN_Z = 0.018

/**
 * Five blades round a hub, each pitched about its own length, turning about
 * the vent's axis. A shroud ring holds it square in the housing.
 */
export function VentFan({ spinning }: { spinning: boolean }) {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (spinning && ref.current) ref.current.rotation.z -= Math.min(dt, 0.05) * 9
  })
  return (
    <>
      <mesh position={[0, 0, FAN_Z]} material={DARK}>
        <torusGeometry args={[0.158, 0.009, 8, 48]} />
      </mesh>
      <group ref={ref} position={[0, 0, FAN_Z]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} rotation={[0, 0, (i * PI * 2) / 5]}>
            <mesh position={[0, 0.088, 0]} rotation={[0, 0.3, 0]} material={BLADE}>
              <boxGeometry args={[0.05, 0.12, 0.003]} />
            </mesh>
          </group>
        ))}
        <mesh rotation={[PI / 2, 0, 0]} material={DARK}>
          <cylinderGeometry args={[0.032, 0.032, 0.02, 20]} />
        </mesh>
      </group>
    </>
  )
}

const SUCKER = new SphereGeometry(1, 14, 10)

/** Something has got into the ventilation: a tentacle curling out through the grille. */
export function VentTentacle() {
  const parts = useRef<(Mesh | null)[]>([])
  const n = 11
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    let x = 0.03
    let y = -0.06
    let z = 0.03
    let a = 0.2
    for (let i = 0; i < n; i++) {
      const m = parts.current[i]
      // each segment bends a little more than the last, and the whole thing sways
      a += 0.22 + Math.sin(t * 1.4 - i * 0.5) * 0.12
      x += Math.cos(a) * 0.018 + Math.sin(t * 0.9 + i * 0.3) * 0.004
      z += 0.026
      y += Math.sin(a) * 0.022
      m?.position.set(x, y, z)
    }
  })
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const r = 0.032 - i * 0.0022
        return (
          <mesh
            key={i}
            ref={(m) => {
              parts.current[i] = m
            }}
            geometry={SUCKER}
            scale={[r, r, r * 1.3]}
          >
            <meshStandardMaterial color={i % 2 ? '#7d3fa3' : '#9150b8'} roughness={0.35} />
          </mesh>
        )
      })}
    </>
  )
}

/** Someone's sock, sucked into the grille. */
export function VentSock() {
  return (
    <group position={[0.04, -0.02, 0.05]} rotation={[0, 0, -0.15]}>
      {/* the leg, squashed flat where the grille has it, with two red hoops */}
      <mesh position={[0, -0.08, 0]} scale={[1, 1, 0.45]}>
        <capsuleGeometry args={[0.045, 0.14, 6, 16]} />
        <meshStandardMaterial color="#f2f4f7" roughness={0.9} />
      </mesh>
      {[-0.12, -0.04].map((y) => (
        <mesh key={y} position={[0, y, 0]} scale={[1, 1, 0.45]}>
          <cylinderGeometry args={[0.047, 0.047, 0.035, 16]} />
          <meshStandardMaterial color="#ff3131" roughness={0.9} />
        </mesh>
      ))}
      {/* the foot hanging out of the vent, heel and toe rounded */}
      <mesh position={[0, -0.19, 0.05]} rotation={[PI / 2, 0, 0]} scale={[1, 1, 0.8]}>
        <capsuleGeometry args={[0.042, 0.09, 6, 16]} />
        <meshStandardMaterial color="#f2f4f7" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** A grey fuse box with a conduit up to the deckhead (faces +z, centre at the origin). */
export function FuseBox() {
  const grey = { color: '#8d9298', metalness: 0.5, roughness: 0.5 }
  return (
    <>
      <Block size={[0.36, 0.48, 0.1]} position={[0, 0, 0.05]} {...grey} radius={0.012} />
      <Block size={[0.32, 0.44, 0.008]} position={[0, 0, 0.104]} {...grey} radius={0.004} />
      {/* a window onto two rows of breakers */}
      <mesh position={[0, -0.06, 0.1085]}>
        <planeGeometry args={[0.24, 0.16]} />
        <meshStandardMaterial color="#1c1f24" roughness={0.3} />
      </mesh>
      {[-0.025, -0.095].flatMap((y) =>
        [-0.09, -0.045, 0, 0.045, 0.09].map((x, i) => (
          <mesh key={`${x}${y}`} position={[x, y, 0.11]}>
            <planeGeometry args={[0.022, 0.04]} />
            <meshBasicMaterial color={i === 3 && y < -0.05 ? '#ff3131' : '#e8e8e0'} />
          </mesh>
        )),
      )}
      {/* high-voltage triangle */}
      <mesh position={[0, 0.12, 0.109]} rotation={[0, 0, PI / 2]}>
        <circleGeometry args={[0.06, 3]} />
        <meshBasicMaterial color="#ffcc1a" />
      </mesh>
      <mesh position={[0, 0.115, 0.11]} rotation={[0, 0, PI / 2]}>
        <circleGeometry args={[0.03, 3]} />
        <meshBasicMaterial color="#16181c" />
      </mesh>
      <Block size={[0.03, 0.06, 0.02]} position={[0.13, -0.06, 0.118]} color="#16181c" roughness={0.5} radius={0.006} />
      <Pipe from={[0, 0.24, 0.05]} to={[0, 0.85, 0.05]} radius={0.025} />
    </>
  )
}

/** Intercom panel on the corridor wall (faces +z). */
export function Intercom() {
  return (
    <>
      <Block size={[0.2, 0.3, 0.04]} position={[0, 0, 0.02]} color="#c9ced6" metalness={0.6} roughness={0.4} radius={0.01} />
      {[-0.02, 0, 0.02, 0.04, 0.06].map((y) => (
        <mesh key={y} position={[0, y + 0.03, 0.041]}>
          <planeGeometry args={[0.12, 0.008]} />
          <meshBasicMaterial color="#1b1f2a" />
        </mesh>
      ))}
      <mesh position={[0, -0.08, 0.045]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.012, 20]} />
        <meshStandardMaterial color="#2b2f36" roughness={0.4} />
      </mesh>
      <mesh position={[0.06, 0.12, 0.041]}>
        <circleGeometry args={[0.008, 12]} />
        <meshBasicMaterial color="#5dff9a" />
      </mesh>
    </>
  )
}

/** A steel oil drum. */
export function Drum({ color = '#2f6e3f' }: { color?: string }) {
  return (
    <>
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.29, 0.29, 0.88, 32]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      {[0.3, 0.58].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[PI / 2, 0, 0]}>
          <torusGeometry args={[0.292, 0.012, 8, 40]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* rolled rims top and bottom */}
      {[0.014, 0.866].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[PI / 2, 0, 0]}>
          <torusGeometry args={[0.285, 0.014, 8, 40]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0.15, 0.885, 0.05]}>
        <cylinderGeometry args={[0.03, 0.03, 0.012, 12]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
      </mesh>
    </>
  )
}

/** Workbench with a vice; front faces +z. */
export function Workbench() {
  const wood = { color: '#8a6a48', roughness: 0.7 }
  const legs: Vec3[] = [
    [-0.75, 0.4375, -0.25],
    [0.75, 0.4375, -0.25],
    [-0.75, 0.4375, 0.25],
    [0.75, 0.4375, 0.25],
  ]
  return (
    <>
      <Block size={[1.6, 0.05, 0.6]} position={[0, 0.9, 0]} {...wood} radius={0.01} />
      {legs.map((p, i) => (
        <Block key={i} size={[0.05, 0.875, 0.05]} position={p} color="#3a3f46" metalness={0.8} roughness={0.4} />
      ))}
      <Block size={[1.5, 0.03, 0.5]} position={[0, 0.25, 0]} color="#3a3f46" metalness={0.8} roughness={0.4} />
      {/* vice on the left-hand end */}
      <group position={[-0.6, 0.925, 0.2]}>
        <Block size={[0.16, 0.06, 0.2]} position={[0, 0.03, 0]} color="#1f4fa0" metalness={0.6} roughness={0.4} />
        <Block size={[0.16, 0.08, 0.04]} position={[0, 0.1, -0.06]} color="#1f4fa0" metalness={0.6} roughness={0.4} />
        <Block size={[0.16, 0.08, 0.04]} position={[0, 0.1, 0.04]} color="#1f4fa0" metalness={0.6} roughness={0.4} />
        <mesh position={[0, 0.07, 0.14]} rotation={[PI / 2, 0, 0]} material={STEEL}>
          <cylinderGeometry args={[0.01, 0.01, 0.12, 8]} />
        </mesh>
      </group>
    </>
  )
}
