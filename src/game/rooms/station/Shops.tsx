import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { DoubleSide, MeshStandardMaterial, PlaneGeometry, TorusGeometry } from 'three'
import { ShadowFigure } from '../../figure'
import { Instanced, PI, type Placement } from '../../kit'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import type { Vec3 } from '../../mutations'
import { BALL, BOX, CYL, glow, gloss, lathe, MAT, matte, POP, printed, ROD, BUSH } from './parts'
import { Box, Cyl, Print, Rod, Soft } from './Prims'
import { chalkTexture, coversTexture, lockerTexture, paperTexture, photoSamplesTexture, shutterTexture, sign } from './textures'

/*
 * The shops and machines along the west wall. Each is built with its front
 * to +z, standing on y = 0; the room turns them to face the concourse.
 */

// ---------------------------------------------------------------------------
// Coffee kiosk: 3.2 m wide, 2 m deep, counter along the front
// ---------------------------------------------------------------------------

const CUP = lathe([[0, 0], [0.42, 0], [0.6, 1.25], [0, 1.25]], 32)
const LID = lathe([[0, 0], [0.64, 0], [0.64, 0.08], [0.5, 0.16], [0, 0.2]], 32)
const SLEEVE = lathe([[0.488, 0], [0.552, 0.45]], 32)
const SMALL_CUP = lathe([[0, 0], [0.035, 0], [0.045, 0.11], [0, 0.11]], 12)

/** The espresso machine on the back counter: chrome body, red top, two group heads, a steam wand, cups warming on top. */
function Espresso() {
  return (
    <group position={[0.6, 0.95, -0.55]}>
      <Soft size={[0.8, 0.45, 0.42]} r={0.04} at={[0, 0.225, 0]} mat={MAT.chrome} />
      <Soft size={[0.82, 0.06, 0.44]} r={0.02} at={[0, 0.48, 0]} mat={gloss(POP.red)} />
      <Soft size={[0.7, 0.03, 0.14]} r={0.01} at={[0, 0.02, 0.26]} mat={MAT.black} />
      {[-0.18, 0.18].map((x) => (
        <group key={x} position={[x, 0.2, 0.22]}>
          <Cyl r={0.05} h={0.08} at={[0, 0.03, 0]} mat={MAT.steel} />
          <Cyl r={0.045} h={0.04} at={[0, -0.03, 0]} mat={MAT.black} />
          <Rod a={[0, -0.03, 0.03]} b={[0, -0.05, 0.18]} r={0.014} mat={MAT.black} />
        </group>
      ))}
      <Rod a={[0.34, 0.3, 0.2]} b={[0.36, 0.08, 0.26]} r={0.008} mat={MAT.steel} />
      {[-0.25, -0.1, 0.05].map((x) => (
        <mesh key={x} geometry={SMALL_CUP} material={MAT.white} position={[x, 0.51, 0.05]} castShadow />
      ))}
      <Print map={sign('ESPRESSO', '#ff3131', '#ffffff', 256, 48)} w={0.4} h={0.075} at={[0, 0.36, 0.211]} />
    </group>
  )
}

/** A coffee grinder: a black body under a clear hopper of beans. */
const HOPPER = lathe([[0.04, 0], [0.11, 0.18], [0.11, 0.2], [0, 0.2]], 18)

function Grinder() {
  return (
    <group position={[-0.05, 0.95, -0.6]}>
      <Soft size={[0.16, 0.3, 0.2]} r={0.03} at={[0, 0.15, 0]} mat={MAT.black} />
      <Cyl r={0.04} h={0.04} at={[0, 0.32, 0]} mat={MAT.steel} />
      <mesh geometry={HOPPER} material={matte('#5a321c')} position={[0, 0.34, 0]} />
    </group>
  )
}

