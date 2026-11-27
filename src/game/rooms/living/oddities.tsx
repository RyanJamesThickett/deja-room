import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import {
  BackSide,
  BufferGeometry,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
  type PointLight,
} from 'three'
import { Block, Instanced, PI, type Placement } from '../../kit'
import { GOLDFISH, SHARK } from './fishParts'
import type { Surface } from '../../assets'
import type { Vec3 } from '../../mutations'
import { mulberry32 } from '../../rng'

/*
 * The living room's stranger furniture: things that watch you, weather
 * indoors, fish in the air, a TV that turns itself on and a real world
 * outside the window.
 */

const OUTPUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`
const UV_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`


// ---------------------------------------------------------------------------
// TV screen: colour bars, scanlines, static, and every so often a face.
// ---------------------------------------------------------------------------

const TV_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 uv = vUv;
    uv.x += sin(uv.y * 40.0 + uTime * 9.0) * 0.004;           // wobble
    float bar = floor(uv.x * 7.0);
    vec3 bars[7];
    bars[0] = vec3(0.9); bars[1] = vec3(0.9, 0.9, 0.1); bars[2] = vec3(0.1, 0.9, 0.9);
    bars[3] = vec3(0.1, 0.9, 0.1); bars[4] = vec3(0.9, 0.1, 0.9); bars[5] = vec3(0.9, 0.1, 0.1);
    bars[6] = vec3(0.1, 0.1, 0.9);
    vec3 col = bars[int(clamp(bar, 0.0, 6.0))];
    // every few seconds the bars give way to a big staring smiley
    float phase = mod(uTime, 6.0);
    if (phase > 4.0) {
      vec2 p = (uv - 0.5) * vec2(1.3, 1.0);
      float face = step(length(p), 0.38);
      float eyes = step(length(p - vec2(-0.12, 0.1)), 0.05) + step(length(p - vec2(0.12, 0.1)), 0.05);
      float mouth = step(abs(length(p - vec2(0.0, 0.02)) - 0.2), 0.025) * step(p.y, -0.04);
      col = mix(vec3(0.05), vec3(1.0, 0.85, 0.1), face);
      col = mix(col, vec3(0.05), clamp(eyes + mouth, 0.0, 1.0) * face);
    }
    float noise = hash(uv * 300.0 + uTime);
    col = mix(col, vec3(noise), 0.18);
    col *= 0.8 + 0.2 * sin(uv.y * 400.0);                        // scanlines
    col *= 0.85 + 0.15 * smoothstep(0.0, 0.1, abs(fract(uv.y - uTime * 0.3) - 0.5)); // rolling band
    vec2 c = vUv - 0.5;
    col *= 1.0 - dot(c, c) * 1.6;                                // tube vignette
    gl_FragColor = vec4(col * 1.4, 1.0);
    ${OUTPUT}
  }
`

export function TvScreen({ position, size }: { position: Vec3; size: [number, number] }) {
  const ref = useRef<Mesh>(null)
  const material = useMemo(() => new ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: TV_FRAG, uniforms: { uTime: { value: 0 } } }), [])
  const geometry = useMemo(() => new PlaneGeometry(...size), [size])
  const light = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    const m = ref.current?.material as ShaderMaterial | undefined
    if (m?.uniforms?.uTime) m.uniforms.uTime.value = clock.elapsedTime
    if (light.current) light.current.intensity = 0.9 + Math.sin(clock.elapsedTime * 23) * 0.15
  })
  return (
    <>
      <mesh ref={ref} geometry={geometry} material={material} position={position} />
      <pointLight ref={light} position={[position[0], position[1], position[2] + 0.3]} distance={3} decay={2} color="#9fc8ff" />
    </>
  )
}

// ---------------------------------------------------------------------------
// The world outside: an alien valley you can actually see into.
// Coordinates are relative to the window centre; the ground is at y = -1.5.
// ---------------------------------------------------------------------------

const DOME_FRAG = /* glsl */ `
  varying vec3 vDir;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(vec3(1.0, 0.45, 0.62), vec3(0.12, 0.85, 0.82), smoothstep(-0.05, 0.35, h));
    col = mix(col, vec3(0.16, 0.08, 0.4), smoothstep(0.3, 0.8, h));
    float stars = step(0.996, hash(floor(d * 300.0))) * smoothstep(0.25, 0.6, h);
    gl_FragColor = vec4(col + stars, 1.0);
    ${OUTPUT}
  }
