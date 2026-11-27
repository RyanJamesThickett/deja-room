import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import {
  BoxGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Euler,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  QuadraticBezierCurve3,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type Group,
  type Texture,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Block, Instanced, PI, type Placement } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { mulberry32 } from '../../rng'
import { boneAt } from './fossilParts'
import { FRAME, FRAME_DEPTH, LOOSE_ROPE, PLINTH, PORTRAIT_EYES, STANCHIONS } from './plan'
import { cardTexture, exitSignTexture, gallerySignTexture, skylightTexture, type ExitMode, type SkylightMode } from './textures'

// ---------------------------------------------------------------------------
// Shared materials and geometry
// ---------------------------------------------------------------------------

const GLASS = new MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, roughness: 0.04, clearcoat: 1, depthWrite: false })
const BRASS = new MeshStandardMaterial({ color: '#c39a45', metalness: 0.85, roughness: 0.3 })
const BRONZE = new MeshStandardMaterial({ color: '#7a5a32', metalness: 0.75, roughness: 0.4 })
const GOLD = new MeshStandardMaterial({ color: '#d8b04a', metalness: 0.9, roughness: 0.28 })
const BLACK = new MeshStandardMaterial({ color: '#141414', roughness: 0.5 })
const TOOTH = new MeshStandardMaterial({ color: '#f1ead6', roughness: 0.45 })
const NOTE = new MeshStandardMaterial({ color: '#8f6db8', roughness: 0.8 })
const NOTE2 = new MeshStandardMaterial({ color: '#c47a3a', roughness: 0.8 })

const COIN_GEO = new CylinderGeometry(0.012, 0.012, 0.003, 20)
/** A molar: a knobbly rounded crown on two pointed roots. */
const TOOTH_GEO = (() => {
  const crown = new SphereGeometry(0.01, 12, 8)
  crown.scale(1, 0.85, 0.9)
  crown.translate(0, 0.006, 0)
  const roots = [-1, 1].map((s) => {
    const r = new ConeGeometry(0.0045, 0.016, 8)
    r.rotateX(Math.PI)
    r.rotateZ(s * 0.18)
    r.translate(s * 0.0045, -0.006, 0)
    return r
  })
  return mergeGeometries([crown, ...roots])
})()
const NOTE_GEO = new BoxGeometry(0.13, 0.002, 0.065)
const STANCHION_POLE = new CylinderGeometry(0.022, 0.022, 0.86, 20)
const STANCHION_BASE = new CylinderGeometry(0.15, 0.16, 0.03, 32)
const STANCHION_TOP = new SphereGeometry(0.04, 20, 14)

/** Height of the rope hooks on the stanchions. */
const HOOK = 0.9

const ROPE_MAT = new MeshStandardMaterial({ color: '#8c1424', roughness: 0.9 })
/** One sagging rope per gap between neighbouring stanchions, round the loop. */
const ROPES = STANCHIONS.map(([x0, z0], i) => {
  const [x1, z1] = STANCHIONS[(i + 1) % STANCHIONS.length]
  const curve = new QuadraticBezierCurve3(
    new Vector3(x0, HOOK, z0),
    new Vector3((x0 + x1) / 2, HOOK - 0.3, (z0 + z1) / 2),
    new Vector3(x1, HOOK, z1),
  )
  return new TubeGeometry(curve, 24, 0.018, 8)
})
/** The unhooked rope: hanging off one stanchion and trailing along the floor. */
const LOOSE = (() => {
  const [x0, z0] = STANCHIONS[LOOSE_ROPE]
  const [x1, z1] = STANCHIONS[(LOOSE_ROPE + 1) % STANCHIONS.length]
  const dx = (x1 - x0) / Math.hypot(x1 - x0, z1 - z0)
  const dz = (z1 - z0) / Math.hypot(x1 - x0, z1 - z0)
  const at = (along: number, side: number, y: number) => new Vector3(x0 + dx * along - dz * side, y, z0 + dz * along + dx * side)
  const curve = new CatmullRomCurve3([at(0, 0, HOOK), at(0.02, 0.04, 0.6), at(0.08, 0.1, 0.25), at(0.2, 0.18, 0.02), at(0.5, 0.22, 0.02), at(0.75, 0.12, 0.02)])
  return { geo: new TubeGeometry(curve, 48, 0.018, 8), curve }
})()

const SLEEVE_GEO = new CylinderGeometry(0.024, 0.024, 0.05, 16)
const UP = new Vector3(0, 1, 0)
/** A brass end on a rope: just off the pole (or the rope's free end) at `p`, running along `dir`. */
function sleeve(p: Vector3, dir: Vector3, gap = 0.022): Placement {
  const d = dir.clone().normalize()
  const at = p.clone().addScaledVector(d, gap + 0.025)
  const e = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(UP, d))
  return { at: [at.x, at.y, at.z], rot: [e.x, e.y, e.z] }
}
/** The brass ends of every rope, where they clip on to the stanchions: both ends of each, in order round the loop. */
const SLEEVES = STANCHIONS.map(([x0, z0], i) => {
  const [x1, z1] = STANCHIONS[(i + 1) % STANCHIONS.length]
  const a = new Vector3(x0, HOOK, z0)
  const b = new Vector3(x1, HOOK, z1)
  const sag = new Vector3((x0 + x1) / 2, HOOK - 0.3, (z0 + z1) / 2)
  return [sleeve(a, sag.clone().sub(a)), sleeve(b, sag.clone().sub(b))]
})
const SLEEVES_TIGHT = SLEEVES.flat()
const SLEEVES_LOOSE = SLEEVES.flatMap((pair, i) =>
  // still clipped on at the top, hanging straight down; its other end lying loose on the floor
  i === LOOSE_ROPE
    ? [sleeve(LOOSE.curve.getPointAt(0.03), LOOSE.curve.getTangentAt(0.03), -0.025), sleeve(LOOSE.curve.getPointAt(1), LOOSE.curve.getTangentAt(1), -0.045)]
    : pair,
)

