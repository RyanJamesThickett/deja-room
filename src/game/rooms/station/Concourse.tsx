import { BufferGeometry, CapsuleGeometry, CatmullRomCurve3, ConeGeometry, DoubleSide, Float32BufferAttribute, MeshStandardMaterial, TorusGeometry, TubeGeometry, Vector3 } from 'three'
import { Instanced, PI, type Placement } from '../../kit'
import type { Vec3 } from '../../mutations'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { FacesYou } from '../living/oddities'
import { Builder } from '../market/build'
import { Watching } from '../market/Watching'
import { BALL, BALL_LOW, BOX, CYL, glow, gloss, lathe, MAT, matte, metal, POP } from './parts'
import { Ball, Box, Cyl, Print, Rod, Soft } from './Prims'
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

/** A turned leg under the keys, and a shorter one for the stool. */
const PIANO_LEG = lathe([[0, 0], [0.045, 0], [0.05, 0.04], [0.034, 0.1], [0.04, 0.3], [0.052, 0.42], [0.036, 0.52], [0.048, 0.58], [0.048, 0.62], [0, 0.62]], 16)
const STOOL_LEG = lathe([[0, 0], [0.02, 0], [0.025, 0.03], [0.017, 0.07], [0.023, 0.3], [0.03, 0.38], [0.03, 0.44], [0, 0.44]], 12)

export function Piano({ mode }: { mode: 'default' | 'open' | 'keys' | 'music' }) {
  const red = gloss(POP.red)
  const lid = <Soft size={[1.58, 0.05, 0.48]} r={0.02} at={[0, 0, 0.23]} mat={red} paint />
  return (
    <group>
      {/* the case, up on castors, with a rounded moulding along the top of the front */}
      <Soft size={[1.5, 1.25, 0.4]} r={0.03} at={[0, 0.68, -0.1]} mat={red} paint />
      <Rod a={[-0.74, 1.27, 0.1]} b={[0.74, 1.27, 0.1]} r={0.028} mat={red} paint />
      {[-1, 1].flatMap((sx) => [-0.25, -0.05].map((z) => <Ball key={`${sx}${z}`} r={0.035} at={[sx * 0.66, 0.035, z]} mat={MAT.black} />))}
      {/* the keybed, the keys, the black fallboard behind them and the cheeks either side */}
      <Soft size={[1.5, 0.1, 0.3]} r={0.02} at={[0, 0.72, 0.25]} mat={red} paint />
      <Box size={[1.36, 0.014, 0.004]} at={[0, 0.705, 0.401]} mat={MAT.brass} shadow={false} />
      <Print map={keysTexture(mode === 'keys')} w={1.32} h={0.2} at={[0, 0.772, 0.25]} rot={[-PI / 2, 0, 0]} />
      <Box size={[1.42, 0.18, 0.04]} at={[0, 0.86, 0.12]} mat={MAT.black} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Soft size={[0.08, 0.24, 0.34]} r={0.035} at={[s * 0.71, 0.85, 0.25]} mat={red} paint />
          {/* turned legs on black toes, and pilasters up the front */}
          <mesh geometry={PIANO_LEG} material={red} position={[s * 0.68, 0.05, 0.35]} castShadow userData={{ paint: true }} />
          <Soft size={[0.1, 0.05, 0.42]} r={0.018} at={[s * 0.68, 0.025, 0.21]} mat={MAT.black} />
          <Soft size={[0.09, 0.3, 0.04]} r={0.015} at={[s * 0.69, 1.11, 0.11]} mat={red} paint />
          {/* a brass candle sconce on each */}
          <Cyl r={0.04} h={0.02} at={[s * 0.69, 1.1, 0.14]} rot={[PI / 2, 0, 0]} mat={MAT.brass} />
          <Cyl r={0.035} h={0.04} at={[s * 0.69, 1.08, 0.18]} mat={MAT.brass} />
        </group>
      ))}
      {/* the music desk, gold lining round the upper panel */}
      <Soft size={[0.9, 0.12, 0.04]} r={0.012} at={[0, 1.01, 0.13]} rot={[-0.15, 0, 0]} mat={MAT.black} />
      <Box size={[1.16, 0.018, 0.005]} at={[0, 1.215, 0.102]} mat={MAT.brass} shadow={false} />
      <Box size={[1.16, 0.018, 0.005]} at={[0, 1.085, 0.102]} mat={MAT.brass} shadow={false} />
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.018, 0.148, 0.005]} at={[s * 0.571, 1.15, 0.102]} mat={MAT.brass} shadow={false} />
      ))}
      {/* the lower panel, PLAY ME on it, and the pedals */}
      <Soft size={[1.18, 0.44, 0.03]} r={0.012} at={[0, 0.36, 0.1]} mat={red} paint />
      <Print map={sign('PLAY ME!', '#ffd21f', '#141414', 384, 96, 'rim')} w={0.8} h={0.2} at={[0, 0.38, 0.117]} />
      {[-0.1, 0, 0.1].map((x) => (
        <Soft key={x} size={[0.05, 0.022, 0.14]} r={0.009} at={[x, 0.08, 0.16]} mat={MAT.brass} />
      ))}
      {/* round the back: the posts and rail of the frame */}
      {[-0.55, 0, 0.55].map((x) => (
        <Soft key={x} size={[0.12, 1.1, 0.06]} r={0.02} at={[x, 0.66, -0.31]} mat={red} paint />
      ))}
      <Soft size={[1.4, 0.1, 0.05]} r={0.02} at={[0, 1.06, -0.315]} mat={red} paint />
      {mode === 'open' ? (
        <group position={[0, 1.325, -0.33]} rotation={[-1.15, 0, 0]}>
          {lid}
        </group>
      ) : (
        <group position={[0, 1.325, -0.33]}>{lid}</group>
      )}
      {mode === 'music' &&
        [-0.17, 0.17].map((x) => (
          <group key={x} position={[x, 1.25, 0.165]} rotation={[-0.15, 0, x * 0.3]}>
            <Print map={sign('♪ ♫\n♬ ♪', '#ffffff', '#141414', 160, 200)} w={0.3} h={0.38} />
          </group>
        ))}
    </group>
  )
}

