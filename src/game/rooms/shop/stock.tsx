import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  type Group,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { dimCorridorTexture } from '../../doorway'
import { Block, Instanced, PI, type Placement } from '../../kit'
import type { Vec3 } from '../../mutations'
import { mulberry32 } from '../../rng'
import { PACKET, packetGeometry } from './packet'
import { rowZ, slots, type ShelfSpec } from './shelving'
import {
  bottleLabel,
  breadBagTexture,
  CRISP_DESIGNS,
  crispTexture,
  lollyBoxTexture,
  lollyWrapTexture,
  looBandTexture,
  magazineCover,
  newspaperTexture,
  PAPERS,
  plaqueTexture,
  powderBoxTexture,
  tubLabelTexture,
  warningSignTexture,
} from './textures'

/*
 * The second half of the shop's stock and fittings: crisps, cleaning stuff,
 * loo roll, the ice cream freezer, fruit and veg, papers, magazines, the
 * wet floor sign, the staff door and the bread rack. Everything faces +z.
 */

const faceTurn = (face: 1 | -1): Vec3 => [0, face === 1 ? 0 : PI, 0]

// ---------------------------------------------------------------------------
// Crisps
// ---------------------------------------------------------------------------

const PACKET_SHAPE = packetGeometry()

// One set of label materials shared by every packet on every shelf and in
// every swap (made on first use, since drawing labels needs the DOM).
let crispMaterials: MeshStandardMaterial[] | null = null
function useCrispMaterials() {
  crispMaterials ??= Array.from({ length: CRISP_DESIGNS }, (_, i) => new MeshStandardMaterial({ map: crispTexture(i), roughness: 0.32, metalness: 0.3 }))
  return crispMaterials
}

/** Crisp packets on one face; on the shelves in `levels`, puffed up like balloons or floating. */
export function CrispPackets({
  spec,
  face = 1,
  mode = 'normal',
  levels = [],
}: {
  spec: ShelfSpec
  face?: 1 | -1
  mode?: 'normal' | 'puffed' | 'float'
  levels?: number[]
}) {
  const materials = useCrispMaterials()
  const { calm, odd } = useMemo(() => {
    const make = () => materials.map((): Placement[] => [])
    const calm = make()
    const odd = make()
    const rng = mulberry32(face === 1 ? 61 : 62)
    const z = rowZ(spec, 0.05)
    slots(spec, 0.145).forEach(({ y, xs }, row) => {
      const changed = mode !== 'normal' && levels.includes(row)
      const puffed = changed && mode === 'puffed'
      const set = changed ? odd : calm
      const s = puffed ? 1.25 : 1
      xs.forEach((x, i) => {
        const d = (row * 2 + Math.floor(i / 3)) % CRISP_DESIGNS
        // two deep, each packet leaning back against the one behind, none quite straight
        for (const [dz, lean] of [
          [0, 0.2],
          [-0.12, 0.12],
        ]) {
          set[d].push({
            at: [x + (rng() - 0.5) * 0.01, y + (PACKET.height / 2) * s * Math.cos(lean) - 0.004, z + dz],
            rot: [-lean - rng() * 0.06, (rng() - 0.5) * 0.12, (rng() - 0.5) * 0.06],
            scale: [s, s, puffed ? 2.4 : 1],
          })
        }
      })
    })
    return { calm, odd }
  }, [spec, face, mode, levels, materials])
  const lift = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (lift.current) lift.current.position.y = 0.09 + Math.sin(clock.elapsedTime * 1.3) * 0.02
  })
  const draw = (set: typeof calm) => materials.map((m, d) => <Instanced key={d} geometry={PACKET_SHAPE} material={m} items={set[d]} />)
  return (
    <group rotation={faceTurn(face)}>
      {draw(calm)}
      <group ref={mode === 'float' ? lift : undefined}>{draw(odd)}</group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Cleaning products (static aisle)
// ---------------------------------------------------------------------------

const lathe = (profile: [number, number][]) => new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 24)
/** Front-only label: a strip of cylinder wrapped round the front half of a bottle. */
const label = (r: number, h: number) => new CylinderGeometry(r, r, h, 20, 1, true, -PI / 2, PI)

const BLEACH = lathe([
  [0, 0],
  [0.044, 0],
  [0.046, 0.01],
  [0.046, 0.2],
  [0.04, 0.225],
  [0.018, 0.25],
  [0.016, 0.268],
  [0, 0.268],
])
const SUDZ = lathe([
  [0, 0],
  [0.03, 0],
  [0.032, 0.01],
  [0.033, 0.08],
  [0.027, 0.13],
  [0.032, 0.19],
  [0.03, 0.215],
  [0.012, 0.238],
  [0.011, 0.252],
  [0, 0.252],
])
const SPRAY = lathe([
  [0, 0],
  [0.036, 0],
  [0.037, 0.01],
  [0.037, 0.15],
  [0.03, 0.168],
  [0.013, 0.182],
  [0, 0.182],
])
const BLEACH_CAP = new CylinderGeometry(0.019, 0.019, 0.03, 16)
const SUDZ_CAP = new CylinderGeometry(0.013, 0.011, 0.03, 12)
// a trigger-spray head: a neck, the rounded head, a nozzle out of the front and the trigger under it
const SPRAY_NECK = new CylinderGeometry(0.012, 0.014, 0.016, 14)
const TRIGGER = new RoundedBoxGeometry(0.034, 0.04, 0.072, 2, 0.01)
const NOZZLE = new CylinderGeometry(0.007, 0.009, 0.02, 12)
const LEVER = new RoundedBoxGeometry(0.016, 0.045, 0.012, 2, 0.005)
const POWDER = new BoxGeometry(0.17, 0.22, 0.065)

