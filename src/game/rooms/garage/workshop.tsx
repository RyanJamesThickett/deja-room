import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BoxGeometry, CapsuleGeometry, CatmullRomCurve3, ExtrudeGeometry, LatheGeometry, MeshStandardMaterial, Shape, TorusGeometry, TubeGeometry, Vector2, Vector3, type Group } from 'three'
import { Block, Instanced, PI, type Placement } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { mulberry32 } from '../../rng'
import { Strut } from './car'
import { TYRE_GEO } from './carShapes'
import { BENCH } from './layout'
import { pegboardTexture } from './textures'

/*
 * The workshop's furniture and kit: bench, pegboard, vice, tool chest, parts
 * shelf, oil drums, compressor, tyres, creeper, trolley jack and drain pan.
 * Unless it says otherwise, each is built standing on y = 0 with its front
 * towards +z.
 */

const STEEL = { color: '#6f777e', metalness: 0.6, roughness: 0.45 }
const TYRE = new MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.85 })

// ---------------------------------------------------------------------------
// Bench, pegboard and vice
// ---------------------------------------------------------------------------

/** Steel-framed bench with a thick wooden top, a shelf underneath and the usual clutter. */
export function Workbench() {
  const { length: l, depth: d, height: h } = BENCH
  return (
    <>
      {[-l / 2 + 0.05, -0.7, 0.7, l / 2 - 0.05].flatMap((x) =>
        [-1, 1].map((s) => <Block key={`${x}${s}`} size={[0.05, h - 0.05, 0.05]} position={[x, (h - 0.05) / 2, s * (d / 2 - 0.05)]} {...STEEL} />),
      )}
      <Block size={[l - 0.04, 0.025, d - 0.06]} position={[0, 0.2, 0]} {...STEEL} />
      <Block size={[l, 0.05, d]} position={[0, h - 0.025, 0]} color="#8a6a46" roughness={0.75} radius={0.01} />
      <Block size={[l, 0.07, 0.02]} position={[0, h - 0.085, d / 2 - 0.01]} {...STEEL} />
      {/* on the shelf underneath: boxes, a bucket, oil bottles */}
      <Block size={[0.45, 0.3, 0.4]} position={[-1.4, 0.365, -0.05]} color="#b08a5a" roughness={0.9} />
      <Block size={[0.38, 0.22, 0.36]} position={[-0.9, 0.325, 0.02]} color="#a27d50" roughness={0.9} />
      <mesh position={[0.4, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.3, 20]} />
        <meshStandardMaterial color="#d8342c" roughness={0.6} />
      </mesh>
      {[0.95, 1.08, 1.21, 1.34].map((x, i) => (
        <Block key={x} size={[0.1, 0.26, 0.07]} position={[x, 0.345, 0.1]} color={['#1f8f4e', '#1f8f4e', '#f2c230', '#1f6bff'][i]} roughness={0.4} radius={0.012} />
      ))}
    </>
  )
}

/** Things left on the bench top, origin on the bench top at its middle: a mug, an oily rag, a grease gun. */
export function BenchClutter() {
  return (
    <>
      <mesh position={[0.9, 0.045, 0.1]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.09, 16]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.4} />
      </mesh>
      <Block size={[0.3, 0.02, 0.22]} position={[0.3, 0.01, 0.12]} rotation={[0, 0.4, 0]} color="#8a2d22" roughness={1} radius={0.008} />
      <group position={[-0.3, 0.035, 0.05]} rotation={[0, 0.3, PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.35, 16]} />
          <meshStandardMaterial color="#d8342c" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </>
  )
}

const OUTLINE = '#e9e3d3'
const SPANNERS = Array.from({ length: 8 }, (_, i) => ({ x: -0.95 + i * 0.09, length: 0.17 + i * 0.018 }))
const SCREWDRIVERS = Array.from({ length: 5 }, (_, i) => ({ x: -0.15 + i * 0.07, colour: i % 2 ? '#f2c230' : '#d8342c' }))
const HAMMERS = [0.34, 0.56]
const PLIERS = [-0.9, -0.76, -0.62]
/** The spanner that turns into a fish, and the hammer that goes missing. */
const FISH_SPANNER = 5
const GONE_HAMMER = 1

function Spanner({ length }: { length: number }) {
  return (
    <>
      <Block size={[0.042, 0.028, 0.007]} color="#c9ced6" metalness={0.85} roughness={0.25} radius={0.003} />
      <Block size={[0.018, length, 0.006]} position={[0, -length / 2, 0]} color="#c9ced6" metalness={0.85} roughness={0.25} radius={0.003} />
      <mesh position={[0, -length - 0.012, 0]}>
        <torusGeometry args={[0.016, 0.006, 8, 20]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.85} roughness={0.25} />
      </mesh>
    </>
  )
}

/**
 * A mackerel, hung up by its tail on the spanner's hook: forked tail fin at
 * the top, head hanging down, its side to the room.
 */
