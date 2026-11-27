import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import {
  CapsuleGeometry,
  CircleGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  Euler,
  IcosahedronGeometry,
  LatheGeometry,
  MeshStandardMaterial,
  Quaternion,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import { Block, Instanced, PI, type Placement } from '../../kit'
import type { Vec3 } from '../../mutations'
import { FacesYou } from '../living/oddities'
import { Helmet, Tunic } from './gear'
import { CAB, CAB_BAND, CAB_LETTERS, REAR, SHUTTERS, SNAKE_CURVE } from './layout'
import { boardTexture, chequerTexture, chevronTexture, letteringTexture, plateTexture, shutterTexture, slice, tiled } from './textures'

/*
 * A British pump appliance, built nose-first along +x: the crew cab over the
 * front wheels, then the body with roller-shutter lockers down both sides,
 * the ladder on a gantry on the roof, chevrons across the back.
 *
 * Engine space: x from -3.85 (back) to 3.95 (bumper), z ±1.2, roof at 3.0.
 * The driver's compartment behind the near (+z) front door and the rear
 * locker are hollow, so their door and shutter can open onto real spaces.
 */

const RED = { color: '#c4161c', roughness: 0.32, metalness: 0.25 }
const GREY = { color: '#9aa1a8', roughness: 0.4, metalness: 0.7 }
const BLACK = { color: '#1a1b1d', roughness: 0.7 }
const INSIDE = { color: '#2b2e33', roughness: 0.85 }

const TYRE = new MeshStandardMaterial({ color: '#17171a', roughness: 0.92 })
const HUB = new MeshStandardMaterial({ color: '#d5d9dd', roughness: 0.3, metalness: 0.85 })
const RIM_PAINT = new MeshStandardMaterial({ color: '#b9bec4', roughness: 0.35, metalness: 0.7 })
const TYRE_R = 0.5

/** A tyre turned on the y axis: flat sidewalls, a rounded shoulder into the tread. Closed, so it reads from every side. */
function tyreGeometry(width: number) {
  const w = width / 2
  const c = 0.075
  const pts = [new Vector2(0, -w), new Vector2(TYRE_R - c, -w)]
  for (let i = 1; i < 6; i++) {
    const a = -PI / 2 + (i / 6) * (PI / 2)
    pts.push(new Vector2(TYRE_R - c + Math.cos(a) * c, -w + c + Math.sin(a) * c))
  }
  pts.push(new Vector2(TYRE_R, -w + c), new Vector2(TYRE_R, w - c))
  for (let i = 1; i < 6; i++) {
    const a = (i / 6) * (PI / 2)
    pts.push(new Vector2(TYRE_R - c + Math.cos(a) * c, w - c + Math.sin(a) * c))
  }
  pts.push(new Vector2(TYRE_R - c, w), new Vector2(0, w))
  return new LatheGeometry(pts, 40)
}
const FRONT_TYRE = tyreGeometry(0.36)
const REAR_TYRE = tyreGeometry(0.5)
/** The steel wheel: a dished disc with a raised rim round it, and the hub in the middle. */
const RIM_GEO = new TorusGeometry(0.285, 0.022, 10, 40)
const DISC_GEO = new CylinderGeometry(0.29, 0.29, 0.02, 32)
const HUB_GEO = new CylinderGeometry(0.13, 0.15, 0.05, 24)
const CAP_GEO = new CylinderGeometry(0.06, 0.08, 0.06, 20)
const NUT_GEO = new CylinderGeometry(0.016, 0.016, 0.03, 6)
const NUTS: Placement[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * PI * 2
  return { at: [Math.cos(a) * 0.105, Math.sin(a) * 0.105, 0.035] as Vec3, rot: [PI / 2, 0, 0] as Vec3 }
})
/** Holes round the wheel disc, just dark dots on its face. */
const VENT_GEO = new CircleGeometry(0.035, 16)
const VENT_MAT = new MeshStandardMaterial({ color: '#2a2d31', roughness: 0.7 })
const VENTS: Placement[] = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * PI * 2 + PI / 6
  return { at: [Math.cos(a) * 0.205, Math.sin(a) * 0.205, 0.0105] as Vec3 }
})
const GLASS = new MeshStandardMaterial({ color: '#16202b', roughness: 0.06, metalness: 0.7 })

/** One wheel, standing on the floor with its hub facing +z. */
export function Wheel({ rear = false, kind = 'round' }: { rear?: boolean; kind?: 'round' | 'square' | 'flat' }) {
  const width = rear ? 0.5 : 0.36
  return (
    <>
      {kind === 'round' && <mesh geometry={rear ? REAR_TYRE : FRONT_TYRE} material={TYRE} position={[0, 0.5, 0]} rotation={[PI / 2, 0, 0]} castShadow />}
      {kind === 'flat' && (
        // squashed at the bottom and bulging out sideways, the rim sagging towards the floor (scaled before it's turned: y is its width)
        <mesh geometry={rear ? REAR_TYRE : FRONT_TYRE} material={TYRE} position={[0, 0.41, 0]} rotation={[PI / 2, 0, 0]} scale={[1.07, 1.12, 0.82]} castShadow />
      )}
      {kind === 'square' && (
        <RoundedBox args={[0.96, 0.96, width]} radius={0.07} smoothness={3} position={[0, 0.48, 0]} material={TYRE} castShadow />
      )}
      <group position={[0, kind === 'flat' ? 0.44 : 0.5, (kind === 'flat' ? width * 0.56 : width / 2) + 0.002]}>
        <mesh geometry={DISC_GEO} material={RIM_PAINT} rotation={[PI / 2, 0, 0]} />
        <mesh geometry={RIM_GEO} material={HUB} position={[0, 0, 0.01]} />
        <Instanced geometry={VENT_GEO} material={VENT_MAT} items={VENTS} />
        <mesh geometry={HUB_GEO} material={HUB} position={[0, 0, 0.02]} rotation={[PI / 2, 0, 0]} />
        <Instanced geometry={NUT_GEO} material={HUB} items={NUTS} />
        <mesh geometry={CAP_GEO} material={HUB} position={[0, 0, 0.06]} rotation={[PI / 2, 0, 0]} />
      </group>
    </>
  )
}

/** A plane laid on one side of the engine (z > 0 faces +z, z < 0 faces -z). */
function SidePlane({ x0, x1, y0, y1, z, children }: { x0: number; x1: number; y0: number; y1: number; z: number; children: ReactNode }) {
  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, z]} rotation={[0, z > 0 ? 0 : PI, 0]}>
      <planeGeometry args={[x1 - x0, y1 - y0]} />
      {children}
    </mesh>
  )
}

