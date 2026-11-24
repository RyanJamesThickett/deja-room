import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import { CylinderGeometry, SphereGeometry, type Group } from 'three'
import { Instanced, PI, type Placement } from '../../kit'
import { Model } from '../../Model'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { FacesYou, Hover, OpenBook } from '../living/oddities'
import type { Vec3 } from './build'
import { STALL_SIGNS } from './cityPlan'
import { MAT } from './materials'
import {
  BALL,
  BANANA,
  BANANA_HAND,
  bananaHands,
  BOOK,
  BOOK_COLOURS,
  booksIn,
  COUNTER,
  CRATE_MAT,
  crateGeometry,
  DISC,
  DISPLAY_HEAD,
  glossMaterial,
  HATS,
  heap,
  lathe,
  LEMON,
  matteMaterial,
  MELON,
  MELON_CUBE,
  MELON_MAT,
  meltedRecord,
  NECK,
  POLY,
  PUMPKIN,
  RECORD,
  SLEEVE,
  SLEEVE_COLOURS,
  sleevesIn,
  UNIT_BOX,
  type HatKind,
} from './stallParts'
import { Awning, StallFrame } from './StallFrame'
import { Tinted } from './Tinted'

/*
 * The stalls along the south side, facing the fountain: fruit and veg,
 * antiques and bric-a-brac, second-hand records and books, and hats.
 * Built facing +z like every stall, and turned round in the scene.
 */

const TOP = COUNTER.top

// ---------------------------------------------------------------------------
// Fruit and veg: crates tilted towards the customer on two tiers
// ---------------------------------------------------------------------------

const CRATE_XS = [-1.04, -0.52, 0, 0.52, 1.04]
const TIER_TILT = 0.2
const FRONT_TIER: Vec3 = [0, TOP, 0.82]
const BACK_TIER: Vec3 = [0, TOP + 0.22, 0.41]
const SMALL_CRATE = '0.5,0.36,0.12'

const fruitLayout = once(() => {
  const inCrate = (i: number, r: number, seed: number, squash = 1) => heap([CRATE_XS[i], 0.012, 0], 0.46, 0.32, r, seed, squash)
  return {
    crates: CRATE_XS.map((x): Placement => ({ at: [x, 0, 0] })),
    apples: inCrate(0, 0.038, 1),
    oranges: inCrate(1, 0.041, 2),
    lemons: inCrate(2, 0.034, 3),
    limes: inCrate(3, 0.028, 4),
    tomatoes: inCrate(4, 0.033, 5, 0.85),
    avocados: inCrate(1, 0.04, 6, 1.3),
    peppers: inCrate(2, 0.045, 7, 0.9),
    potatoes: inCrate(3, 0.04, 8, 0.75),
    cabbages: inCrate(4, 0.085, 9),
    bananas: bananaHands([CRATE_XS[0], 0.012, 0]),
    pumpkins: [
      { at: [-0.95, 0, 1.32], rot: [0, 0.4, 0] },
      { at: [-0.6, 0, 1.38], rot: [0, 1.4, 0], scale: [0.85, 0.85, 0.85] },
      { at: [-0.8, 0.2, 1.33], rot: [0.1, 2.1, 0], scale: [0.7, 0.7, 0.7] },
    ] as Placement[],
  }
})

function Tier({ at, children }: { at: Vec3; children: ReactNode }) {
  return (
    <group position={at} rotation={[TIER_TILT, 0, 0]}>
      <Instanced geometry={crateGeometry(SMALL_CRATE)} material={CRATE_MAT} items={fruitLayout().crates} castShadow />
      {children}
    </group>
  )
}

