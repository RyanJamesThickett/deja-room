import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BufferGeometry, CapsuleGeometry, ConeGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, LineBasicMaterial, MeshStandardMaterial, Shape, TorusGeometry, type Group } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Instanced, PI, type Placement } from '../../kit'
import { Model } from '../../Model'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { Bar } from './Bar'
import { Builder, cached, type Vec3 } from './build'
import { MAT } from './materials'
import { BALL, CRATE_MAT, crateGeometry, DISC, glossMaterial, HATS, heap, lathe, matteMaterial, PLANE, UNIT_BOX } from './stallParts'
import { BALLOON, BALLOON_COLOURS, balloonSpots, flockLayout, guitarParts, leafBall, moneyIn, pigeonGeometry, rod, shadeBelow, sunkSpots, taper } from './squareParts'
import { cardboardTexture, chalkTexture } from './textures'
import { Tinted } from './Tinted'
import { Watching } from './Watching'

/*
 * Everything else about the square: the busker's pitch, the pigeons, the
 * balloon seller, chalkboards, crates, café tables, a rail of second-hand
 * clothes and a shop mannequin.
 */

// ---------------------------------------------------------------------------
// The busker's pitch
// ---------------------------------------------------------------------------

const PLUSH = new MeshStandardMaterial({ color: '#8a1a2a', roughness: 1 })
const COIN_MAT = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.85 })
const BUTTON_MAT = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 })
const money = once(() => ({
  coins: moneyIn(34, 0.012, 7),
  coinColours: ['#d8b04a', '#c8ccd0', '#b87333', '#d8b04a', '#c8ccd0'],
  buttons: moneyIn(26, 0.02, 8),
  buttonColours: ['#e8202a', '#1f6bff', '#f2d23a', '#2fbf71', '#ff3fa4', '#ffffff', '#8a4dff'],
}))

/** An open guitar case lying on the paving, neck towards -z, lid standing up behind; `buttons`: the coins have turned into buttons. */
export function GuitarCase({ mode = 'default' }: { mode?: 'default' | 'buttons' | 'pigeon' }) {
  const g = guitarParts()
  const m = money()
  return (
    <group rotation={[-PI / 2, 0, PI]}>
      <mesh geometry={g.caseShell} material={MAT.black} castShadow receiveShadow />
      <mesh geometry={g.caseBase} material={MAT.black} receiveShadow />
      <mesh geometry={g.plush} material={PLUSH} position={[0, 0, 0.017]} />
      {/* the lid, hinged along one long side and standing open, leaning back a little */}
      <group position={[-0.2, 0, 0.1]} rotation={[0, -PI / 2 - 0.25, 0]}>
        <mesh geometry={g.caseLid} material={MAT.black} position={[0.3, 0, 0]} rotation={[0, PI, 0]} castShadow />
        <mesh geometry={g.plush} material={PLUSH} position={[0.3, 0, -0.012]} rotation={[0, PI, 0]} />
      </group>
      <group position={[0, 0, 0.022]}>
        {mode === 'buttons' ? (
          <Tinted geometry={DISC} material={BUTTON_MAT} items={m.buttons} colours={m.buttonColours} />
        ) : (
          <Tinted geometry={DISC} material={COIN_MAT} items={m.coins} colours={m.coinColours} />
        )}
      </group>
      {mode === 'pigeon' && (
        <group position={[0.02, -0.08, 0.02]} rotation={[PI / 2, 0.6, 0]}>
          <mesh geometry={pigeonGeometry().standing} material={MAT.shell} castShadow />
        </group>
      )}
    </group>
  )
}