// ---------------------------------------------------------------------------
// Animated helpers
// ---------------------------------------------------------------------------

/** Turns (about the vertical only) to keep its +z side towards the player. */
export function YawToYou({ position, children }: { position?: Vec3; children: ReactNode }) {
  const ref = useRef<Group>(null)
  const v = useRef(new Vector3())
  useFrame(({ camera }) => {
    const g = ref.current
    if (!g?.parent) return
    const p = g.parent.worldToLocal(v.current.copy(camera.position))
    g.rotation.y = Math.atan2(p.x - g.position.x, p.z - g.position.z)
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

const IRIS_GEO = new CircleGeometry(1, 24)
const IRIS = new MeshStandardMaterial({ color: '#4a2e1a', roughness: 0.6 })

/** Real irises over a portrait's painted eye whites, sliding to look at wherever you stand. */
export function WatchingEyes({ w, h, z }: { w: number; h: number; z: number }) {
  const ref = useRef<Group>(null)
  const v = useRef(new Vector3())
  const eyes = useMemo(() => PORTRAIT_EYES.map(([u, t]) => new Vector3((u - 0.5) * w, (0.5 - t) * h, z)), [w, h, z])
  const r = (8 / 512) * w
  const room = { x: (9 / 512) * w, y: (2.5 / 640) * h }
  useFrame(({ camera }) => {
    const g = ref.current
    if (!g?.parent) return
    const p = g.parent.worldToLocal(v.current.copy(camera.position))
    g.children.forEach((iris, i) => {
      const e = eyes[i]
      const d = Math.hypot(p.x - e.x, p.y - e.y, p.z - e.z)
      iris.position.set(e.x + ((p.x - e.x) / d) * room.x, e.y + ((p.y - e.y) / d) * room.y, z + 0.001)
    })
  })
  return (
    <group ref={ref}>
      {eyes.map((e, i) => (
        <group key={i} position={[e.x, e.y, z + 0.001]}>
          <mesh geometry={IRIS_GEO} material={IRIS} scale={r} />
          <mesh geometry={IRIS_GEO} material={BLACK} scale={r * 0.4} position={[0, 0, 0.0005]} />
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Paintings and their fittings
// ---------------------------------------------------------------------------

export type FrameStyle = 'gilt' | 'black' | 'oak'

const FRAME_LOOK: Record<FrameStyle, { color: string; metalness: number; roughness: number }> = {
  gilt: { color: '#b48a36', metalness: 0.8, roughness: 0.35 },
  black: { color: '#1b1a19', metalness: 0.1, roughness: 0.5 },
  oak: { color: '#8a6338', metalness: 0, roughness: 0.6 },
}

/**
 * A framed canvas hung flat on the wall, its origin at the centre of its
 * back. The canvas glows faintly so it reads as lit by the gallery lights.
 */
export function Painting({ w, h, map, frame = 'gilt', border = FRAME }: { w: number; h: number; map: Texture; frame?: FrameStyle; border?: number }) {
  const look = FRAME_LOOK[frame]
  const D = FRAME_DEPTH
  return (
    <>
      <Block size={[w + border * 2, border, D]} position={[0, h / 2 + border / 2, D / 2]} {...look} radius={0.012} />
      <Block size={[w + border * 2, border, D]} position={[0, -h / 2 - border / 2, D / 2]} {...look} radius={0.012} />
      <Block size={[border, h, D]} position={[-w / 2 - border / 2, 0, D / 2]} {...look} radius={0.012} />
      <Block size={[border, h, D]} position={[w / 2 + border / 2, 0, D / 2]} {...look} radius={0.012} />
      {/* backing board */}
      <Block size={[w, h, 0.02]} position={[0, 0, 0.012]} color="#2a2420" />
      <mesh position={[0, 0, D - 0.02]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.22} roughness={0.75} />
      </mesh>
    </>
  )
}

/**
 * A sitter halfway out of their portrait: the painted figure, cut out, leans
 * forward out of the frame from the bottom of the canvas, with real arms
 * gripping the sides of the frame. Same origin as the `Painting` it climbs
 * out of (`w` × `h` canvas); `coat` and `skin` match the painting.
 */
export function ClimbingSitter({ w, h, map, coat, skin }: { w: number; h: number; map: Texture; coat: string; skin: string }) {
  const lean = 0.75
  const hinge: Vec3 = [0, -h / 2 + 0.02, FRAME_DEPTH - 0.01]
  // shoulders on the cut-out, carried forward with it
  const up = 0.27 * h
  const shoulder = (s: number): Vec3 => [s * 0.27 * w, hinge[1] + up * Math.cos(lean), hinge[2] + up * Math.sin(lean)]
  const elbow = (s: number): Vec3 => [s * (w / 2 + 0.03), hinge[1] + 0.06, hinge[2] + 0.17]
  const hand = (s: number): Vec3 => [s * (w / 2 + FRAME * 0.55), -0.02, FRAME_DEPTH + 0.02]
  return (
    <>
      <group position={hinge} rotation={[lean, 0, 0]}>
        <mesh position={[0, h / 2, 0]} castShadow>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.22} alphaTest={0.5} side={DoubleSide} roughness={0.75} />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Sleeve a={shoulder(s)} b={elbow(s)} r={0.032} colour={coat} />
          <Sleeve a={elbow(s)} b={hand(s)} r={0.028} colour={coat} />
          <mesh position={hand(s)} scale={[0.028, 0.034, 0.024]} castShadow>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** A length of sleeve from a to b, with a lace cuff at b. */
function Sleeve({ a, b, r, colour }: { a: Vec3; b: Vec3; r: number; colour: string }) {
  const { mid, q, length } = boneAt(a, b)
  return (
    <>
      <mesh position={mid} quaternion={q} castShadow>
        <cylinderGeometry args={[r, r, length, 12]} />
        <meshStandardMaterial color={colour} roughness={0.7} />
      </mesh>
      <mesh position={a} scale={r}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color={colour} roughness={0.7} />
      </mesh>
      <mesh position={b} quaternion={q} scale={[1, 0.5, 1]}>
        <cylinderGeometry args={[r * 1.15, r * 1.3, 0.03, 12]} />
        <meshStandardMaterial color="#efe9dc" roughness={0.8} />
      </mesh>
    </>
  )
}

/** A brass picture light on two arms above a frame; its tube glows down on the canvas. */
export function PictureLight({ width }: { width: number }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} material={BRASS} position={[s * width * 0.3, 0.04, 0.11]} rotation={[PI / 2 - 0.35, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.24, 10]} />
        </mesh>
      ))}
      <Block size={[0.06, 0.06, 0.02]} position={[0, 0, 0.01]} color="#c39a45" metalness={0.85} roughness={0.3} />
      <mesh material={BRASS} position={[0, 0.08, 0.22]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, width, 20]} />
      </mesh>
      <mesh position={[0, 0.06, 0.205]} rotation={[PI / 2 + 0.6, 0, 0]}>
        <planeGeometry args={[width - 0.04, 0.025]} />
        <meshStandardMaterial color="#fff6dc" emissive="#ffe7b0" emissiveIntensity={2.2} />
      </mesh>
    </group>
  )
}

/** A small printed wall label beside a work. */
export function Plaque({ map }: { map: Texture }) {
  return (
    <group>
      <Block size={[0.2, 0.125, 0.006]} position={[0, 0, 0.003]} color="#f5f2ea" />
      <mesh position={[0, 0, 0.0065]}>
        <planeGeometry args={[0.19, 0.118]} />
        <meshStandardMaterial map={map} roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Blue paint running out of the bottom of a frame and down the wall. */
export function Drip({ x, y }: { x: number; y: number }) {
  const look = { color: '#1f3f9a', roughness: 0.15 }
  return (
    <group position={[x, y, 0]}>
      <Block size={[0.03, 0.02, FRAME_DEPTH + 0.004]} position={[0, -0.005, FRAME_DEPTH / 2]} {...look} radius={0.008} />
      <Block size={[0.014, 0.34, 0.006]} position={[0, -0.18, 0.004]} {...look} radius={0.003} />
      <Block size={[0.008, 0.16, 0.005]} position={[0.03, -0.09, 0.004]} {...look} radius={0.002} />
      <mesh position={[0, -0.36, 0.008]} scale={[1, 1.4, 0.7]}>
        <sphereGeometry args={[0.012, 12, 10]} />
        <meshStandardMaterial {...look} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Plinths, sculpture and cases
// ---------------------------------------------------------------------------

/** A white display plinth with a shadow-gap base. Its top is at `height`. */
export function Plinth({ size = PLINTH.size, height = PLINTH.height }: { size?: number; height?: number }) {
  return (
    <>
      <Block size={[size - 0.04, 0.05, size - 0.04]} position={[0, 0.025, 0]} color="#3a3633" roughness={0.6} />
      <Block size={[size, height - 0.05, size]} position={[0, 0.05 + (height - 0.05) / 2, 0]} color="#f1eee8" roughness={0.7} radius={0.004} />
    </>
  )
}

/** A folded card standing on a plinth top. */
export function TentCard({ map, w = 0.16, h = 0.1 }: { map: Texture; w?: number; h?: number }) {
  return (
    <group rotation={[-0.35, 0, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} roughness={0.8} />
      </mesh>
      <mesh position={[0, h / 2, -0.002]} rotation={[0, PI, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#f5f2ea" roughness={0.8} />
      </mesh>
    </group>
  )
}

/** The loan plinth: an apology card, or the bronze knot back from its travels. */
export function LoanPlinth({ returned }: { returned: boolean }) {
  const card = useMemo(() => cardTexture(['ON LOAN', 'This work is away', 'until further notice'], { w: 384, h: 240, size: 52 }), [])
  return (
    <>
      <Plinth />
      {returned ? (
        <group position={[0, PLINTH.height, 0]}>
          <Block size={[0.2, 0.04, 0.2]} position={[0, 0.02, 0]} color="#2b2826" roughness={0.4} />
          <mesh material={BRONZE} position={[0, 0.2, 0]} castShadow>
            <torusKnotGeometry args={[0.1, 0.03, 160, 16, 2, 3]} />
          </mesh>
        </group>
      ) : (
        <group position={[0, PLINTH.height, 0.05]}>
          <TentCard map={card} />
        </group>
      )}
    </>
  )
}

/** The colossal marble head, set on a stepped platform. */
export function Colossus({ mode }: { mode: 'normal' | 'facing' | 'glasses' }) {
  const head = <Model id="marble_bust_01" scale={2.4} />
  return (
    <>
      <Block size={[1.5, 0.14, 1.5]} position={[0, 0.07, 0]} color="#d9d4ca" roughness={0.6} radius={0.01} />
      <Block size={[1.1, 0.12, 1.1]} position={[0, 0.2, 0]} color="#e8e4dc" roughness={0.55} radius={0.01} />
      {mode === 'facing' ? <YawToYou position={[0, 0.26, 0]}>{head}</YawToYou> : <group position={[0, 0.26, 0]}>{head}</group>}
      {mode === 'glasses' && (
        // sized in the bust model's own units, so they sit on its face at any scale
        <group position={[0, 0.26, 0]} scale={2.4}>
          <group rotation={[0, SHADES_FIT.yaw, 0]}>
            <group position={[SHADES_FIT.x, SHADES_FIT.y, 0]}>
              <Shades />
            </group>
          </group>
        </group>
      )}
    </>
  )
}

/*
 * Where the bust's eyes are, measured off the model: its face is turned a
 * little to its right, so the glasses turn with it. Positions in the model's
 * own units, eye level, centred between the eyes.
 */
const SHADES_FIT = { yaw: -0.2, x: -0.0195, y: 0.383 }
const SHADES_MAT = new MeshStandardMaterial({ color: '#0b0b0e', metalness: 0.5, roughness: 0.3 })
const LENS_MAT = new MeshStandardMaterial({ color: '#050508', metalness: 0.9, roughness: 0.06 })
const RIM_GEO = new TorusGeometry(1, 0.12, 8, 40)
const LENS_GEO = new SphereGeometry(1, 24, 14)
/** The arms: from the hinge back along the side of the head, over the ear and down behind it. */
const ARM_GEOS = [1, -1].map(
  (s) =>
    new TubeGeometry(
      new CatmullRomCurve3([
        new Vector3(s * 0.081, 0.01, 0.128),
        new Vector3(s * 0.088, 0.011, 0.08),
        new Vector3(s * 0.096, 0.012, 0.035),
        new Vector3(s * 0.102, 0.009, 0.0),
        new Vector3(s * 0.097, -0.01, -0.022),
        new Vector3(s * 0.088, -0.035, -0.036),
      ]),
      32,
      0.0032,
      6,
    ),
)

/** Wraparound sunglasses, in the bust model's units: lenses at z ≈ 0.14, arms back to the ears. */
function Shades() {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.046, 0, 0.138]} rotation={[0, s * 0.15, 0]}>
          <mesh geometry={LENS_GEO} material={LENS_MAT} scale={[0.031, 0.023, 0.005]} />
          <mesh geometry={RIM_GEO} material={SHADES_MAT} scale={[0.032, 0.024, 0.03]} />
        </group>
      ))}
      {/* the bridge over the nose, the brow bar and the hinges */}
      <mesh material={SHADES_MAT} position={[0, 0.004, 0.147]} scale={[1, 1, 0.6]}>
        <torusGeometry args={[0.012, 0.0028, 6, 16, PI]} />
      </mesh>
      <Block size={[0.156, 0.006, 0.007]} position={[0, 0.021, 0.138]} color="#0b0b0e" metalness={0.5} roughness={0.3} radius={0.002} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.01, 0.012, 0.012]} position={[s * 0.079, 0.012, 0.13]} color="#0b0b0e" metalness={0.5} roughness={0.3} radius={0.002} />
      ))}
      {ARM_GEOS.map((g, i) => (
        <mesh key={i} geometry={g} material={SHADES_MAT} />
      ))}
    </>
  )
}