export function PianoStool() {
  const ink = gloss(POP.ink)
  return (
    <group>
      {/* a buttoned red cushion on a black frame */}
      <Soft size={[0.72, 0.06, 0.36]} r={0.025} at={[0, 0.47, 0]} mat={ink} />
      <Soft size={[0.68, 0.06, 0.32]} r={0.03} at={[0, 0.515, 0]} mat={matte('#c8102e')} />
      {[-0.2, 0, 0.2].map((x) => (
        <Ball key={x} r={[0.012, 0.006, 0.012]} at={[x, 0.545, 0]} mat={MAT.brass} shadow={false} />
      ))}
      <Soft size={[0.64, 0.07, 0.28]} r={0.015} at={[0, 0.41, 0]} mat={ink} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={STOOL_LEG} material={ink} position={[sx * 0.3, 0, sz * 0.13]} castShadow />))}
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
      {[-0.85, 0, 0.85].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {/* cast ends (and a middle support): front leg, back leg up into the backrest, seat rail, arm */}
          <Soft size={[0.06, 0.44, 0.06]} r={0.015} at={[0, 0.22, 0.17]} mat={iron} />
          <Soft size={[0.06, 0.9, 0.06]} r={0.015} at={[0, 0.45, -0.2]} rot={[-0.12, 0, 0]} mat={iron} />
          <Soft size={[0.06, 0.05, 0.48]} r={0.015} at={[0, 0.41, -0.02]} mat={iron} />
          {x !== 0 && (
            <>
              <Soft size={[0.07, 0.04, 0.42]} r={0.018} at={[0, 0.64, 0.03]} mat={iron} />
              <Ball r={0.035} at={[0, 0.64, 0.24]} mat={iron} />
              <Soft size={[0.04, 0.2, 0.04]} r={0.012} at={[0, 0.53, 0.19]} mat={iron} />
              <Soft size={[0.1, 0.02, 0.1]} r={0.008} at={[0, 0.01, 0.17]} mat={iron} />
              <Soft size={[0.1, 0.02, 0.1]} r={0.008} at={[0, 0.01, -0.25]} mat={iron} />
            </>
          )}
        </group>
      ))}
      {[-0.17, -0.06, 0.05, 0.16].map((z) => (
        <Soft key={z} size={[1.9, 0.035, 0.09]} r={0.012} at={[0, SEAT_Y - 0.0175, z]} mat={MAT.paleWood} />
      ))}
      {[0.6, 0.73, 0.86].map((y) => (
        <Soft key={y} size={[1.9, 0.09, 0.03]} r={0.012} at={[0, y, -0.2 - (y - 0.45) * 0.12]} rot={[-0.12, 0, 0]} mat={MAT.paleWood} />
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
/** A tail curled right round a sleeping cat, an oval to follow its body. */
const CURLED_TAIL = new TorusGeometry(0.21, 0.03, 8, 32, PI * 1.2)
const GINGER = matte(POP.orange)
const TABBY = matte('#d0561a')
const WHITE_FUR = matte('#fff4e2')

/** Darker bands across the back, each just proud of an oval body `r` round, at these x. */
function Stripes({ r, xs }: { r: Vec3; xs: number[] }) {
  return (
    <>
      {xs.map((x) => (
        <Ball key={x} r={[0.025, r[1] * Math.sqrt(1 - (x / r[0]) ** 2) + 0.008, r[2] * Math.sqrt(1 - (x / r[0]) ** 2) + 0.008]} at={[x, 0, 0]} mat={TABBY} shadow={false} />
      ))}
    </>
  )
}

/** A cat's face looking along +z from the centre of its head: muzzle, nose, and eyes open (glowing) or shut. */
function CatFace({ open }: { open: boolean }) {
  return (
    <>
      <Ball r={[0.045, 0.032, 0.03]} at={[0, -0.025, 0.07]} mat={WHITE_FUR} shadow={false} />
      <Ball r={[0.014, 0.01, 0.01]} at={[0, -0.005, 0.098]} mat={matte(POP.pink)} shadow={false} />
      {[-1, 1].map((s) =>
        open ? (
          <group key={s}>
            <Ball r={0.024} at={[s * 0.04, 0.02, 0.07]} mat={glow('#ffe14a')} shadow={false} />
            <Box size={[0.008, 0.03, 0.01]} at={[s * 0.04, 0.02, 0.093]} mat={MAT.black} shadow={false} />
          </group>
        ) : (
          <Box key={s} size={[0.04, 0.008, 0.01]} at={[s * 0.04, 0.015, 0.081]} rot={[0, s * 0.45, -s * 0.2]} mat={MAT.black} shadow={false} />
        ),
      )}
    </>
  )
}

function CatHead({ open }: { open: boolean }) {
  return (
    <>
      <Ball r={[0.09, 0.08, 0.085]} mat={GINGER} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.052, 0.075, -0.005]} rotation={[0, 0, -s * 0.35]}>
          <mesh geometry={EAR} material={GINGER} rotation={[0, PI / 4, 0]} castShadow />
          <mesh geometry={EAR} material={matte(POP.pink)} position={[0, -0.004, 0.012]} rotation={[0, PI / 4, 0]} scale={[0.55, 0.75, 0.3]} />
        </group>
      ))}
      <CatFace open={open} />
    </>
  )
}

export function Cat({ awake = false }: { awake?: boolean }) {
  if (awake)
    return (
      <Watching>
        {/* sitting up: body, haunches, front legs, a white chest */}
        <group position={[0, 0.18, 0]}>
          <Ball r={[0.13, 0.19, 0.12]} mat={GINGER} />
          <group rotation={[0, 0, PI / 2]}>
            <Stripes r={[0.19, 0.13, 0.12]} xs={[-0.04, 0.05]} />
          </group>
        </group>
        <Ball r={[0.07, 0.1, 0.03]} at={[0, 0.2, 0.1]} mat={WHITE_FUR} shadow={false} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Ball r={[0.06, 0.07, 0.1]} at={[s * 0.09, 0.06, 0.0]} mat={GINGER} />
            <Rod a={[s * 0.045, 0.02, 0.1]} b={[s * 0.045, 0.22, 0.07]} r={0.026} mat={GINGER} />
            <Ball r={[0.032, 0.022, 0.045]} at={[s * 0.045, 0.02, 0.115]} mat={WHITE_FUR} />
          </group>
        ))}
        <group position={[0, 0.41, 0.03]}>
          <CatHead open />
        </group>
        <mesh geometry={TAIL} material={GINGER} position={[0, 0.03, -0.02]} rotation={[PI / 2, 0, PI + 0.6]} castShadow />
      </Watching>
    )
  return (
    // curled up asleep, nose to tail
    <group>
      <group position={[0, 0.09, 0]}>
        <Ball r={[0.22, 0.1, 0.15]} mat={GINGER} />
        <Stripes r={[0.22, 0.1, 0.15]} xs={[-0.14, -0.07, 0.0, 0.07]} />
      </group>
      <mesh geometry={CURLED_TAIL} material={GINGER} position={[0, 0.03, 0]} rotation={[PI / 2, 0, -0.2]} scale={[1.1, 0.78, 1]} castShadow />
      {/* paws tucked in under the chin */}
      {[0.06, 0.14].map((x) => (
        <Ball key={x} r={[0.045, 0.028, 0.035]} at={[x + 0.07, 0.03, 0.14]} mat={WHITE_FUR} />
      ))}
      <group position={[0.18, 0.1, 0.1]} rotation={[0.15, 0.9, 0.15]}>
        <CatHead open={false} />
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Luggage: a trolley (loaded, stacked sky-high, or empty), a suitcase, a rucksack
// ---------------------------------------------------------------------------

const CASE_COLOURS = [POP.blue, POP.red, POP.yellow, POP.green, POP.pink, POP.violet, POP.orange, POP.cyan, '#141414', POP.teal]
/** A carrying handle: a half hoop. */
const HANDLE = new TorusGeometry(0.06, 0.012, 6, 14, PI)

/** A suitcase lying flat, `size` across, with a handle on its long side (+z) and a strap round it. */
function FlatCase({ size, colour, at, turn = 0 }: { size: Vec3; colour: string; at: Vec3; turn?: number }) {
  const [w, h, d] = size
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <Soft size={size} r={Math.min(0.05, h * 0.3)} mat={gloss(colour)} />
      <Box size={[0.05, h + 0.008, d + 0.008]} at={[w * 0.22, 0, 0]} mat={MAT.black} shadow={false} />
      <Box size={[0.05, h + 0.008, d + 0.008]} at={[-w * 0.22, 0, 0]} mat={MAT.black} shadow={false} />
      <Rod a={[-0.07, 0, d / 2]} b={[-0.07, 0, d / 2 + 0.035]} r={0.012} mat={MAT.black} />
      <Rod a={[0.07, 0, d / 2]} b={[0.07, 0, d / 2 + 0.035]} r={0.012} mat={MAT.black} />
      <Rod a={[-0.08, 0, d / 2 + 0.035]} b={[0.08, 0, d / 2 + 0.035]} r={0.015} mat={MAT.black} />
    </group>
  )
}

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

