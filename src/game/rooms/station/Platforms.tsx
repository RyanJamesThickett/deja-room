import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MeshStandardMaterial, type Group } from 'three'
import { Instanced, PI, type Placement } from '../../kit'
import { once } from '../../outsideLayers'
import { BALL, BOX, glow, gloss, MAT, matte, POP, printed, tiled } from './parts'
import { Box, Cyl, Print, Rod } from './Prims'
import { GATES, TRACKS } from './plan'
import { BOARD, boardTexture, destTexture, hazardTexture, plateTexture, sign, trainWindowsTexture, type BoardMode } from './textures'

/*
 * The north end of the concourse: the line of ticket barriers, the
 * departures board and platform numbers over them, and the trains beyond.
 */

// ---------------------------------------------------------------------------
// Ticket barriers: a row of steel cabinets with glass paddles between
// ---------------------------------------------------------------------------

const CABINETS = Math.round((GATES.halfSpan * 2) / GATES.pitch) + 1
const cabinetX = (i: number) => -GATES.halfSpan + i * GATES.pitch
/** The gate that gets taped off. */
const TAPED = 17

const gateLayout = once(() => {
  const bodies: Placement[] = []
  const caps: Placement[] = []
  const readers: Placement[] = []
  const tops: Placement[] = []
  const fronts: Placement[] = []
  const paddles: Placement[] = []
  for (let i = 0; i < CABINETS; i++) {
    const x = cabinetX(i)
    bodies.push({ at: [x, 0.5, 0], scale: [0.24, 1.0, 1.0] })
    caps.push({ at: [x, 1.025, 0], scale: [0.27, 0.05, 1.04] })
    readers.push({ at: [x, 1.06, -0.12], scale: [0.2, 0.025, 0.26] })
    tops.push({ at: [x, 1.056, 0.28], scale: [0.18, 0.02, 0.22] })
    fronts.push({ at: [x, 0.86, 0.505], scale: [0.15, 0.13, 0.02] })
    fronts.push({ at: [x, 0.86, -0.505], scale: [0.15, 0.13, 0.02] })
    if (i < CABINETS - 1)
      for (const s of [-1, 1]) paddles.push({ at: [x + GATES.pitch / 2 + s * 0.18, 0.66, 0], scale: [0.33, 0.72, 0.03] })
  }
  return { bodies, caps, readers, tops, fronts, paddles }
})

const BODY = new MeshStandardMaterial({ color: '#c3c8ce', roughness: 0.35, metalness: 0.35 })
const PADDLE = new MeshStandardMaterial({ color: '#ff3fa4', roughness: 0.1, transparent: true, opacity: 0.55 })

export function Gates({ mode }: { mode: 'default' | 'open' | 'red' | 'tape' }) {
  const l = gateLayout()
  const light = glow(mode === 'red' ? '#ff2a2a' : '#2aff6a')
  const tx = cabinetX(TAPED) + GATES.pitch / 2
  return (
    <group>
      <Instanced geometry={BOX} material={BODY} items={l.bodies} castShadow />
      <Instanced geometry={BOX} material={gloss(POP.yellow)} items={l.caps} castShadow />
      <Instanced geometry={BOX} material={MAT.black} items={l.readers} />
      <Instanced geometry={BOX} material={light} items={l.tops} />
      <Instanced geometry={BOX} material={light} items={l.fronts} />
      {mode !== 'open' && <Instanced geometry={BOX} material={PADDLE} items={l.paddles} />}
      {mode === 'tape' && (
        <group position={[tx, 0, 0.06]}>
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={tiled(1.0, 0.1, 0.8, 0.1)} material={printed(hazardTexture())} position={[0, 0.62, 0]} rotation={[0, 0, s * 0.62]} />
          ))}
          <Print map={sign('OUT OF\nORDER', '#ffffff', '#ff3131', 256, 192, 'rim')} w={0.42} h={0.32} at={[0, 0.98, 0.01]} />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The departures board and the platform numbers
// ---------------------------------------------------------------------------

export function DeparturesBoard({ mode }: { mode: BoardMode }) {
  return (
    <group>
      <Box size={[BOARD.w + 0.3, BOARD.h + 0.3, 0.3]} at={[0, 0, 0]} mat={MAT.black} />
      <Box size={[BOARD.w + 0.4, 0.08, 0.34]} at={[0, BOARD.h / 2 + 0.17, 0]} mat={gloss(POP.yellow)} />
      <Box size={[BOARD.w + 0.4, 0.08, 0.34]} at={[0, -BOARD.h / 2 - 0.17, 0]} mat={gloss(POP.yellow)} />
      <Print map={boardTexture(mode)} w={BOARD.w} h={BOARD.h} at={[0, 0, 0.152]} lit />
    </group>
  )
}

export function PlatformSigns({ numbers }: { numbers: readonly string[] }) {
  return (
    <group>
      {TRACKS.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <Rod a={[-0.25, 0.38, 0]} b={[-0.25, 0.62, 0]} r={0.015} mat={MAT.iron} />
          <Rod a={[0.25, 0.38, 0]} b={[0.25, 0.62, 0]} r={0.015} mat={MAT.iron} />
          <Box size={[0.8, 0.8, 0.05]} at={[0, 0, 0]} mat={MAT.black} />
          <Print map={plateTexture(numbers[i])} w={0.8} h={0.8} at={[0, 0, 0.027]} />
          <Print map={plateTexture(numbers[i])} w={0.8} h={0.8} at={[0, 0, -0.027]} rot={[0, PI, 0]} />
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Trains, built from the nose at z = 0 back along -z, floor level at y = 0
// ---------------------------------------------------------------------------

/** Length of a train behind its cab. */
const LENGTH = 40
const BAND = { y: 1.62, h: 0.9 }

function WindowBand({ z0, z1, faces = false, y = BAND.y }: { z0: number; z1: number; faces?: boolean; y?: number }) {
  const len = z0 - z1
  const geo = tiled(len, BAND.h, 4, BAND.h)
  const mat = printed(trainWindowsTexture(faces))
  return (
    <>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geo} material={mat} position={[s * 1.302, y, (z0 + z1) / 2]} rotation={[0, (s * PI) / 2, 0]} />
      ))}
    </>
  )
}