/** Brass stanchions with red ropes looped between them; `loose` drops one rope to the floor. */
export function Barrier({ loose }: { loose: boolean }) {
  return (
    <>
      {STANCHIONS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh geometry={STANCHION_BASE} material={BRASS} position={[0, 0.015, 0]} castShadow receiveShadow />
          <mesh geometry={STANCHION_POLE} material={BRASS} position={[0, 0.46, 0]} castShadow />
          <mesh geometry={STANCHION_TOP} material={BRASS} position={[0, HOOK + 0.02, 0]} castShadow />
        </group>
      ))}
      {ROPES.map((geo, i) =>
        loose && i === LOOSE_ROPE ? null : <mesh key={i} geometry={geo} material={ROPE_MAT} castShadow userData={{ paint: true }} />,
      )}
      {loose && <mesh geometry={LOOSE.geo} material={ROPE_MAT} castShadow userData={{ paint: true }} />}
      <Instanced geometry={SLEEVE_GEO} material={BRASS} items={loose ? SLEEVES_LOOSE : SLEEVES_TIGHT} />
    </>
  )
}

/** Two brass stanchions across a doorway, `width` apart along z, with a red rope slung between them. */
export function DoorRope({ width }: { width: number }) {
  const geo = useMemo(() => {
    const h = width / 2
    return new TubeGeometry(new QuadraticBezierCurve3(new Vector3(0, HOOK, -h), new Vector3(0, HOOK - 0.22, 0), new Vector3(0, HOOK, h)), 24, 0.018, 8)
  }, [width])
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, (s * width) / 2]}>
          <mesh geometry={STANCHION_BASE} material={BRASS} position={[0, 0.015, 0]} castShadow receiveShadow />
          <mesh geometry={STANCHION_POLE} material={BRASS} position={[0, 0.46, 0]} castShadow />
          <mesh geometry={STANCHION_TOP} material={BRASS} position={[0, HOOK + 0.02, 0]} castShadow />
        </group>
      ))}
      <mesh geometry={geo} material={ROPE_MAT} castShadow />
    </>
  )
}