function useHouseholdMaterials() {
  return useMemo(() => {
    const plain = (color: string) => new MeshStandardMaterial({ color, roughness: 0.35 })
    const printed = (map: ReturnType<typeof bottleLabel>) => new MeshStandardMaterial({ map, roughness: 0.4 })
    const box = plain('#0d5fae')
    return {
      bleach: plain('#f4f4f0'),
      bleachCap: plain('#1f5fd8'),
      bleachLabel: printed(bottleLabel('bleach')),
      sudz: new MeshStandardMaterial({ color: '#7ad35a', roughness: 0.15, transparent: true, opacity: 0.92 }),
      sudzCap: plain('#f4f4f0'),
      sudzLabel: printed(bottleLabel('sudz')),
      spray: plain('#ffe9a8'),
      trigger: plain('#f08a1c'),
      sprayNeck: plain('#f4f4f0'),
      sprayLabel: printed(bottleLabel('spray')),
      // box faces: +x, -x, +y, -y, +z (front), -z
      powder: [box, box, box, box, printed(powderBoxTexture()), box],
    }
  }, [])
}

/**
 * The cleaning aisle, one product per shelf as shops do it: washing powder at
 * the bottom, then bleach, washing-up liquid and trigger sprays.
 */
export function Detergent({ spec, face = 1 }: { spec: ShelfSpec; face?: 1 | -1 }) {
  const m = useHouseholdMaterials()
  const rows = useMemo(() => {
    const z = rowZ(spec, 0.06)
    const at = (level: number, spacing: number, deep: number, fn: (x: number, y: number, z: number) => void) => {
      const shelf = slots(spec, spacing)[level]
      if (!shelf) return
      for (const x of shelf.xs) for (let k = 0; k < deep; k++) fn(x, shelf.y, z - k * 0.1)
    }
    const r = {
      powder: [] as Placement[],
      bleach: [] as Placement[],
      bleachCap: [] as Placement[],
      bleachLabel: [] as Placement[],
      sudz: [] as Placement[],
      sudzCap: [] as Placement[],
      sudzLabel: [] as Placement[],
      spray: [] as Placement[],
      trigger: [] as Placement[],
      sprayNeck: [] as Placement[],
      nozzle: [] as Placement[],
      lever: [] as Placement[],
      sprayLabel: [] as Placement[],
    }
    at(0, 0.19, 2, (x, y, zz) => r.powder.push({ at: [x, y + 0.11, zz] }))
    at(1, 0.1, 2, (x, y, zz) => {
      r.bleach.push({ at: [x, y, zz] })
      r.bleachCap.push({ at: [x, y + 0.282, zz] })
      r.bleachLabel.push({ at: [x, y + 0.1, zz] })
    })
    at(2, 0.075, 2, (x, y, zz) => {
      r.sudz.push({ at: [x, y, zz] })
      r.sudzCap.push({ at: [x, y + 0.266, zz] })
      r.sudzLabel.push({ at: [x, y + 0.05, zz] })
    })
    at(3, 0.085, 2, (x, y, zz) => {
      r.spray.push({ at: [x, y, zz] })
      r.sprayNeck.push({ at: [x, y + 0.189, zz] })
      r.trigger.push({ at: [x, y + 0.216, zz + 0.012] })
      r.nozzle.push({ at: [x, y + 0.222, zz + 0.056], rot: [PI / 2, 0, 0] })
      r.lever.push({ at: [x, y + 0.183, zz + 0.036], rot: [-0.3, 0, 0] })
      r.sprayLabel.push({ at: [x, y + 0.075, zz] })
    })
    return r
  }, [spec])
  return (
    <group rotation={faceTurn(face)}>
      <Instanced geometry={POWDER} material={m.powder} items={rows.powder} />
      <Instanced geometry={BLEACH} material={m.bleach} items={rows.bleach} />
      <Instanced geometry={BLEACH_CAP} material={m.bleachCap} items={rows.bleachCap} />
      <Instanced geometry={BLEACH_LABEL} material={m.bleachLabel} items={rows.bleachLabel} />
      <Instanced geometry={SUDZ} material={m.sudz} items={rows.sudz} />
      <Instanced geometry={SUDZ_CAP} material={m.sudzCap} items={rows.sudzCap} />
      <Instanced geometry={SUDZ_LABEL} material={m.sudzLabel} items={rows.sudzLabel} />
      <Instanced geometry={SPRAY} material={m.spray} items={rows.spray} />
      <Instanced geometry={SPRAY_NECK} material={m.sprayNeck} items={rows.sprayNeck} />
      <Instanced geometry={TRIGGER} material={m.trigger} items={rows.trigger} />
      <Instanced geometry={NOZZLE} material={m.sprayNeck} items={rows.nozzle} />
      <Instanced geometry={LEVER} material={m.trigger} items={rows.lever} />
      <Instanced geometry={SPRAY_LABEL} material={m.sprayLabel} items={rows.sprayLabel} />
    </group>
  )
}
const BLEACH_LABEL = label(0.047, 0.12)
const SUDZ_LABEL = label(0.0335, 0.1)
const SPRAY_LABEL = label(0.038, 0.11)

