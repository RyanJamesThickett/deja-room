import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  LatheGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  type Group,
  type InstancedMesh,
  type Mesh,
  type RectAreaLight,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Block, Instanced, PanelLight, PI, type Placement } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { Outside } from '../../outside'
import type { Slice } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { ShadowFigure } from '../../figure'
import { FacesYou } from '../living/oddities'
import { FRIDGE_SHELVES, type FridgeKind } from './fridgeLayout'
import { SHOP_DOOR } from './front'
import { FridgeStock } from './fridgeStock'
import { rowZ, slots, type ShelfSpec } from './shelving'
import { BOX_DESIGNS, boxCover, CAN_DESIGNS, canLabel, matTexture, neonText, nightStreet, plaqueTexture } from './textures'

// ---------------------------------------------------------------------------
// Shelving and stock
// ---------------------------------------------------------------------------

/** A white metal shelving unit: a wall bay, or a double-sided aisle unit. */
export function Shelving({ spec }: { spec: ShelfSpec }) {
  const metal = { color: '#dfe4e8', metalness: 0.6, roughness: 0.35 }
  const { width: w, depth: d, height: h, levels, double } = spec
  const faces = double ? [1, -1] : [1]
  return (
    <>
      <Block size={[w, 0.1, d]} position={[0, 0.05, 0]} {...metal} radius={0.01} paint />
      {/* back panel, or the central divider of an aisle unit */}
      <Block
        size={[w, h, 0.03]}
        position={[0, h / 2, double ? 0 : -d / 2 + 0.015]}
        color="#c7cdd3"
        metalness={0.4}
        roughness={0.5}
        radius={0.005}
        paint
      />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, h, d]} position={[s * (w / 2 - 0.015), h / 2, 0]} {...metal} radius={0.005} paint />
      ))}
      {/* a rounded cap along the top of the unit, and a kick plate under the bottom shelf of each stocked face */}
      <Block size={[w, 0.03, double ? 0.07 : d - 0.004]} position={[0, h + 0.015, 0]} color="#c7cdd3" metalness={0.4} roughness={0.5} radius={0.012} paint />
      {faces.map((f) => (
        <Block key={f} size={[w - 0.06, 0.07, 0.012]} position={[0, 0.045, f * (d / 2 + 0.002)]} color="#1d6b63" roughness={0.5} radius={0.004} />
      ))}
      {levels.map((y) => (
        <group key={y}>
          <Block size={[w - 0.06, 0.025, d - 0.02]} position={[0, y, 0]} {...metal} radius={0.004} paint />
          {faces.map((f) => (
            // yellow price strip along each stocked edge
            <Block key={f} size={[w - 0.06, 0.04, 0.01]} position={[0, y - 0.005, f * (d / 2 - 0.005)]} color="#ffde21" roughness={0.6} radius={0.003} />
          ))}
        </group>
      ))}
    </>
  )
}

const CAN_GEO = new CylinderGeometry(0.038, 0.038, 0.11, 28)
const CAN_TOP = new MeshStandardMaterial({ color: '#c9ced6', metalness: 0.9, roughness: 0.3 })
/** The rolled rim round the top of a tin. */
const CAN_RIM = new TorusGeometry(0.0365, 0.0028, 6, 28)

function useCanMaterials() {
  return useMemo(
    () => CAN_DESIGNS.map((d) => [new MeshStandardMaterial({ map: canLabel(d), roughness: 0.4, metalness: 0.3 }), CAN_TOP, CAN_TOP]),
    [],
  )
}

/** Rows of tins on every shelf of one face, apart from any shelves in `skip`. */
export function Tins({ spec, face = 1, skip = [] }: { spec: ShelfSpec; face?: 1 | -1; skip?: number[] }) {
  const materials = useCanMaterials()
  const { byDesign, rims } = useMemo(() => {
    const out: Placement[][] = CAN_DESIGNS.map(() => [])
    const rims: Placement[] = []
    const rng = mulberry32(21 + face)
    const z = rowZ(spec, 0.07)
    slots(spec, 0.086).forEach(({ y, xs }, row) => {
      if (skip.includes(row)) return
      xs.forEach((x, i) => {
        const m = (row * 2 + Math.floor(i / 4)) % CAN_DESIGNS.length
        // the name is printed a quarter of the way round the label, so turn it to face the aisle
        const rot = -PI / 2 + (rng() - 0.5) * 0.3
        // two tins deep, the back row slightly hidden
        for (const dz of [0, -0.09]) {
          out[m].push({ at: [x, y + 0.055, z + dz], rot: [0, rot, 0] })
          rims.push({ at: [x, y + 0.109, z + dz], rot: [PI / 2, 0, 0] })
        }
      })
    })
    return { byDesign: out, rims }
  }, [spec, face, skip])
  return (
    <group rotation={[0, face === 1 ? 0 : PI, 0]}>
      {byDesign.map((items, m) => (
        <Instanced key={m} geometry={CAN_GEO} material={materials[m]} items={items} />
      ))}
      <Instanced geometry={CAN_RIM} material={CAN_TOP} items={rims} />
    </group>
  )
}

/** Rubber ducks in place of tins, on the shelves in `only`. */
export function DuckStock({ spec, face = 1, only }: { spec: ShelfSpec; face?: 1 | -1; only: number[] }) {
  const z = rowZ(spec, 0.08)
  const spots: Vec3[] = []
  slots(spec, 0.165).forEach(({ y, xs }, row) => {
    if (only.includes(row)) xs.forEach((x) => spots.push([x, y, z]))
  })
  return (
    <group rotation={[0, face === 1 ? 0 : PI, 0]}>
      {spots.map((at, i) => (
        <group key={i} position={at} rotation={[0, (i % 3) * 0.2 - 0.2, 0]}>
          <Model id="rubber_duck_toy" scale={0.42} paint={false} />
        </group>
      ))}
    </group>
  )
}