/** "Please do not touch" on a little brass post. */
export function Notice({ touch }: { touch: boolean }) {
  const map = useMemo(
    () => cardTexture(touch ? ['PLEASE TOUCH', 'THE EXHIBITS'] : ['PLEASE DO NOT', 'TOUCH THE', 'EXHIBITS'], { w: 512, h: 340, size: 52, even: true }),
    [touch],
  )
  return (
    <>
      <mesh material={BRASS} position={[0, 0.012, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.024, 28]} />
      </mesh>
      <mesh material={BRASS} position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.86, 12]} />
      </mesh>
      <group position={[0, 0.95, 0]} rotation={[-0.5, 0, 0]}>
        <Block size={[0.32, 0.22, 0.01]} color="#c39a45" metalness={0.85} roughness={0.3} />
        <mesh position={[0, 0, 0.0055]}>
          <planeGeometry args={[0.3, 0.2]} />
          <meshStandardMaterial map={map} roughness={0.8} />
        </mesh>
      </group>
    </>
  )
}

/** A glass box on a plinth holding one small bronze horse. */
export function Vitrine({ horse }: { horse: 'inside' | 'escaped' | 'fallen' }) {
  const base = 0.95
  const glass = 0.5
  return (
    <>
      <Plinth size={0.52} height={base} />
      <mesh material={GLASS} position={[0, base + glass / 2, 0]}>
        <boxGeometry args={[0.48, glass, 0.48]} />
      </mesh>
      {[
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <Block key={i} size={[0.012, glass, 0.012]} position={[sx * 0.235, base + glass / 2, sz * 0.235]} color="#2b2826" metalness={0.5} roughness={0.4} />
      ))}
      <Block size={[0.52, 0.025, 0.52]} position={[0, base + glass + 0.0125, 0]} color="#2b2826" metalness={0.5} roughness={0.4} />
      <Block size={[0.18, 0.06, 0.12]} position={[0, base + 0.03, 0]} color="#1c1a19" roughness={0.5} />
      {horse === 'inside' && <Model id="horse_statue_01" position={[0, base + 0.06, 0]} rotation={[0, 0.5, 0]} scale={1.3} />}
      {horse === 'escaped' && <Model id="horse_statue_01" position={[0.02, base + glass + 0.025, 0.02]} rotation={[0, 0.9, 0]} scale={1.3} />}
      {horse === 'fallen' && (
        // tipped over onto its side, base towards the wall, so from the room you see the horse and not the bottom of its base
        <group position={[0, base + 0.06 + 0.07, 0]} rotation={[0, 0.5, 0]}>
          <group rotation={[-PI / 2, 0, 0]} position={[0, 0, 0.14]}>
            <Model id="horse_statue_01" scale={1.3} />
          </group>
        </group>
      )}
    </>
  )
}

