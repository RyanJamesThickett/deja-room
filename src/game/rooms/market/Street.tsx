import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import { AdditiveBlending, DoubleSide, IcosahedronGeometry, MeshStandardMaterial, type Group } from 'three'
import { Instanced, PI, type Placement } from '../../kit'
import { ShadowFigure } from '../../figure'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { Bar } from './Bar'
import { Builder } from './build'
import { signPanel, STALL_SIGNS } from './cityPlan'
import { cityMaterials, MAT } from './materials'
import { BALL, DISC, glossMaterial, lathe, matteMaterial, PLANE, UNIT_BOX } from './stallParts'
import {
  alongRope,
  BENCH,
  benchSlats,
  bentColumn,
  bikeParts,
  FLAG,
  FLAG_COLOURS,
  FLAG_MAT,
  FLAG_UP,
  LAMP_BASE,
  lampGeometry,
  LANTERN_ROOF,
  ropeGeometry,
  ropeY,
  SHEFFIELD,
  SOCK,
  treeParts,
} from './squareParts'
import { letterAtlas, LETTERS, newspaperTexture, phoneGlassTexture } from './textures'
import { Tinted } from './Tinted'

/*
 * Street furniture: Victorian lampposts and the bunting strung between them,
 * park benches, litter bins, a red phone box, a pillar box, plane trees,
 * bollards, crowd barriers and a bike locked to a stand.
 */

const IRON = '#1f3a2a'
const IRON_MAT = new MeshStandardMaterial({ color: IRON, roughness: 0.45, metalness: 0.5 })
const LANTERN_GLASS = new MeshStandardMaterial({ color: '#f4f1e0', roughness: 0.15, metalness: 0.1, emissive: '#fff2c8', emissiveIntensity: 0.05 })
const LIT_GLASS = new MeshStandardMaterial({ color: '#fff6d8', roughness: 0.2, emissive: '#ffd27a', emissiveIntensity: 2.4 })
const GLOW = new MeshStandardMaterial({ color: '#000000', emissive: '#ffd27a', emissiveIntensity: 1, transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false })

// ---------------------------------------------------------------------------
// Lampposts
// ---------------------------------------------------------------------------

function Lantern({ lit = false }: { lit?: boolean }) {
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={IRON_MAT} position={[0, 0.02, 0]} scale={[0.28, 0.04, 0.28]} castShadow />
      <mesh geometry={UNIT_BOX} material={lit ? LIT_GLASS : LANTERN_GLASS} position={[0, 0.24, 0]} scale={[0.24, 0.38, 0.24]} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={UNIT_BOX} material={IRON_MAT} position={[sx * 0.125, 0.24, sz * 0.125]} scale={[0.025, 0.4, 0.025]} />))}
      <mesh geometry={LANTERN_ROOF} material={IRON_MAT} position={[0, 0.54, 0]} castShadow />
      <mesh geometry={BALL} material={IRON_MAT} position={[0, 0.68, 0]} scale={0.035} />
      {lit && <mesh geometry={BALL} material={GLOW} position={[0, 0.24, 0]} scale={0.5} raycast={() => null} />}
    </group>
  )
}

const LAMP_MAT = new MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.4 })

/** A cast-iron lamppost with a ladder bar and a lantern. `hook`: rings below the lantern for bunting, front and back (±z). */
export function Lamp({ lit = false, hook = false, basket = false }: { lit?: boolean; hook?: boolean; basket?: boolean }) {
  const g = lampGeometry()
  const geo = hook ? (basket ? g.hookedBaskets : g.hooked) : basket ? g.baskets : g.plain
  return (
    <group>
      <mesh geometry={geo} material={LAMP_MAT} castShadow receiveShadow />
      <mesh geometry={UNIT_BOX} material={lit ? LIT_GLASS : LANTERN_GLASS} position={[0, 3.94, 0]} scale={[0.24, 0.38, 0.24]} />
      {lit && <mesh geometry={BALL} material={GLOW} position={[0, 3.94, 0]} scale={0.5} raycast={() => null} />}
    </group>
  )
}