export function CoffeeKiosk({ mode }: { mode: 'default' | 'cup' | 'queue' | 'shut' }) {
  const teal = gloss(POP.teal)
  return (
    <group>
      {/* walls, roof and counter */}
      <Box size={[3.2, 2.6, 0.2]} at={[0, 1.3, -0.9]} mat={teal} paint />
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.12, 2.6, 2.0]} at={[s * 1.54, 1.3, 0]} mat={teal} paint />
      ))}
      <Soft size={[3.5, 0.18, 2.3]} r={0.04} at={[0, 2.69, 0.05]} mat={gloss(POP.red)} />
      {/* white stripes across the roof, like an awning */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x) => (
        <Box key={x} size={[0.3, 0.01, 2.24]} at={[x, 2.783, 0.05]} mat={MAT.white} shadow={false} />
      ))}
      <Box size={[3.2, 0.5, 0.12]} at={[0, 2.35, 0.94]} mat={MAT.white} />
      <Print map={sign('PLATFORM ZERO COFFEE', '#ffffff', '#ff3131', 1024, 160)} w={3.1} h={0.48} at={[0, 2.35, 1.005]} />
      <Box size={[3.2, 1.0, 0.6]} at={[0, 0.5, 0.65]} mat={teal} paint />
      <Soft size={[3.3, 0.06, 0.8]} r={0.025} at={[0, 1.03, 0.62]} mat={MAT.white} />
      {/* behind the counter: worktop, espresso machine, menu */}
      <Box size={[3.0, 0.95, 0.5]} at={[0, 0.475, -0.55]} mat={MAT.steel} />
      <Espresso />
      <Grinder />
      <Print map={chalkTexture('MENU\nFLAT WHITE\nLATTE  MOCHA\nHOT CHOC\nTEA')} w={1.0} h={1.5} at={[-0.7, 1.75, -0.79]} />
      {/* on the counter: a cake case and a few cups */}
      <Box size={[0.9, 0.35, 0.45]} at={[-0.95, 1.235, 0.62]} mat={MAT.glass} shadow={false} />
      {[-1.2, -0.95, -0.7].map((x, i) => (
        <mesh key={x} geometry={BALL} material={matte(['#b8743a', '#7a4a2a', '#e8c08a'][i])} position={[x, 1.12, 0.62]} scale={[0.09, 0.05, 0.09]} />
      ))}
      {[0.3, 0.45, 0.6].map((x) => (
        <mesh key={x} geometry={SMALL_CUP} material={MAT.white} position={[x, 1.06, 0.7]} castShadow />
      ))}
      {mode === 'cup' && (
        <group position={[0.4, 2.78, 0.1]} rotation={[0, 0.4, 0]}>
          <mesh geometry={CUP} material={MAT.white} castShadow />
          <mesh geometry={SLEEVE} material={matte('#a0662f')} position={[0, 0.4, 0]} />
          <mesh geometry={LID} material={gloss(POP.red)} position={[0, 1.22, 0]} castShadow />
        </group>
      )}
      {mode === 'shut' && <Print map={shutterTexture('CLOSED')} w={3.08} h={1.2} at={[0, 1.66, 0.96]} />}
      {mode === 'queue' &&
        // nobody was there a minute ago
        [1.6, 2.4, 3.2].map((z, k) => (
          <group key={z} position={[0.3 - k * 0.25, 0, z]} rotation={[0, PI, 0]}>
            <ShadowFigure height={1.72 + (k % 2) * 0.1} phase={k * 1.9} />
          </group>
        ))}
    </group>
  )
}

/** A chalk A-board, writing to +z. */
export function ABoard({ text }: { text: string }) {
  const map = chalkTexture(text)
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 0.2]} rotation={[s * -0.2, 0, 0]}>
          <Box size={[0.62, 0.95, 0.03]} at={[0, 0.5, 0]} mat={MAT.darkWood} />
          <Print map={map} w={0.54} h={0.82} at={[0, 0.5, s * 0.017]} rot={[0, s < 0 ? PI : 0, 0]} />
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Newsagent: 3.4 m wide, 1.8 m deep, with a paper stand out front
// ---------------------------------------------------------------------------

