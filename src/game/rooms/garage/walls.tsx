import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial, RectAreaLight } from 'three'
import { Block, PanelLight, PI } from '../../kit'
import { Outside } from '../../outside'
import { wallGeometry, type Slice } from '../../outsideLayers'
import { ShadowFigure } from '../../figure'
import { PARTITION } from './bounds'
import { BATTEN, BENCH, BENCH_Z, DOOR, FLOOR_BAY, LIFT_BAY, OFFICE_DOORWAY, OFFICE_WINDOW } from './layout'
import { Visitor } from './office'
import {
  blindsTexture,
  calendarTexture,
  garageOutside,
  oilPosterTexture,
  posterWallTexture,
  signTexture,
  slatTexture,
} from './textures'

/*
 * Things on and in the walls: the roller doors, the office doorway and its
 * reception window, the calendar and posters, and the strip lights. Wall
 * pieces are built facing +z with their back on the wall at z = 0.
 */

const FRAME = { color: '#4a5056', metalness: 0.5, roughness: 0.45 }
/** How far a half-open roller door has been raised. */
const GAP = 0.5

/** The vision panels' glass, and where they sit: three slats down from the top, measured from the curtain's bottom. */
const PANEL = { width: 0.32, height: 0.09, y: 2.25 }
const PANEL_XS = Array.from({ length: 6 }, (_, i) => -DOOR.width / 2 + 0.3 + i * ((DOOR.width - 0.6) / 5))

/**
 * Steel roller door, origin at the bottom middle of the opening (which the
 * wall leaves open behind it). A row of small windows lets daylight in.
 * `raised`: it's been left up a little, and there's someone standing right
 * outside.
 */
export function RollerDoor({ raised = false, ...slice }: { raised?: boolean } & Slice) {
  const { width: w, height: h } = DOOR
  const bottom = raised ? GAP : 0
  const curtain = h - bottom
  const slats = useMemo(() => slatTexture(1, curtain / 0.1), [curtain])
  // the curtain and the panels' rubber surrounds, with holes for the glass
  const [sheet, surround] = useMemo(() => {
    const hole = (x: number, y: number) => ({ x0: x - PANEL.width / 2, x1: x + PANEL.width / 2, y0: y - PANEL.height / 2, y1: y + PANEL.height / 2 })
    return [wallGeometry(w, curtain, PANEL_XS.map((x) => hole(x, PANEL.y - curtain / 2))), wallGeometry(0.36, 0.13, [hole(0, 0)])]
  }, [w, curtain])
  return (
    <>
      <Outside layers={garageOutside()} {...slice} />
      {raised && (
        // someone standing just outside, toes under the door's edge
        <group position={[-0.25, 0, -0.2]}>
          <Visitor />
        </group>
      )}
      <mesh geometry={sheet} position={[0, bottom + curtain / 2, 0.05]} receiveShadow>
        <meshStandardMaterial map={slats} metalness={0.4} roughness={0.5} />
      </mesh>
      {PANEL_XS.map((x) => (
        <group key={x} position={[x, PANEL.y + bottom, 0.052]}>
          <mesh geometry={surround} position={[0, 0, -0.001]}>
            <meshStandardMaterial color="#1c1c1e" roughness={0.8} />
          </mesh>
          <mesh renderOrder={2}>
            <planeGeometry args={[PANEL.width, PANEL.height]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.12} roughness={0.05} clearcoat={1} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <Block size={[w, 0.06, 0.05]} position={[0, bottom + 0.03, 0.06]} {...FRAME} />
      <Block size={[0.14, 0.04, 0.05]} position={[0, bottom + 0.9, 0.08]} color="#1c1c1e" roughness={0.6} />
      {/* guide rails and the barrel housing over the top */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.1, h + 0.05, 0.12]} position={[s * (w / 2 + 0.05), (h + 0.05) / 2, 0.06]} {...FRAME} />
      ))}
      <Block size={[w + 0.3, 0.42, 0.36]} position={[0, h + 0.21, 0.18]} {...FRAME} />
    </>
  )
}