function Fish() {
  const skin = { color: '#8fa7b8', metalness: 0.5, roughness: 0.3 }
  const fin = { color: '#4f6476', metalness: 0.4, roughness: 0.35 }
  return (
    <>
      {/* the tail fin fans out wide above the narrow wrist of the tail */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.017, -0.028, 0]} rotation={[0, 0, -s * 0.6]} scale={[0.01, 0.032, 0.004]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial {...fin} />
        </mesh>
      ))}
      <mesh position={[0, -0.165, 0]} scale={[0.036, 0.125, 0.018]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial {...skin} />
      </mesh>
      {/* dark wavy bars along its back (the +x edge), a dorsal fin, a pale belly */}
      {[-0.1, -0.13, -0.16, -0.19].map((y, i) => (
        <mesh key={y} position={[0.016, y, 0.0135]} rotation={[0, 0, 0.5 + (i % 2) * 0.3]}>
          <boxGeometry args={[0.024, 0.006, 0.002]} />
          <meshStandardMaterial color="#263845" roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.036, -0.13, 0]} rotation={[0, 0, -0.2]} scale={[0.012, 0.03, 0.003]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial {...fin} />
      </mesh>
      <mesh position={[-0.014, -0.18, 0.012]} scale={[0.012, 0.07, 0.006]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#e6ebee" metalness={0.3} roughness={0.35} />
      </mesh>
      {/* gill line, an eye near the bottom, the mouth at the very end */}
      <mesh position={[0, -0.24, 0.0125]} rotation={[0, 0, PI / 2]}>
        <torusGeometry args={[0.022, 0.0018, 4, 12, PI]} />
        <meshStandardMaterial color="#3a4a56" roughness={0.4} />
      </mesh>
      <mesh position={[0.006, -0.258, 0.011]}>
        <sphereGeometry args={[0.008, 10, 8]} />
        <meshStandardMaterial color="#f2f0e6" roughness={0.2} />
      </mesh>
      <mesh position={[0.006, -0.259, 0.0175]}>
        <sphereGeometry args={[0.0045, 8, 6]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[-0.004, -0.284, 0.004]}>
        <boxGeometry args={[0.012, 0.003, 0.01]} />
        <meshBasicMaterial color="#1a2228" />
      </mesh>
    </>
  )
}
/** Flat painted silhouettes on the board: where each tool lives. */
function Outline({ rects }: { rects: [number, number, number, number][] }) {
  return (
    <>
      {rects.map(([w, h, x, y], i) => (
        <mesh key={i} position={[x, y, 0.0005]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color={OUTLINE} roughness={0.9} />
        </mesh>
      ))}
    </>
  )
}

function Hammer() {
  return (
    <>
      <Block size={[0.12, 0.035, 0.03]} color="#3a3d40" metalness={0.7} roughness={0.35} radius={0.005} />
      <Block size={[0.022, 0.29, 0.018]} position={[0, -0.16, 0]} color="#b98a52" roughness={0.6} radius={0.006} />
    </>
  )
}

/** Tools hang this far in front of the board's origin. */
const TOOL_Z = 0.052

/**
 * The two tools on the board that can change, in board space: a spanner
 * (or a fish) and a hammer (or just its painted outline).
 */
export function PegboardTools({ mode }: { mode: 'normal' | 'fish' | 'gone' }) {
  const spanner = SPANNERS[FISH_SPANNER]
  return (
    <>
      <group position={[spanner.x, 0.42, TOOL_Z]}>{mode === 'fish' ? <Fish /> : <Spanner length={spanner.length} />}</group>
      {mode !== 'gone' && (
        <group position={[HAMMERS[GONE_HAMMER], 0.38, TOOL_Z]}>
          <Hammer />
        </group>
      )}
    </>
  )
}

/**
 * A shadow board of hand tools above the bench, 2.3 m × 1.1 m, centred on
 * its origin with the board's face at z = 0.04. The two tools that can
 * change are in PegboardTools.
 */
export function Pegboard() {
  const map = useMemo(() => pegboardTexture(2.3 / 0.5, 1.1 / 0.5), [])
  return (
    <>
      <mesh position={[0, 0, 0.03]} receiveShadow>
        <boxGeometry args={[2.3, 1.1, 0.02]} />
        <meshStandardMaterial map={map} roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <Block key={s} size={[2.34, 0.03, 0.03]} position={[0, s * 0.565, 0.035]} color="#3a3d40" roughness={0.6} />
      ))}
      <group position={[0, 0, TOOL_Z - 0.012]}>
        {SPANNERS.map(({ x, length }) => (
          <Outline key={x} rects={[[0.05, length + 0.06, x, 0.42 - length / 2 - 0.01]]} />
        ))}
        {SCREWDRIVERS.map(({ x }) => (
          <Outline key={x} rects={[[0.036, 0.25, x, 0.27]]} />
        ))}
        {HAMMERS.map((x) => (
          <Outline key={x} rects={[[0.14, 0.05, x, 0.38], [0.036, 0.31, x, 0.22]]} />
        ))}
        <group position={[0, 0, 0.012]}>
          {SPANNERS.map(({ x, length }, i) =>
            i === FISH_SPANNER ? null : (
              <group key={x} position={[x, 0.42, 0]}>
                <Spanner length={length} />
              </group>
            ),
          )}
          {SCREWDRIVERS.map(({ x, colour }) => (
            <group key={x} position={[x, 0.4, 0]}>
              <mesh position={[0, -0.05, 0]}>
                <cylinderGeometry args={[0.014, 0.012, 0.1, 12]} />
                <meshStandardMaterial color={colour} roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.165, 0]}>
                <cylinderGeometry args={[0.0035, 0.0035, 0.13, 6]} />
                <meshStandardMaterial color="#c9ced6" metalness={0.85} roughness={0.25} />
              </mesh>
            </group>
          ))}
          {HAMMERS.map((x, i) =>
            i === GONE_HAMMER ? null : (
              <group key={x} position={[x, 0.38, 0]}>
                <Hammer />
              </group>
            ),
          )}
          {PLIERS.map((x) => (
            <group key={x} position={[x, -0.12, 0]}>
              <Block size={[0.03, 0.06, 0.01]} position={[0, 0.08, 0]} color="#8a9096" metalness={0.8} roughness={0.3} radius={0.003} />
              {[-1, 1].map((s) => (
                <Block key={s} size={[0.016, 0.15, 0.012]} position={[s * 0.016, -0.02, 0]} rotation={[0, 0, s * 0.12]} color="#d8342c" roughness={0.5} radius={0.004} />
              ))}
            </group>
          ))}
          {/* hacksaw */}
          <group position={[0.2, -0.26, 0]}>
            <Block size={[0.46, 0.02, 0.012]} position={[0, 0.07, 0]} color="#1f6bff" roughness={0.4} radius={0.004} />
            <Block size={[0.44, 0.012, 0.004]} position={[0, -0.07, 0]} color="#d9dde2" metalness={0.85} roughness={0.25} radius={0.001} />
            {[-1, 1].map((s) => (
              <Block key={s} size={[0.016, 0.16, 0.012]} position={[s * 0.22, 0, 0]} color="#1f6bff" roughness={0.4} radius={0.004} />
            ))}
            <Block size={[0.05, 0.1, 0.02]} position={[-0.27, -0.01, 0]} color="#111" roughness={0.6} radius={0.008} />
          </group>
          {/* a rail of sockets */}
          <Block size={[0.5, 0.02, 0.012]} position={[-0.7, -0.38, 0]} color="#d8342c" roughness={0.5} radius={0.004} />
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[-0.92 + i * 0.055, -0.36 + i * 0.002, 0.012]} rotation={[PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012 + i * 0.0015, 0.012 + i * 0.0015, 0.035, 12]} />
              <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
          {/* tape measure and a roll of duct tape on hooks */}
          <Block size={[0.07, 0.07, 0.035]} position={[0.75, 0.0, 0.01]} color="#f2c230" roughness={0.4} radius={0.012} />
          <mesh position={[0.85, -0.25, 0.02]}>
            <torusGeometry args={[0.05, 0.022, 10, 24]} />
            <meshStandardMaterial color="#9aa0a6" roughness={0.5} />
          </mesh>
        </group>
      </group>
    </>
  )
}