const jarSpots = once(() => {
  const rng = mulberry32(31)
  return Array.from({ length: 10 }, (_, k): Placement => ({ at: [-1.35 + k * 0.3, 0, 0], rot: [0, rng() * PI, 0] }))
})
const JAR = lathe([[0, 0], [0.09, 0], [0.1, 0.02], [0.1, 0.22], [0.06, 0.26], [0, 0.26]], 14)
const SWEET_COLOURS = ['#ff3fa4', '#ffd21f', '#22b56a', '#ff3131', '#16c6f0', '#8a4dff']
/** Sweets scattered along the counter, one list per colour. */
const spilled = once(() => {
  const rng = mulberry32(8)
  return SWEET_COLOURS.map(() => Array.from({ length: 10 }, (): Placement => ({ at: [-1.4 + rng() * 2.6, 0.01, (rng() - 0.5) * 0.55], scale: [0.025, 0.018, 0.025] })))
})

export function Newsagent({ mode }: { mode: 'default' | 'headline' | 'blank' | 'sweets' }) {
  const red = gloss(POP.red)
  const paper = printed(paperTexture(mode === 'headline' ? 'missed' : 'default'))
  const sweets = useMemo(() => SWEET_COLOURS.map((c) => gloss(c)), [])
  return (
    <group>
      <Box size={[3.4, 2.7, 0.2]} at={[0, 1.35, -0.8]} mat={red} />
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.12, 2.7, 1.8]} at={[s * 1.64, 1.35, 0]} mat={red} />
      ))}
      <Box size={[3.6, 0.16, 2.0]} at={[0, 2.78, 0.05]} mat={gloss(POP.ink)} />
      <Box size={[3.4, 0.46, 0.1]} at={[0, 2.44, 0.86]} mat={gloss(POP.yellow)} />
      <Print map={sign('NEWS · SWEETS · DRINKS', '#ffd21f', '#141414', 1024, 140)} w={3.3} h={0.44} at={[0, 2.44, 0.912]} />
      {/* magazines up the back wall */}
      <Print map={coversTexture(mode === 'blank' ? 'blank' : 'default')} w={2.6} h={1.3} at={[0, 1.75, -0.69]} />
      {[1.08, 1.75, 2.42].map((y) => (
        <Box key={y} size={[2.8, 0.03, 0.14]} at={[0, y - 0.66, -0.62]} mat={MAT.white} />
      ))}
      {/* the counter, with jars of sweets */}
      <Box size={[3.2, 1.0, 0.55]} at={[0, 0.5, 0.55]} mat={red} />
      <Box size={[3.3, 0.05, 0.65]} at={[0, 1.025, 0.55]} mat={MAT.paleWood} />
      <group position={[0, 1.05, 0.5]}>
        {mode === 'sweets' ? (
          <>
            {jarSpots()
              .slice(0, 6)
              .map((p, k) => (
                <mesh key={k} geometry={JAR} material={MAT.glass} position={k === 2 ? [p.at[0], 0.1, p.at[2]] : p.at} rotation={[0, 0, k === 2 ? PI / 2 : 0]} />
              ))}
            {spilled().map((items, k) => (
              <Instanced key={k} geometry={BALL} material={sweets[k]} items={items} />
            ))}
          </>
        ) : (
          jarSpots().map((p, k) => (
            <group key={k} position={p.at}>
              <mesh geometry={JAR} material={MAT.glass} />
              <mesh geometry={CYL} material={sweets[k % sweets.length]} position={[0, 0.09, 0]} scale={[0.085, 0.16, 0.085]} />
              <mesh geometry={CYL} material={MAT.black} position={[0, 0.265, 0]} scale={[0.065, 0.03, 0.065]} />
            </group>
          ))
        )}
      </group>
      {/* the paper stand out front */}
      <group position={[0, 0, 1.25]}>
        <Box size={[1.2, 0.04, 0.4]} at={[0, 0.5, 0]} rot={[-0.3, 0, 0]} mat={MAT.steel} />
        {[-1, 1].map((s) => (
          <Rod key={s} a={[s * 0.55, 0, 0.1]} b={[s * 0.55, 0.62, -0.05]} r={0.015} mat={MAT.steel} />
        ))}
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} geometry={BOX} material={paper} position={[x, 0.66, 0.0]} rotation={[-0.3, 0, 0]} scale={[0.5, 0.62, 0.02]} castShadow />
        ))}
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Photo booth: 1.4 m wide, 1.5 m deep, curtain on the right of the front
// ---------------------------------------------------------------------------

