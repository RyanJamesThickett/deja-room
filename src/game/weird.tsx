import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  Color,
  LatheGeometry,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Group,
  type Mesh,
} from 'three'
import { ALIEN_SKY, alienLayers } from './alienOutside'
import type { Vec3 } from './mutations'
import { Outside } from './outside'
import { layerGeometry, layerOrder } from './outsideLayers'

/*
 * The strange things in the room. Each is a ShaderMaterial with a `uTime`
 * uniform (animated here) and, where it can be recoloured, a `uColor`
 * uniform that the recolour mutation knows how to set.
 */

const OUTPUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`

const HUE = /* glsl */ `
  vec3 hue(float h) { return 0.5 + 0.5 * cos(6.28318 * (h + vec3(0.0, 0.33, 0.67))); }
`

function shader(vertexShader: string, fragmentShader: string, uniforms: Record<string, unknown>, extra = {}) {
  const u: Record<string, { value: unknown }> = { uTime: { value: 0 } }
  for (const [k, v] of Object.entries(uniforms)) u[k] = { value: v }
  return new ShaderMaterial({ vertexShader, fragmentShader, uniforms: u, ...extra })
}

/** A mesh whose (possibly swapped-out, recoloured) shader material gets the clock every frame. */
function Animated({
  geometry,
  material,
  position,
  rotation,
  paint,
  name,
  visible,
  renderOrder,
}: {
  geometry: BufferGeometry
  material: ShaderMaterial
  position?: Vec3
  rotation?: Vec3
  paint?: boolean
  name?: string
  visible?: boolean
  renderOrder?: number
}) {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const m = ref.current?.material as ShaderMaterial | undefined
    if (m?.uniforms?.uTime) m.uniforms.uTime.value = clock.elapsedTime
  })
  return (
    <mesh
      ref={ref}
      name={name}
      visible={visible}
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      renderOrder={renderOrder}
      userData={{ paint }}
    />
  )
}

// ---------------------------------------------------------------------------
// Jelly tube: glass pipe out of the wall, across the ceiling, glowing goo
// pulsing through it.
// ---------------------------------------------------------------------------

const GOO_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uLength;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vBlob;
  float blob(float s, float a) {
    return sin(s * 5.0) + 0.6 * sin(s * 11.0 + a) + 0.4 * sin(s * 2.3);
  }
  void main() {
    vUv = uv;
    float s = uv.x * uLength - uTime * uSpeed;
    vBlob = blob(s, uv.y * 6.28318);
    vec3 p = position + normal * smoothstep(0.3, 1.2, vBlob) * 0.018;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const GOO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vBlob;
  void main() {
    float m = smoothstep(0.1, 0.9, vBlob);
    float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.0);
    vec3 col = mix(uColor * 0.25, uColor * 1.6 + 0.15, m) + rim * 0.6 * uColor;
    gl_FragColor = vec4(col, 1.0);
    ${OUTPUT}
  }
`

function Collar({ at, towards }: { at: Vector3; towards: Vector3 }) {
  const quaternion = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), towards.clone().normalize()),
    [towards],
  )
  return (
    <mesh position={at} quaternion={quaternion}>
      <cylinderGeometry args={[0.1, 0.1, 0.06, 32]} />
      <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.3} />
    </mesh>
  )
}

/** Glass pipe with glowing jelly pulsing through it along `route`. */
export function JellyTube({ route, speed = 1.2 }: { route: Vec3[]; speed?: number }) {
  const { glass, goo, length, ends } = useMemo(() => {
    const curve = new CatmullRomCurve3(route.map((p) => new Vector3(...p)))
    return {
      glass: new TubeGeometry(curve, 400, 0.07, 24, false),
      goo: new TubeGeometry(curve, 500, 0.048, 20, false),
      length: curve.getLength(),
      ends: [
        { at: curve.getPoint(0.002), towards: curve.getTangent(0) },
        { at: curve.getPoint(0.998), towards: curve.getTangent(1) },
      ],
    }
  }, [route])
  const flow = useMemo(
    () => shader(GOO_VERT, GOO_FRAG, { uColor: new Color('#7dff3a'), uSpeed: speed, uLength: length * 3 }),
    [length, speed],
  )
  return (
    <>
      <mesh geometry={glass} renderOrder={2}>
        <meshPhysicalMaterial
          color="#e8fbff"
          transparent
          opacity={0.22}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>
      {/* brass collars where it goes into the wall, floor or ceiling */}
      {ends.map((e, i) => (
        <Collar key={i} at={e.at} towards={e.towards} />
      ))}
      <Animated geometry={goo} material={flow} paint />
    </>
  )
}