/** A spring balance hanging off the front bar, its brass pan on three chains. */
function HangingScale() {
  return (
    <group position={[0.75, 2.12, 1.05]}>
      <mesh geometry={DISC} material={MAT.white} position={[0, -0.16, 0]} rotation={[PI / 2, 0, 0]} scale={[0.09, 0.04, 0.09]} />
      <mesh geometry={DISC} material={MAT.iron} position={[0, -0.16, -0.022]} rotation={[PI / 2, 0, 0]} scale={[0.1, 0.02, 0.1]} />
      {[0, 1, 2].map((k) => {
        const a = (k / 3) * PI * 2
        return <mesh key={k} geometry={UNIT_BOX} material={MAT.steel} position={[Math.cos(a) * 0.07, -0.37, Math.sin(a) * 0.07]} rotation={[Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32]} scale={[0.005, 0.3, 0.005]} />
      })}
      <mesh geometry={lathe([[0, 0], [0.13, 0.03], [0.15, 0.05]], 20)} material={MAT.brass} position={[0, -0.56, 0]} />
    </group>
  )
}

export function FruitStall() {
  const f = fruitLayout()
  return (
    <StallFrame cloth="#3c7a2a" sign={STALL_SIGNS.fruit}>
      <Awning colour="#2f8a3a" />
      {/* the riser the back tier stands on, under the same green cloth */}
      <mesh geometry={UNIT_BOX} material={matteMaterial('#3c7a2a')} position={[0, TOP + 0.11, 0.41]} scale={[2.6, 0.22, 0.38]} castShadow receiveShadow />
      <Tier at={FRONT_TIER}>
        <Instanced geometry={BALL} material={glossMaterial('#b8202a')} items={f.apples} castShadow />
        <Instanced geometry={BALL} material={glossMaterial('#f28a1a')} items={f.oranges} castShadow />
        <Instanced geometry={LEMON} material={glossMaterial('#f6d83a')} items={f.lemons.map((p) => ({ ...p, scale: [1, 1, 1] }))} castShadow />
        <Instanced geometry={BALL} material={glossMaterial('#6aa82a')} items={f.limes} castShadow />
        <Instanced geometry={BALL} material={glossMaterial('#e0301e')} items={f.tomatoes} castShadow />
      </Tier>
      <Tier at={BACK_TIER}>
        <Instanced geometry={BALL} material={glossMaterial('#2f4a1f')} items={f.avocados} castShadow />
        <Instanced geometry={BALL} material={glossMaterial('#d8281e')} items={f.peppers} castShadow />
        <Instanced geometry={BALL} material={matteMaterial('#b08a5a')} items={f.potatoes} castShadow />
        <Instanced geometry={BALL} material={matteMaterial('#7aa84a')} items={f.cabbages} castShadow />
      </Tier>
      <Instanced geometry={PUMPKIN} material={glossMaterial('#e8781a')} items={f.pumpkins.map((p) => ({ ...p, at: [p.at[0], p.at[1] + 0.12, p.at[2]] as Vec3 }))} castShadow />
      {/* the watermelon crate on the ground at the front */}
      <mesh geometry={crateGeometry('0.8,0.5,0.28')} material={CRATE_MAT} position={[0.72, 0, 1.38]} castShadow />
      <HangingScale />
    </StallFrame>
  )
}

export function FruitChange({ mode }: { mode: 'default' | 'square' | 'blue' }) {
  const f = fruitLayout()
  const square = mode === 'square'
  return (
    <>
      <group position={BACK_TIER} rotation={[TIER_TILT, 0, 0]}>
        <Instanced geometry={BANANA_HAND} material={mode === 'blue' ? BANANA.blue : BANANA.yellow} items={f.bananas} castShadow />
      </group>
      <group position={[0.72, 0.012, 1.38]}>
        {[
          [-0.19, 0.14, 0],
          [0.19, 0.14, 0],
          [0, 0.4, 0],
        ].map(([x, y, z], i) =>
          square ? (
            <mesh key={i} geometry={MELON_CUBE} material={MELON_MAT} position={[x, y - 0.01, z]} rotation={[0, i * 0.2, 0]} castShadow />
          ) : (
            <mesh key={i} geometry={MELON} material={MELON_MAT} position={[x, y - 0.002, z]} rotation={[0, i * 0.3, 0]} castShadow />
          ),
        )}
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Antiques: a marble bust, vases, a gramophone, a clock and a mirror
// ---------------------------------------------------------------------------

const HORN = once(() => ({
  small: lathe([[0.012, 0], [0.02, 0.15], [0.05, 0.3], [0.12, 0.4], [0.2, 0.43]], 24),
  big: lathe([[0.03, 0], [0.05, 0.25], [0.15, 0.55], [0.33, 0.74], [0.5, 0.8]], 32),
}))

function Gramophone({ big }: { big: boolean }) {
  const h = HORN()
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.darkWood} position={[0, 0.07, 0]} scale={[0.32, 0.14, 0.32]} castShadow />
      <mesh geometry={DISC} material={MAT.black} position={[0, 0.145, 0.02]} scale={[0.13, 0.01, 0.13]} />
      <mesh geometry={DISC} material={MAT.brass} position={[0.11, 0.2, -0.1]} scale={[0.012, 0.12, 0.012]} />
      {/* the horn rises from the back and opens towards the customer */}
      <group position={[0.11, 0.26, -0.1]} rotation={[0.85, 0, 0]}>
        <mesh geometry={big ? h.big : h.small} material={MAT.brass} castShadow />
      </group>
    </group>
  )
}