/** A Roman oil lamp in red clay: a round body, a spout with its wick hole, a filling hole on top and a loop handle. */
function OilLamp() {
  const clay = { color: '#a8532e', roughness: 0.85 }
  return (
    <group>
      <mesh position={[0, 0.018, 0]} scale={[1, 0.45, 0.85]} castShadow>
        <sphereGeometry args={[0.045, 24, 14]} />
        <meshStandardMaterial {...clay} />
      </mesh>
      {/* the sunken top disc and its filling hole */}
      <mesh position={[0, 0.036, 0]} rotation={[-PI / 2, 0, 0]}>
        <ringGeometry args={[0.008, 0.026, 24]} />
        <meshStandardMaterial color="#94472a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.0355, 0]} rotation={[-PI / 2, 0, 0]}>
        <circleGeometry args={[0.008, 16]} />
        <meshStandardMaterial color="#2a140b" roughness={1} />
      </mesh>
      {/* the spout, rounded off at its tip, with the wick hole */}
      <mesh position={[0.05, 0.016, 0]} rotation={[0, 0, PI / 2]} scale={[1, 1, 0.8]}>
        <cylinderGeometry args={[0.013, 0.018, 0.04, 16]} />
        <meshStandardMaterial {...clay} />
      </mesh>
      <mesh position={[0.07, 0.016, 0]} scale={[0.6, 1, 0.8]}>
        <sphereGeometry args={[0.013, 14, 10]} />
        <meshStandardMaterial {...clay} />
      </mesh>
      <mesh position={[0.072, 0.0275, 0]} rotation={[-PI / 2, 0, 0]}>
        <circleGeometry args={[0.005, 12]} />
        <meshStandardMaterial color="#1a0d07" roughness={1} />
      </mesh>
      {/* a loop handle at the back */}
      <mesh position={[-0.046, 0.026, 0]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.012, 0.0045, 8, 16]} />
        <meshStandardMaterial {...clay} />
      </mesh>
    </group>
  )
}