/** A cereal box, its card edges just softened (one geometry shared by every box). */
const CEREAL_BOX = new RoundedBoxGeometry(0.19, 0.28, 0.07, 2, 0.004)

function useBoxMaterials() {
  return useMemo(
    () =>
      BOX_DESIGNS.map((d) => {
        const front = new MeshStandardMaterial({ map: boxCover(d), roughness: 0.6 })
        const side = new MeshStandardMaterial({ color: d.bg, roughness: 0.6 })
        // box faces: +x, -x, +y, -y, +z (front), -z
        return [side, side, side, side, front, side]
      }),
    [],
  )
}

/** Cereal boxes standing on one face; upside down or shrunk for the swaps. */
export function CerealBoxes({
  spec,
  face = 1,
  upside = false,
  tiny = false,
  levels,
}: {
  spec: ShelfSpec
  face?: 1 | -1
  upside?: boolean
  tiny?: boolean
  /** Which shelves `upside`/`tiny` apply to (all of them if left out). */
  levels?: number[]
}) {
  const materials = useBoxMaterials()
  const z = rowZ(spec, 0.06)
  const boxes: { at: Vec3; m: number; odd: boolean }[] = []
  slots(spec, 0.215).forEach(({ y, xs }, row) =>
    xs.forEach((x, i) => boxes.push({ at: [x, y, z], m: (row + i + (face === 1 ? 0 : 2)) % BOX_DESIGNS.length, odd: !levels || levels.includes(row) })),
  )
  return (
    <group rotation={[0, face === 1 ? 0 : PI, 0]}>
      {boxes.map((b, i) => (
        <group key={i} position={b.at} scale={tiny && b.odd ? 0.4 : 1}>
          <mesh geometry={CEREAL_BOX} material={materials[b.m]} position={[0, 0.14, 0]} rotation={[0, 0, upside && b.odd ? PI : 0]} />
        </group>
      ))}
    </group>
  )
}

/** Bottles of fizzy pop on one face (the snack aisle; it never changes). */
export function PopBottles({ spec, face = 1 }: { spec: ShelfSpec; face?: 1 | -1 }) {
  const byColour = useMemo(() => {
    const out: Placement[][] = BOTTLE_COLOURS.map(() => [])
    const z = rowZ(spec, 0.07)
    slots(spec, 0.08).forEach(({ y, xs }, row) =>
      xs.forEach((x, i) => {
        const c = (row + Math.floor(i / 3)) % BOTTLE_COLOURS.length
        for (const dz of [0, -0.09]) out[c].push({ at: [x, y, z + dz] })
      }),
    )
    return out
  }, [spec])
  return (
    <group rotation={[0, face === 1 ? 0 : PI, 0]}>
      {byColour.map((items, c) => (
        <Instanced key={c} geometry={BOTTLE} material={BOTTLE_MATS[c]} items={items} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Counter, till, lucky cat, jars
// ---------------------------------------------------------------------------

/**
 * Shop counter built along local x. The customer side (striped panel) faces +z;
 * the cashier side faces -z and is open, with two under-counter shelves.
 */
export function Counter({ length }: { length: number }) {
  return (
    <>
      {/* customer-facing panel, ends and kick plinth */}
      <Block size={[length, 0.82, 0.04]} position={[0, 0.49, 0.255]} color="#c0392b" roughness={0.45} radius={0.01} paint />
      {/* recessed kick plinth along the customer's side */}
      <Block size={[length - 0.06, 0.08, 0.03]} position={[0, 0.04, 0.235]} color="#3a2a22" roughness={0.7} radius={0.004} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.04, 0.9, 0.55]} position={[s * (length / 2 - 0.02), 0.45, 0]} color="#c0392b" roughness={0.45} radius={0.01} />
      ))}
      <Block size={[length - 0.08, 0.08, 0.5]} position={[0, 0.04, 0]} color="#3a2a22" roughness={0.7} radius={0.004} />
      {[0.25, 0.55].map((y) => (
        <Block key={y} size={[length - 0.04, 0.03, 0.01]} position={[0, y, 0.28]} color="#f2efe8" roughness={0.4} radius={0.004} />
      ))}
      {/* cashier side: shelves for bags, receipt rolls and the float */}
      {[0.1, 0.45].map((y) => (
        <Block key={y} size={[length - 0.08, 0.025, 0.48]} position={[0, y, 0]} color="#e8e2d6" roughness={0.6} radius={0.004} />
      ))}
      {/* receipt rolls, the cash float tin and a stack of carrier bags */}
      <group position={[-0.55 * (length / 2), 0.4625, -0.02]}>
        {[-0.09, 0, 0.09].map((x) => (
          <mesh key={x} geometry={ROLL_PAPER} material={ROLL_MAT} position={[x, 0.04, 0]} rotation={[PI / 2, 0, 0]} />
        ))}
      </group>
      <group position={[-0.15 * (length / 2), 0.4625, -0.02]}>
        <Block size={[0.26, 0.1, 0.2]} position={[0, 0.05, 0]} color="#7a8f9c" metalness={0.5} roughness={0.4} radius={0.01} />
        <Block size={[0.27, 0.02, 0.21]} position={[0, 0.1, 0]} color="#5f7380" metalness={0.5} roughness={0.4} radius={0.006} />
        <Block size={[0.08, 0.015, 0.02]} position={[0, 0.115, 0]} color="#2a2f35" roughness={0.5} radius={0.006} />
      </group>
      <group position={[0.3 * (length / 2), 0.4625, -0.02]}>
        {[0, 1, 2].map((k) => (
          <group key={k} position={[(k % 2) * 0.012, 0.012 + k * 0.024, 0]} rotation={[0, (k - 1) * 0.08, 0]}>
            <Block size={[0.26, 0.022, 0.3]} color="#f4f1ea" roughness={0.8} radius={0.008} />
            <Block size={[0.08, 0.023, 0.3]} position={[0.04, 0, 0]} color="#1f6bff" roughness={0.8} radius={0.004} />
          </group>
        ))}
      </group>
      {/* the top overhangs the open end and the customer's side, but stops at the wall */}
      <Block size={[length + 0.03, 0.05, 0.62]} position={[-0.015, 0.925, 0.02]} color="#f2efe8" roughness={0.25} radius={0.01} />
    </>
  )
}