/** Roller shutter centred on x, from `y0` up to `y1`, facing +z; `open` rolls it up by that fraction. */
export function Shutter({ width, y0, y1, open = 0 }: { width: number; y0: number; y1: number; open?: number }) {
  const h = y1 - y0
  const bottom = y0 + open * h
  const map = useMemo(() => tiled(shutterTexture(), 1, (y1 - bottom) / 0.25), [y1, bottom])
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.035, h, 0.025]} position={[s * (width / 2 + 0.01), y0 + h / 2, 0.0125]} {...GREY} radius={0.004} />
      ))}
      <mesh position={[0, (bottom + y1) / 2, 0.012]}>
        <planeGeometry args={[width, y1 - bottom]} />
        <meshStandardMaterial map={map} roughness={0.5} metalness={0.25} />
      </mesh>
      {/* bottom rail with the lift bar */}
      <Block size={[width, 0.05, 0.03]} position={[0, bottom + 0.025, 0.018]} color="#c9ced3" roughness={0.3} metalness={0.8} radius={0.006} />
      <Block size={[width * 0.6, 0.025, 0.03]} position={[0, bottom + 0.07, 0.04]} color="#d5d9dd" roughness={0.3} metalness={0.85} radius={0.008} />
    </>
  )
}

/** A dark lining plane inside a hollow, at `at`, turned by `rot`. */
function Lining({ size, at, rot }: { size: [number, number]; at: Vec3; rot: Vec3 }) {
  return (
    <mesh position={at} rotation={rot} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial {...INSIDE} />
    </mesh>
  )
}