// ---------------------------------------------------------------------------
// Loo roll
// ---------------------------------------------------------------------------

const ROLL = new CylinderGeometry(0.053, 0.053, 0.1, 20)
const CORE = new CircleGeometry(0.019, 16)
const WRAP = new BoxGeometry(0.335, 0.106, 0.335)
const BAND = new PlaneGeometry(0.3, 0.075)
const PAPER = new MeshStandardMaterial({ color: '#f7f5ef', roughness: 0.95 })
const CORE_MAT = new MeshStandardMaterial({ color: '#7a6247', roughness: 1 })
const WRAP_MAT = new MeshStandardMaterial({ color: '#dff1ff', roughness: 0.15, transparent: true, opacity: 0.22, depthWrite: false })

/** Nine-packs of loo roll in clear wrap, stacked two high, brand band to the front. */
export function LooRolls({ spec }: { spec: ShelfSpec }) {
  const band = useMemo(() => new MeshStandardMaterial({ map: looBandTexture(), roughness: 0.4 }), [])
  const packs = useMemo(() => {
    const rolls: Placement[] = []
    const cores: Placement[] = []
    const wraps: Placement[] = []
    const bands: Placement[] = []
    const z = rowZ(spec, 0.17)
    slots(spec, 0.35).forEach(({ y, xs }) =>
      xs.forEach((x) => {
        for (const level of [0, 1]) {
          const base = y + level * 0.108
          wraps.push({ at: [x, base + 0.053, z] })
          bands.push({ at: [x, base + 0.055, z + 0.169] })
          for (const dx of [-0.11, 0, 0.11])
            for (const dz of [-0.11, 0, 0.11]) {
              rolls.push({ at: [x + dx, base + 0.05, z + dz] })
              cores.push({ at: [x + dx, base + 0.1005, z + dz], rot: [-PI / 2, 0, 0] })
            }
        }
      }),
    )
    return { rolls, cores, wraps, bands }
  }, [spec])
  return (
    <>
      <Instanced geometry={ROLL} material={PAPER} items={packs.rolls} />
      <Instanced geometry={CORE} material={CORE_MAT} items={packs.cores} />
      <Instanced geometry={BAND} material={band} items={packs.bands} />
      <Instanced geometry={WRAP} material={WRAP_MAT} items={packs.wraps} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Ice cream freezer
// ---------------------------------------------------------------------------

const LOLLY_SHAPE = packetGeometry()
const TUB = new CylinderGeometry(0.072, 0.066, 0.1, 24)
const TUB_LID = new CylinderGeometry(0.076, 0.076, 0.012, 24)
const TUB_LABEL = new CylinderGeometry(0.0725, 0.0675, 0.07, 24, 1, true)
const LOLLY_BOX = new BoxGeometry(0.2, 0.055, 0.12)
const TUB_COLOURS = ['#f7ecc8', '#6b3b22', '#ffc2d6']

function useFreezerMaterials() {
  return useMemo(() => {
    const boxSide = new MeshStandardMaterial({ color: '#16d0ff', roughness: 0.5 })
    const boxFront = new MeshStandardMaterial({ map: lollyBoxTexture(), roughness: 0.5 })
    return {
      lolly: [0, 1, 2].map((i) => new MeshStandardMaterial({ map: lollyWrapTexture(i), roughness: 0.3, metalness: 0.3 })),
      tub: TUB_COLOURS.map((color) => new MeshStandardMaterial({ color, roughness: 0.5 })),
      tubLabel: [0, 1, 2].map((i) => new MeshStandardMaterial({ map: tubLabelTexture(i), roughness: 0.5 })),
      // lids show their flavour colour too
      lid: TUB_COLOURS.map((color) => new MeshStandardMaterial({ color, roughness: 0.3 })),
      // box faces: +x, -x, +y (top, printed), -y, +z, -z
      box: [boxSide, boxSide, boxFront, boxSide, boxSide, boxSide],
    }
  }, [])
}

/** A chest freezer of ice lollies (1.3 × 0.7, 0.85 tall) with a sliding glass lid. */
export function ChestFreezer({ contents }: { contents: 'lollies' | 'fish' | 'snowman' }) {
  const m = useFreezerMaterials()
  const stock = useMemo(() => {
    const rng = mulberry32(5)
    const lollies: Placement[][] = [[], [], []]
    // a heap of wrapped lollies in the left half
    for (let i = 0; i < 30; i++)
      lollies[i % 3].push({
        at: [-0.5 + rng() * 0.6, 0.6 + rng() * 0.07, (rng() - 0.5) * 0.42],
        rot: [-PI / 2 + (rng() - 0.5) * 0.3, 0, rng() * PI],
        scale: [0.55, 0.8, 0.45],
      })
    // tubs of ice cream standing in the right half, two rows
    const tubs: Placement[][] = [[], [], []]
    const lids: Placement[][] = [[], [], []]
    const labels: Placement[][] = [[], [], []]
    ;[0.28, 0.44].forEach((x, i) =>
      [-0.14, 0.0, 0.14].forEach((z, j) => {
        const f = (i + j) % 3
        tubs[f].push({ at: [x, 0.635, z] })
        labels[f].push({ at: [x, 0.63, z], rot: [0, rng() * PI, 0] })
        lids[f].push({ at: [x, 0.691, z] })
      }),
    )
    // multipack boxes stacked in the middle
    const boxes: Placement[] = [0, 1, 2].map((k) => ({ at: [0.1, 0.61 + k * 0.056, -0.1 + (k % 2) * 0.02], rot: [0, (rng() - 0.5) * 0.3, 0] }))
    return { lollies, tubs, lids, labels, boxes }
  }, [])
  const white = { color: '#f6f7f8', roughness: 0.35 }
  return (
    <>
      {/* a dark plinth under the cabinet, and the compressor's vent grille on the front */}
      <Block size={[1.24, 0.05, 0.64]} position={[0, 0.025, 0]} color="#2a2f35" roughness={0.6} radius={0.01} />
      <Block size={[1.3, 0.22, 0.7]} position={[0, 0.15, 0]} {...white} radius={0.02} paint />
      {[0.09, 0.12, 0.15, 0.18].map((y) => (
        <Block key={y} size={[0.3, 0.012, 0.006]} position={[0.42, y, 0.351]} color="#5a626b" roughness={0.6} radius={0.003} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={`z${s}`} size={[1.3, 0.6, 0.06]} position={[0, 0.55, s * 0.32]} {...white} radius={0.015} paint />
      ))}
      {[-1, 1].map((s) => (
        <Block key={`x${s}`} size={[0.06, 0.6, 0.7]} position={[s * 0.62, 0.55, 0]} {...white} radius={0.015} paint />
      ))}
      {/* blue stripe and the ice-cold glow inside */}
      <Block size={[1.22, 0.12, 0.01]} position={[0, 0.62, 0.352]} color="#1f6bff" roughness={0.4} radius={0.003} />
      {/* stock is stacked high on a raised bed, as shop freezers are, so it can be seen over the rim */}
      <mesh position={[0, 0.58, 0]} rotation={[-PI / 2, 0, 0]}>
        <planeGeometry args={[1.18, 0.58]} />
        <meshStandardMaterial color="#e8f7ff" emissive="#bfe8ff" emissiveIntensity={0.35} />
      </mesh>
      {contents !== 'snowman' && (
        <>
          {stock.lollies.map((items, i) => (
            <Instanced key={`l${i}`} geometry={LOLLY_SHAPE} material={m.lolly[i]} items={items} />
          ))}
          {stock.tubs.map((items, i) => (
            <group key={`t${i}`}>
              <Instanced geometry={TUB} material={m.tub[i]} items={items} />
              <Instanced geometry={TUB_LABEL} material={m.tubLabel[i]} items={stock.labels[i]} />
              <Instanced geometry={TUB_LID} material={m.lid[i]} items={stock.lids[i]} />
            </group>
          ))}
          <Instanced geometry={LOLLY_BOX} material={m.box} items={stock.boxes} />
        </>
      )}
      {contents === 'fish' && (
        <group position={[0.05, 0.74, 0]} rotation={[0, 0.25, 0]}>
          <mesh scale={[0.32, 0.1, 0.085]} castShadow>
            <sphereGeometry args={[1, 32, 20]} />
            <meshStandardMaterial color="#9fb3c2" metalness={0.6} roughness={0.25} />
          </mesh>
          <mesh position={[-0.37, 0, 0]} rotation={[0, 0, PI / 2]} scale={[1, 1, 0.25]}>
            <coneGeometry args={[0.1, 0.14, 16]} />
            <meshStandardMaterial color="#8297a6" metalness={0.6} roughness={0.3} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[0.24, 0.025, s * 0.06]}>
              <mesh>
                <sphereGeometry args={[0.02, 12, 10]} />
                <meshStandardMaterial color="#fffbe6" />
              </mesh>
              <mesh position={[0.005, 0, s * 0.015]}>
                <sphereGeometry args={[0.01, 10, 8]} />
                <meshBasicMaterial color="#050505" />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {/* the snowman is small enough to stand on the stock bed under the lid */}
      {contents === 'snowman' && (
        <group position={[0.15, 0.58, 0]} scale={0.65}>
          {[
            [0.1, 0.09],
            [0.075, 0.24],
            [0.055, 0.35],
          ].map(([r, y]) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <sphereGeometry args={[r, 28, 20]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          ))}
          <mesh position={[0, 0.35, 0.07]} rotation={[PI / 2, 0, 0]}>
            <coneGeometry args={[0.012, 0.06, 10]} />
            <meshStandardMaterial color="#ff8a1f" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.02, 0.37, 0.05]}>
              <sphereGeometry args={[0.007, 8, 6]} />
              <meshBasicMaterial color="#111" />
            </mesh>
          ))}
          <mesh position={[0, 0.3, 0]} rotation={[PI / 2, 0, 0]}>
            <torusGeometry args={[0.06, 0.014, 8, 24]} />
            <meshStandardMaterial color="#e0262a" roughness={0.8} />
          </mesh>
        </group>
      )}
      {/* two sliding glass lids in a track along the front and back, one riding above the other */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[1.3, 0.02, 0.05]} position={[0, 0.86, s * 0.31]} color="#c9ced6" metalness={0.6} roughness={0.35} radius={0.006} />
      ))}
      {[
        [-0.3, 0.872, 1],
        [0.3, 0.89, -1],
      ].map(([x, y, toward]) => (
        <group key={x} position={[x, y, 0]}>
          <mesh rotation={[-PI / 2, 0, 0]} renderOrder={2}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.14} roughness={0.05} clearcoat={1} depthWrite={false} />
          </mesh>
          {[-1, 1].map((s) => (
            <Block key={`z${s}`} size={[0.62, 0.016, 0.025]} position={[0, 0, s * 0.3]} {...white} radius={0.005} />
          ))}
          {[-1, 1].map((s) => (
            <Block key={`x${s}`} size={[0.025, 0.016, 0.62]} position={[s * 0.3, 0, 0]} {...white} radius={0.005} />
          ))}
          {/* finger pull at the lid's inner end */}
          <Block size={[0.03, 0.02, 0.16]} position={[toward * 0.26, 0.014, 0]} color="#1f6bff" roughness={0.4} radius={0.008} />
        </group>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Fruit and veg
// ---------------------------------------------------------------------------

const FRUIT_ROUND = new SphereGeometry(0.045, 16, 12)
const FRUIT_CUBE = new BoxGeometry(0.075, 0.075, 0.075)
const EYE_WHITE = new SphereGeometry(0.014, 10, 8)
const FRUIT_MATS = ['#d7262e', '#ff8a1f', '#ffe03a'].map((color) => new MeshStandardMaterial({ color, roughness: 0.45 }))
const EYE_MAT = new MeshStandardMaterial({ color: '#fffbe6', roughness: 0.2 })
const PUPIL_MAT = new MeshStandardMaterial({ color: '#050505', roughness: 0.2 })
const PUPIL = new SphereGeometry(0.007, 8, 6)

/** The stand's side: a board that steps up from the front crate to the back one, in profile (z, y). */
const VEG_SIDE = (() => {
  const shape = new Shape()
  shape.moveTo(0.44, 0)
  shape.lineTo(0.44, 0.44)
  shape.lineTo(-0.4, 0.94)
  // stepped down at the back, under the window sill
  shape.lineTo(-0.4, 0.76)
  shape.lineTo(-0.54, 0.76)
  shape.lineTo(-0.54, 0)
  shape.closePath()
  const g = new ExtrudeGeometry(shape, { depth: 0.024, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 })
  g.translate(0, 0, -0.012)
  return g
})()
const VEG_NAMES = ['APPLES', 'ORANGES', 'LEMONS']
const VEG_WOOD = new MeshStandardMaterial({ color: '#a8744a', roughness: 0.8 })

/** Three tilted crates of apples, oranges and lemons (1.1 wide, 1.0 deep). */
export function VegStand({ fruit }: { fruit: 'normal' | 'faces' | 'cubes' }) {
  const wood = { color: '#a8744a', roughness: 0.8 }
  const tags = useMemo(() => VEG_NAMES.map((name) => plaqueTexture(name, '#ffffff', '#1a1a1a')), [])
  const crate = useMemo(() => {
    const rng = mulberry32(17)
    const fruitAt: Placement[] = []
    const eyes: Placement[] = []
    const pupils: Placement[] = []
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < 11; i++) {
        const at: Vec3 = [-0.47 + i * 0.094 + (r % 2) * 0.03, 0.1, -0.09 + r * 0.09]
        // no two quite the same size
        const k = 0.92 + rng() * 0.14
        fruitAt.push({ at, rot: [0.3 * i, 0.7 * r, 0], scale: [k, k, k] })
        if (r === 2)
          for (const s of [-1, 1]) {
            eyes.push({ at: [at[0] + s * 0.016, at[1] + 0.018, at[2] + 0.038] })
            pupils.push({ at: [at[0] + s * 0.016, at[1] + 0.018, at[2] + 0.05] })
          }
      }
    return { fruitAt, eyes, pupils }
  }, [])
  return (
    <>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={VEG_SIDE} material={VEG_WOOD} position={[s * 0.57, 0, 0]} rotation={[0, -PI / 2, 0]} castShadow receiveShadow userData={{ paint: true }} />
      ))}
      {/* a rail across the back to hold the sides together */}
      <Block size={[1.14, 0.06, 0.03]} position={[0, 0.15, -0.52]} {...wood} radius={0.008} paint />
      {[0, 1, 2].map((i) => (
        // front crate lowest, each one further back sits higher; all tilted towards the shopper
        <group key={i} position={[0, 0.32 + i * 0.24, 0.27 - i * 0.3]} rotation={[0.28, 0, 0]}>
          <Block size={[1.1, 0.03, 0.32]} position={[0, 0.015, 0]} {...wood} radius={0.005} paint />
          {/* slatted crate walls: two boards front and back with a gap between, solid ends */}
          {[-1, 1].flatMap((s) =>
            [0.035, 0.085].map((y) => <Block key={`${s}${y}`} size={[1.1, 0.04, 0.02]} position={[0, y, s * 0.15]} {...wood} radius={0.006} paint />),
          )}
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.02, 0.1, 0.32]} position={[s * 0.54, 0.05, 0]} {...wood} radius={0.006} paint />
          ))}
          {/* the name card pinned to the front */}
          <mesh position={[0.36, 0.06, 0.161]}>
            <planeGeometry args={[0.22, 0.082]} />
            <meshStandardMaterial map={tags[i]} roughness={0.6} />
          </mesh>
          {/* the swaps touch one crate each: cube oranges, lemons with faces */}
          <Instanced geometry={fruit === 'cubes' && i === 1 ? FRUIT_CUBE : FRUIT_ROUND} material={FRUIT_MATS[i]} items={crate.fruitAt} />
          {fruit === 'faces' && i === 2 && (
            <>
              <Instanced geometry={EYE_WHITE} material={EYE_MAT} items={crate.eyes} />
              <Instanced geometry={PUPIL} material={PUPIL_MAT} items={crate.pupils} />
            </>
          )}
        </group>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Newspapers and magazines