/** The lamppost has bent over to read the paper: its head bowed over it, its ladder bar become arms holding it open. */
export function BentLamp() {
  const paper = newspaperTexture()
  return (
    <group>
      <mesh geometry={LAMP_BASE} material={IRON_MAT} castShadow />
      <mesh geometry={bentColumn()} material={IRON_MAT} castShadow />
      {/* the lantern carries on where the column ends, bowed down and forward */}
      <group position={[0, 2.5, 1.12]} rotation={[2.62, 0, 0]}>
        <Lantern />
      </group>
      {[-1, 1].map((s) => (
        <Bar key={s} a={[s * 0.06, 2.45, 0.2]} b={[s * 0.36, 1.86, 1.32]} r={0.018} material={IRON_MAT} />
      ))}
      <group position={[0, 1.78, 1.42]} rotation={[-1.98, 0, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={PLANE} position={[s * 0.19, 0, -0.03]} rotation={[0, -s * 0.2, 0]} scale={[0.38, 0.5, 1]}>
            <meshStandardMaterial map={paper} roughness={0.9} side={DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Bunting
// ---------------------------------------------------------------------------

const SAG = 0.55

const flagColours = (n: number) => Array.from({ length: n }, (_, i) => FLAG_COLOURS[i % FLAG_COLOURS.length])

/** Triangle flags all along a rope `span` long (the bunting's own space: centred, along x). */
export function Bunting({ span, mode }: { span: number; mode: 'default' | 'socks' | 'upside' }) {
  const rope = useMemo(() => ropeGeometry(span, SAG), [span])
  const flags = useMemo(() => alongRope(span, SAG, mode === 'socks' ? 0.5 : 0.36, mode === 'upside'), [span, mode])
  const colours = useMemo(() => flagColours(flags.length), [flags])
  return (
    <>
      <mesh geometry={rope} material={MAT.string} />
      {mode === 'socks' ? (
        <Tinted geometry={SOCK} material={FLAG_MAT} items={flags} colours={colours} castShadow />
      ) : (
        <Tinted geometry={mode === 'upside' ? FLAG_UP : FLAG} material={FLAG_MAT} items={flags} colours={colours} castShadow />
      )}
    </>
  )
}

const LETTER_MAT = once(() => new MeshStandardMaterial({ map: letterAtlas(), vertexColors: true, alphaTest: 0.5, side: DoubleSide, roughness: 0.8 }))

/** Big pennants with a letter on each, spelling `text` along the rope, plain ones either side. */
function letterGeometry(span: number, text: string) {
  const b = new Builder()
  const step = 0.56
  const n = Math.floor((span - 0.5) / step)
  const start = Math.floor((n - text.length) / 2)
  for (let i = 0; i < n; i++) {
    const x = -((n - 1) * step) / 2 + i * step
    const ch = text[i - start] ?? ' '
    const k = Math.max(0, LETTERS.indexOf(ch))
    const c = k % 8
    const r = Math.floor(k / 8)
    const slope = Math.atan((ropeY(x + 0.01, span, SAG) - ropeY(x - 0.01, span, SAG)) / 0.02)
    b.panel(0.48, 0.48, [x, ropeY(x, span, SAG) - 0.24, 0], [c / 8, 1 - (r + 1) / 4, (c + 1) / 8, 1 - r / 4], FLAG_COLOURS[i % FLAG_COLOURS.length], [0, 0, slope])
  }
  return b.merge()
}

export function LetterBunting({ span, text }: { span: number; text: string }) {
  const rope = useMemo(() => ropeGeometry(span, SAG), [span])
  const flags = useMemo(() => letterGeometry(span, text), [span, text])
  return (
    <>
      <mesh geometry={rope} material={MAT.string} />
      <mesh geometry={flags} material={LETTER_MAT()} castShadow />
    </>
  )
}

// ---------------------------------------------------------------------------
// Benches, bins, bollards, barriers
// ---------------------------------------------------------------------------

/** A park bench, seat along x, facing +z. */
export function Bench({ melted = false }: { melted?: boolean }) {
  const s = benchSlats()
  const half = BENCH.length / 2 - 0.12
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * half, 0, 0]} rotation={[0, 0, melted ? side * 0.22 : 0]}>
          {/* cast-iron end: front leg, back leg rising into the backrest, the armrest */}
          <mesh geometry={UNIT_BOX} material={IRON_MAT} position={[0, 0.22, 0.2]} scale={[0.05, 0.44, 0.05]} castShadow />
          <mesh geometry={UNIT_BOX} material={IRON_MAT} position={[0, 0.42, -0.24]} rotation={[-0.22, 0, 0]} scale={[0.05, 0.86, 0.05]} castShadow />
          <mesh geometry={UNIT_BOX} material={IRON_MAT} position={[0, 0.42, -0.02]} scale={[0.05, 0.04, 0.48]} />
          <mesh geometry={UNIT_BOX} material={IRON_MAT} position={[0.0, 0.64, 0.02]} scale={[0.06, 0.04, 0.42]} castShadow />
          <mesh geometry={UNIT_BOX} material={IRON_MAT} position={[0, 0.53, 0.21]} scale={[0.04, 0.2, 0.04]} />
        </group>
      ))}
      {[-0.15, -0.05, 0.05, 0.15].map((z) => (
        <mesh key={z} geometry={melted ? s.meltedSeat : s.seat} material={MAT.wood} position={[0, BENCH.seatY, z]} castShadow receiveShadow />
      ))}
      {[0.56, 0.68, 0.8].map((y) => (
        <mesh key={y} geometry={melted ? s.meltedBack : s.back} material={MAT.wood} position={[0, y, -0.25 - (y - 0.5) * 0.22]} rotation={[-0.22, 0, 0]} castShadow />
      ))}
      {melted && (
        <mesh position={[0, 0.004, 0]} rotation={[-PI / 2, 0, 0]} scale={[1.3, 0.5, 1]}>
          <circleGeometry args={[0.5, 32]} />
          <meshStandardMaterial color="#6a4a2a" roughness={0.1} />
        </mesh>
      )}
    </group>
  )
}

