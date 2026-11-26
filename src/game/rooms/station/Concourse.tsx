import { ConeGeometry, ExtrudeGeometry, MeshStandardMaterial, Shape, TorusGeometry } from 'three'
import { Instanced, PI, type Placement } from '../../kit'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { FacesYou } from '../living/oddities'
import { Builder } from '../market/build'
import { Watching } from '../market/Watching'
import { BALL, BALL_LOW, BOX, CYL, glow, gloss, lathe, MAT, matte, metal, POP } from './parts'
import { Ball, Box, Cyl, Print, Rod } from './Prims'
import { keysTexture, paperTexture, sign, wetFloorTexture } from './textures'
import { FLOCKS, roofY } from './plan'

/*
 * Things out on the concourse floor: the public piano, benches, trolleys and
 * luggage, the bin, pigeons, the cleaner's trolley, the statue, the
 * Christmas tree, a balloon, and the lamp standards with what's fixed to
 * them. Each is built round its own origin on the floor, front to +z.
 */

// ---------------------------------------------------------------------------
// The piano: an upright, painted red, PLAY ME on the front
// ---------------------------------------------------------------------------

export const PIANO_TOP = 1.34

export function Piano({ mode }: { mode: 'default' | 'open' | 'keys' | 'music' }) {
  const red = gloss(POP.red)
  return (
    <group>
      <Box size={[1.5, 1.3, 0.4]} at={[0, 0.65, -0.1]} mat={red} paint />
      <Box size={[1.5, 0.1, 0.3]} at={[0, 0.72, 0.25]} mat={red} paint />
      <Print map={keysTexture(mode === 'keys')} w={1.32} h={0.2} at={[0, 0.772, 0.25]} rot={[-PI / 2, 0, 0]} />
      <Box size={[1.5, 0.18, 0.04]} at={[0, 0.86, 0.12]} mat={MAT.black} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.08, 0.22, 0.32]} at={[s * 0.71, 0.84, 0.25]} mat={red} paint />
          <Box size={[0.07, 0.62, 0.07]} at={[s * 0.68, 0.31, 0.36]} mat={red} paint />
          <Box size={[0.09, 0.05, 0.4]} at={[s * 0.68, 0.025, 0.22]} mat={MAT.black} />
        </group>
      ))}
      {[-0.1, 0, 0.1].map((x) => (
        <Box key={x} size={[0.05, 0.02, 0.12]} at={[x, 0.07, 0.15]} mat={MAT.brass} />
      ))}
      {/* the music desk */}
      <Box size={[0.9, 0.16, 0.025]} at={[0, 1.0, 0.11]} rot={[-0.15, 0, 0]} mat={MAT.black} />
      {/* gold lining on the front panel, and a pair of brass candle sconces */}
      <Box size={[1.2, 0.02, 0.005]} at={[0, 1.2, 0.102]} mat={MAT.brass} shadow={false} />
      <Box size={[1.2, 0.02, 0.005]} at={[0, 0.94, 0.102]} mat={MAT.brass} shadow={false} />
      {[-1, 1].map((s) => (
        <Cyl key={s} r={0.05} h={0.02} at={[s * 0.6, 1.08, 0.13]} mat={MAT.brass} />
      ))}
      <Print map={sign('PLAY ME!', '#ffd21f', '#141414', 384, 96, 'rim')} w={0.8} h={0.2} at={[0, 0.38, 0.102]} />
      {mode === 'open' ? (
        <group position={[0, 1.32, -0.33]} rotation={[-1.15, 0, 0]}>
          <Box size={[1.54, 0.04, 0.46]} at={[0, 0, 0.23]} mat={red} paint />
        </group>
      ) : (
        <Box size={[1.54, 0.04, 0.46]} at={[0, 1.32, -0.1]} mat={red} paint />
      )}
      {mode === 'music' &&
        [-0.17, 0.17].map((x) => (
          <group key={x} position={[x, 1.13, 0.14]} rotation={[-0.15, 0, x * 0.3]}>
            <Print map={sign('♪ ♫\n♬ ♪', '#ffffff', '#141414', 160, 200)} w={0.3} h={0.38} />
          </group>
        ))}
    </group>
  )
}

export function PianoStool() {
  return (
    <group>
      <Box size={[0.72, 0.07, 0.34]} at={[0, 0.5, 0]} mat={gloss(POP.ink)} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Rod key={`${sx}${sz}`} a={[sx * 0.3, 0, sz * 0.13]} b={[sx * 0.3, 0.47, sz * 0.13]} r={0.022} mat={MAT.black} />))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Benches
// ---------------------------------------------------------------------------

/** Top of a bench's seat. */
export const SEAT_Y = 0.46

