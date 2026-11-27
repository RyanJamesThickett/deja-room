import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, Vector3, type Group, type Mesh, type Texture } from 'three'
import { Block, Instanced, PI } from '../../kit'
import type { Vec3 } from '../../mutations'
import {
  AMMONITE,
  ARMS,
  BACK_BONES,
  BONE_GEO,
  boneAt,
  CENTRUM_GEO,
  DINO_PLINTH,
  FISH_CORE,
  FISH_STONE,
  FOSSIL,
  FOSSIL_2S,
  FOSSIL_DARK,
  ILIUM_GEO,
  JAW_GEO,
  KNOB_GEO,
  LEG_RADII,
  LEGS,
  LOWER_TEETH,
  MEMBRANE,
  METEORITE_GEO,
  NECK,
  NECK_BONES,
  PTERO_HEAD_GEO,
  RIB_GEO,
  RIBS,
  SKULL_AT,
  SKULL_GEO,
  SPINE_GEO,
  STEEL,
  TAIL_ROOT,
  TAIL_SECTIONS,
  TENTACLE_GEO,
  TOOTH_GEO,
  TOOTH_MAT,
  TUSK_GEO,
  TUSK_HOLDS,
  UPPER_TEETH,
  WING_BONES,
  WING_GEO,
} from './fossilParts'
import { fishTexture, meteoriteTexture, slabTexture, veinTexture } from './natural'
import { CaseCabinet, CaseHood } from './parts'

/*
 * The natural history gallery's exhibits: the tyrannosaur, the fossil fish,
 * the mammoth tusk, the ammonite, the meteorite, the nest of eggs, the
 * stuffed owl and the pteranodon overhead.
 */

const SOCKET = new MeshStandardMaterial({ color: '#17120d', roughness: 1 })
const GLASS = new MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, roughness: 0.04, clearcoat: 1, depthWrite: false })

// ---------------------------------------------------------------------------
// Bones
// ---------------------------------------------------------------------------

/** A straight bone from a to b with a knob at each end. */
function Bone({ a, b, r, knobs = true, steel = false }: { a: Vec3; b: Vec3; r: number; knobs?: boolean; steel?: boolean }) {
  const { mid, q, length } = boneAt(a, b)
  return (
    <>
      <mesh geometry={BONE_GEO} material={steel ? STEEL : FOSSIL} position={mid} quaternion={q} scale={[r, length, r]} castShadow />
      {knobs && (
        <>
          <mesh geometry={KNOB_GEO} material={FOSSIL} position={a} scale={r * 1.12} castShadow />
          <mesh geometry={KNOB_GEO} material={FOSSIL} position={b} scale={r * 1.05} castShadow />
        </>
      )}
    </>
  )
}

/** A run of bones through several joints. */
function Limb({ joints, radii }: { joints: Vec3[]; radii: number[] }) {
  return (
    <>
      {joints.slice(1).map((j, i) => (
        <Bone key={i} a={joints[i]} b={j} r={radii[Math.min(i, radii.length - 1)]} />
      ))}
    </>
  )
}

/**
 * Turns about the vertical to face the player (keeping its +x side towards
 * them, as far as `max` either way) and dips a little towards their eyes.
 */