/** An acoustic guitar on an A-frame stand, its front to +z. */
export function GuitarOnStand() {
  const g = guitarParts()
  return (
    <group>
      <Bar a={[-0.16, 0, 0.1]} b={[0, 0.62, -0.06]} r={0.01} material={MAT.black} />
      <Bar a={[0.16, 0, 0.1]} b={[0, 0.62, -0.06]} r={0.01} material={MAT.black} />
      <Bar a={[0, 0, -0.2]} b={[0, 0.62, -0.06]} r={0.01} material={MAT.black} />
      <group position={[0, 0.3, 0.02]} rotation={[-0.2, 0, 0]}>
        <mesh geometry={g.body} material={glossMaterial('#c88a4a')} castShadow />
        <mesh geometry={DISC} material={MAT.black} position={[0, 0.1, 0.052]} rotation={[PI / 2, 0, 0]} scale={[0.05, 0.002, 0.05]} />
        <mesh geometry={UNIT_BOX} material={MAT.darkWood} position={[0, -0.12, 0.052]} scale={[0.11, 0.02, 0.012]} />
        <mesh geometry={UNIT_BOX} material={MAT.darkWood} position={[0, 0.55, 0.0]} scale={[0.05, 0.52, 0.03]} castShadow />
        <mesh geometry={UNIT_BOX} material={MAT.darkWood} position={[0, 0.86, -0.01]} rotation={[-0.2, 0, 0]} scale={[0.07, 0.16, 0.025]} />
        {[-0.012, -0.004, 0.004, 0.012].map((x) => (
          <mesh key={x} geometry={UNIT_BOX} material={MAT.steel} position={[x, 0.32, 0.054]} scale={[0.002, 0.88, 0.002]} />
        ))}
      </group>
    </group>
  )
}

/** A battery amp with its grille to +z, and a microphone on a stand beside it. */
export function Amp() {
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.black} position={[0, 0.22, 0]} scale={[0.42, 0.44, 0.26]} castShadow />
      <mesh geometry={UNIT_BOX} material={matteMaterial('#3a3a3a')} position={[0, 0.2, 0.131]} scale={[0.36, 0.32, 0.005]} />
      <mesh geometry={UNIT_BOX} material={MAT.steel} position={[0, 0.45, 0]} scale={[0.2, 0.025, 0.03]} />
      <Bar a={[0.4, 0, 0]} b={[0.4, 1.45, 0.05]} r={0.012} material={MAT.black} />
      <mesh geometry={DISC} material={MAT.black} position={[0.4, 0.01, 0]} scale={[0.14, 0.02, 0.14]} />
      <mesh geometry={BALL} material={MAT.steel} position={[0.4, 1.5, 0.08]} scale={[0.03, 0.03, 0.045]} />
    </group>
  )
}

/** A cardboard sign leaning back against something, writing to +z. */
export function CardSign({ text }: { text: string }) {
  const map = cardboardTexture(text)
  return (
    <mesh geometry={UNIT_BOX} position={[0, 0.2, 0]} rotation={[-0.25, 0, 0]} scale={[0.5, 0.38, 0.01]} castShadow>
      <meshStandardMaterial attach="material" map={map} roughness={0.95} />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Pigeons
// ---------------------------------------------------------------------------

export function Pigeon({ hat = false }: { hat?: boolean }) {
  const p = pigeonGeometry()
  const top = HATS.topper
  return (
    <group>
      <mesh geometry={p.standing} material={MAT.shell} castShadow />
      {hat && (
        // a tiny top hat, cocked to one side
        <group position={[0, 0.278, 0.075]} rotation={[0, 0, 0.18]} scale={0.36}>
          <mesh geometry={top.crown} material={matteMaterial('#151515')} />
          <mesh geometry={top.brim} material={matteMaterial('#151515')} />
          <mesh geometry={DISC} material={glossMaterial('#a01a2a')} position={[0, 0.03, 0]} scale={[0.092, 0.03, 0.092]} />
        </group>
      )}
    </group>
  )
}

/** One little flock (see FLOCKS), in its own space. */
export function Flock({ index }: { index: number }) {
  const p = pigeonGeometry()
  const f = flockLayout()[index]
  return (
    <>
      <Instanced geometry={p.standing} material={MAT.shell} items={f.standing} castShadow />
      <Instanced geometry={p.pecking} material={MAT.shell} items={f.pecking} castShadow />
    </>
  )
}

// ---------------------------------------------------------------------------
// Balloon seller
// ---------------------------------------------------------------------------

const STRING_MAT = new LineBasicMaterial({ color: '#f4f4f0' })
const CART_BODY = new RoundedBoxGeometry(0.6, 0.36, 0.46, 3, 0.04)
const CART_LID = new RoundedBoxGeometry(0.66, 0.035, 0.52, 2, 0.015)
const CART_TYRE = new TorusGeometry(0.18, 0.03, 8, 24).rotateX(PI / 2)
/** The knot at the bottom of a balloon, its point up into it. */
const KNOT = new ConeGeometry(0.022, 0.035, 8)
const TIE: Vec3 = [0, 1.72, 0]

/** Strings from the tie to each balloon. */
function useStrings(ends: Vec3[]) {
  return useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(ends.flatMap((e) => [TIE[0], TIE[1], TIE[2], e[0], e[1] - 0.18, e[2]]), 3))
    return g
  }, [ends])
}

