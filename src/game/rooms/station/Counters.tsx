import { ShadowFigure } from '../../figure'
import { Instanced, PI, type Placement } from '../../kit'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { BALL, CYL, glow, gloss, lathe, MAT, matte, metal, POP } from './parts'
import { Ball, Box, Cyl, Print, Rod } from './Prims'
import { DESK } from './plan'
import { mapTexture, posterTexture, screenTexture, sign } from './textures'

/*
 * Counters and machines: the ticket office, ticket machines, lost property
 * and cash machine on the east wall, the information desk in the middle,
 * the map and poster, and the help point on a lamp standard. Wall-hung
 * things are built out from the wall face at z = 0 into the room (+z).
 */

// ---------------------------------------------------------------------------
// Ticket office: three windows in a blue front, 5.6 m wide
// ---------------------------------------------------------------------------

const OFFICE_WINDOWS = [-1.8, 0, 1.8]
const OFFICE = { depth: 0.5, sill: 1.0, top: 2.5, w: 1.3 }

export function TicketOffice({ mode }: { mode: 'default' | 'closed' | 'figure' }) {
  const blue = gloss(POP.blue)
  const { depth, sill, top, w } = OFFICE
  const midY = (sill + top) / 2
  const gaps = [-2.625, -0.9, 0.9, 2.625]
  return (
    <group>
      {/* the front, round three windows */}
      <Box size={[5.6, sill, depth]} at={[0, sill / 2, depth / 2]} mat={blue} />
      <Box size={[5.6, 3.4 - top, depth]} at={[0, (top + 3.4) / 2, depth / 2]} mat={blue} />
      {gaps.map((x, k) => (
        <Box key={x} size={[k === 0 || k === 3 ? 0.35 : 0.5, top - sill, depth]} at={[x, midY, depth / 2]} mat={blue} />
      ))}
      {/* the office behind: a warm back wall, someone at window 1 */}
      <Box size={[5.2, top - sill, 0.04]} at={[0, midY, 0.04]} mat={matte('#ffe6b0')} />
      <Box size={[5.4, 0.06, depth]} at={[0, sill + 0.03, depth / 2]} mat={MAT.white} />
      <group position={[-1.8, sill - 0.5, 0.2]}>
        <Ball r={[0.13, 0.16, 0.13]} at={[0, 1.15, 0]} mat={matte('#c98a5a')} />
        <Box size={[0.46, 0.5, 0.24]} at={[0, 0.78, 0]} mat={matte('#2a3a6a')} />
      </group>
      {OFFICE_WINDOWS.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <Box size={[w, top - sill, 0.01]} at={[0, midY, depth - 0.04]} mat={MAT.glass} shadow={false} />
          <Cyl r={0.08} h={0.01} at={[0, sill + 0.55, depth - 0.03]} rot={[PI / 2, 0, 0]} mat={MAT.steel} />
          <Print map={sign(String(i + 1), '#ffd21f', '#141414', 128, 128)} w={0.28} h={0.28} at={[0, top + 0.25, depth + 0.002]} />
          {mode === 'closed' && i === 1 && <Print map={sign('POSITION\nCLOSED', '#f3f1ea', '#141414', 256, 256, 'rim')} w={w} h={top - sill} at={[0, midY, depth - 0.06]} />}
        </group>
      ))}
      {/* a counter outside each window */}
      <Box size={[5.6, 0.06, 0.4]} at={[0, sill, depth + 0.2]} mat={MAT.white} />
      <Box size={[3.2, 0.5, 0.06]} at={[0, 3.05, depth + 0.03]} mat={gloss(POP.yellow)} />
      <Print map={sign('TICKETS', '#ffd21f', '#141414', 640, 100)} w={3.1} h={0.48} at={[0, 3.05, depth + 0.062]} />
      {mode === 'figure' && (
        <group position={[1.8, 0, depth + 0.55]} rotation={[0, PI, 0]}>
          <ShadowFigure height={1.82} phase={0.7} />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Ticket machines: four in a row, 0.95 m apart, fronts to +z
// ---------------------------------------------------------------------------

const MACHINE_X = [-1.425, -0.475, 0.475, 1.425]

/** A long ticket, out of the slot, down the front and across the floor. */
function LongTicket() {
  const mat = matte('#fff0c8')
  const stripe = matte(POP.orange)
  return (
    <group position={[0, 0, 0.27]}>
      <Box size={[0.085, 0.85, 0.004]} at={[0, 0.5, 0.02]} rot={[0.05, 0, 0]} mat={mat} />
      <Box size={[0.085, 0.004, 1.3]} at={[0.05, 0.004, 0.7]} rot={[0, 0.12, 0]} mat={mat} />
      <Box size={[0.03, 0.006, 1.3]} at={[0.05, 0.006, 0.7]} rot={[0, 0.12, 0]} mat={stripe} shadow={false} />
      {/* curling up at the end */}
      <mesh geometry={CYL} material={mat} position={[0.2, 0.06, 1.38]} rotation={[PI / 2, 0, PI / 2 + 0.12]} scale={[0.06, 0.085, 0.06]} />
    </group>
  )
}

export function TicketMachines({ mode }: { mode: 'default' | 'face' | 'ticket' | 'dark' }) {
  const body = gloss(POP.pink)
  return (
    <group>
      {MACHINE_X.map((x, i) => {
        const screen = mode === 'dark' ? 'dark' : mode === 'face' && i === 1 ? 'face' : 'default'
        return (
          <group key={x} position={[x, 0, 0]}>
            <Box size={[0.74, 1.62, 0.5]} at={[0, 0.81, 0]} mat={body} />
            <Box size={[0.76, 0.24, 0.54]} at={[0, 1.74, 0]} mat={MAT.black} />
            <Print map={sign('TICKETS', '#141414', '#ffd21f', 256, 80)} w={0.7} h={0.2} at={[0, 1.74, 0.272]} lit />
            {/* the screen, leaning back a little, and the slots under it */}
            <Box size={[0.52, 0.42, 0.06]} at={[0, 1.3, 0.26]} rot={[-0.2, 0, 0]} mat={MAT.black} />
            <group position={[0, 1.3, 0.295]} rotation={[-0.2, 0, 0]}>
              <Print map={screenTexture(screen)} w={0.44} h={0.33} lit={screen !== 'dark'} />
            </group>
            <Box size={[0.14, 0.12, 0.06]} at={[-0.15, 0.98, 0.27]} mat={MAT.black} />
            <Box size={[0.06, 0.03, 0.01]} at={[-0.15, 1.0, 0.302]} mat={glow('#2aff6a')} />
            <Box size={[0.18, 0.04, 0.03]} at={[0.12, 0.92, 0.26]} mat={MAT.chrome} />
            <Box size={[0.5, 0.14, 0.05]} at={[0, 0.5, 0.25]} mat={MAT.black} />
            {mode === 'ticket' && i === 2 && <LongTicket />}
          </group>
        )
      })}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Lost property: a window with shelves of other people's things, 3.2 m wide
// ---------------------------------------------------------------------------

const LOST = { depth: 0.6, sill: 0.95, top: 2.45, half: 1.3 }

const UMBRELLA_COLOURS = [POP.red, POP.blue, POP.yellow, POP.green, POP.pink, POP.violet, POP.cyan, POP.orange, '#141414']
const crammed = once(() => {
  const rng = mulberry32(64)
  return UMBRELLA_COLOURS.map(() =>
    Array.from({ length: 3 }, (): Placement => ({
      at: [(rng() - 0.5) * 2.3, LOST.sill + 0.45 + rng() * 0.6, 0.18 + rng() * 0.24],
      rot: [(rng() - 0.5) * 0.4, rng() * PI, (rng() - 0.5) * 1.2],
    })),
  )
})
/** A closed umbrella: a long thin cone, point down. */
const FURLED = lathe([[0, 0], [0.04, 0.12], [0.055, 0.55], [0.02, 0.7], [0, 0.7]], 10).translate(0, -0.35, 0)

function Teddy() {
  const fur = matte('#a8723a')
  const pale = matte('#e8c89a')
  return (
    <group position={[0, LOST.sill, 0.3]}>
      <Ball r={[0.5, 0.45, 0.24]} at={[0, 0.45, 0]} mat={fur} />
      <Ball r={[0.36, 0.33, 0.22]} at={[0, 1.08, 0.02]} mat={fur} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ball r={0.12} at={[s * 0.28, 1.36, 0]} mat={fur} />
          <Ball r={0.06} at={[s * 0.28, 1.36, 0.08]} mat={pale} />
          <Ball r={0.04} at={[s * 0.12, 1.14, 0.2]} mat={MAT.black} />
          <Ball r={[0.14, 0.3, 0.14]} at={[s * 0.5, 0.55, 0.05]} rot={[0, 0, s * 0.7]} mat={fur} />
          <Ball r={[0.16, 0.12, 0.16]} at={[s * 0.3, 0.06, 0.14]} mat={fur} />
        </group>
      ))}
      <Ball r={[0.14, 0.1, 0.08]} at={[0, 0.98, 0.2]} mat={pale} />
      <Ball r={0.035} at={[0, 1.01, 0.28]} mat={MAT.black} />
      <Ball r={[0.3, 0.3, 0.1]} at={[0, 0.45, 0.17]} mat={pale} />
    </group>
  )
}

function DivingHelmet() {
  return (
    <group position={[0.2, LOST.sill + 0.04, 0.3]} scale={0.75}>
      <Ball r={0.3} at={[0, 0.36, 0]} mat={MAT.brass} />
      <Cyl r={0.33} h={0.12} at={[0, 0.06, 0]} mat={MAT.brass} />
      {[
        [0, 0.36, 0.29, 0],
        [0.29, 0.36, 0, PI / 2],
        [-0.29, 0.36, 0, -PI / 2],
      ].map(([x, y, z, yaw], k) => (
        <group key={k} position={[x, y, z]} rotation={[0, yaw, 0]}>
          <Cyl r={k === 0 ? 0.13 : 0.09} h={0.05} rot={[PI / 2, 0, 0]} mat={metal('#b08a3a')} />
          <Cyl r={k === 0 ? 0.105 : 0.07} h={0.052} rot={[PI / 2, 0, 0]} mat={MAT.darkGlass} />
        </group>
      ))}
    </group>
  )
}

export function LostProperty({ mode }: { mode: 'default' | 'umbrellas' | 'teddy' | 'helmet' }) {
  const red = gloss(POP.red)
  const { depth, sill, top, half } = LOST
  return (
    <group>
      <Box size={[3.2, sill, depth]} at={[0, sill / 2, depth / 2]} mat={red} />
      <Box size={[3.2, 3.2 - top, depth]} at={[0, (top + 3.2) / 2, depth / 2]} mat={red} />
      {[-1, 1].map((s) => (
        <Box key={s} size={[1.6 - half, top - sill, depth]} at={[s * (half + (1.6 - half) / 2), (sill + top) / 2, depth / 2]} mat={red} />
      ))}
      <Box size={[half * 2, top - sill, 0.04]} at={[0, (sill + top) / 2, 0.04]} mat={matte('#efe2c0')} />
      <Box size={[half * 2, 0.03, depth - 0.06]} at={[0, sill + 0.7, depth / 2]} mat={MAT.paleWood} />
      <Box size={[half * 2, 0.04, depth]} at={[0, sill + 0.02, depth / 2]} mat={MAT.paleWood} />
      <Box size={[half * 2, top - sill, 0.01]} at={[0, (sill + top) / 2, depth - 0.02]} mat={MAT.glass} shadow={false} />
      <Box size={[2.9, 0.42, 0.06]} at={[0, 2.82, depth + 0.03]} mat={MAT.white} />
      <Print map={sign('LOST PROPERTY', '#ffffff', '#ff3131', 768, 112)} w={2.84} h={0.4} at={[0, 2.82, depth + 0.062]} />
      <group>
        {mode === 'default' && (
          <>
            {/* a bowler hat, a glove, a pink umbrella, one wellington boot */}
            <Cyl r={0.13} h={0.12} at={[-0.8, sill + 0.79, 0.3]} mat={MAT.black} />
            <Cyl r={0.2} h={0.015} at={[-0.8, sill + 0.73, 0.3]} mat={MAT.black} />
            <Box size={[0.18, 0.03, 0.1]} at={[-0.3, sill + 0.73, 0.32]} rot={[0, 0.4, 0]} mat={matte(POP.yellow)} />
            <group position={[0.4, sill + 0.12, 0.32]} rotation={[0, 0, PI / 2 - 0.1]}>
              <mesh geometry={FURLED} material={gloss(POP.pink)} castShadow />
            </group>
            <Box size={[0.12, 0.34, 0.14]} at={[0.9, sill + 0.21, 0.3]} mat={gloss(POP.green)} />
            <Box size={[0.13, 0.08, 0.26]} at={[0.9, sill + 0.08, 0.36]} mat={gloss(POP.green)} />
          </>
        )}
        {mode === 'umbrellas' &&
          crammed().map((items, k) => <Instanced key={k} geometry={FURLED} material={gloss(UMBRELLA_COLOURS[k])} items={items} />)}
        {mode === 'teddy' && <Teddy />}
        {mode === 'helmet' && <DivingHelmet />}
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Cash machine, map and poster
// ---------------------------------------------------------------------------

export function Atm({ money = false }: { money?: boolean }) {
  return (
    <group>
      <Box size={[0.95, 1.5, 0.3]} at={[0, 1.15, 0.15]} mat={matte('#3a4a5a')} />
      <Box size={[0.95, 0.24, 0.32]} at={[0, 2.02, 0.16]} mat={gloss(POP.green)} />
      <Print map={sign('CASH', '#22b56a', '#ffffff', 256, 64)} w={0.9} h={0.22} at={[0, 2.02, 0.322]} lit />
      <Box size={[0.42, 0.32, 0.02]} at={[0, 1.5, 0.31]} mat={MAT.black} />
      <Print map={sign('WELCOME\nINSERT CARD', '#1f6bff', '#ffffff', 256, 192)} w={0.38} h={0.28} at={[0, 1.5, 0.322]} lit />
      <Box size={[0.4, 0.05, 0.2]} at={[0, 1.22, 0.38]} rot={[0.3, 0, 0]} mat={MAT.steel} />
      <Box size={[0.3, 0.025, 0.02]} at={[0, 0.98, 0.31]} mat={MAT.black} />
      {money &&
        // a fan of notes, spilling out of the slot and curling down
        [-0.12, -0.06, 0, 0.06, 0.12].map((x, k) => (
          <Box key={x} size={[0.15, 0.004, 0.24]} at={[x * 0.8, 0.95, 0.42]} rot={[0.35 + (k % 2) * 0.12, x * 4, 0]} mat={matte(k % 2 ? '#8a4dff' : '#2fbf71')} shadow={false} />
        ))}
    </group>
  )
}

export function MapBoard({ moved = false }: { moved?: boolean }) {
  return (
    <group>
      <Box size={[2.34, 1.64, 0.06]} at={[0, 0, 0.03]} mat={MAT.black} />
      <Print map={mapTexture(moved ? 'moved' : 'default')} w={2.2} h={1.5} at={[0, 0, 0.062]} />
    </group>
  )
}

export function Poster({ mode }: { mode: 'default' | 'shark' | 'rain' }) {
  return (
    <group>
      <Box size={[2.54, 1.74, 0.06]} at={[0, 0, 0.03]} mat={gloss(POP.ink)} />
      <Print map={posterTexture(mode)} w={2.4} h={1.6} at={[0, 0, 0.062]} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// The help point, strapped to a lamp standard (whose axis is at the origin)
// ---------------------------------------------------------------------------

export function HelpPoint({ phone = false }: { phone?: boolean }) {
  const handset = gloss('#141414')
  return (
    <group position={[0, 0, 0.27]}>
      <Box size={[0.36, 0.64, 0.12]} at={[0, 1.25, 0]} mat={gloss(POP.yellow)} />
      <Print map={sign('HELP\nPOINT', '#ffd21f', '#141414', 192, 128)} w={0.3} h={0.2} at={[0, 1.44, 0.062]} />
      <Cyl r={0.05} h={0.03} at={[-0.07, 1.22, 0.065]} rot={[PI / 2, 0, 0]} mat={glow('#ff2a2a')} />
      <Cyl r={0.05} h={0.03} at={[0.07, 1.22, 0.065]} rot={[PI / 2, 0, 0]} mat={glow('#2a8aff')} />
      {[0, 1, 2].map((k) => (
        <Box key={k} size={[0.2, 0.015, 0.01]} at={[0, 1.06 + k * 0.03, 0.062]} mat={MAT.black} />
      ))}
      {/* the hook on the side, and the handset: on it, or hanging by its cord */}
      <Box size={[0.04, 0.08, 0.06]} at={[0.2, 1.3, 0]} mat={MAT.black} />
      {phone ? (
        <>
          {Array.from({ length: 9 }, (_, k) => (
            <mesh key={k} geometry={BALL} material={handset} position={[0.21 + Math.sin(k * 1.9) * 0.02, 1.2 - k * 0.07, 0.03 + Math.cos(k * 1.9) * 0.02]} scale={0.018} />
          ))}
          <Box size={[0.06, 0.24, 0.06]} at={[0.22, 0.48, 0.05]} rot={[0.3, 0, 0.1]} mat={handset} />
        </>
      ) : (
        <Box size={[0.06, 0.24, 0.06]} at={[0.24, 1.32, 0.0]} mat={handset} />
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The round information desk, with its sign on a pole
// ---------------------------------------------------------------------------


const BELL = lathe([[0, 0], [0.4, 0], [0.4, 0.03], [0.32, 0.08], [0.3, 0.2], [0.2, 0.32], [0.05, 0.36], [0.05, 0.44], [0.09, 0.47], [0, 0.5]], 32)

export function InfoDesk({ mode }: { mode: 'default' | 'question' | 'bell' }) {
  const blue = gloss(POP.blue)
  const face = sign(mode === 'question' ? '?' : 'i', '#1f6bff', '#ffffff', 256, 256)
  return (
    <group>
      <Cyl r={DESK.r} h={1.0} at={[0, 0.5, 0]} mat={MAT.white} />
      <Cyl r={DESK.r + 0.005} h={0.16} at={[0, 0.78, 0]} mat={blue} />
      <Cyl r={DESK.r + 0.07} h={0.06} at={[0, 1.03, 0]} mat={blue} />
      {/* a monitor, a rack of leaflets, a little bell */}
      <Box size={[0.5, 0.34, 0.04]} at={[0.45, 1.3, -0.35]} rot={[0, -0.6, 0]} mat={MAT.black} />
      <Box size={[0.06, 0.12, 0.06]} at={[0.43, 1.1, -0.38]} mat={MAT.black} />
      <Box size={[0.5, 0.3, 0.12]} at={[-0.1, 1.2, -0.8]} rot={[-0.2, 0.2, 0]} mat={MAT.steel} />
      {[POP.yellow, POP.pink, POP.green].map((c, k) => (
        <Box key={c} size={[0.13, 0.2, 0.02]} at={[-0.25 + k * 0.15, 1.28, -0.76]} rot={[-0.2, 0.2, 0]} mat={matte(c)} />
      ))}
      {mode === 'bell' ? (
        <mesh geometry={BELL} material={MAT.brass} position={[0.35, DESK.top, 0.55]} scale={1.1} castShadow />
      ) : (
        <mesh geometry={BELL} material={MAT.brass} position={[0.55, DESK.top, 0.75]} scale={0.14} castShadow />
      )}
      {/* the sign: an i on every side of a cube, high on a pole */}
      <Rod a={[0, DESK.top, 0]} b={[0, 3.2, 0]} r={0.05} mat={MAT.steel} />
      <Box size={[0.7, 0.7, 0.7]} at={[0, 3.5, 0]} mat={blue} />
      {[0, PI / 2, PI, -PI / 2].map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <Print map={face} w={0.66} h={0.66} at={[0, 3.5, 0.352]} lit />
        </group>
      ))}
    </group>
  )
}

const CUP = lathe([[0, 0], [0.042, 0], [0.055, 0.16], [0, 0.16]], 18)
const SLEEVE = lathe([[0.047, 0], [0.053, 0.06]], 18)
const LID = lathe([[0, 0], [0.058, 0], [0.058, 0.012], [0.045, 0.025], [0, 0.03]], 18)

/** A takeaway coffee with a sleeve and a lid. */
export function TakeawayCup() {
  return (
    <group>
      <mesh geometry={CUP} material={MAT.white} castShadow />
      <mesh geometry={SLEEVE} material={matte('#a0662f')} position={[0, 0.05, 0]} />
      <mesh geometry={LID} material={gloss(POP.red)} position={[0, 0.158, 0]} />
    </group>
  )
}