/** The office doorway's frame on the workshop side, origin at the bottom middle of the opening (the door stands open in the office). */
export function OfficeDoorFrame() {
  const { half, height } = OFFICE_DOORWAY
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, height + 0.06, 0.06]} position={[s * (half + 0.03), (height + 0.06) / 2, 0.03]} color="#e8e6df" roughness={0.5} />
      ))}
      <Block size={[half * 2 + 0.12, 0.06, 0.06]} position={[0, height + 0.03, 0.03]} color="#e8e6df" roughness={0.5} />
      {/* a worn aluminium threshold strip */}
      <Block size={[half * 2, 0.01, PARTITION + 0.06]} position={[0, 0.005, -PARTITION / 2 + 0.03]} color="#a9aeb2" metalness={0.7} roughness={0.4} radius={0.002} />
    </>
  )
}

/**
 * The reception hatch into the office, origin at its centre on the workshop
 * face of the wall: real glass, with the office behind it. `blinds`: the
 * blinds are down. `watcher`: someone is standing in the office, at the
 * glass, watching.
 */
export function OfficeWindow({ mode }: { mode: 'normal' | 'blinds' | 'watcher' }) {
  const { width: w, height: h, y } = OFFICE_WINDOW
  const slats = useMemo(() => (mode === 'blinds' ? blindsTexture() : null), [mode])
  return (
    <>
      <mesh position={[0, 0, 0.002]} renderOrder={2}>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.1} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      {slats && (
        <group position={[0, 0, -0.03]}>
          <mesh>
            <planeGeometry args={[w - 0.02, h - 0.02]} />
            <meshStandardMaterial map={slats} roughness={0.6} side={2} />
          </mesh>
          <Block size={[w - 0.02, 0.025, 0.03]} position={[0, -h / 2 + 0.03, 0]} color="#e8e6df" roughness={0.5} radius={0.006} />
        </group>
      )}
      {mode === 'watcher' && (
        // a step back from the glass, in the office, behind the counter
        <group position={[0, -y, -0.8]}>
          <ShadowFigure height={1.8} phase={2} />
        </group>
      )}
      {[-1, 1].map((s) => (
        <Block key={`v${s}`} size={[0.07, h + 0.14, 0.07]} position={[s * (w / 2 + 0.035), 0, 0.035]} color="#e8e6df" roughness={0.5} />
      ))}
      <Block size={[w + 0.14, 0.07, 0.07]} position={[0, h / 2 + 0.035, 0.035]} color="#e8e6df" roughness={0.5} />
      {/* the sill doubles as the counter you pay at */}
      <Block size={[w + 0.2, 0.04, 0.2]} position={[0, -h / 2 - 0.02, 0.1]} color="#e8e6df" roughness={0.5} />
      <mesh position={[w / 2 - 0.15, -h / 2 + 0.025, 0.12]}>
        <sphereGeometry args={[0.035, 16, 8, 0, PI * 2, 0, PI / 2]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.2} />
      </mesh>
    </>
  )
}

/** Hung on a nail, origin at its centre. `octember`: a month that doesn't exist. `gone`: the car has left the picture. */
export function Calendar({ mode }: { mode: 'normal' | 'octember' | 'gone' }) {
  const map = useMemo(() => calendarTexture(mode), [mode])
  return (
    <>
      <mesh position={[0, 0, 0.004]} receiveShadow>
        <planeGeometry args={[0.42, 0.63]} />
        <meshStandardMaterial map={map} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.33, 0.01]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.02, 6]} />
        <meshStandardMaterial color="#6f777e" metalness={0.8} roughness={0.3} />
      </mesh>
    </>
  )
}