const VICE_SCALE = 1.4
const TEETH = Array.from({ length: 6 }, (_, i) => -0.07 + i * 0.028)

/**
 * A big engineer's vice bolted to the bench, origin on the bench top, jaws
 * across x and the screw handle towards +z. It grips a bit of pipe, or a
 * rubber duck, or it has grown teeth and is biting the pipe.
 */
export function Vice({ holds }: { holds: 'pipe' | 'duck' | 'teeth' }) {
  const blue = { color: '#2b5d9b', metalness: 0.4, roughness: 0.45 }
  const teeth = holds === 'teeth'
  return (
    <group scale={VICE_SCALE}>
      <mesh position={[0, 0.02, -0.04]} castShadow>
        <cylinderGeometry args={[0.1, 0.11, 0.04, 28]} />
        <meshStandardMaterial {...blue} />
      </mesh>
      <Block size={[0.12, 0.09, 0.28]} position={[0, 0.085, 0]} {...blue} />
      <Block size={[0.18, 0.08, 0.05]} position={[0, 0.16, -0.06]} {...blue} />
      <Block size={[0.18, 0.08, 0.05]} position={[0, 0.16, 0.06]} {...blue} />
      {/* the anvil on the back of the fixed jaw */}
      <Block size={[0.1, 0.03, 0.07]} position={[0, 0.215, -0.1]} color="#3a3d40" metalness={0.7} roughness={0.4} />
      {[-1, 1].map((s) =>
        teeth ? (
          // pink gums where the jaw plates were, and a row of teeth along each
          <group key={s}>
            <Block size={[0.18, 0.04, 0.008]} position={[0, 0.18, s * 0.034]} color="#d9707a" roughness={0.5} radius={0.003} />
            {TEETH.map((x) => (
              // pointing in at the pipe from each jaw
              <mesh key={x} position={[x, 0.208, s * 0.024]} rotation={[-s * (PI / 2), 0, 0]}>
                <coneGeometry args={[0.012, 0.03, 4]} />
                <meshStandardMaterial color="#f6f2e2" roughness={0.3} />
              </mesh>
            ))}
          </group>
        ) : (
          <Block key={s} size={[0.17, 0.035, 0.006]} position={[0, 0.18, s * 0.034]} color="#3a3d40" metalness={0.8} roughness={0.4} radius={0.002} />
        ),
      )}
      <mesh position={[0, 0.11, 0.14]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 10]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.04, 0.11, 0.2]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.26, 8]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.85} roughness={0.25} />
      </mesh>
      {[-0.09, 0.17].map((x) => (
        <mesh key={x} position={[x, 0.11, 0.2]}>
          <sphereGeometry args={[0.014, 10, 8]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}
      {holds === 'duck' ? (
        <Model id="rubber_duck_toy" position={[0, 0.125, 0]} rotation={[0, PI / 2, 0]} scale={[0.32, 0.62, 0.62]} paint={false} />
      ) : (
        <mesh position={[0.05, 0.17, 0]} rotation={[0, 0, PI / 2]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.42, 16]} />
          <meshStandardMaterial color="#8b6f4e" metalness={0.6} roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}
// ---------------------------------------------------------------------------
// Tool chest
// ---------------------------------------------------------------------------

const DRAWERS = [0.1, 0.1, 0.12, 0.12, 0.17, 0.2]
const CAB = { width: 0.72, depth: 0.46, base: 0.12 }

function Castor() {
  return (
    <>
      <Block size={[0.05, 0.05, 0.05]} position={[0, 0.095, 0]} color="#3a3d40" metalness={0.6} roughness={0.4} />
      <mesh position={[0, 0.04, 0]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <meshStandardMaterial color="#1c1c1e" roughness={0.8} />
      </mesh>
    </>
  )
}

/** A chicken's foot, where a castor should be. */
function BirdFoot() {
  const skin = { color: '#e3a33a', roughness: 0.7 }
  return (
    <>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.014, 0.018, 0.1, 10]} />
        <meshStandardMaterial {...skin} />
      </mesh>
      {[-0.55, 0, 0.55, PI].map((a) => (
        <group key={a} position={[0, 0.012, 0]} rotation={[0, a, 0]}>
          <mesh position={[0, 0, a === PI ? 0.035 : 0.055]} rotation={[PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.009, a === PI ? 0.05 : 0.09, 4, 8]} />
            <meshStandardMaterial {...skin} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/**
 * Red roll cab on castors with the portable chest on top. `drawer`: one
 * drawer left pulled out. `feet`: it's standing on chicken's feet.
 */
export function ToolChest({ mode }: { mode: 'normal' | 'drawer' | 'feet' }) {
  const { width: w, depth: d, base } = CAB
  const height = DRAWERS.reduce((a, b) => a + b, 0) + 0.06
  const red = { color: '#c4231d', metalness: 0.35, roughness: 0.35 }
  // drawers stacked down from the top, each one's centre below the ones above it
  const fronts = DRAWERS.map((h, i) => ({ h, y: base + height - 0.03 - DRAWERS.slice(0, i + 1).reduce((a, b) => a + b, 0) + h / 2, i }))
  return (
    <>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06)]}>
            {mode === 'feet' ? <BirdFoot /> : <Castor />}
          </group>
        )),
      )}
      <Block size={[w, height, d]} position={[0, base + height / 2, 0]} {...red} radius={0.01} paint />
      <Block size={[w + 0.02, 0.02, d + 0.02]} position={[0, base + height + 0.01, 0]} color="#1c1c1e" roughness={0.9} />
      {fronts.map(({ h, y: fy, i }) => {
        const out = mode === 'drawer' && i === 1 ? 0.26 : 0
        return (
          <group key={i} position={[0, fy, d / 2 + out]}>
            <Block size={[w - 0.04, h - 0.012, 0.02]} {...red} radius={0.004} paint />
            <Block size={[w - 0.16, 0.014, 0.02]} position={[0, h / 2 - 0.025, 0.018]} color="#d9dde2" metalness={0.9} roughness={0.2} radius={0.005} />
            {out > 0 && (
              <>
                {/* the drawer's sides and the spanners lying in it */}
                {[-1, 1].map((s) => (
                  <Block key={s} size={[0.012, h - 0.03, out]} position={[s * (w / 2 - 0.035), -0.01, -out / 2]} color="#9aa0a6" metalness={0.5} roughness={0.4} />
                ))}
                <Block size={[w - 0.07, 0.008, out]} position={[0, -h / 2 + 0.02, -out / 2]} color="#2a2b2d" roughness={0.9} />
                {[-0.2, -0.1, 0, 0.1, 0.2].map((x) => (
                  <Block key={x} size={[0.025, 0.006, 0.2]} position={[x, -h / 2 + 0.028, -out / 2]} color="#c9ced6" metalness={0.85} roughness={0.25} radius={0.002} />
                ))}
              </>
            )}
          </group>
        )
      })}
      <Model id="metal_tool_chest" position={[0, base + height + 0.02, 0]} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Parts shelf
// ---------------------------------------------------------------------------

const SHELF = { width: 1.8, depth: 0.45, levels: [0.08, 0.55, 1.02, 1.49, 1.96] }
const UNIT_BOX = new BoxGeometry(1, 1, 1)
const BOX_MATS = [
  new MeshStandardMaterial({ color: '#b08a5a', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#f1efe8', roughness: 0.8 }),
  new MeshStandardMaterial({ color: '#1f5fa8', roughness: 0.5 }),
  new MeshStandardMaterial({ color: '#d8342c', roughness: 0.6 }),
]
/** Which shelf `gone` clears, and where the glowing box sits. */
const GONE_SHELF = 2
const GLOW_AT = { shelf: 1, index: 2 }

/**
 * Slotted steel racking against the wall, stacked with boxes of parts.
 * Origin at the floor in the middle of the unit, back against the wall.
 */
export function PartsShelf({ mode }: { mode: 'normal' | 'gone' | 'glow' }) {
  const { boxes, glow } = useMemo(() => {
    const rng = mulberry32(64)
    const out: Placement[][] = BOX_MATS.map(() => [])
    let glow: { at: Vec3; size: Vec3 } | null = null
    SHELF.levels.slice(0, 4).forEach((y, shelf) => {
      let x = -SHELF.width / 2 + 0.06
      let index = 0
      while (true) {
        const w = 0.22 + rng() * 0.2
        if (x + w > SHELF.width / 2 - 0.06) break
        const h = 0.16 + rng() * 0.22
        const dz = 0.26 + rng() * 0.12
        const at: Vec3 = [x + w / 2, y + 0.02 + h / 2, SHELF.depth / 2 - dz / 2 - 0.02]
        const kind = shelf === 0 ? 0 : Math.floor(rng() * BOX_MATS.length)
        const skip = (mode === 'gone' && shelf === GONE_SHELF) || (mode === 'glow' && shelf === GLOW_AT.shelf && index === GLOW_AT.index)
        if (mode === 'glow' && shelf === GLOW_AT.shelf && index === GLOW_AT.index) glow = { at, size: [w - 0.01, h, dz] }
        if (!skip) out[kind].push({ at, scale: [w - 0.01, h, dz] })
        x += w + 0.01
        index++
      }
    })
    return { boxes: out, glow: glow as { at: Vec3; size: Vec3 } | null }
  }, [mode])
  const { width: w, depth: d, levels } = SHELF
  return (
    <>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Block key={`${sx}${sz}`} size={[0.05, 2.0, 0.05]} position={[sx * (w / 2 - 0.025), 1.0, sz * (d / 2 - 0.025)]} color="#2a5caa" roughness={0.5} metalness={0.3} />
        )),
      )}
      {levels.map((y) => (
        <group key={y}>
          <Block size={[w - 0.1, 0.02, d - 0.02]} position={[0, y, 0]} color="#b8bdc0" metalness={0.5} roughness={0.45} radius={0.003} />
          {[-1, 1].map((s) => (
            <Block key={s} size={[w - 0.1, 0.06, 0.03]} position={[0, y - 0.02, s * (d / 2 - 0.025)]} color="#e8771e" roughness={0.5} radius={0.004} />
          ))}
        </group>
      ))}
      {boxes.map((items, i) => (
        <Instanced key={i} geometry={UNIT_BOX} material={BOX_MATS[i]} items={items} />
      ))}
      {glow && (
        <group position={glow.at}>
          {/* a box with its lid up and something bright inside */}
          <Block size={[glow.size[0], glow.size[1] - 0.02, glow.size[2]]} position={[0, -0.01, 0]} color="#b08a5a" roughness={0.9} radius={0.003} />
          <mesh position={[0, glow.size[1] / 2 - 0.018, 0]} rotation={[-PI / 2, 0, 0]}>
            <planeGeometry args={[glow.size[0] - 0.02, glow.size[2] - 0.02]} />
            <meshBasicMaterial color="#9dff7a" toneMapped={false} />
          </mesh>
          <Block size={[glow.size[0], 0.008, glow.size[2] * 0.6]} position={[0, glow.size[1] / 2 + 0.03, -glow.size[2] / 2 + 0.02]} rotation={[-1.1, 0, 0]} color="#a27d50" roughness={0.9} />
        </group>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Oil drums
// ---------------------------------------------------------------------------

const HOOP = new TorusGeometry(0.292, 0.012, 8, 40)

function Drum({ colour, paint }: { colour: string; paint?: boolean }) {
  return (
    <>
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow userData={{ paint }}>
        <cylinderGeometry args={[0.29, 0.29, 0.88, 36]} />
        <meshStandardMaterial color={colour} metalness={0.4} roughness={0.45} />
      </mesh>
      {[0.012, 0.29, 0.59, 0.868].map((y) => (
        <mesh key={y} geometry={HOOP} position={[0, y, 0]} rotation={[PI / 2, 0, 0]}>
          <meshStandardMaterial color={colour} metalness={0.4} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0.15, 0.89, 0.05]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
      </mesh>
    </>
  )
}

/** Two 205-litre oil drums: red with a tap, blue with a hand pump. `ooze`: the red one is leaking something green. */
export function OilDrums({ ooze }: { ooze: boolean }) {
  return (
    <>
      <group position={[-0.33, 0, 0]}>
        <Drum colour="#b8322a" paint />
        <mesh position={[0, 0.16, 0.3]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.06, 10]} />
          <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.3} />
        </mesh>
        {ooze && (
          <>
            <mesh position={[0, 0.085, 0.33]}>
              <cylinderGeometry args={[0.008, 0.012, 0.15, 8]} />
              <meshStandardMaterial color="#7dff4f" emissive="#4fff2a" emissiveIntensity={1.2} roughness={0.1} />
            </mesh>
            {[
              [0, 0.42, 0.16],
              [-0.12, 0.6, 0.12],
              [0.09, 0.72, 0.09],
              [-0.05, 0.84, 0.06],
            ].map(([x, z, r], i) => (
              <mesh key={i} position={[x, 0.004 + i * 0.0005, z]} rotation={[-PI / 2, 0, 0]} scale={[1, 1.3, 1]}>
                <circleGeometry args={[r, 28]} />
                <meshStandardMaterial color="#7dff4f" emissive="#4fff2a" emissiveIntensity={0.9} roughness={0.05} />
              </mesh>
            ))}
          </>
        )}
      </group>
      <group position={[0.33, 0, 0]}>
        <Drum colour="#1f4fa0" />
        <mesh position={[-0.08, 1.12, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.48, 12]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
        </mesh>
        <Block size={[0.04, 0.04, 0.26]} position={[-0.08, 1.37, 0.08]} color="#d8342c" roughness={0.5} radius={0.01} />
        <mesh position={[-0.08, 1.22, 0.1]} rotation={[PI / 2.6, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Compressor
// ---------------------------------------------------------------------------

const COILS = Array.from({ length: 5 }, (_, k) => ({ at: [0.555 - k * 0.006, 1.62 - k * 0.012, k * 0.014 - 0.03] as Vec3, r: 0.22 + (k % 2) * 0.012 }))
const HOSE_END: Vec3 = [0.4, 1.04, 0.24]

const HOSE_COLOUR = '#f2c230'

/**
 * The free end of the air line, in compressor space. `snake`: it's a snake's
 * head. `balloon`: someone is blowing up a balloon on it.
 */
export function HoseEnd({ mode }: { mode: 'normal' | 'snake' | 'balloon' }) {
  if (mode === 'snake')
    return (
      <group position={HOSE_END} rotation={[0, -PI / 2, 0]}>
        {/* the hose's end has a head now, looking out at the workshop */}
        <group rotation={[0.5, 0, 0]}>
          <mesh position={[0, 0, 0.03]} scale={[0.75, 0.55, 1.15]}>
            <sphereGeometry args={[0.04, 16, 12]} />
            <meshStandardMaterial color={HOSE_COLOUR} roughness={0.45} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.022, 0.014, 0.05]}>
              <sphereGeometry args={[0.007, 8, 6]} />
              <meshBasicMaterial color="#111" />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.004, 0.002, 0.05]} position={[s * 0.006, -0.008, 0.095]} rotation={[0, s * 0.25, 0]} color="#d8342c" roughness={0.5} radius={0.0008} />
          ))}
        </group>
      </group>
    )
  return (
    <group position={HOSE_END}>
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.06, 10]} />
        <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.3} />
      </mesh>
      {mode === 'balloon' && (
        <>
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.01, 0.02, 0.04, 10]} />
            <meshStandardMaterial color="#d8342c" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.24, 0]} scale={[1, 1.15, 1]} castShadow>
            <sphereGeometry args={[0.15, 28, 20]} />
            <meshPhysicalMaterial color="#e8261d" roughness={0.2} clearcoat={1} />
          </mesh>
        </>
      )}
    </group>
  )
}

