import { useFrame } from '@react-three/fiber'
import { CircleGeometry } from 'three'
import { PI } from '../../kit'
import { MeltedClock } from '../living/oddities'
import { BOX, glow, gloss, MAT, POP, printed, printed2, tiled } from './parts'
import { Box, Cyl, Print, Rod } from './Prims'
import { DOORWAYS, HALL, roofY } from './plan'
import { once } from '../../outsideLayers'
import { lunette, shellMaterials, sunburst } from './shell'
import { clockTexture, moonTexture, sign, trainWindowsTexture } from './textures'

/*
 * The south end of the concourse, and the clock. The doors, fan window,
 * banner and WAY OUT sign are built with the wall face at z = 0 and the
 * hall towards +z (the room turns them round to face north); outside is -z.
 */

// ---------------------------------------------------------------------------
// The main doors, and what can be seen through them
// ---------------------------------------------------------------------------

const FRAME = gloss('#202020')
const FAN = new CircleGeometry(1, 32, 0, PI)

function Doors({ x, half, spring, height }: { x: number; half: number; spring: number; height: number }) {
  const leaf = half
  return (
    <group position={[x, 0, -0.05]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * leaf) / 2, 0, 0]}>
          <Box size={[leaf - 0.04, height - 0.1, 0.01]} at={[0, height / 2, 0]} mat={MAT.glass} shadow={false} />
          <Box size={[0.08, height, 0.08]} at={[(s * (leaf - 0.08)) / 2, height / 2, 0]} mat={FRAME} />
          <Box size={[0.08, height, 0.08]} at={[(-s * (leaf - 0.08)) / 2, height / 2, 0]} mat={FRAME} />
          <Box size={[leaf, 0.14, 0.08]} at={[0, 0.07, 0]} mat={FRAME} />
          <Box size={[leaf * 0.7, 0.04, 0.06]} at={[0, 1.05, 0.08]} mat={MAT.chrome} />
        </group>
      ))}
      {/* the transom, and glass above it up into the arch */}
      <Box size={[half * 2, 0.12, 0.1]} at={[0, height + 0.06, 0]} mat={FRAME} />
      <Box size={[half * 2, spring - height - 0.12, 0.01]} at={[0, (spring + height + 0.12) / 2, 0]} mat={MAT.glass} shadow={false} />
      <mesh geometry={FAN} material={MAT.glass} position={[0, spring, 0]} scale={[half, half, 1]} />
      {[-0.5, 0, 0.5].map((f) => (
        <Rod key={f} a={[0, spring, 0.02]} b={[Math.sin(f * 1.4) * half, spring + Math.cos(f * 1.4) * half, 0.02]} r={0.025} mat={FRAME} />
      ))}
    </group>
  )
}

const BUS_RED = gloss('#e01a22')

/** A red double-decker waiting at the kerb, side on, built along x. */
function Bus() {
  const windows = printed(trainWindowsTexture(false))
  return (
    <group>
      <Box size={[10.4, 4.1, 2.5]} at={[0, 2.35, 0]} mat={BUS_RED} />
      <Box size={[10.2, 0.12, 2.3]} at={[0, 4.42, 0]} mat={MAT.white} />
      {[1.75, 3.55].map((y) => (
        <mesh key={y} geometry={tiled(9.6, 0.85, 4, 0.85)} material={windows} position={[0.1, y, 1.255]} />
      ))}
      <Print map={sign('CENTRAL ⇄ SEAFRONT', '#ffd21f', '#141414', 1024, 96)} w={4.2} h={0.4} at={[-0.8, 2.65, 1.256]} />
      {[-3.6, 3.4].map((x) => (
        <Cyl key={x} r={0.5} h={0.3} at={[x, 0.5, 1.15]} rot={[PI / 2, 0, 0]} mat={MAT.rubber} />
      ))}
    </group>
  )
}

/** Rain coming down outside the doors: sheets of streaks sliding down. */
function Rain() {
  useFrame((_, dt) => {
    const map = shellMaterials().rain.map
    if (map) map.offset.y = (map.offset.y + dt * 2.2) % 1
  })
  return (
    <>
      {[-0.7, -2.3, -4.2].map((z, k) => (
        <mesh key={z} geometry={BOX} material={shellMaterials().rain} position={[k * 0.7, 4, z]} scale={[24, 8, 0.001]} />
      ))}
    </>
  )
}

