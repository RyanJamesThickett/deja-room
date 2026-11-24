import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BackSide,
  Box3,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  type Group,
  type Mesh,
  type Points,
} from 'three'
import type { Vec3 } from '../../mutations'
import { mulberry32 } from '../../rng'
import { BRIDGE_X, SPACESHIP_BOUNDS } from './bounds'
import { useWhaleTexture } from './textures'

/*
 * Space, seen only through real holes in the hull (the viewport and the
 * airlock): everything here stands well outside the ship and the walls hide
 * it everywhere else.
 *
 * Three depths. The sky (tiny dense stars and a nebula band) rides along with
 * the camera, so it is infinitely far away and never shifts. Clouds of
 * brighter stars and dust sit 10 to 90 m out, so walking past a window they
 * slide against the sky, the near ones fastest. Things to look at (a planet,
 * a black hole, a moon) stand 60 to 140 m out, big enough to read.
 */

const OUTPUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`

/** Moves a shader's clock on, through the object drawing it. */
function tick(o: Mesh | Points, t: number) {
  const m = o.material as ShaderMaterial
  if (m.uniforms?.uTime) m.uniforms.uTime.value = t
}

/** Inside the camera's far plane (200 m), well outside everything else. */
const SKY_RADIUS = 160

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vDir;
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise3(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm3(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
    return v;
  }
  // one star per lit cell of a 3D grid, where the view direction passes near it
  vec3 stars(vec3 d, float scale, float keep, float size, float twinkle) {
    vec3 p = d * scale;
    vec3 id = floor(p);
    float h = hash3(id);
    if (h > keep) return vec3(0.0);
    vec3 c = vec3(hash3(id + 11.1), hash3(id + 23.7), hash3(id + 37.3)) * 0.5 + 0.25;
    float b = smoothstep(size, 0.0, length(fract(p) - c));
    vec3 tint = mix(vec3(1.0, 0.82, 0.62), vec3(0.72, 0.82, 1.0), hash3(id + 5.0));
    float tw = 1.0 - twinkle + twinkle * sin(uTime * (1.5 + h * 9.0) + h * 80.0);
    return tint * b * (0.35 + 0.65 * hash3(id + 3.3)) * tw;
  }
  void main() {
    vec3 d = normalize(vDir);
    // the galaxy's plane, tilted across the sky
    float band = exp(-pow(dot(d, normalize(vec3(0.25, 1.0, 0.18))), 2.0) * 10.0);
    vec3 col = vec3(0.003, 0.004, 0.012);
    float n = fbm3(d * 2.6);
    float m = fbm3(d * 5.5 + 3.0);
    col += vec3(0.32, 0.07, 0.42) * pow(n, 2.6) * (0.1 + band) * 0.6;
    col += vec3(0.04, 0.2, 0.42) * pow(m, 3.0) * (0.05 + band) * 0.6;
    col += vec3(0.9, 0.75, 0.6) * pow(fbm3(d * 9.0), 3.0) * band * 0.25;
    // dark dust lanes
    col *= 1.0 - 0.7 * smoothstep(0.52, 0.72, fbm3(d * 6.0 + 9.0)) * band;
    col += stars(d, 320.0, 0.45 + band * 0.4, 0.32, 0.0) * 0.55;
    col += stars(d, 170.0, 0.25 + band * 0.2, 0.26, 0.25) * 0.9;
    col += stars(d, 80.0, 0.12, 0.2, 0.3) * 1.6;
    gl_FragColor = vec4(col, 1.0);
    ${OUTPUT}
  }
`

const skyGeometry = (() => {
  let g: SphereGeometry | undefined
  return () => (g ??= new SphereGeometry(SKY_RADIUS, 48, 24))
})()

/** The backdrop: infinitely far, because it moves with the camera. */
export function SpaceSky() {
  const ref = useRef<Mesh>(null)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: { uTime: { value: 0 } },
        side: BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  useFrame(({ camera, clock }) => {
    if (!ref.current) return
    ref.current.position.copy(camera.position)
    tick(ref.current, clock.elapsedTime)
  })
  return (
    // drawn first of all, so the ship's walls cover it everywhere but the openings
    <mesh ref={ref} geometry={skyGeometry()} material={material} renderOrder={-3000} frustumCulled={false} raycast={() => null} />
  )
}

// ---------------------------------------------------------------------------
// Stars and dust at real distances, for parallax
// ---------------------------------------------------------------------------

const DUST_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * 700.0 / -mv.z, 1.2, 16.0);
    vColor = aColor * (0.85 + 0.15 * sin(uTime * 1.7 + aPhase));
  }
`
const DUST_FRAG = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a);
    ${OUTPUT}
  }
`