const CASE_TRIM = { color: '#6a4a2a', metalness: 0.6, roughness: 0.4 }

/**
 * A glass hood `w` × `d` × `h` with its bottom at `y`: the glass, and a thin
 * metal frame along every edge so its shape reads although the glass barely shows.
 */
export function CaseHood({ w, d, h, y, trim = CASE_TRIM }: { w: number; d: number; h: number; y: number; trim?: typeof CASE_TRIM }) {
  const t = 0.014
  const mid = y + h / 2
  return (
    <>
      <mesh material={GLASS} position={[0, mid, 0]}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {[
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <Block key={i} size={[t, h, t]} position={[sx * (w / 2 - t / 2), mid, sz * (d / 2 - t / 2)]} {...trim} radius={0.003} />
      ))}
      {[y + t / 2, y + h - t / 2].map((ry) => (
        <group key={ry}>
          {[-1, 1].map((s) => (
            <Block key={`x${s}`} size={[w, t, t]} position={[0, ry, s * (d / 2 - t / 2)]} {...trim} radius={0.003} />
          ))}
          {[-1, 1].map((s) => (
            <Block key={`z${s}`} size={[t, t, d - t * 2]} position={[s * (w / 2 - t / 2), ry, 0]} {...trim} radius={0.003} />
          ))}
        </group>
      ))}
    </>
  )
}

/**
 * A wooden cabinet `w` × `d`, its top at `top`: a recessed plinth at the
 * floor, raised panels front and back, and a moulded lip round the top.
 */
export function CaseCabinet({ w, d, top, felt = '#1c2b3a' }: { w: number; d: number; top: number; felt?: string }) {
  const wood = { color: '#3b2a1e', roughness: 0.55 }
  const kick = 0.08
  const lip = 0.04
  const body = top - kick - lip
  const panelW = (w - 0.18) / 2
  return (
    <>
      <Block size={[w - 0.06, kick, d - 0.06]} position={[0, kick / 2, 0]} color="#1e150e" roughness={0.6} />
      <Block size={[w, body, d]} position={[0, kick + body / 2, 0]} {...wood} radius={0.008} />
      <Block size={[w + 0.03, lip, d + 0.03]} position={[0, top - lip / 2, 0]} color="#4a3424" roughness={0.45} radius={0.012} />
      {[-1, 1].map((sz) =>
        [-1, 1].map((sx) => (
          <Block
            key={`${sz}${sx}`}
            size={[panelW, body - 0.14, 0.014]}
            position={[sx * (panelW / 2 + 0.03), kick + body / 2, sz * (d / 2 + 0.005)]}
            color="#4a3626"
            roughness={0.5}
            radius={0.005}
          />
        )),
      )}
      <Block size={[w - 0.08, 0.02, d - 0.08]} position={[0, top + 0.01, 0]} color={felt} roughness={0.95} />
    </>
  )
}

const ARROW_GEO = new ConeGeometry(0.018, 0.06, 3)
const FLINT = new MeshStandardMaterial({ color: '#5c574f', roughness: 0.55 })
const BROOCH_GEO = new TorusGeometry(0.025, 0.006, 10, 28)
const LABEL = new MeshStandardMaterial({ color: '#f5f2ea', roughness: 0.8 })
const LABEL_GEO = new BoxGeometry(0.05, 0.002, 0.025)

/**
 * A table-top case of small finds on dark felt: coins, a lamp, flint
 * arrowheads, a pot and a brooch, each with a tiny label in front.
 */
