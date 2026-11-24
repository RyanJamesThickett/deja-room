import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import { CapsuleGeometry, CatmullRomCurve3, ConeGeometry, ExtrudeGeometry, Shape, TorusGeometry, TubeGeometry, Vector3, type Group } from 'three'
import { Instanced, PI, type Placement } from '../../kit'
import { once } from '../../outsideLayers'
import { Fish } from '../kitchen/prep'
import { FacesYou } from '../living/oddities'
import type { Vec3 } from './build'
import { STALL_SIGNS } from './cityPlan'
import { MAT } from './materials'
import {
  BAGUETTE,
  BALL,
  BREAD,
  BUCKET,
  bunch,
  CHEESE,
  COUNTER,
  DISC,
  DOUGHNUT,
  doughnutTray,
  glossMaterial,
  HEAD,
  ICE_MAT,
  ICING,
  LEMON,
  LOAF,
  matteMaterial,
  MUSSEL,
  PRAWN,
  snailShell,
  STEM_CLUMP,
  SUNFLOWER,
  trayFill,
  UNIT_BOX,
  WHEEL,
} from './stallParts'
import { Awning, StallFrame } from './StallFrame'

/*
 * The stalls along the north side of the square, each facing the fountain:
 * the fishmonger, the cheese stall, the bakery and the flower stall. Each
 * stall's ordinary stock is fixed; `*Change` components draw the part that
 * a swap changes.
 */

const TOP = COUNTER.top

// ---------------------------------------------------------------------------
// Fishmonger: sea bass on crushed ice, heads to the customer
// ---------------------------------------------------------------------------

const FISH_COLOUR = '#1f4f8a'
/** The ice bed tilts towards the customer, and everything on it tilts with it. */
const ICE_TILT = 0.12
const FISH_XS = [-1.12, -0.89, -0.66, -0.2, 0.03]
/** The one fish that changes. */
const ODD_FISH_X = -0.43
/** Big sea bass, the size a fishmonger lays out. */
const FISH_SCALE = 1.35

const fishSide = once(() => ({
  prawns: trayFill([0.5, 0.08, 0], 0.44, 0.6, 0.075, 3),
  mussels: trayFill([1.0, 0.08, 0], 0.44, 0.6, 0.06, 4),
  lemons: [0.2, 0.22, 0.18, 0.21].map((x, i): Placement => ({ at: [x, 0.1, -0.24 + i * 0.16], rot: [0, i, 0] })),
  parsley: Array.from({ length: 14 }, (_, i): Placement => ({ at: [0.2 + Math.sin(i * 2.1) * 0.03, 0.085, -0.3 + i * 0.045], scale: [0.025, 0.02, 0.025] })),
}))

function IceBed({ children }: { children?: ReactNode }) {
  return (
    <group position={[0, TOP, COUNTER.z]} rotation={[ICE_TILT, 0, 0]}>
      <mesh geometry={UNIT_BOX} material={ICE_MAT} position={[0, 0.035, 0]} scale={[2.5, 0.07, 0.76]} receiveShadow />
      {children}
    </group>
  )
}

/** A sea bass lying on its side on the ice, its head towards the front (+z). */
function LyingFish({ x }: { x: number }) {
  return (
    <group position={[x, 0.07, 0]} rotation={[0, -PI / 2, 0]} scale={FISH_SCALE}>
      <Fish mode="whole" />
    </group>
  )
}

export function FishStall() {
  const side = fishSide()
  return (
    <StallFrame cloth="#eef1f2" sheet="#d9e6ee" sign={STALL_SIGNS.fish}>
      <Awning colour={FISH_COLOUR} paint />
      <IceBed>
        {FISH_XS.map((x) => (
          <LyingFish key={x} x={x} />
        ))}
        {[0.5, 1.0].map((x) => (
          <mesh key={x} geometry={UNIT_BOX} material={MAT.steel} position={[x, 0.08, 0]} scale={[0.48, 0.02, 0.64]} />
        ))}
        <Instanced geometry={PRAWN} material={glossMaterial('#f08a6a')} items={side.prawns} />
        <Instanced geometry={MUSSEL} material={glossMaterial('#1d2230')} items={side.mussels} />
        <Instanced geometry={LEMON} material={glossMaterial('#f6d83a')} items={side.lemons} />
        <Instanced geometry={BALL} material={matteMaterial('#3f8a2f')} items={side.parsley} />
      </IceBed>
    </StallFrame>
  )
}

