import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import {
  AdditiveBlending,
  BackSide,
  DoubleSide,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Group,
  type Mesh,
  type PointLight,
} from 'three'
import { Block, PanelLight, PI } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { mulberry32 } from '../../rng'
import { useEmergencyLabelTexture } from './textures'

const OUTPUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`
const UV_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }
`

/** A plane running a time-animated shader. */
function ShaderPlane({
  fragment,
  uniforms,
  size,
  position,
  toneMapped = true,
}: {
  fragment: string
  uniforms: Record<string, unknown>
  size: [number, number]
  position?: Vec3
  toneMapped?: boolean
}) {
  const ref = useRef<Mesh>(null)
  const material = useMemo(() => {
    const u: Record<string, { value: unknown }> = { uTime: { value: 0 } }
    for (const [k, v] of Object.entries(uniforms)) u[k] = { value: v }
    return new ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: fragment, uniforms: u, toneMapped })
  }, [fragment, toneMapped, uniforms])
  const geometry = useMemo(() => new PlaneGeometry(...size), [size])
  useFrame(({ clock }) => {
    const m = ref.current?.material as ShaderMaterial | undefined
    if (m?.uniforms?.uTime) m.uniforms.uTime.value = clock.elapsedTime
  })
  return <mesh ref={ref} geometry={geometry} material={material} position={position} />
}

// ---------------------------------------------------------------------------
// Console: a desk of blinking buttons.
// ---------------------------------------------------------------------------

const CONSOLE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uAlarm;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    vec2 g = vUv * vec2(18.0, 5.0);
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash(id);
    float on = step(0.45, fract(h * 7.0 + uTime * (0.2 + h) * 0.6));
    vec3 c = h < 0.33 ? vec3(0.2, 1.0, 0.4) : (h < 0.66 ? vec3(1.0, 0.7, 0.15) : vec3(0.2, 0.8, 1.0));
    float cell = smoothstep(0.34, 0.27, max(abs(f.x), abs(f.y)));
    vec3 lit = mix(c * 0.12, c * 1.8, on);
    if (uAlarm > 0.5) {
      float flash = step(0.5, fract(uTime * 2.2 + h * 0.25));
      lit = mix(vec3(0.15, 0.0, 0.0), vec3(2.2, 0.08, 0.05), flash);
    }
    gl_FragColor = vec4(mix(vec3(0.03, 0.035, 0.05), lit, cell), 1.0);
    ${OUTPUT}
  }