export function Engine() {
  const lettering = useMemo(() => letteringTexture('FIRE & RESCUE'), [])
  const chequers = useMemo(() => chequerTexture(), [])
  const skirtFront = useMemo(() => tiled(chequers, 2.95 / 1.2, 1), [chequers])
  const skirtRear = useMemo(() => tiled(chequers, 1.3 / 1.2, 1), [chequers])
  const cabBand = useMemo(() => tiled(chequers, 1.95 / 1.2, 1), [chequers])
  // the near side's livery, less the slice the driver's door carries
  const near = useMemo(() => {
    const L = CAB_LETTERS
    const C = CAB_BAND
    return {
      letters: [
        { x0: L.x0, x1: CAB.x0, map: slice(lettering, L.x0, CAB.x0, L.x0, L.x1) },
        { x0: CAB.x1, x1: L.x1, map: slice(lettering, CAB.x1, L.x1, L.x0, L.x1) },
      ],
      band: [
        { x0: C.x0, x1: CAB.x0, y0: C.y0, map: slice(chequers, C.x0, CAB.x0, C.x0, C.x1, C.tile) },
        { x0: CAB.x1, x1: C.x1, y0: C.y0, map: slice(chequers, CAB.x1, C.x1, C.x0, C.x1, C.tile) },
        // under the door, on the sill
        { x0: CAB.x0, x1: CAB.x1, y0: C.y0, y1: CAB.y0, map: slice(chequers, CAB.x0, CAB.x1, C.x0, C.x1, C.tile) },
      ],
    }
  }, [lettering, chequers])
  const chevrons = useMemo(() => tiled(chevronTexture(), 2.4 / 0.6, 0.78 / 0.6), [])
  const rearPlate = useMemo(() => plateTexture('HP26 FRE', '#f5c400'), [])
  const sideZ = CAB.side
  const hollow = { w: CAB.x1 - CAB.x0, h: CAB.y1 - CAB.y0, d: sideZ - CAB.z0, x: (CAB.x0 + CAB.x1) / 2, y: (CAB.y0 + CAB.y1) / 2, z: (CAB.z0 + sideZ) / 2 }
  const back = { d: REAR.x1 - REAR.x0, x: (REAR.x0 + REAR.x1) / 2, h: REAR.y1 - REAR.y0, y: (REAR.y0 + REAR.y1) / 2 }
  return (
    <>
      {/* chassis and running gear */}
      <Block size={[7.3, 0.25, 1.5]} position={[0, 0.56, 0]} {...BLACK} radius={0.01} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <group position={[2.85, 0, s * 1.0]} rotation={[0, s > 0 ? 0 : PI, 0]}>
            <Wheel />
          </group>
          {s < 0 && (
            <group position={[-1.9, 0, -0.93]} rotation={[0, PI, 0]}>
              <Wheel rear />
            </group>
          )}
        </group>
      ))}

      {/* body: lockers all down both sides, and the rear locker's frame round its hollow */}
      <Block size={[1.7 - REAR.x1, 1.92, 2.4]} position={[(1.7 + REAR.x1) / 2, 2.04, 0]} {...RED} radius={0.04} paint />
      <Block size={[back.d, REAR.y0 - 1.08, 2.4]} position={[back.x, (REAR.y0 + 1.08) / 2, 0]} {...RED} radius={0.03} paint />
      <Block size={[back.d, 3.0 - REAR.y1, 2.4]} position={[back.x, (REAR.y1 + 3.0) / 2, 0]} {...RED} radius={0.03} paint />
      {[-1, 1].map((s) => (
        <Block key={s} size={[back.d, back.h + 0.02, 1.2 - REAR.half]} position={[back.x, back.y, s * (1.2 + REAR.half) / 2]} {...RED} radius={0.03} paint />
      ))}
      <Lining size={[REAR.half * 2, back.h]} at={[REAR.x1 - 0.003, back.y, 0]} rot={[0, -PI / 2, 0]} />
      <Lining size={[back.d, REAR.half * 2]} at={[back.x, REAR.y1 - 0.003, 0]} rot={[PI / 2, 0, 0]} />
      <Lining size={[back.d, REAR.half * 2]} at={[back.x, REAR.y0 + 0.003, 0]} rot={[-PI / 2, 0, 0]} />
      {[-1, 1].map((s) => (
        <Lining key={s} size={[back.d, back.h]} at={[back.x, back.y, s * (REAR.half - 0.003)]} rot={[0, s > 0 ? PI : 0, 0]} />
      ))}
      <Block size={[2.95, 0.48, 2.4]} position={[0.225, 0.84, 0]} {...RED} radius={0.02} paint />
      <Block size={[1.3, 0.48, 2.4]} position={[-3.2, 0.84, 0]} {...RED} radius={0.02} paint />
      {/* black wheel arch liner over the rear wheels */}
      <Block size={[1.3, 0.03, 2.38]} position={[-1.9, 1.065, 0]} {...BLACK} radius={0.01} />
      {/* anti-slip walkway on the roof, under the ladder */}
      <Block size={[5.4, 0.02, 0.9]} position={[-1.1, 3.01, 0]} color="#3b3f44" roughness={0.95} radius={0.005} />

      {/* crew cab: the far side whole, the near side built round the driver's compartment */}
      <Block size={[2.05, 1.82, sideZ + CAB.z0]} position={[2.775, 1.99, (CAB.z0 - sideZ) / 2]} {...RED} radius={0.12} paint />
      <Block size={[CAB.x0 - 1.75, 1.82, sideZ - CAB.z0 + 0.12]} position={[(1.75 + CAB.x0) / 2, 1.99, (CAB.z0 - 0.12 + sideZ) / 2]} {...RED} radius={0.12} paint />
      <Block size={[3.8 - CAB.x1, 1.82, sideZ - CAB.z0 + 0.12]} position={[(CAB.x1 + 3.8) / 2, 1.99, (CAB.z0 - 0.12 + sideZ) / 2]} {...RED} radius={0.06} paint />
      <Block size={[hollow.w + 0.06, 2.9 - CAB.y1, hollow.d + 0.12]} position={[hollow.x, (CAB.y1 + 2.9) / 2, hollow.z - 0.06]} {...RED} radius={0.02} paint />
      <Block size={[hollow.w + 0.06, CAB.y0 - 1.08, hollow.d + 0.12]} position={[hollow.x, (CAB.y0 + 1.08) / 2, hollow.z - 0.06]} {...RED} radius={0.02} paint />
      <Lining size={[hollow.w, hollow.h]} at={[hollow.x, hollow.y, CAB.z0 + 0.003]} rot={[0, 0, 0]} />
      <Lining size={[hollow.d, hollow.h]} at={[CAB.x0 + 0.003, hollow.y, hollow.z]} rot={[0, PI / 2, 0]} />
      <Lining size={[hollow.d, hollow.h]} at={[CAB.x1 - 0.003, hollow.y, hollow.z]} rot={[0, -PI / 2, 0]} />
      <Lining size={[hollow.w, hollow.d]} at={[hollow.x, CAB.y1 - 0.003, hollow.z]} rot={[PI / 2, 0, 0]} />
      <Lining size={[hollow.w, hollow.d]} at={[hollow.x, CAB.y0 + 0.003, hollow.z]} rot={[-PI / 2, 0, 0]} />

      <Block size={[0.45, 0.48, 2.4]} position={[1.975, 0.84, 0]} {...RED} radius={0.02} paint />
      <Block size={[0.3, 0.48, 2.4]} position={[3.65, 0.84, 0]} {...RED} radius={0.02} paint />
      <Block size={[0.16, 0.36, 2.44]} position={[3.88, 0.74, 0]} {...GREY} radius={0.03} />
      <Block size={[0.03, 0.42, 1.3]} position={[3.81, 1.45, 0]} {...BLACK} radius={0.01} />
      {/* chrome slats across the grille, and the frame round it */}
      {[1.31, 1.4, 1.49, 1.58].map((y) => (
        <Block key={y} size={[0.02, 0.028, 1.2]} position={[3.832, y, 0]} {...GREY} radius={0.008} />
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.025, 0.42, 0.035]} position={[3.83, 1.45, s * 0.64]} {...GREY} radius={0.008} />
      ))}
      <mesh position={[3.803, 2.38, 0]} rotation={[0, PI / 2, 0]} material={GLASS}>
        <planeGeometry args={[2.1, 0.8]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* cab windows: the near front one is in the door */}
          {[
            [1.95, 2.85],
            [3.05, 3.65],
          ].map(([x0, x1]) =>
            s > 0 && x0 > CAB.x0 ? null : (
              <mesh key={x0} position={[(x0 + x1) / 2, 2.22, s * 1.203]} rotation={[0, s > 0 ? 0 : PI, 0]} material={GLASS}>
                <planeGeometry args={[x1 - x0, 0.72]} />
              </mesh>
            ),
          )}
          {/* door shut-lines and the crew steps */}
          {(s > 0 ? [1.85, CAB.x0 - 0.008, CAB.x1 + 0.008] : [1.85, 2.95, 3.72]).map((x) => (
            <Block key={x} size={[0.012, 1.7, 0.006]} position={[x, 2.0, s * 1.2]} {...BLACK} radius={0.002} />
          ))}
          <Block size={[0.5, 0.04, 0.22]} position={[3.35, 0.5, s * 1.08]} {...GREY} radius={0.01} />
          <Block size={[0.6, 0.04, 0.22]} position={[2.0, 0.5, s * 1.08]} {...GREY} radius={0.01} />
          {s < 0 ? (
            <>
              <SidePlane x0={CAB_LETTERS.x0} x1={CAB_LETTERS.x1} y0={CAB_LETTERS.y0} y1={CAB_LETTERS.y1} z={-1.204}>
                <meshStandardMaterial map={lettering} transparent roughness={0.4} />
              </SidePlane>
              {/* Battenburg chequers along the cab */}
              <SidePlane x0={CAB_BAND.x0} x1={CAB_BAND.x1} y0={CAB_BAND.y0} y1={CAB_BAND.y1} z={-1.204}>
                <meshStandardMaterial map={cabBand} roughness={0.35} />
              </SidePlane>
              {/* wing mirror on its arm (the near one is an item) */}
              <Block size={[0.04, 0.04, 0.24]} position={[3.6, 2.45, -1.31]} {...BLACK} radius={0.01} />
              <Block size={[0.07, 0.36, 0.17]} position={[3.6, 2.32, -1.42]} {...BLACK} radius={0.02} />
            </>
          ) : (
            <>
              {near.letters.map((l) => (
                <SidePlane key={l.x0} x0={l.x0} x1={l.x1} y0={CAB_LETTERS.y0} y1={CAB_LETTERS.y1} z={1.204}>
                  <meshStandardMaterial map={l.map} transparent roughness={0.4} />
                </SidePlane>
              ))}
              {near.band.map((b) => (
                <SidePlane key={`${b.x0}${b.y1 ?? ''}`} x0={b.x0} x1={b.x1} y0={b.y0} y1={b.y1 ?? CAB_BAND.y1} z={1.204}>
                  <meshStandardMaterial map={b.map} roughness={0.35} />
                </SidePlane>
              ))}
            </>
          )}
          {/* chequers along the skirts */}
          <SidePlane x0={-1.25} x1={1.7} y0={0.68} y1={0.98} z={s * 1.204}>
            <meshStandardMaterial map={skirtFront} roughness={0.35} />
          </SidePlane>
          <SidePlane x0={-3.85} x1={-2.55} y0={0.68} y1={0.98} z={s * 1.204}>
            <meshStandardMaterial map={skirtRear} roughness={0.35} />
          </SidePlane>
          {/* side lockers: the near rear one on +z is its own item */}
          {SHUTTERS.map(([x0, x1, y0, y1], i) =>
            s > 0 && i === 1 ? null : (
              <group key={x0} position={[(x0 + x1) / 2, 0, s * 1.2]} rotation={[0, s > 0 ? 0 : PI, 0]}>
                <Shutter width={x1 - x0} y0={y0} y1={y1} />
              </group>
            ),
          )}
        </group>
      ))}

      {/* the back: chevrons, lights and plate (the rear locker is an item) */}
      <group position={[-3.85, 0, 0]} rotation={[0, -PI / 2, 0]}>
        <mesh position={[0, 1.0, 0.004]}>
          <planeGeometry args={[2.4, 0.78]} />
          <meshStandardMaterial map={chevrons} roughness={0.35} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <Block size={[0.16, 0.24, 0.03]} position={[s * 1.02, 1.2, 0.02]} color="#d8241c" emissive="#ff1a10" emissiveIntensity={0.35} roughness={0.2} radius={0.01} />
            <Block size={[0.16, 0.1, 0.03]} position={[s * 1.02, 1.04, 0.02]} color="#ff8a1f" emissive="#ff8a1f" emissiveIntensity={0.15} roughness={0.2} radius={0.01} />
          </group>
        ))}
        <mesh position={[0, 0.72, 0.006]}>
          <planeGeometry args={[0.52, 0.11]} />
          <meshStandardMaterial map={rearPlate} roughness={0.4} />
        </mesh>
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Parts of the engine that are items of their own
// ---------------------------------------------------------------------------