/**
 * Wheeled air compressor, its tank along z, with the yellow air line coiled
 * on a hook on the wall behind it (the wall is at x = +0.6). The hose's free
 * end is in HoseEnd.
 */
export function Compressor() {
  const geos = useMemo(() => {
    const feed = new CatmullRomCurve3([new Vector3(0.12, 0.62, 0.3), new Vector3(0.35, 0.8, 0.32), new Vector3(0.52, 1.2, 0.2), new Vector3(0.55, 1.42, 0.08)])
    const drop = new CatmullRomCurve3([new Vector3(0.55, 1.45, 0.2), new Vector3(0.5, 1.3, 0.25), new Vector3(0.44, 1.15, 0.24), new Vector3(...HOSE_END)])
    return { feed: new TubeGeometry(feed, 30, 0.011, 8), drop: new TubeGeometry(drop, 20, 0.011, 8) }
  }, [])
  const hoseMat = <meshStandardMaterial color={HOSE_COLOUR} roughness={0.45} />
  return (
    <>
      <mesh position={[0, 0.32, 0]} rotation={[PI / 2, 0, 0]} castShadow userData={{ paint: true }}>
        <capsuleGeometry args={[0.2, 0.5, 8, 24]} />
        <meshStandardMaterial color="#22508a" metalness={0.4} roughness={0.4} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.2, 0.09, -0.3]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.05, 20]} />
          <meshStandardMaterial color="#1c1c1e" roughness={0.8} />
        </mesh>
      ))}
      <Block size={[0.24, 0.13, 0.05]} position={[0, 0.065, 0.32]} color="#1c1c1e" roughness={0.8} />
      {/* handle */}
      <Block size={[0.03, 0.5, 0.03]} position={[-0.14, 0.62, 0.42]} color="#1c1c1e" roughness={0.6} />
      <Block size={[0.03, 0.5, 0.03]} position={[0.14, 0.62, 0.42]} color="#1c1c1e" roughness={0.6} />
      <Block size={[0.31, 0.04, 0.04]} position={[0, 0.87, 0.42]} color="#1c1c1e" roughness={0.6} />
      {/* motor, pump and belt guard on top of the tank */}
      <mesh position={[0, 0.63, -0.16]} rotation={[0, 0, PI / 2]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.3, 20]} />
        <meshStandardMaterial color="#222426" roughness={0.6} />
      </mesh>
      <Block size={[0.17, 0.2, 0.17]} position={[0.03, 0.62, 0.12]} color="#8a9096" metalness={0.6} roughness={0.4} />
      {[0.66, 0.69, 0.72].map((y) => (
        <Block key={y} size={[0.2, 0.01, 0.2]} position={[0.03, y, 0.12]} color="#8a9096" metalness={0.6} roughness={0.4} radius={0.003} />
      ))}
      <Block size={[0.04, 0.22, 0.45]} position={[-0.19, 0.6, -0.02]} color="#d8342c" roughness={0.5} radius={0.01} />
      {/* pressure switch and gauge, facing out into the room */}
      <Block size={[0.09, 0.1, 0.08]} position={[0.12, 0.58, 0.3]} color="#1c1c1e" roughness={0.6} />
      <mesh position={[-0.05, 0.6, 0.31]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 20]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.061, 0.6, 0.31]} rotation={[0, -PI / 2, 0]}>
        <circleGeometry args={[0.028, 20]} />
        <meshStandardMaterial color="#f8f6ee" roughness={0.5} />
      </mesh>
      {/* the air line: up to its hook on the wall, coiled, and hanging down */}
      <mesh geometry={geos.feed}>{hoseMat}</mesh>
      <Block size={[0.06, 0.04, 0.04]} position={[0.58, 1.85, 0]} color="#3a3d40" metalness={0.6} roughness={0.4} />
      {COILS.map(({ at, r }, k) => (
        <mesh key={k} position={at} rotation={[0, PI / 2, 0]}>
          <torusGeometry args={[r, 0.011, 8, 40]} />
          {hoseMat}
        </mesh>
      ))}
      <mesh geometry={geos.drop}>{hoseMat}</mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tyres
