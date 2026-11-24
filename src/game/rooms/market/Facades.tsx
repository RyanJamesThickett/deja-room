import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, ExtrudeGeometry, MeshStandardMaterial, PlaneGeometry, Shape, type Group, type Mesh } from 'three'
import { Instanced, PI, type Placement } from '../../kit'
import { once } from '../../outsideLayers'
import { FacesYou, MeltedClock } from '../living/oddities'
import { Bar } from './Bar'
import { GROUND, PAWN, signPanel, STALL_SIGNS, STOREY } from './cityPlan'
import { cityMaterials, MAT } from './materials'
import { awningMaterials, BALL, DISC, lathe, matteMaterial, PLANE, UNIT_BOX } from './stallParts'
import { Sway } from './Street'
import { barberTexture, billboardTexture, clockTexture, flagTexture, pubSignTexture, shutterTexture, watchWindowTexture } from './textures'

/*
 * Things fixed to the buildings, each built in its wall's space: the wall
 * face at z = 0, the square towards +z.
 */

// ---------------------------------------------------------------------------
// The clock high on the stone building
// ---------------------------------------------------------------------------

const CLOCK_R = 0.9

function Hands() {
  // ten to two... near enough: 1:48
  const hour = ((1 + 48 / 60) / 12) * PI * 2
  const minute = (48 / 60) * PI * 2
  return (
    <group position={[0, 0, 0.2]}>
      <mesh geometry={UNIT_BOX} material={MAT.black} rotation={[0, 0, -hour]} position={[Math.sin(hour) * 0.22, Math.cos(hour) * 0.22, 0]} scale={[0.05, 0.48, 0.02]} />
      <mesh geometry={UNIT_BOX} material={MAT.black} rotation={[0, 0, -minute]} position={[Math.sin(minute) * 0.33, Math.cos(minute) * 0.33, 0.015]} scale={[0.035, 0.7, 0.02]} />
      <mesh geometry={DISC} material={MAT.brass} rotation={[PI / 2, 0, 0]} position={[0, 0, 0.03]} scale={[0.06, 0.03, 0.06]} />
    </group>
  )
}