export function TableCase({ mode }: { mode: 'normal' | 'phone' | 'missing' }) {
  const top = 0.8
  const hood = 0.3
  const coins = useMemo(() => {
    const rng = mulberry32(3)
    return Array.from({ length: 7 }, (_, i): Vec3 => [-0.5 + (i % 4) * 0.035 + rng() * 0.01, top + 0.022, -0.1 + Math.floor(i / 4) * 0.04])
  }, [])
  return (
    <>
      <CaseCabinet w={1.4} d={0.7} top={top} />
      <CaseHood w={1.38} d={0.68} h={hood + 0.02} y={top} />
      {coins.map((at, i) => (
        <mesh key={i} geometry={COIN_GEO} material={i % 3 ? BRONZE : GOLD} position={at} rotation={[0, 0, (i % 2) * 0.1]} />
      ))}
      <group position={[-0.18, top + 0.02, -0.05]} rotation={[0, 0.4, 0]}>
        <OilLamp />
      </group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={ARROW_GEO} material={FLINT} position={[0.08 + i * 0.05, top + 0.026, -0.08]} rotation={[PI / 2, 0, 0.2 * (i - 1)]} scale={[1, 1, 0.25]} />
      ))}
      {mode !== 'missing' && <Model id="ceramic_vase_01" position={[0.36, top + 0.02, -0.08]} scale={0.5} />}
      {mode === 'phone' ? (
        <group position={[0.53, top + 0.02, 0.0]} rotation={[0, -0.3, 0]}>
          <Block size={[0.072, 0.008, 0.15]} position={[0, 0.004, 0]} color="#111" metalness={0.4} roughness={0.25} radius={0.006} />
          <mesh position={[0, 0.0085, 0]} rotation={[-PI / 2, 0, 0]}>
            <planeGeometry args={[0.064, 0.138]} />
            <meshStandardMaterial color="#1b2a4a" emissive="#3a6fd8" emissiveIntensity={0.9} />
          </mesh>
        </group>
      ) : (
        <mesh geometry={BROOCH_GEO} material={GOLD} position={[0.55, top + 0.026, 0]} rotation={[PI / 2, 0, 0]} />
      )}
      {[-0.44, -0.18, 0.13, 0.36, 0.54].map((x) => (
        <mesh key={x} geometry={LABEL_GEO} material={LABEL} position={[x, top + 0.021, 0.16]} />
      ))}
    </>
  )
}

/** The donations box by the door: a perspex box on a pedestal. */
export function DonationBox({ contents }: { contents: 'coins' | 'teeth' | 'empty' }) {
  const card = useMemo(() => cardTexture(['DONATIONS', 'Entry is free. Thank you.'], { w: 384, h: 192, size: 50 }), [])
  const pile = useMemo(() => {
    const rng = mulberry32(contents === 'teeth' ? 8 : 5)
    const out: Placement[] = []
    if (contents === 'teeth') {
      // a heap of them, well up the box, highest in the middle
      for (let i = 0; i < 170; i++) {
        const x = (rng() - 0.5) * 0.27
        const z = (rng() - 0.5) * 0.27
        const heap = 1 - 0.55 * Math.min(1, Math.hypot(x, z) / 0.19)
        out.push({ at: [x, 0.014 + rng() * 0.15 * heap, z], rot: [rng() * PI, rng() * PI, rng() * PI] })
      }
      return out
    }
    for (let i = 0; i < 46; i++) {
      out.push({
        at: [(rng() - 0.5) * 0.24, 0.006 + rng() * 0.035, (rng() - 0.5) * 0.24],
        rot: [rng() * PI, rng() * PI, rng() * PI],
      })
    }
    return out
  }, [contents])
  const top = 0.9
  return (
    <>
      <Block size={[0.34, top, 0.34]} position={[0, top / 2, 0]} color="#2a2522" roughness={0.5} />
      <group position={[0, 0.72, 0.1705]}>
        <mesh>
          <planeGeometry args={[0.28, 0.14]} />
          <meshStandardMaterial map={card} roughness={0.8} />
        </mesh>
      </group>
      <CaseHood w={0.32} d={0.32} h={0.32} y={top} trim={{ color: '#2a2522', metalness: 0.1, roughness: 0.5 }} />
      <Block size={[0.34, 0.02, 0.34]} position={[0, top + 0.33, 0]} color="#2a2522" roughness={0.5} />
      {/* a padlock on the lid */}
      <Block size={[0.04, 0.035, 0.012]} position={[0, top + 0.31, 0.176]} color="#c39a45" metalness={0.85} roughness={0.3} radius={0.004} />
      <Block size={[0.12, 0.004, 0.015]} position={[0, top + 0.342, 0]} color="#050505" />
      <group position={[0, top, 0]}>
        {contents === 'coins' && (
          <>
            <Instanced geometry={COIN_GEO} material={GOLD} items={pile} />
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} geometry={NOTE_GEO} material={i % 2 ? NOTE : NOTE2} position={[(i - 1.5) * 0.04, 0.045 + i * 0.004, (i % 2) * 0.05 - 0.02]} rotation={[0.1, i * 0.7, 0.05]} />
            ))}
          </>
        )}
        {contents === 'teeth' && <Instanced geometry={TOOTH_GEO} material={TOOTH} items={pile} />}
        {contents === 'empty' && <mesh geometry={COIN_GEO} material={GOLD} position={[0.05, 0.003, -0.03]} />}
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Furniture and fittings
// ---------------------------------------------------------------------------

/** A gallery bench: buttoned leather on a dark wooden base, along local x. */
export function Bench({ length, depth }: { length: number; depth: number }) {
  return (
    <>
      <Block size={[length, 0.11, depth]} position={[0, 0.405, 0]} color="#5a2a22" roughness={0.45} radius={0.03} paint />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.08, 0.35, depth - 0.08]} position={[s * (length / 2 - 0.12), 0.175, 0]} color="#2a1d15" roughness={0.5} />
      ))}
      <Block size={[length - 0.24, 0.05, 0.06]} position={[0, 0.12, 0]} color="#2a1d15" roughness={0.5} />
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[(i - 3) * (length / 8), 0.462, (i % 2 ? 0.1 : -0.1)]}>
          <sphereGeometry args={[0.012, 10, 8]} />
          <meshStandardMaterial color="#3a1a14" roughness={0.6} />
        </mesh>
      ))}
    </>
  )
}