/** A seller's handcart with a pole, and a bunch of helium balloons tied to it. */
export function BalloonCart({ mode = 'default' }: { mode?: 'default' | 'sinking' | 'huge' }) {
  const sway = useRef<Group>(null)
  const spots = mode === 'sinking' ? sunkSpots() : balloonSpots()
  const ends = useMemo(() => spots.map((s): Vec3 => (mode === 'sinking' ? s : [s[0], TIE[1] + s[1], s[2]])), [spots, mode])
  const strings = useStrings(ends)
  useFrame(({ clock }) => {
    if (!sway.current || mode === 'sinking') return
    const t = clock.elapsedTime
    sway.current.rotation.z = Math.sin(t * 0.7) * 0.04
    sway.current.rotation.x = Math.sin(t * 0.53) * 0.03
  })
  return (
    <group>
      {/* the cart: a rounded box on two spoked wheels, a handle with a grip, a leg to stand on, and a pole to tie to */}
      <mesh geometry={CART_BODY} material={matteMaterial('#2a6ab0')} position={[0, 0.55, 0]} castShadow receiveShadow />
      <mesh geometry={CART_LID} material={MAT.white} position={[0, 0.745, 0]} castShadow />
      <mesh geometry={UNIT_BOX} material={MAT.white} position={[0, 0.47, 0]} scale={[0.605, 0.04, 0.465]} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.335, 0.2, 0]} rotation={[0, 0, PI / 2]}>
          <mesh geometry={CART_TYRE} material={MAT.rubber} castShadow />
          <mesh geometry={DISC} material={MAT.steel} scale={[0.05, 0.06, 0.05]} />
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <mesh key={k} geometry={UNIT_BOX} material={MAT.steel} rotation={[0, (k * PI) / 6, 0]} scale={[0.33, 0.01, 0.012]} />
          ))}
        </group>
      ))}
      <mesh geometry={DISC} material={MAT.steel} position={[0, 0.2, 0]} rotation={[0, 0, PI / 2]} scale={[0.012, 0.7, 0.012]} />
      <Bar a={[0, 0.37, -0.23]} b={[0, 0.05, -0.5]} r={0.015} material={MAT.steel} />
      <Bar a={[0, 0.62, -0.23]} b={[0, 0.82, -0.6]} r={0.015} material={MAT.steel} />
      <mesh geometry={DISC} material={MAT.black} position={[0, 0.82, -0.6]} rotation={[0, 0, PI / 2]} scale={[0.022, 0.2, 0.022]} />
      <Bar a={[0, 0.74, 0.2]} b={[0, TIE[1], 0.02]} r={0.018} material={MAT.steel} />
      <group ref={sway} position={[0, 0, 0]}>
        <lineSegments geometry={strings} material={STRING_MAT} />
        {ends.map((e, i) => {
          const m = glossMaterial(BALLOON_COLOURS[i % BALLOON_COLOURS.length])
          return (
            <group key={i} position={e} scale={mode === 'huge' && i === 3 ? 4.5 : 1}>
              <mesh geometry={BALLOON} material={m} castShadow userData={{ paint: true }} />
              <mesh geometry={KNOT} material={m} position={[0, -0.2, 0]} userData={{ paint: true }} />
            </group>
          )
        })}
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Boards and crates
// ---------------------------------------------------------------------------