export function Clock({ mode }: { mode: 'default' | 'thirteen' | 'backwards' | 'melted' }) {
  return (
    <group>
      {/* a stone roundel with a carved frame round it */}
      <mesh geometry={DISC} material={MAT.stone} position={[0, 0, 0.08]} rotation={[PI / 2, 0, 0]} scale={[CLOCK_R + 0.22, 0.16, CLOCK_R + 0.22]} castShadow />
      {mode === 'melted' ? (
        <group position={[0, -0.05, 0.16]}>
          <MeltedClock radius={CLOCK_R} />
        </group>
      ) : (
        <>
          <mesh position={[0, 0, 0.165]}>
            <circleGeometry args={[CLOCK_R, 48]} />
            <meshStandardMaterial map={clockTexture(mode)} roughness={0.5} />
          </mesh>
          <Hands />
        </>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The billboard on the west side
// ---------------------------------------------------------------------------

export function Billboard({ mode }: { mode: 'default' | 'eyes' | 'text' }) {
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.black} position={[0, 0, 0.12]} scale={[6.3, 3.3, 0.1]} castShadow />
      <mesh geometry={PLANE} position={[0, 0, 0.18]} scale={[6, 3, 1]}>
        <meshStandardMaterial map={billboardTexture(mode)} roughness={0.6} />
      </mesh>
      {/* lamps on arms over the top, and brackets to the wall */}
      {[-2, 0, 2].map((x) => (
        <group key={x}>
          <Bar a={[x, 1.65, 0.05]} b={[x, 1.95, 0.75]} r={0.02} material={MAT.black} />
          <mesh geometry={UNIT_BOX} material={MAT.black} position={[x, 1.92, 0.8]} rotation={[0.6, 0, 0]} scale={[0.35, 0.1, 0.18]} />
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Fire escape: platforms at each upper floor, zigzag stairs, a drop ladder
// ---------------------------------------------------------------------------

const FE = { w: 3.8, d: 0.9, floors: [1, 2, 3] }
const floorY = (s: number) => GROUND + (s - 1) * STOREY

const fireEscape = once(() => {
  const balusters: Placement[] = []
  const steps: Placement[] = []
  for (const s of FE.floors) {
    const y = floorY(s)
    for (let x = -FE.w / 2; x <= FE.w / 2 + 0.01; x += 0.16) balusters.push({ at: [x, y + 0.5, FE.d], scale: [0.015, 1.0, 0.015] })
    for (const sx of [-1, 1]) for (let z = 0.16; z < FE.d; z += 0.16) balusters.push({ at: [(sx * FE.w) / 2, y + 0.5, z], scale: [0.015, 1.0, 0.015] })
  }
  // stairs from each platform up to the next, alternating direction
  for (let i = 0; i < FE.floors.length - 1; i++) {
    const y0 = floorY(FE.floors[i])
    const dir = i % 2 ? -1 : 1
    for (let k = 1; k < 16; k++) {
      const t = k / 16
      steps.push({ at: [dir * (-1.4 + t * 2.6), y0 + t * STOREY, 0.32], scale: [0.2, 0.025, 0.5] })
    }
  }
  return { balusters, steps }
})

function Ladder({ y0, y1 }: { y0: number; y1: number }) {
  const rungs = Math.floor((y1 - y0) / 0.3)
  return (
    <group position={[1.5, 0, 0.6]}>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} geometry={UNIT_BOX} material={MAT.iron} position={[x, (y0 + y1) / 2, 0]} scale={[0.04, y1 - y0, 0.04]} castShadow />
      ))}
      {Array.from({ length: rungs }, (_, k) => (
        <mesh key={k} geometry={UNIT_BOX} material={MAT.iron} position={[0, y0 + 0.15 + k * 0.3, 0]} scale={[0.4, 0.025, 0.025]} />
      ))}
    </group>
  )
}

export function FireEscape({ mode }: { mode: 'default' | 'ladder' | 'washing' }) {
  const f = fireEscape()
  const y1 = floorY(1)
  return (
    <group>
      {FE.floors.map((s) => {
        const y = floorY(s)
        return (
          <group key={s}>
            <mesh geometry={UNIT_BOX} material={MAT.iron} position={[0, y, FE.d / 2]} scale={[FE.w, 0.05, FE.d]} castShadow receiveShadow />
            <mesh geometry={UNIT_BOX} material={MAT.iron} position={[0, y + 1.0, FE.d]} scale={[FE.w, 0.04, 0.04]} />
            {[-1, 1].map((sx) => (
              <mesh key={sx} geometry={UNIT_BOX} material={MAT.iron} position={[(sx * FE.w) / 2, y + 1.0, FE.d / 2]} scale={[0.04, 0.04, FE.d]} />
            ))}
            {/* brackets under the platform into the wall */}
            {[-1, 1].map((sx) => (
              <Bar key={sx} a={[sx * 1.6, y - 0.6, 0.02]} b={[sx * 1.6, y - 0.02, FE.d - 0.05]} r={0.02} material={MAT.iron} />
            ))}
          </group>
        )
      })}
      <Instanced geometry={UNIT_BOX} material={MAT.iron} items={f.balusters} />
      <Instanced geometry={UNIT_BOX} material={MAT.iron} items={f.steps} castShadow />
      {mode === 'ladder' ? <Ladder y0={0.05} y1={y1 + 0.2} /> : <Ladder y0={y1 + 0.05} y1={y1 + 1.9} />}
      {mode === 'washing' && <Washing y={floorY(2)} />}
    </group>
  )
}

/** A washing line strung along the second-floor platform, with the week's laundry on it. */
function Washing({ y }: { y: number }) {
  const items = [
    { x: -1.5, w: 0.45, h: 0.55, c: '#e8402a' },
    { x: -0.95, w: 0.3, h: 0.7, c: '#1f6bff' },
    { x: -0.45, w: 0.5, h: 0.4, c: '#f2d23a' },
    { x: 0.1, w: 0.6, h: 0.9, c: '#ffffff' },
    { x: 0.75, w: 0.35, h: 0.5, c: '#2fbf71' },
    { x: 1.25, w: 0.4, h: 0.62, c: '#ff3fa4' },
  ]
  return (
    <group position={[0, y + 1.75, FE.d + 0.05]}>
      <mesh geometry={UNIT_BOX} material={MAT.string} scale={[3.7, 0.01, 0.01]} />
      {items.map((it) => (
        <mesh key={it.x} geometry={PLANE} material={matteMaterial(it.c)} position={[it.x, -it.h / 2, 0]} scale={[it.w, it.h, 1]} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The window someone watches from, and the pawnbroker's shutter
// ---------------------------------------------------------------------------

export function WatchWindow({ mode }: { mode: 'default' | 'figure' | 'drawn' }) {
  const trim = '#e9e2d2'
  const t = matteMaterial(trim)
  return (
    <group>
      <mesh geometry={PLANE} position={[0, 0, 0.03]} scale={[1.05, 1.75, 1]}>
        <meshStandardMaterial map={watchWindowTexture(mode)} roughness={0.25} metalness={0.15} />
      </mesh>
      <mesh geometry={UNIT_BOX} material={t} position={[0, -0.915, 0.1]} scale={[1.29, 0.08, 0.2]} />
      <mesh geometry={UNIT_BOX} material={t} position={[0, 0.995, 0.06]} scale={[1.35, 0.24, 0.12]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={UNIT_BOX} material={t} position={[s * 0.56, 0, 0.05]} scale={[0.07, 1.75, 0.1]} />
      ))}
    </group>
  )
}

export function Shutter({ mode }: { mode: 'default' | 'open' | 'eye' }) {
  const w = PAWN.x1 - PAWN.x0
  const h = PAWN.top
  const bottom = mode === 'open' ? 1.95 : 0
  const map = shutterTexture(mode === 'eye' ? 'eye' : 'tag')
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={UNIT_BOX} material={MAT.steel} position={[(s * w) / 2, h / 2, 0.05]} scale={[0.06, h, 0.08]} />
      ))}
      <mesh geometry={PLANE} position={[0, (bottom + h) / 2, 0.05]} scale={[w, h - bottom, 1]}>
        <meshStandardMaterial map={map} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh geometry={UNIT_BOX} material={MAT.steel} position={[0, bottom + 0.03, 0.06]} scale={[w, 0.06, 0.05]} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// The café's awning
// ---------------------------------------------------------------------------

const CAFE = { w: 5.6, top: 3.0, out: 1.9, drop: 0.5 }

export function CafeAwning({ mode }: { mode: 'default' | 'rolled' }) {
  const m = awningMaterials('#1f5a3f|along')
  const { signs } = cityMaterials()
  const slope = Math.atan2(CAFE.drop, CAFE.out)
  const len = Math.hypot(CAFE.drop, CAFE.out)
  if (mode === 'rolled')
    return (
      <group position={[0, CAFE.top, 0.14]}>
        <mesh geometry={DISC} material={m.sheet} rotation={[0, 0, PI / 2]} scale={[0.12, CAFE.w, 0.12]} castShadow userData={{ paint: true }} />
        <mesh geometry={UNIT_BOX} material={MAT.steel} position={[0, -0.1, 0.1]} scale={[CAFE.w, 0.05, 0.05]} />
      </group>
    )
  return (
    <group position={[0, CAFE.top, 0]}>
      <mesh geometry={PLANE} material={m.canvas} position={[0, -CAFE.drop / 2, CAFE.out / 2]} rotation={[-PI / 2 + slope, 0, 0]} scale={[CAFE.w, len, 1]} castShadow userData={{ paint: true }} />
      <mesh geometry={PLANE} material={m.valance} position={[0, -CAFE.drop - 0.17, CAFE.out]} scale={[CAFE.w, 0.34, 1]} castShadow userData={{ paint: true }} />
      <mesh geometry={signPanel(STALL_SIGNS.cafeValance)} material={signs} position={[0, -CAFE.drop - 0.09, CAFE.out + 0.005]} scale={[3.0, 0.16, 1]} />
      <mesh geometry={UNIT_BOX} material={MAT.steel} position={[0, -CAFE.drop, CAFE.out]} scale={[CAFE.w, 0.05, 0.05]} />
      {[-1, 1].map((s) => (
        <Bar key={s} a={[s * (CAFE.w / 2 - 0.3), -0.9, 0.02]} b={[s * (CAFE.w / 2 - 0.4), -CAFE.drop, CAFE.out - 0.05]} r={0.018} material={MAT.steel} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Flag on a pole out from the stone building
// ---------------------------------------------------------------------------

const POLE_TILT = PI / 4
const POLE_LEN = 3.6

/** A flag flying from near the end of the pole, rippling. */
function FlyingFlag({ mode, along }: { mode: 'city' | 'pirate'; along: number }) {
  const geo = useMemo(() => new PlaneGeometry(1.7, 1.05, 12, 4).translate(0.85, -0.525, 0), [])
  const rest = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo])
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const p = mesh.geometry.attributes.position
    const t = clock.elapsedTime
    for (let i = 0; i < p.count; i++) {
      const x = rest[i * 3]
      p.setZ(i, Math.sin(x * 3.2 - t * 3.5) * 0.08 * x)
      p.setY(i, rest[i * 3 + 1] - x * x * 0.05)
    }
    p.needsUpdate = true
    mesh.geometry.computeVertexNormals()
  })
  return (
    // the hoist edge runs down the pole; the fly streams out sideways
    <group position={[0, along, 0]} rotation={[-POLE_TILT, 0, 0]}>
      <mesh ref={ref} geometry={geo} castShadow>
        <meshStandardMaterial map={flagTexture(mode)} roughness={0.8} side={DoubleSide} />
      </mesh>
    </group>
  )
}

export function Flag({ mode }: { mode: 'default' | 'pirate' | 'halfmast' }) {
  return (
    <group rotation={[POLE_TILT, 0, 0]}>
      <mesh geometry={DISC} material={MAT.white} position={[0, POLE_LEN / 2, 0]} scale={[0.035, POLE_LEN, 0.035]} castShadow />
      <mesh geometry={BALL} material={MAT.brass} position={[0, POLE_LEN + 0.04, 0]} scale={0.07} />
      <mesh geometry={UNIT_BOX} material={MAT.iron} position={[0, 0.1, 0]} scale={[0.2, 0.3, 0.2]} />
      <FlyingFlag mode={mode === 'pirate' ? 'pirate' : 'city'} along={mode === 'halfmast' ? POLE_LEN * 0.55 : POLE_LEN - 0.08} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Satellite dish, pub sign, pharmacy cross, barber's pole
// ---------------------------------------------------------------------------

const DISH = lathe([[0, -0.08], [0.15, -0.07], [0.3, -0.035], [0.4, 0], [0.4, 0.01], [0.3, -0.025], [0.15, -0.06], [0, -0.07]], 28).rotateX(PI / 2)

/** The dish, its hollow facing +z (out of the bracket). */
function DishHead() {
  return (
    <group>
      <mesh geometry={DISH} material={MAT.white} castShadow />
      <Bar a={[0, -0.36, 0.0]} b={[0, -0.05, 0.42]} r={0.012} material={MAT.steel} />
      <mesh geometry={UNIT_BOX} material={MAT.black} position={[0, -0.04, 0.44]} scale={[0.05, 0.07, 0.09]} />
    </group>
  )
}

export function Dish({ mode }: { mode: 'default' | 'watch' }) {
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.steel} position={[0, 0, 0.2]} scale={[0.05, 0.05, 0.4]} />
      <mesh geometry={UNIT_BOX} material={MAT.steel} position={[0, 0, 0.02]} scale={[0.18, 0.25, 0.04]} />
      {mode === 'watch' ? (
        <FacesYou position={[0, 0, 0.45]}>
          <DishHead />
        </FacesYou>
      ) : (
        // aimed up at the sky to the south, like every other dish
        <group position={[0, 0, 0.45]} rotation={[-0.6, 0.5, 0]}>
          <DishHead />
        </group>
      )}
    </group>
  )
}

/** The pub's sign, hanging from a scrolled bracket, its faces to either side along the street. */
export function PubSign({ mode }: { mode: 'default' | 'headless' }) {
  const map = pubSignTexture(mode)
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.black} position={[0, 0.4, 0.6]} scale={[0.05, 0.05, 1.2]} castShadow />
      <Bar a={[0, -0.1, 0.02]} b={[0, 0.4, 0.7]} r={0.018} material={MAT.black} />
      <group position={[0, 0.38, 0.78]}>
        <Sway amount={0.04} speed={0.8}>
          {[-0.3, 0.3].map((z) => (
            <mesh key={z} geometry={UNIT_BOX} material={MAT.black} position={[0, -0.1, z]} scale={[0.01, 0.2, 0.01]} />
          ))}
          <group position={[0, -0.72, 0]} rotation={[0, PI / 2, 0]}>
            <mesh geometry={UNIT_BOX} material={matteMaterial('#2a1a10')} scale={[0.82, 1.02, 0.05]} castShadow />
            {[-1, 1].map((s) => (
              <mesh key={s} geometry={PLANE} position={[0, 0, s * 0.026]} rotation={[0, s > 0 ? 0 : PI, 0]} scale={[0.74, 0.94, 1]}>
                <meshStandardMaterial map={map} roughness={0.6} />
              </mesh>
            ))}
          </group>
        </Sway>
      </group>
    </group>
  )
}

const HEART = (() => {
  const s = new Shape()
  s.moveTo(0, -0.42)
  s.bezierCurveTo(-0.15, -0.25, -0.45, -0.05, -0.42, 0.18)
  s.bezierCurveTo(-0.38, 0.42, -0.08, 0.45, 0, 0.22)
  s.bezierCurveTo(0.08, 0.45, 0.38, 0.42, 0.42, 0.18)
  s.bezierCurveTo(0.45, -0.05, 0.15, -0.25, 0, -0.42)
  return new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 })
})()

const CROSS_MAT = new MeshStandardMaterial({ color: '#1faa5a', emissive: '#2aff7a', emissiveIntensity: 0.35, roughness: 0.3 })
const HEART_MAT = new MeshStandardMaterial({ color: '#e0202a', emissive: '#ff2a3a', emissiveIntensity: 0.4, roughness: 0.3 })

export function PharmacyCross({ mode }: { mode: 'default' | 'heart' }) {
  const ref = useRef<Group>(null)
  const heart = useRef<Mesh>(null)
  const glow = mode === 'heart' ? HEART_MAT : CROSS_MAT
  useFrame(({ clock }) => {
    if (!ref.current || !heart.current) return
    // a heartbeat: two quick thumps, then a rest
    const t = (clock.elapsedTime * 1.1) % 1
    const beat = Math.max(0, Math.sin(t * PI * 6)) * (t < 0.35 ? 1 : 0)
    ref.current.scale.setScalar(1 + beat * 0.12)
    ;(heart.current.material as MeshStandardMaterial).emissiveIntensity = 0.4 + beat * 1.6
  })
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.black} position={[0, 0, 0.04]} scale={[1.2, 1.2, 0.08]} />
      <group ref={ref} position={[0, 0, 0.1]}>
        {mode === 'heart' ? (
          <mesh ref={heart} geometry={HEART} material={glow} castShadow />
        ) : (
          <>
            <mesh geometry={UNIT_BOX} material={glow} scale={[1.0, 0.34, 0.1]} />
            <mesh geometry={UNIT_BOX} material={glow} scale={[0.34, 1.0, 0.1]} />
          </>
        )}
      </group>
    </group>
  )
}

const BARBER_MAT = once(() => {
  const map = barberTexture().clone()
  map.repeat.set(1, 2)
  map.needsUpdate = true
  return new MeshStandardMaterial({ map, roughness: 0.3 })
})

export function BarberPole() {
  const pole = useRef<Mesh>(null)
  useFrame((_, dt) => {
    const map = (pole.current?.material as MeshStandardMaterial | undefined)?.map
    if (map) map.offset.y = (map.offset.y + dt * 0.4) % 1
  })
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.chrome} position={[0, 0, 0.12]} scale={[0.04, 0.04, 0.24]} />
      <mesh ref={pole} geometry={DISC} material={BARBER_MAT()} position={[0, 0, 0.3]} scale={[0.07, 0.7, 0.07]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={BALL} material={MAT.chrome} position={[0, s * 0.38, 0.3]} scale={0.085} />
      ))}
    </group>
  )
}