// ---------------------------------------------------------------------------
// Living picture: a gilt frame whose picture never stops moving.
// ---------------------------------------------------------------------------

const PICTURE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const PICTURE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uMode;
  varying vec2 vUv;
  ${HUE}
  void main() {
    float t = uTime * 0.25;
    vec3 col;
    if (uMode < 0.5) {
      vec2 p = (vUv - 0.5) * vec2(1.5, 1.0);
      float a = atan(p.y, p.x) / 6.28318;
      float r = length(p);
      float swirl = a * 3.0 + r * 4.0 - t * 2.0 + sin(r * 18.0 - uTime) * 0.08;
      col = hue(swirl);
      col *= 0.75 + 0.25 * sin(r * 40.0 - uTime * 3.0);
    } else if (uMode < 1.5) {
      vec2 q = vUv * vec2(9.0, 6.0);
      q.x += sin(q.y * 0.9 + uTime * 1.6) * 0.7;
      q.y += cos(q.x * 0.7 + uTime * 1.1) * 0.5;
      float c = mod(floor(q.x) + floor(q.y), 2.0);
      col = mix(hue(t + vUv.x * 0.5), hue(t + 0.5 + vUv.y * 0.5), c);
    } else {
      // one enormous eye, looking around the room
      vec2 p = (vUv - 0.5) * vec2(1.5, 1.0);
      float blink = 1.0 - smoothstep(0.0, 0.12, 0.12 - abs(mod(uTime, 4.7) - 0.12));
      float lid = 0.34 * (1.0 - pow(p.x / 0.64, 2.0)) * blink;
      col = mix(vec3(0.93, 0.72, 0.62), vec3(0.75, 0.5, 0.45), smoothstep(0.0, 0.5, length(p)));
      if (abs(p.y) < lid) {
        vec2 look = vec2(sin(uTime * 0.6) * 0.14, cos(uTime * 0.45) * 0.05);
        float d = length(p - look);
        col = vec3(0.97, 0.95, 0.92);
        col = mix(col, hue(0.35 + d * 1.5 + t * 0.2) * 0.85, step(d, 0.17));
        col = mix(col, vec3(0.02), step(d, 0.075));
        col += 0.7 * step(length(p - look - vec2(0.045, 0.045)), 0.022);
      }
      col = mix(col, vec3(0.12, 0.05, 0.05), smoothstep(0.014, 0.0, abs(abs(p.y) - lid)) * step(abs(p.x), 0.64));
    }
    gl_FragColor = vec4(col, 1.0);
    ${OUTPUT}
  }
`

export function LivingPicture({ name }: { name: string }) {
  const [swirl, checker, eye] = useMemo(
    () => [0, 1, 2].map((mode) => shader(PICTURE_VERT, PICTURE_FRAG, { uMode: mode })),
    [],
  )
  const plane = useMemo(() => new PlaneGeometry(0.8, 0.52), [])
  return (
    <>
      <RoundedBox args={[0.96, 0.68, 0.05]} radius={0.012} smoothness={4} position={[0, 0, 0.025]} castShadow>
        <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.28} />
      </RoundedBox>
      <Animated name={`${name}:default`} geometry={plane} material={swirl} position={[0, 0, 0.052]} />
      <Animated name={`${name}:checker`} geometry={plane} material={checker} position={[0, 0, 0.052]} visible={false} />
      <Animated name={`${name}:eye`} geometry={plane} material={eye} position={[0, 0, 0.052]} visible={false} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Lava lamp
// ---------------------------------------------------------------------------

const LAVA_VERT = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const LAVA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBottom;
  uniform float uTop;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float field = 0.0;
    float span = uTop - uBottom - 0.06;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float speed = 0.05 + fi * 0.013;
      float y = uBottom + span * (0.5 + 0.5 * sin(uTime * speed * 6.28318 + fi * 1.9));
      vec3 c = vec3(sin(uTime * 0.4 + fi * 2.1) * 0.025, y, cos(uTime * 0.33 + fi) * 0.025);
      float r = 0.03 + 0.012 * sin(fi * 3.7);
      vec3 d = vPos - c;
      d.y *= 0.7;
      field += r * r / dot(d, d);
    }
    float blob = smoothstep(0.9, 1.4, field);
    vec3 liquid = vec3(0.18, 0.02, 0.28);
    vec3 col = mix(liquid, uColor * 1.5, blob);
    float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
    col += rim * 0.35;
    gl_FragColor = vec4(col, 1.0);
    ${OUTPUT}
  }
`