const BIN_BODY = lathe(
  [
    [0.22, 0],
    [0.25, 0.05],
    [0.25, 0.82],
    [0.27, 0.84],
    [0.27, 0.88],
    [0, 0.9],
  ],
  24,
)
const BIN_LID = lathe(
  [
    [0.27, 0],
    [0.27, 0.04],
    [0.2, 0.12],
    [0.08, 0.16],
    [0, 0.165],
  ],
  24,
)
const LITTER = once(() => {
  const rng = mulberry32(17)
  const paper: Placement[] = Array.from({ length: 14 }, (_, i) => {
    // in the bin, heaped up; the rest blown out on the side away from the bench
    const a = i < 9 ? rng() * PI * 2 : 0.4 + rng() * (PI - 0.8)
    const r = i < 9 ? rng() * 0.2 : 0.35 + rng() * 0.25
    return { at: [Math.cos(a) * r, i < 9 ? 1.07 + rng() * 0.18 : 0.062, Math.sin(a) * r], rot: [rng() * 6, rng() * 6, 0], scale: [0.06, 0.05, 0.06] }
  })
  return { paper, crumpled: new IcosahedronGeometry(1, 0) }
})

/** A black cast-iron litter bin with a gold band. */
export function Bin({ mode = 'default' }: { mode?: 'default' | 'overflow' | 'eyes' }) {
  const l = LITTER()
  return (
    <group>
      <mesh geometry={BIN_BODY} material={MAT.black} castShadow receiveShadow />
      <mesh geometry={DISC} material={MAT.brass} position={[0, 0.7, 0]} scale={[0.255, 0.06, 0.255]} />
      {/* the lid sits up on four posts, leaving a slot all round for the rubbish */}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} geometry={UNIT_BOX} material={MAT.black} position={[Math.cos(k * 1.57 + 0.78) * 0.24, 0.96, Math.sin(k * 1.57 + 0.78) * 0.24]} scale={[0.03, 0.14, 0.03]} />
      ))}
      <mesh geometry={DISC} material={matteMaterial('#0a0a0a')} position={[0, 0.9, 0]} scale={[0.22, 0.02, 0.22]} />
      <mesh geometry={BIN_LID} material={MAT.black} position={[0, 1.02, 0]} castShadow />
      {mode === 'overflow' && (
        <>
          <Instanced geometry={l.crumpled} material={MAT.white} items={l.paper} castShadow />
          <mesh geometry={UNIT_BOX} material={MAT.cardboard} position={[0.05, 1.26, 0]} rotation={[0.3, 0.4, 0.5]} scale={[0.32, 0.03, 0.32]} castShadow />
          {[0, 1, 2].map((k) => (
            <mesh key={k} geometry={DISC} material={glossMaterial(['#d0202a', '#c8ccd0', '#1f6bff'][k])} position={[-0.12 + k * 0.1, 1.15 + k * 0.05, 0.1 - k * 0.08]} rotation={[k, k * 2, 0.5]} scale={[0.033, 0.12, 0.033]} castShadow />
          ))}
        </>
      )}
      {mode === 'eyes' &&
        // something living in the bin, peering out through the slot
        [-1, 1].map((s) => (
          <group key={s} position={[s * 0.06, 0.955, 0.2]}>
            <mesh geometry={BALL} material={GLOWING_EYE} scale={[0.035, 0.028, 0.02]} />
            <mesh geometry={BALL} material={MAT.black} position={[0, 0, 0.016]} scale={0.013} />
          </group>
        ))}
    </group>
  )
}
const GLOWING_EYE = new MeshStandardMaterial({ color: '#fff7d0', emissive: '#ffe680', emissiveIntensity: 0.8, roughness: 0.2 })