/** Pattern of a two-tone wig-wag: each side double-flashes in turn. */
function flash(t: number, side: number) {
  const phase = (t * 1.6 + (side > 0 ? 0.5 : 0)) % 1
  return phase < 0.12 || (phase > 0.2 && phase < 0.32) ? 5 : 0.15
}

/** Blue lights: a light bar on the cab roof and two flashers in the grille. Item origin is the cab's front top edge. */
export function Beacons({ flashing }: { flashing: boolean }) {
  const lenses = useRef<(Mesh | null)[]>([])
  useFrame(({ clock }) => {
    if (!flashing) return
    lenses.current.forEach((m, i) => {
      if (!m) return
      ;(m.material as MeshStandardMaterial).emissiveIntensity = flash(clock.elapsedTime, i % 2 ? 1 : -1)
    })
  })
  const lens = (i: number, size: Vec3, at: Vec3) => (
    <RoundedBox key={i} ref={(m: Mesh | null) => void (lenses.current[i] = m)} args={size} radius={Math.min(0.04, Math.min(...size) / 2 - 0.001)} smoothness={3} position={at} userData={{ paint: true }}>
      <meshStandardMaterial color="#1f4fff" emissive="#2a5cff" emissiveIntensity={0.25} roughness={0.15} transparent opacity={0.92} />
    </RoundedBox>
  )
  return (
    <>
      {/* bar on the roof, a little back from the windscreen */}
      <Block size={[0.32, 0.05, 1.8]} position={[-0.35, 0.025, 0]} color="#2a2d31" roughness={0.5} radius={0.01} />
      <Block size={[0.26, 0.1, 0.5]} position={[-0.35, 0.1, 0]} color="#e9ecef" roughness={0.3} metalness={0.4} radius={0.03} />
      {lens(0, [0.26, 0.12, 0.6], [-0.35, 0.11, -0.58])}
      {lens(1, [0.26, 0.12, 0.6], [-0.35, 0.11, 0.58])}
      {/* grille flashers */}
      {lens(2, [0.03, 0.07, 0.18], [0.12, -1.2, -0.5])}
      {lens(3, [0.03, 0.07, 0.18], [0.12, -1.2, 0.5])}
    </>
  )
}

const EYE_WHITE = new MeshStandardMaterial({ color: '#fbf6e6', roughness: 0.15 })

/** The headlights, either side of the grille, facing +x. */
export function Headlights({ mode }: { mode: 'off' | 'on' | 'eyes' }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 0.82]}>
          <Block size={[0.05, 0.2, 0.36]} position={[0.0, 0, 0]} color="#2a2d31" roughness={0.4} metalness={0.5} radius={0.02} />
          {mode === 'eyes' ? (
            <FacesYou position={[0.06, 0, 0]}>
              <mesh material={EYE_WHITE} scale={[1.6, 1, 1]}>
                <sphereGeometry args={[0.085, 28, 20]} />
              </mesh>
              <mesh position={[0, 0, 0.082]}>
                <circleGeometry args={[0.05, 28]} />
                <meshStandardMaterial color="#3a7d44" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.084]}>
                <circleGeometry args={[0.024, 20]} />
                <meshBasicMaterial color="#050505" />
              </mesh>
            </FacesYou>
          ) : (
            <Block
              size={[0.03, 0.14, 0.3]}
              position={[0.035, 0, 0]}
              color={mode === 'on' ? '#fffaf0' : '#d6dde2'}
              emissive="#fff6d8"
              emissiveIntensity={mode === 'on' ? 3.5 : 0}
              roughness={0.08}
              metalness={0.3}
              radius={0.01}
            />
          )}
        </group>
      ))}
    </>
  )
}

/** The lit board in the top of the windscreen, facing +x. */
export function DisplayBoard({ text }: { text: string }) {
  const map = useMemo(() => boardTexture(text), [text])
  return (
    <>
      <Block size={[0.02, 0.2, 1.36]} position={[0.01, 0, 0]} color="#16171a" roughness={0.5} radius={0.006} />
      <mesh position={[0.021, 0, 0]} rotation={[0, PI / 2, 0]}>
        <planeGeometry args={[1.28, 0.16]} />
        <meshStandardMaterial map={map} emissive="#ffffff" emissiveMap={map} emissiveIntensity={1.4} roughness={0.3} />
      </mesh>
    </>
  )
}

/** The front number plate, facing +x. */
export function NumberPlate({ text }: { text: string }) {
  const map = useMemo(() => plateTexture(text, '#f4f4f0'), [text])
  return (
    <mesh rotation={[0, PI / 2, 0]}>
      <planeGeometry args={[0.52, 0.11]} />
      <meshStandardMaterial map={map} roughness={0.4} />
    </mesh>
  )
}