// ---------------------------------------------------------------------------

const SPRINKLE = new CapsuleGeometry(0.005, 0.018, 2, 6)
const SPRINKLE_MATS = ['#ffffff', '#1f6bff', '#ffde21', '#2fbf71'].map((color) => new MeshStandardMaterial({ color, roughness: 0.5 }))

/** A ring doughnut, pink icing and sprinkles, exactly the size of a tyre. */
function Doughnut() {
  const sprinkles = useMemo(() => {
    const rng = mulberry32(5)
    const out: Placement[][] = SPRINKLE_MATS.map(() => [])
    for (let i = 0; i < 70; i++) {
      const a = rng() * PI * 2
      const off = (rng() - 0.5) * 0.15
      const r = 0.21 + off
      const y = 0.05 + 0.6 * Math.sqrt(Math.max(0, 0.0104 - off * off))
      out[i % SPRINKLE_MATS.length].push({ at: [Math.cos(a) * r, y + 0.004, Math.sin(a) * r], rot: [PI / 2, rng() * PI, rng() * PI] })
    }
    return out
  }, [])
  return (
    <>
      <mesh rotation={[PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.21, 0.1, 16, 40]} />
        <meshStandardMaterial color="#d9a35f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.05, 0]} scale={[1, 1, 0.6]} rotation={[PI / 2, 0, 0]}>
        <torusGeometry args={[0.21, 0.102, 16, 40]} />
        <meshStandardMaterial color="#ff7eb6" roughness={0.3} />
      </mesh>
      {sprinkles.map((items, i) => (
        <Instanced key={i} geometry={SPRINKLE} material={SPRINKLE_MATS[i]} items={items} />
      ))}
    </>
  )
}