export function Entrance({ mode }: { mode: 'default' | 'bus' | 'rain' }) {
  return (
    <group>
      {DOORWAYS.map((d) => (
        <Doors key={d.x} x={d.x} half={d.half} spring={d.spring} height={d.x === 0 ? 3.0 : 2.6} />
      ))}
      {mode === 'bus' && (
        <group position={[-1.2, 0, -5.6]}>
          <Bus />
        </group>
      )}
      {mode === 'rain' && <Rain />}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The fan window: the end of the vault over the doors
// ---------------------------------------------------------------------------

const BASE = HALL.wallH
const fanGlass = once(() => lunette(BASE, BASE))
const fanIron = once(() => sunburst(BASE, BASE, 12, '#f2eee4'))

export function FanWindow({ mode }: { mode: 'default' | 'moon' | 'night' }) {
  const m = shellMaterials()
  const glass = fanGlass()
  return (
    <group>
      <mesh geometry={glass} material={m.glass} />
      <mesh geometry={fanIron()} material={m.iron} position={[0, 0, 0.06]} />
      {/* the hub: a half sun in yellow and red */}
      <mesh geometry={FAN} material={glow('#ffb81c')} position={[0, 0.2, 0.1]} scale={[1.6, 1.6, 1]} />
      <mesh geometry={FAN} material={gloss(POP.red)} position={[0, 0.2, 0.09]} scale={[1.85, 1.85, 1]} />
      {mode === 'night' && <mesh geometry={glass} material={m.night} position={[0, 0, -0.15]} />}
      {mode === 'moon' && (
        <mesh position={[4.2, 3.0, -4]}>
          <circleGeometry args={[2.6, 48]} />
          <meshBasicMaterial map={moonTexture()} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The banner and the WAY OUT sign over the doors
// ---------------------------------------------------------------------------

export function Banner({ text }: { text: string }) {
  const w = 9
  const h = 1.2
  return (
    <group position={[0, 0, 0.12]}>
      <mesh geometry={BOX} material={printed2(sign(text, '#ff3fa4', '#ffffff', 1536, 205, 'rim'))} scale={[w, h, 0.01]} castShadow />
      <Rod a={[-w / 2 - 0.1, h / 2 + 0.03, 0]} b={[w / 2 + 0.1, h / 2 + 0.03, 0]} r={0.03} mat={MAT.brass} />
      <Rod a={[-w / 2 - 0.1, -h / 2 - 0.03, 0]} b={[w / 2 + 0.1, -h / 2 - 0.03, 0]} r={0.03} mat={MAT.brass} />
      {[-1, 1].map((s) => (
        <Rod key={s} a={[s * (w / 2 - 0.3), h / 2 + 0.03, 0]} b={[s * (w / 2 - 0.3), h / 2 + 0.5, -0.11]} r={0.008} mat={MAT.black} />
      ))}
    </group>
  )
}

export function ExitSign({ text }: { text: string }) {
  return (
    <group position={[0, 0, 0.12]}>
      {[-0.6, 0.6].map((x) => (
        <Rod key={x} a={[x, 0.24, 0]} b={[x, 0.95, -0.05]} r={0.012} mat={MAT.black} />
      ))}
      <Box size={[1.9, 0.5, 0.08]} at={[0, 0, 0]} mat={MAT.black} />
      <Print map={sign(text, '#22b56a', '#ffffff', 768, 200, 'rim')} w={1.84} h={0.44} at={[0, 0, 0.042]} lit />
    </group>
  )
}

// ---------------------------------------------------------------------------
// The clock, hanging from the roof on a long rod: a face each way
// ---------------------------------------------------------------------------

const CLOCK_R = 0.75

function Hands({ hours, minutes }: { hours: number; minutes: number }) {
  const hour = (((hours % 12) + minutes / 60) / 12) * PI * 2
  const minute = (minutes / 60) * PI * 2
  return (
    <group position={[0, 0, 0.02]}>
      <mesh geometry={BOX} material={MAT.black} rotation={[0, 0, -hour]} position={[Math.sin(hour) * 0.18, Math.cos(hour) * 0.18, 0]} scale={[0.06, 0.42, 0.02]} />
      <mesh geometry={BOX} material={MAT.black} rotation={[0, 0, -minute]} position={[Math.sin(minute) * 0.28, Math.cos(minute) * 0.28, 0.015]} scale={[0.04, 0.62, 0.02]} />
      <mesh geometry={BOX} material={gloss(POP.red)} rotation={[0, 0, -minute]} position={[0, 0, 0.03]} scale={[0.07, 0.07, 0.02]} />
    </group>
  )
}

export function StationClock({ mode }: { mode: 'default' | 'late' | 'backwards' | 'melted' }) {
  const red = gloss(POP.red)
  const face = printed(clockTexture(mode === 'backwards' ? 'backwards' : 'default'))
  const [h, m] = mode === 'late' ? [9, 25] : [6, 10]
  return (
    <group>
      <Rod a={[0, CLOCK_R + 0.1, 0]} b={[0, roofY(0) - 6.4 - 0.2, 0]} r={0.04} mat={MAT.iron} />
      <mesh geometry={BOX} material={MAT.brass} position={[0, CLOCK_R + 0.1, 0]} scale={[0.2, 0.2, 0.2]} rotation={[0, PI / 4, 0]} />
      <Cyl r={CLOCK_R + 0.1} h={0.4} rot={[PI / 2, 0, 0]} mat={red} />
      {[1, -1].map((s) => (
        <group key={s} rotation={[0, s > 0 ? 0 : PI, 0]} position={[0, 0, 0.2 * s]}>
          {mode === 'melted' ? (
            <group position={[0, -0.05, 0.0]}>
              <MeltedClock radius={CLOCK_R} />
            </group>
          ) : (
            <>
              <mesh material={face} position={[0, 0, 0.005]}>
                <circleGeometry args={[CLOCK_R, 48]} />
              </mesh>
              <Hands hours={h} minutes={m} />
            </>
          )}
        </group>
      ))}
    </group>
  )
}

/** A street lamp outside, its lantern lit. */
export function StreetLamp() {
  return (
    <group>
      <Rod a={[0, 0, 0]} b={[0, 4.2, 0]} r={0.07} mat={MAT.iron} />
      <mesh geometry={BOX} material={glow('#ffd98a')} position={[0, 4.4, 0]} scale={[0.3, 0.4, 0.3]} />
      <mesh geometry={BOX} material={MAT.iron} position={[0, 4.65, 0]} scale={[0.4, 0.1, 0.4]} />
    </group>
  )
}