const DUFFEL = new CapsuleGeometry(0.13, 0.3, 6, 16).rotateZ(PI / 2)

export function Trolley({ mode = 'empty' }: { mode?: 'default' | 'tower' | 'empty' }) {
  const chrome = MAT.chrome
  return (
    <group>
      {/* the deck, its rim, the toe plate at the front and the frame up to the push bar */}
      <Soft size={[0.62, 0.04, 0.95]} r={0.015} at={[0, 0.12, 0]} mat={MAT.steel} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod a={[s * 0.3, 0.145, -0.47]} b={[s * 0.3, 0.145, 0.47]} r={0.014} mat={chrome} />
          <Rod a={[s * 0.28, 0.12, -0.46]} b={[s * 0.28, 1.05, -0.56]} r={0.018} mat={chrome} />
          <Rod a={[s * 0.28, 0.12, 0.46]} b={[s * 0.28, 0.3, 0.46]} r={0.015} mat={chrome} />
          {/* grey plastic end caps where the push bar meets the frame */}
          <Ball r={0.028} at={[s * 0.3, 1.05, -0.56]} mat={MAT.black} />
        </group>
      ))}
      <Rod a={[-0.28, 0.3, 0.46]} b={[0.28, 0.3, 0.46]} r={0.015} mat={chrome} />
      <Rod a={[-0.3, 1.05, -0.56]} b={[0.3, 1.05, -0.56]} r={0.024} mat={gloss(POP.red)} />
      {[0.38, 0.6, 0.82].map((y) => (
        <Rod key={y} a={[-0.28, y, -0.46 - (y - 0.12) * 0.107]} b={[0.28, y, -0.46 - (y - 0.12) * 0.107]} r={0.012} mat={chrome} />
      ))}
      {/* wheels, each in a fork under the deck */}
      {[-1, 1].flatMap((sx) =>
        [-0.38, 0.38].map((z) => (
          <group key={`${sx}${z}`} position={[sx * 0.24, 0.06, z]}>
            <Cyl r={0.06} h={0.04} rot={[0, 0, PI / 2]} mat={MAT.rubber} />
            <Cyl r={0.03} h={0.044} rot={[0, 0, PI / 2]} mat={MAT.steel} shadow={false} />
            <Box size={[0.07, 0.05, 0.03]} at={[0, 0.045, 0]} mat={MAT.steel} />
          </group>
        )),
      )}
      {mode === 'default' && (
        <>
          <FlatCase size={[0.56, 0.24, 0.8]} colour={POP.blue} at={[0, 0.26, 0.0]} />
          <FlatCase size={[0.48, 0.2, 0.64]} colour={POP.yellow} at={[0, 0.48, -0.04]} turn={0.08} />
          {/* a green holdall on top, with its handles */}
          <mesh geometry={DUFFEL} material={matte(POP.green)} position={[0, 0.71, -0.1]} castShadow />
          {[-0.07, 0.07].map((x) => (
            <mesh key={x} geometry={HANDLE} material={MAT.black} position={[x, 0.82, -0.1]} rotation={[0, PI / 2, 0]} />
          ))}
        </>
      )}
      {mode === 'tower' && tower().map((p, k) => <FlatCase key={k} size={[p.w, p.h, p.d]} colour={p.colour} at={[0, p.y, -0.05]} turn={p.turn} />)}
    </group>
  )
}

export function Suitcase({ open = false }: { open?: boolean }) {
  const red = gloss(POP.red)
  if (open)
    return (
      <group>
        {/* the two shells, lined in cream, the clothes thrown all over */}
        {[0, 0.46].map((z) => (
          <group key={z} position={[0, 0.05, z]}>
            <Soft size={[0.64, 0.1, 0.42]} r={0.03} mat={red} paint />
            <Soft size={[0.58, 0.012, 0.36]} r={0.005} at={[0, 0.05, 0]} mat={matte('#f4ecd8')} shadow={false} />
          </group>
        ))}
        <mesh geometry={HANDLE} material={MAT.black} position={[0, 0.05, 0.67]} rotation={[PI / 2, 0, 0]} />
        <Soft size={[0.4, 0.04, 0.3]} r={0.015} at={[0.0, 0.12, 0.0]} rot={[0, 0.3, 0.06]} mat={matte(POP.yellow)} />
        <Soft size={[0.3, 0.05, 0.2]} r={0.02} at={[0.1, 0.16, 0.05]} rot={[0, -0.5, 0]} mat={matte(POP.cyan)} />
        <Soft size={[0.36, 0.03, 0.24]} r={0.012} at={[0.55, 0.015, 0.2]} rot={[0, 0.8, 0]} mat={matte(POP.pink)} />
        <Soft size={[0.18, 0.03, 0.08]} r={0.012} at={[-0.5, 0.015, 0.4]} rot={[0, 0.4, 0]} mat={matte(POP.green)} />
        <Soft size={[0.12, 0.03, 0.22]} r={0.012} at={[-0.45, 0.015, -0.1]} rot={[0, 1.2, 0]} mat={matte('#ffffff')} />
        <Ball r={[0.08, 0.03, 0.06]} at={[0.25, 0.115, 0.48]} mat={matte(POP.violet)} />
      </group>
    )
  return (
    <group>
      <Soft size={[0.44, 0.6, 0.26]} r={0.05} at={[0, 0.38, 0]} mat={red} paint />
      {/* ribs down the shell, a carry handle on top */}
      {[-0.1, 0.1].map((x) => (
        <Soft key={x} size={[0.05, 0.52, 0.275]} r={0.02} at={[x, 0.38, 0]} mat={red} paint />
      ))}
      <mesh geometry={HANDLE} material={MAT.black} position={[0, 0.68, 0.0]} />
      {/* the pull-out handle, up behind */}
      {[-0.1, 0.1].map((x) => (
        <Rod key={x} a={[x, 0.66, -0.1]} b={[x, 1.0, -0.1]} r={0.012} mat={MAT.steel} />
      ))}
      <Soft size={[0.26, 0.04, 0.04]} r={0.015} at={[0, 1.0, -0.1]} mat={MAT.black} />
      {/* spinner wheels */}
      {[-0.17, 0.17].flatMap((x) =>
        [-0.09, 0.09].map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <Box size={[0.04, 0.04, 0.05]} at={[0, 0.07, 0]} mat={MAT.black} />
            <Cyl r={0.035} h={0.03} at={[0, 0.035, 0]} rot={[0, 0, PI / 2]} mat={MAT.rubber} />
          </group>
        )),
      )}
    </group>
  )
}