const ROLL_PAPER = new CylinderGeometry(0.04, 0.04, 0.08, 24)
const ROLL_MAT = new MeshStandardMaterial({ color: '#f7f5ef', roughness: 0.9 })
const SPOKE = new CylinderGeometry(0.006, 0.006, 0.13, 8)

/** The cashier's stool. */
export function Stool() {
  return (
    <>
      <mesh position={[0, 0.68, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.16, 0.06, 32]} />
        <meshStandardMaterial color="#1f1f22" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.64, 12]} />
        <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.012, 8, 32]} />
        <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.25} />
      </mesh>
      {/* spokes holding the foot ring to the pole */}
      {[0, 1, 2].map((i) => {
        const a = (i * 2 * PI) / 3
        return (
          <mesh key={i} geometry={SPOKE} position={[Math.cos(a) * 0.085, 0.3, Math.sin(a) * 0.085]} rotation={[0, -a, PI / 2]}>
            <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.25} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.04, 32]} />
        <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.25} />
      </mesh>
    </>
  )
}

// lucky cat parts, shared by every cat (the pair swap draws two)
const CAT_BODY = new LatheGeometry(
  [
    [0, 0],
    [0.062, 0],
    [0.071, 0.008],
    [0.077, 0.035],
    [0.074, 0.075],
    [0.062, 0.11],
    [0.045, 0.135],
    [0.026, 0.15],
    [0, 0.156],
  ].map(([x, y]) => new Vector2(x, y)),
  32,
)
const CAT_HEAD = new SphereGeometry(0.078, 32, 24)
const CAT_EAR = new ConeGeometry(0.028, 0.052, 16)
const CAT_EAR_INNER = new ConeGeometry(0.017, 0.034, 12)
const CAT_BALL = new SphereGeometry(1, 16, 12)
const CAT_ARM = new CapsuleGeometry(0.019, 0.05, 6, 16)
const CAT_WHISKER = new CylinderGeometry(0.0012, 0.0012, 0.05, 6)
const CAT_COLLAR = new TorusGeometry(0.05, 0.009, 10, 36)
const CAT_COIN = new CylinderGeometry(1, 1, 0.008, 32)
const CAT_TAIL = new TorusGeometry(0.03, 0.011, 8, 20, PI * 1.2)
const CAT_WHITE = new MeshStandardMaterial({ color: '#fbf7ee', roughness: 0.3 })
const CAT_PINK = new MeshStandardMaterial({ color: '#ff8aa8', roughness: 0.4 })
const CAT_RED = new MeshStandardMaterial({ color: '#e0262a', roughness: 0.4 })
const CAT_GOLD = new MeshStandardMaterial({ color: '#e2b13c', metalness: 0.9, roughness: 0.25 })
const CAT_INK = new MeshBasicMaterial({ color: '#1a1a1a' })
const CAT_SHINE = new MeshBasicMaterial({ color: '#ffffff' })