/** A black iron bollard with a gold band. */
export function Bollard() {
  return (
    <group>
      <mesh geometry={lathe([[0.1, 0], [0.1, 0.7], [0.12, 0.75], [0.1, 0.82], [0.05, 0.9], [0, 0.92]], 16)} material={MAT.black} castShadow />
      <mesh geometry={DISC} material={MAT.brass} position={[0, 0.62, 0]} scale={[0.104, 0.03, 0.104]} />
    </group>
  )
}

/** A galvanised crowd-control barrier, 2.2 m long along x, on its feet. */
export function Barrier() {
  const steel = MAT.steel
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={UNIT_BOX} material={steel} position={[s * 1.05, 0.55, 0]} scale={[0.035, 1.0, 0.035]} castShadow />
          <mesh geometry={UNIT_BOX} material={steel} position={[s * 1.05, 0.03, 0]} scale={[0.05, 0.03, 0.5]} />
        </group>
      ))}
      {[0.12, 1.05].map((y) => (
        <mesh key={y} geometry={UNIT_BOX} material={steel} position={[0, y, 0]} scale={[2.1, 0.035, 0.035]} castShadow />
      ))}
      {Array.from({ length: 15 }, (_, k) => (
        <mesh key={k} geometry={UNIT_BOX} material={steel} position={[-0.98 + k * 0.14, 0.585, 0]} scale={[0.012, 0.93, 0.012]} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Phone box and pillar box
// ---------------------------------------------------------------------------

const K6_RED = '#c8202a'
const PHONE_GLASS = once(() => new MeshStandardMaterial({ color: K6_RED, map: phoneGlassTexture(), alphaTest: 0.5, roughness: 0.4, side: DoubleSide }))

/** A red K6 kiosk: glazed on three sides and the door, a domed roof, TELEPHONE on every side. */
export function PhoneBox({ inside = false }: { inside?: boolean }) {
  const red = glossMaterial(K6_RED)
  const { signs } = cityMaterials()
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={red} position={[0, 0.06, 0]} scale={[1.0, 0.12, 1.0]} castShadow receiveShadow userData={{ paint: true }} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={UNIT_BOX} material={red} position={[sx * 0.43, 1.2, sz * 0.43]} scale={[0.1, 2.2, 0.1]} castShadow userData={{ paint: true }} />))}
      {FACES.map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <mesh geometry={PLANE} material={PHONE_GLASS()} position={[0, 1.08, 0.43]} scale={[0.78, 1.82, 1]} castShadow userData={{ paint: true }} />
          <mesh geometry={UNIT_BOX} material={red} position={[0, 2.12, 0.44]} scale={[0.86, 0.26, 0.06]} castShadow userData={{ paint: true }} />
          <mesh geometry={signPanel(STALL_SIGNS.telephone)} material={signs} position={[0, 2.13, 0.475]} scale={[0.66, 0.11, 1]} />
          {/* the roof's curved pediment on each side */}
          <mesh geometry={DISC} material={red} position={[0, 2.25, 0.4]} rotation={[PI / 2, 0, 0]} scale={[0.45, 0.1, 0.12]} userData={{ paint: true }} />
        </group>
      ))}
      <mesh geometry={BALL} material={red} position={[0, 2.28, 0]} scale={[0.5, 0.18, 0.5]} castShadow userData={{ paint: true }} />
      <mesh geometry={UNIT_BOX} material={MAT.brass} position={[0, 2.45, 0]} scale={[0.14, 0.12, 0.06]} />
      {/* a phone on the back wall, and the door's handle */}
      <mesh geometry={UNIT_BOX} material={MAT.black} position={[0, 1.35, -0.36]} scale={[0.22, 0.3, 0.12]} />
      <mesh geometry={UNIT_BOX} material={MAT.iron} position={[0.3, 1.1, 0.46]} scale={[0.03, 0.22, 0.03]} />
      <mesh geometry={UNIT_BOX} material={matteMaterial('#3a3632')} position={[0, 0.125, 0]} scale={[0.82, 0.01, 0.82]} />
      {inside && (
        <group position={[0, 0.13, -0.05]}>
          <ShadowFigure height={1.82} phase={1.3} />
        </group>
      )}
    </group>
  )
}
const FACES = [0, PI / 2, PI, -PI / 2]