/** A chalkboard A-frame, writing on both faces (front to +z). */
export function ABoard({ text }: { text: string }) {
  const map = chalkTexture(text)
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} rotation={[0, s > 0 ? 0 : PI, 0]}>
          <group position={[0, 0, 0.0]} rotation={[-0.17, 0, 0]}>
            <mesh geometry={UNIT_BOX} material={MAT.darkWood} position={[0, 0.48, 0.12]} scale={[0.62, 0.96, 0.03]} castShadow />
            <mesh geometry={PLANE} position={[0, 0.5, 0.15]} scale={[0.52, 0.8, 1]}>
              <meshStandardMaterial map={map} roughness={0.9} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

const crateStock = once(() => ({
  apples: heap([0, 0.792, 0], 0.46, 0.32, 0.038, 77),
  spilled: Array.from({ length: 9 }, (_, i): Placement => {
    const rng = mulberry32(90 + i)
    return { at: [0.55 + rng() * 0.9, 0.038, 0.2 + rng() * 0.7], rot: [rng() * 6, rng() * 6, 0], scale: [0.038, 0.038, 0.038] }
  }),
}))

/** Produce crates stacked three high, apples in the top one; `fallen`: the top two have toppled. */
export function CrateStack({ fallen = false }: { fallen?: boolean }) {
  const geo = crateGeometry('0.5,0.36,0.26')
  const s = crateStock()
  const apple = glossMaterial('#b8202a')
  return (
    <group>
      <mesh geometry={geo} material={CRATE_MAT} castShadow receiveShadow />
      {fallen ? (
        <>
          <mesh geometry={geo} material={CRATE_MAT} position={[0.62, 0.27, 0.35]} rotation={[0, 0.6, PI / 2]} castShadow />
          <mesh geometry={geo} material={CRATE_MAT} position={[0.95, 0, 0.6]} rotation={[0, 1.2, 0]} castShadow />
          <Instanced geometry={BALL} material={apple} items={s.spilled} castShadow />
        </>
      ) : (
        <>
          <mesh geometry={geo} material={CRATE_MAT} position={[0, 0.265, 0]} rotation={[0, 0.06, 0]} castShadow />
          <mesh geometry={geo} material={CRATE_MAT} position={[0, 0.53, 0]} rotation={[0, -0.04, 0]} castShadow />
          <Instanced geometry={BALL} material={apple} items={s.apples.map((p) => ({ ...p, at: [p.at[0], p.at[1] - 0.25, p.at[2]] as Vec3 }))} castShadow />
        </>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Café tables
// ---------------------------------------------------------------------------

const MARBLE = new MeshStandardMaterial({ color: '#eeeae2', roughness: 0.25 })
const TABLE_BASE = lathe([[0.22, 0], [0.22, 0.03], [0.05, 0.06], [0.03, 0.12], [0.025, 0.7], [0.08, 0.72], [0, 0.73]], 16)

/** A bistro chair, facing +z, its seat at 0.46: black steel legs and back, a rattan seat and back panel. One mesh. */
const chair = once(() => {
  const b = new Builder()
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(b, [sx * 0.17, 0, sz * 0.17], [sx * 0.15, 0.45, sz * 0.15], 0.012, '#151515')
  b.add(DISC, '#b98a4a', [0, 0.46, 0], undefined, [0.2, 0.03, 0.2])
  for (const sx of [-1, 1]) rod(b, [sx * 0.15, 0.46, -0.15], [sx * 0.15, 0.85, -0.19], 0.012, '#151515')
  b.box([0.32, 0.18, 0.02], [0, 0.74, -0.175], '#b98a4a', [-0.1, 0, 0])
  return b.merge()
})

function Chair() {
  return <mesh geometry={chair()} material={MAT.shell} castShadow receiveShadow />
}

const CUP = lathe([[0, 0], [0.035, 0], [0.042, 0.06], [0.038, 0.06], [0.03, 0.006], [0, 0.006]], 28)
/** The cup's handle: a loop standing out from its side along +x. */
const CUP_HANDLE = new TorusGeometry(0.016, 0.0045, 8, 16, PI * 1.25).rotateZ(-PI * 0.625)
const TABLE_TOP = new CylinderGeometry(1, 1, 1, 40)

/** A teacup on its saucer, at the saucer's foot. */
function CupAndSaucer({ shadow = false }: { shadow?: boolean }) {
  return (
    <>
      <mesh geometry={SAUCER} material={MAT.white} castShadow={shadow} />
      <mesh geometry={CUP} material={MAT.white} position={[0, 0.008, 0]} castShadow={shadow} />
      <mesh geometry={CUP_HANDLE} material={MAT.white} position={[0.044, 0.04, 0]} castShadow={shadow} />
    </>
  )
}
const SAUCER = lathe([[0, 0], [0.07, 0.004], [0.075, 0.012], [0.07, 0.013], [0.032, 0.007], [0, 0.007]], 24)

/** A bistro table for two, chairs either side along x. `stacked`: chairs up on the table, legs in the air. `cup`: a giant teacup. */
export function CafeTable({ mode = 'default' }: { mode?: 'default' | 'stacked' | 'cup' }) {
  return (
    <group>
      <mesh geometry={TABLE_BASE} material={MAT.black} castShadow />
      <mesh geometry={TABLE_TOP} material={MARBLE} position={[0, 0.745, 0]} scale={[0.32, 0.03, 0.32]} castShadow receiveShadow />
      {mode === 'stacked' ? (
        [-1, 1].map((s) => (
          // seat down on the table, legs in the air, each back hanging over the edge
          <group key={s} position={[s * 0.04, 0.76 + 0.46, s * 0.2]} rotation={[PI, (s > 0 ? 0 : PI) + s * 0.15, 0]}>
            <Chair />
          </group>
        ))
      ) : (
        <>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.55, 0, 0]} rotation={[0, (-s * PI) / 2, 0]}>
              <Chair />
            </group>
          ))}
          {mode === 'cup' ? (
            <group position={[0, 0.76, 0]} scale={6}>
              <CupAndSaucer shadow />
              <mesh geometry={DISC} material={matteMaterial('#5a3a22')} position={[0, 0.05, 0]} scale={[0.036, 0.001, 0.036]} />
            </group>
          ) : (
            [-0.12, 0.12].map((x) => (
              <group key={x} position={[x, 0.76, 0.05]} rotation={[0, x * 8, 0]}>
                <CupAndSaucer />
              </group>
            ))
          )}
        </>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Clothes rail and mannequin
// ---------------------------------------------------------------------------

/** A shirt or coat hanging from its hanger: the outline, extruded, its width along z (across the rail). */
const GARMENT = (() => {
  const s = new Shape()
  s.moveTo(-0.07, 0)
  s.lineTo(-0.2, -0.04)
  s.lineTo(-0.27, -0.32)
  s.lineTo(-0.21, -0.34)
  s.lineTo(-0.18, -0.16)
  s.lineTo(-0.19, -0.78)
  s.lineTo(0.19, -0.78)
  s.lineTo(0.18, -0.16)
  s.lineTo(0.21, -0.34)
  s.lineTo(0.27, -0.32)
  s.lineTo(0.2, -0.04)
  s.lineTo(0.07, 0)
  s.closePath()
  return new ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 }).translate(0, 0, -0.025).rotateY(PI / 2)
})()
const HANGER = new CapsuleGeometry(0.006, 0.4, 2, 6).rotateX(PI / 2)
const GARMENT_MAT = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, side: DoubleSide })
const RAIL = { length: 1.5, top: 1.62 }
const rack = once(() => {
  const rng = mulberry32(55)
  const n = 11
  const items: Placement[] = Array.from({ length: n }, (_, i) => ({ at: [-0.65 + i * 0.13, RAIL.top - 0.06, 0], rot: [(rng() - 0.5) * 0.08, 0, 0], scale: [1, 0.9 + rng() * 0.35, 1] }))
  const colours = ['#3a4a6a', '#a02a2a', '#d8c8a0', '#2f5a3a', '#6a4a8a', '#e8e0d0', '#2a2a2a', '#c8742a', '#4a8ab0', '#8a2a5a', '#b8a060']
  return { items, colours, hangers: items.map((p): Placement => ({ at: [p.at[0], p.at[1] - 0.02, 0] })) }
})