/** Points scattered between `near` and `far` metres from the bridge, never within a few metres of the hull. */
function starCloud(count: number, near: number, far: number, size: [number, number], seed: number) {
  const rng = mulberry32(seed)
  const pos: number[] = []
  const sizes: number[] = []
  const colours: number[] = []
  const phases: number[] = []
  const { halfX, halfZ, height } = SPACESHIP_BOUNDS
  const clear = 4
  while (sizes.length < count) {
    // a uniform direction, at a distance spread evenly through the shell
    const z = rng() * 2 - 1
    const a = rng() * Math.PI * 2
    const s = Math.sqrt(1 - z * z)
    const r = near + (far - near) * Math.cbrt(rng())
    const p: Vec3 = [BRIDGE_X + Math.cos(a) * s * r, 1.3 + z * r * 0.6, Math.sin(a) * s * r]
    if (Math.abs(p[0]) < halfX + clear && Math.abs(p[2]) < halfZ + clear && p[1] > -clear && p[1] < height + clear) continue
    pos.push(...p)
    sizes.push(size[0] + (size[1] - size[0]) * rng() ** 3)
    const warm = rng()
    const b = 0.6 + rng() * 0.7
    colours.push(b * (0.8 + warm * 0.2), b * 0.88, b * (1 - warm * 0.25))
    phases.push(rng() * 50)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
  g.setAttribute('aColor', new Float32BufferAttribute(colours, 3))
  g.setAttribute('aPhase', new Float32BufferAttribute(phases, 1))
  return g
}

const clouds = (() => {
  let made: BufferGeometry[] | undefined
  return () =>
    (made ??= [
      // dust and near stars, close enough to swing past as you walk
      starCloud(260, 9, 30, [0.05, 0.16], 3),
      // brighter stars further out
      starCloud(900, 30, 90, [0.15, 0.55], 7),
    ])
})()

/** Two clouds of stars at real distances outside the hull. */
export function StarDust() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )
  const ref = useRef<Points>(null)
  useFrame(({ clock }) => {
    if (ref.current) tick(ref.current, clock.elapsedTime)
  })
  const [near, mid] = clouds()
  return (
    <>
      {/* both clouds share the material, so ticking one ticks both */}
      <points ref={ref} geometry={mid} material={material} renderOrder={-2000} raycast={() => null} />
      <points geometry={near} material={material} renderOrder={-1999} raycast={() => null} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Planets and other things to look at, far outside
// ---------------------------------------------------------------------------

const UV_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

const BODY_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uMode;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }
  // a lit sphere of radius R at the middle: its normal and how much of the pixel it covers
  float sphere(vec2 c, float R, out vec3 n) {
    float r = length(c);
    n = vec3(c / R, sqrt(max(0.0, 1.0 - dot(c, c) / (R * R))));
    return smoothstep(R, R - 0.006, r);
  }
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    vec3 sun = normalize(vec3(-0.6, 0.45, 0.65));
    vec3 col = vec3(0.0);
    float a = 0.0;
    vec3 n;
    if (uMode < 0.5) {
      // ringed gas giant
      float R = 0.4;
      float inside = sphere(p, R, n);
      vec2 q = mat2(cos(0.32), -sin(0.32), sin(0.32), cos(0.32)) * p;
      float rr = length(q * vec2(1.0, 3.4));
      float ring = smoothstep(0.56, 0.6, rr) * smoothstep(0.95, 0.9, rr) * (0.45 + 0.55 * sin(rr * 90.0)) * 0.95;
      // the planet's shadow falls across the ring behind it
      float shade = 1.0 - 0.8 * smoothstep(0.42, 0.3, length(p + sun.xy * 0.25)) * step(0.0, q.y);
      vec3 ringCol = vec3(0.95, 0.8, 0.6) * shade;
      float front = step(q.y, 0.0);
      col = ringCol; a = ring * (1.0 - front);
      vec2 uv = vec2(atan(n.x, n.z) + uTime * 0.01, n.y);
      float bands = 0.5 + 0.5 * sin(n.y * 26.0 + fbm(uv * 3.0) * 4.0);
      vec3 surf = mix(vec3(0.95, 0.66, 0.38), vec3(0.55, 0.3, 0.2), bands) * (0.04 + max(dot(n, sun), 0.0));
      col = mix(col, surf, inside); a = max(a * (1.0 - inside), inside);
      col = mix(col, vec3(0.95, 0.8, 0.6), ring * front); a = max(a, ring * front);
    } else if (uMode < 1.5) {
      // black hole: a shadow, a thin bright ring, a swirling disc and the disc's far side bent over the top
      vec2 e = p * vec2(1.0, 3.6);
      float re = length(e);
      float r = length(p);
      float ang = atan(e.y, e.x);
      float disc = smoothstep(0.9, 0.42, re) * smoothstep(0.3, 0.4, re);
      float swirl = 0.55 + 0.45 * sin(ang * 4.0 - uTime * 2.5 + re * 18.0);
      vec3 hot = mix(vec3(1.0, 0.35, 0.08), vec3(1.0, 0.92, 0.65), swirl);
      float halo = smoothstep(0.1, 0.0, abs(r - 0.3)) * (0.6 + 0.4 * sin(atan(p.y, p.x) * 3.0 - uTime));
      col = hot * 1.8 * swirl * disc + vec3(1.0, 0.6, 0.3) * halo * 1.4;
      a = clamp(disc * swirl * 1.4 + halo, 0.0, 1.0);
      float ringLine = smoothstep(0.02, 0.0, abs(r - 0.235));
      col += vec3(1.0, 0.8, 0.55) * ringLine * 2.0; a = max(a, ringLine);
      // in front of the hole only the near half of the disc shows
      float hole = smoothstep(0.225, 0.215, r) * (1.0 - disc * step(e.y, 0.0));
      col = mix(col, vec3(0.0), hole); a = max(a, hole);
      a = max(a, smoothstep(0.6, 0.2, r) * 0.6);
    } else if (uMode < 2.5) {
      // a blue-green planet with weather and a thin blue atmosphere
      float R = 0.6;
      float inside = sphere(p, R, n);
      vec2 uv = vec2(atan(n.x, n.z) + uTime * 0.015, n.y);
      float land = smoothstep(0.5, 0.56, fbm(uv * 3.0));
      vec3 surf = mix(vec3(0.04, 0.2, 0.6), vec3(0.18, 0.5, 0.2), land);
      float cloud = smoothstep(0.55, 0.78, fbm(uv * 5.0 + vec2(uTime * 0.01, 0.0)));
      surf = mix(surf, vec3(1.0), cloud * 0.85) * (0.03 + max(dot(n, sun), 0.0));
      float air = smoothstep(0.07, 0.0, abs(length(p) - R)) * (0.25 + max(dot(normalize(vec3(p, 0.2)), sun), 0.0));
      col = surf * inside + vec3(0.3, 0.6, 1.0) * air * 1.2;
      a = max(inside, air);
    } else {
      // a grey cratered moon
      float R = 0.7;
      float inside = sphere(p, R, n);
      vec2 uv = n.xy * 3.0;
      float maria = smoothstep(0.45, 0.6, fbm(uv * 0.8 + 4.0));
      float craters = 0.0;
      for (int i = 0; i < 3; i++) {
        vec2 g = uv * (2.0 + float(i) * 2.0);
        vec2 id = floor(g);
        float h = hash(id + float(i) * 9.0);
        float d = length(fract(g) - 0.5);
        craters += step(0.6, h) * smoothstep(0.32, 0.25, d) * smoothstep(0.1, 0.25, d) * 0.5;
      }
      vec3 surf = mix(vec3(0.78, 0.77, 0.74), vec3(0.42, 0.42, 0.44), maria) * (1.0 - craters * 0.5);
      col = surf * (0.02 + max(dot(n, sun), 0.0)) * 1.2;
      a = inside;
    }
    gl_FragColor = vec4(col, a);
    ${OUTPUT}
  }