/** The guard's plain wooden chair, centred on its seat, facing +z. */
export function GuardChair({ cap }: { cap: boolean }) {
  const wood = { color: '#6b4a2c', roughness: 0.6 }
  return (
    <>
      <Block size={[0.44, 0.04, 0.42]} position={[0, 0.45, 0]} {...wood} paint />
      {[
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <Block key={i} size={[0.035, 0.45, 0.035]} position={[sx * 0.19, 0.225, sz * 0.18]} {...wood} />
      ))}
      {[-1, 1].map((sx) => (
        <Block key={sx} size={[0.035, 0.48, 0.035]} position={[sx * 0.19, 0.71, -0.18]} {...wood} />
      ))}
      {/* stretchers between the legs: low along each side, and one across the front */}
      {[-1, 1].map((sx) => (
        <Block key={sx} size={[0.022, 0.022, 0.34]} position={[sx * 0.19, 0.14, 0]} {...wood} />
      ))}
      <Block size={[0.36, 0.022, 0.022]} position={[0, 0.2, 0.18]} {...wood} />
      <Block size={[0.36, 0.022, 0.022]} position={[0, 0.17, -0.18]} {...wood} />
      <Block size={[0.42, 0.14, 0.025]} position={[0, 0.86, -0.185]} {...wood} paint />
      <Block size={[0.42, 0.05, 0.025]} position={[0, 0.62, -0.185]} {...wood} paint />
      {cap && (
        // left on the seat
        <group position={[0.04, 0.47, 0.03]} rotation={[0, 0.6, 0]}>
          <GuardCap />
        </group>
      )}
    </>
  )
}

/** A museum guard's peaked cap, its band's bottom at the origin, peak towards +z. */
export function GuardCap() {
  return (
    <>
      <mesh position={[0, 0.035, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.09, 0.07, 28]} />
        <meshStandardMaterial color="#1a2236" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.072, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.008, 28]} />
        <meshStandardMaterial color="#1a2236" roughness={0.7} />
      </mesh>
      {/* the peak: a whole flattened lens, so it has an underside when you look up at it */}
      <mesh position={[0, 0.006, 0.1]} rotation={[0.25, 0, 0]} scale={[1, 0.1, 0.6]}>
        <sphereGeometry args={[0.09, 24, 12]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.3} />
      </mesh>
      {/* the chin strap along the front of the band */}
      <mesh position={[0, 0.014, 0]} rotation={[PI / 2, 0, 0]}>
        <torusGeometry args={[0.093, 0.004, 6, 28, PI]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.3} />
      </mesh>
      <Block size={[0.07, 0.02, 0.004]} position={[0, 0.04, 0.105]} color="#d8b04a" metalness={0.9} roughness={0.3} />
    </>
  )
}

/** The illuminated fire exit sign, its back on the wall. */
export function ExitSign({ mode }: { mode: ExitMode }) {
  const map = useMemo(() => exitSignTexture(mode), [mode])
  return (
    <>
      <Block size={[0.44, 0.17, 0.05]} position={[0, 0, 0.025]} color="#f2f2f0" roughness={0.5} />
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[0.4, 0.15]} />
        <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={1.3} />
      </mesh>
    </>
  )
}

/** Vinyl lettering naming the gallery, straight onto the wall. */
export function GallerySign({ title, subtitle }: { title: string; subtitle: string }) {
  const map = useMemo(() => gallerySignTexture(title, subtitle), [title, subtitle])
  return (
    <mesh position={[0, 0, 0.004]}>
      <planeGeometry args={[1.28, 0.4]} />
      <meshStandardMaterial map={map} transparent roughness={0.6} />
    </mesh>
  )
}

/** The frosted laylight in the ceiling, lit from the roof above. Hangs down from its origin. */
export function Skylight({ w, d, mode }: { w: number; d: number; mode: SkylightMode }) {
  const map = useMemo(() => skylightTexture(mode), [mode])
  return (
    <mesh position={[0, -0.03, 0]} rotation={[PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={1.05} roughness={0.9} />
    </mesh>
  )
}

/** The plaster coffer round the skylight. */
export function SkylightCoffer({ w, d }: { w: number; d: number }) {
  const b = 0.18
  const look = { color: '#efece6', roughness: 0.9 }
  return (
    <>
      <Block size={[w + b * 2, 0.08, b]} position={[0, -0.04, d / 2 + b / 2]} {...look} />
      <Block size={[w + b * 2, 0.08, b]} position={[0, -0.04, -d / 2 - b / 2]} {...look} />
      <Block size={[b, 0.08, d]} position={[w / 2 + b / 2, -0.04, 0]} {...look} />
      <Block size={[b, 0.08, d]} position={[-w / 2 - b / 2, -0.04, 0]} {...look} />
    </>
  )
}

/** A ceiling dome camera, hanging down from its origin. */
export function DomeCamera() {
  return (
    <>
      <mesh position={[0, -0.02, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 28]} />
        <meshStandardMaterial color="#efefec" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.04, 0]} rotation={[PI, 0, 0]}>
        <sphereGeometry args={[0.06, 24, 12, 0, PI * 2, 0, PI / 2]} />
        <meshStandardMaterial color="#141418" metalness={0.3} roughness={0.1} />
      </mesh>
    </>
  )
}