/** Swinging slowly on the rail, nothing on it. */
function EmptyHanger({ x, phase }: { x: number; phase: number }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.x = Math.sin(clock.elapsedTime * 1.3 + phase) * 0.25
  })
  return (
    <group ref={ref} position={[x, RAIL.top, 0]}>
      <mesh geometry={HANGER} material={MAT.paleWood} position={[0, -0.08, 0]} />
      <mesh geometry={UNIT_BOX} material={MAT.steel} position={[0, -0.04, 0]} scale={[0.004, 0.07, 0.004]} />
    </group>
  )
}

/** Cloth you can see both faces of: up inside a coat's skirt, and in through its collar. */
const clothInside = cached((colour: string) => new MeshStandardMaterial({ color: colour, roughness: 0.85, side: DoubleSide }))
const COAT_SKIRT = lathe([[0.2, 0], [0.24, 0.3], [0.2, 0.62]], 20)
const COLLAR = lathe([[0.09, 0], [0.1, 0.08]], 16)
const DUMMY_SKIRT = lathe([[0.2, 0], [0.17, 0.3], [0.15, 0.42]], 20)

/** Someone invisible is wearing a coat and hat beside the rail: the clothes are filled out by nobody. */
function InvisibleMan() {
  const coat = matteMaterial('#6a5440')
  const trousers = matteMaterial('#2a2a32')
  return (
    <group>
      <mesh geometry={BALL} material={coat} position={[0, 1.2, 0]} scale={[0.22, 0.34, 0.14]} castShadow />
      <mesh geometry={COAT_SKIRT} material={clothInside('#6a5440')} position={[0, 0.62, 0]} scale={[1, 1, 0.7]} castShadow />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Bar a={[s * 0.24, 1.42, 0]} b={[s * 0.3, 0.9, 0.06]} r={0.055} material={coat} />
          <Bar a={[s * 0.09, 0.66, 0]} b={[s * 0.1, 0.08, 0.02]} r={0.065} material={trousers} />
          <mesh geometry={UNIT_BOX} material={MAT.black} position={[s * 0.1, 0.04, 0.06]} scale={[0.1, 0.08, 0.26]} castShadow />
        </group>
      ))}
      {/* the collar stands up round a neck that isn't there; the hat floats over it */}
      <mesh geometry={COLLAR} material={clothInside('#6a5440')} position={[0, 1.5, 0]} />
      <group position={[0, 1.8, 0]} rotation={[0, 0, 0.08]}>
        <mesh geometry={HATS.trilby.crown} material={matteMaterial('#3a3028')} />
        <mesh geometry={HATS.trilby.brim} material={matteMaterial('#3a3028')} />
      </group>
    </group>
  )
}