function Bust() {
  return (
    <>
      <mesh geometry={UNIT_BOX} material={MAT.darkStone} position={[0, 0.11, 0]} scale={[0.26, 0.22, 0.26]} castShadow />
      <Model id="marble_bust_01" position={[0, 0.22, 0]} />
    </>
  )
}

export function AntiquesStall() {
  return (
    <StallFrame cloth="#2c4a3a" sheet="#4a3355" sign={STALL_SIGNS.antiques}>
      <Awning colour="#5a3a7a" />
      <Model id="antique_ceramic_vase_01" position={[-0.6, TOP, 0.78]} />
      <Model id="brass_vase_02" position={[-0.95, TOP, 0.45]} />
      <Model id="ceramic_vase_01" position={[0.42, TOP, 0.85]} scale={0.8} />
      <Model id="standing_picture_frame_01" position={[-0.25, TOP, 0.9]} rotation={[0, 0.3, 0]} />
      <Model id="fancy_picture_frame_01" anchor="wall" position={[-0.55, 1.62, -1.05]} />
      <Model id="vintage_telephone_wall_clock" anchor="wall" position={[0.75, 1.75, -1.05]} />
      {/* brass candlesticks either side of the bust */}
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} geometry={lathe([[0.05, 0], [0.05, 0.02], [0.015, 0.04], [0.012, 0.22], [0.03, 0.24], [0.02, 0.27]], 14)} material={MAT.brass} position={[x, TOP, 0.42]} castShadow />
      ))}
      {/* a boombox on the ground out front */}
      <Model id="boombox" position={[-0.7, 0, 1.35]} rotation={[0, 0.15, 0]} scale={0.9} />
    </StallFrame>
  )
}

export function AntiquesChange({ mode }: { mode: 'default' | 'watch' | 'horn' }) {
  return (
    <>
      <group position={[0, TOP, 0.45]}>
        {mode === 'watch' ? (
          <>
            <mesh geometry={UNIT_BOX} material={MAT.darkStone} position={[0, 0.11, 0]} scale={[0.26, 0.22, 0.26]} castShadow />
            <FacesYou position={[0, 0.22, 0]}>
              <Model id="marble_bust_01" />
            </FacesYou>
          </>
        ) : (
          <Bust />
        )}
      </group>
      <group position={[0.85, TOP, 0.55]} rotation={[0, -0.4, 0]}>
        <Gramophone big={mode === 'horn'} />
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Records and books
// ---------------------------------------------------------------------------

const RECORD_CRATES: Vec3[] = [
  [-1.02, TOP, 0.62],
  [-0.62, TOP, 0.62],
  [-0.22, TOP, 0.62],
]
const recordLayout = once(() => {
  const rng = mulberry32(91)
  const sleeves = RECORD_CRATES.flatMap((c, i) => sleevesIn([c[0], c[1] + 0.012, c[2]], 30 + i))
  const sleeveColours = sleeves.map(() => SLEEVE_COLOURS[Math.floor(rng() * SLEEVE_COLOURS.length)])
  const books = [...booksIn([0.95, TOP + 0.012, 0.42], 40), ...booksIn([0.95, TOP + 0.012, 0.8], 41)]
  const bookColours = books.map(() => BOOK_COLOURS[Math.floor(rng() * BOOK_COLOURS.length)])
  return { sleeves, sleeveColours, books, bookColours }
})

/** A turntable with a record going round. */
function Turntable() {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y -= dt * 3.5
  })
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.darkWood} position={[0, 0.05, 0]} scale={[0.46, 0.1, 0.36]} castShadow />
      <group ref={ref} position={[-0.04, 0.105, 0]}>
        <mesh geometry={RECORD} material={MAT.black} />
        <mesh geometry={DISC} material={glossMaterial('#e8402a')} position={[0, 0.003, 0]} scale={[0.05, 0.002, 0.05]} />
      </group>
      <mesh geometry={UNIT_BOX} material={MAT.chrome} position={[0.17, 0.12, -0.02]} rotation={[0, 0.5, 0]} scale={[0.012, 0.012, 0.22]} />
    </group>
  )
}