/** A gramophone horn: throat at the origin, flaring out along +y. */
const HORN = new LatheGeometry(
  Array.from({ length: 24 }, (_, i) => {
    const t = i / 23
    return new Vector2(0.025 + 0.2 * t ** 3.2, t * 0.56)
  }),
  40,
)
const BRASS = new MeshStandardMaterial({ color: '#d4a94a', roughness: 0.25, metalness: 0.9, side: DoubleSide })

/** The siren speaker on the front bumper, facing +x; or a brass gramophone horn where it was. */
export function Siren({ gramophone }: { gramophone: boolean }) {
  return (
    <>
      <Block size={[0.04, 0.12, 0.14]} position={[0.02, 0, 0]} color="#2a2d31" roughness={0.5} metalness={0.4} radius={0.01} />
      {gramophone ? (
        <group position={[0.04, 0, 0]} rotation={[0, 0, -PI / 2 + 0.22]}>
          <mesh geometry={HORN} material={BRASS} castShadow />
          {/* the bell's lip */}
          <mesh material={BRASS} position={[0, 0.56, 0]} rotation={[PI / 2, 0, 0]}>
            <torusGeometry args={[0.225, 0.008, 8, 40]} />
          </mesh>
        </group>
      ) : (
        <>
          <Block size={[0.1, 0.18, 0.24]} position={[0.09, 0, 0]} {...BLACK} radius={0.02} />
          {[-0.06, -0.03, 0, 0.03, 0.06].map((y) => (
            <Block key={y} size={[0.01, 0.012, 0.2]} position={[0.142, y, 0]} color="#d5d9dd" metalness={0.85} roughness={0.25} radius={0.003} />
          ))}
        </>
      )}
    </>
  )
}

const MIRROR_GLASS = new MeshStandardMaterial({ color: '#d7e0e6', roughness: 0.04, metalness: 1 })

/** The mirror head: black shell, glass on its +z face. */
function MirrorHead() {
  return (
    <>
      <Block size={[0.17, 0.36, 0.07]} {...BLACK} radius={0.02} />
      <mesh material={MIRROR_GLASS} position={[0, 0, 0.036]}>
        <planeGeometry args={[0.15, 0.33]} />
      </mesh>
    </>
  )
}

/** The near wing mirror: an arm out from the cab's front corner, the glass looking back along the engine (or round at you). */
export function WingMirror({ watching }: { watching: boolean }) {
  const head: Vec3 = [0, -0.13, 0.22]
  return (
    <>
      <Block size={[0.04, 0.04, 0.24]} position={[0, 0, 0.11]} {...BLACK} radius={0.01} />
      {watching ? (
        <FacesYou position={head}>
          <MirrorHead />
        </FacesYou>
      ) : (
        <group position={head} rotation={[0, -PI / 2, 0]}>
          <MirrorHead />
        </group>
      )}
    </>
  )
}

const SEAT = { color: '#26292e', roughness: 0.9 }

/** Inside the driver's compartment, in the cab door item's space (hinge line at the origin): seat, wheel and dash. */
function DriverSeat() {
  const x = (ex: number) => ex - CAB.x1
  const z = (ez: number) => ez - CAB.side
  return (
    <>
      <Block size={[0.36, 0.1, 0.44]} position={[x(3.24), 1.55, z(0.8)]} {...SEAT} radius={0.03} />
      <Block size={[0.07, 0.44, 0.44]} position={[x(3.05), 1.84, z(0.8)]} rotation={[0, 0, -0.12]} {...SEAT} radius={0.03} />
      <Block size={[0.06, 0.14, 0.26]} position={[x(3.03), 2.15, z(0.8)]} rotation={[0, 0, -0.12]} {...SEAT} radius={0.03} />
      <Block size={[0.2, 0.34, 0.2]} position={[x(3.24), 1.33, z(0.8)]} color="#1a1b1d" roughness={0.6} radius={0.02} />
      {/* dash and the steering wheel on its column */}
      <Block size={[0.08, 0.3, hollowWidth]} position={[x(3.57), 1.72, z(0.81)]} color="#1d1f23" roughness={0.6} radius={0.02} />
      <mesh position={[x(3.47), 1.95, z(0.8)]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.025, 0.025, 0.22, 10]} />
        <meshStandardMaterial color="#1a1b1d" roughness={0.6} />
      </mesh>
      <mesh position={[x(3.42), 2.02, z(0.8)]} rotation={[0, PI / 2, 0.5]}>
        <torusGeometry args={[0.17, 0.018, 8, 32]} />
        <meshStandardMaterial color="#111214" roughness={0.5} />
      </mesh>
    </>
  )
}
const hollowWidth = CAB.side - CAB.z0 - 0.02

/** Somebody's whole fire kit sitting at the wheel, with nobody in it: tunic on the seat, gloves on the wheel, the helmet where a head would be. */
function EmptyKit() {
  const x = (ex: number) => ex - CAB.x1
  const z = (ez: number) => ez - CAB.side
  return (
    <>
      <group position={[x(3.15), 2.27, z(0.8)]} rotation={[0, PI / 2, 0]} scale={0.85}>
        <Tunic reach={1.1} />
      </group>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.07, 0.1, 0.06]} position={[x(3.44), 2.0 - s * 0.02, z(0.8 + s * 0.15)]} color="#141414" roughness={0.7} radius={0.02} />
      ))}
      <group position={[x(3.15), 2.3, z(0.8)]} rotation={[0, PI / 2, 0]}>
        <Helmet />
      </group>
    </>
  )
}

const FUR = new MeshStandardMaterial({ color: '#e6d3ad', roughness: 1, flatShading: true })
const FLUFF = new IcosahedronGeometry(1, 1)
/** Tufts round the dog's head and chest, in its head's space (facing +z). */
const TUFTS: Placement[] = [
  [-0.1, 0.07, -0.02],
  [0.1, 0.07, -0.02],
  [0, 0.11, -0.03],
  [-0.08, -0.06, 0],
  [0.08, -0.06, 0],
  [-0.11, 0, -0.06],
  [0.11, 0, -0.06],
  [0, 0.05, -0.1],
  [-0.06, 0.1, 0.03],
  [0.06, 0.1, 0.03],
].map((at, i) => ({ at: at as Vec3, scale: [0.05 + (i % 3) * 0.01, 0.05 + (i % 2) * 0.012, 0.05] as Vec3, rot: [i, i * 2, 0] as Vec3 }))