function LooksAtYou({ position, max, children }: { position: Vec3; max: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  const v = useRef(new Vector3())
  useFrame(({ camera }) => {
    const g = ref.current
    if (!g?.parent) return
    const p = g.parent.worldToLocal(v.current.copy(camera.position))
    const dx = p.x - g.position.x
    const dz = p.z - g.position.z
    // stop a little short of square on, so you see its eye socket as well as its teeth
    const want = Math.atan2(-dz, dx)
    const yaw = Math.max(-max, Math.min(max, want - Math.sign(want) * 0.35))
    const pitch = Math.max(-0.3, Math.min(0.1, Math.atan2(p.y - g.position.y - 0.4, Math.hypot(dx, dz)) * 0.6))
    g.rotation.set(0, yaw, pitch, 'YZX')
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

/** One piece of the tail: its vertebrae, then the rest of the tail hanging off its end. */
function TailSection({ index, wag, children }: { index: number; wag: boolean; children?: ReactNode }) {
  const ref = useRef<Group>(null)
  const s = TAIL_SECTIONS[index]
  useFrame(({ clock }) => {
    if (!wag || !ref.current) return
    // a happy dog's wag, more at each joint along the tail
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 3.2 - index * 0.6) * (0.12 + index * 0.05)
  })
  return (
    <group ref={ref} position={s.pivot}>
      <Instanced geometry={CENTRUM_GEO} material={FOSSIL} items={s.centra} />
      <Instanced geometry={SPINE_GEO} material={FOSSIL_DARK} items={s.spines} />
      {children}
    </group>
  )
}

function Tail({ wag }: { wag: boolean }) {
  return (
    <group position={TAIL_ROOT}>
      <TailSection index={0} wag={wag}>
        <TailSection index={1} wag={wag}>
          <TailSection index={2} wag={wag}>
            <TailSection index={3} wag={wag} />
          </TailSection>
        </TailSection>
      </TailSection>
    </group>
  )
}

/** Neck and skull, from the base of the neck. */
function Head() {
  return (
    <>
      <Instanced geometry={CENTRUM_GEO} material={FOSSIL} items={NECK_BONES.centra} />
      <Instanced geometry={SPINE_GEO} material={FOSSIL_DARK} items={NECK_BONES.spines} />
      {/* the skull tips nose-down a little; the jaw hangs open */}
      <group position={SKULL_AT} rotation={[0, 0, -0.32]} scale={0.8}>
        <group position={[-0.02, -0.18, 0]}>
          <mesh geometry={SKULL_GEO} material={FOSSIL} castShadow />
          {/* dark in the eye socket, so it reads as a hollow from any side */}
          <mesh geometry={KNOB_GEO} material={SOCKET} position={[0.15, 0.25, 0]} scale={[0.04, 0.045, 0.09]} />
          <Instanced geometry={TOOTH_GEO} material={TOOTH_MAT} items={UPPER_TEETH} />
          <group position={[0.02, 0.03, 0]} rotation={[0, 0, -0.2]}>
            <mesh geometry={JAW_GEO} material={FOSSIL_DARK} castShadow />
            <Instanced geometry={TOOTH_GEO} material={TOOTH_MAT} items={LOWER_TEETH} />
          </group>
        </group>
      </group>
    </>
  )
}

/**
 * The tyrannosaur skeleton, striding on a low plinth with its steel mount.
 * `watching` turns its head to follow you; `wagging` wags its tail.
 */
export function Tyrannosaur({ mode }: { mode: 'normal' | 'watching' | 'wagging' }) {
  const P = DINO_PLINTH
  const top = P.height
  return (
    <>
      <Block size={[P.length, top, P.width]} position={[P.x, top / 2, 0]} color="#34302c" roughness={0.6} radius={0.02} />
      <Block size={[P.length - 0.1, 0.02, P.width - 0.1]} position={[P.x, top + 0.01, 0]} color="#6e665a" roughness={0.95} />
      <group position={[0, top, 0]}>
        {/* the steel mount: rods up to the hips, the chest and the tail */}
        {(
          [
            [-0.25, 1.36],
            [0.3, 1.42],
            [-1.2, 1.18],
          ] as const
        ).map(([x, y]) => (
          <Bone key={x} a={[x, 0, 0]} b={[x, y, 0]} r={0.016} knobs={false} steel />
        ))}
        <Instanced geometry={CENTRUM_GEO} material={FOSSIL} items={BACK_BONES.centra} />
        <Instanced geometry={SPINE_GEO} material={FOSSIL_DARK} items={BACK_BONES.spines} />
        <Instanced geometry={RIB_GEO} material={FOSSIL_2S} items={RIBS} />
        {/* hips: a blade either side, the pubis forward to its "boot", the ischium back */}
        {[1, -1].map((s) => (
          <group key={s}>
            <mesh geometry={ILIUM_GEO} material={FOSSIL_DARK} position={[-0.25, 1.38, s * 0.13]} scale={0.75} castShadow />
            <Bone a={[-0.2, 1.34, s * 0.1]} b={[0.02, 0.86, s * 0.05]} r={0.03} />
            <Bone a={[-0.38, 1.34, s * 0.1]} b={[-0.6, 0.98, s * 0.05]} r={0.025} />
          </group>
        ))}
        <mesh geometry={KNOB_GEO} material={FOSSIL} position={[0.04, 0.84, 0]} scale={[0.14, 0.045, 0.08]} castShadow />
        {LEGS.map((leg, i) => (
          <group key={i}>
            <Limb joints={leg.joints} radii={LEG_RADII} />
            {leg.toes.map((t, k) => (
              <Bone key={k} a={leg.joints[3]} b={t} r={0.022} />
            ))}
          </group>
        ))}
        {ARMS.map((arm, i) => (
          <group key={i}>
            <Limb joints={arm} radii={[0.02, 0.022, 0.016]} />
            {[-1, 1].map((f) => (
              <Bone key={f} a={arm[3]} b={[arm[3][0] + 0.07, arm[3][1] - 0.05, arm[3][2] + f * 0.02]} r={0.008} />
            ))}
          </group>
        ))}
        {mode === 'watching' ? (
          <LooksAtYou position={NECK} max={2.5}>
            <Head />
          </LooksAtYou>
        ) : (
          <group position={NECK}>
            <Head />
          </group>
        )}
        <Tail wag={mode === 'wagging'} />
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Cases and the things in them
// ---------------------------------------------------------------------------

/** A wooden cabinet with a glass hood on top: `w` x `d`, top at `top`, hood `hood` tall. */
function GlassCase({ w, d, top, hood }: { w: number; d: number; top: number; hood: number }) {
  return (
    <>
      <CaseCabinet w={w} d={d} top={top} felt="#2a2a2a" />
      <CaseHood w={w - 0.02} d={d - 0.02} h={hood + 0.02} y={top} />
    </>
  )
}

/** The fish that has come out of its stone: swims laps of the case. */
function SwimmingFish({ map, top }: { map: Texture; top: number }) {
  const ref = useRef<Group>(null)
  const body = useRef<Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime * 0.7
    g.position.set(Math.cos(t) * 0.26, top + 0.28 + Math.sin(t * 2.3) * 0.025, Math.sin(t) * 0.12)
    // nose (its +x) along the way it is going
    g.rotation.y = Math.atan2(-Math.cos(t) * 0.12, -Math.sin(t) * 0.26)
    if (body.current) body.current.rotation.y = Math.sin(clock.elapsedTime * 8) * 0.25
  })
  return (
    <group ref={ref}>
      <group ref={body}>
        {/* a slice of stone with the fish on both faces */}
        <mesh geometry={FISH_CORE} material={FISH_STONE} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0, s * 0.0056]}>
            <planeGeometry args={[0.48, 0.24]} />
            <meshStandardMaterial map={map} alphaTest={0.5} side={DoubleSide} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** A case with a slab of limestone in it, propped up, holding a fossil fish. */
export function FishCase({ mode }: { mode: 'normal' | 'swimming' }) {
  const t = useMemo(() => ({ slab: slabTexture(mode === 'swimming' ? 'empty' : 'normal'), fish: fishTexture() }), [mode])
  const top = 0.85
  return (
    <>
      <GlassCase w={1.1} d={0.6} top={top} hood={0.42} />
      <group position={[0, top + 0.02, 0.12]} rotation={[-0.9, 0, 0]}>
        <Block size={[0.56, 0.38, 0.035]} position={[0, 0.19, 0]} color="#d8c9a4" roughness={0.9} />
        <mesh position={[0, 0.19, 0.0185]}>
          <planeGeometry args={[0.54, 0.36]} />
          <meshStandardMaterial map={t.slab} roughness={0.9} />
        </mesh>
      </group>
      {/* the slab's stand */}
      <Block size={[0.3, 0.12, 0.03]} position={[0, top + 0.08, -0.08]} color="#1c1a19" rotation={[0.4, 0, 0]} />
      {mode === 'swimming' && <SwimmingFish map={t.fish} top={top} />}
    </>
  )
}

/** A low glass case of dinosaur eggs in their nest; `hatched` has one cracked open with a baby looking out. */
export function EggNest({ mode }: { mode: 'normal' | 'hatched' }) {
  const top = 0.8
  const eggs: [number, number, number][] = [
    [0, 0, 0],
    [-0.12, 0.05, 0.6],
    [0.12, 0.06, -0.4],
    [-0.06, -0.11, 1.2],
    [0.09, -0.1, -1.1],
    [-0.02, 0.13, 0.3],
  ]
  const shell = { color: '#b9a98a', roughness: 0.85 }
  return (
    <>
      <GlassCase w={0.6} d={0.6} top={top} hood={0.34} />
      {/* the nest: a shallow bowl of earth */}
      <mesh position={[0, top + 0.03, 0]} scale={[1, 0.25, 1]} receiveShadow>
        <sphereGeometry args={[0.22, 24, 12, 0, PI * 2, 0, PI / 2]} />
        <meshStandardMaterial color="#5a4632" roughness={1} />
      </mesh>
      {eggs.map(([x, z, r], i) =>
        mode === 'hatched' && i === 0 ? (
          <group key={i} position={[x, top + 0.05, z]}>
            {/* the bottom of the shell, with its lid knocked off beside it */}
            <mesh scale={[1, 1.35, 1]}>
              <sphereGeometry args={[0.055, 20, 12, 0, PI * 2, PI * 0.45, PI * 0.55]} />
              <meshStandardMaterial {...shell} side={DoubleSide} />
            </mesh>
            <mesh position={[0.1, -0.01, 0.07]} rotation={[2.4, 0.3, 0.4]} scale={[1, 1.35, 1]}>
              <sphereGeometry args={[0.055, 20, 10, 0, PI * 2, 0, PI * 0.4]} />
              <meshStandardMaterial {...shell} side={DoubleSide} />
            </mesh>
            <Hatchling />
          </group>
        ) : (
          <mesh key={i} position={[x, top + 0.07, z]} rotation={[PI / 2 - 0.3, 0, r]} scale={[1, 1.35, 1]} castShadow>
            <sphereGeometry args={[0.055, 20, 14]} />
            <meshStandardMaterial {...shell} />
          </mesh>
        ),
      )}
    </>
  )
}

/** A baby tyrannosaur's head poking out of its egg, looking about. */
function Hatchling() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.y = Math.sin(t * 0.9) * 0.7
    ref.current.rotation.z = Math.sin(t * 1.7) * 0.08
  })
  const skin = { color: '#6f8a4a', roughness: 0.7 }
  return (
    <group ref={ref} position={[0, 0.05, 0]}>
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.036, 16, 12]} />
        <meshStandardMaterial {...skin} />
      </mesh>
      <mesh position={[0.04, 0.02, 0]} scale={[1.4, 0.7, 0.8]}>
        <sphereGeometry args={[0.025, 14, 10]} />
        <meshStandardMaterial {...skin} />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s} position={[0.016, 0.045, s * 0.026]}>
          <mesh>
            <sphereGeometry args={[0.011, 10, 8]} />
            <meshStandardMaterial color="#f2d95a" roughness={0.3} />
          </mesh>
          <mesh position={[0.004, 0, s * 0.006]}>
            <sphereGeometry args={[0.006, 8, 6]} />
            <meshStandardMaterial color="#111" roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* the egg tooth and a tiny open mouth */}
      <mesh position={[0.074, 0.017, 0]} rotation={[0, 0, -PI / 2]}>
        <coneGeometry args={[0.004, 0.01, 6]} />
        <meshStandardMaterial color="#efe6cf" />
      </mesh>
      <mesh position={[0.05, 0.005, 0]} scale={[1.2, 0.3, 0.7]}>
        <sphereGeometry args={[0.02, 10, 6]} />
        <meshStandardMaterial color="#8a2a2a" />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// On the walls