const SLEEVE_MAT = matteMaterial('#ffffff')

export function RecordStall() {
  const r = recordLayout()
  return (
    <StallFrame cloth="#1d1d1d" sheet="#2b2b2b" sign={STALL_SIGNS.records}>
      <Awning colour="#d23a7a" paint />
      {RECORD_CRATES.map((c, i) => (
        <mesh key={i} geometry={crateGeometry('0.36,0.36,0.2')} material={CRATE_MAT} position={c} castShadow />
      ))}
      <Tinted geometry={SLEEVE} material={SLEEVE_MAT} items={r.sleeves} colours={r.sleeveColours} castShadow />
      {[0.42, 0.8].map((z) => (
        <mesh key={z} geometry={crateGeometry('0.66,0.3,0.1')} material={CRATE_MAT} position={[0.95, TOP, z]} castShadow />
      ))}
      <Tinted geometry={BOOK} material={SLEEVE_MAT} items={r.books} colours={r.bookColours} castShadow />
      <group position={[0.35, TOP, 0.6]}>
        <Turntable />
      </group>
      {/* gig posters pinned to the back sheet */}
      {[
        [-0.8, '#ffde21'],
        [-0.25, '#16d0ff'],
        [0.35, '#ff3fa4'],
        [0.9, '#2fbf71'],
      ].map(([x, c]) => (
        <mesh key={x as number} geometry={UNIT_BOX} material={matteMaterial(c as string)} position={[x as number, 1.65, -1.06]} rotation={[0, 0, ((x as number) % 0.3) * 0.2]} scale={[0.42, 0.58, 0.004]} />
      ))}
    </StallFrame>
  )
}

/** Books flapping round in a slow circle over the stall, like a flock. */
function FlyingBooks() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.6
  })
  return (
    <group position={[0.1, TOP + 0.75, 0.6]}>
      <group ref={ref}>
        {['#7a2f3a', '#1f3d5a', '#2f5a3a', '#c9a13f', '#5a2a5a'].map((c, k) => {
          const a = (k / 5) * PI * 2
          return (
            <group key={c} position={[Math.cos(a) * 0.55, Math.sin(k * 2.3) * 0.12, Math.sin(a) * 0.4]} rotation={[0.3, -a, 0.2]}>
              <Hover height={0}>
                <OpenBook colour={c} />
              </Hover>
            </group>
          )
        })}
      </group>
    </group>
  )
}