const WHISKER = (side: 1 | -1, droop: number) =>
  new TubeGeometry(
    new CatmullRomCurve3([new Vector3(0.235, -0.012, side * 0.012), new Vector3(0.29, -0.02 - droop, side * 0.05), new Vector3(0.33, -0.05 - droop * 2, side * 0.1)]),
    10,
    0.0025,
    4,
    false,
  )
const CATFISH = once(() => ({
  whiskers: [WHISKER(1, 0), WHISKER(1, 0.02), WHISKER(-1, 0), WHISKER(-1, 0.02)],
  ear: new ConeGeometry(0.032, 0.06, 3),
  inner: new ConeGeometry(0.018, 0.035, 3),
}))

/** The odd fish out: sitting upright on its belly with whiskers and pointed cat's ears, looking at you. */
function Catfish() {
  const c = CATFISH()
  return (
    <group position={[ODD_FISH_X, 0.07 + 0.05 * FISH_SCALE, 0]} rotation={[0, -PI / 2, 0]} scale={FISH_SCALE}>
      {/* the kitchen's fish lies on its side: stand it back up on its belly */}
      <group rotation={[PI / 2, 0, 0]}>
        <Fish mode="whole" />
      </group>
      {c.whiskers.map((g, i) => (
        <mesh key={i} geometry={g} material={MAT.black} />
      ))}
      {[-1, 1].map((s) => (
        <group key={s} position={[0.155, 0.052, s * 0.022]} rotation={[s * 0.35, 0, -0.15]}>
          <mesh geometry={c.ear} material={glossMaterial('#7b8790')} position={[0, 0.025, 0]} />
          <mesh geometry={c.inner} material={matteMaterial('#e8a0a8')} position={[0.012, 0.022, 0]} rotation={[0, 0, 0]} />
        </group>
      ))}
    </group>
  )
}

export function FishChange({ mode }: { mode: 'default' | 'catfish' | 'stare' | 'bones' }) {
  return (
    <group position={[0, TOP, COUNTER.z]} rotation={[ICE_TILT, 0, 0]}>
      {mode === 'catfish' ? (
        <Catfish />
      ) : (
        <group position={[ODD_FISH_X, 0.07, 0]} rotation={[0, -PI / 2, 0]} scale={FISH_SCALE}>
          <Fish mode={mode === 'default' ? 'whole' : mode === 'stare' ? 'staring' : 'bones'} />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Cheese: wheels, wedges and wax-coated balls on wooden boards
// ---------------------------------------------------------------------------

const CHEESE_COLOUR = '#e3a81c'
const STACK: Vec3 = [-0.92, TOP + 0.02, 0.55]

/** A wedge cut from a wheel: a sector, lying flat with its point at the origin towards -x... closed on every side. */
const WEDGE_SOLID = (() => {
  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.absarc(0, 0, 0.2, -0.35, 0.35, false)
  shape.closePath()
  return new ExtrudeGeometry(shape, { depth: 0.13, bevelEnabled: false, curveSegments: 8 }).rotateX(-PI / 2)
})()

function Wheel({ at, scale = 1, pale = false }: { at: Vec3; scale?: number; pale?: boolean }) {
  return (
    <mesh geometry={WHEEL} material={[CHEESE.rind, pale ? CHEESE.pale : CHEESE.paste, pale ? CHEESE.pale : CHEESE.paste]} position={at} scale={[scale, 1, scale]} castShadow receiveShadow />
  )
}

export function CheeseStall() {
  return (
    <StallFrame cloth="#2f5a3a" sign={STALL_SIGNS.cheese}>
      {[-0.7, 0.45].map((x) => (
        <mesh key={x} geometry={UNIT_BOX} material={CHEESE.board} position={[x, TOP + 0.01, COUNTER.z]} scale={[1.05, 0.02, 0.66]} castShadow receiveShadow />
      ))}
      {/* a pale wheel, and wedges fanned out at the front */}
      <Wheel at={[-0.42, TOP + 0.085, 0.72]} pale />
      {[0, 1, 2, 3, 4].map((k) => (
        <group key={k} position={[0.02 + k * 0.17, TOP + 0.02, 0.9]} rotation={[0, PI / 2 + 0.35 - k * 0.04, 0]}>
          <mesh geometry={WEDGE_SOLID} material={k % 2 ? CHEESE.paste : CHEESE.pale} scale={0.75} castShadow />
        </group>
      ))}
      {/* blue cheeses and little rounds at the back */}
      {[0.15, 0.38, 0.61].map((x, i) => (
        <mesh key={x} geometry={DISC} material={i === 1 ? CHEESE.pale : CHEESE.blue} position={[x, TOP + 0.06, 0.42]} scale={[0.09, 0.1, 0.09]} castShadow />
      ))}
      {/* red wax balls in a basket */}
      <mesh geometry={DISC} material={BREAD.wicker} position={[1.02, TOP + 0.04, 0.6]} scale={[0.2, 0.08, 0.2]} castShadow />
      {[
        [0.95, 0.55],
        [1.09, 0.56],
        [1.02, 0.69],
        [1.02, 0.6],
      ].map(([x, z], i) => (
        <mesh key={i} geometry={BALL} material={CHEESE.wax} position={[x, TOP + 0.13 + (i === 3 ? 0.09 : 0), z]} scale={0.075} castShadow />
      ))}
    </StallFrame>
  )
}

const SNAIL = once(() => ({
  body: new CapsuleGeometry(0.06, 0.34, 6, 12).rotateX(PI / 2).scale(1.1, 0.75, 1),
  stalk: new CapsuleGeometry(0.008, 0.11, 3, 6),
}))

/** A snail the size of a cat, crawling over the top of the stack towards the customers. */
function Snail() {
  const s = SNAIL()
  const skin = glossMaterial('#9c8a6a')
  return (
    <group>
      <mesh geometry={s.body} material={skin} position={[0, 0.045, 0.05]} castShadow />
      {/* the shell rides on its back, its spiral side-on */}
      <mesh geometry={snailShell()} material={MAT.shell} position={[0, 0.2, -0.04]} rotation={[0, PI / 2, 0]} scale={0.85} castShadow />
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.03, 0.08, 0.26]} rotation={[0.5, 0, k * 0.3]}>
          <mesh geometry={s.stalk} material={skin} position={[0, 0.06, 0]} />
          <mesh geometry={BALL} material={MAT.black} position={[0, 0.125, 0]} scale={0.014} />
        </group>
      ))}
      {/* the slime trail it left down the stack */}
      <mesh geometry={UNIT_BOX} material={MAT.slime} position={[0, -0.002, -0.12]} scale={[0.09, 0.004, 0.3]} />
    </group>
  )
}