// ---------------------------------------------------------------------------

/** The mammoth tusk on two steel brackets, its origin on the wall. */
export function Tusk() {
  return (
    <>
      <mesh geometry={TUSK_GEO} castShadow>
        <meshStandardMaterial color="#cbb58b" roughness={0.55} side={DoubleSide} />
      </mesh>
      {/* the broken base, capped */}
      <mesh position={[-1.05, -0.12, 0.2]} scale={[0.04, 0.085, 0.085]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#8c6a44" roughness={0.8} />
      </mesh>
      {TUSK_HOLDS.map(({ p, r }, i) => (
        <group key={i} position={[p.x, 0, 0]}>
          <Block size={[0.08, 0.16, 0.012]} position={[0, p.y - r - 0.06, 0.006]} color="#1e1f21" metalness={0.7} roughness={0.4} />
          <Block size={[0.025, 0.025, p.z]} position={[0, p.y - r - 0.02, p.z / 2]} color="#1e1f21" metalness={0.7} roughness={0.4} />
          {/* a cradle round the underside of the tusk */}
          <mesh material={STEEL} position={[0, p.y, p.z]} rotation={[0, PI / 2, PI]}>
            <torusGeometry args={[r + 0.008, 0.007, 6, 20, PI]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** A framed information panel flat on the wall, its origin at the back. */
export function InfoPanel({ map, w, h }: { map: Texture; w: number; h: number }) {
  return (
    <>
      <Block size={[w + 0.04, h + 0.04, 0.03]} position={[0, 0, 0.015]} color="#151d1c" roughness={0.5} />
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.25} roughness={0.7} />
      </mesh>
    </>
  )
}

/** A shallow glass-fronted case on the wall with a slab inside, origin at the back. */
export function WallCase({ map, w, h }: { map: Texture; w: number; h: number }) {
  const d = 0.12
  return (
    <>
      <Block size={[w + 0.06, h + 0.06, 0.02]} position={[0, 0, 0.01]} color="#2a1d15" roughness={0.5} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, h + 0.06, d]} position={[s * (w / 2 + 0.015), 0, d / 2]} color="#2a1d15" roughness={0.5} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} size={[w, 0.03, d]} position={[0, s * (h / 2 + 0.015), d / 2]} color="#2a1d15" roughness={0.5} />
      ))}
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.2} roughness={0.85} />
      </mesh>
      <mesh material={GLASS} position={[0, 0, d - 0.005]}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// Ammonite, meteorite, owl
// ---------------------------------------------------------------------------

/** One arm of the living ammonite: four segments, each curling a little more. */
function Tentacle({ phase, dir }: { phase: number; dir: number }) {
  const refs = useRef<(Group | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (g) g.rotation.z = Math.sin(t * 1.6 + phase + i * 0.7) * 0.35 + dir * 0.15
    })
  })
  const seg = (i: number, child: ReactNode) => (
    <group
      ref={(g) => {
        refs.current[i] = g
      }}
      position={i ? [0, 0.06, 0] : [0, 0, 0]}
    >
      <mesh geometry={TENTACLE_GEO} position={[0, 0.03, 0]} scale={1 - i * 0.15}>
        <meshStandardMaterial color="#c9879a" roughness={0.35} />
      </mesh>
      {child}
    </group>
  )
  return seg(0, seg(1, seg(2, seg(3, null))))
}