`
const DOME_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

function noise2(x: number, z: number) {
  return Math.sin(x * 0.21) * Math.cos(z * 0.17) + 0.5 * Math.sin(x * 0.53 + z * 0.31) + 0.25 * Math.cos(x * 1.1 - z * 0.9)
}

export function OutsideWorld() {
  const dome = useMemo(
    () => new ShaderMaterial({ vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: BackSide, depthWrite: false }),
    [],
  )
  const ground = useMemo(() => {
    const g = new PlaneGeometry(200, 140, 160, 110)
    g.rotateX(-PI / 2)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i) - 65
      const dist = Math.hypot(x, z)
      // flat valley floor near the house, gentle hills mid-distance, mountains far away
      const hills = noise2(x, z) * 0.8 * Math.min(1, Math.max(0, (dist - 8) / 22)) + Math.max(0, dist - 50) * 0.12
      pos.setY(i, hills)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const scatter = useMemo(() => {
    const rng = mulberry32(42)
    const trees: { at: Vec3; h: number; r: number; colour: string }[] = []
    const rocks: { at: Vec3; s: number; rot: number }[] = []
    const colours = ['#ff4fd8', '#3dfcff', '#b6ff3d', '#ffb13d']
    for (let i = 0; i < 26; i++) {
      const z = -5 - rng() * 45
      const x = (rng() - 0.5) * (8 + -z * 1.3)
      trees.push({ at: [x, -1.5, z], h: 1.5 + rng() * 3.5, r: 0.4 + rng() * 0.9, colour: colours[i % colours.length] })
    }
    for (let i = 0; i < 18; i++) {
      const z = -3 - rng() * 30
      rocks.push({ at: [(rng() - 0.5) * (6 + -z), -1.5, z], s: 0.3 + rng() * 1.1, rot: rng() * 6 })
    }
    return { trees, rocks }
  }, [])
  const ufo = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!ufo.current) return
    ufo.current.position.set(3 + Math.sin(t * 0.3) * 4, 5 + Math.sin(t * 1.1) * 0.4, -22)
    ufo.current.rotation.y = t * 1.5
  })

  return (
    <group>
      <mesh material={dome} renderOrder={-1}>
        <sphereGeometry args={[90, 48, 24]} />
      </mesh>
      <mesh geometry={ground} position={[0, -1.55, -65]}>
        <meshStandardMaterial color="#4a2470" emissive="#1c0a33" roughness={1} flatShading />
      </mesh>
      {/* two moons */}
      <mesh position={[-14, 16, -70]}>
        <sphereGeometry args={[6, 32, 16]} />
        <meshBasicMaterial color="#fff2b3" />
      </mesh>
      <mesh position={[26, 10, -82]}>
        <sphereGeometry args={[3, 32, 16]} />
        <meshBasicMaterial color="#c6fff4" />
      </mesh>
      {/* glowing lollipop trees */}
      {scatter.trees.map((t, i) => (
        <group key={i} position={t.at}>
          <mesh position={[0, t.h / 2, 0]}>
            <cylinderGeometry args={[0.06, 0.12, t.h, 8]} />
            <meshStandardMaterial color="#2a1238" roughness={0.9} />
          </mesh>
          <mesh position={[0, t.h + t.r * 0.7, 0]}>
            <sphereGeometry args={[t.r, 24, 16]} />
            <meshStandardMaterial color={t.colour} emissive={t.colour} emissiveIntensity={1.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {scatter.rocks.map((r, i) => (
        <mesh key={i} position={r.at} rotation={[r.rot, r.rot * 2, 0]} scale={r.s}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#6b4a8a" roughness={1} flatShading />
        </mesh>
      ))}
      {/* a visitor */}
      <group ref={ufo}>
        <mesh scale={[1, 0.22, 1]}>
          <sphereGeometry args={[1.6, 48, 24]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.6, 32, 16, 0, PI * 2, 0, PI / 2]} />
          <meshStandardMaterial color="#9ffcff" emissive="#3dfcff" emissiveIntensity={0.8} transparent opacity={0.8} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[Math.cos((i / 10) * PI * 2) * 1.45, -0.02, Math.sin((i / 10) * PI * 2) * 1.45]}>
            <sphereGeometry args={[0.09, 12, 8]} />
            <meshBasicMaterial color={i % 2 ? '#ff4fd8' : '#b6ff3d'} />
          </mesh>
        ))}
        <mesh position={[0, -3.3, 0]}>
          <coneGeometry args={[1.8, 6.2, 32, 1, true]} />
          <meshBasicMaterial color="#b6ff3d" transparent opacity={0.12} side={DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// An eye set into the wall. It follows you. It blinks.
// ---------------------------------------------------------------------------

/** A cap of a sphere just over the eyeball's surface, centred on its +z pole, `angle` wide (from the pole to its edge). */
function eyeCap(radius: number, angle: number) {
  return new SphereGeometry(radius, 40, 8, 0, PI * 2, 0, angle).rotateX(PI / 2)
}
const IRIS = eyeCap(0.1508, 0.43)
const PUPIL = eyeCap(0.1514, 0.19)
/** Where the lashes sit round the front of the lid's edge (angles round y, +z is straight ahead). */
const LASHES = [0.25, 0.4, 0.5, 0.6, 0.75].map((t) => t * PI)

export function WallEye({ asleep = false, x = 0 }: { asleep?: boolean; x?: number }) {
  const ball = useRef<Group>(null)
  const lid = useRef<Mesh>(null)
  const target = useRef(new Vector3())
  const seed = x * 3.7 + 1.3 // so a pair of eyes doesn't blink in sync
  useFrame(({ camera, clock }) => {
    if (!ball.current || !lid.current) return
    if (asleep) {
      lid.current.rotation.x = PI / 2
      return
    }
    target.current.copy(camera.position)
    ball.current.lookAt(target.current)
    // blink every few seconds
    const t = (clock.elapsedTime + seed) % 4.5
    const closed = t < 0.18 ? Math.sin((t / 0.18) * PI) : 0
    lid.current.rotation.x = -0.25 + closed * (PI / 2 + 0.25)
  })
  return (
    <group position={[x, 0, 0]} scale={1.5}>
      {/* fleshy socket */}
      <mesh position={[0, 0, 0.02]}>
        <torusGeometry args={[0.17, 0.045, 24, 48]} />
        <meshStandardMaterial color="#d98c8c" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <circleGeometry args={[0.18, 48]} />
        <meshStandardMaterial color="#3a1414" roughness={1} />
      </mesh>
      <group ref={ball} position={[0, 0, 0.02]}>
        <mesh>
          <sphereGeometry args={[0.15, 48, 32]} />
          <meshStandardMaterial color="#f8f4ee" roughness={0.15} />
        </mesh>
        {/* iris, pupil and a glint: caps that wrap the front of the ball (flat discs sank into it) */}
        <mesh geometry={IRIS} userData={{ paint: true }}>
          <meshStandardMaterial color="#2f8f5b" roughness={0.3} />
        </mesh>
        <mesh geometry={PUPIL}>
          <meshStandardMaterial color="#050505" roughness={0.1} />
        </mesh>
        <mesh position={[0.026, 0.03, 0.146]}>
          <sphereGeometry args={[0.011, 12, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      {/* eyelid: an upper cap that swings down over the ball, with lashes along its edge */}
      <mesh ref={lid} position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.158, 48, 16, 0, PI * 2, 0, PI / 2]} />
        <meshStandardMaterial color="#d98c8c" roughness={0.55} side={DoubleSide} />
        {LASHES.map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.179, 0.0135, Math.sin(a) * 0.179]} rotation={[0, -a, -1]}>
            <cylinderGeometry args={[0.003, 0.005, 0.05, 6]} />
            <meshStandardMaterial color="#1a1010" roughness={0.6} />
          </mesh>
        ))}
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// A little rain cloud that lives indoors.
// ---------------------------------------------------------------------------

/** A zigzag lightning bolt hanging down from the storm cloud's base. */
const BOLT = (() => {
  const shape = new Shape()
  const pts: [number, number][] = [
    [-0.03, 0],
    [0.07, 0],
    [0.02, -0.28],
    [0.09, -0.28],
    [-0.06, -0.8],
    [-0.01, -0.38],
    [-0.08, -0.38],
  ]
  shape.moveTo(...pts[0])
  pts.slice(1).forEach((p) => shape.lineTo(...p))
  shape.closePath()
  return new ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false })
})()

export function RainCloud({ stormy = false }: { stormy?: boolean }) {
  const drops = stormy ? 90 : 40
  const rain = useRef<InstancedMesh>(null)
  const flash = useRef<PointLight>(null)
  const bolt = useRef<Mesh>(null)
  // falling drops live in a ref: they change every frame, React never sees them
  const state = useRef<{ x: number; y: number; z: number; v: number }[]>([])
  const dummy = useRef(new Object3D())
  useFrame(({ clock }, dt) => {
    const mesh = rain.current
    if (!mesh) return
    if (state.current.length !== drops) {
      const rng = mulberry32(stormy ? 7 : 3)
      state.current = Array.from({ length: drops }, () => ({ x: (rng() - 0.5) * 0.7, z: (rng() - 0.5) * 0.5, y: -rng() * 1.9, v: 1.8 + rng() }))
    }
    const speed = stormy ? 1.8 : 1
    for (let i = 0; i < state.current.length; i++) {
      const d = state.current[i]
      d.y -= d.v * speed * Math.min(dt, 0.05)
      if (d.y < -1.9) d.y = -0.1
      dummy.current.position.set(d.x, d.y, d.z)
      dummy.current.updateMatrix()
      mesh.setMatrixAt(i, dummy.current.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (flash.current) {
      const t = clock.elapsedTime % 3.7
      const lit = stormy && (t < 0.06 || (t > 0.14 && t < 0.18))
      flash.current.intensity = lit ? 5 : 0
      if (bolt.current) bolt.current.visible = lit || (t > 0.06 && t < 0.3)
    }
  })
  const puffs: [Vec3, number][] = [
    [[0, 0, 0], 0.26],
    [[0.24, -0.04, 0.05], 0.2],
    [[-0.25, -0.05, -0.03], 0.21],
    [[0.1, 0.12, -0.06], 0.2],
    [[-0.1, 0.08, 0.1], 0.18],
    [[0.38, -0.08, -0.05], 0.13],
    // fill out the back and the far end, so it's round from every side
    [[0.06, 0.03, -0.12], 0.18],
    [[-0.2, 0.04, 0.13], 0.16],
    [[-0.42, -0.08, 0.04], 0.12],
  ]
  return (
    <>
      {/* a flattened base, so it has the flat underside of a cartoon cloud rather than a bunch of balloons */}
      <mesh position={[0, -0.1, 0]} scale={[0.5, 0.11, 0.27]} castShadow userData={{ paint: true }}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial
          color={stormy ? '#5c5f6b' : '#f4f6fb'}
          emissive={stormy ? '#1d1f2a' : '#8ea6c8'}
          emissiveIntensity={0.25}
          roughness={1}
        />
      </mesh>
      {stormy && (
        <mesh ref={bolt} geometry={BOLT} position={[0.06, -0.16, 0.06]} visible={false}>
          <meshBasicMaterial color="#fff36b" toneMapped={false} />
        </mesh>
      )}
      {puffs.map(([at, r], i) => (
        <mesh key={i} position={at} castShadow userData={{ paint: true }}>
          <sphereGeometry args={[r, 24, 16]} />
          <meshStandardMaterial
            color={stormy ? '#5c5f6b' : '#f4f6fb'}
            emissive={stormy ? '#1d1f2a' : '#8ea6c8'}
            emissiveIntensity={0.25}
            roughness={1}
          />
        </mesh>
      ))}
      <instancedMesh ref={rain} args={[undefined, undefined, drops]}>
        <cylinderGeometry args={[0.004, 0.004, 0.1, 4]} />
        <meshBasicMaterial color="#a8d8ff" transparent opacity={0.7} />
      </instancedMesh>
      <pointLight ref={flash} position={[0, -0.3, 0.2]} intensity={0} distance={5} decay={1.5} color="#dfe8ff" />
    </>
  )
}

// ---------------------------------------------------------------------------
// Goldfish swimming circles round the pendant lamp, in mid-air.
// ---------------------------------------------------------------------------

export function AirFish({ count, radius = 0.9 }: { count: number; radius?: number }) {
  const school = useRef<Group>(null)
  const fish = useMemo(() => {
    const rng = mulberry32(count)
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * PI * 2,
      r: radius + (rng() - 0.5) * 0.35,
      y: (rng() - 0.5) * 0.3,
      phase: rng() * 6,
      colour: new Color().setHSL(0.04 + rng() * 0.06, 0.95, 0.55),
    }))
  }, [count, radius])
  useFrame(({ clock }) => {
    if (!school.current) return
    const t = clock.elapsedTime
    school.current.rotation.y = -t * 0.45
    school.current.children.forEach((f, i) => {
      const d = fish[i]
      f.position.y = d.y + Math.sin(t * 1.3 + d.phase) * 0.05
      const tail = f.children[1]
      if (tail) tail.rotation.y = Math.sin(t * 9 + d.phase) * 0.5
    })
  })
  return (
    <group ref={school}>
      {fish.map((f, i) => (
        <group key={i} position={[Math.cos(f.angle) * f.r, f.y, Math.sin(f.angle) * f.r]} rotation={[0, -f.angle, 0]}>
          <mesh scale={[0.05, 0.055, 0.12]} castShadow userData={{ paint: true }}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color={f.colour} roughness={0.35} metalness={0.2} />
          </mesh>
          <group position={[0, 0, -0.11]}>
            <mesh geometry={GOLDFISH.tail} userData={{ paint: true }}>
              <meshStandardMaterial color={f.colour} roughness={0.35} side={DoubleSide} transparent opacity={0.9} />
            </mesh>
          </group>
          <mesh position={[0.03, 0.015, 0.075]}>
            <sphereGeometry args={[0.009, 8, 6]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          <mesh position={[-0.03, 0.015, 0.075]}>
            <sphereGeometry args={[0.009, 8, 6]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          <mesh geometry={GOLDFISH.dorsal} position={[0, 0.048, -0.005]}>
            <meshStandardMaterial color={f.colour} roughness={0.35} side={DoubleSide} transparent opacity={0.85} />
          </mesh>
          {[1, -1].map((side) => (
            <group key={side} position={[side * 0.04, -0.02, 0.035]} rotation={[0, 0, side * -0.6]} scale={[side, 1, 1]}>
              <mesh geometry={GOLDFISH.pectoral}>
                <meshStandardMaterial color={f.colour} roughness={0.35} side={DoubleSide} transparent opacity={0.85} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Small helpers for animated variants
// ---------------------------------------------------------------------------

/** Children bob gently in the air at `height`. */
export function Hover({ height, children }: { height: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = height + Math.sin(t * 1.4) * 0.04
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.03
  })
  return <group ref={ref}>{children}</group>
}

/** Turns its +z side towards the player every frame. */
export function FacesYou({ position, children }: { position: Vec3; children: ReactNode }) {
  const ref = useRef<Group>(null)
  const target = useRef(new Vector3())
  useFrame(({ camera }) => ref.current?.lookAt(target.current.copy(camera.position)))
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Tiger-skin rug
// ---------------------------------------------------------------------------

function tailTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 16
  const g = c.getContext('2d')!
  g.fillStyle = '#e8892b'
  g.fillRect(0, 0, 256, 16)
  g.fillStyle = '#1a1410'
  for (let i = 0; i < 9; i++) g.fillRect(14 + i * 27, 0, 9 + (i % 3) * 2, 16)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/**
 * A tiger's tail poking out from under the rug and curling across the floor.
 * It lies still, then flicks every few seconds. Built from the tail's root
 * along +x.
 */
/**
 * The rug's top for the tiger swap: the same rug, lifted into a long low
 * mound where something big is lying underneath it, rising to the edge the
 * tail comes out of. Rug-local: the rug is 2.6 × 1.7, the tail leaves its +x
 * edge at z = `tailZ`.
 */
function tigerRugGeometry(tailZ: number) {
  const g = new PlaneGeometry(2.6, 1.7, 130, 68).rotateX(-PI / 2)
  const pos = g.attributes.position
  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    // a broad, low hump past the end of the coffee table...
    const body = 0.07 * smooth(0.62, 0.92, x) * (1 - smooth(1.08, 1.3, x)) * Math.exp(-(((z - tailZ) / 0.32) ** 2))
    // ...narrowing to a ridge over the tail that lifts the rug's edge
    const tail = 0.05 * smooth(0.8, 1.2, x) * Math.exp(-(((z - tailZ) / 0.07) ** 2))
    pos.setY(i, Math.max(body, tail))
  }
  g.computeVertexNormals()
  return g
}

/** Where the tail comes out from under the rug, across the rug's width. */
const TIGER_Z = 0.3
const TIGER_RUG = tigerRugGeometry(TIGER_Z)

/**
 * The tiger swap's extras for the rug (rug-local): the rug's top humped over
 * whatever is lying under it, and the tail coming out from under the lifted
 * edge. Lies just over the usual flat rug, which stays underneath for its edges.
 */
export function TigerRug({ surface }: { surface: Surface }) {
  return (
    <>
      <mesh geometry={TIGER_RUG} position={[0, 0.0115, 0]} receiveShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#ffffff" roughness={1} side={DoubleSide} {...surface} />
      </mesh>
      <group position={[1.16, 0, TIGER_Z]}>
        <TigerTail />
      </group>
    </>
  )
}

function TigerTail() {
  const { geometry, map } = useMemo(() => {
    // resting on the floor all the way along (its radius is 0.026)
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0.026, 0),
      new Vector3(0.22, 0.026, 0.03),
      new Vector3(0.42, 0.026, 0.14),
      new Vector3(0.5, 0.026, 0.32),
      new Vector3(0.4, 0.026, 0.44),
    ])
    return { geometry: new TubeGeometry(curve, 48, 0.026, 12, false), map: tailTexture() }
  }, [])
  const tail = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (tail.current) tail.current.rotation.y = Math.max(0, Math.sin(clock.elapsedTime * 0.9)) ** 8 * 0.35
  })
  return (
    <group ref={tail}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
      {/* black tip */}
      <mesh position={[0.4, 0.029, 0.44]}>
        <sphereGeometry args={[0.029, 16, 12]} />
        <meshStandardMaterial color="#1a1410" roughness={0.9} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// A melted clock, drooping down the wall
// ---------------------------------------------------------------------------

function clockFaceTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#f7f3ea'
  g.fillRect(0, 0, 512, 512)
  g.translate(256, 256)
  g.fillStyle = '#2b2622'
  g.font = 'bold 60px Georgia, serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  for (let h = 1; h <= 12; h++) {
    const a = (h / 12) * PI * 2
    g.fillText(String(h), Math.sin(a) * 190, -Math.cos(a) * 190)
  }
  g.lineCap = 'round'
  g.strokeStyle = '#2b2622'
  g.lineWidth = 14
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(Math.sin(1.1) * 110, -Math.cos(1.1) * 110)
  g.stroke()
  g.lineWidth = 9
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(Math.sin(4.4) * 160, -Math.cos(4.4) * 160)
  g.stroke()
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/**
 * Where a point of the clock ends up once it has melted: the lower half
 * stretches downwards into drips. `size` sets how far it sags. Everything
 * on the clock goes through the same mapping, so its parts stay lined up.
 */
function meltPoint(x: number, y: number, size: number): [number, number] {
  const t = Math.max(0, -y / size)
  return [x * (1 - 0.18 * t), y - size * 1.1 * t * t * (1 + 0.5 * Math.sin(x * 38))]
}

function melt(g: RingGeometry, size: number) {
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setXY(i, ...meltPoint(pos.getX(i), pos.getY(i), size))
  g.computeVertexNormals()
  return g
}

/** The melted case's outer wall: a band `depth` deep running round the melted rim of a disc of `radius`. */
function meltedBand(radius: number, size: number, depth: number) {
  const n = 128
  const positions: number[] = []
  const index: number[] = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * PI * 2
    const [x, y] = meltPoint(Math.cos(a) * radius, Math.sin(a) * radius, size)
    positions.push(x, y, 0, x, y, depth)
    if (i < n) {
      const k = i * 2
      index.push(k, k + 2, k + 1, k + 1, k + 2, k + 3)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

export function MeltedClock({ radius = 0.17 }: { radius?: number }) {
  const { face, back, band, lip, map } = useMemo(() => {
    const outer = radius * 1.09
    return {
      face: melt(new RingGeometry(0.0001, radius, 64, 24), outer),
      back: melt(new RingGeometry(0.0001, outer, 64, 24), outer),
      // the case: a wall round the edge and a rolled lip over the face's rim
      band: meltedBand(outer, outer, 0.028),
      lip: melt(new RingGeometry(radius * 0.97, outer, 96, 4), outer),
      map: clockFaceTexture(),
    }
  }, [radius])
  return (
    <group rotation={[0, 0, 0.12]}>
      <mesh geometry={back} position={[0, 0, 0.004]} userData={{ paint: true }}>
        <meshStandardMaterial color="#b9a17a" metalness={0.6} roughness={0.35} side={DoubleSide} />
      </mesh>
      <mesh geometry={band} position={[0, 0, 0.004]} userData={{ paint: true }}>
        <meshStandardMaterial color="#b9a17a" metalness={0.6} roughness={0.35} side={DoubleSide} />
      </mesh>
      <mesh geometry={face} position={[0, 0, 0.022]}>
        <meshStandardMaterial map={map} roughness={0.5} side={DoubleSide} />
      </mesh>
      <mesh geometry={lip} position={[0, 0, 0.032]} userData={{ paint: true }}>
        <meshStandardMaterial color="#b9a17a" metalness={0.6} roughness={0.35} side={DoubleSide} />
      </mesh>
      {/* the pin the hands turn on */}
      <mesh position={[0, 0, 0.026]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.008, 16]} />
        <meshStandardMaterial color="#2b2622" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Book lying open with a page that keeps turning
// ---------------------------------------------------------------------------

/** A page of print: a heading and ragged lines of grey "text". */
function pageTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 180
  const g = c.getContext('2d')!
  g.fillStyle = '#f6f0e0'
  g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = '#6d6455'
  g.fillRect(28, 18, 110, 9)
  const rng = mulberry32(5)
  for (let y = 40; y < 166; y += 10) g.fillRect(28, y, 150 + rng() * 50, 4)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

export function OpenBook({ colour }: { colour: string }) {
  const page = useRef<Group>(null)
  const print = useMemo(() => pageTexture(), [])
  useFrame(({ clock }) => {
    if (!page.current) return
    // turn a page every 2.5 seconds: it lifts off the right-hand pages and lands on the left
    const t = (clock.elapsedTime % 2.5) / 2.5
    page.current.rotation.z = 0.1 + Math.min(1, t * 1.6) * (PI - 0.2)
  })
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} rotation={[0, 0, s * 0.08]}>
          <Block size={[0.24, 0.006, 0.17]} position={[s * 0.12, 0.003, 0]} color={colour} roughness={0.6} radius={0.002} paint />
          <Block size={[0.225, 0.016, 0.16]} position={[s * 0.115, 0.013, 0]} color="#f1ead8" roughness={0.9} radius={0.002} />
          {/* the printed page on top of each side */}
          <mesh position={[s * 0.115, 0.0215, 0]} rotation={[-PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 0.145]} />
            <meshStandardMaterial map={print} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <group ref={page} position={[0, 0.023, 0]}>
        <mesh position={[0.11, 0, 0]} rotation={[-PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 0.155]} />
          <meshStandardMaterial map={print} roughness={0.9} side={DoubleSide} />
        </mesh>
      </group>
    </>
  )
}

/** Coffee spilled across the table from a knocked-over mug. */
export function CoffeePuddle() {
  return (
    <group position={[-0.11, 0.0015, 0.02]} rotation={[-PI / 2, 0, 0.3]}>
      <mesh geometry={PUDDLE}>
        <meshStandardMaterial color="#2e1a0e" roughness={0.05} />
      </mesh>
      {/* a few splashes flicked out past the edge */}
      {(
        [
          [-0.15, 0.03, 0.009],
          [-0.17, -0.025, 0.006],
          [-0.12, 0.07, 0.007],
        ] as const
      ).map(([x, y, r]) => (
        <mesh key={x} position={[x, y, 0]}>
          <circleGeometry args={[r, 16]} />
          <meshStandardMaterial color="#2e1a0e" roughness={0.05} />
        </mesh>
      ))}
    </group>
  )
}

/** A spill's outline: a long blob with a lumpy edge, wider at the mug's end. */
const PUDDLE = (() => {
  const shape = new Shape()
  const n = 28
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * PI * 2
    const lump = 1 + 0.12 * Math.sin(a * 5 + 0.6) + 0.07 * Math.sin(a * 9 + 2)
    // wider towards +x, where the mug is
    const rx = 0.12 * lump
    const ry = (0.055 + 0.018 * Math.cos(a)) * lump
    const x = Math.cos(a) * rx
    const y = Math.sin(a) * ry
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  return new ShapeGeometry(shape)
})()

// ---------------------------------------------------------------------------
// A shark circling with the goldfish
// ---------------------------------------------------------------------------

export function Shark({ radius = 1.35 }: { radius?: number }) {
  const orbit = useRef<Group>(null)
  const tail = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (orbit.current) orbit.current.rotation.y = -t * 0.32 + 1.5
    // a slow side-to-side sweep of the tail, as a shark swims
    if (tail.current) tail.current.rotation.y = Math.sin(t * 3.2) * 0.3
  })
  const fin = <meshStandardMaterial color="#6f7d88" roughness={0.5} side={DoubleSide} />
  return (
    <group ref={orbit}>
      {/* head (+z) along its direction of travel round the circle, same as the goldfish */}
      <group position={[radius, 0.1, 0]}>
        <mesh geometry={SHARK.body} castShadow userData={{ paint: true }}>
          <meshStandardMaterial vertexColors roughness={0.45} />
        </mesh>
        <mesh geometry={SHARK.dorsal} position={[0, 0.085, -0.02]}>
          {fin}
        </mesh>
        {/* side fins, angled down and back from low on each flank */}
        {[1, -1].map((side) => (
          <group key={side} position={[side * 0.06, -0.045, 0.14]} rotation={[0, 0, side * -0.5]} scale={[side, 1, 1]}>
            <mesh geometry={SHARK.pectoral}>{fin}</mesh>
          </group>
        ))}
        {/* the tail swings from where the body narrows */}
        <group ref={tail} position={[0, 0, -0.42]}>
          <mesh geometry={SHARK.tail} position={[0, 0, -0.01]}>
            {fin}
          </mesh>
        </group>
        {[-0.048, 0.048].map((x) => (
          <mesh key={x} position={[x, 0.022, 0.31]}>
            <sphereGeometry args={[0.011, 10, 8]} />
            <meshBasicMaterial color="#000" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Glowing flowers for the plant
// ---------------------------------------------------------------------------

const FLOWER_SPOTS: [Vec3, string][] = [
  [[0.18, 1.18, 0.12], '#ff4fd8'],
  [[-0.15, 1.05, 0.2], '#b6ff3d'],
  [[0.05, 1.32, -0.1], '#3dfcff'],
  [[-0.22, 0.9, -0.12], '#ff4fd8'],
  [[0.25, 0.85, -0.05], '#ffde21'],
  [[0.0, 0.98, 0.26], '#ff8a1f'],
  [[-0.05, 1.25, 0.15], '#ffde21'],
]

/**
 * Each flower faces out and a little up from the middle of the plant, on a
 * stem that runs back in and down into the foliage, so none of them hang in
 * the air on their own.
 */
const FLOWERS = FLOWER_SPOTS.map(([at, colour]) => {
  const head = new Vector3(...at)
  const out = new Vector3(at[0], 0, at[2]).normalize()
  const facing = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), out.clone().multiplyScalar(0.8).setY(0.6).normalize())
  // the stem starts just behind the flower head and ends deep in the plant
  const root = new Vector3(at[0] * 0.3, at[1] - 0.26, at[2] * 0.3)
  const tip = head.clone().addScaledVector(out, -0.02)
  const stem = tip.clone().sub(root)
  return {
    at,
    colour,
    facing: new Euler().setFromQuaternion(facing),
    stem: {
      at: root.clone().add(tip).multiplyScalar(0.5).toArray() as Vec3,
      length: stem.length(),
      rot: new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), stem.normalize())),
    },
  }
})
const STEM = new CylinderGeometry(0.006, 0.009, 1, 8)

export function GlowingFlowers() {
  return (
    <>
      {FLOWERS.map((f, i) => (
        <group key={i}>
          <mesh geometry={STEM} position={f.stem.at} rotation={f.stem.rot} scale={[1, f.stem.length, 1]}>
            <meshStandardMaterial color="#3f8a3a" roughness={0.7} />
          </mesh>
          <group position={f.at} rotation={f.facing}>
            {[0, 1, 2, 3, 4].map((p) => (
              <mesh key={p} position={[Math.cos((p / 5) * PI * 2) * 0.055, 0, Math.sin((p / 5) * PI * 2) * 0.055]} scale={[1, 0.45, 1]}>
                <sphereGeometry args={[0.048, 16, 10]} />
                <meshStandardMaterial color={f.colour} emissive={f.colour} emissiveIntensity={1.6} roughness={0.4} />
              </mesh>
            ))}
            <mesh position={[0, 0.012, 0]} scale={[1, 0.7, 1]}>
              <sphereGeometry args={[0.032, 14, 10]} />
              <meshStandardMaterial color="#fff6c2" emissive="#fff6c2" emissiveIntensity={1.5} />
            </mesh>
          </group>
        </group>
      ))}
      <pointLight position={[0, 1.1, 0.3]} intensity={0.9} distance={2.5} decay={2} color="#ff9ae6" />
    </>
  )
}

// ---------------------------------------------------------------------------
// The impossible staircase: flights on the floor, up the wall and across the
// ceiling, each with its own idea of which way is down (after Escher's
// "Relativity"). Built in world space along the front wall.
// ---------------------------------------------------------------------------

const RUN = 0.2
const RISE = 0.17
const DEPTH = 0.32
const STEPS = 6
const STAIR_Z = 2.78
const TOP = STEPS * RISE

/** A smooth wedge the size of a flight: the steps, smoothed into a ramp. */
const RAMP = (() => {
  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.lineTo(STEPS * RUN, 0)
  shape.lineTo(STEPS * RUN, TOP)
  shape.closePath()
  const g = new ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false })
  g.translate(0, 0, -DEPTH / 2)
  return g
})()

/**
 * A flight as one solid with a stepped side, so it has no seams between the
 * steps. The outline is drawn inset by the bevel, which grows it back out to
 * exactly STEPS * RUN long and TOP high, with softened edges.
 */
const FLIGHT = (() => {
  const b = 0.008
  const shape = new Shape()
  shape.moveTo(b, b)
  shape.lineTo(STEPS * RUN - b, b)
  shape.lineTo(STEPS * RUN - b, TOP - b)
  for (let i = STEPS - 1; i >= 0; i--) {
    shape.lineTo(i * RUN + b, (i + 1) * RISE - b)
    if (i > 0) shape.lineTo(i * RUN + b, i * RISE - b)
  }
  const g = new ExtrudeGeometry(shape, { depth: DEPTH - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 1 })
  g.translate(0, 0, -DEPTH / 2 + b)
  return g
})()

/** A red stair runner down the middle of every flight, held at the foot of each riser by a brass rod. */
const RUNNER_WIDTH = 0.18
const RUNNER_TREAD = new BoxGeometry(RUN + 0.004, 0.008, RUNNER_WIDTH)
const RUNNER_RISER = new BoxGeometry(0.008, RISE, RUNNER_WIDTH)
const STAIR_ROD = new CylinderGeometry(0.006, 0.006, RUNNER_WIDTH + 0.04, 10).rotateX(PI / 2)
const RUNNER_CLOTH = new MeshStandardMaterial({ color: '#c8324a', roughness: 0.95 })
const ROD_BRASS = new MeshStandardMaterial({ color: '#d4ac5a', metalness: 0.85, roughness: 0.3 })
const STEP_INDEX = Array.from({ length: STEPS }, (_, i) => i)
const TREADS: Placement[] = STEP_INDEX.map((i) => ({ at: [(i + 0.5) * RUN - 0.002, (i + 1) * RISE + 0.004, 0] }))
const RISERS: Placement[] = STEP_INDEX.map((i) => ({ at: [i * RUN - 0.004, i * RISE + RISE / 2 + 0.004, 0] }))
const RODS: Placement[] = STEP_INDEX.map((i) => ({ at: [i * RUN - 0.012, i * RISE + 0.012, 0] }))

/** One flight in its own frame: climbs along +x, its floor is the y = 0 plane. */
function Flight({ position, rotation, colour, ramp = false }: { position: Vec3; rotation?: Vec3; colour: string; ramp?: boolean }) {
  if (ramp)
    return (
      <mesh geometry={RAMP} position={position} rotation={rotation} castShadow receiveShadow>
        <meshStandardMaterial color={colour} roughness={0.6} />
      </mesh>
    )
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={FLIGHT} castShadow receiveShadow userData={{ paint: true }}>
        <meshStandardMaterial color={colour} roughness={0.6} />
      </mesh>
      <Instanced geometry={RUNNER_TREAD} material={RUNNER_CLOTH} items={TREADS} />
      <Instanced geometry={RUNNER_RISER} material={RUNNER_CLOTH} items={RISERS} />
      <Instanced geometry={STAIR_ROD} material={ROD_BRASS} items={RODS} />
    </group>
  )
}

function StairFlights({ extra = false, ramp = false }: { extra?: boolean; ramp?: boolean }) {
  const c = '#efe6d6'
  return (
    <>
      {/* on the floor, climbing to the right */}
      <Flight position={[1.15, 0, STAIR_Z]} colour={c} ramp={ramp} />
      <Block size={[0.35, TOP, DEPTH]} position={[2.525, TOP / 2, STAIR_Z]} color={c} roughness={0.6} radius={0.008} paint />
      {!ramp && <Block size={[0.35, 0.008, RUNNER_WIDTH]} position={[2.525, TOP + 0.004, STAIR_Z]} color="#c8324a" roughness={0.95} radius={0.003} />}
      {/* up the wall: its floor is the vertical plane x = 2.7 */}
      <Flight position={[2.7, TOP, STAIR_Z]} rotation={[0, 0, PI / 2]} colour={c} ramp={ramp} />
      {/* across the ceiling, upside down, heading back left */}
      <Flight position={[1.68, 2.7, STAIR_Z]} rotation={[0, 0, PI]} colour={c} ramp={ramp} />
      {/* and, if it grows one, down the other side sideways again */}
      {extra && <Flight position={[0.48, 2.7, STAIR_Z]} rotation={[0, 0, -PI / 2]} colour={c} />}
    </>
  )
}

/** A tiny figure climbing the floor flight, forever. */
function Climber() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * 1.6
    const step = Math.floor(t) % STEPS
    const hop = Math.sin((t % 1) * PI) * 0.05
    ref.current.position.set(1.15 + (step + 0.5) * RUN, (step + 1) * RISE + hop, STAIR_Z)
  })
  return (
    <group ref={ref}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <capsuleGeometry args={[0.025, 0.07, 6, 12]} />
        <meshStandardMaterial color="#ff3131" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.028, 16, 12]} />
        <meshStandardMaterial color="#f2c9a0" roughness={0.6} />
      </mesh>
    </group>
  )
}

export function ImpossibleStairs({ variant }: { variant: 'default' | 'reverse' | 'more' | 'walker' | 'sloped' }) {
  if (variant === 'reverse') {
    // mirrored about x = 1.7, so it climbs the other way in the same spot
    return (
      <group position={[3.4, 0, 0]} scale={[-1, 1, 1]}>
        <StairFlights />
      </group>
    )
  }
  return (
    <>
      <StairFlights extra={variant === 'more'} ramp={variant === 'sloped'} />
      {variant === 'walker' && <Climber />}
    </>
  )
}