/** A fluffy dog sitting in the driver's seat with its head out of the window, ears flapping. Built in the cab door's space. */
function DogDriver() {
  const ears = useRef<(Group | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ears.current.forEach((e, i) => {
      if (e) e.rotation.x = -0.5 + Math.sin(t * 9 + i * 1.3) * 0.25
    })
  })
  const x = (ex: number) => ex - CAB.x1
  const z = (ez: number) => ez - CAB.side
  return (
    <>
      {/* body sitting up on the seat */}
      <mesh geometry={FLUFF} material={FUR} position={[x(3.27), 1.82, z(0.82)]} scale={[0.17, 0.24, 0.16]} castShadow />
      {/* front paws on the door sill */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={FLUFF} material={FUR} position={[x(3.31 + s * 0.08), 1.87, z(1.15)]} scale={[0.045, 0.04, 0.06]} />
      ))}
      {/* neck and the head out of the window, looking along the bay */}
      <mesh geometry={FLUFF} material={FUR} position={[x(3.3), 2.06, z(1.05)]} scale={[0.09, 0.11, 0.12]} />
      <group position={[x(3.31), 2.2, z(1.26)]} rotation={[0.1, 0.35, 0]}>
        <mesh geometry={FLUFF} material={FUR} scale={[0.11, 0.1, 0.11]} castShadow />
        <Instanced geometry={FLUFF} material={FUR} items={TUFTS} />
        {/* muzzle, nose and tongue */}
        <mesh geometry={FLUFF} material={FUR} position={[0, -0.03, 0.1]} scale={[0.06, 0.05, 0.07]} />
        <mesh position={[0, -0.01, 0.165]}>
          <sphereGeometry args={[0.018, 12, 10]} />
          <meshStandardMaterial color="#1a1110" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.085, 0.135]} rotation={[0.5, 0, 0]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.03, 12, 10]} />
          <meshStandardMaterial color="#e2707a" roughness={0.4} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.045, 0.035, 0.095]}>
            <sphereGeometry args={[0.013, 10, 8]} />
            <meshStandardMaterial color="#120c08" roughness={0.15} />
          </mesh>
        ))}
        {[-1, 1].map((s, i) => (
          <group key={s} ref={(g) => void (ears.current[i] = g)} position={[s * 0.09, 0.06, -0.02]}>
            <mesh geometry={FLUFF} material={FUR} position={[s * 0.02, -0.02, -0.06]} scale={[0.03, 0.08, 0.06]} />
          </group>
        ))}
      </group>
    </>
  )
}

/**
 * The driver's door on the near side, hinged at its front edge, with the
 * compartment behind it. Item origin: the hinge, on the cab's side face.
 */