/** Maneki-neko on its cushion, built facing +z, with a paw that waves and a koban coin held to its tummy. */
export function LuckyCat({ mirrored = false, staring = false }: { mirrored?: boolean; staring?: boolean }) {
  const paw = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (paw.current) paw.current.rotation.z = (mirrored ? -1 : 1) * (0.25 + Math.sin(clock.elapsedTime * 4) * 0.35)
  })
  const head = (
    <group>
      <mesh geometry={CAT_HEAD} material={CAT_WHITE} castShadow userData={{ paint: true }} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.047, 0.062, -0.006]} rotation={[0, 0, -s * 0.35]}>
          <mesh geometry={CAT_EAR} material={CAT_WHITE} userData={{ paint: true }} />
          <mesh geometry={CAT_EAR_INNER} material={CAT_PINK} position={[0, -0.006, 0.012]} rotation={[0.25, 0, 0]} />
        </group>
      ))}
      {/* big round eyes with a glint, a pink nose, whiskers out of the cheeks */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={CAT_BALL} material={CAT_INK} position={[s * 0.03, 0.014, 0.0705]} scale={[0.012, 0.015, 0.0055]} />
          <mesh geometry={CAT_BALL} material={CAT_SHINE} position={[s * 0.03 + 0.004, 0.019, 0.0755]} scale={0.0035} />
          {[-1, 0, 1].map((k) => (
            <mesh
              key={k}
              geometry={CAT_WHISKER}
              material={CAT_INK}
              position={[s * 0.066, -0.014 + k * 0.009, 0.046]}
              rotation={[0, s * 0.5, PI / 2 + s * k * 0.18]}
            />
          ))}
        </group>
      ))}
      <mesh geometry={CAT_BALL} material={CAT_PINK} position={[0, -0.008, 0.0765]} scale={[0.01, 0.007, 0.005]} />
    </group>
  )
  return (
    <group scale={[mirrored ? -1 : 1, 1, 1]}>
      {/* the red cushion it sits on, with gold tassels */}
      <Block size={[0.18, 0.03, 0.16]} position={[0, 0.015, 0]} color="#d81e1e" roughness={0.6} radius={0.012} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={CAT_BALL} material={CAT_GOLD} position={[sx * 0.086, 0.015, sz * 0.076]} scale={0.009} />))}
      <group position={[0, 0.028, 0]}>
        <mesh geometry={CAT_BODY} material={CAT_WHITE} scale={[1, 1, 0.88]} castShadow userData={{ paint: true }} />
        {/* front feet */}
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={CAT_BALL} material={CAT_WHITE} position={[s * 0.034, 0.012, 0.058]} scale={[0.022, 0.014, 0.024]} userData={{ paint: true }} />
        ))}
        {/* collar with a bell */}
        <mesh geometry={CAT_COLLAR} material={CAT_RED} position={[0, 0.137, 0.003]} rotation={[PI / 2 + 0.08, 0, 0]} />
        <mesh geometry={CAT_BALL} material={CAT_GOLD} position={[0, 0.122, 0.052]} scale={0.013} />
        {/* the koban, held to the tummy by the other paw */}
        <mesh geometry={CAT_COIN} material={CAT_GOLD} position={[0.006, 0.064, 0.07]} rotation={[PI / 2 - 0.12, 0, 0]} scale={[0.03, 1, 0.042]} />
        <Block size={[0.014, 0.034, 0.004]} position={[0.006, 0.064, 0.0745]} rotation={[-0.12, 0, 0]} color="#d81e1e" roughness={0.5} radius={0.0015} />
        <mesh geometry={CAT_BALL} material={CAT_WHITE} position={[-0.034, 0.075, 0.072]} scale={[0.021, 0.024, 0.02]} userData={{ paint: true }} />
        {/* a curl of tail at the back */}
        <mesh geometry={CAT_TAIL} material={CAT_WHITE} position={[0.03, 0.035, -0.066]} rotation={[0, -0.5, 0.6]} userData={{ paint: true }} />
      </group>
      {staring ? <FacesYou position={[0, 0.24, 0]}>{head}</FacesYou> : <group position={[0, 0.24, 0]}>{head}</group>}
      {/* waving paw: arm up from the shoulder, round paw with a pink pad */}
      <group ref={paw} position={[0.058, 0.16, 0.03]}>
        <mesh geometry={CAT_ARM} material={CAT_WHITE} position={[0.006, 0.035, 0]} castShadow userData={{ paint: true }} />
        <mesh geometry={CAT_BALL} material={CAT_WHITE} position={[0.006, 0.075, 0.004]} scale={0.024} userData={{ paint: true }} />
        <mesh geometry={CAT_BALL} material={CAT_PINK} position={[0.006, 0.074, 0.025]} scale={[0.011, 0.01, 0.004]} />
      </group>
    </group>
  )
}

const JAR = new LatheGeometry(
  [
    [0, 0],
    [0.054, 0],
    [0.062, 0.012],
    [0.064, 0.03],
    [0.064, 0.158],
    [0.056, 0.182],
    [0.05, 0.188],
    [0.05, 0.204],
    [0, 0.204],
  ].map(([x, y]) => new Vector2(x, y)),
  32,
)
const JAR_LID = new CylinderGeometry(0.055, 0.055, 0.026, 28)
const JAR_LID_RIM = new TorusGeometry(0.055, 0.0035, 6, 32)
const JAR_BRINE = new CylinderGeometry(0.059, 0.059, 0.15, 28)
const JAR_LABEL = new CylinderGeometry(0.0655, 0.0655, 0.03, 32, 1, true)
const PICKLE = new SphereGeometry(0.0145, 12, 8)
const JAR_EYE = new SphereGeometry(0.019, 14, 10)
const JAR_PUPIL = new SphereGeometry(0.0085, 10, 8)
const JAR_GLASS = new MeshPhysicalMaterial({ color: '#eafff4', transparent: true, opacity: 0.28, roughness: 0.05, clearcoat: 1, depthWrite: false })
const JAR_RED = new MeshStandardMaterial({ color: '#d43a2c', metalness: 0.5, roughness: 0.4 })
// a paper label all the way round, so it's seen through the glass from behind too
const JAR_PAPER = new MeshStandardMaterial({ color: '#f7ecc8', roughness: 0.8, side: DoubleSide })
const JAR_EYE_WHITE = new MeshStandardMaterial({ color: '#fffbe6', roughness: 0.2 })
const JAR_IRIS = new MeshBasicMaterial({ color: '#1f6bff' })
const JAR_XS = [-0.5, -0.25, 0, 0.25, 0.5]