export function Rucksack() {
  const blue = gloss(POP.blue)
  return (
    <group>
      {/* the bag, a front pocket and the flap over the top */}
      <Soft size={[0.34, 0.46, 0.2]} r={0.08} at={[0, 0.23, 0]} mat={blue} paint />
      <Soft size={[0.26, 0.18, 0.08]} r={0.035} at={[0, 0.13, 0.1]} mat={blue} paint />
      <Box size={[0.2, 0.012, 0.012]} at={[0, 0.2, 0.142]} mat={MAT.black} shadow={false} />
      <Soft size={[0.32, 0.06, 0.24]} r={0.025} at={[0, 0.45, 0.03]} rot={[0.15, 0, 0]} mat={blue} paint />
      {[-0.08, 0.08].map((x) => (
        <group key={x}>
          {/* buckle straps down the front, shoulder straps down the back */}
          <Box size={[0.035, 0.2, 0.012]} at={[x, 0.35, 0.104]} rot={[0.06, 0, 0]} mat={MAT.black} shadow={false} />
          <Soft size={[0.05, 0.04, 0.02]} r={0.006} at={[x, 0.26, 0.11]} mat={gloss(POP.yellow)} shadow={false} />
          <Soft size={[0.055, 0.38, 0.03]} r={0.012} at={[x, 0.25, -0.105]} mat={MAT.black} />
        </group>
      ))}
      <mesh geometry={HANDLE} material={MAT.black} position={[0, 0.47, -0.06]} scale={0.8} />
      {/* a water bottle in the side pocket */}
      <Cyl r={0.035} h={0.2} at={[0.18, 0.16, 0]} mat={gloss(POP.yellow)} />
      <Cyl r={0.02} h={0.03} at={[0.18, 0.275, 0]} mat={MAT.black} />
      <Soft size={[0.05, 0.12, 0.12]} r={0.02} at={[0.17, 0.08, 0]} mat={blue} paint />
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
      <group position={[0.6, 0.445, 0]} rotation={[PI - 0.25, 0, 0.1]}>
        <mesh geometry={CANOPY} material={cloth} castShadow userData={{ paint: true }} />
        {/* a tip on the end of each rib, and the ferrule on top */}
        {Array.from({ length: 8 }, (_, k) => (
          <Ball key={k} r={0.014} at={[Math.sin((k / 8) * PI * 2) * 0.5, 0, Math.cos((k / 8) * PI * 2) * 0.5]} mat={MAT.black} shadow={false} />
        ))}
        <Cyl r={0.012} h={0.08} at={[0, 0.33, 0]} mat={MAT.black} />
        <Rod a={[0, 0.3, 0]} b={[0, -0.45, 0]} r={0.008} mat={MAT.black} />
        <mesh geometry={HOOK} material={MAT.black} position={[0.045, -0.45, 0]} rotation={[0, 0, PI]} />
      </group>
    )
  return (
    // leaning to -x against whatever it's propped on
    <group rotation={[0, 0, 0.21]}>
      <Rod a={[0, 0, 0]} b={[0, 0.9, 0]} r={0.008} mat={MAT.black} />
      <mesh geometry={FURLED} material={cloth} position={[0, 0.1, 0]} castShadow userData={{ paint: true }} />
      <mesh geometry={HOOK} material={MAT.black} position={[0.045, 0.9, 0]} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// A clear-bag litter bin on a red hoop
// ---------------------------------------------------------------------------

/** The bag hangs from the hoop and folds over it. Seen from inside too, so both sides are drawn. */
const BAG = lathe([[0, 0.04], [0.22, 0.06], [0.27, 0.3], [0.27, 0.86], [0.29, 0.9], [0.315, 0.915], [0.322, 0.88], [0.318, 0.8]], 24)
const BAG_MAT = new MeshStandardMaterial({ color: '#cfe8d8', roughness: 0.2, transparent: true, opacity: 0.4, depthWrite: false, side: DoubleSide })
const HOOP = new TorusGeometry(0.3, 0.028, 10, 36)
/** Paper stuffed in over the brim when it's overflowing. */
const MOUND = { y: 0.9, r: 0.27, h: 0.13 }
const litter = once(() => {
  const rng = mulberry32(13)
  const colours = [POP.red, POP.yellow, '#ffffff', POP.blue, '#c49a64']
  const inBag = (y0: number, y1: number) => (): Placement => ({ at: [(rng() - 0.5) * 0.3, y0 + rng() * (y1 - y0), (rng() - 0.5) * 0.3], rot: [rng() * 3, rng() * 3, 0], scale: [0.07, 0.11, 0.07] })
  const inside = colours.map(() => Array.from({ length: 4 }, inBag(0.12, 0.52)))
  const full = colours.map(() => Array.from({ length: 4 }, inBag(0.5, 0.84)))
  const around = colours.map(() =>
    Array.from({ length: 5 }, (): Placement => {
      const a = rng() * PI * 2
      const r = 0.4 + rng() * 0.38
      return { at: [Math.cos(a) * r, 0.025, Math.sin(a) * r], rot: [PI / 2, rng() * 3, 0], scale: [0.05, 0.11, 0.05] }
    }),
  )
  // piled on the mound, each sitting on its surface
  const heap = colours.map(() =>
    Array.from({ length: 4 }, (): Placement => {
      const a = rng() * PI * 2
      const d = rng() * 0.22
      const y = MOUND.y + MOUND.h * Math.sqrt(1 - (d / MOUND.r) ** 2)
      return { at: [Math.cos(a) * d, y, Math.sin(a) * d], rot: [rng() * 3, rng() * 3, 0], scale: [0.08, 0.1, 0.08] }
    }),
  )
  return { colours, inside, full, around, heap }
})

export function Bin({ mode = 'default' }: { mode?: 'default' | 'overflow' | 'eyes' }) {
  const l = litter()
  const red = gloss(POP.red)
  return (
    <group>
      <Cyl r={0.3} h={0.03} at={[0, 0.015, 0]} mat={MAT.iron} />
      {/* the post up the back, a bracket to the hoop, the hoop the bag hangs from */}
      <Rod a={[0, 0.02, -0.36]} b={[0, 1.0, -0.36]} r={0.03} mat={red} />
      <Ball r={0.04} at={[0, 1.01, -0.36]} mat={red} />
      <Box size={[0.08, 0.06, 0.1]} at={[0, 0.9, -0.31]} mat={red} />
      <Box size={[0.3, 0.05, 0.06]} at={[0, 0.03, -0.33]} mat={MAT.iron} />
      <mesh geometry={HOOP} material={red} position={[0, 0.9, 0]} rotation={[PI / 2, 0, 0]} castShadow />
      <Box size={[0.2, 0.09, 0.012]} at={[0, 0.62, -0.395]} mat={MAT.white} />
      <Print map={sign('LITTER', '#ff3131', '#ffffff', 192, 64)} w={0.18} h={0.07} at={[0, 0.62, -0.402]} rot={[0, PI, 0]} />
      <mesh geometry={BAG} material={BAG_MAT} />
      {l.colours.map((c, k) => (
        <Instanced key={c} geometry={BOX} material={matte(c)} items={mode === 'overflow' ? [...l.inside[k], ...l.full[k], ...l.heap[k], ...l.around[k]] : l.inside[k]} />
      ))}
      {mode === 'overflow' && <Ball r={[MOUND.r, MOUND.h, MOUND.r]} at={[0, MOUND.y, 0]} mat={matte('#ece6d6')} />}
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
    // the body pitches forward to peck; wings and tail go with it, turned about the body's centre
    const pitch = pecking ? 0.35 : -0.15
    const c = Math.cos(pitch)
    const s = Math.sin(pitch)
    const onBody = (x: number, y: number, z: number): Vec3 => [x, 0.13 + (y - 0.13) * c - z * s, (y - 0.13) * s + z * c]
    const head: Vec3 = pecking ? [0, 0.1, 0.16] : [0, 0.24, 0.09]
    b.add(BALL, '#8890a2', [0, 0.13, 0], [pitch, 0, 0], [0.085, 0.08, 0.14])
    // a green and purple sheen on the breast and up the neck
    b.add(BALL, '#5f8578', [0, pecking ? 0.12 : 0.16, 0.07], [0, 0, 0], [0.066, 0.066, 0.062])
    b.add(BALL, '#5f8578', pecking ? [0, 0.11, 0.12] : [0, 0.2, 0.08], [pecking ? 1.2 : 0.2, 0, 0], [0.045, 0.06, 0.045])
    b.add(BALL, '#7a5d8c', pecking ? [0, 0.125, 0.105] : [0, 0.185, 0.095], [pecking ? 1.2 : 0.2, 0, 0], [0.047, 0.03, 0.047])
    // folded wings, paler, with the two dark bars across them
    for (const w of [-1, 1]) {
      b.add(BALL, '#9aa2b4', onBody(w * 0.058, 0.15, -0.03), [pitch, 0, w * 0.22], [0.03, 0.055, 0.12])
      for (const [y, z] of [
        [0.16, -0.01],
        [0.14, -0.05],
      ])
        b.add(BOX, '#2a2e38', onBody(w * 0.086, y, z), [pitch, 0, w * 0.22], [0.006, 0.012, 0.06])
    }
    b.add(BALL, '#5d6476', onBody(0, 0.14, -0.15), [pitch + (pecking ? 0.15 : -0.05), 0, 0], [0.05, 0.016, 0.1])
    b.add(BOX, '#2a2e38', onBody(0, 0.138, -0.235), [pitch + (pecking ? 0.15 : -0.05), 0, 0], [0.075, 0.014, 0.03])
    // head: beak with its white cere, orange eyes with black pupils
    b.add(BALL, '#7b8296', head, [0, 0, 0], [0.042, 0.045, 0.048])
    b.add(BOX, '#d9c27a', [head[0], head[1] - 0.008, head[2] + 0.055], [0.3, 0, 0], [0.012, 0.011, 0.04])
    b.add(BALL_LOW, '#f0ece0', [head[0], head[1] + 0.002, head[2] + 0.042], [0, 0, 0], [0.009, 0.007, 0.012])
    for (const e of [-1, 1]) {
      b.add(BALL_LOW, '#ff7a1a', [e * 0.03, head[1] + 0.01, head[2] + 0.018], [0, 0, 0], [0.011, 0.011, 0.011])
      b.add(BALL_LOW, '#111111', [e * 0.037, head[1] + 0.011, head[2] + 0.021], [0, 0, 0], [0.005, 0.005, 0.005])
    }
    // legs and three toes each
    for (const l of [-1, 1]) {
      b.add(BOX, '#e07a8a', [l * 0.03, 0.035, 0.01], [0, 0, 0], [0.012, 0.07, 0.012])
      for (const t of [-0.5, 0, 0.5]) b.add(BOX, '#e07a8a', [l * 0.03 + Math.sin(t) * 0.018, 0.004, 0.01 + Math.cos(t) * 0.018], [0, t, 0], [0.008, 0.008, 0.04])
    }
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
    // the leaf with s = 1 splays to -z, so its outside (where the picture goes) faces -z
    <group key={s} position={[0, 0.64, 0]} rotation={[s * spread, 0, 0]}>
      <Soft size={[0.32, 0.64, 0.022]} r={0.01} at={[0, -0.32, 0]} mat={yellow} />
      <Print map={face} w={0.28} h={0.42} at={[0, -0.3, -s * 0.0115]} rot={[0, s > 0 ? PI : 0, 0]} />
      {/* a handle slot at the top */}
      <Box size={[0.12, 0.03, 0.024]} at={[0, -0.06, 0]} mat={MAT.black} shadow={false} />
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

/** A mop head: a round of cotton strands, ridged all round, under a grey clamp. */
const MOP_HEAD = (() => {
  const g = lathe([[0, 0], [0.11, 0], [0.13, 0.03], [0.1, 0.16], [0.05, 0.21], [0, 0.22]], 36)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const k = 1 + 0.12 * Math.cos(14 * Math.atan2(x, z))
    pos.setX(i, x * k)
    pos.setZ(i, z * k)
  }
  g.computeVertexNormals()
  return g
})()
/** An open bucket: walls, a rolled rim, and an inside with a floor. */
const BUCKET = lathe([[0, 0], [0.18, 0], [0.22, 0.32], [0.235, 0.33], [0.232, 0.345], [0.215, 0.335], [0.178, 0.025], [0, 0.025]], 28)
const BUCKET_HANDLE = new TorusGeometry(0.235, 0.008, 6, 24, PI)
const WATER = new MeshStandardMaterial({ color: '#7fc8ff', roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false })

function Mop({ at, lean }: { at: [number, number, number]; lean: [number, number, number] }) {
  return (
    <group position={at} rotation={lean}>
      <mesh geometry={MOP_HEAD} material={matte('#e8e2d2')} castShadow />
      <Cyl r={0.035} h={0.06} at={[0, 0.22, 0]} mat={matte('#8a9098')} />
      <Rod a={[0, 0.2, 0]} b={[0, 1.35, 0]} r={0.014} mat={gloss(POP.blue)} />
      <Cyl r={0.02} h={0.1} at={[0, 1.36, 0]} mat={MAT.black} />
    </group>
  )
}

/** The yellow bucket, standing up (with water in it) or on its side, mouth to +x. */
function Bucket({ water }: { water: boolean }) {
  const yellow = gloss(POP.yellow)
  return (
    <group>
      <mesh geometry={BUCKET} material={yellow} castShadow receiveShadow />
      {water && <Cyl r={0.2} h={0.01} at={[0, 0.25, 0]} mat={WATER} shadow={false} />}
      {[-1, 1].map((s) => (
        <Ball key={s} r={0.018} at={[s * 0.228, 0.3, 0]} mat={MAT.black} shadow={false} />
      ))}
      <group position={[0, 0.3, 0]} rotation={[-1.1, 0, 0]}>
        <mesh geometry={BUCKET_HANDLE} material={MAT.steel} />
      </group>
    </group>
  )
}

export function CleanerCart({ mode }: { mode: 'default' | 'mop' | 'spill' }) {
  const yellow = gloss(POP.yellow)
  const grey = matte('#5a6068')
  return (
    <group>
      {/* the frame: a base, a shelf, four posts and the push bar */}
      <Soft size={[0.6, 0.05, 0.95]} r={0.02} at={[0, 0.14, -0.1]} mat={grey} />
      <Soft size={[0.6, 0.04, 0.5]} r={0.016} at={[0, 0.8, -0.32]} mat={grey} />
      {[-1, 1].flatMap((s) => [-0.55, -0.08].map((z) => <Rod key={`${s}${z}`} a={[s * 0.28, 0.14, z]} b={[s * 0.28, 1.0, z]} r={0.015} mat={grey} />))}
      <Rod a={[-0.3, 1.0, -0.55]} b={[0.3, 1.0, -0.55]} r={0.022} mat={yellow} />
      {[-1, 1].map((s) => (
        <Ball key={s} r={0.026} at={[s * 0.3, 1.0, -0.55]} mat={yellow} />
      ))}
      {/* a black sack hung under the shelf, its top gathered */}
      <Cyl r={0.2} h={0.6} at={[0, 0.47, -0.32]} mat={matte('#202020')} />
      <Ball r={[0.2, 0.06, 0.2]} at={[0, 0.17, -0.32]} mat={matte('#202020')} shadow={false} />
      {/* spray bottles up top */}
      {[POP.cyan, POP.pink, POP.green].map((c, k) => (
        <group key={c} position={[-0.18 + k * 0.17, 0.82, -0.32]}>
          <Soft size={[0.08, 0.18, 0.06]} r={0.025} at={[0, 0.09, 0]} mat={gloss(c)} />
          <Cyl r={0.018} h={0.04} at={[0, 0.2, 0]} mat={MAT.white} />
          <Soft size={[0.03, 0.05, 0.07]} r={0.008} at={[0, 0.23, 0.02]} mat={MAT.white} />
        </group>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-0.5, 0.3].map((z) => (
          <group key={`${sx}${z}`} position={[sx * 0.26, 0.05, z]}>
            <Cyl r={0.05} h={0.04} rot={[0, 0, PI / 2]} mat={MAT.rubber} />
            <Cyl r={0.022} h={0.045} rot={[0, 0, PI / 2]} mat={MAT.steel} shadow={false} />
            <Box size={[0.05, 0.07, 0.03]} at={[-sx * 0.005, 0.05, 0]} mat={grey} />
          </group>
        )),
      )}
      {mode === 'spill' ? (
        <>
          {/* tipped on its side, resting on its rim and its base, mouth towards the puddle */}
          <group position={[0.45, 0.22, 0.62]} rotation={[0, PI - 0.5, 0]}>
            <group rotation={[0, 0, PI / 2 - 0.165]}>
              <Bucket water={false} />
            </group>
          </group>
          <mesh geometry={CYL} material={WATER} position={[1.0, 0.004, 0.95]} scale={[0.6, 0.008, 0.45]} />
          <mesh geometry={CYL} material={WATER} position={[1.35, 0.005, 1.25]} rotation={[0, 0.6, 0]} scale={[0.35, 0.008, 0.25]} />
          <Mop at={[0.0, 0.15, 0.55]} lean={[PI / 2, 0.6, 0]} />
        </>
      ) : (
        <>
          <group position={[0, 0.165, 0.2]}>
            <Bucket water />
          </group>
          {/* the wringer clipped on the back of the bucket */}
          <Soft size={[0.3, 0.13, 0.12]} r={0.03} at={[0, 0.54, 0.04]} mat={grey} />
          <Rod a={[0.12, 0.6, 0.04]} b={[0.2, 0.85, -0.02]} r={0.012} mat={grey} />
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
const BRIM = new TorusGeometry(0.16, 0.018, 8, 32)
const CASE_HANDLE = new TorusGeometry(0.05, 0.014, 6, 14, PI)
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
      {/* the collar turned up, and a row of buttons */}
      <mesh geometry={BRIM} material={b} position={[0, 1.46, 0]} rotation={[PI / 2, 0, 0]} scale={[0.95, 0.7, 2.2]} />
      {[0.8, 0.98, 1.16].map((y) => (
        <Ball key={y} r={0.022} at={[0, y, 0.148]} mat={b} />
      ))}
      <Cyl r={0.05} h={0.12} at={[0, 1.52, 0]} mat={b} />
      <group position={[0, 1.64, 0.02]} rotation={[0.35, 0.3, 0]}>
        <Ball r={[0.1, 0.12, 0.11]} mat={b} />
        <Ball r={[0.03, 0.035, 0.03]} at={[0, -0.01, 0.105]} mat={b} />
        {/* a bowler hat: a curled brim and a domed crown */}
        <Cyl r={0.16} h={0.02} at={[0, 0.08, 0]} mat={b} />
        <mesh geometry={BRIM} material={b} position={[0, 0.085, 0]} rotation={[PI / 2, 0, 0]} />
        <Ball r={[0.105, 0.1, 0.105]} at={[0, 0.08, 0]} mat={b} />
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
      <Ball r={0.05} at={[0.28, 0.93, 0.03]} mat={b} />
      <mesh geometry={CASE_HANDLE} material={b} position={[0.3, 0.88, 0.03]} rotation={[0, PI / 2, 0]} />
      <Soft size={[0.08, 0.3, 0.38]} r={0.025} at={[0.3, 0.73, 0.03]} mat={b} />
    </group>
  )
}

export function Statue({ mode }: { mode: 'default' | 'watch' | 'umbrella' | 'pigeon' }) {
  return (
    <group>
      <Soft size={[1.1, 0.9, 1.1]} r={0.03} at={[0, 0.45, 0]} mat={MAT.stone} />
      <Soft size={[1.2, 0.08, 1.2]} r={0.025} at={[0, 0.94, 0]} mat={MAT.stone} />
      <Soft size={[1.2, 0.1, 1.2]} r={0.03} at={[0, 0.05, 0]} mat={MAT.stone} />
      <Soft size={[1.15, 0.05, 1.15]} r={0.02} at={[0, 0.12, 0]} mat={MAT.stone} />
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

/** Each tier: radius at its hem, its height, where its hem is, and how many ridges it has. */
const TIERS: [number, number, number, number][] = [
  [1.7, 2.0, 0.9, 10],
  [1.35, 1.8, 2.1, 9],
  [1.0, 1.6, 3.2, 8],
  [0.6, 1.3, 4.3, 6],
]
export const TREE_TOP = 5.6
/** How far the ridges stand out past the troughs, as a share of the radius. */
const FLUTE = 0.12
/** How far the tips of the hem droop below the troughs. */
const DROOP = 0.16
/** The upright band round the hem, so the edge has some thickness. */
const LIP = 0.06

/** Bends a point of a plain round tier into the ridged, scalloped one: `rho` out from the trunk, `a` round it. */
function flute(r: number, n: number, rho: number, y: number, a: number): Vec3 {
  const c = Math.cos(n * a)
  const s = rho * (1 + FLUTE * c)
  return [Math.sin(a) * s, y - DROOP * (rho / r) ** 3 * (1 + c) * 0.5, Math.cos(a) * s]
}

/** Height of the outside of a tier, `t` of the way from the hem (0) to the tip (1): flared at the hem like a skirt. */
const slope = (h: number, t: number) => LIP + (h - LIP) * (0.55 * t + 0.45 * t * t)

/**
 * One tier: a ridged cone with a scalloped hem and a closed, dished
 * underside up to the trunk, so it's solid from every side (from below too).
 */
function tierGeometry(r: number, h: number, n: number) {
  const under = h * 0.3
  const profile: [number, number][] = [
    [0, under],
    [0.14, under],
    [r * 0.45, under * 0.62],
    [r * 0.8, under * 0.2],
    [r, 0],
    // doubled points keep a crisp edge round the hem
    [r, 0],
    [r, LIP],
    [r, LIP],
  ]
  for (let k = 1; k <= 10; k++) profile.push([r * (1 - k / 10), slope(h, k / 10)])
  const segments = n * 6
  const g = lathe(profile, segments)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setXYZ(i, ...flute(r, n, Math.hypot(x, z), pos.getY(i), Math.atan2(x, z)))
  }
  g.computeVertexNormals()
  // the lathe's first and last columns are the same seam: share their normals so it doesn't show
  const nor = g.attributes.normal
  const rows = profile.length
  const v = new Vector3()
  for (let j = 0; j < rows; j++) {
    const b = segments * rows + j
    v.set(nor.getX(j) + nor.getX(b), nor.getY(j) + nor.getY(b), nor.getZ(j) + nor.getZ(b)).normalize()
    nor.setXYZ(j, v.x, v.y, v.z)
    nor.setXYZ(b, v.x, v.y, v.z)
  }
  return g
}

const TIER_GEOMETRY = TIERS.map(([r, h, , n]) => tierGeometry(r, h, n))

/** A point on the outside of tier `k`, `t` up it and `a` round it, `lift` out from the surface. */
function onTier(k: number, t: number, a: number, lift: number): Vec3 {
  const [r, h, y0, n] = TIERS[k]
  const [x, y, z] = flute(r, n, r * (1 - t), slope(h, t), a)
  const out = Math.hypot(x, z) || 1
  return [x + (x / out) * lift, y0 + y + lift * 0.4, z + (z / out) * lift]
}

/** A fat five-pointed star, raised to a point on both faces so it has a body from the side. */
const STAR = (() => {
  const ring = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 ? 0.13 : 0.3
    const a = (k / 10) * PI * 2 + PI / 2
    return [Math.cos(a) * r, Math.sin(a) * r, 0]
  })
  const pos: number[] = []
  for (let k = 0; k < 10; k++) {
    const p = ring[k]
    const q = ring[(k + 1) % 10]
    pos.push(0, 0, 0.11, ...p, ...q)
    pos.push(0, 0, -0.11, ...q, ...p)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
})()

const BAUBLE_COLOURS = [POP.red, POP.blue, POP.pink, '#f3f1ea']

/** Tinsel looped round each tier, dipping between the ridges. */
const garlands = once(() =>
  TIERS.map(([, , , n], k) => {
    const pts: Vector3[] = []
    const steps = n * 8
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * PI * 2
      pts.push(new Vector3(...onTier(k, 0.42 + 0.05 * Math.cos(n * a), a, 0.025)))
    }
    return new TubeGeometry(new CatmullRomCurve3(pts, true), steps * 2, 0.032, 6, true)
  }),
)

const decorations = once(() => {
  const rng = mulberry32(25)
  const baubles: Placement[][] = BAUBLE_COLOURS.map(() => [])
  const caps: Placement[] = []
  const lights: Placement[] = []
  let c = 0
  const bauble = (at: Vec3, rb: number) => {
    baubles[c++ % baubles.length].push({ at, scale: [rb, rb, rb] })
    caps.push({ at: [at[0], at[1] + rb * 0.95, at[2]], scale: [rb * 0.32, rb * 0.35, rb * 0.32] })
  }
  TIERS.forEach(([r, , y0, n], k) => {
    const rb = k < 2 ? 0.1 : 0.085
    const tip = r * (1 + FLUTE) - 0.03
    for (let m = 0; m < n; m++) {
      const a = (m / n) * PI * 2
      // one hanging under the tip of every other ridge, one sitting up each of the others
      if (m % 2 === 0) bauble([Math.sin(a) * tip, y0 - DROOP - rb * 0.85, Math.cos(a) * tip], rb)
      else bauble(onTier(k, 0.22 + (m % 3) * 0.12, a, rb * 0.72), rb * 0.9)
    }
    for (let i = 0; i < Math.round(r * 18); i++) lights.push({ at: onTier(k, 0.06 + rng() * 0.82, rng() * PI * 2, 0.012), scale: [0.032, 0.032, 0.032] })
  })
  return { baubles, caps, lights }
})

function ChristmasTree({ bare = false }: { bare?: boolean }) {
  const green = matte('#1d8a4c')
  const d = decorations()
  return (
    <group>
      {/* the pot with a rim and a top of earth, and the trunk up through the tiers */}
      <Cyl r={0.6} h={0.56} at={[0, 0.28, 0]} mat={gloss(POP.red)} />
      <Cyl r={0.64} h={0.1} at={[0, 0.6, 0]} mat={gloss(POP.yellow)} />
      <Cyl r={0.56} h={0.02} at={[0, 0.655, 0]} mat={matte('#3b2416')} shadow={false} />
      {[0.14, 0.42].map((y) => (
        <Cyl key={y} r={0.605} h={0.05} at={[0, y, 0]} mat={MAT.white} shadow={false} />
      ))}
      <Cyl r={0.13} h={4.0} at={[0, 2.6, 0]} mat={MAT.darkWood} />
      {TIERS.map(([, , y0], k) => (
        // the branches are what a recolour paints: a pink tree is hard to miss
        <mesh key={k} geometry={TIER_GEOMETRY[k]} material={green} position={[0, y0, 0]} castShadow receiveShadow userData={{ paint: true }} />
      ))}
      {!bare && (
        <>
          {garlands().map((g, k) => (
            <mesh key={k} geometry={g} material={gloss(POP.yellow)} castShadow />
          ))}
          {BAUBLE_COLOURS.map((c, k) => (
            <Instanced key={c} geometry={BALL} material={gloss(c)} items={d.baubles[k]} castShadow />
          ))}
          <Instanced geometry={CYL} material={MAT.brass} items={d.caps} />
          <Instanced geometry={BALL_LOW} material={glow('#fff2b0')} items={d.lights} />
          <Ball r={0.07} at={[0, TREE_TOP + 0.02, 0]} mat={MAT.brass} />
          <mesh geometry={STAR} material={glow(POP.yellow)} position={[0, TREE_TOP + 0.24, 0]} castShadow />
        </>
      )}
    </group>
  )
}

const BOW_LOOP = new TorusGeometry(0.17, 0.045, 10, 28)

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
  const ribbon = gloss(POP.yellow)
  return (
    <group>
      <ChristmasTree bare={mode === 'bare'} />
      {mode === 'present' && (
        <group position={[2.35, 0, 1.6]} rotation={[0, 0.4, 0]}>
          <Box size={[1.2, 0.86, 1.2]} at={[0, 0.43, 0]} mat={gloss(POP.pink)} />
          {/* the lid, standing proud of the box, and the ribbon round both */}
          <Box size={[1.28, 0.2, 1.28]} at={[0, 0.94, 0]} mat={gloss(POP.pink)} />
          <Box size={[1.22, 0.861, 0.18]} at={[0, 0.43, 0]} mat={ribbon} />
          <Box size={[0.18, 0.861, 1.22]} at={[0, 0.43, 0]} mat={ribbon} />
          <Box size={[1.3, 0.202, 0.18]} at={[0, 0.94, 0]} mat={ribbon} />
          <Box size={[0.18, 0.202, 1.3]} at={[0, 0.94, 0]} mat={ribbon} />
          {/* the bow: two loops, a knot and two tails */}
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh geometry={BOW_LOOP} material={ribbon} position={[s * 0.17, 1.2, 0]} rotation={[0, 0, s * 0.45]} scale={[1, 0.8, 1]} castShadow />
              <Box size={[0.13, 0.02, 0.34]} at={[s * 0.1, 1.05, s * 0.12]} rot={[0, s * 0.5, 0]} mat={ribbon} />
            </group>
          ))}
          <Ball r={[0.09, 0.08, 0.09]} at={[0, 1.1, 0]} mat={ribbon} />
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
  // leaning over towards -z onto its kickstand: the stand's foot is lifted to meet the floor
  return (
    <group rotation={[-0.12, 0, 0]}>
      {/* the deck, with grip tape, and the rear mudguard that doubles as the brake */}
      <Soft size={[0.8, 0.05, 0.15]} r={0.02} at={[0, 0.12, 0]} mat={green} paint />
      <Box size={[0.62, 0.006, 0.12]} at={[-0.04, 0.147, 0]} mat={matte('#2a2a2a')} shadow={false} />
      <Soft size={[0.2, 0.02, 0.07]} r={0.008} at={[-0.43, 0.205, 0]} rot={[0, 0, -0.25]} mat={MAT.black} />
      {[-0.4, 0.4].map((x) => (
        <group key={x} position={[x, 0.1, 0]}>
          <Cyl r={0.1} h={0.045} rot={[PI / 2, 0, 0]} mat={MAT.rubber} />
          <Cyl r={0.055} h={0.05} rot={[PI / 2, 0, 0]} mat={gloss(POP.yellow)} shadow={false} />
        </group>
      ))}
      {/* the fork and stem, a collar, the T-bar with grips */}
      {[-1, 1].map((s) => (
        <Rod key={s} a={[0.4, 0.1, s * 0.035]} b={[0.37, 0.32, s * 0.02]} r={0.012} mat={MAT.steel} />
      ))}
      <Rod a={[0.37, 0.3, 0]} b={[0.32, 1.0, 0]} r={0.022} mat={green} paint />
      <Cyl r={0.032} h={0.06} at={[0.35, 0.6, 0]} rot={[0, 0, 0.07]} mat={MAT.black} />
      <Rod a={[0.32, 1.0, -0.25]} b={[0.32, 1.0, 0.25]} r={0.018} mat={MAT.steel} />
      {[-1, 1].map((s) => (
        <Cyl key={s} r={0.026} h={0.1} at={[0.32, 1.0, s * 0.22]} rot={[PI / 2, 0, 0]} mat={MAT.black} />
      ))}
      {/* the kickstand, out to the -z side, its foot on the floor */}
      <Rod a={[-0.2, 0.1, -0.06]} b={[-0.26, 0.017, -0.14]} r={0.01} mat={MAT.steel} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Cast-iron lamp standards, and things fixed to them
// ---------------------------------------------------------------------------

/** The lamp column: a fluted shaft, flared at the foot, with a moulded neck at the top. */
const COLUMN = (() => {
  const g = lathe([[0, 0], [0.19, 0], [0.19, 0.06], [0.15, 0.12], [0.15, 0.2], [0.12, 3.8], [0.16, 3.9], [0.16, 3.95], [0.13, 4.0], [0.13, 4.05], [0, 4.05]], 32)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y < 0.25 || y > 3.75) continue
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const k = 1 + 0.06 * Math.max(0, Math.cos(16 * Math.atan2(x, z)))
    pos.setX(i, x * k)
    pos.setZ(i, z * k)
  }
  g.computeVertexNormals()
  return g
})()
const LAMP_IRON = metal('#1d5a63')
const GLOBE = glow('#fff0c0')
/** A collar round the column, and the cup each globe sits in. */
const COLLAR = new TorusGeometry(0.15, 0.035, 10, 28)
const CUP = lathe([[0, 0], [0.05, 0], [0.11, 0.07], [0.12, 0.09], [0, 0.09]], 18)

export function LampStandard() {
  return (
    <group>
      {/* a stepped plinth, a yellow band, and the column */}
      <Soft size={[0.7, 0.1, 0.7]} r={0.03} at={[0, 0.05, 0]} mat={LAMP_IRON} />
      <Soft size={[0.6, 0.42, 0.6]} r={0.04} at={[0, 0.3, 0]} mat={LAMP_IRON} />
      <Soft size={[0.66, 0.06, 0.66]} r={0.02} at={[0, 0.53, 0]} mat={gloss(POP.yellow)} />
      {[0, PI / 2, PI, -PI / 2].map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <Soft size={[0.4, 0.26, 0.02]} r={0.008} at={[0, 0.3, 0.3]} mat={LAMP_IRON} />
        </group>
      ))}
      <mesh geometry={COLUMN} material={LAMP_IRON} position={[0, 0.56, 0]} castShadow />
      <mesh geometry={COLLAR} material={gloss(POP.yellow)} position={[0, 2.6, 0]} rotation={[PI / 2, 0, 0]} />
      {[0, PI / 2, PI, -PI / 2].map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <Rod a={[0, 4.45, 0.1]} b={[0, 4.6, 0.5]} r={0.025} mat={LAMP_IRON} />
          <mesh geometry={CUP} material={LAMP_IRON} position={[0, 4.56, 0.55]} />
          <mesh geometry={BALL} material={GLOBE} position={[0, 4.78, 0.55]} scale={0.2} />
        </group>
      ))}
      <mesh geometry={CUP} material={LAMP_IRON} position={[0, 4.6, 0]} scale={1.2} />
      <mesh geometry={BALL} material={GLOBE} position={[0, 4.9, 0]} scale={0.24} />
      <Cyl r={0.05} h={0.25} at={[0, 5.2, 0]} mat={LAMP_IRON} />
      <Ball r={0.06} at={[0, 5.35, 0]} mat={gloss(POP.yellow)} />
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