/** A chrome rail of second-hand clothes on castors, along x. */
export function ClothesRail({ mode = 'default' }: { mode?: 'default' | 'empty' | 'invisible' }) {
  const r = rack()
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Bar a={[(s * RAIL.length) / 2, 0.08, 0]} b={[(s * RAIL.length) / 2, RAIL.top, 0]} r={0.014} material={MAT.chrome} />
          <Bar a={[(s * RAIL.length) / 2, 0.08, -0.25]} b={[(s * RAIL.length) / 2, 0.08, 0.25]} r={0.014} material={MAT.chrome} />
          {[-1, 1].map((z) => (
            <mesh key={z} geometry={DISC} material={MAT.rubber} position={[(s * RAIL.length) / 2, 0.035, z * 0.24]} rotation={[0, 0, PI / 2]} scale={[0.035, 0.02, 0.035]} />
          ))}
        </group>
      ))}
      <Bar a={[-RAIL.length / 2, RAIL.top, 0]} b={[RAIL.length / 2, RAIL.top, 0]} r={0.014} material={MAT.chrome} />
      {mode === 'empty' ? (
        r.items.map((p, i) => <EmptyHanger key={i} x={p.at[0]} phase={i * 0.7} />)
      ) : (
        <>
          <Instanced geometry={HANGER} material={MAT.paleWood} items={r.hangers} />
          <Tinted geometry={GARMENT} material={GARMENT_MAT} items={r.items} colours={r.colours} castShadow />
        </>
      )}
      {mode === 'invisible' && (
        <group position={[0.2, 0, 0.55]}>
          <InvisibleMan />
        </group>
      )}
    </group>
  )
}