/**
 * A big ammonite upright on a stand, facing +z, origin under the stand.
 * `alive` has its owner back in it: tentacles out of the mouth and an eye.
 */
export function Ammonite({ alive }: { alive: boolean }) {
  const { geo, mouth, tangent, tilt, bottom } = AMMONITE
  // the shell's lowest point rests in the stand's cradle
  const lift = 0.11 - bottom
  // the tentacles reach out of the mouth along the shell's way of growing
  const out = Math.atan2(tangent.y, tangent.x) - PI / 2
  return (
    <>
      <Block size={[0.24, 0.04, 0.14]} position={[0, 0.02, 0]} color="#1c1a19" roughness={0.5} />
      <Block size={[0.03, 0.1, 0.03]} position={[0, 0.07, 0]} color="#1c1a19" roughness={0.5} />
      <group position={[0, lift, 0]} rotation={[0, 0, tilt]}>
        {/* ammonites are flat discs, not round snail shells */}
        <mesh geometry={geo} scale={[1, 1, 0.5]} castShadow>
          <meshStandardMaterial color="#9c7a52" roughness={0.45} metalness={0.15} side={DoubleSide} />
        </mesh>
        {alive && (
          <group position={[mouth.x, mouth.y, 0]} rotation={[0, 0, out]}>
            {/* a ring of arms round the mouth, splaying outwards */}
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * PI * 2
              return (
                <group key={i} position={[Math.cos(a) * 0.06, 0, Math.sin(a) * 0.03]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]}>
                  <Tentacle phase={i * 0.9} dir={Math.cos(a)} />
                </group>
              )
            })}
            {/* a big, wet eye either side, on the outside of the mouth */}
            {[1, -1].map((s) => (
              <group key={s} position={[0.09, 0.02, s * 0.045]}>
                <mesh>
                  <sphereGeometry args={[0.026, 14, 10]} />
                  <meshStandardMaterial color="#e9e2c8" roughness={0.15} />
                </mesh>
                <mesh position={[0, 0.006, s * 0.02]}>
                  <sphereGeometry args={[0.012, 10, 8]} />
                  <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
                </mesh>
              </group>
            ))}
          </group>
        )}
      </group>
    </>
  )
}