/** A pillar box: red cylinder, a slot under the cap, and the collection plate. */
export function PostBox({ letters = false }: { letters?: boolean }) {
  const red = glossMaterial('#c8202a')
  return (
    <group>
      <mesh geometry={DISC} material={MAT.black} position={[0, 0.06, 0]} scale={[0.25, 0.12, 0.25]} />
      <mesh geometry={DISC} material={red} position={[0, 0.66, 0]} scale={[0.23, 1.1, 0.23]} castShadow />
      <mesh geometry={lathe([[0.25, 0], [0.26, 0.04], [0.22, 0.1], [0.12, 0.17], [0, 0.19]], 24)} material={red} position={[0, 1.21, 0]} castShadow />
      <mesh geometry={UNIT_BOX} material={MAT.black} position={[0, 1.08, 0.215]} scale={[0.2, 0.03, 0.04]} />
      <mesh geometry={UNIT_BOX} material={MAT.white} position={[0, 0.85, 0.226]} scale={[0.14, 0.1, 0.01]} />
      {letters && <Instanced geometry={UNIT_BOX} material={MAT.white} items={LETTERS_OUT()} castShadow />}
    </group>
  )
}
const LETTERS_OUT = once(() => {
  const rng = mulberry32(23)
  const out: Placement[] = [
    { at: [0, 1.06, 0.26], rot: [0.4, 0, 0.1], scale: [0.16, 0.004, 0.11] },
    { at: [0.04, 1.05, 0.27], rot: [0.6, 0.3, 0], scale: [0.16, 0.004, 0.11] },
  ]
  for (let k = 0; k < 16; k++) {
    const a = -PI / 2 + (rng() - 0.5) * 2.4
    const r = 0.35 + rng() * 0.6
    out.push({ at: [Math.cos(a) * r * 0.9, 0.004 + k * 0.002, -Math.sin(a) * r], rot: [0, rng() * 6, 0], scale: [0.16, 0.004, 0.11] })
  }
  return out
})

// ---------------------------------------------------------------------------
// Trees and bikes
// ---------------------------------------------------------------------------

const BARK = new MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })
const LEAVES = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })

/** A London plane in an iron grate. */
export function Tree({ crown = 'summer' }: { crown?: 'summer' | 'autumn' | 'bare' }) {
  const t = treeParts()
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.iron} position={[0, 0.005, 0]} scale={[1.2, 0.01, 1.2]} receiveShadow />
      <mesh geometry={t.wood} material={BARK} castShadow receiveShadow />
      {crown !== 'bare' && <mesh geometry={crown === 'autumn' ? t.autumn : t.summer} material={LEAVES} castShadow receiveShadow />}
    </group>
  )
}

/** A town bike locked to a Sheffield stand (along x). `wheel`: thieves left only the front wheel. `penny`: it's a penny-farthing. */
export function Bike({ mode = 'default' }: { mode?: 'default' | 'wheel' | 'penny' }) {
  const b = bikeParts()
  const frame = MAT.shell
  return (
    <group>
      <mesh geometry={SHEFFIELD} material={MAT.steel} castShadow />
      <group position={[0, 0, 0.16]}>
        {mode === 'default' && (
          <>
            <mesh geometry={b.frame} material={frame} castShadow />
            <mesh geometry={b.wheel} material={frame} position={[-0.52, 0.34, 0]} castShadow />
            <mesh geometry={b.wheel} material={frame} position={[0.52, 0.34, 0]} castShadow />
          </>
        )}
        {mode === 'wheel' && (
          // just the front wheel, still chained to the stand, leaning on it
          <mesh geometry={b.wheel} material={frame} position={[0.3, 0.35, -0.06]} rotation={[0.18, 0, 0]} castShadow />
        )}
        {mode === 'penny' && (
          <>
            <mesh geometry={b.penny} material={frame} castShadow />
            <mesh geometry={b.bigWheel} material={frame} position={[0.1, 0.78, 0]} castShadow />
            <mesh geometry={b.smallWheel} material={frame} position={[-0.72, 0.2, 0]} castShadow />
          </>
        )}
        {/* the D-lock round the stand */}
        <mesh geometry={UNIT_BOX} material={MAT.black} position={[0.3, 0.5, -0.09]} scale={[0.04, 0.2, 0.04]} />
      </group>
    </group>
  )
}

/** Swaying slowly, for things hanging or tied up. */
export function Sway({ amount = 0.05, speed = 1, children }: { amount?: number; speed?: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * speed) * amount
  })
  return <group ref={ref}>{children}</group>
}