// ---------------------------------------------------------------------------

/** A wire stand of newspapers, three tiers of two piles, under a NEWS board. */
export function PaperStand({ mode }: { mode: 'normal' | 'weird' | 'blank' }) {
  const pages = useMemo(
    () => PAPERS.map((p) => newspaperTexture(p.masthead, mode === 'weird' ? p.weird : p.normal, p.colour, mode === 'blank')),
    [mode],
  )
  const header = useMemo(() => plaqueTexture('NEWS', '#ffde21', '#1a1a1a'), [])
  const metal = { color: '#3b3f45', metalness: 0.7, roughness: 0.4 }
  return (
    <>
      {/* an open frame: four posts (the back pair taller, to carry the board) and rails along each side */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.36, 0, 0]}>
          <Block size={[0.025, 1.1, 0.025]} position={[0, 0.55, 0.235]} {...metal} radius={0.006} />
          <Block size={[0.025, 1.34, 0.025]} position={[0, 0.67, -0.235]} {...metal} radius={0.006} />
          {[0.04, 0.62, 1.09].map((y) => (
            <Block key={y} size={[0.02, 0.02, 0.49]} position={[0, y, 0]} {...metal} radius={0.005} />
          ))}
        </group>
      ))}
      <Block size={[0.74, 0.22, 0.02]} position={[0, 1.23, -0.235]} {...metal} radius={0.006} />
      <mesh position={[0, 1.23, -0.224]}>
        <planeGeometry args={[0.58, 0.2]} />
        <meshStandardMaterial map={header} roughness={0.5} />
      </mesh>
      {[0, 1, 2].map((t) => (
        <group key={t} position={[0, 0.42 + t * 0.28, 0.12 - t * 0.12]} rotation={[0.55, 0, 0]}>
          <Block size={[0.7, 0.02, 0.3]} position={[0, 0, 0]} {...metal} radius={0.005} />
          {/* a lip along the front edge so the papers don't slide off */}
          <Block size={[0.7, 0.05, 0.015]} position={[0, 0.02, 0.145]} {...metal} radius={0.004} />
          {[-0.17, 0.17].map((x, k) => (
            <group key={x} position={[x, 0.03, -0.005]}>
              <Block size={[0.215, 0.04, 0.275]} position={[0, 0, 0]} color="#ece6d6" roughness={0.9} radius={0.004} />
              <mesh position={[0, 0.0205, 0]} rotation={[-PI / 2, 0, 0]} userData={{ paint: true }}>
                <planeGeometry args={[0.2, 0.265]} />
                <meshStandardMaterial map={pages[(t + k) % pages.length]} roughness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </>
  )
}

/** A magazine: a thin block, cover on the front, page edges round the sides and a plain back. */
const MAG = new BoxGeometry(0.2, 0.27, 0.007)
const MAG_PAGES = new MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.9 })
// box faces: +x, -x, +y, -y, +z (cover), -z
const magazine = (cover: MeshStandardMaterial) => [MAG_PAGES, MAG_PAGES, MAG_PAGES, MAG_PAGES, cover, MAG_PAGES]

/** Magazines that turn into staring eyes, as "ledge:slot". */
const EYE_SLOTS = ['0:4', '1:1', '2:3', '3:0']

/** Wall-mounted magazine rack (1.5 wide); a few covers can become staring eyes, or one row goes sideways. */
export function MagazineRack({ mode }: { mode: 'normal' | 'eyes' | 'sideways' }) {
  const covers = useMemo(() => Array.from({ length: 6 }, (_, i) => magazine(new MeshStandardMaterial({ map: magazineCover(i, false), roughness: 0.35 }))), [])
  const eye = useMemo(() => magazine(new MeshStandardMaterial({ map: magazineCover(1, true), roughness: 0.35 })), [])
  const ledges = [0.6, 0.9, 1.2, 1.5]
  return (
    <>
      <Block size={[1.5, 1.3, 0.03]} position={[0, 1.1, 0.015]} color="#f2efe8" roughness={0.6} radius={0.008} paint />
      {ledges.map((y, row) => (
        <group key={y}>
          <Block size={[1.5, 0.02, 0.1]} position={[0, y, 0.06]} color="#c9ced6" metalness={0.6} roughness={0.35} radius={0.004} />
          <Block size={[1.5, 0.04, 0.01]} position={[0, y + 0.02, 0.11]} color="#c9ced6" metalness={0.6} roughness={0.35} radius={0.003} />
          {Array.from({ length: 6 }, (_, i) => {
            // on its side a magazine is wider than its slot, so every other one sits a page in front of its neighbours
            const sideways = mode === 'sideways' && row === 2
            return (
              <mesh
                key={i}
                geometry={MAG}
                material={mode === 'eyes' && EYE_SLOTS.includes(`${row}:${i}`) ? eye : covers[(i + row * 2) % covers.length]}
                position={[-0.6 + i * 0.24, y + (sideways ? 0.112 : 0.145), sideways ? 0.068 + (i % 2) * 0.009 : 0.07]}
                rotation={[-0.18, 0, sideways ? PI / 2 : 0]}
              />
            )
          })}
        </group>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Wet floor sign, staff door, bread rack, card reader
// ---------------------------------------------------------------------------

const SIGN_HANDLE = new TorusGeometry(0.06, 0.014, 10, 24, PI)

export function WetFloorSign({ lines }: { lines: string[] }) {
  const map = useMemo(() => warningSignTexture(lines), [lines])
  return (
    <>
      {[-1, 1].map((s) => (
        // two boards leaning in to meet at the top
        <group key={s} position={[0, 0.32, s * 0.06]} rotation={[-s * 0.19, s === 1 ? 0 : PI, 0]}>
          <Block size={[0.32, 0.64, 0.012]} position={[0, 0, 0]} color="#ffd21f" roughness={0.5} radius={0.004} paint />
          <mesh position={[0, 0, 0.007]}>
            <planeGeometry args={[0.3, 0.45]} />
            <meshStandardMaterial map={map} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* the hinge where the boards meet, and a carry handle */}
      <Block size={[0.3, 0.03, 0.045]} position={[0, 0.634, 0]} color="#f2c200" roughness={0.5} radius={0.012} paint />
      <mesh geometry={SIGN_HANDLE} position={[0, 0.645, 0]} userData={{ paint: true }}>
        <meshStandardMaterial color="#ffd21f" roughness={0.5} />
      </mesh>
    </>
  )
}

const HINGE = new CylinderGeometry(0.011, 0.011, 0.09, 12)
const HINGE_MAT = new MeshStandardMaterial({ color: '#c9ced6', metalness: 0.9, roughness: 0.25 })

/** "Staff only" door, hinged on its left; `ajar`, something waits in the dark behind it. */
export function StaffDoor({ ajar }: { ajar: boolean }) {
  const plaque = useMemo(() => plaqueTexture('STAFF ONLY'), [])
  const stockroom = useMemo(() => dimCorridorTexture('#2c2925'), [])
  return (
    <>
      {/* the dim stockroom behind, only seen when the door is open */}
      <mesh position={[0, 1.0, 0.004]}>
        <planeGeometry args={[0.86, 2.0]} />
        <meshBasicMaterial map={stockroom} />
      </mesh>
      {ajar &&
        [-1, 1].map((s) => (
          // in the gap by the door's open edge
          <mesh key={s} position={[0.38 + s * 0.028, 1.55, 0.01]}>
            <sphereGeometry args={[0.014, 12, 10]} />
            <meshBasicMaterial color="#fff36b" toneMapped={false} />
          </mesh>
        ))}
      {/* open just far enough to see the eyes through the gap */}
      <group position={[-0.43, 0, 0.03]} rotation={[0, ajar ? -0.3 : 0, 0]}>
        <Block size={[0.86, 2.0, 0.04]} position={[0.43, 1.0, 0]} color="#6f7f8c" roughness={0.5} radius={0.01} paint />
        <mesh position={[0.43, 1.55, 0.022]}>
          <planeGeometry args={[0.36, 0.135]} />
          <meshStandardMaterial map={plaque} roughness={0.5} />
        </mesh>
        {/* lever handle on its back plate, a scuffed kick plate, three hinges */}
        <Block size={[0.045, 0.17, 0.008]} position={[0.79, 1.0, 0.022]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.003} />
        <Block size={[0.024, 0.024, 0.04]} position={[0.79, 1.03, 0.04]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.008} />
        <Block size={[0.13, 0.024, 0.024]} position={[0.735, 1.03, 0.065]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.01} />
        <Block size={[0.78, 0.2, 0.006]} position={[0.43, 0.13, 0.022]} color="#b8bec4" metalness={0.7} roughness={0.45} radius={0.002} />
        {[0.28, 1.0, 1.72].map((y) => (
          <mesh key={y} geometry={HINGE} material={HINGE_MAT} position={[0.004, y, 0.02]} />
        ))}
      </group>
      {/* frame */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, 2.06, 0.06]} position={[s * 0.46, 1.03, 0.03]} color="#f2efe8" roughness={0.45} />
      ))}
      <Block size={[0.98, 0.06, 0.06]} position={[0, 2.06, 0.03]} color="#f2efe8" roughness={0.45} />
    </>
  )
}

const LOAF = new RoundedBoxGeometry(0.26, 0.12, 0.12, 4, 0.045)
const TIE = new SphereGeometry(0.022, 10, 8)
const BLOOMER = new SphereGeometry(1, 24, 14)
const SLASH = new BoxGeometry(0.008, 0.004, 0.09)
const BREADS = ['white', 'brown', 'seeded'] as const

/** Wire bread rack: crusty bloomers on the bottom, bagged sliced loaves above (static). */
export function BreadRack() {
  const metal = { color: '#c9ced6', metalness: 0.7, roughness: 0.35 }
  const mats = useMemo(
    () => ({
      bags: BREADS.map((k) => new MeshStandardMaterial({ map: breadBagTexture(k), roughness: 0.35 })),
      tie: new MeshStandardMaterial({ color: '#d6a440', roughness: 0.6 }),
      crust: new MeshStandardMaterial({ color: '#b5763a', roughness: 0.8 }),
      slash: new MeshStandardMaterial({ color: '#e8cf9c', roughness: 0.9 }),
    }),
    [],
  )
  const loaves = useMemo(() => {
    const bags: Placement[][] = [[], [], []]
    const ties: Placement[] = []
    const bloomers: Placement[] = []
    const slashes: Placement[] = []
    // two shelves of bagged loaves, long side to the front, two deep
    ;[0.7, 1.1].forEach((y, row) =>
      [-0.38, -0.13, 0.12, 0.37].forEach((x, i) => {
        for (const [k, z] of [
          [0, 0.09],
          [1, -0.08],
        ]) {
          bags[(i + row + k) % 3].push({ at: [x, y + 0.07, z] })
          ties.push({ at: [x + 0.14, y + 0.075, z] })
        }
      }),
    )
    // crusty bloomers on the bottom shelf, each with three slashes on top
    ;[-0.36, -0.12, 0.12, 0.36].forEach((x) =>
      [0.08, -0.1].forEach((z) => {
        bloomers.push({ at: [x, 0.3 + 0.06, z], scale: [0.11, 0.06, 0.07] })
        for (const dx of [-0.05, 0, 0.05]) slashes.push({ at: [x + dx, 0.3 + 0.12, z], rot: [0, 0.5, 0] })
      }),
    )
    return { bags, ties, bloomers, slashes }
  }, [])
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, 1.4, 0.45]} position={[s * 0.55, 0.7, 0]} {...metal} radius={0.008} />
      ))}
      {[0.3, 0.7, 1.1].map((y) => (
        <Block key={y} size={[1.1, 0.02, 0.42]} position={[0, y, 0]} {...metal} radius={0.004} />
      ))}
      {loaves.bags.map((items, k) => (
        <Instanced key={k} geometry={LOAF} material={mats.bags[k]} items={items} />
      ))}
      <Instanced geometry={TIE} material={mats.tie} items={loaves.ties} />
      <Instanced geometry={BLOOMER} material={mats.crust} items={loaves.bloomers} />
      <Instanced geometry={SLASH} material={mats.slash} items={loaves.slashes} />
    </>
  )
}