const CURTAIN = new MeshStandardMaterial({ color: '#c8102e', roughness: 0.95, side: DoubleSide })
/** The booth's curtain: a sheet gathered into soft folds. */
const CURTAIN_FOLDS = (() => {
  const w = 0.78
  const g = new PlaneGeometry(w, 1.62, 48, 1)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setZ(i, 0.022 * Math.sin((pos.getX(i) / w) * PI * 2 * 5.5))
  g.computeVertexNormals()
  return g
})()
const CURTAIN_RING = new TorusGeometry(0.022, 0.006, 6, 12)

/** Light spilling out round the curtain; there's only the one booth, so one material. */
const FLASH = new MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.4 })

function Flash() {
  useFrame(({ clock }) => {
    // a burst of four flashes every few seconds, like a sitting
    const t = clock.elapsedTime % 4
    FLASH.emissiveIntensity = t < 2 && t % 0.5 < 0.08 ? 6 : 0
  })
  return (
    <>
      <mesh geometry={BOX} material={FLASH} position={[0.28, 2.0, 0.72]} scale={[0.6, 0.12, 0.04]} />
      <mesh geometry={BOX} material={FLASH} position={[0.28, 0.25, 0.72]} scale={[0.6, 0.06, 0.04]} />
    </>
  )
}