export function Bench({ paper = false }: { paper?: boolean }) {
  const iron = gloss(POP.teal)
  return (
    <group>
      {[-0.85, 0.85].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box size={[0.06, 0.44, 0.06]} at={[0, 0.22, 0.17]} mat={iron} />
          <Box size={[0.06, 0.9, 0.06]} at={[0, 0.45, -0.2]} rot={[-0.12, 0, 0]} mat={iron} />
          <Box size={[0.06, 0.05, 0.48]} at={[0, 0.41, -0.02]} mat={iron} />
          <Box size={[0.07, 0.04, 0.4]} at={[0, 0.64, 0.02]} mat={iron} />
        </group>
      ))}
      {[-0.17, -0.06, 0.05, 0.16].map((z) => (
        <Box key={z} size={[1.9, 0.035, 0.09]} at={[0, SEAT_Y - 0.0175, z]} mat={MAT.paleWood} />
      ))}
      {[0.6, 0.73, 0.86].map((y) => (
        <Box key={y} size={[1.9, 0.09, 0.03]} at={[0, y, -0.2 - (y - 0.45) * 0.12]} rot={[-0.12, 0, 0]} mat={MAT.paleWood} />
      ))}
      {paper && (
        <group position={[-0.45, SEAT_Y + 0.012, 0.0]} rotation={[0, 0.35, 0]}>
          <Box size={[0.3, 0.02, 0.38]} mat={MAT.white} />
          <Print map={paperTexture('default')} w={0.3} h={0.38} at={[0, 0.011, 0]} rot={[-PI / 2, 0, 0]} />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The cat that sleeps on the bench
// ---------------------------------------------------------------------------

const EAR = new ConeGeometry(0.035, 0.07, 4)
const TAIL = new TorusGeometry(0.21, 0.028, 8, 20, PI * 0.9)
const GINGER = matte(POP.orange)

export function Cat({ awake = false }: { awake?: boolean }) {
  if (awake)
    return (
      <Watching>
        <Ball r={[0.13, 0.19, 0.12]} at={[0, 0.18, 0]} mat={GINGER} />
        <Ball r={[0.07, 0.04, 0.09]} at={[-0.06, 0.03, 0.08]} mat={GINGER} />
        <Ball r={[0.07, 0.04, 0.09]} at={[0.06, 0.03, 0.08]} mat={GINGER} />
        <group position={[0, 0.4, 0.03]}>
          <Ball r={[0.1, 0.09, 0.09]} mat={GINGER} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh geometry={EAR} material={GINGER} position={[s * 0.055, 0.09, 0]} rotation={[0, 0, -s * 0.3]} />
              <Ball r={0.024} at={[s * 0.04, 0.015, 0.075]} mat={glow('#ffe14a')} shadow={false} />
              <Box size={[0.008, 0.03, 0.01]} at={[s * 0.04, 0.015, 0.098]} mat={MAT.black} shadow={false} />
            </group>
          ))}
          <Ball r={0.012} at={[0, -0.02, 0.09]} mat={matte(POP.pink)} shadow={false} />
        </group>
        <mesh geometry={TAIL} material={GINGER} position={[0, 0.03, 0]} rotation={[PI / 2, 0, 0.3]} />
      </Watching>
    )
  return (
    <group>
      <Ball r={[0.22, 0.1, 0.15]} at={[0, 0.09, 0]} mat={GINGER} />
      <group position={[0.2, 0.08, 0.06]} rotation={[0, 0.5, 0.2]}>
        <Ball r={[0.085, 0.075, 0.08]} mat={GINGER} />
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={EAR} material={GINGER} position={[0.02, 0.07, s * 0.045]} rotation={[s * 0.3, 0, 0]} />
        ))}
      </group>
      <mesh geometry={TAIL} material={GINGER} position={[0, 0.03, 0]} rotation={[PI / 2, 0, 0.6]} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Luggage: a trolley (loaded, stacked sky-high, or empty), a suitcase, a rucksack
// ---------------------------------------------------------------------------

const CASE_COLOURS = [POP.blue, POP.red, POP.yellow, POP.green, POP.pink, POP.violet, POP.orange, POP.cyan, '#141414', POP.teal]

const tower = once(() => {
  const rng = mulberry32(19)
  let y = 0.14
  return Array.from({ length: 11 }, (_, k) => {
    const h = 0.22 + rng() * 0.14
    const p = { y: y + h / 2, h, w: 0.45 + rng() * 0.12, d: 0.6 + rng() * 0.25, turn: (rng() - 0.5) * 0.35, colour: CASE_COLOURS[k % CASE_COLOURS.length] }
    y += h
    return p
  })
})