/** The meteorite on its round plinth; `glowing` has it lit up from inside, buzzing and lifting off. */
export function Meteorite({ glowing }: { glowing: boolean }) {
  const t = useMemo(() => ({ map: meteoriteTexture(), glow: veinTexture() }), [])
  const ref = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const rock = useRef<Mesh>(null)
  const top = 0.5
  useFrame(({ clock }) => {
    if (!glowing || !ref.current) return
    const t = clock.elapsedTime
    if (rock.current) (rock.current.material as MeshStandardMaterial).emissiveIntensity = 0.55 + Math.sin(t * 3) * 0.35
    // humming: a fine fast shiver, hovering a hand's breadth up
    ref.current.position.set(Math.sin(t * 61) * 0.004, top + 0.09 + Math.sin(t * 1.3) * 0.02, Math.cos(t * 53) * 0.004)
    if (ring.current) (ring.current.material as MeshStandardMaterial).emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.4
  })
  return (
    <>
      <mesh position={[0, top / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.42, top, 40]} />
        <meshStandardMaterial color="#2d2b29" roughness={0.6} />
      </mesh>
      {/* a plinth base and a pale stone top with a rounded edge */}
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.05, 40]} />
        <meshStandardMaterial color="#1c1a19" roughness={0.6} />
      </mesh>
      <mesh position={[0, top - 0.0125, 0]} receiveShadow>
        <cylinderGeometry args={[0.41, 0.41, 0.035, 40]} />
        <meshStandardMaterial color="#6e665a" roughness={0.8} />
      </mesh>
      <mesh position={[0, top - 0.015, 0]} rotation={[PI / 2, 0, 0]}>
        <torusGeometry args={[0.41, 0.015, 8, 48]} />
        <meshStandardMaterial color="#6e665a" roughness={0.8} />
      </mesh>
      <group ref={ref} position={[0, top, 0]} rotation={[0, 0.6, 0]}>
        {/* each variant has its own material, so the pulse never touches anything else */}
        <mesh ref={rock} geometry={METEORITE_GEO} castShadow>
          <meshStandardMaterial map={t.map} roughness={0.55} metalness={0.45} emissiveMap={glowing ? t.glow : null} emissive={glowing ? '#6dff9a' : '#000000'} emissiveIntensity={0} />
        </mesh>
      </group>
      {glowing && (
        <mesh ref={ring} position={[0, top + 0.008, 0]} rotation={[-PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.38, 40]} />
          <meshStandardMaterial color="#1a3a24" emissive="#6dff9a" emissiveIntensity={0.6} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}
    </>
  )
}