const LAVA_SHAPES = {
  // the classic bullet
  classic: {
    glass: [
      [0.0, 0.1],
      [0.045, 0.1],
      [0.06, 0.18],
      [0.068, 0.26],
      [0.055, 0.36],
      [0.03, 0.42],
      [0.0, 0.42],
    ],
    top: 0.42,
  },
  // a round fishbowl globe
  globe: {
    glass: Array.from({ length: 13 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 12) * Math.PI
      return [Math.cos(a) * 0.13, 0.22 + Math.sin(a) * 0.13]
    }),
    top: 0.35,
  },
  // a tall thin rocket
  rocket: {
    glass: [
      [0.0, 0.1],
      [0.04, 0.1],
      [0.048, 0.3],
      [0.045, 0.55],
      [0.025, 0.68],
      [0.0, 0.74],
    ],
    top: 0.74,
  },
} as const

export type LavaShape = keyof typeof LAVA_SHAPES

export function LavaLamp({ shape = 'classic' }: { shape?: LavaShape }) {
  const { glass, top } = useMemo(() => {
    const def = LAVA_SHAPES[shape]
    return { glass: new LatheGeometry(def.glass.map(([x, y]) => new Vector2(x, y)), 48), top: def.top }
  }, [shape])
  const base = useMemo(
    () =>
      new LatheGeometry(
        [
          [0.0, 0.0],
          [0.075, 0.0],
          [0.07, 0.02],
          [0.045, 0.1],
          [0.0, 0.1],
        ].map(([x, y]) => new Vector2(x, y)),
        48,
      ),
    [],
  )
  const lava = useMemo(
    () => shader(LAVA_VERT, LAVA_FRAG, { uColor: new Color('#ff6a1f'), uBottom: 0.1, uTop: top }),
    [top],
  )
  return (
    <>
      <mesh geometry={base} castShadow>
        <meshStandardMaterial color="#c0c4c8" metalness={0.9} roughness={0.25} />
      </mesh>
      {shape === 'classic' && (
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.03, 0.04, 32]} />
          <meshStandardMaterial color="#c0c4c8" metalness={0.9} roughness={0.25} />
        </mesh>
      )}
      <Animated geometry={glass} material={lava} paint />
      {shape === 'rocket' && (
        <>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, (i / 3) * Math.PI * 2, 0]}>
              <mesh position={[0.062, 0.2, 0]} rotation={[0, 0, -0.35]} castShadow>
                <boxGeometry args={[0.05, 0.13, 0.008]} />
                <meshStandardMaterial color="#ff3131" metalness={0.4} roughness={0.35} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.48, 0.046]}>
            <torusGeometry args={[0.02, 0.005, 10, 24]} />
            <meshStandardMaterial color="#c0c4c8" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.48, 0.045]}>
            <circleGeometry args={[0.02, 24]} />
            <meshStandardMaterial color="#9ffcff" emissive="#3dfcff" emissiveIntensity={0.6} roughness={0.1} />
          </mesh>
        </>
      )}
      <pointLight position={[0, top * 0.6, 0.1]} intensity={0.6} distance={1.5} decay={2} color="#ff7a3a" />
    </>
  )
}

// ---------------------------------------------------------------------------
// Floating orb over the coffee table
// ---------------------------------------------------------------------------