/** A modern electric train: a yellow nose on a coloured body with a white window band. */
export function Train({ body = POP.blue, faces = false, destination = 'BRIGHTON' }: { body?: string; faces?: boolean; destination?: string }) {
  const paint = gloss(body)
  const nose = gloss(POP.yellow)
  return (
    <group>
      {/* the cab */}
      <Box size={[2.6, 3.0, 2.2]} at={[0, 1.25, -1.1]} mat={nose} />
      <Box size={[2.1, 1.0, 0.04]} at={[0, 1.95, 0.0]} mat={MAT.darkGlass} />
      <Box size={[2.6, 0.12, 0.06]} at={[0, 1.4, 0.0]} mat={MAT.black} />
      <Print map={destTexture(destination)} w={1.5} h={0.28} at={[0, 2.68, 0.012]} lit />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Cyl r={0.12} h={0.04} at={[s * 0.85, 0.62, 0.01]} rot={[PI / 2, 0, 0]} mat={glow('#fffbe8')} />
          <Cyl r={0.07} h={0.04} at={[s * 0.85, 0.36, 0.01]} rot={[PI / 2, 0, 0]} mat={glow('#ff2a2a')} />
        </group>
      ))}
      <Box size={[0.5, 0.35, 0.4]} at={[0, 0.0, 0.1]} mat={MAT.black} />
      {/* the body, roof and underframe */}
      <Box size={[2.6, 3.0, LENGTH]} at={[0, 1.25, -2.2 - LENGTH / 2]} mat={paint} />
      <Box size={[2.3, 0.3, LENGTH + 2.2]} at={[0, 2.86, -(LENGTH + 2.2) / 2]} mat={MAT.steel} />
      <Box size={[2.1, 0.5, LENGTH]} at={[0, -0.5, -2.2 - LENGTH / 2]} mat={MAT.black} shadow={false} />
      <WindowBand z0={-2.4} z1={-2.2 - LENGTH} faces={faces} />
      {/* doors, a pair per carriage */}
      {Array.from({ length: 4 }, (_, k) => -6 - k * 10).map((z) =>
        [-1, 1].map((s) => <Box key={`${z}${s}`} size={[0.02, 2.2, 1.3]} at={[s * 1.31, 1.0, z]} mat={gloss(POP.red)} shadow={false} />),
      )}
    </group>
  )
}

const PUFF = new MeshStandardMaterial({ color: '#f2f2f2', roughness: 1, transparent: true, opacity: 0.7, depthWrite: false })

/** Puffs of smoke rising from the chimney and fading out under the canopy. */
function Smoke() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    g.children.forEach((c, i) => {
      const f = (t * 0.35 + i / g.children.length) % 1
      c.position.set(Math.sin(i * 2.1) * 0.15, f * 2.3, -f * 1.2)
      c.scale.setScalar(0.25 + f * 0.55)
    })
  })
  return (
    <group ref={ref} position={[0, 3.0, -1.0]}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={BALL} material={PUFF} />
      ))}
    </group>
  )
}