/** Turns its +z side to the player all the way round, like an owl. */
function OwlHead({ watching, children }: { watching: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null)
  const v = useRef(new Vector3())
  useFrame(({ camera }) => {
    const g = ref.current
    if (!watching || !g?.parent) return
    const p = g.parent.worldToLocal(v.current.copy(camera.position))
    g.rotation.y = Math.atan2(p.x - g.position.x, p.z - g.position.z)
  })
  return (
    <group ref={ref} position={[0, 0.2, 0]}>
      {children}
    </group>
  )
}

/** A long-eared owl on a branch, facing +z, its feet at the origin. */
function OwlBird({ watching }: { watching: boolean }) {
  const brown = { color: '#7a5a3a', roughness: 0.9 }
  const pale = { color: '#c8ab80', roughness: 0.9 }
  return (
    <>
      <mesh position={[0, 0.1, 0]} scale={[1, 1.35, 0.95]} castShadow>
        <sphereGeometry args={[0.07, 18, 14]} />
        <meshStandardMaterial {...brown} />
      </mesh>
      <mesh position={[0, 0.09, 0.025]} scale={[0.8, 1.2, 0.7]}>
        <sphereGeometry args={[0.07, 18, 14]} />
        <meshStandardMaterial {...pale} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.06, 0.1, -0.01]} rotation={[0.2, 0, s * 0.15]} scale={[0.35, 1.2, 0.9]}>
          <sphereGeometry args={[0.07, 14, 12]} />
          <meshStandardMaterial color="#5e4329" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.06, -0.07]} rotation={[-0.6, 0, 0]} scale={[0.6, 1.4, 0.3]}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color="#5e4329" roughness={0.9} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.025, 0.005, 0.02]} scale={[0.6, 0.4, 1]}>
          <sphereGeometry args={[0.02, 8, 6]} />
          <meshStandardMaterial color="#9a8458" roughness={0.8} />
        </mesh>
      ))}
      <OwlHead watching={watching}>
        <mesh scale={[1.1, 0.95, 1]} castShadow>
          <sphereGeometry args={[0.062, 18, 14]} />
          <meshStandardMaterial {...brown} />
        </mesh>
        {/* the facial disc, eyes, beak and ear tufts */}
        <mesh position={[0, -0.003, 0.03]} scale={[1.1, 0.95, 0.45]}>
          <sphereGeometry args={[0.055, 18, 14]} />
          <meshStandardMaterial color="#d8b98a" roughness={0.9} />
        </mesh>
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.024, 0.008, 0.052]}>
            <mesh>
              <sphereGeometry args={[0.014, 12, 10]} />
              <meshStandardMaterial color="#f08a1a" roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.009]}>
              <sphereGeometry args={[0.007, 10, 8]} />
              <meshStandardMaterial color="#080808" roughness={0.1} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.014, 0.062]} rotation={[PI / 2 + 0.4, 0, 0]}>
          <coneGeometry args={[0.008, 0.024, 6]} />
          <meshStandardMaterial color="#2a2420" roughness={0.4} />
        </mesh>
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 0.035, 0.06, 0.005]} rotation={[0, 0, -s * 0.3]}>
            <coneGeometry args={[0.012, 0.05, 6]} />
            <meshStandardMaterial color="#4e3721" roughness={0.9} />
          </mesh>
        ))}
      </OwlHead>
    </>
  )
}