export function Trolley({ mode = 'empty' }: { mode?: 'default' | 'tower' | 'empty' }) {
  return (
    <group>
      <Box size={[0.62, 0.04, 0.95]} at={[0, 0.12, 0]} mat={MAT.chrome} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod a={[s * 0.28, 0.12, -0.46]} b={[s * 0.28, 1.05, -0.56]} r={0.018} mat={MAT.chrome} />
          <Rod a={[s * 0.28, 0.12, 0.46]} b={[s * 0.28, 0.3, 0.46]} r={0.015} mat={MAT.chrome} />
        </group>
      ))}
      <Rod a={[-0.32, 1.05, -0.56]} b={[0.32, 1.05, -0.56]} r={0.022} mat={gloss(POP.red)} />
      <Rod a={[-0.28, 0.6, -0.51]} b={[0.28, 0.6, -0.51]} r={0.015} mat={MAT.chrome} />
      {[-1, 1].flatMap((sx) =>
        [-0.38, 0.38].map((z) => <Cyl key={`${sx}${z}`} r={0.06} h={0.04} at={[sx * 0.26, 0.06, z]} rot={[0, 0, PI / 2]} mat={MAT.rubber} />),
      )}
      {mode === 'default' && (
        <>
          <Box size={[0.56, 0.26, 0.82]} at={[0, 0.27, 0.0]} mat={gloss(POP.blue)} />
          <Box size={[0.5, 0.22, 0.66]} at={[0, 0.51, -0.04]} rot={[0, 0.08, 0]} mat={gloss(POP.yellow)} />
          <Cyl r={0.13} h={0.5} at={[0, 0.75, -0.1]} rot={[0, 0, PI / 2]} mat={matte(POP.green)} />
        </>
      )}
      {mode === 'tower' &&
        tower().map((p, k) => <Box key={k} size={[p.w, p.h, p.d]} at={[0, p.y, -0.05]} rot={[0, p.turn, 0]} mat={gloss(p.colour)} />)}
    </group>
  )
}

export function Suitcase({ open = false }: { open?: boolean }) {
  const red = gloss(POP.red)
  if (open)
    return (
      <group>
        <Box size={[0.64, 0.1, 0.42]} at={[0, 0.05, 0]} mat={red} paint />
        <Box size={[0.64, 0.1, 0.42]} at={[0, 0.05, 0.46]} mat={red} paint />
        {/* clothes all over the place */}
        <Box size={[0.4, 0.04, 0.3]} at={[0.0, 0.12, 0.0]} rot={[0, 0.3, 0]} mat={matte(POP.yellow)} />
        <Box size={[0.3, 0.05, 0.2]} at={[0.1, 0.16, 0.05]} rot={[0, -0.5, 0]} mat={matte(POP.cyan)} />
        <Box size={[0.36, 0.03, 0.24]} at={[0.55, 0.015, 0.2]} rot={[0, 0.8, 0]} mat={matte(POP.pink)} />
        <Box size={[0.18, 0.03, 0.08]} at={[-0.5, 0.015, 0.4]} rot={[0, 0.4, 0]} mat={matte(POP.green)} />
        <Box size={[0.12, 0.03, 0.22]} at={[-0.45, 0.015, -0.1]} rot={[0, 1.2, 0]} mat={matte('#ffffff')} />
      </group>
    )
  return (
    <group>
      <Box size={[0.44, 0.62, 0.26]} at={[0, 0.38, 0]} mat={red} paint />
      {[-0.1, 0.1].map((x) => (
        <Box key={x} size={[0.04, 0.56, 0.27]} at={[x, 0.38, 0]} mat={red} paint />
      ))}
      <Rod a={[-0.1, 0.69, -0.1]} b={[-0.1, 1.0, -0.1]} r={0.012} mat={MAT.steel} />
      <Rod a={[0.1, 0.69, -0.1]} b={[0.1, 1.0, -0.1]} r={0.012} mat={MAT.steel} />
      <Box size={[0.26, 0.03, 0.03]} at={[0, 1.0, -0.1]} mat={MAT.black} />
      {[-0.17, 0.17].flatMap((x) => [-0.09, 0.09].map((z) => <Ball key={`${x}${z}`} r={0.035} at={[x, 0.035, z]} mat={MAT.rubber} />))}
    </group>
  )
}