export function PhotoBooth({ mode }: { mode: 'default' | 'feet' | 'flash' | 'broken' }) {
  const body = gloss(POP.yellow)
  return (
    <group>
      <Box size={[1.4, 2.1, 0.1]} at={[0, 1.05, -0.7]} mat={body} paint />
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.1, 2.1, 1.5]} at={[s * 0.65, 1.05, 0]} mat={body} paint />
      ))}
      <Box size={[1.4, 0.2, 1.5]} at={[0, 2.2, 0]} mat={body} paint />
      {/* the left of the front: samples, a coin slot and the slot the strips come out of */}
      <Box size={[0.6, 2.1, 0.1]} at={[-0.4, 1.05, 0.7]} mat={body} paint />
      <Print map={photoSamplesTexture()} w={0.46} h={0.92} at={[-0.4, 1.4, 0.752]} />
      <Box size={[0.12, 0.08, 0.02]} at={[-0.4, 0.82, 0.76]} mat={MAT.chrome} />
      <Box size={[0.22, 0.03, 0.04]} at={[-0.4, 0.6, 0.76]} mat={MAT.black} />
      {/* a lit sign on top */}
      <Box size={[1.2, 0.3, 0.3]} at={[0, 2.45, 0.4]} mat={MAT.black} />
      <Print map={sign('PHOTO ME', '#ff3fa4', '#ffffff', 512, 128)} w={1.1} h={0.26} at={[0, 2.45, 0.552]} lit />
      {/* inside, a stool; the curtain, hanging from a rail to just off the floor */}
      <Cyl r={0.17} h={0.06} at={[0.25, 0.55, 0]} mat={MAT.black} />
      <Cyl r={0.03} h={0.52} at={[0.25, 0.27, 0]} mat={MAT.chrome} />
      <Box size={[0.75, 0.03, 0.03]} at={[0.25, 2.0, 0.72]} mat={MAT.chrome} />
      <mesh geometry={CURTAIN_FOLDS} material={CURTAIN} position={[0.27, 1.17, 0.735]} castShadow />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <mesh key={k} geometry={CURTAIN_RING} material={MAT.chrome} position={[-0.08 + k * 0.14, 2.0, 0.72]} rotation={[0, PI / 2, 0]} />
      ))}
      {mode === 'feet' &&
        [-1, 1].map((s) => (
          <group key={s} position={[0.25 + s * 0.1, 0, 0.62]}>
            <Box size={[0.1, 0.09, 0.26]} at={[0, 0.045, 0.06]} mat={gloss('#141414')} />
            <Box size={[0.08, 0.3, 0.08]} at={[0, 0.24, -0.02]} mat={matte('#2a3a6a')} />
          </group>
        ))}
      {mode === 'flash' && <Flash />}
      {mode === 'broken' && (
        <group position={[0.25, 1.35, 0.78]} rotation={[0, 0, -0.08]}>
          <Print map={sign('OUT OF\nORDER', '#ffffff', '#ff3131', 256, 192, 'rim')} w={0.56} h={0.42} />
          {[-1, 1].map((s) => (
            <Box key={s} size={[0.18, 0.05, 0.004]} at={[s * 0.25, 0.2, 0.003]} rot={[0, 0, s * 0.6]} mat={matte('#e8dfa8')} shadow={false} />
          ))}
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Snack machine: 0.95 m wide, 0.85 m deep, 1.85 m tall
// ---------------------------------------------------------------------------

const SNACK_COLOURS = ['#ff3131', '#ffd21f', '#1f6bff', '#22b56a', '#ff8a1f', '#8a4dff']
const snacks = once(() =>
  SNACK_COLOURS.map((_, c) => {
    const items: Placement[] = []
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 4; col++) if ((row * 4 + col) % SNACK_COLOURS.length === c) items.push({ at: [-0.36 + col * 0.15, 0.62 + row * 0.24, 0.24], scale: [0.11, 0.16, 0.04] })
    return items
  }),
)

export function Vending({ mode }: { mode: 'default' | 'empty' | 'stuck' }) {
  const body = gloss(POP.red)
  const s = snacks()
  return (
    <group>
      {/* the cabinet, built round a deep window on the left of its front */}
      <Box size={[0.95, 1.85, 0.6]} at={[0, 0.925, -0.125]} mat={body} paint />
      <Box size={[0.95, 0.47, 0.25]} at={[0, 0.235, 0.3]} mat={body} paint />
      <Box size={[0.95, 0.08, 0.25]} at={[0, 1.81, 0.3]} mat={body} paint />
      <Box size={[0.045, 1.3, 0.25]} at={[-0.4525, 1.12, 0.3]} mat={body} paint />
      <Box size={[0.245, 1.3, 0.25]} at={[0.3525, 1.12, 0.3]} mat={body} paint />
      <Box size={[0.66, 1.3, 0.01]} at={[-0.1, 1.12, 0.18]} mat={matte('#20242a')} />
      {/* the snacks on their shelves, behind glass */}
      {[0.53, 0.77, 1.01, 1.25, 1.49].map((y) => (
        <Box key={y} size={[0.64, 0.015, 0.2]} at={[-0.1, y, 0.3]} mat={MAT.steel} shadow={false} />
      ))}
      {mode !== 'empty' &&
        SNACK_COLOURS.map((c, k) => (
          <Instanced key={c} geometry={BOX} material={gloss(c)} items={mode === 'stuck' ? s[k].filter((_, i) => !(k === 4 && i === 0)) : s[k]} />
        ))}
      {mode === 'stuck' && (
        // a bag hanging at an angle off the end of its spiral
        <Box size={[0.18, 0.26, 0.06]} at={[0.0, 1.38, 0.33]} rot={[0.5, 0, 0.6]} mat={gloss(POP.pink)} />
      )}
      <Box size={[0.66, 1.3, 0.01]} at={[-0.1, 1.12, 0.43]} mat={MAT.glass} shadow={false} />
      {/* keypad, coin slot, the flap at the bottom */}
      <Box size={[0.18, 0.5, 0.02]} at={[0.35, 1.3, 0.43]} mat={MAT.black} />
      <Box size={[0.14, 0.08, 0.01]} at={[0.35, 1.45, 0.445]} mat={glow('#2aff6a')} />
      <Box size={[0.6, 0.2, 0.03]} at={[-0.1, 0.25, 0.43]} mat={MAT.black} />
      <Print map={sign('SNACKS', '#ffffff', '#ff3131', 256, 64)} w={0.66} h={0.16} at={[-0.1, 1.95 - 0.12, 0.426]} lit />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Left-luggage lockers: 1.9 m wide, 0.56 m deep, 2.0 m tall
// ---------------------------------------------------------------------------

/** The door that opens or glows: column 1, row 2 (from the top left). */
const DOOR = { x: -0.95 + 0.475 * 1.5, y: 2.0 - 0.4 * 2.5 }

export function Lockers({ mode }: { mode: 'default' | 'open' | 'glow' }) {
  return (
    <group>
      <Box size={[1.9, 2.0, 0.56]} at={[0, 1.0, 0]} mat={matte('#2a2a2e')} />
      <Print map={lockerTexture()} w={1.9} h={2.0} at={[0, 1.0, 0.282]} />
      <Box size={[2.0, 0.1, 0.6]} at={[0, 2.05, 0]} mat={MAT.black} />
      <Print map={sign('LEFT LUGGAGE', '#141414', '#ffd21f', 512, 96)} w={1.9} h={0.36} at={[0, 2.35, -0.22]} />
      {mode === 'open' && (
        <>
          <Box size={[0.47, 0.4, 0.02]} at={[DOOR.x, DOOR.y, 0.285]} mat={MAT.black} shadow={false} />
          <group position={[DOOR.x - 0.235, DOOR.y, 0.29]} rotation={[0, -1.9, 0]}>
            <Box size={[0.46, 0.39, 0.02]} at={[0.23, 0, 0]} mat={gloss(POP.blue)} />
          </group>
        </>
      )}
      {mode === 'glow' && (
        <group position={[DOOR.x, DOOR.y, 0.29]}>
          {[
            [0, 0.2, 0.47, 0.03],
            [0, -0.2, 0.47, 0.03],
            [-0.235, 0, 0.03, 0.4],
            [0.235, 0, 0.03, 0.4],
          ].map(([x, y, w, h], k) => (
            <Box key={k} size={[w, h, 0.02]} at={[x, y, 0]} mat={glow('#7dff9a')} shadow={false} />
          ))}
        </group>
      )}
    </group>
  )
}

/** A flat sign fixed to a wall: a plate with the picture on its face. */
export function WallSign({ text, bg, fg, w, h }: { text: string; bg: string; fg: string; w: number; h: number }) {
  return (
    <group>
      <Box size={[w + 0.04, h + 0.04, 0.04]} at={[0, 0, 0.02]} mat={MAT.black} />
      <Print map={sign(text, bg, fg, 512, Math.round((512 * h) / w))} w={w} h={h} at={[0, 0, 0.042]} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Flowers by the doors: three galvanised buckets on a stepped stand
// ---------------------------------------------------------------------------

const BUCKET = lathe([[0, 0], [0.15, 0], [0.19, 0.34], [0.2, 0.36], [0, 0.36]], 20)
const BLOOM_COLOURS = ['#ff3131', '#ffd21f', '#ff3fa4']
/**
 * A bunch in each bucket: stems fanning out of the foliage with a bloom on
 * each. Wilted, the stems flop out over the rim and the heads hang.
 */
const bunches = once(() => {
  const rng = mulberry32(55)
  const make = (dead: boolean) => {
    const stems: Placement[] = []
    const heads: Placement[] = []
    const hearts: Placement[] = []
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * PI * 2 + rng() * 0.4
      const t = dead ? 0.75 + rng() * 0.4 : k === 0 ? 0 : 0.12 + rng() * 0.28
      const len = (dead ? 0.2 : 0.36) + rng() * 0.12
      const dir: Vec3 = [Math.sin(t) * Math.cos(a), Math.cos(t), -Math.sin(t) * Math.sin(a)]
      const at = (d: number): Vec3 => [dir[0] * d, 0.3 + dir[1] * d, dir[2] * d]
      stems.push({ at: at(len / 2), rot: [0, a, -t], scale: [0.008, len, 0.008] })
      const tip = at(len)
      if (dead) {
        // bent over at the top, the head hanging off the end
        const bend = PI - 0.4
        const drop = 0.12
        const d2: Vec3 = [Math.sin(bend) * Math.cos(a), Math.cos(bend), -Math.sin(bend) * Math.sin(a)]
        stems.push({ at: [tip[0] + (d2[0] * drop) / 2, tip[1] + (d2[1] * drop) / 2, tip[2] + (d2[2] * drop) / 2], rot: [0, a, -bend], scale: [0.008, drop, 0.008] })
        heads.push({ at: [tip[0] + d2[0] * (drop + 0.02), tip[1] + d2[1] * (drop + 0.02), tip[2] + d2[2] * (drop + 0.02)], rot: [0, a, -bend], scale: [0.03, 0.045, 0.03] })
      } else {
        heads.push({ at: tip, rot: [0, a, -t], scale: [0.055, 0.035, 0.055] })
        hearts.push({ at: at(len + 0.025), scale: [0.02, 0.016, 0.02] })
      }
    }
    return { stems, heads, hearts }
  }
  return { fresh: make(false), dead: make(true) }
})

export function Flowers({ dead = false }: { dead?: boolean }) {
  const b = bunches()[dead ? 'dead' : 'fresh']
  const stems = matte(dead ? '#6b5a2e' : '#3f8a3a')
  const steps: [number, number][] = [
    [-0.42, 0.0],
    [0, 0.25],
    [0.42, 0.0],
  ]
  return (
    <group>
      <Soft size={[1.3, 0.25, 0.5]} r={0.02} at={[0, 0.125, 0]} mat={MAT.darkWood} />
      <Soft size={[0.5, 0.25, 0.5]} r={0.02} at={[0, 0.375, 0]} mat={MAT.darkWood} />
      {steps.map(([x, y], k) => (
        <group key={x} position={[x, y + 0.25, 0]}>
          <mesh geometry={BUCKET} material={MAT.steel} castShadow />
          <mesh geometry={RIM} material={MAT.steel} position={[0, 0.355, 0]} rotation={[PI / 2, 0, 0]} />
          {/* foliage packed in the top of the bucket */}
          <mesh geometry={BUSH} material={dead ? matte('#5e5a2a') : matte('#2f7a34')} position={[0, 0.35, 0]} scale={[0.18, 0.07, 0.18]} />
          <Instanced geometry={ROD} material={stems} items={b.stems} />
          <Instanced geometry={BALL} material={dead ? matte('#5a3a2a') : gloss(BLOOM_COLOURS[k])} items={b.heads} castShadow />
          {!dead && <Instanced geometry={BALL} material={gloss(POP.yellow)} items={b.hearts} />}
        </group>
      ))}
    </group>
  )
}

/** The rolled rim of a galvanised bucket. */
const RIM = new TorusGeometry(0.2, 0.012, 6, 24)