const MANNEQUIN = new MeshStandardMaterial({ color: '#f2efe8', roughness: 0.25 })
const TORSO = lathe([[0.0, 0], [0.15, 0.02], [0.16, 0.18], [0.12, 0.38], [0.15, 0.56], [0.17, 0.66], [0.07, 0.72], [0.05, 0.8], [0, 0.8]], 20)

/** A faceless shop dummy on a stand, wearing a red coat and a hat, facing +z. `wave`: one arm up. */
function Dummy({ wave }: { wave: boolean }) {
  const coat = matteMaterial('#a8242c')
  return (
    <group>
      <mesh geometry={DISC} material={MAT.chrome} position={[0, 0.01, 0]} scale={[0.25, 0.02, 0.25]} />
      <mesh geometry={DISC} material={MAT.chrome} position={[0, 0.45, 0]} scale={[0.012, 0.9, 0.012]} />
      {/* legs in dark trousers, then the coat over the body */}
      {[-1, 1].map((s) => (
        <Bar key={s} a={[s * 0.08, 0.92, 0]} b={[s * 0.085, 0.12, 0.02]} r={0.06} material={matteMaterial('#26262c')} />
      ))}
      <mesh geometry={TORSO} material={coat} position={[0, 0.82, 0]} scale={[1, 1, 0.68]} castShadow />
      <mesh geometry={DUMMY_SKIRT} material={clothInside('#a8242c')} position={[0, 0.5, 0]} scale={[1, 1, 0.7]} castShadow />
      <Bar a={[-0.17, 1.44, 0]} b={[-0.22, 0.98, 0.04]} r={0.045} material={coat} />
      {wave ? <Bar a={[0.17, 1.44, 0]} b={[0.32, 1.88, 0.06]} r={0.045} material={coat} /> : <Bar a={[0.17, 1.44, 0]} b={[0.22, 0.98, 0.04]} r={0.045} material={coat} />}
      <mesh geometry={BALL} material={MANNEQUIN} position={wave ? [0.34, 1.93, 0.07] : [0.23, 0.94, 0.04]} scale={[0.04, 0.06, 0.03]} />
      <mesh geometry={BALL} material={MANNEQUIN} position={[-0.23, 0.94, 0.04]} scale={[0.04, 0.06, 0.03]} />
      {/* a smooth, featureless head */}
      <mesh geometry={DISC} material={MANNEQUIN} position={[0, 1.66, 0]} scale={[0.045, 0.12, 0.045]} />
      <mesh geometry={BALL} material={MANNEQUIN} position={[0, 1.8, 0.01]} scale={[0.09, 0.12, 0.1]} castShadow />
      <group position={[0, 1.89, 0]} rotation={[-0.08, 0, 0]}>
        <mesh geometry={HATS.bowler.crown} material={matteMaterial('#1a1a1a')} />
        <mesh geometry={HATS.bowler.brim} material={matteMaterial('#1a1a1a')} />
      </group>
    </group>
  )
}

export function Mannequin({ mode = 'default' }: { mode?: 'default' | 'watch' | 'wave' }) {
  if (mode === 'watch')
    return (
      <Watching>
        <Dummy wave={false} />
      </Watching>
    )
  return <Dummy wave={mode === 'wave'} />
}