/**
 * Old tyres stacked flat. `lean`: each one sits further out than the one
 * below, so the stack overhangs its base and somehow stays up. `donut`:
 * the top tyre is a doughnut.
 */
export function TyreStack({ count, mode = 'normal' }: { count: number; mode?: 'normal' | 'lean' | 'donut' }) {
  const rng = mulberry32(count * 7)
  const tyres = Array.from({ length: count }, (_, i) => ({
    at: [(rng() - 0.5) * 0.03, 0.1 + i * 0.205, (rng() - 0.5) * 0.03 - (mode === 'lean' ? 0.05 * i * i : 0)] as Vec3,
    tilt: mode === 'lean' ? -0.05 * i : 0,
    top: i === count - 1,
  }))
  return (
    <>
      {tyres.map(({ at, tilt, top }, i) =>
        top && mode === 'donut' ? (
          <group key={i} position={at}>
            <Doughnut />
          </group>
        ) : (
          <mesh key={i} geometry={TYRE_GEO} material={TYRE} position={at} rotation={[tilt, i * 0.7, 0]} castShadow receiveShadow />
        ),
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Creeper, trolley jack, drain pan
// ---------------------------------------------------------------------------

function Boot({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <Block size={[0.11, 0.03, 0.3]} position={[0, 0.015, 0]} color="#2a1c12" roughness={0.9} radius={0.01} />
      <Block size={[0.1, 0.17, 0.13]} position={[0, 0.115, 0.07]} color="#4a3020" roughness={0.7} radius={0.03} />
      <Block size={[0.1, 0.08, 0.18]} position={[0, 0.07, -0.07]} color="#4a3020" roughness={0.7} radius={0.035} />
    </group>
  )
}

/** Mechanic's creeper: a padded board on six castors. `boots`: someone's left their boots on it. */
export function Creeper({ boots }: { boots: boolean }) {
  return (
    <>
      <Block size={[0.46, 0.035, 0.98]} position={[0, 0.11, 0]} color="#1f3f7a" roughness={0.5} radius={0.015} paint />
      <Block size={[0.3, 0.05, 0.18]} position={[0, 0.15, -0.37]} color="#18191b" roughness={0.8} radius={0.02} />
      {[-0.38, 0, 0.38].flatMap((z) =>
        [-1, 1].map((s) => (
          <group key={`${z}${s}`} position={[s * 0.18, 0, z]}>
            <Block size={[0.03, 0.04, 0.04]} position={[0, 0.075, 0]} color="#3a3d40" metalness={0.6} roughness={0.4} />
            <mesh position={[0, 0.03, 0]} rotation={[0, 0, PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.025, 12]} />
              <meshStandardMaterial color="#1c1c1e" roughness={0.8} />
            </mesh>
          </group>
        )),
      )}
      {boots && (
        <group position={[0, 0.128, 0.18]} rotation={[0, 0.15, 0]}>
          <Boot x={-0.09} />
          <Boot x={0.09} />
        </group>
      )}
    </>
  )
}

const JACK_RED = { color: '#c8281e', metalness: 0.35, roughness: 0.4 }
const JACK_STEEL = { color: '#3a3d40', metalness: 0.6, roughness: 0.4 }
/** The jack's own space: nose (saddle end) at -z, pump and handle at +z. */
const JACK = { nose: -0.52, tail: 0.3, half: 0.15, pivot: [0, 0.13, 0.08] as Vec3, arm: 0.56, handle: 0.95, handleTilt: 0.78 }

/** One of the chassis' side plates: low at the nose, rising over the pump at the back. Lies in y-z, 12 mm thick along -x. */
const JACK_SIDE = (() => {
  const s = new Shape()
  s.moveTo(JACK.nose, 0.025)
  s.lineTo(0.02, 0.025)
  s.lineTo(0.12, 0.085)
  s.lineTo(JACK.tail, 0.085)
  s.lineTo(JACK.tail, 0.19)
  s.lineTo(0.1, 0.19)
  s.lineTo(JACK.nose + 0.08, 0.105)
  s.lineTo(JACK.nose, 0.095)
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false })
  g.rotateY(-PI / 2)
  return g
})()

/**
 * A low-profile trolley jack: long low chassis on two steel front wheels and
 * two swivel castors at the back, the lifting arm running forward between
 * the side plates to its round saddle, the pump at the back and the long
 * handle rising behind. `raised`: pumped right up with nothing on it.
 */
export function TrolleyJack({ raised }: { raised: boolean }) {
  // the arm pivots at the back; down, the saddle sits just above the nose
  const lift = raised ? 0.62 : -0.04
  const footprint = (JACK.nose + JACK.tail + JACK.handle * Math.cos(JACK.handleTilt)) / 2
  const tip: Vec3 = [0, JACK.pivot[1] + JACK.handle * Math.sin(JACK.handleTilt), JACK.tail + 0.02 + JACK.handle * Math.cos(JACK.handleTilt)]
  const grip = (along: number): Vec3 => [0, tip[1] + along * Math.sin(JACK.handleTilt), tip[2] + along * Math.cos(JACK.handleTilt)]
  return (
    <group position={[0, 0, -footprint + 0.02]}>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={JACK_SIDE} position={[s * JACK.half + (s > 0 ? 0.012 : 0), 0, 0]} castShadow>
          <meshStandardMaterial {...JACK_RED} />
        </mesh>
      ))}
      {/* cross plate over the back, the front axle */}
      <Block size={[JACK.half * 2, 0.012, JACK.tail - 0.1]} position={[0, 0.185, (JACK.tail + 0.1) / 2]} {...JACK_RED} />
      <mesh position={[0, 0.05, JACK.nose + 0.07]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, JACK.half * 2 + 0.09, 10]} />
        <meshStandardMaterial {...JACK_STEEL} />
      </mesh>
      {/* steel front wheels outside the plates, swivel castors under the back */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (JACK.half + 0.035), 0.05, JACK.nose + 0.07]} rotation={[0, 0, PI / 2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 20]} />
            <meshStandardMaterial {...JACK_STEEL} />
          </mesh>
          <group position={[s * 0.1, 0, JACK.tail - 0.07]}>
            <Block size={[0.04, 0.03, 0.05]} position={[0, 0.07, -0.01]} {...JACK_STEEL} />
            <mesh position={[0, 0.032, 0.0]} rotation={[0, 0, PI / 2]}>
              <cylinderGeometry args={[0.032, 0.032, 0.025, 14]} />
              <meshStandardMaterial color="#1c1c1e" roughness={0.8} />
            </mesh>
          </group>
        </group>
      ))}
      {/* pump and reservoir at the back, the ram pushing the arm up */}
      <mesh position={[0, 0.14, 0.2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 18]} />
        <meshStandardMaterial {...JACK_STEEL} />
      </mesh>
      <mesh position={[0, 0.115, 0.02]} rotation={[PI / 2 - 0.1, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.24, 16]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* the lifting arm, and its saddle, which stays level */}
      <group position={JACK.pivot} rotation={[lift, 0, 0]}>
        {[-1, 1].map((s) => (
          <Block key={s} size={[0.014, 0.06, JACK.arm]} position={[s * 0.06, 0, -JACK.arm / 2]} {...JACK_RED} />
        ))}
        <Block size={[0.12, 0.012, JACK.arm - 0.1]} position={[0, 0.024, -JACK.arm / 2 + 0.02]} {...JACK_RED} />
        <group position={[0, 0.02, -JACK.arm + 0.02]} rotation={[-lift, 0, 0]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.03, 0.035, 0.04, 14]} />
            <meshStandardMaterial {...JACK_STEEL} />
          </mesh>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.068, 0.06, 0.025, 24]} />
            <meshStandardMaterial {...JACK_STEEL} />
          </mesh>
          <mesh position={[0, 0.063, 0]} rotation={[PI / 2, 0, 0]}>
            <torusGeometry args={[0.062, 0.008, 6, 24]} />
            <meshStandardMaterial {...JACK_STEEL} />
          </mesh>
        </group>
      </group>
      {/* the handle: a yoke on the pump, a long tube up and back, a black grip */}
      <Block size={[0.1, 0.05, 0.06]} position={[0, JACK.pivot[1] + 0.03, JACK.tail]} {...JACK_RED} />
      <Strut from={[0, JACK.pivot[1] + 0.03, JACK.tail + 0.02]} to={tip} radius={0.016} color="#c8281e" />
      <Strut from={grip(-0.16)} to={grip(0.02)} radius={0.022} color="#1c1c1e" metal={false} />
    </group>
  )
}
const PAN_GEO = new LatheGeometry(
  [
    [0, 0.005],
    [0.28, 0.005],
    [0.33, 0.1],
    [0.34, 0.1],
    [0.29, 0],
    [0, 0],
  ].map(([x, y]) => new Vector2(x, y)),
  36,
)