`

export function ConsoleLights({ alarm, size, position, rotation }: { alarm: boolean; size: [number, number]; position: Vec3; rotation: Vec3 }) {
  return (
    <group position={position} rotation={rotation}>
      <ShaderPlane fragment={CONSOLE_FRAG} uniforms={{ uAlarm: alarm ? 1 : 0 }} size={size} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Hologram projector
// ---------------------------------------------------------------------------

export function Hologram({ shape }: { shape: 'planet' | 'cube' | 'knot' }) {
  const spin = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!spin.current) return
    const t = clock.elapsedTime
    spin.current.rotation.y = t * 0.6
    spin.current.rotation.x = Math.sin(t * 0.4) * 0.2
    spin.current.position.y = 1.35 + Math.sin(t * 1.5) * 0.03
    // a little flicker
    spin.current.visible = Math.sin(t * 37) > -0.97
  })
  const mat = (
    <meshBasicMaterial color="#3dfcff" wireframe transparent opacity={0.75} blending={AdditiveBlending} depthWrite={false} />
  )
  return (
    <>
      <group ref={spin} position={[0, 1.35, 0]}>
        {shape === 'planet' && (
          <>
            <mesh userData={{ paint: true }}>
              <icosahedronGeometry args={[0.26, 2]} />
              {mat}
            </mesh>
            <mesh rotation={[1.2, 0, 0]} userData={{ paint: true }}>
              <torusGeometry args={[0.42, 0.01, 6, 64]} />
              {mat}
            </mesh>
          </>
        )}
        {shape === 'cube' && (
          <mesh userData={{ paint: true }}>
            <boxGeometry args={[0.42, 0.42, 0.42, 3, 3, 3]} />
            {mat}
          </mesh>
        )}
        {shape === 'knot' && (
          <mesh userData={{ paint: true }}>
            <torusKnotGeometry args={[0.2, 0.06, 96, 10]} />
            {mat}
          </mesh>
        )}
      </group>
      {/* projector beam */}
      <mesh position={[0, 1.02, 0]}>
        <coneGeometry args={[0.42, 0.55, 32, 1, true]} />
        <meshBasicMaterial color="#3dfcff" transparent opacity={0.07} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  )
}

export function HologramPedestal() {
  return (
    <>
      <mesh position={[0, 0.375, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.26, 0.75, 32]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.03, 32]} />
        <meshStandardMaterial color="#3dfcff" emissive="#3dfcff" emissiveIntensity={2} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// Specimen tank: bubbling liquid and something floating inside.
// ---------------------------------------------------------------------------

function useBlobGeometry() {
  return useMemo(() => {
    const g = new IcosahedronGeometry(0.17, 5)
    const pos = g.attributes.position
    const v = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const bump = 1 + 0.18 * Math.sin(v.x * 30) * Math.sin(v.y * 27) * Math.sin(v.z * 33) + 0.12 * Math.sin(v.y * 12)
      v.multiplyScalar(bump)
      pos.setXYZ(i, v.x, v.y * 1.2, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])
}

export function TankCreature({ awake }: { awake: boolean }) {
  const blob = useRef<Group>(null)
  const geometry = useBlobGeometry()
  useFrame(({ clock }) => {
    if (!blob.current) return
    const t = clock.elapsedTime
    blob.current.position.y = 1.05 + Math.sin(t * 0.7) * 0.06
    blob.current.rotation.y = t * (awake ? 0.9 : 0.15)
    const s = awake ? 1 + Math.sin(t * 6) * 0.06 : 1 + Math.sin(t * 1.2) * 0.02
    blob.current.scale.setScalar(s)
  })
  return (
    <group ref={blob} position={[0, 1.05, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={awake ? '#ff5a5f' : '#e8b7c4'}
          emissive={awake ? '#ff1f3a' : '#6b3048'}
          emissiveIntensity={awake ? 1.3 : 0.3}
          roughness={0.35}
        />
      </mesh>
      {awake &&
        [-0.07, 0.07, 0].map((x, i) => (
          <group key={i} position={[x, i === 2 ? 0.1 : 0.03, 0.16]}>
            <mesh>
              <sphereGeometry args={[0.04, 16, 12]} />
              <meshStandardMaterial color="#fffbe6" roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.035]}>
              <sphereGeometry args={[0.016, 12, 8]} />
              <meshBasicMaterial color="#050505" />
            </mesh>
          </group>
        ))}
      {awake && <pointLight position={[0, 0, 0.3]} intensity={1.2} distance={2.5} decay={2} color="#ff3a4a" />}
    </group>
  )
}

export function Tank() {
  const bubbles = useRef<InstancedMesh>(null)
  const state = useRef<{ x: number; y: number; z: number; v: number }[]>([])
  const dummy = useRef(new Object3D())
  useFrame((_, dt) => {
    const mesh = bubbles.current
    if (!mesh) return
    if (state.current.length === 0) {
      const rng = mulberry32(11)
      state.current = Array.from({ length: 30 }, () => ({ x: (rng() - 0.5) * 0.4, z: (rng() - 0.5) * 0.4, y: 0.3 + rng() * 1.5, v: 0.15 + rng() * 0.25 }))
    }
    state.current.forEach((b, i) => {
      b.y += b.v * Math.min(dt, 0.05)
      if (b.y > 1.85) b.y = 0.3
      dummy.current.position.set(b.x + Math.sin(b.y * 9) * 0.01, b.y, b.z)
      dummy.current.updateMatrix()
      mesh.setMatrixAt(i, dummy.current.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.46, 0.26, 40]} />
        <meshStandardMaterial color="#5d6670" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.44, 0.42, 0.18, 40]} />
        <meshStandardMaterial color="#5d6670" metalness={0.85} roughness={0.35} />
      </mesh>
      {/* liquid */}
      <mesh position={[0, 1.04, 0]} userData={{ paint: true }}>
        <cylinderGeometry args={[0.36, 0.36, 1.58, 40]} />
        <meshStandardMaterial color="#6dffb0" emissive="#1fae6a" emissiveIntensity={0.7} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* glass */}
      <mesh position={[0, 1.04, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.38, 0.38, 1.66, 40, 1, true]} />
        <meshPhysicalMaterial color="#e8fbff" transparent opacity={0.18} roughness={0.04} clearcoat={1} side={DoubleSide} depthWrite={false} />
      </mesh>
      <instancedMesh ref={bubbles} args={[undefined, undefined, 30]}>
        <sphereGeometry args={[0.018, 10, 8]} />
        <meshStandardMaterial color="#e8fff4" emissive="#9effd0" emissiveIntensity={0.5} transparent opacity={0.7} />
      </instancedMesh>
      <pointLight position={[0, 1.1, 0.5]} intensity={1} distance={3} decay={2} color="#4dffa0" />
    </>
  )
}

// ---------------------------------------------------------------------------
// Cargo crates
// ---------------------------------------------------------------------------

export function Crate({ position, rotation }: { position: Vec3; rotation?: Vec3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Block size={[0.6, 0.6, 0.6]} position={[0, 0.3, 0]} color="#5b6b7a" metalness={0.5} roughness={0.5} radius={0.02} paint />
      {/* hazard band and corner caps */}
      <Block size={[0.62, 0.08, 0.62]} position={[0, 0.3, 0]} color="#ffcc1a" roughness={0.6} radius={0.01} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Block key={`${sx}${sz}`} size={[0.08, 0.62, 0.08]} position={[sx * 0.28, 0.3, sz * 0.28]} color="#2b2f36" metalness={0.8} roughness={0.35} radius={0.01} />
        )),
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Airlock hatch (built facing +z)
// ---------------------------------------------------------------------------

export function AirlockFrame() {
  return (
    <>
      {/* proud of the wall, so it frames the hole in the hull without sinking into it */}
      <mesh position={[0, 1.15, 0.07]} castShadow>
        <torusGeometry args={[0.76, 0.09, 24, 64]} />
        <meshStandardMaterial color="#8d969f" metalness={0.9} roughness={0.3} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.76, 1.15 + Math.sin(a) * 0.76, 0.15]}>
            <sphereGeometry args={[0.025, 10, 8]} />
            <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
          </mesh>
        )
      })}
    </>
  )
}

export function AirlockDoor({ open }: { open: boolean }) {
  return (
    // hinged on the far side, so the gap faces the middle of the cabin
    <group position={[0.68, 1.15, 0]} rotation={[0, open ? 0.75 : 0, 0]}>
      <group position={[-0.68, 0, 0.04]}>
        <mesh rotation={[PI / 2, 0, 0]} castShadow userData={{ paint: true }}>
          <cylinderGeometry args={[0.68, 0.68, 0.07, 64]} />
          <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <torusGeometry args={[0.24, 0.025, 16, 48]} />
          <meshStandardMaterial color="#2b2f36" metalness={0.8} roughness={0.3} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0, 0.06]} rotation={[0, 0, (i * PI) / 4]}>
            <boxGeometry args={[0.48, 0.03, 0.03]} />
            <meshStandardMaterial color="#2b2f36" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Robot drone
// ---------------------------------------------------------------------------

export function Drone({ asleep }: { asleep: boolean }) {
  const body = useRef<Group>(null)
  const eye = useRef<PointLight>(null)
  const look = useRef(new Vector3())
  useFrame(({ clock, camera }) => {
    if (!body.current || asleep) return
    const t = clock.elapsedTime
    body.current.position.y = Math.sin(t * 1.6) * 0.06
    // keeps an eye on you
    body.current.lookAt(look.current.copy(camera.position))
    if (eye.current) eye.current.intensity = 0.6 + Math.sin(t * 4) * 0.1
  })
  return (
    <group ref={body} position={asleep ? [0, -1.22, 0] : [0, 0, 0]} rotation={asleep ? [0.5, 0.4, 0.3] : [0, 0, 0]}>
      <mesh castShadow userData={{ paint: true }}>
        <sphereGeometry args={[0.18, 40, 28]} />
        <meshStandardMaterial color="#f2f4f7" metalness={0.3} roughness={0.25} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]}>
        <torusGeometry args={[0.185, 0.018, 12, 48]} />
        <meshStandardMaterial color="#ff8a1f" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.03, 0.165]}>
        <circleGeometry args={[0.055, 32]} />
        <meshStandardMaterial color="#0a0d12" emissive={asleep ? '#000000' : '#3dfcff'} emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.1, 8]} />
        <meshStandardMaterial color="#8d969f" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.018, 12, 8]} />
        <meshStandardMaterial color="#ff3131" emissive={asleep ? '#000000' : '#ff3131'} emissiveIntensity={2} />
      </mesh>
      {!asleep && <pointLight ref={eye} position={[0, 0.03, 0.3]} distance={1.8} decay={2} color="#3dfcff" />}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Space helmet (visor faces +z, sitting on its neck ring at y = 0)
// ---------------------------------------------------------------------------

const HELMET = { y: 0.2, r: 0.16 }
/** The visor's window in the shell: a band across the front, wider than it is tall. */
const VISOR = { phi: PI * 0.12, phiLength: PI * 0.76, theta: PI * 0.34, thetaLength: PI * 0.28 }
/** Where the shell stops at the bottom, above the neck ring. */
const SHELL_BOTTOM = PI * 0.8

function HelmetShell() {
  const white = <meshStandardMaterial color="#f2f2ee" roughness={0.42} />
  const { y, r } = HELMET
  const { phi, phiLength, theta, thetaLength } = VISOR
  return (
    <>
      {/* the shell in three pieces round the visor's window */}
      <mesh position={[0, y, 0]} castShadow userData={{ paint: true }}>
        <sphereGeometry args={[r, 40, 28, phi + phiLength, PI * 2 - phiLength, 0, SHELL_BOTTOM]} />
        {white}
      </mesh>
      <mesh position={[0, y, 0]} castShadow userData={{ paint: true }}>
        <sphereGeometry args={[r, 32, 12, phi, phiLength, 0, theta]} />
        {white}
      </mesh>
      <mesh position={[0, y, 0]} castShadow userData={{ paint: true }}>
        <sphereGeometry args={[r, 32, 8, phi, phiLength, theta + thetaLength, SHELL_BOTTOM - theta - thetaLength]} />
        {white}
      </mesh>
      {/* the visor hood standing proud over the top of the visor */}
      <mesh position={[0, y, 0]} castShadow userData={{ paint: true }}>
        <sphereGeometry args={[r + 0.012, 32, 10, phi - 0.08, phiLength + 0.16, PI * 0.12, theta - PI * 0.12 + 0.02]} />
        {white}
      </mesh>
      {/* rims along the top and bottom of the visor */}
      {[theta - 0.02, theta + thetaLength - 0.01].map((t) => (
        <mesh key={t} position={[0, y, 0]}>
          <sphereGeometry args={[r + 0.006, 32, 2, phi - 0.02, phiLength + 0.04, t, 0.03]} />
          <meshStandardMaterial color="#8d969f" metalness={0.85} roughness={0.3} side={DoubleSide} />
        </mesh>
      ))}
      {/* collar and neck ring */}
      <mesh position={[0, 0.0615, 0]} castShadow>
        <cylinderGeometry args={[0.098, 0.122, 0.025, 40, 1, true]} />
        <meshStandardMaterial color="#f2f2ee" roughness={0.42} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.125, 0.125, 0.05, 40]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.128, 0.128, 0.014, 40]} />
        <meshStandardMaterial color="#2f6bd8" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* helmet lamp on the right */}
      <Block size={[0.045, 0.04, 0.075]} position={[0.153, 0.27, 0.045]} color="#e4e6e8" roughness={0.45} radius={0.012} />
      <mesh position={[0.153, 0.27, 0.0835]}>
        <circleGeometry args={[0.015, 20]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fff3c4" emissiveIntensity={1.6} />
      </mesh>
      {/* comms unit and aerial on the left */}
      <mesh position={[-0.163, y, -0.015]} rotation={[0, 0, PI / 2]} castShadow>
        <cylinderGeometry args={[0.042, 0.042, 0.026, 28]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[-0.168, 0.29, -0.035]} rotation={[-0.3, 0, 0.08]}>
        <cylinderGeometry args={[0.004, 0.004, 0.12, 8]} />
        <meshStandardMaterial color="#2b2f36" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.172, 0.347, -0.053]}>
        <sphereGeometry args={[0.008, 10, 8]} />
        <meshStandardMaterial color="#ff3131" emissive="#ff3131" emissiveIntensity={0.8} />
      </mesh>
    </>
  )
}

/** The visor: mirrored gold, or (occupied) dark glass with something inside looking out. */
export function Helmet({ occupied = false }: { occupied?: boolean }) {
  const { y, r } = HELMET
  const { phi, phiLength, theta, thetaLength } = VISOR
  return (
    <>
      <HelmetShell />
      <mesh position={[0, y, 0]}>
        <sphereGeometry args={[r + 0.002, 40, 16, phi, phiLength, theta, thetaLength]} />
        {occupied ? (
          <meshStandardMaterial color="#20301c" metalness={0.5} roughness={0.08} transparent opacity={0.55} depthWrite={false} side={DoubleSide} />
        ) : (
          <meshStandardMaterial color="#d6a92a" metalness={1} roughness={0.1} side={DoubleSide} />
        )}
      </mesh>
      {occupied && (
        <>
          {/* the dark inside of the helmet, and two eyes in it */}
          <mesh position={[0, y, 0]}>
            <sphereGeometry args={[r - 0.004, 32, 20]} />
            <meshStandardMaterial color="#050605" roughness={0.9} side={BackSide} />
          </mesh>
          {[-0.045, 0.045].map((x) => (
            <mesh key={x} position={[x, y + 0.015, 0.11]} scale={[1, 0.75, 0.6]}>
              <sphereGeometry args={[0.022, 16, 12]} />
              <meshStandardMaterial color="#b6ff3d" emissive="#b6ff3d" emissiveIntensity={3} />
            </mesh>
          ))}
          <pointLight position={[0, y, 0.25]} intensity={0.5} distance={1.2} decay={2} color="#b6ff3d" />
        </>
      )}
    </>
  )
}

/** A red emergency oxygen locker for the wall (faces +z). */
export function EmergencyLocker() {
  const label = useEmergencyLabelTexture()
  return (
    <>
      <Block size={[0.4, 0.5, 0.12]} position={[0, 0, 0.06]} color="#c8261d" metalness={0.3} roughness={0.5} radius={0.015} />
      {/* door seam and hinge */}
      <Block size={[0.36, 0.46, 0.006]} position={[0, 0, 0.122]} color="#b3211a" metalness={0.3} roughness={0.5} radius={0.004} />
      <Block size={[0.012, 0.4, 0.014]} position={[-0.186, 0, 0.122]} color="#9aa3ad" metalness={0.85} roughness={0.3} radius={0.004} />
      <mesh position={[0, 0.09, 0.1255]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial map={label} roughness={0.6} />
      </mesh>
      {/* pull handle, striped so nobody misses it */}
      <Block size={[0.03, 0.12, 0.03]} position={[0.13, -0.12, 0.14]} color="#16181c" metalness={0.5} roughness={0.4} radius={0.008} />
      <Block size={[0.032, 0.03, 0.032]} position={[0.13, -0.09, 0.14]} color="#ffcc1a" roughness={0.5} radius={0.006} />
      <Block size={[0.032, 0.03, 0.032]} position={[0.13, -0.15, 0.14]} color="#ffcc1a" roughness={0.5} radius={0.006} />
      <mesh position={[-0.09, -0.15, 0.1255]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color="#5dff9a" toneMapped={false} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// A mug of coffee drifting in zero gravity
// ---------------------------------------------------------------------------

export function FloatingMug({ bigBlob = false }: { bigBlob?: boolean }) {
  const drift = useRef<Group>(null)
  const body = useMemo(
    () =>
      new LatheGeometry(
        [
          [0, 0],
          [0.036, 0],
          [0.04, 0.004],
          [0.041, 0.095],
          [0.038, 0.098],
          [0.036, 0.095],
          [0.035, 0.012],
          [0, 0.012],
        ].map(([x, y]) => new Vector2(x, y)),
        40,
      ),
    [],
  )
  useFrame(({ clock }) => {
    if (!drift.current) return
    const t = clock.elapsedTime
    drift.current.rotation.set(t * 0.4, t * 0.25, t * 0.15)
    drift.current.position.y = Math.sin(t * 0.8) * 0.05
  })
  return (
    <group ref={drift}>
      <group position={[0, -0.05, 0]}>
        <mesh geometry={body} castShadow userData={{ paint: true }}>
          <meshStandardMaterial color="#ff3131" roughness={0.3} side={DoubleSide} />
        </mesh>
        <mesh position={[0.046, 0.05, 0]} userData={{ paint: true }}>
          <torusGeometry args={[0.026, 0.007, 12, 32, PI * 1.2]} />
          <meshStandardMaterial color="#ff3131" roughness={0.3} />
        </mesh>
      </group>
      {/* the coffee has escaped and is floating next to it as a blob */}
      <mesh position={bigBlob ? [0.2, 0.08, 0.05] : [0.12, 0.06, 0.04]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[bigBlob ? 0.09 : 0.025, 24, 16]} />
        <meshStandardMaterial color="#3b2416" roughness={0.05} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Captain's chair (faces +z)
// ---------------------------------------------------------------------------

export function CaptainChair() {
  const metal = { color: '#c9ced6', metalness: 0.85, roughness: 0.3 }
  return (
    <>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.06, 40]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.42, 24]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <RoundedBox args={[0.62, 0.14, 0.58]} radius={0.05} smoothness={4} position={[0, 0.52, 0.02]} castShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#7a1e2b" roughness={0.45} />
      </RoundedBox>
      <RoundedBox
        args={[0.6, 0.8, 0.13]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.98, -0.27]}
        rotation={[-0.14, 0, 0]}
        castShadow
        userData={{ paint: true }}
      >
        <meshStandardMaterial color="#7a1e2b" roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[0.34, 0.18, 0.1]} radius={0.04} smoothness={4} position={[0, 1.47, -0.33]} castShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#7a1e2b" roughness={0.45} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.38, 0.7, 0.02]}>
          <Block size={[0.12, 0.08, 0.5]} color={metal.color} metalness={metal.metalness} roughness={metal.roughness} radius={0.02} />
          <mesh position={[0, 0.045, 0.1]} rotation={[-PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, 0.18]} />
            <meshStandardMaterial color="#0a0d12" emissive={s < 0 ? '#3dfcff' : '#b6ff3d'} emissiveIntensity={1.4} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Ceiling light strips: normal or red alert.
// ---------------------------------------------------------------------------

export function CeilingLights({ alert, height, length }: { alert: boolean; height: number; length: number }) {
  const strip = alert ? '#ff2a2a' : '#d8ecff'
  const pulse = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    if (pulse.current) pulse.current.intensity = alert ? 3 + Math.sin(clock.elapsedTime * 5) * 2.5 : 0
  })
  return (
    <>
      {[-1.25, 1.25].map((x) => (
        <group key={x}>
          <Block
            size={[0.16, 0.04, length]}
            position={[x, height - 0.03, 0]}
            color={strip}
            emissive={strip}
            emissiveIntensity={alert ? 2.5 : 2}
            radius={0.01}
          />
          <PanelLight
            position={[x, height - 0.06, 0]}
            size={[0.25, length]}
            facing={[x, 0, 0]}
            color={strip}
            intensity={alert ? 4 : 3}
          />
        </group>
      ))}
      {/* red alert is for the bridge; keep it from washing over the rest of the ship */}
      <pointLight ref={pulse} position={[0, height - 0.4, 0]} distance={5.5} decay={1.4} color="#ff2a2a" />
    </>
  )
}

/** A Poly Haven duck, scaled to sit on the console; optionally kitted out for space. */
export function ConsoleDuck({ helmet = false }: { helmet?: boolean }) {
  return (
    <>
      <Model id="rubber_duck_toy" scale={0.55} />
      {helmet && (
        <>
          <mesh position={[0, 0.12, 0.02]} renderOrder={2}>
            <sphereGeometry args={[0.075, 32, 20]} />
            <meshPhysicalMaterial color="#e8fbff" transparent opacity={0.3} roughness={0.03} clearcoat={1} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.06, 0.02]} rotation={[PI / 2, 0, 0]}>
            <torusGeometry args={[0.062, 0.012, 12, 32]} />
            <meshStandardMaterial color="#c9ced6" metalness={0.85} roughness={0.3} />
          </mesh>
        </>
      )}
    </>
  )
}

/** Spins its children slowly about the vertical axis, all by itself. */
export function Spin({ speed = 0.7, children }: { speed?: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += speed * Math.min(dt, 0.05)
  })
  return <group ref={ref}>{children}</group>
}