/**
 * The stuffed owl under a glass dome, origin under its wooden base. `watching`
 * turns its head right round to follow you; `hanging` has it hanging upside
 * down from its branch like a bat.
 */
export function OwlDome({ mode }: { mode: 'normal' | 'watching' | 'hanging' }) {
  const dome = 0.74
  const branchY = 0.37
  // the upright branch stands to one side, so an owl hanging under the perch clears it
  const post = 0.12
  return (
    <>
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.19, 0.2, 0.05, 32]} />
        <meshStandardMaterial color="#3b2a1e" roughness={0.5} />
      </mesh>
      <mesh material={GLASS} position={[0, 0.05 + (dome - 0.17) / 2, 0]}>
        <cylinderGeometry args={[0.17, 0.17, dome - 0.17, 32, 1, true]} />
      </mesh>
      <mesh material={GLASS} position={[0, 0.05 + dome - 0.17, 0]}>
        <sphereGeometry args={[0.17, 32, 12, 0, PI * 2, 0, PI / 2]} />
      </mesh>
      {/* the branch, rising from a mossy stump */}
      <mesh position={[post, 0.08, 0]}>
        <cylinderGeometry args={[0.032, 0.042, 0.06, 12]} />
        <meshStandardMaterial color="#4d6a34" roughness={1} />
      </mesh>
      <mesh position={[post, (0.11 + branchY) / 2, 0]}>
        <cylinderGeometry args={[0.014, 0.02, branchY - 0.11, 10]} />
        <meshStandardMaterial color="#4a3826" roughness={0.9} />
      </mesh>
      <mesh position={[0, branchY, 0]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.016, 0.02, 0.3, 10]} />
        <meshStandardMaterial color="#4a3826" roughness={0.9} />
      </mesh>
      {mode === 'hanging' ? (
        <group position={[0, branchY - 0.012, 0]} rotation={[0, 0, PI]}>
          <OwlBird watching={false} />
        </group>
      ) : (
        <group position={[0, branchY + 0.012, 0]}>
          <OwlBird watching={mode === 'watching'} />
        </group>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Pteranodon
// ---------------------------------------------------------------------------

/** One wing: arm bones along its leading edge and the membrane behind, out along +z (or -z), tipped up a little. */
function Wing({ side, flap }: { side: 1 | -1; flap: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!flap || !ref.current) return
    ref.current.rotation.x = side * Math.sin(clock.elapsedTime * 2.2) * 0.45
  })
  const [shoulder, elbow, wrist, tip] = WING_BONES
  return (
    <group ref={ref} position={[0.04, 0.01, side * 0.05]}>
      <group scale={[1, 1, side]}>
        <group rotation={[-0.1, 0, 0]}>
          <mesh geometry={WING_GEO} material={MEMBRANE} castShadow />
          <Bone a={shoulder} b={elbow} r={0.02} />
          <Bone a={elbow} b={wrist} r={0.016} />
          <Bone a={wrist} b={tip} r={0.011} />
          {/* the three little clawed fingers at the wrist */}
          {[-1, 0, 1].map((f) => (
            <Bone key={f} a={wrist} b={[wrist[0] + 0.07, wrist[1] - 0.01, wrist[2] + f * 0.025]} r={0.005} knobs={false} />
          ))}
        </group>
      </group>
    </group>
  )
}