export function CheeseChange({ mode }: { mode: 'default' | 'snail' | 'tower' | 'stripes' }) {
  const n = mode === 'tower' ? 9 : 3
  return (
    <>
      <Awning colour={CHEESE_COLOUR} across={mode === 'stripes'} />
      {Array.from({ length: n }, (_, k) => (
        <Wheel key={k} at={[STACK[0], STACK[1] + 0.065 + k * 0.13, STACK[2]]} scale={1 - (k % 2) * 0.03} />
      ))}
      {mode === 'snail' && (
        <group position={[STACK[0], STACK[1] + n * 0.13 + 0.01, STACK[2]]} rotation={[0, 0.3, 0]} scale={1.7}>
          <Snail />
        </group>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Bakery: loaves in baskets, baguettes standing up, croissants, doughnuts
// ---------------------------------------------------------------------------

const BAKERY_COLOUR = '#8a4a24'
const TRAY: Vec3 = [1.0, TOP + 0.02, 0.62]
const CROISSANT = new TorusGeometry(0.05, 0.022, 8, 12, PI * 1.25)

const bakeryStock = once(() => ({
  pink: doughnutTray([0.5, TOP + 0.02, 0.62], 4, 3),
  plain: doughnutTray(TRAY, 4, 3),
  baguettes: Array.from({ length: 7 }, (_, i): Placement => ({ at: [-1.0 + Math.cos(i * 0.9) * 0.05, TOP + 0.02, 0.32 + Math.sin(i * 0.9) * 0.05], rot: [Math.sin(i * 1.7) * 0.18, 0, Math.cos(i * 1.3) * 0.18] })),
  croissants: Array.from({ length: 6 }, (_, i): Placement => ({ at: [-0.18 + (i % 3) * 0.13, TOP + 0.045, 0.52 + Math.floor(i / 3) * 0.16], rot: [PI / 2, 0, 0.9 + i * 0.4] })),
}))

export function BakeryStall() {
  const s = bakeryStock()
  return (
    <StallFrame cloth="#f1e6cf" sheet="#e8d4b0" sign={STALL_SIGNS.bakery}>
      <Awning colour={BAKERY_COLOUR} />
      {/* bloomers in a long basket */}
      <mesh geometry={DISC} material={BREAD.wicker} position={[-0.72, TOP + 0.04, 0.74]} scale={[0.26, 0.08, 0.2]} castShadow />
      {[-0.84, -0.6].map((x, i) => (
        <group key={x}>
          <mesh geometry={LOAF} material={BREAD.crust} position={[x, TOP + 0.12, 0.7 + i * 0.07]} scale={[0.13, 0.07, 0.075]} rotation={[0, 0.2, 0]} castShadow />
          <mesh geometry={LOAF} material={BREAD.dark} position={[x + 0.04, TOP + 0.11, 0.84 - i * 0.04]} scale={[0.12, 0.065, 0.07]} rotation={[0, -0.3, 0]} castShadow />
        </group>
      ))}
      {/* baguettes standing in a tall basket */}
      <mesh geometry={DISC} material={BREAD.wicker} position={[-1.0, TOP + 0.15, 0.32]} scale={[0.12, 0.3, 0.12]} castShadow />
      <Instanced geometry={BAGUETTE} material={BREAD.crust} items={s.baguettes} castShadow />
      {/* croissants on a board */}
      <mesh geometry={UNIT_BOX} material={CHEESE.board} position={[-0.05, TOP + 0.01, 0.6]} scale={[0.46, 0.02, 0.42]} castShadow />
      <Instanced geometry={CROISSANT} material={BREAD.dough} items={s.croissants} castShadow />
      {/* pink iced doughnuts; the plain ones are the tray that changes */}
      {[0.5, TRAY[0]].map((x) => (
        <mesh key={x} geometry={UNIT_BOX} material={MAT.steel} position={[x, TOP + 0.01, 0.62]} scale={[0.48, 0.02, 0.38]} />
      ))}
      <Instanced geometry={DOUGHNUT} material={BREAD.dough} items={s.pink} castShadow />
      <Instanced geometry={ICING} material={BREAD.pink} items={s.pink.map((p) => ({ ...p, at: [p.at[0], p.at[1] + 0.008, p.at[2]] as Vec3 }))} />
    </StallFrame>
  )
}

/** The doughnuts have lifted off the tray and are circling over the stall like a halo. */
function DoughnutHalo() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.5
  })
  return (
    <group position={[0.35, TOP + 0.9, 0.62]}>
      <group ref={ref}>
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k / 12) * PI * 2
          return (
            <group key={k} position={[Math.cos(a) * 0.62, Math.sin(k * 1.7) * 0.04, Math.sin(a) * 0.42]} rotation={[PI / 2 - 0.35, 0, a]} scale={1.5}>
              <mesh geometry={DOUGHNUT} material={BREAD.dough} castShadow />
              <mesh geometry={ICING} material={k % 2 ? BREAD.choc : BREAD.pink} position={[0, 0, -0.008]} />
            </group>
          )
        })}
      </group>
    </group>
  )
}