/** Round drain pan of old black oil. `fish`: a goldfish is swimming round in it. */
export function DrainPan({ fish }: { fish: boolean }) {
  const swimmer = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (swimmer.current) swimmer.current.rotation.y = clock.elapsedTime * 0.9
  })
  return (
    <>
      <mesh geometry={PAN_GEO} receiveShadow castShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#1f2124" roughness={0.6} side={2} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-PI / 2, 0, 0]}>
        <circleGeometry args={[0.31, 36]} />
        <meshStandardMaterial color="#1a120a" roughness={0.04} metalness={0.3} />
      </mesh>
      {fish && (
        <group ref={swimmer} position={[0, 0.075, 0]}>
          {/* turning this way, the fish travels towards -z: head there, tail fanning out behind */}
          <group position={[0.16, 0, 0]}>
            <mesh scale={[0.028, 0.03, 0.06]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#ff8a1f" roughness={0.35} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[0, s * 0.012, 0.074]} rotation={[-s * 0.55, 0, 0]} scale={[0.004, 0.013, 0.026]}>
                <sphereGeometry args={[1, 10, 8]} />
                <meshStandardMaterial color="#ffb347" roughness={0.4} />
              </mesh>
            ))}
            <mesh position={[0, 0.034, 0.005]} scale={[0.003, 0.012, 0.025]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color="#ffb347" roughness={0.4} />
            </mesh>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.019, 0.01, -0.038]}>
                <mesh>
                  <sphereGeometry args={[0.007, 10, 8]} />
                  <meshStandardMaterial color="#f8f4e6" roughness={0.2} />
                </mesh>
                <mesh position={[s * 0.004, 0, -0.002]}>
                  <sphereGeometry args={[0.004, 8, 6]} />
                  <meshBasicMaterial color="#111" />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      )}
    </>
  )
}