`

export type BodyKind = 'planet' | 'blackhole' | 'earth' | 'moon'
const BODY = { planet: 0, blackhole: 1, earth: 2, moon: 3 }

/**
 * A plane with an empty bounding box: it can't be clicked, and it doesn't
 * stretch its item's outline or click box out into space.
 */
function farPlane(w: number, h: number) {
  const g = new PlaneGeometry(w, h)
  g.boundingBox = new Box3()
  return g
}

/**
 * A planet, black hole or moon, `size` metres across, standing at `position`
 * in its opening's space (the wall at z = 0, outside towards -z).
 */
export function SpaceBody({ kind, position, size }: { kind: BodyKind; position: Vec3; size: number }) {
  const geometry = useMemo(() => farPlane(size, size), [size])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: UV_VERT,
        fragmentShader: BODY_FRAG,
        uniforms: { uTime: { value: 0 }, uMode: { value: BODY[kind] } },
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [kind],
  )
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) tick(ref.current, clock.elapsedTime)
  })
  return <mesh ref={ref} geometry={geometry} material={material} position={position} renderOrder={-2500} />
}

/** A whale, `size` metres long, swimming slowly past outside. */
export function SpaceWhale({ position, size }: { position: Vec3; size: number }) {
  const map = useWhaleTexture()
  const ref = useRef<Group>(null)
  const geometry = useMemo(() => farPlane(size, (size * 448) / 1024), [size])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!ref.current) return
    // the gentle rise and fall of something enormous swimming
    ref.current.position.set(position[0] + Math.sin(t * 0.05) * size * 0.1, position[1] + Math.sin(t * 0.4) * size * 0.03, position[2])
    ref.current.rotation.z = Math.sin(t * 0.4 + 1) * 0.04
  })
  return (
    <group ref={ref} position={position}>
      <mesh geometry={geometry} renderOrder={-2400}>
        <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
    </group>
  )
}