/**
 * A pteranodon cast hung from the ceiling on wires, gliding towards +x.
 * Its origin is the body; `wire` is how far up the ceiling is.
 */
export function Pteranodon({ flapping, wire }: { flapping: boolean; wire: number }) {
  return (
    <>
      {/* the wires: one in front of the wings, one behind, each to a little plate on the ceiling */}
      {[0.12, -0.18].map((x) => (
        <group key={x}>
          <mesh material={STEEL} position={[x, wire / 2, 0]}>
            <cylinderGeometry args={[0.002, 0.002, wire, 4]} />
          </mesh>
          <mesh material={STEEL} position={[x, wire - 0.005, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.01, 16]} />
          </mesh>
        </group>
      ))}
      {/* body, with a keel of breastbone under the chest */}
      <mesh scale={[2.0, 0.7, 0.74]} material={FOSSIL} castShadow>
        <sphereGeometry args={[0.09, 24, 16]} />
      </mesh>
      <mesh geometry={KNOB_GEO} material={FOSSIL_DARK} position={[0.05, -0.04, 0]} scale={[0.09, 0.03, 0.025]} />
      {/* neck and head, the beak long and the crest swept back */}
      <Bone a={[0.13, 0.02, 0]} b={[0.3, 0.08, 0]} r={0.022} />
      <group position={[0.33, 0.09, 0]} rotation={[0, 0, -0.12]} scale={1.25}>
        <mesh geometry={PTERO_HEAD_GEO} material={FOSSIL} castShadow />
        {[1, -1].map((s) => (
          <mesh key={s} geometry={KNOB_GEO} material={SOCKET} position={[-0.03, 0.035, s * 0.021]} scale={[0.014, 0.012, 0.006]} />
        ))}
      </group>
      {/* the stubby tail and the legs trailing behind, toes splayed */}
      <Bone a={[-0.14, 0, 0]} b={[-0.27, -0.01, 0]} r={0.012} />
      {[1, -1].map((s) => (
        <group key={s}>
          <Bone a={[-0.08, -0.025, s * 0.035]} b={[-0.34, -0.045, s * 0.11]} r={0.011} />
          {[-1, 0, 1].map((t) => (
            <Bone key={t} a={[-0.34, -0.045, s * 0.11]} b={[-0.41, -0.05, s * 0.11 + t * 0.022]} r={0.005} knobs={false} />
          ))}
        </group>
      ))}
      <Wing side={1} flap={flapping} />
      <Wing side={-1} flap={flapping} />
    </>
  )
}