const KEY = new BoxGeometry(0.017, 0.006, 0.012)
const KEY_MAT = new MeshStandardMaterial({ color: '#d9dde2', roughness: 0.5 })
const KEYS: Placement[] = [0, 1, 2, 3].flatMap((r) => [-1, 0, 1].map((c): Placement => ({ at: [c * 0.022, 0.026, -0.03 - r * 0.017] })))
const ACTION_KEYS = ['#e0262a', '#ffde21', '#2fbf71']

/** Card machine in its cradle on the counter, leaning back towards whoever is paying (+z). */
export function CardReader() {
  return (
    <>
      <Block size={[0.09, 0.02, 0.12]} position={[0, 0.01, -0.07]} color="#2a2a2e" roughness={0.5} radius={0.006} />
      <Block size={[0.06, 0.056, 0.02]} position={[0, 0.048, -0.083]} color="#2a2a2e" roughness={0.5} radius={0.005} />
      {/* the terminal, hinged at its bottom edge: keypad near the payer, screen and card slot further up */}
      <group position={[0, 0.02, 0]} rotation={[0.6, 0, 0]}>
        <Block size={[0.08, 0.025, 0.165]} position={[0, 0.0125, -0.0825]} color="#1c1c1f" roughness={0.4} radius={0.01} />
        <Instanced geometry={KEY} material={KEY_MAT} items={KEYS} />
        {ACTION_KEYS.map((color, i) => (
          <Block key={color} size={[0.017, 0.006, 0.01]} position={[(i - 1) * 0.022, 0.026, -0.012]} color={color} roughness={0.5} radius={0.002} />
        ))}
        <mesh position={[0, 0.0255, -0.125]} rotation={[-PI / 2, 0, 0]}>
          <planeGeometry args={[0.062, 0.042]} />
          <meshStandardMaterial color="#3fd0ff" emissive="#3fd0ff" emissiveIntensity={0.6} />
        </mesh>
        <Block size={[0.07, 0.008, 0.012]} position={[0, 0.023, -0.155]} color="#050505" roughness={0.6} radius={0.003} />
      </group>
    </>
  )
}