/** The motor oil advert, taped up among the others. Origin at its centre. */
export function OilPoster({ mood }: { mood: 'smile' | 'frown' }) {
  const map = useMemo(() => oilPosterTexture(mood), [mood])
  return (
    <>
      <mesh position={[0, 0, 0.006]} receiveShadow>
        <planeGeometry args={[0.6, 0.9]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
      {[
        [-1, 1],
        [1, 1],
        [-1, -1],
        [1, -1],
      ].map(([sx, sy]) => (
        <mesh key={`${sx}${sy}`} position={[sx * 0.28, sy * 0.43, 0.008]} rotation={[0, 0, sx * sy * 0.7]}>
          <planeGeometry args={[0.09, 0.03]} />
          <meshStandardMaterial color="#e8dcb4" roughness={0.9} />
        </mesh>
      ))}
    </>
  )
}

/** Years of posters and stickers over one wall, origin at its centre. Leaves room for the oil advert at `gapX`. */
export function PosterWall({ width, height, gapX }: { width: number; height: number; gapX: number }) {
  const map = useMemo(() => posterWallTexture(width, height, gapX), [width, height, gapX])
  return (
    <mesh position={[0, 0, 0.003]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={map} transparent roughness={0.8} alphaTest={0.05} />
    </mesh>
  )
}

/** A wall sign, origin at its centre. */
export function WallSign({ text, bg, ink, size }: { text: string; bg: string; ink: string; size: [number, number] }) {
  const map = useMemo(() => signTexture(text, bg, ink), [text, bg, ink])
  return (
    <mesh position={[0, 0, 0.004]}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} roughness={0.6} />
    </mesh>
  )
}

const POWER = 4.5

/**
 * One twin-tube fluorescent batten, along local x, hanging on two chains.
 * `drop`: one chain has let go and that end has swung down.
 */
function Batten({ drop = 0, along }: { drop?: number; along: 'x' | 'z' }) {
  const l = BATTEN.length
  const hang = 0.35
  const pivot = -l / 2 + 0.2
  return (
    <group rotation={[0, along === 'x' ? 0 : PI / 2, 0]}>
      <Block size={[0.014, hang, 0.014]} position={[pivot, hang / 2, 0]} color="#6f777e" metalness={0.7} roughness={0.4} />
      {drop === 0 ? (
        <Block size={[0.014, hang, 0.014]} position={[-pivot, hang / 2, 0]} color="#6f777e" metalness={0.7} roughness={0.4} />
      ) : (
        // the loose chain hangs straight down from the ceiling
        <Block size={[0.014, hang - 0.05, 0.014]} position={[-pivot, hang / 2 + 0.025, 0]} color="#6f777e" metalness={0.7} roughness={0.4} />
      )}
      <group position={[pivot, 0, 0]} rotation={[0, 0, drop]}>
        <group position={[-pivot, 0, 0]}>
          <Block size={[l, 0.06, 0.16]} position={[0, -0.03, 0]} color="#eceeee" roughness={0.5} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, -0.075, s * 0.04]} rotation={[0, 0, PI / 2]}>
              <cylinderGeometry args={[0.014, 0.014, l - 0.1, 10]} />
              <meshStandardMaterial color="#f6fbff" emissive="#f2f8ff" emissiveIntensity={2} />
            </mesh>
          ))}
          {/*
           * Aimed straight down, a rect light's width lies along world x; for a
           * batten along z, a hair's tilt towards world x turns it to lie along z.
           */}
          <PanelLight position={[0, -0.1, 0]} size={[l, 0.2]} facing={along === 'x' ? [0, -3, 0] : [0, -3, 0.01]} color="#f2f8ff" intensity={POWER} />
        </group>
      </group>
    </group>
  )
}

/**
 * The workshop's three battens: one over each bay, one over the bench.
 * `flicker`: the bench one is on its way out. `dangle`: the one over the
 * floor bay has dropped off a chain at one end.
 */
export function Battens({ mode }: { mode: 'normal' | 'flicker' | 'dangle' }) {
  const flicker = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!flicker.current) return
    const t = clock.elapsedTime
    const level = Math.sin(t * 19) + Math.sin(t * 6.1) > -0.5 ? 1 : 0.1
    flicker.current.traverse((o) => {
      if ((o as RectAreaLight).isRectAreaLight) (o as RectAreaLight).intensity = POWER * level
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (m?.emissive && (o as Mesh).geometry?.type === 'CylinderGeometry') m.emissiveIntensity = 2 * level
    })
  })
  return (
    <>
      <group position={[LIFT_BAY.x, BATTEN.y, LIFT_BAY.z + 0.2]}>
        <Batten along="z" />
      </group>
      <group position={[FLOOR_BAY.x, BATTEN.y, FLOOR_BAY.z]}>
        <Batten along="z" drop={mode === 'dangle' ? -0.2 : 0} />
      </group>
      <group ref={mode === 'flicker' ? flicker : undefined} position={[BENCH.x, BATTEN.y, BENCH_Z + 0.75]}>
        <Batten along="x" />
      </group>
    </>
  )
}