/** A green steam engine and tender with two maroon and cream carriages behind. */
export function SteamTrain() {
  const green = gloss('#1f8a4a')
  const red = gloss(POP.red)
  return (
    <group>
      {/* boiler, smokebox and chimney */}
      <Cyl r={0.82} h={6.0} at={[0, 1.55, -3.4]} rot={[PI / 2, 0, 0]} mat={green} />
      <Cyl r={0.86} h={1.0} at={[0, 1.55, -0.6]} rot={[PI / 2, 0, 0]} mat={MAT.black} />
      <Cyl r={0.72} h={0.08} at={[0, 1.55, -0.07]} rot={[PI / 2, 0, 0]} mat={matte('#2a2a2a')} />
      <Cyl r={0.16} h={0.04} at={[0, 1.95, -0.02]} rot={[PI / 2, 0, 0]} mat={red} />
      <Cyl r={0.22} h={0.75} at={[0, 2.65, -0.7]} mat={MAT.black} />
      <Cyl r={0.28} h={0.1} at={[0, 3.0, -0.7]} mat={MAT.black} />
      <mesh geometry={BALL} material={MAT.brass} position={[0, 2.35, -3.0]} scale={[0.34, 0.32, 0.34]} castShadow />
      <Smoke />
      {/* running plate, buffer beam, buffers, lamp */}
      <Box size={[2.6, 0.1, 8.6]} at={[0, 0.72, -4.2]} mat={MAT.black} />
      <Box size={[2.6, 0.3, 8.6]} at={[0, 0.52, -4.2]} mat={red} />
      <Box size={[2.6, 0.5, 0.2]} at={[0, 0.3, 0.05]} mat={red} />
      {[-1, 1].map((s) => (
        <Cyl key={s} r={0.13} h={0.36} at={[s * 0.85, 0.3, 0.3]} rot={[PI / 2, 0, 0]} mat={MAT.steel} />
      ))}
      <Box size={[0.24, 0.28, 0.16]} at={[0, 0.95, 0.0]} mat={glow('#fff2c8')} />
      {/* driving wheels */}
      {[-2.4, -4.1, -5.8].map((z) =>
        [-1, 1].map((s) => <Cyl key={`${z}${s}`} r={0.76} h={0.12} at={[s * 1.12, -0.2, z]} rot={[0, 0, PI / 2]} mat={red} />),
      )}
      <Rod a={[1.2, -0.2, -2.4]} b={[1.2, -0.2, -5.8]} r={0.05} mat={MAT.steel} />
      <Rod a={[-1.2, -0.2, -2.4]} b={[-1.2, -0.2, -5.8]} r={0.05} mat={MAT.steel} />
      {/* the cab and tender */}
      <Box size={[2.5, 2.1, 2.2]} at={[0, 1.75, -7.6]} mat={green} />
      <Box size={[2.7, 0.12, 2.6]} at={[0, 2.86, -7.6]} mat={MAT.black} />
      {[-0.7, 0.7].map((x) => (
        <Cyl key={x} r={0.22} h={0.04} at={[x, 2.2, -6.48]} rot={[PI / 2, 0, 0]} mat={glow('#ffd27a')} />
      ))}
      <Box size={[2.5, 2.0, 4.0]} at={[0, 1.0, -10.9]} mat={green} />
      <Box size={[2.2, 0.35, 3.4]} at={[0, 2.1, -10.9]} mat={matte('#111111')} />
      {/* the carriages */}
      {[-13.3, -27.0].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <Box size={[2.6, 1.5, 13]} at={[0, 0.5, -6.5]} mat={gloss('#7a1a2a')} />
          <Box size={[2.6, 1.0, 13]} at={[0, 1.75, -6.5]} mat={gloss('#efe3c4')} />
          <Box size={[2.4, 0.35, 13]} at={[0, 2.42, -6.5]} mat={MAT.black} />
          <WindowBand z0={-0.4} z1={-12.6} y={1.75} />
        </group>
      ))}
    </group>
  )
}

/** Red-and-white buffer stops at the end of a track. */
export function BufferStop() {
  return (
    <group>
      <Box size={[2.0, 0.9, 0.5]} at={[0, -0.35, 0]} mat={gloss(POP.red)} />
      <Box size={[2.0, 0.18, 0.52]} at={[0, -0.05, 0]} mat={MAT.white} />
      {[-0.75, 0.75].map((x) => (
        <Cyl key={x} r={0.16} h={0.4} at={[x, -0.2, -0.35]} rot={[PI / 2, 0, 0]} mat={MAT.steel} />
      ))}
      <Box size={[0.3, 0.3, 0.06]} at={[0, 0.25, 0.0]} mat={glow('#ff2a2a')} />
    </group>
  )
}