/** A row of jars on a shelf: pickles, eyeballs, or something glowing. */
export function Jars({ contents }: { contents: 'pickles' | 'eyes' | 'glow' }) {
  const glow = contents === 'glow'
  const fill = useMemo(() => {
    const rng = mulberry32(contents.length)
    const pieces: Placement[] = []
    const whites: Placement[] = []
    const pupils: Placement[] = []
    for (const x of JAR_XS)
      for (let i = 0; i < 16; i++) {
        const a = rng() * PI * 2
        const r = rng() * 0.028
        // packed in from the bottom of the jar to the top of the brine
        const at: Vec3 = [x + Math.cos(a) * r, 0.036 + rng() * 0.094, Math.sin(a) * r]
        pieces.push({ at, rot: [rng() * PI, rng() * PI, 0.4 + rng()], scale: [1, 2.3, 1] })
        whites.push({ at })
        pupils.push({ at: [at[0], at[1], at[2] + 0.015] })
      }
    return { pieces, whites, pupils }
  }, [contents])
  const brine = useMemo(
    () =>
      new MeshStandardMaterial({
        color: glow ? '#ff4fd8' : '#c9d86a',
        emissive: glow ? '#ff4fd8' : '#000000',
        emissiveIntensity: glow ? 1.2 : 0,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    [glow],
  )
  const pickle = useMemo(
    () =>
      new MeshStandardMaterial({
        color: glow ? '#fff0fb' : '#4f6b22',
        emissive: glow ? '#ff4fd8' : '#000000',
        emissiveIntensity: glow ? 1.5 : 0,
        roughness: 0.5,
      }),
    [glow],
  )
  return (
    <>
      {JAR_XS.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh geometry={JAR} material={JAR_GLASS} renderOrder={2} />
          <mesh geometry={JAR_LID} material={JAR_RED} position={[0, 0.215, 0]} />
          <mesh geometry={JAR_LID_RIM} material={JAR_RED} position={[0, 0.204, 0]} rotation={[PI / 2, 0, 0]} />
          <mesh geometry={JAR_LABEL} material={JAR_PAPER} position={[0, 0.032, 0]} />
          <mesh geometry={JAR_BRINE} material={brine} position={[0, 0.088, 0]} userData={{ paint: true }} />
        </group>
      ))}
      {contents === 'eyes' ? (
        <>
          <Instanced geometry={JAR_EYE} material={JAR_EYE_WHITE} items={fill.whites} />
          <Instanced geometry={JAR_PUPIL} material={JAR_IRIS} items={fill.pupils} />
        </>
      ) : (
        <Instanced geometry={PICKLE} material={pickle} items={fill.pieces} />
      )}
      {glow && <pointLight position={[0, 0.15, 0.25]} intensity={1} distance={2} decay={2} color="#ff4fd8" />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Gumball machine
// ---------------------------------------------------------------------------

const GUM_COLOURS = ['#ff3131', '#1f6bff', '#ffde21', '#2fbf71', '#ff3fa4', '#ff8a1f']
const GUM_FOOT = new CylinderGeometry(0.16, 0.19, 0.05, 32)
const GUM_POLE = new CylinderGeometry(0.03, 0.04, 0.56, 20)
const GUM_COLLAR = new CylinderGeometry(0.06, 0.05, 0.05, 24)
const GUM_BODY = new LatheGeometry(
  [
    [0, 0],
    [0.07, 0],
    [0.084, 0.02],
    [0.1, 0.1],
    [0.118, 0.2],
    [0.135, 0.25],
    [0.142, 0.268],
    [0.134, 0.285],
    [0, 0.285],
  ].map(([x, y]) => new Vector2(x, y)),
  32,
)
const GUM_KNOB = new CylinderGeometry(0.032, 0.032, 0.022, 24)
const GUM_LID = new CylinderGeometry(0.07, 0.085, 0.04, 28)
const GUM_TOP = new SphereGeometry(0.03, 20, 12, 0, PI * 2, 0, PI / 2)
const GUM_RED = new MeshStandardMaterial({ color: '#e0262a', metalness: 0.4, roughness: 0.35 })
const GUM_CHROME = new MeshStandardMaterial({ color: '#c9ced6', metalness: 0.9, roughness: 0.25 })

export function GumballMachine({ fill }: { fill: 'gum' | 'eyes' | 'empty' }) {
  const balls = useRef<InstancedMesh>(null)
  const pupils = useRef<InstancedMesh>(null)
  const spots = useMemo(() => {
    const rng = mulberry32(8)
    const out: Vec3[] = []
    while (out.length < 46) {
      const p: Vec3 = [(rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3]
      if (Math.hypot(...p) < 0.135 && p[1] < 0.06) out.push(p)
    }
    return out
  }, [])
  // place the balls once, before the first frame is drawn
  useLayoutEffect(() => {
    const m = balls.current
    if (!m) return
    const o = new Object3D()
    spots.forEach((p, i) => {
      o.position.set(...p)
      o.lookAt(0, 0, 2) // eyeballs all look out at the shop
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      if (fill === 'gum') m.setColorAt(i, new Color(GUM_COLOURS[i % GUM_COLOURS.length]))
      if (pupils.current) {
        o.translateZ(0.019)
        o.updateMatrix()
        pupils.current.setMatrixAt(i, o.matrix)
      }
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    if (pupils.current) pupils.current.instanceMatrix.needsUpdate = true
  }, [spots, fill])
  return (
    <>
      {/* a weighted foot, a chrome pole, and the bell-shaped body with the coin mechanism */}
      <mesh geometry={GUM_FOOT} material={GUM_RED} position={[0, 0.025, 0]} castShadow receiveShadow userData={{ paint: true }} />
      <mesh geometry={GUM_POLE} material={GUM_CHROME} position={[0, 0.33, 0]} castShadow />
      <mesh geometry={GUM_COLLAR} material={GUM_CHROME} position={[0, 0.62, 0]} />
      <mesh geometry={GUM_BODY} material={GUM_RED} position={[0, 0.62, 0]} castShadow userData={{ paint: true }} />
      <Block size={[0.13, 0.12, 0.03]} position={[0, 0.8, 0.108]} rotation={[-0.2, 0, 0]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.01} />
      <mesh geometry={GUM_KNOB} material={GUM_CHROME} position={[0, 0.8, 0.135]} rotation={[PI / 2 - 0.2, 0, 0]} />
      <Block size={[0.08, 0.016, 0.016]} position={[0, 0.8, 0.152]} rotation={[-0.2, 0, 0.6]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.006} />
      {/* the chute the gumball drops out of */}
      <Block size={[0.08, 0.055, 0.05]} position={[0, 0.69, 0.092]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.012} />
      <Block size={[0.056, 0.03, 0.01]} position={[0, 0.692, 0.115]} color="#1a1a1a" roughness={0.6} radius={0.004} />
      <group position={[0, 1.06, 0]}>
        {fill !== 'empty' && (
          <instancedMesh ref={balls} args={[undefined, undefined, spots.length]} key={fill}>
            <sphereGeometry args={[0.022, 14, 10]} />
            <meshStandardMaterial color={fill === 'eyes' ? '#fffbe6' : '#ffffff'} roughness={0.25} />
          </instancedMesh>
        )}
        {fill === 'eyes' && (
          <instancedMesh ref={pupils} args={[undefined, undefined, spots.length]}>
            <sphereGeometry args={[0.008, 10, 8]} />
            <meshBasicMaterial color="#111" />
          </instancedMesh>
        )}
        <mesh renderOrder={2}>
          <sphereGeometry args={[0.16, 40, 28]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.22} roughness={0.03} clearcoat={1} depthWrite={false} />
        </mesh>
        {/* lid and knob on top */}
        <mesh geometry={GUM_LID} material={GUM_RED} position={[0, 0.158, 0]} userData={{ paint: true }} />
        <mesh geometry={GUM_TOP} material={GUM_RED} position={[0, 0.178, 0]} userData={{ paint: true }} />
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Drinks fridge (front is +z)
// ---------------------------------------------------------------------------

const BOTTLE = new LatheGeometry(
  [
    [0, 0],
    [0.032, 0],
    [0.034, 0.02],
    [0.034, 0.15],
    [0.016, 0.21],
    [0.012, 0.25],
    [0, 0.25],
  ].map(([x, y]) => new Vector2(x, y)),
  20,
)
const BOTTLE_COLOURS = ['#ff3131', '#2fbf71', '#ff8a1f', '#16d0ff', '#8a4dff']
const BOTTLE_MATS = BOTTLE_COLOURS.map((color) => new MeshStandardMaterial({ color, roughness: 0.15, transparent: true, opacity: 0.88 }))

const EYEBALL = new SphereGeometry(0.27, 48, 32)
const IRIS = new SphereGeometry(0.2715, 40, 8, 0, PI * 2, 0, 0.46)
const PUPIL_CAP = new SphereGeometry(0.273, 32, 4, 0, PI * 2, 0, 0.2)
const FRIDGE_SIGNS: Record<FridgeKind, string> = { fizzy: 'ICE COLD', water: 'WATER', dairy: 'MILK' }

export function Fridge({ contents, kind = 'fizzy' }: { contents: 'drinks' | 'empty' | 'eye'; kind?: FridgeKind }) {
  const eye = useRef<Group>(null)
  useFrame(({ camera }) => {
    if (eye.current) eye.current.lookAt(camera.position)
  })
  const rows = FRIDGE_SHELVES
  const sign = useMemo(() => plaqueTexture(FRIDGE_SIGNS[kind], '#1f6bff', '#ffffff'), [kind])
  return (
    <>
      {/* a hollow cabinet: back, sides, base and header around a glass door */}
      <Block size={[1.2, 2.0, 0.04]} position={[0, 1.0, -0.33]} color="#f4f4f0" roughness={0.35} radius={0.01} paint />
      {[-1, 1].map((sx) => (
        <Block key={sx} size={[0.06, 2.0, 0.7]} position={[sx * 0.57, 1.0, 0]} color="#f4f4f0" roughness={0.35} radius={0.02} paint />
      ))}
      <Block size={[1.2, 0.16, 0.7]} position={[0, 0.08, 0]} color="#f4f4f0" roughness={0.35} radius={0.02} paint />
      <Block size={[1.2, 0.26, 0.7]} position={[0, 1.87, 0]} color="#f4f4f0" roughness={0.35} radius={0.02} paint />
      {/* lit back panel */}
      <mesh position={[0, 0.95, -0.305]}>
        <planeGeometry args={[1.08, 1.58]} />
        <meshStandardMaterial color="#cfe9ff" emissive="#9fd6ff" emissiveIntensity={0.55} />
      </mesh>
      {/* the eye has shoved the shelves out of its way */}
      {contents !== 'eye' &&
        rows.map((y) => (
          <Block key={y} size={[1.08, 0.02, 0.6]} position={[0, y - 0.02, 0]} color="#c9ced6" metalness={0.7} roughness={0.3} radius={0.004} />
        ))}
      {contents === 'drinks' && <FridgeStock kind={kind} />}
      {contents === 'eye' && (
        <group ref={eye} position={[0, 0.95, 0]}>
          <mesh geometry={EYEBALL} castShadow>
            <meshStandardMaterial color="#fffbe6" roughness={0.15} />
          </mesh>
          {/* iris and pupil are caps of the eyeball itself, so they sit on its curve */}
          <mesh geometry={IRIS} rotation={[PI / 2, 0, 0]}>
            <meshStandardMaterial color="#2fbf71" roughness={0.3} />
          </mesh>
          <mesh geometry={PUPIL_CAP} rotation={[PI / 2, 0, 0]}>
            <meshBasicMaterial color="#050505" />
          </mesh>
          <mesh position={[0.045, 0.05, 0.262]}>
            <sphereGeometry args={[0.018, 12, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}
      {/* glass door, handle, sign */}
      <mesh position={[0, 0.95, 0.36]} renderOrder={2}>
        <planeGeometry args={[1.08, 1.68]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.15} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      {/* the door's frame round the glass */}
      {[-1, 1].map((s) => (
        <Block key={`v${s}`} size={[0.05, 1.68, 0.035]} position={[s * 0.515, 0.95, 0.365]} color="#e6e6e0" roughness={0.35} radius={0.01} paint />
      ))}
      {[0.135, 1.765].map((y) => (
        <Block key={`h${y}`} size={[1.08, 0.05, 0.035]} position={[0, y, 0.365]} color="#e6e6e0" roughness={0.35} radius={0.01} paint />
      ))}
      {/* bar handle on two stand-offs */}
      <Block size={[0.03, 0.62, 0.03]} position={[0.47, 1.0, 0.425]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.012} />
      {[0.75, 1.25].map((y) => (
        <Block key={y} size={[0.022, 0.03, 0.05]} position={[0.47, y, 0.395]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.008} />
      ))}
      <Block size={[1.1, 0.2, 0.02]} position={[0, 1.87, 0.36]} color="#1f6bff" emissive="#1f6bff" emissiveIntensity={0.4} radius={0.01} />
      <mesh position={[0, 1.87, 0.3715]}>
        <planeGeometry args={[0.56, 0.21]} />
        <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.35} />
      </mesh>
      <pointLight position={[0, 1.0, 0.8]} intensity={1} distance={3} decay={2} color="#bfe6ff" />
    </>
  )
}

// ---------------------------------------------------------------------------
// Neon sign, security camera, strip lights
// ---------------------------------------------------------------------------

const NEON_STUD = new CylinderGeometry(0.014, 0.014, 0.012, 16)

export function NeonSign({ text, colour }: { text: string; colour: string }) {
  const map = useMemo(() => neonText(text, colour), [text, colour])
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    // the odd neon stutter
    if (ref.current) ref.current.visible = Math.sin(clock.elapsedTime * 13) > -0.98
  })
  return (
    <>
      <Block size={[1.7, 0.5, 0.03]} position={[0, 0, 0.015]} color="#151515" roughness={0.6} radius={0.01} />
      {/* chrome stand-offs holding the board to the wall */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => <mesh key={`${sx}${sy}`} geometry={NEON_STUD} material={GUM_CHROME} position={[sx * 0.8, sy * 0.2, 0.034]} rotation={[PI / 2, 0, 0]} />),
      )}
      <mesh ref={ref} position={[0, 0, 0.035]} userData={{ paint: true }}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshBasicMaterial map={map} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0.4]} intensity={1.2} distance={3} decay={2} color={colour} />
    </>
  )
}

const CAM_PLATE = new CylinderGeometry(0.035, 0.035, 0.012, 24)
const CAM_STEM = new CylinderGeometry(0.012, 0.012, 0.13, 12)
const CAM_KNUCKLE = new SphereGeometry(0.02, 16, 12)
const CAM_BEZEL = new CylinderGeometry(0.042, 0.046, 0.04, 28)
const CAM_GLASS = new SphereGeometry(0.033, 24, 12, 0, PI * 2, 0, PI / 2)
const CAM_CABLE = new CylinderGeometry(0.008, 0.008, 0.04, 10)
const CAM_METAL = new MeshStandardMaterial({ color: '#9aa3ad', metalness: 0.8, roughness: 0.35 })
const CAM_BLACK = new MeshStandardMaterial({ color: '#141414', roughness: 0.35 })
const CAM_LENS = new MeshStandardMaterial({ color: '#16305e', metalness: 0.6, roughness: 0.08 })

/** Ceiling-mounted CCTV camera; points at you unless `away`. Built with the lens facing +z. */
export function SecurityCamera({ away = false }: { away?: boolean }) {
  const head = (
    <>
      {/* ball joint, the bracket up to it, the housing under its sun hood */}
      <mesh geometry={CAM_KNUCKLE} material={CAM_METAL} />
      <Block size={[0.05, 0.03, 0.08]} position={[0, -0.03, 0.02]} color="#9aa3ad" metalness={0.8} roughness={0.35} radius={0.008} />
      <Block size={[0.12, 0.11, 0.26]} position={[0, -0.07, 0.05]} color="#e8e8e2" roughness={0.4} radius={0.025} paint />
      <Block size={[0.15, 0.014, 0.31]} position={[0, -0.008, 0.07]} color="#e8e8e2" roughness={0.4} radius={0.006} paint />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.012, 0.04, 0.3]} position={[s * 0.07, -0.025, 0.07]} color="#e8e8e2" roughness={0.4} radius={0.005} paint />
      ))}
      {/* lens: a black bezel with blue glass, and the red recording light */}
      <mesh geometry={CAM_BEZEL} material={CAM_BLACK} position={[0, -0.07, 0.19]} rotation={[PI / 2, 0, 0]} />
      <mesh geometry={CAM_GLASS} material={CAM_LENS} position={[0, -0.07, 0.205]} rotation={[PI / 2, 0, 0]} scale={[1, 0.5, 1]} />
      <mesh position={[0.042, -0.03, 0.181]}>
        <sphereGeometry args={[0.008, 10, 8]} />
        <meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={3} />
      </mesh>
      {/* the cable out of the back */}
      <mesh geometry={CAM_CABLE} material={CAM_BLACK} position={[0, -0.07, -0.1]} rotation={[PI / 2, 0, 0]} />
    </>
  )
  return (
    <group scale={1.8}>
      <mesh geometry={CAM_PLATE} material={CAM_METAL} position={[0, 0.134, 0]} />
      <mesh geometry={CAM_STEM} material={CAM_METAL} position={[0, 0.065, 0]} />
      {away ? (
        <group rotation={[0.9, PI * 0.75, 0, 'YXZ']}>{head}</group>
      ) : (
        <FacesYou position={[0, 0, 0]}>{head}</FacesYou>
      )}
    </group>
  )
}