/** The busker's stool. */
export function BuskerStool() {
  return <Model id="metal_stool_01" scale={0.85} />
}

/** The planter: boarded sides between corner posts with pyramid caps, a capping rail, earth and bark chips. One mesh. */
const planterBox = once(() => {
  const b = new Builder()
  const wood = '#6b4429'
  const dark = '#3e2616'
  const cap = '#80553a'
  // dark backing, so the gaps between the boards read as shadow
  b.box([0.8, 0.56, 0.8], [0, 0.3, 0], dark)
  for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    b.box([0.11, 0.66, 0.11], [sx * 0.4, 0.33, sz * 0.4], wood)
    b.add(new ConeGeometry(0.085, 0.07, 4).rotateY(PI / 4), cap, [sx * 0.4, 0.695, sz * 0.4])
  }
  for (let k = 0; k < 3; k++) {
    const y = 0.11 + k * 0.18
    b.box([0.7, 0.165, 0.035], [0, y, 0.415], wood)
    b.box([0.7, 0.165, 0.035], [0, y, -0.415], wood)
    b.box([0.035, 0.165, 0.7], [0.415, y, 0], wood)
    b.box([0.035, 0.165, 0.7], [-0.415, y, 0], wood)
  }
  // the capping rail round the top, sitting over the boards
  for (const s of [-1, 1]) {
    b.box([0.7, 0.035, 0.1], [0, 0.6, s * 0.4], cap)
    b.box([0.1, 0.035, 0.7], [s * 0.4, 0.6, 0], cap)
  }
  b.box([0.7, 0.02, 0.7], [0, 0.575, 0], '#2f2117')
  const rng = mulberry32(31)
  for (let k = 0; k < 22; k++) {
    const a = rng() * PI * 2
    const r = 0.08 + rng() * 0.24
    b.box([0.05, 0.012, 0.035], [Math.cos(a) * r, 0.588, Math.sin(a) * r], k % 3 ? '#8a5a36' : '#a0703f', [rng() * 0.3, rng() * 6, 0])
  }
  return b.merge()
})

/** The bay tree: a slim stem and a clipped ball of leaves, lumpy where it's grown out since the last trim, darker underneath. */
const bayTree = once(() => {
  const stem = new Builder()
  taper(stem, [0, 0.55, 0], [0, 1.4, 0], 0.035, 0.024, '#5a3a22', 10)
  const leaves = new Builder()
  const rng = mulberry32(37)
  const ball = leafBall(2.3, 0.06, 22)
  leaves.add(ball, '#3f7a2c', [0, 1.65, 0], undefined, [0.5, 0.52, 0.5])
  ball.dispose()
  const n = 30
  for (let k = 0; k < n; k++) {
    // little tufts grown out of the surface since the last trim, spread evenly over the ball
    const y = 1 - ((k + 0.5) / n) * 2
    const a = k * 2.4
    const rr = Math.sqrt(1 - y * y)
    const g = leafBall(rng() * 9, 0.12, 10)
    leaves.add(g, k % 3 ? '#457e2f' : '#3a6e28', [Math.cos(a) * rr * 0.42, 1.65 + y * 0.44, Math.sin(a) * rr * 0.42], [rng(), rng() * 6, 0], [0.13, 0.1, 0.13])
    g.dispose()
  }
  return { stem: stem.merge(), leaves: shadeBelow(leaves.merge(), 1.2, 1.85, 0.6) }
})
const PLANTER_WOOD = new MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })
const BAY_LEAVES = new MeshStandardMaterial({ vertexColors: true, roughness: 0.55 })

/** A big timber planter with a clipped bay tree in it. */
export function Planter() {
  const t = bayTree()
  return (
    <group>
      <mesh geometry={planterBox()} material={PLANTER_WOOD} castShadow receiveShadow />
      <mesh geometry={t.stem} material={PLANTER_WOOD} castShadow />
      <mesh geometry={t.leaves} material={BAY_LEAVES} castShadow receiveShadow />
    </group>
  )
}