/** Tyre-changing machine: cabinet, turntable with clamps, and the mount head on its column. Operator side is +z. */
export function TyreChanger() {
  return (
    <>
      <Block size={[0.65, 0.8, 0.95]} position={[0, 0.4, 0]} color="#c4231d" roughness={0.45} metalness={0.3} />
      <Block size={[0.66, 0.08, 0.96]} position={[0, 0.06, 0]} color="#2a2b2d" roughness={0.6} />
      <mesh position={[0, 0.83, 0.05]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
        <meshStandardMaterial color="#3a3d40" metalness={0.6} roughness={0.4} />
      </mesh>
      {[0, 1, 2, 3].map((k) => {
        const a = (k / 4) * PI * 2 + 0.4
        return <Block key={k} size={[0.06, 0.05, 0.1]} position={[Math.cos(a) * 0.22, 0.88, 0.05 + Math.sin(a) * 0.22]} rotation={[0, -a, 0]} color="#c9ced6" metalness={0.8} roughness={0.3} />
      })}
      <Block size={[0.12, 0.95, 0.12]} position={[0, 1.27, -0.38]} color="#c4231d" roughness={0.45} metalness={0.3} />
      <Block size={[0.09, 0.09, 0.5]} position={[0, 1.7, -0.15]} color="#3a3d40" metalness={0.6} roughness={0.4} />
      <mesh position={[0, 1.38, 0.05]}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 12]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-0.15, 0, 0.15].map((x) => (
        <Block key={x} size={[0.08, 0.03, 0.14]} position={[x, 0.03, 0.52]} color="#2a2b2d" roughness={0.6} />
      ))}
    </>
  )
}