export function Rucksack() {
  const blue = gloss(POP.blue)
  return (
    <group rotation={[-0.25, 0, 0]}>
      <Ball r={[0.17, 0.25, 0.12]} at={[0, 0.25, 0]} mat={blue} paint />
      <Ball r={[0.12, 0.12, 0.06]} at={[0, 0.16, 0.1]} mat={blue} paint />
      <Box size={[0.2, 0.04, 0.04]} at={[0, 0.5, -0.02]} mat={MAT.black} />
      {[-0.08, 0.08].map((x) => (
        <Box key={x} size={[0.04, 0.36, 0.03]} at={[x, 0.27, -0.12]} mat={MAT.black} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// An umbrella, furled and leaning to -x, or open and upside down on the floor
// ---------------------------------------------------------------------------

const FURLED = lathe([[0, 0], [0.035, 0.1], [0.05, 0.5], [0.015, 0.62], [0, 0.62]], 12)
const CANOPY = lathe([[0, 0.3], [0.2, 0.27], [0.38, 0.17], [0.5, 0.0], [0.48, 0.0], [0.36, 0.15], [0.19, 0.25], [0, 0.28]], 8)
const HOOK = new TorusGeometry(0.045, 0.012, 6, 12, PI)

export function Umbrella({ open = false }: { open?: boolean }) {
  const cloth = gloss(POP.yellow)
  if (open)
    return (
      <group position={[0.6, 0.42, 0]} rotation={[PI - 0.25, 0, 0.1]}>
        <mesh geometry={CANOPY} material={cloth} castShadow userData={{ paint: true }} />
        <Rod a={[0, 0.3, 0]} b={[0, -0.45, 0]} r={0.008} mat={MAT.black} />
        <mesh geometry={HOOK} material={MAT.black} position={[0.045, -0.45, 0]} rotation={[0, 0, PI]} />
      </group>
    )
  return (
    <group rotation={[0, 0, 0.22]}>
      <Rod a={[0, 0, 0]} b={[0, 0.9, 0]} r={0.008} mat={MAT.black} />
      <mesh geometry={FURLED} material={cloth} position={[0, 0.1, 0]} castShadow userData={{ paint: true }} />
      <mesh geometry={HOOK} material={MAT.black} position={[0.045, 0.9, 0]} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// A clear-bag litter bin on a red hoop
// ---------------------------------------------------------------------------

const BAG = lathe([[0, 0.04], [0.22, 0.06], [0.27, 0.3], [0.27, 0.86], [0.29, 0.9]], 20)
const BAG_MAT = new MeshStandardMaterial({ color: '#cfe8d8', roughness: 0.2, transparent: true, opacity: 0.4, depthWrite: false })
const litter = once(() => {
  const rng = mulberry32(13)
  const colours = [POP.red, POP.yellow, '#ffffff', POP.blue, '#c49a64']
  const inside = colours.map(() => Array.from({ length: 4 }, (): Placement => ({ at: [(rng() - 0.5) * 0.3, 0.12 + rng() * 0.4, (rng() - 0.5) * 0.3], rot: [rng() * 3, rng() * 3, 0], scale: [0.07, 0.11, 0.07] })))
  const around = colours.map(() =>
    Array.from({ length: 5 }, (): Placement => {
      const a = rng() * PI * 2
      const r = 0.36 + rng() * 0.4
      return { at: [Math.cos(a) * r, 0.04, Math.sin(a) * r], rot: [PI / 2, rng() * 3, 0], scale: [0.05, 0.11, 0.05] }
    }),
  )
  const heap = colours.map(() => Array.from({ length: 4 }, (): Placement => ({ at: [(rng() - 0.5) * 0.4, 0.92 + rng() * 0.2, (rng() - 0.5) * 0.4], rot: [rng() * 3, rng() * 3, 0], scale: [0.08, 0.1, 0.08] })))
  return { colours, inside, around, heap }
})

export function Bin({ mode = 'default' }: { mode?: 'default' | 'overflow' | 'eyes' }) {
  const l = litter()
  return (
    <group>
      <Cyl r={0.3} h={0.03} at={[0, 0.015, 0]} mat={MAT.iron} />
      <Rod a={[0, 0, -0.3]} b={[0, 0.92, -0.3]} r={0.025} mat={gloss(POP.red)} />
      <mesh geometry={CYL} material={gloss(POP.red)} position={[0, 0.9, 0]} scale={[0.3, 0.04, 0.3]} castShadow />
      <mesh geometry={BAG} material={BAG_MAT} />
      {l.colours.map((c, k) => (
        <Instanced key={c} geometry={BOX} material={matte(c)} items={mode === 'overflow' ? [...l.inside[k], ...l.heap[k], ...l.around[k]] : l.inside[k]} />
      ))}
      {mode === 'eyes' && (
        <group position={[0, 0.66, 0.1]}>
          <Ball r={[0.2, 0.18, 0.14]} at={[0, -0.05, -0.06]} mat={MAT.black} shadow={false} />
          {[-1, 1].map((s) => (
            <Ball key={s} r={[0.045, 0.03, 0.02]} at={[s * 0.07, 0, 0.08]} mat={glow('#fff36a')} shadow={false} />
          ))}
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Pigeons
// ---------------------------------------------------------------------------

/** A pigeon facing +z, standing or pecking, baked into one vertex-coloured mesh each. */
const pigeonGeometry = once(() => {
  const make = (pecking: boolean) => {
    const b = new Builder()
    const head: [number, number, number] = pecking ? [0, 0.1, 0.16] : [0, 0.24, 0.09]
    b.add(BALL_LOW, '#8890a2', [0, 0.13, 0], [pecking ? 0.35 : -0.15, 0, 0], [0.085, 0.08, 0.14])
    b.add(BALL_LOW, '#5f8578', [0, pecking ? 0.12 : 0.16, 0.07], [0, 0, 0], [0.065, 0.065, 0.06])
    b.add(BALL_LOW, '#6d7486', [0, 0.16, -0.02], [0, 0, 0], [0.075, 0.05, 0.1])
    b.add(BALL_LOW, '#7b8296', head, [0, 0, 0], [0.045, 0.048, 0.05])
    b.add(BOX, '#d9c27a', [head[0], head[1] - 0.008, head[2] + 0.05], [0.3, 0, 0], [0.014, 0.012, 0.04])
    b.add(BALL_LOW, '#ff7a1a', [0.03, head[1] + 0.01, head[2] + 0.02], [0, 0, 0], [0.01, 0.01, 0.01])
    b.add(BALL_LOW, '#ff7a1a', [-0.03, head[1] + 0.01, head[2] + 0.02], [0, 0, 0], [0.01, 0.01, 0.01])
    b.add(BOX, '#3b3f4c', [0, pecking ? 0.17 : 0.12, -0.17], [pecking ? 0.5 : -0.2, 0, 0], [0.07, 0.015, 0.11])
    for (const s of [-1, 1]) b.add(BOX, '#e07a8a', [s * 0.03, 0.03, 0.01], [0, 0, 0], [0.012, 0.06, 0.012])
    return b.merge()
  }
  return { standing: make(false), pecking: make(true) }
})

export function Pigeon({ mode = 'default' }: { mode?: 'default' | 'ticket' | 'suitcase' }) {
  const p = pigeonGeometry()
  return (
    <group>
      <mesh geometry={p.standing} material={MAT.baked} castShadow />
      {mode === 'ticket' && <Box size={[0.07, 0.004, 0.05]} at={[0.01, 0.228, 0.165]} rot={[0.3, 0.3, 0]} mat={matte('#ff9a1c')} shadow={false} />}
      {mode === 'suitcase' && (
        <>
          <Box size={[0.13, 0.1, 0.05]} at={[0, 0.06, -0.38]} rot={[0, 0.2, 0]} mat={gloss(POP.red)} />
          <Rod a={[0, 0.23, 0.13]} b={[0, 0.1, -0.36]} r={0.003} mat={MAT.white} />
        </>
      )}
    </group>
  )
}

const flockPlacements = once(() =>
  FLOCKS.map((f) => {
    const standing: Placement[] = []
    const pecking: Placement[] = []
    for (const [x, z, turn, peck] of f.birds) (peck ? pecking : standing).push({ at: [x, 0, z], rot: [0, turn, 0] })
    return { standing, pecking }
  }),
)

export function Flock({ index }: { index: number }) {
  const p = pigeonGeometry()
  const f = flockPlacements()[index]
  return (
    <>
      <Instanced geometry={p.standing} material={MAT.baked} items={f.standing} castShadow />
      <Instanced geometry={p.pecking} material={MAT.baked} items={f.pecking} castShadow />
    </>
  )
}

// ---------------------------------------------------------------------------
// Wet floor sign and the cleaner's trolley
// ---------------------------------------------------------------------------

export function WetFloor({ fallen = false }: { fallen?: boolean }) {
  const yellow = gloss(POP.yellow)
  const face = wetFloorTexture()
  /** One leaf of the A-frame, hinged at the top, opened `spread` from upright. */
  const panel = (s: number, spread: number) => (
    <group key={s} position={[0, 0.64, 0]} rotation={[s * spread, 0, 0]}>
      <Box size={[0.32, 0.64, 0.02]} at={[0, -0.32, 0]} mat={yellow} />
      <Print map={face} w={0.28} h={0.42} at={[0, -0.3, s * 0.011]} rot={[0, s < 0 ? PI : 0, 0]} />
    </group>
  )
  if (fallen)
    // folded shut and flat on its back, the hinge end towards -z
    return (
      <group position={[0, 0.035, 0.3]} rotation={[-PI / 2, 0, 0.4]}>
        <group position={[0, -0.64, 0]}>{[1, -1].map((s) => panel(s, 0.03))}</group>
      </group>
    )
  return <group>{[1, -1].map((s) => panel(s, 0.24))}</group>
}

const MOP_HEAD = lathe([[0, 0], [0.12, 0], [0.09, 0.18], [0.03, 0.22], [0, 0.22]], 10)
const BUCKET = lathe([[0, 0], [0.18, 0], [0.22, 0.32], [0.23, 0.33], [0, 0.33]], 18)
const WATER = new MeshStandardMaterial({ color: '#7fc8ff', roughness: 0.05, transparent: true, opacity: 0.5, depthWrite: false })

function Mop({ at, lean }: { at: [number, number, number]; lean: [number, number, number] }) {
  return (
    <group position={at} rotation={lean}>
      <mesh geometry={MOP_HEAD} material={matte('#e8e2d2')} castShadow />
      <Rod a={[0, 0.15, 0]} b={[0, 1.35, 0]} r={0.014} mat={gloss(POP.blue)} />
    </group>
  )
}

export function CleanerCart({ mode }: { mode: 'default' | 'mop' | 'spill' }) {
  const yellow = gloss(POP.yellow)
  const grey = matte('#5a6068')
  return (
    <group>
      <Box size={[0.6, 0.05, 0.95]} at={[0, 0.14, -0.1]} mat={grey} />
      <Box size={[0.6, 0.04, 0.5]} at={[0, 0.8, -0.32]} mat={grey} />
      {[-1, 1].flatMap((s) => [-0.55, -0.08].map((z) => <Rod key={`${s}${z}`} a={[s * 0.28, 0.14, z]} b={[s * 0.28, 1.0, z]} r={0.015} mat={grey} />))}
      <Rod a={[-0.3, 1.0, -0.55]} b={[0.3, 1.0, -0.55]} r={0.02} mat={yellow} />
      <Cyl r={0.2} h={0.6} at={[0, 0.47, -0.32]} mat={matte('#202020')} />
      {/* spray bottles and cloths up top */}
      {[POP.cyan, POP.pink, POP.green].map((c, k) => (
        <Box key={c} size={[0.07, 0.2, 0.07]} at={[-0.18 + k * 0.17, 0.92, -0.32]} mat={gloss(c)} />
      ))}
      {[-1, 1].flatMap((sx) => [-0.5, 0.3].map((z) => <Cyl key={`${sx}${z}`} r={0.05} h={0.04} at={[sx * 0.26, 0.05, z]} rot={[0, 0, PI / 2]} mat={MAT.rubber} />))}
      {mode === 'spill' ? (
        <>
          <mesh geometry={BUCKET} material={yellow} position={[0.45, 0.25, 0.62]} rotation={[0, 0.5, PI / 2]} castShadow />
          <mesh geometry={CYL} material={WATER} position={[0.95, 0.004, 0.9]} scale={[0.6, 0.008, 0.45]} />
          <Mop at={[0.0, 0.13, 0.55]} lean={[PI / 2, 0.6, 0]} />
        </>
      ) : (
        <>
          <mesh geometry={BUCKET} material={yellow} position={[0, 0.17, 0.2]} castShadow />
          <Box size={[0.3, 0.12, 0.12]} at={[0, 0.5, 0.06]} mat={grey} />
          {mode === 'mop' ? <Mop at={[0.85, 0, 0.55]} lean={[0, 0, 0]} /> : <Mop at={[0, 0.2, 0.22]} lean={[-0.25, 0, -0.15]} />}
        </>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The statue: a bronze commuter checking his watch, on a stone plinth
// ---------------------------------------------------------------------------

const COAT = lathe([[0, 0.55], [0.24, 0.55], [0.21, 0.9], [0.2, 1.2], [0.24, 1.37], [0.15, 1.46], [0.06, 1.5], [0, 1.5]], 24).scale(1, 1, 0.72)
const OPEN_CANOPY = lathe([[0, 0.32], [0.3, 0.28], [0.55, 0.15], [0.7, 0.0], [0.68, 0.0], [0.54, 0.13], [0.3, 0.26], [0, 0.3]], 8)

function Commuter({ pigeon = false }: { pigeon?: boolean }) {
  const b = MAT.bronze
  return (
    <group>
      {[-0.1, 0.1].map((x) => (
        <group key={x}>
          <Cyl r={0.075} h={0.6} at={[x, 0.3, 0]} mat={b} />
          <Ball r={[0.07, 0.05, 0.13]} at={[x, 0.04, 0.05]} mat={b} />
        </group>
      ))}
      <mesh geometry={COAT} material={b} castShadow />
      <Cyl r={0.05} h={0.12} at={[0, 1.52, 0]} mat={b} />
      <group position={[0, 1.64, 0.02]} rotation={[0.35, 0.3, 0]}>
        <Ball r={[0.1, 0.12, 0.11]} mat={b} />
        <Cyl r={0.17} h={0.02} at={[0, 0.08, 0]} mat={b} />
        <Cyl r={0.1} h={0.1} at={[0, 0.13, 0]} mat={b} />
        {pigeon && (
          <group position={[0, 0.18, 0]} rotation={[-0.35, 2.4, 0]}>
            <mesh geometry={pigeonGeometry().standing} material={MAT.baked} castShadow />
          </group>
        )}
      </group>
      {/* his left arm up to look at his watch; his right holding a briefcase */}
      <Rod a={[-0.2, 1.38, 0]} b={[-0.3, 1.12, 0.14]} r={0.055} mat={b} />
      <Rod a={[-0.3, 1.12, 0.14]} b={[-0.06, 1.3, 0.3]} r={0.05} mat={b} />
      <Ball r={0.05} at={[-0.04, 1.31, 0.32]} mat={b} />
      <Cyl r={0.04} h={0.02} at={[-0.1, 1.29, 0.27]} rot={[0.6, 0, 1.0]} mat={MAT.brass} />
      <Rod a={[0.2, 1.38, 0]} b={[0.27, 0.95, 0.03]} r={0.052} mat={b} />
      <Box size={[0.08, 0.32, 0.38]} at={[0.3, 0.74, 0.03]} mat={b} />
    </group>
  )
}

export function Statue({ mode }: { mode: 'default' | 'watch' | 'umbrella' | 'pigeon' }) {
  return (
    <group>
      <Box size={[1.1, 0.9, 1.1]} at={[0, 0.45, 0]} mat={MAT.stone} />
      <Box size={[1.2, 0.08, 1.2]} at={[0, 0.94, 0]} mat={MAT.stone} />
      <Box size={[1.2, 0.1, 1.2]} at={[0, 0.05, 0]} mat={MAT.stone} />
      <Box size={[0.62, 0.2, 0.02]} at={[0, 0.6, 0.555]} mat={MAT.brass} />
      <Print map={sign('THE COMMUTER', '#c9a13f', '#2a1a0a', 384, 96)} w={0.56} h={0.15} at={[0, 0.6, 0.567]} />
      <group position={[0, 0.98, 0]}>
        {mode === 'watch' ? (
          <Watching>
            <Commuter />
          </Watching>
        ) : (
          <Commuter pigeon={mode === 'pigeon'} />
        )}
        {mode === 'umbrella' && (
          <group position={[0.27, 0.95, 0.03]}>
            <Rod a={[0, 0, 0]} b={[-0.12, 1.15, 0]} r={0.01} mat={MAT.black} />
            <mesh geometry={OPEN_CANOPY} material={gloss(POP.red)} position={[-0.13, 1.1, 0]} rotation={[0, 0, 0.1]} castShadow />
          </group>
        )}
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// The Christmas tree
// ---------------------------------------------------------------------------

const CONE = new ConeGeometry(1, 1, 28, 1, true)
const CONE_BASE = new ConeGeometry(1, 1, 28)
/** Each tier: radius at its base, its height, and where its base is. */
const TIERS: [number, number, number][] = [
  [1.7, 2.0, 0.9],
  [1.35, 1.8, 2.1],
  [1.0, 1.6, 3.2],
  [0.6, 1.3, 4.3],
]
export const TREE_TOP = 5.6

const STAR = (() => {
  const s = new Shape()
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 0.12 : 0.28
    const a = (k / 10) * PI * 2 + PI / 2
    if (k) s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return new ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }).translate(0, 0, -0.03)
})()

const decorations = once(() => {
  const rng = mulberry32(25)
  const baubles: Placement[] = []
  const lights: Placement[] = []
  for (const [r, h, y0] of TIERS) {
    for (let k = 0; k < Math.round(r * 9); k++) {
      const f = 0.05 + rng() * 0.4
      const a = rng() * PI * 2
      const rr = r * (1 - f) + 0.04
      baubles.push({ at: [Math.cos(a) * rr, y0 + f * h - 0.08, Math.sin(a) * rr], scale: [0.09, 0.09, 0.09] })
    }
    for (let k = 0; k < Math.round(r * 16); k++) {
      const f = rng() * 0.8
      const a = rng() * PI * 2
      const rr = r * (1 - f) + 0.02
      lights.push({ at: [Math.cos(a) * rr, y0 + f * h, Math.sin(a) * rr], scale: [0.03, 0.03, 0.03] })
    }
  }
  return { baubles, lights }
})

function ChristmasTree({ bare = false }: { bare?: boolean }) {
  const green = matte('#1d7a46')
  const d = decorations()
  return (
    <group>
      <Cyl r={0.6} h={0.6} at={[0, 0.3, 0]} mat={gloss(POP.red)} />
      <Cyl r={0.64} h={0.08} at={[0, 0.6, 0]} mat={gloss(POP.yellow)} />
      <Cyl r={0.12} h={0.5} at={[0, 0.8, 0]} mat={MAT.darkWood} />
      {TIERS.map(([r, h, y0], k) => (
        // the branches are what a recolour paints: a pink tree is hard to miss
        <mesh key={k} geometry={k === 0 ? CONE_BASE : CONE} material={green} position={[0, y0 + h / 2, 0]} scale={[r, h, r]} castShadow receiveShadow userData={{ paint: true }} />
      ))}
      {!bare && (
        <>
          <Instanced geometry={BALL_LOW} material={gloss(POP.red)} items={d.baubles} castShadow />
          <Instanced geometry={BALL_LOW} material={glow('#fff2b0')} items={d.lights} />
          <mesh geometry={STAR} material={glow(POP.yellow)} position={[0, TREE_TOP + 0.2, 0]} />
        </>
      )}
    </group>
  )
}

export function Tree({ mode }: { mode: 'default' | 'upside' | 'bare' | 'present' }) {
  if (mode === 'upside') {
    // hung by its pot from the roof, point down
    const potY = 9.6
    return (
      <group>
        <Rod a={[0, potY, 0]} b={[0, roofY(-7.5) - 0.1, 0]} r={0.02} mat={MAT.black} />
        <group position={[0, potY, 0]} rotation={[PI, 0, 0]}>
          <ChristmasTree />
        </group>
      </group>
    )
  }
  return (
    <group>
      <ChristmasTree bare={mode === 'bare'} />
      {mode === 'present' && (
        <group position={[2.1, 0, 1.5]} rotation={[0, 0.4, 0]}>
          <Box size={[1.2, 1.0, 1.2]} at={[0, 0.5, 0]} mat={gloss(POP.pink)} />
          <Box size={[1.22, 1.02, 0.18]} at={[0, 0.5, 0]} mat={gloss(POP.yellow)} />
          <Box size={[0.18, 1.02, 1.22]} at={[0, 0.5, 0]} mat={gloss(POP.yellow)} />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={TAIL} material={gloss(POP.yellow)} position={[s * 0.12, 1.02, 0]} rotation={[0, 0, s * 0.6]} scale={0.7} castShadow />
          ))}
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// A balloon that got away, up against the glass
// ---------------------------------------------------------------------------

export function Balloon() {
  return (
    <group>
      <Ball r={[0.34, 0.4, 0.34]} at={[0, 0, 0]} mat={gloss(POP.red)} paint />
      <mesh geometry={EAR} material={gloss(POP.red)} position={[0, -0.42, 0]} rotation={[PI, 0, 0]} scale={0.6} />
      <Rod a={[0, -0.44, 0]} b={[0.05, -1.6, 0.03]} r={0.004} mat={MAT.white} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// A kick scooter, leaning on its stand, built along x
// ---------------------------------------------------------------------------

export function Scooter() {
  const green = gloss(POP.green)
  return (
    <group rotation={[0.12, 0, 0]}>
      <Box size={[0.8, 0.05, 0.15]} at={[0, 0.12, 0]} mat={green} paint />
      {[-0.4, 0.4].map((x) => (
        <Cyl key={x} r={0.1} h={0.05} at={[x, 0.1, 0]} rot={[PI / 2, 0, 0]} mat={MAT.rubber} />
      ))}
      <Rod a={[0.4, 0.1, 0]} b={[0.32, 1.0, 0]} r={0.022} mat={green} paint />
      <Rod a={[0.32, 1.0, -0.25]} b={[0.32, 1.0, 0.25]} r={0.018} mat={MAT.black} />
      <Rod a={[-0.2, 0.1, -0.02]} b={[-0.25, 0.0, -0.14]} r={0.01} mat={MAT.steel} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Cast-iron lamp standards, and things fixed to them
// ---------------------------------------------------------------------------

const COLUMN = lathe([[0.17, 0], [0.16, 0.2], [0.12, 3.8], [0.16, 3.95], [0.16, 4.05], [0, 4.05]], 16)
const LAMP_IRON = metal('#1d5a63')
const GLOBE = glow('#fff0c0')

export function LampStandard() {
  return (
    <group>
      <Box size={[0.6, 0.5, 0.6]} at={[0, 0.25, 0]} mat={LAMP_IRON} />
      <Box size={[0.66, 0.06, 0.66]} at={[0, 0.53, 0]} mat={gloss(POP.yellow)} />
      <mesh geometry={COLUMN} material={LAMP_IRON} position={[0, 0.5, 0]} castShadow />
      {[0, PI / 2, PI, -PI / 2].map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <Rod a={[0, 4.45, 0.1]} b={[0, 4.6, 0.5]} r={0.025} mat={LAMP_IRON} />
          <mesh geometry={BALL} material={GLOBE} position={[0, 4.78, 0.55]} scale={0.2} />
        </group>
      ))}
      <mesh geometry={BALL} material={GLOBE} position={[0, 4.9, 0]} scale={0.24} />
      <Cyl r={0.05} h={0.25} at={[0, 5.2, 0]} mat={LAMP_IRON} />
    </group>
  )
}

function Camera() {
  return (
    <group>
      <Box size={[0.15, 0.14, 0.34]} at={[0, 0, 0]} mat={MAT.white} />
      <Box size={[0.19, 0.03, 0.4]} at={[0, 0.085, 0.02]} mat={MAT.white} />
      <Cyl r={0.05} h={0.04} at={[0, 0, 0.18]} rot={[PI / 2, 0, 0]} mat={MAT.darkGlass} />
      <Ball r={0.012} at={[0.05, -0.04, 0.17]} mat={glow('#ff2a2a')} shadow={false} />
    </group>
  )
}

/** A security camera on a bracket off the column (axis at the origin), looking along +z and down. */
export function Cctv({ watch = false }: { watch?: boolean }) {
  return (
    <group>
      <Box size={[0.06, 0.06, 0.4]} at={[0, 0, 0.3]} mat={MAT.white} />
      <Box size={[0.08, 0.2, 0.04]} at={[0, 0, 0.14]} mat={MAT.white} />
      {watch ? (
        <FacesYou position={[0, -0.1, 0.55]}>
          <Camera />
        </FacesYou>
      ) : (
        <group position={[0, -0.1, 0.55]} rotation={[0.45, 0, 0]}>
          <Camera />
        </group>
      )}
    </group>
  )
}

const HORN = lathe([[0.05, 0], [0.08, 0.2], [0.15, 0.36], [0.24, 0.44], [0.23, 0.45], [0.14, 0.38], [0.07, 0.22], [0.04, 0.02]], 18).rotateX(PI / 2)
const NEST = new TorusGeometry(0.13, 0.06, 8, 18)

/** A loudspeaker horn on a bracket off the column, pointing along +z. */
export function Speaker({ nest = false }: { nest?: boolean }) {
  const grey = gloss('#c8ccd0')
  return (
    <group>
      <Box size={[0.05, 0.05, 0.3]} at={[0, 0, 0.25]} mat={MAT.iron} />
      <group position={[0, -0.05, 0.4]} rotation={[0.3, 0, 0]}>
        <mesh geometry={HORN} material={grey} castShadow />
        <Cyl r={0.08} h={0.14} at={[0, 0, -0.05]} rot={[PI / 2, 0, 0]} mat={grey} />
        {nest && (
          <group position={[0, 0.27, 0.22]}>
            <mesh geometry={NEST} material={matte('#7a5a32')} rotation={[PI / 2, 0, 0]} scale={[1, 1, 0.6]} castShadow />
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.07, 0.04, 0]} rotation={[0, s * 0.8, 0]}>
                <Ball r={[0.04, 0.045, 0.05]} at={[0, 0.03, 0]} mat={matte(POP.yellow)} />
                <Ball r={0.03} at={[0, 0.08, 0.03]} mat={matte(POP.blue)} />
              </group>
            ))}
          </group>
        )}
      </group>
    </group>
  )
}