const ORB_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  ${HUE}
  void main() {
    float f = 1.0 - max(dot(vNormal, vView), 0.0);
    float bands = sin(vPos.y * 60.0 + uTime * 2.0 + sin(vPos.x * 40.0 + uTime) * 2.0);
    vec3 irid = hue(f * 1.5 + uTime * 0.1 + bands * 0.05);
    vec3 col = mix(uColor * 0.6, irid, pow(f, 1.4)) + pow(f, 4.0) * 0.8;
    col += uColor * 0.25 * (0.5 + 0.5 * bands);
    gl_FragColor = vec4(col, 1.0);
    ${OUTPUT}
  }
`

const SMALL_ORB = new SphereGeometry(0.065, 40, 28)

export function FloatingOrb({ shape = 'sphere' }: { shape?: 'sphere' | 'cube' | 'split' }) {
  const bob = useRef<Mesh>(null)
  const material = useMemo(() => shader(LAVA_VERT, ORB_FRAG, { uColor: new Color('#16d0ff') }), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!bob.current) return
    bob.current.position.y = Math.sin(t * 1.3) * 0.05
    bob.current.rotation.y = t * 0.4
    bob.current.rotation.x = shape === 'cube' ? t * 0.3 : 0
    const m = bob.current.material as ShaderMaterial
    if (m.uniforms?.uTime) m.uniforms.uTime.value = t
  })
  const trio = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (trio.current) trio.current.rotation.set(0.4, clock.elapsedTime * 1.4, 0)
  })
  if (shape === 'split') {
    return (
      <group ref={trio}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2
          return (
            <Animated key={i} geometry={SMALL_ORB} material={material} position={[Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17]} paint />
          )
        })}
      </group>
    )
  }
  return (
    <mesh ref={bob} material={material} userData={{ paint: true }}>
      {shape === 'sphere' ? <sphereGeometry args={[0.12, 64, 48]} /> : <boxGeometry args={[0.2, 0.2, 0.2, 8, 8, 8]} />}
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// The view out of the window: an alien dusk with two moons.
// ---------------------------------------------------------------------------

const SKY_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }
  float disc(vec2 p, vec2 c, float r) { return smoothstep(r, r - 0.006, length(p - c)); }
  void main() {
    vec2 p = vUv * vec2(1.4, 1.1);
    vec3 col = mix(vec3(1.0, 0.45, 0.62), vec3(0.12, 0.85, 0.82), smoothstep(0.0, 1.1, p.y));
    col = mix(col, vec3(0.2, 0.1, 0.45), smoothstep(0.7, 1.1, p.y));
    float stars = step(0.997, hash(floor(p * 220.0))) * smoothstep(0.6, 1.0, p.y);
    col += stars;
    col = mix(col, vec3(1.0, 0.95, 0.7), disc(p, vec2(0.45, 0.78), 0.11));
    col = mix(col, vec3(0.75, 1.0, 0.95), disc(p, vec2(0.95, 0.62), 0.05));
    float clouds = fbm(vec2(p.x * 3.0 + uTime * 0.03, p.y * 6.0));
    col = mix(col, vec3(1.0, 0.8, 0.9), smoothstep(0.55, 0.8, clouds) * 0.6 * max(0.0, 1.0 - p.y));
    // a far-off ridge of hills
    float ridge = 0.18 + 0.06 * fbm(vec2(p.x * 2.5, 1.0)) ;
    col = mix(col, vec3(0.16, 0.05, 0.22), step(p.y, ridge));
    gl_FragColor = vec4(col, 1.0);
    ${OUTPUT}
  }
`

/**
 * The window's view, in depth: this sky far off (it carries on past the old
 * picture's edges), then hills, ground and plants in front of it, behind a
 * real hole in the wall. `y`: how high the window's middle is.
 */
export function AlienSky({ size, y }: { size: [number, number]; y: number }) {
  const material = useMemo(() => shader(PICTURE_VERT, SKY_FRAG, {}, { toneMapped: false, transparent: true, depthWrite: false }), [])
  const plane = useMemo(() => layerGeometry(ALIEN_SKY, -y, {})!, [y])
  return (
    <>
      <Animated geometry={plane} material={material} renderOrder={layerOrder(ALIEN_SKY)} />
      <Outside layers={alienLayers()} y={y} />
      {/* glass sheen */}
      <mesh position={[0, 0, 0.005]} renderOrder={2}>
        <planeGeometry args={size} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.06} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
    </>
  )
}