export function CabDoor({ mode }: { mode: 'shut' | 'open' | 'dog' }) {
  const lettering = useMemo(() => letteringTexture('FIRE & RESCUE'), [])
  const maps = useMemo(() => {
    const chequers = chequerTexture()
    return {
      letters: slice(lettering, CAB.x0, CAB.x1, CAB_LETTERS.x0, CAB_LETTERS.x1),
      band: slice(chequers, CAB.x0, CAB.x1, CAB_BAND.x0, CAB_BAND.x1, CAB_BAND.tile),
    }
  }, [lettering])
  const w = CAB.x1 - CAB.x0
  const win = { y0: 1.86, y1: 2.58, x0: -w + 0.05, x1: -0.05 }
  const leaf = { ...RED, radius: 0.008, paint: true }
  return (
    <>
      <DriverSeat />
      {mode === 'open' && <EmptyKit />}
      {mode === 'dog' && <DogDriver />}
      <group rotation={[0, mode === 'open' ? 0.85 : 0, 0]}>
        <Block size={[w, win.y0 - CAB.y0, 0.05]} position={[-w / 2, (CAB.y0 + win.y0) / 2, -0.025]} {...leaf} />
        <Block size={[w, CAB.y1 - win.y1, 0.05]} position={[-w / 2, (win.y1 + CAB.y1) / 2, -0.025]} {...leaf} />
        {[
          [-w, win.x0],
          [win.x1, 0],
        ].map(([a, b]) => (
          <Block key={a} size={[b - a, win.y1 - win.y0, 0.05]} position={[(a + b) / 2, (win.y0 + win.y1) / 2, -0.025]} {...leaf} />
        ))}
        {mode !== 'dog' && (
          <mesh position={[(win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, -0.012]} material={GLASS}>
            <planeGeometry args={[win.x1 - win.x0, win.y1 - win.y0]} />
          </mesh>
        )}
        {mode === 'dog' && (
          // the glass wound right down: just its top edge showing in the slot
          <Block size={[win.x1 - win.x0, 0.012, 0.012]} position={[(win.x0 + win.x1) / 2, win.y0 + 0.006, -0.025]} color="#16202b" roughness={0.1} radius={0.003} />
        )}
        <mesh position={[-w / 2, (CAB_LETTERS.y0 + CAB_LETTERS.y1) / 2, 0.004]}>
          <planeGeometry args={[w, CAB_LETTERS.y1 - CAB_LETTERS.y0]} />
          <meshStandardMaterial map={maps.letters} transparent roughness={0.4} />
        </mesh>
        <mesh position={[-w / 2, (CAB.y0 + CAB_BAND.y1) / 2, 0.004]}>
          <planeGeometry args={[w, CAB_BAND.y1 - CAB.y0]} />
          <meshStandardMaterial map={maps.band} roughness={0.35} />
        </mesh>
        {/* handle near the back edge */}
        <Block size={[0.14, 0.035, 0.03]} position={[-w + 0.12, 1.74, 0.012]} color="#d5d9dd" metalness={0.85} roughness={0.25} radius={0.01} />
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// The ladder on its gantry
// ---------------------------------------------------------------------------

const ALU = new MeshStandardMaterial({ color: '#d7dbdf', roughness: 0.3, metalness: 0.8 })
const WOOD = new MeshStandardMaterial({ color: '#9a6a3a', roughness: 0.75 })
const GANTRY = new MeshStandardMaterial({ color: '#2a2d31', roughness: 0.5, metalness: 0.4 })
const RUNG = new CylinderGeometry(0.02, 0.02, 1, 10)
const WOOD_RUNG = new CylinderGeometry(0.026, 0.026, 1, 10)

type Section = { length: number; width: number; y: number; x: number; web: number }
/** Three nested sections, each sitting a little higher and narrower than the one below. */
const SECTIONS: Section[] = [
  { length: 7.0, width: 0.74, y: 0.42, x: -0.2, web: 0.13 },
  { length: 6.6, width: 0.62, y: 0.54, x: -0.3, web: 0.11 },
  { length: 6.2, width: 0.5, y: 0.66, x: -0.4, web: 0.1 },
]
const WOODEN: Section[] = [{ length: 7.0, width: 0.7, y: 0.42, x: -0.2, web: 0.15 }]

/** A ladder rail: an I-section in aluminium, or a plain wooden beam. */
function Rail({ s, side, wooden }: { s: Section; side: number; wooden: boolean }) {
  const z = side * (s.width / 2)
  if (wooden)
    return (
      <mesh material={WOOD} position={[s.x, s.y, z]} castShadow>
        <boxGeometry args={[s.length, s.web, 0.065]} />
      </mesh>
    )
  return (
    <group position={[s.x, s.y, z]}>
      <mesh material={ALU} castShadow>
        <boxGeometry args={[s.length, s.web, 0.018]} />
      </mesh>
      {[-1, 1].map((f) => (
        <mesh key={f} material={ALU} position={[0, f * (s.web / 2), 0]}>
          <boxGeometry args={[s.length, 0.014, 0.05]} />
        </mesh>
      ))}
    </group>
  )
}

/** Triple extension ladder on its roof gantry, centred on the item's origin (the roof, at y = 0). */
export function Ladder({ kind }: { kind: 'normal' | 'extended' | 'wooden' }) {
  const wooden = kind === 'wooden'
  const sections = useMemo(() => (wooden ? WOODEN : SECTIONS.map((s, i) => (kind === 'extended' && i === 2 ? { ...s, x: s.x - 1.4 } : s))), [kind, wooden])
  const rungs = useMemo(() => {
    const out: Placement[] = []
    for (const s of sections) {
      for (let x = -s.length / 2 + 0.15; x < s.length / 2 - 0.1; x += 0.28) out.push({ at: [s.x + x, s.y, 0], rot: [PI / 2, 0, 0], scale: [1, s.width, 1] })
    }
    return out
  }, [sections])
  return (
    <>
      {/* gantry: two portal frames with a roller under the ladder, joined along each side */}
      {[-2.7, 2.2].map((x) => (
        <group key={x}>
          {[-0.5, 0.5].map((z) => (
            <mesh key={z} material={GANTRY} position={[x, 0.17, z]} castShadow>
              <boxGeometry args={[0.08, 0.34, 0.08]} />
            </mesh>
          ))}
          <mesh material={GANTRY} position={[x, 0.31, 0]}>
            <boxGeometry args={[0.12, 0.05, 1.08]} />
          </mesh>
          <mesh material={HUB} position={[x, 0.36, 0]} rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.66, 14]} />
          </mesh>
        </group>
      ))}
      {[-0.5, 0.5].map((z) => (
        <mesh key={z} material={GANTRY} position={[-0.25, 0.07, z]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 4.9, 12]} />
        </mesh>
      ))}
      {/* the lowering ram, from the back frame up to the front one */}
      <mesh material={HUB} position={[-0.25, 0.2, -0.42]} rotation={[0, 0, PI / 2 - 0.05]}>
        <cylinderGeometry args={[0.035, 0.035, 4.2, 12]} />
      </mesh>
      {sections.map((s, i) => (
        <group key={i}>
          {[-1, 1].map((side) => (
            <Rail key={side} s={s} side={side} wooden={wooden} />
          ))}
        </group>
      ))}
      <Instanced geometry={wooden ? WOOD_RUNG : RUNG} material={wooden ? WOOD : ALU} items={rungs} />
      {/* the heel of the main section, with its pair of wheels */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={TYRE} position={[sections[0].x - sections[0].length / 2 + 0.06, sections[0].y - 0.06, side * (sections[0].width / 2 + 0.04)]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 18]} />
        </mesh>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Lockers
// ---------------------------------------------------------------------------

const HOSE = new MeshStandardMaterial({ color: '#efe6cf', roughness: 0.75 })
const NOZZLE = new MeshStandardMaterial({ color: '#d4a94a', roughness: 0.25, metalness: 0.9 })

/** A hose sneaking out from under the shutter, its nozzle raised and swaying like a snake's head. */
function HoseSnake() {
  const tube = useMemo(() => new TubeGeometry(SNAKE_CURVE, 80, 0.035, 10, false), [])
  const head = useRef<Group>(null)
  const { end, turn } = useMemo(() => {
    const end = SNAKE_CURVE.getPoint(1)
    const turn = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), SNAKE_CURVE.getTangent(1).normalize())
    return { end, turn }
  }, [])
  useFrame(({ clock }) => {
    if (!head.current) return
    const t = clock.elapsedTime
    head.current.rotation.set(Math.sin(t * 1.3) * 0.15, Math.sin(t * 0.9) * 0.3, 0)
  })
  return (
    <>
      <mesh geometry={tube} material={HOSE} castShadow />
      <group position={end}>
        <group ref={head}>
          <group quaternion={turn}>
            <mesh material={NOZZLE} position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.022, 0.04, 0.13, 16]} />
            </mesh>
            <mesh position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.015, 0.022, 0.03, 12]} />
              <meshStandardMaterial color="#d8241c" roughness={0.4} />
            </mesh>
          </group>
        </group>
      </group>
    </>
  )
}

/** The engine's near rear locker; half open shows the kit inside. */
export function EngineLocker({ mode }: { mode: 'shut' | 'ajar' | 'snake' }) {
  const [x0, x1, y0, y1] = SHUTTERS[1]
  const width = x1 - x0
  const open = mode === 'ajar' ? 0.38 : 0
  const gap = open * (y1 - y0)
  return (
    <>
      <Shutter width={width} y0={y0} y1={y1} open={open} />
      {mode === 'ajar' && (
        <group position={[0, y0, 0]}>
          {/* the dark recess and what's stowed in it */}
          <mesh position={[0, gap / 2, 0.004]}>
            <planeGeometry args={[width, gap]} />
            <meshStandardMaterial color="#202326" roughness={0.9} />
          </mesh>
          <Block size={[width - 0.04, 0.02, 0.04]} position={[0, 0.02, 0.02]} color="#8a9096" metalness={0.6} roughness={0.4} radius={0.004} />
          <Block size={[0.32, 0.26, 0.05]} position={[-0.35, 0.16, 0.03]} color="#f2c500" roughness={0.6} radius={0.01} />
          <Block size={[0.28, 0.2, 0.05]} position={[0.02, 0.13, 0.03]} color="#d8241c" roughness={0.6} radius={0.01} />
          <mesh material={HOSE} position={[0.38, 0.25, 0.035]}>
            <torusGeometry args={[0.15, 0.04, 10, 28]} />
          </mesh>
        </group>
      )}
      {mode === 'snake' && <HoseSnake />}
    </>
  )
}