export function BakeryChange({ mode }: { mode: 'default' | 'giant' | 'halo' }) {
  const s = bakeryStock()
  const iced = s.plain.map((p) => ({ ...p, at: [p.at[0], p.at[1] + 0.008, p.at[2]] as Vec3 }))
  return (
    <>
      {mode === 'halo' ? (
        <DoughnutHalo />
      ) : (
        <>
          <Instanced geometry={DOUGHNUT} material={BREAD.dough} items={s.plain} castShadow />
          <Instanced geometry={ICING} material={BREAD.choc} items={iced} />
        </>
      )}
      {mode === 'giant' && (
        // one doughnut the size of a car tyre, standing on its edge at the back of the counter
        <group position={[0.5, TOP + 0.37, 0.3]}>
          <mesh geometry={DOUGHNUT} material={BREAD.dough} scale={5.2} castShadow />
          <mesh geometry={ICING} material={BREAD.pink} position={[0, 0, 0.04]} scale={5.2} castShadow />
        </group>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Flowers: buckets on a stepped stand, sunflowers at the back
// ---------------------------------------------------------------------------

const FLOWER_COLOUR = '#d6457a'
/** Step tops and the depth of each step's front edge, front to back. */
const STEPS = [
  { y: 0.35, z: 0.85 },
  { y: 0.65, z: 0.53 },
  { y: 0.95, z: 0.21 },
]
const BUCKET_XS = [-1.08, -0.65, -0.22, 0.22, 0.65, 1.08]
/** Which bucket holds what: step, bucket, colour. Roses are the ones that change. */
const BLOOMS: { step: number; i: number; colour: string }[] = [
  { step: 0, i: 0, colour: '#f2d23a' },
  { step: 0, i: 1, colour: '#ffffff' },
  { step: 0, i: 2, colour: 'rose' },
  { step: 0, i: 3, colour: '#ff8a1f' },
  { step: 0, i: 4, colour: 'rose' },
  { step: 0, i: 5, colour: '#8a4dff' },
  { step: 1, i: 0, colour: '#ff9fc4' },
  { step: 1, i: 1, colour: 'rose' },
  { step: 1, i: 2, colour: '#f2d23a' },
  { step: 1, i: 3, colour: '#ffffff' },
  { step: 1, i: 4, colour: 'rose' },
  { step: 1, i: 5, colour: '#ff3fa4' },
  { step: 2, i: 0, colour: '#8a4dff' },
  { step: 2, i: 1, colour: '#ff8a1f' },
  { step: 2, i: 2, colour: 'rose' },
  { step: 2, i: 3, colour: '#ff9fc4' },
  { step: 2, i: 4, colour: '#f2d23a' },
  { step: 2, i: 5, colour: 'rose' },
]
const SUNFLOWERS: { at: Vec3; tilt: number }[] = [
  { at: [-0.85, 1.62, -0.32], tilt: 0.15 },
  { at: [-0.62, 1.48, -0.25], tilt: -0.1 },
  { at: [-0.05, 1.7, -0.34], tilt: 0.05 },
  { at: [0.2, 1.52, -0.26], tilt: -0.2 },
  { at: [0.72, 1.6, -0.3], tilt: 0.1 },
  { at: [0.95, 1.45, -0.24], tilt: -0.05 },
]

const flowerLayout = once(() => {
  const buckets: Placement[] = []
  const byColour = new Map<string, Placement[]>()
  BLOOMS.forEach((b, k) => {
    const s = STEPS[b.step]
    const at: Vec3 = [BUCKET_XS[b.i], s.y, s.z - 0.16]
    buckets.push({ at })
    const heads = bunch([at[0], at[1] + 0.27, at[2]], 100 + k)
    byColour.set(b.colour, [...(byColour.get(b.colour) ?? []), ...heads])
  })
  const clumps = buckets.map((p): Placement => ({ at: [p.at[0], p.at[1] + 0.34, p.at[2]] }))
  const tall = [-0.75, 0.05, 0.85].map((x): Placement => ({ at: [x, 0, -0.3], scale: [1.25, 1.6, 1.25] }))
  return { buckets: [...buckets, ...tall], clumps, colours: [...byColour.entries()].filter(([c]) => c !== 'rose'), roses: byColour.get('rose')! }
})

export function FlowerStall() {
  const f = flowerLayout()
  return (
    <StallFrame sign={STALL_SIGNS.flowers}>
      <Awning colour={FLOWER_COLOUR} paint />
      {STEPS.map((s, i) => (
        <mesh key={i} geometry={UNIT_BOX} material={matteMaterial('#2f4a35')} position={[0, s.y / 2, s.z - 0.16]} scale={[2.62, s.y, 0.32]} castShadow receiveShadow />
      ))}
      <Instanced geometry={BUCKET} material={MAT.steel} items={f.buckets} castShadow />
      <Instanced geometry={STEM_CLUMP} material={matteMaterial('#3f7a2f')} items={f.clumps} />
      {f.colours.map(([colour, heads]) => (
        <Instanced key={colour} geometry={HEAD} material={glossMaterial(colour)} items={heads} />
      ))}
    </StallFrame>
  )
}

/** A sunflower head on its stem; `watching` turns to follow you round the market. */
function Sunflower({ at, tilt, watching }: { at: Vec3; tilt: number; watching: boolean }) {
  const head = (
    <>
      <mesh geometry={SUNFLOWER.petals} material={SUNFLOWER.petalMat} castShadow />
      <mesh geometry={SUNFLOWER.centre} material={SUNFLOWER.centreMat} position={[0, 0, 0.008]} />
    </>
  )
  return (
    <group position={at}>
      <mesh geometry={SUNFLOWER.stem} material={SUNFLOWER.stemMat} scale={[1, at[1] - 0.35, 1]} />
      {watching ? <FacesYou position={[0, 0, 0]}>{head}</FacesYou> : <group rotation={[-0.25, tilt, 0]}>{head}</group>}
    </group>
  )
}

export function FlowerChange({ mode }: { mode: 'default' | 'black' | 'watch' }) {
  const f = flowerLayout()
  return (
    <>
      <Instanced geometry={HEAD} material={glossMaterial(mode === 'black' ? '#141012' : '#c8102e')} items={f.roses} />
      {SUNFLOWERS.map((s, i) => (
        <Sunflower key={i} at={s.at} tilt={s.tilt} watching={mode === 'watch'} />
      ))}
    </>
  )
}