/**
 * Fluorescent tubes along x at the given z positions. The flickering tube dims
 * its light and glow rather than switching them off: hiding a light changes
 * the scene's light count, which makes three.js recompile every shader.
 */
export function StripLights({ mode, zs, height, length }: { mode: 'normal' | 'flicker' | 'green'; zs: number[]; height: number; length: number }) {
  const power = 2.6
  const flicker = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!flicker.current) return
    const t = clock.elapsedTime
    const level = Math.sin(t * 23) + Math.sin(t * 7.3) > -0.6 ? 1 : 0.08
    flicker.current.traverse((o) => {
      if ((o as RectAreaLight).isRectAreaLight) (o as RectAreaLight).intensity = power * level
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (m?.emissive) m.emissiveIntensity = 2 * level
    })
  })
  return (
    <>
      {zs.map((z, i) => {
        // the green swap turns just one tube green
        const colour = mode === 'green' && i === 2 ? '#7dff9a' : '#f2fbff'
        return (
        <group key={z}>
          <Block size={[length + 0.1, 0.03, 0.16]} position={[0, height - 0.012, z]} color="#d8dde2" metalness={0.5} roughness={0.4} radius={0.01} />
          <group ref={mode === 'flicker' && i === 1 ? flicker : undefined}>
            <Block size={[length, 0.05, 0.09]} position={[0, height - 0.035, z]} color={colour} emissive={colour} emissiveIntensity={2} radius={0.02} />
            <PanelLight position={[0, height - 0.07, z]} size={[length, 0.2]} facing={[0, 0, z]} color={colour} intensity={power} />
          </group>
        </group>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Door and doormat
// ---------------------------------------------------------------------------

/** The shop door, its glass onto the street; `watcher`: someone's standing outside it, looking in. */
export function ShopDoor({ watcher, ...slice }: { watcher: boolean } & Slice) {
  const { width: gw, y0, y1 } = SHOP_DOOR.glass
  const stile = (0.95 - gw) / 2
  const door = { color: '#2f5d50', roughness: 0.45, radius: 0.004, paint: true }
  return (
    <>
      <Outside layers={nightStreet()} {...slice} />
      {/* stiles either side of the glass, rails above and below it */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[stile, 2.1, 0.05]} position={[s * (gw + stile) / 2, 1.05, 0.025]} {...door} />
      ))}
      <Block size={[gw, y0, 0.05]} position={[0, y0 / 2, 0.025]} {...door} />
      <Block size={[gw, 2.1 - y1, 0.05]} position={[0, (y1 + 2.1) / 2, 0.025]} {...door} />
      <mesh position={[0, (y0 + y1) / 2, 0.025]} renderOrder={2}>
        <planeGeometry args={[gw, y1 - y0]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      {watcher && (
        // a tall dark someone, a step back from the glass on the pavement, looking in
        <group position={[0.06, 0, -0.75]}>
          <ShadowFigure height={1.9} />
        </group>
      )}
      <Block size={[0.66, 0.04, 0.03]} position={[0, 1.88, 0.06]} color="#d8dde2" metalness={0.6} roughness={0.3} radius={0.005} />
      <Block size={[0.66, 0.04, 0.03]} position={[0, 0.88, 0.06]} color="#d8dde2" metalness={0.6} roughness={0.3} radius={0.005} />
      <Block size={[0.04, 0.3, 0.04]} position={[0.36, 1.0, 0.08]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.01} />
      {/* frame */}
      <Block size={[0.07, 2.16, 0.07]} position={[-0.51, 1.08, 0.03]} color="#f2efe8" roughness={0.45} />
      <Block size={[0.07, 2.16, 0.07]} position={[0.51, 1.08, 0.03]} color="#f2efe8" roughness={0.45} />
      <Block size={[1.09, 0.07, 0.07]} position={[0, 2.16, 0.03]} color="#f2efe8" roughness={0.45} />
    </>
  )
}

export function Doormat({ text }: { text: string }) {
  const map = useMemo(() => matTexture(text), [text])
  return (
    // reads the right way up to someone walking in through the door
    <mesh position={[0, 0.008, 0]} rotation={[-PI / 2, 0, 0]} receiveShadow userData={{ paint: true }}>
      <boxGeometry args={[0.9, 0.56, 0.015]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}

/** The big front window, looking out at the street at night. `y`: how high its middle is. */
export function ShopWindow({ width, height, y, ...slice }: { width: number; height: number; y: number } & Slice) {
  return (
    <>
      <Outside layers={nightStreet()} y={y} {...slice} />
      {/* glass sheen */}
      <mesh position={[0, 0, 0.02]} renderOrder={2}>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      {[-1, 1].map((sy) => (
        <Block key={sy} size={[width + 0.12, 0.08, 0.1]} position={[0, sy * (height / 2 + 0.04), 0.05]} color="#f2efe8" roughness={0.45} radius={0.01} />
      ))}
      {[-1, 0, 1].map((sx) => (
        <Block key={sx} size={[0.07, height, 0.08]} position={[sx * (width / 2 + 0.025) * (sx === 0 ? 0 : 1), 0, 0.04]} color="#f2efe8" roughness={0.45} radius={0.01} />
      ))}
      {/* a narrow sill, so it clears the freezer and the fruit stand below */}
      <Block size={[width + 0.2, 0.04, 0.12]} position={[0, -height / 2 - 0.08, 0.06]} color="#f2efe8" roughness={0.45} radius={0.01} />
    </>
  )
}