export function RecordChange({ mode }: { mode: 'default' | 'flying' | 'melted' }) {
  return (
    <>
      {mode === 'flying' && <FlyingBooks />}
      {mode === 'melted' &&
        [-0.95, -0.6, -0.25].map((x, i) => (
          <mesh key={x} geometry={meltedRecord()} material={MAT.vinyl} position={[x, TOP + 0.004, COUNTER.z + COUNTER.depth / 2 - 0.02]} rotation={[0, (i - 1) * 0.15, 0]} castShadow />
        ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Hats: display heads, a hat stand, and caps in piles
// ---------------------------------------------------------------------------

const HEAD_XS = [-0.9, -0.3, 0.3, 0.9]
const HEAD_HATS: HatKind[] = ['bowler', 'trilby', 'boater', 'topper']
/** Where a hat sits on a display head, above the counter. */
const HAT_Y = TOP + 0.3

function Hat({ kind }: { kind: HatKind }) {
  const h = HATS[kind]
  const m = matteMaterial(h.colour)
  return (
    <>
      <mesh geometry={h.crown} material={m} castShadow />
      <mesh geometry={h.brim} material={m} castShadow />
      <mesh geometry={DISC} material={MAT.black} position={[0, 0.025, 0]} scale={[0.101, 0.022, 0.101]} />
    </>
  )
}

const CAP = new SphereGeometry(0.1, 14, 8, 0, PI * 2, 0, PI / 2).scale(1, 0.4, 1.1)
const PEAK = new CylinderGeometry(0.08, 0.08, 0.008, 14, 1, false, -PI / 2, PI).scale(1, 1, 0.7)
const HATBOX = new CylinderGeometry(0.17, 0.17, 0.2, 24)

export function HatStall() {
  return (
    <StallFrame cloth="#c9b48a" sheet="#2b6a55" sign={STALL_SIGNS.hats}>
      <Awning colour="#2f8a6a" paint />
      {HEAD_XS.map((x) => (
        <group key={x} position={[x, TOP, 0.62]}>
          <mesh geometry={DISC} material={MAT.darkWood} position={[0, 0.01, 0]} scale={[0.08, 0.02, 0.08]} />
          <mesh geometry={NECK} material={POLY} position={[0, 0.08, 0]} />
          <mesh geometry={DISPLAY_HEAD} material={POLY} position={[0, 0.22, 0]} castShadow />
        </group>
      ))}
      {/* a pile of flat caps and a sun hat at the front */}
      {[0, 1, 2, 3].map((k) => (
        <group key={k} position={[-0.6 + (k % 2) * 0.02, TOP + k * 0.03, 0.92]} rotation={[0, k * 0.3, 0]}>
          <mesh geometry={CAP} material={matteMaterial(['#5a5a4a', '#3a4a5a', '#7a5a3a', '#4a3a3a'][k])} />
          <mesh geometry={PEAK} material={matteMaterial('#2a2a2a')} position={[0, 0.004, 0.08]} />
        </group>
      ))}
      <group position={[0.6, TOP + 0.005, 0.92]} rotation={[0.05, 0, 0]}>
        <Hat kind="sun" />
      </group>
      {/* hat boxes stacked behind */}
      <mesh geometry={HATBOX} material={matteMaterial('#f2c6d2')} position={[0.9, 0.1, -0.55]} castShadow />
      <mesh geometry={HATBOX} material={matteMaterial('#c6e2f2')} position={[0.9, 0.3, -0.55]} scale={[0.85, 1, 0.85]} castShadow />
    </StallFrame>
  )
}

export function HatChange({ mode }: { mode: 'default' | 'floating' | 'stacked' }) {
  if (mode === 'stacked') {
    // every hat piled up on the first head, the biggest at the bottom
    return (
      <group position={[HEAD_XS[0], HAT_Y, 0.62]}>
        {HEAD_HATS.map((k, i) => (
          <group key={k} position={[0, i * 0.11, 0]} rotation={[0, i * 0.5, (i % 2 ? 1 : -1) * 0.05]}>
            <Hat kind={k} />
          </group>
        ))}
      </group>
    )
  }
  return (
    <>
      {HEAD_XS.map((x, i) => (
        <group key={x} position={[x, HAT_Y, 0.62]} rotation={[0, (i - 1.5) * 0.2, 0]}>
          {mode === 'floating' ? (
            <Hover height={0.32}>
              <Hat kind={HEAD_HATS[i]} />
            </Hover>
          ) : (
            <Hat kind={HEAD_HATS[i]} />
          )}
        </group>
      ))}
    </>
  )
}