const REEL_HOSE = new MeshStandardMaterial({ color: '#c8302a', roughness: 0.55 })
const REEL_FLANGE = new MeshStandardMaterial({ color: '#d8241c', roughness: 0.4, metalness: 0.3 })
const WRAP = new TorusGeometry(1, 0.11, 8, 40)
const SAUSAGE = new CapsuleGeometry(0.034, 0.1, 6, 12)
const SAUSAGE_MAT = new MeshStandardMaterial({ color: '#9b4f2c', roughness: 0.35 })
/** The two hose reels, side by side across the locker; local x across the engine, +z out of the back. */
const REELS = [-0.42, 0.42]
const REEL = { y: 2.12, z: -0.36, length: 0.66, hub: 0.11, full: 0.27, flange: 0.31 }

/** Wraps of hose round a reel drum, out to `radius`. */
function wraps(x: number, radius: number): Placement[] {
  const out: Placement[] = []
  const n = 9
  for (let i = 0; i < n; i++) {
    const r = radius - 0.02
    out.push({ at: [x - REEL.length / 2 + 0.04 + (i * (REEL.length - 0.08)) / (n - 1), REEL.y, REEL.z], rot: [0, PI / 2, 0], scale: [r, r, r * 1.6] })
  }
  return out
}

/** Sausages wound round a reel in three coils, plus a string of them dangling out over the sill to the floor. */
function sausageLinks(x: number): Placement[] {
  const out: Placement[] = []
  for (let k = 0; k < 4; k++) {
    const r = 0.17 + k * 0.035
    const n = Math.round((2 * PI * r) / 0.13)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + k * 0.4
      out.push({ at: [x - 0.2 + k * 0.13, REEL.y + Math.sin(a) * r, REEL.z + Math.cos(a) * r], rot: [-a, 0, 0] })
    }
  }
  const curve = new CatmullRomCurve3([
    new Vector3(x + 0.05, REEL.y - 0.3, REEL.z + 0.12),
    new Vector3(x + 0.1, REEL.y - 0.6, 0.06),
    new Vector3(x + 0.12, 1.0, 0.22),
    new Vector3(x + 0.05, 0.45, 0.34),
    new Vector3(x - 0.1, 0.04, 0.55),
    new Vector3(x - 0.35, 0.04, 0.72),
  ])
  const links = 15
  const up = new Vector3(0, 1, 0)
  for (let i = 0; i < links; i++) {
    const t = (i + 0.5) / links
    const p = curve.getPointAt(t)
    const e = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(up, curve.getTangentAt(t)))
    out.push({ at: [p.x, Math.max(p.y, 0.035), p.z], rot: [e.x, e.y, e.z] })
  }
  return out
}

/** A hose reel's hose pulled right off the drum: over the sill, down to the floor and in loops across it, the gun at the end. */
const LOOSE_REEL = new CatmullRomCurve3(
  (
    [
      [REELS[0], REEL.y - 0.16, REEL.z + 0.02],
      [REELS[0] + 0.02, REAR.y0 + 0.04, 0.0],
      [REELS[0] + 0.03, REAR.y0 - 0.02, 0.08],
      [REELS[0] + 0.05, 0.9, 0.16],
      [REELS[0] + 0.1, 0.12, 0.32],
      [REELS[0] + 0.2, 0.03, 0.7],
      [0.6, 0.03, 1.05],
      [0.85, 0.03, 0.7],
      [0.45, 0.03, 0.55],
      [0.1, 0.03, 1.0],
      [0.3, 0.03, 1.5],
      [0.9, 0.03, 1.65],
    ] as Vec3[]
  ).map((p) => new Vector3(...p)),
)

/** The rear locker with its hose reels; open, one reel's hose is off across the floor, or it's wound with sausages. Facing +z (out of the back). */
export function RearLocker({ mode }: { mode: 'shut' | 'unspooled' | 'sausages' }) {
  const open = mode !== 'shut'
  const tube = useMemo(() => (mode === 'unspooled' ? new TubeGeometry(LOOSE_REEL, 200, 0.022, 8, false) : null), [mode])
  const coils = useMemo(() => [...(mode === 'unspooled' ? wraps(REELS[0], 0.15) : mode === 'shut' ? [] : wraps(REELS[0], REEL.full)), ...(mode === 'sausages' ? [] : open ? wraps(REELS[1], REEL.full) : [])], [mode, open])
  const links = useMemo(() => (mode === 'sausages' ? sausageLinks(REELS[1]) : []), [mode])
  const end = LOOSE_REEL.getPoint(1)
  return (
    <>
      <Shutter width={REAR.half * 2} y0={REAR.y0} y1={REAR.y1} open={open ? 0.9 : 0} />
      {open && (
        <>
          {REELS.map((x) => (
            <group key={x} position={[x, REEL.y, REEL.z]} rotation={[0, 0, PI / 2]}>
              <mesh material={REEL_FLANGE}>
                <cylinderGeometry args={[REEL.hub, REEL.hub, REEL.length, 20]} />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} material={REEL_FLANGE} position={[0, (s * REEL.length) / 2, 0]}>
                  <cylinderGeometry args={[REEL.flange, REEL.flange, 0.015, 32]} />
                </mesh>
              ))}
            </group>
          ))}
          {/* the axle the reels turn on, and the guide rollers at the sill */}
          <mesh material={HUB} position={[0, REEL.y, REEL.z]} rotation={[0, 0, PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, REAR.half * 2 - 0.02, 12]} />
          </mesh>
          <mesh material={HUB} position={[0, REAR.y0 + 0.04, -0.06]} rotation={[0, 0, PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, REAR.half * 2 - 0.1, 12]} />
          </mesh>
          <Instanced geometry={WRAP} material={REEL_HOSE} items={coils} />
          {links.length > 0 && <Instanced geometry={SAUSAGE} material={SAUSAGE_MAT} items={links} />}
          {tube && (
            <>
              <mesh geometry={tube} material={REEL_HOSE} castShadow />
              {/* the hose-reel gun */}
              <group position={end}>
                <Block size={[0.05, 0.05, 0.22]} position={[0, 0.03, 0.08]} color="#1a1b1d" roughness={0.5} radius={0.015} />
                <Block size={[0.04, 0.1, 0.04]} position={[0, -0.0, 0.03]} rotation={[0.4, 0, 0]} color="#d8241c" roughness={0.5} radius={0.012} />
              </group>
            </>
          )}
        </>
      )}
    </>
  )
}
