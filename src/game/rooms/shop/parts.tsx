import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  CylinderGeometry,
  LatheGeometry,
  MeshStandardMaterial,
  Object3D,
  Vector2,
  type Group,
  type InstancedMesh,
  type Mesh,
  type RectAreaLight,
} from 'three'
import { Block, Instanced, PanelLight, PI, type Placement } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { Outside } from '../../outside'
import type { Slice } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { ShadowFigure } from '../../figure'
import { FacesYou } from '../living/oddities'
import { FRIDGE_SHELVES, type FridgeKind } from './fridgeLayout'
import { SHOP_DOOR } from './front'
import { FridgeStock } from './fridgeStock'
import { rowZ, slots, type ShelfSpec } from './shelving'
import { BOX_DESIGNS, boxCover, CAN_DESIGNS, canLabel, matTexture, neonText, nightStreet } from './textures'

// ---------------------------------------------------------------------------
// Shelving and stock
// ---------------------------------------------------------------------------

/** A white metal shelving unit: a wall bay, or a double-sided aisle unit. */
export function Shelving({ spec }: { spec: ShelfSpec }) {
  const metal = { color: '#dfe4e8', metalness: 0.6, roughness: 0.35 }
  const { width: w, depth: d, height: h, levels, double } = spec
  const faces = double ? [1, -1] : [1]
  return (
    <>
      <Block size={[w, 0.1, d]} position={[0, 0.05, 0]} {...metal} radius={0.01} paint />
      {/* back panel, or the central divider of an aisle unit */}
      <Block
        size={[w, h, 0.03]}
        position={[0, h / 2, double ? 0 : -d / 2 + 0.015]}
        color="#c7cdd3"
        metalness={0.4}
        roughness={0.5}
        radius={0.005}
        paint
      />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, h, d]} position={[s * (w / 2 - 0.015), h / 2, 0]} {...metal} radius={0.005} paint />
      ))}
      {levels.map((y) => (
        <group key={y}>
          <Block size={[w - 0.06, 0.025, d - 0.02]} position={[0, y, 0]} {...metal} radius={0.004} paint />
          {faces.map((f) => (
            // yellow price strip along each stocked edge
            <Block key={f} size={[w - 0.06, 0.04, 0.01]} position={[0, y - 0.005, f * (d / 2 - 0.005)]} color="#ffde21" roughness={0.6} radius={0.003} />
          ))}
        </group>
      ))}
    </>
  )
}

const CAN_GEO = new CylinderGeometry(0.038, 0.038, 0.11, 28)
const CAN_TOP = new MeshStandardMaterial({ color: '#c9ced6', metalness: 0.9, roughness: 0.3 })

function useCanMaterials() {
  return useMemo(
    () => CAN_DESIGNS.map((d) => [new MeshStandardMaterial({ map: canLabel(d), roughness: 0.4, metalness: 0.3 }), CAN_TOP, CAN_TOP]),
    [],
  )
}

/** Rows of tins on every shelf of one face, apart from any shelves in `skip`. */
export function Tins({ spec, face = 1, skip = [] }: { spec: ShelfSpec; face?: 1 | -1; skip?: number[] }) {
  const materials = useCanMaterials()
  const byDesign = useMemo(() => {
    const out: Placement[][] = CAN_DESIGNS.map(() => [])
    const rng = mulberry32(21 + face)
    const z = rowZ(spec, 0.07)
    slots(spec, 0.086).forEach(({ y, xs }, row) => {
      if (skip.includes(row)) return
      xs.forEach((x, i) => {
        const m = (row * 2 + Math.floor(i / 4)) % CAN_DESIGNS.length
        // the name is printed a quarter of the way round the label, so turn it to face the aisle
        const rot = -PI / 2 + (rng() - 0.5) * 0.3
        // two tins deep, the back row slightly hidden
        for (const dz of [0, -0.09]) out[m].push({ at: [x, y + 0.055, z + dz], rot: [0, rot, 0] })
      })
    })
    return out
  }, [spec, face, skip])
  return (
    <group rotation={[0, face === 1 ? 0 : PI, 0]}>
      {byDesign.map((items, m) => (
        <Instanced key={m} geometry={CAN_GEO} material={materials[m]} items={items} />
      ))}
    </group>
  )
}

/** Rubber ducks in place of tins, on the shelves in `only`. */
export function DuckStock({ spec, face = 1, only }: { spec: ShelfSpec; face?: 1 | -1; only: number[] }) {
  const z = rowZ(spec, 0.08)
  const spots: Vec3[] = []
  slots(spec, 0.165).forEach(({ y, xs }, row) => {
    if (only.includes(row)) xs.forEach((x) => spots.push([x, y, z]))
  })
  return (
    <group rotation={[0, face === 1 ? 0 : PI, 0]}>
      {spots.map((at, i) => (
        <group key={i} position={at} rotation={[0, (i % 3) * 0.2 - 0.2, 0]}>
          <Model id="rubber_duck_toy" scale={0.42} paint={false} />
        </group>
      ))}
    </group>
  )
}

function useBoxMaterials() {
  return useMemo(
    () =>
      BOX_DESIGNS.map((d) => {
        const front = new MeshStandardMaterial({ map: boxCover(d), roughness: 0.6 })
        const side = new MeshStandardMaterial({ color: d.bg, roughness: 0.6 })
        // box faces: +x, -x, +y, -y, +z (front), -z
        return [side, side, side, side, front, side]
      }),
    [],
  )
}

/** Cereal boxes standing on one face; upside down or shrunk for the swaps. */
export function CerealBoxes({
  spec,
  face = 1,
  upside = false,
  tiny = false,
  levels,
}: {
  spec: ShelfSpec
  face?: 1 | -1
  upside?: boolean
  tiny?: boolean
  /** Which shelves `upside`/`tiny` apply to (all of them if left out). */
  levels?: number[]
}) {
  const materials = useBoxMaterials()
  const z = rowZ(spec, 0.06)
  const boxes: { at: Vec3; m: number; odd: boolean }[] = []
  slots(spec, 0.215).forEach(({ y, xs }, row) =>
    xs.forEach((x, i) => boxes.push({ at: [x, y, z], m: (row + i + (face === 1 ? 0 : 2)) % BOX_DESIGNS.length, odd: !levels || levels.includes(row) })),
  )
  return (
    <group rotation={[0, face === 1 ? 0 : PI, 0]}>
      {boxes.map((b, i) => (
        <group key={i} position={b.at} scale={tiny && b.odd ? 0.4 : 1}>
          <mesh material={materials[b.m]} position={[0, 0.14, 0]} rotation={[0, 0, upside && b.odd ? PI : 0]}>
            <boxGeometry args={[0.19, 0.28, 0.07]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Bottles of fizzy pop on one face (the snack aisle; it never changes). */
export function PopBottles({ spec, face = 1 }: { spec: ShelfSpec; face?: 1 | -1 }) {
  const byColour = useMemo(() => {
    const out: Placement[][] = BOTTLE_COLOURS.map(() => [])
    const z = rowZ(spec, 0.07)
    slots(spec, 0.08).forEach(({ y, xs }, row) =>
      xs.forEach((x, i) => {
        const c = (row + Math.floor(i / 3)) % BOTTLE_COLOURS.length
        for (const dz of [0, -0.09]) out[c].push({ at: [x, y, z + dz] })
      }),
    )
    return out
  }, [spec])
  return (
    <group rotation={[0, face === 1 ? 0 : PI, 0]}>
      {byColour.map((items, c) => (
        <Instanced key={c} geometry={BOTTLE} material={BOTTLE_MATS[c]} items={items} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Counter, till, lucky cat, jars
// ---------------------------------------------------------------------------

/** Long shop counter, built along local x, customer side facing +z. */
/**
 * Shop counter built along local x. The customer side (striped panel) faces +z;
 * the cashier side faces -z and is open, with two under-counter shelves.
 */
export function Counter({ length }: { length: number }) {
  return (
    <>
      {/* customer-facing panel, ends and kick plinth */}
      <Block size={[length, 0.9, 0.04]} position={[0, 0.45, 0.255]} color="#c0392b" roughness={0.45} radius={0.01} paint />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.04, 0.9, 0.55]} position={[s * (length / 2 - 0.02), 0.45, 0]} color="#c0392b" roughness={0.45} radius={0.01} />
      ))}
      <Block size={[length - 0.08, 0.08, 0.5]} position={[0, 0.04, 0]} color="#3a2a22" roughness={0.7} radius={0.004} />
      {[0.25, 0.55].map((y) => (
        <Block key={y} size={[length - 0.04, 0.03, 0.01]} position={[0, y, 0.28]} color="#f2efe8" roughness={0.4} radius={0.004} />
      ))}
      {/* cashier side: shelves for bags, receipt rolls and the float */}
      {[0.1, 0.45].map((y) => (
        <Block key={y} size={[length - 0.08, 0.025, 0.48]} position={[0, y, 0]} color="#e8e2d6" roughness={0.6} radius={0.004} />
      ))}
      {[-0.55, -0.15, 0.3].map((x, i) => (
        <Block key={x} size={[0.22, 0.16, 0.3]} position={[x * (length / 2), 0.55, -0.02]} color={['#f4f1ea', '#7a8f9c', '#d9c49a'][i]} roughness={0.8} radius={0.01} />
      ))}
      <Block size={[length + 0.06, 0.05, 0.62]} position={[0, 0.925, 0.02]} color="#f2efe8" roughness={0.25} radius={0.01} />
    </>
  )
}

/** The cashier's stool. */
export function Stool() {
  return (
    <>
      <mesh position={[0, 0.68, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.16, 0.06, 32]} />
        <meshStandardMaterial color="#1f1f22" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.64, 12]} />
        <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.012, 8, 32]} />
        <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.04, 32]} />
        <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.25} />
      </mesh>
    </>
  )
}

/** Maneki-neko, built facing +z, with a paw that waves. */
export function LuckyCat({ mirrored = false, staring = false }: { mirrored?: boolean; staring?: boolean }) {
  const paw = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (paw.current) paw.current.rotation.z = (mirrored ? -1 : 1) * (0.25 + Math.sin(clock.elapsedTime * 4) * 0.35)
  })
  const white = <meshStandardMaterial color="#fbf7ee" roughness={0.3} />
  const head = (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.075, 32, 24]} />
        {white}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.045, 0.06, 0]} rotation={[0, 0, -s * 0.3]}>
          <coneGeometry args={[0.025, 0.05, 12]} />
          {white}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.028, 0.012, 0.068]}>
          <sphereGeometry args={[0.009, 10, 8]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      ))}
      <mesh position={[0, -0.01, 0.073]}>
        <sphereGeometry args={[0.007, 8, 6]} />
        <meshStandardMaterial color="#ff8aa8" />
      </mesh>
    </group>
  )
  return (
    <group scale={[mirrored ? -1 : 1, 1, 1]}>
      <mesh position={[0, 0.08, 0]} scale={[1, 1.15, 0.9]} castShadow userData={{ paint: true }}>
        <sphereGeometry args={[0.075, 32, 24]} />
        <meshStandardMaterial color="#fbf7ee" roughness={0.3} />
      </mesh>
      {/* collar and coin */}
      <mesh position={[0, 0.145, 0.02]} rotation={[PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.008, 8, 32]} />
        <meshStandardMaterial color="#ff3131" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.08, 0.068]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.006, 24]} />
        <meshStandardMaterial color="#e2b13c" metalness={0.9} roughness={0.25} />
      </mesh>
      {staring ? <FacesYou position={[0, 0.21, 0]}>{head}</FacesYou> : <group position={[0, 0.21, 0]}>{head}</group>}
      {/* waving paw */}
      <group ref={paw} position={[0.065, 0.14, 0.02]}>
        <mesh position={[0.01, 0.05, 0]} castShadow>
          <capsuleGeometry args={[0.018, 0.06, 6, 12]} />
          {white}
        </mesh>
      </group>
    </group>
  )
}

/** A row of jars on a shelf: pickles, eyeballs, or something glowing. */
export function Jars({ contents }: { contents: 'pickles' | 'eyes' | 'glow' }) {
  const jar = useMemo(
    () =>
      new LatheGeometry(
        [
          [0, 0],
          [0.05, 0],
          [0.055, 0.02],
          [0.055, 0.15],
          [0.045, 0.17],
          [0.045, 0.19],
          [0, 0.19],
        ].map(([x, y]) => new Vector2(x, y)),
        32,
      ),
    [],
  )
  const fill = useMemo(() => {
    const rng = mulberry32(contents.length)
    return Array.from({ length: 5 }, () => Array.from({ length: 6 }, () => [(rng() - 0.5) * 0.06, 0.03 + rng() * 0.11, (rng() - 0.5) * 0.06] as Vec3))
  }, [contents])
  return (
    <>
      {fill.map((pieces, j) => (
        <group key={j} position={[-0.5 + j * 0.25, 0, 0]}>
          <mesh geometry={jar} renderOrder={2}>
            <meshPhysicalMaterial color="#eafff4" transparent opacity={0.28} roughness={0.05} clearcoat={1} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.048, 0.048, 0.02, 24]} />
            <meshStandardMaterial color="#d43a2c" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* brine */}
          <mesh position={[0, 0.085, 0]} userData={{ paint: true }}>
            <cylinderGeometry args={[0.05, 0.05, 0.15, 24]} />
            <meshStandardMaterial
              color={contents === 'glow' ? '#ff4fd8' : '#c9d86a'}
              emissive={contents === 'glow' ? '#ff4fd8' : '#000000'}
              emissiveIntensity={contents === 'glow' ? 1.2 : 0}
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
          {pieces.map((p, i) =>
            contents === 'eyes' ? (
              <group key={i} position={p}>
                <mesh>
                  <sphereGeometry args={[0.018, 14, 10]} />
                  <meshStandardMaterial color="#fffbe6" roughness={0.2} />
                </mesh>
                <mesh position={[0, 0, 0.016]}>
                  <sphereGeometry args={[0.007, 10, 8]} />
                  <meshBasicMaterial color="#1f6bff" />
                </mesh>
              </group>
            ) : (
              <mesh key={i} position={p} scale={[1, 2.2, 1]} rotation={[0.3 * i, 0, 0.5]}>
                <sphereGeometry args={[0.012, 12, 8]} />
                <meshStandardMaterial
                  color={contents === 'glow' ? '#fff0fb' : '#4f6b22'}
                  emissive={contents === 'glow' ? '#ff4fd8' : '#000000'}
                  emissiveIntensity={contents === 'glow' ? 1.5 : 0}
                  roughness={0.5}
                />
              </mesh>
            ),
          )}
        </group>
      ))}
      {contents === 'glow' && <pointLight position={[0, 0.15, 0.25]} intensity={1} distance={2} decay={2} color="#ff4fd8" />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Gumball machine
// ---------------------------------------------------------------------------

const GUM_COLOURS = ['#ff3131', '#1f6bff', '#ffde21', '#2fbf71', '#ff3fa4', '#ff8a1f']

export function GumballMachine({ fill }: { fill: 'gum' | 'eyes' | 'empty' }) {
  const balls = useRef<InstancedMesh>(null)
  const pupils = useRef<InstancedMesh>(null)
  const spots = useMemo(() => {
    const rng = mulberry32(8)
    const out: Vec3[] = []
    while (out.length < 46) {
      const p: Vec3 = [(rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3]
      if (Math.hypot(...p) < 0.135 && p[1] < 0.06) out.push(p)
    }
    return out
  }, [])
  // place the balls once, before the first frame is drawn
  useLayoutEffect(() => {
    const m = balls.current
    if (!m) return
    const o = new Object3D()
    spots.forEach((p, i) => {
      o.position.set(...p)
      o.lookAt(0, 0, 2) // eyeballs all look out at the shop
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      if (fill === 'gum') m.setColorAt(i, new Color(GUM_COLOURS[i % GUM_COLOURS.length]))
      if (pupils.current) {
        o.translateZ(0.019)
        o.updateMatrix()
        pupils.current.setMatrixAt(i, o.matrix)
      }
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    if (pupils.current) pupils.current.instanceMatrix.needsUpdate = true
  }, [spots, fill])
  return (
    <>
      <mesh position={[0, 0.4, 0]} castShadow userData={{ paint: true }}>
        <cylinderGeometry args={[0.09, 0.16, 0.8, 32]} />
        <meshStandardMaterial color="#e0262a" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow userData={{ paint: true }}>
        <cylinderGeometry args={[0.13, 0.11, 0.1, 32]} />
        <meshStandardMaterial color="#e0262a" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.82, 0.12]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 20]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
      </mesh>
      <group position={[0, 1.06, 0]}>
        {fill !== 'empty' && (
          <instancedMesh ref={balls} args={[undefined, undefined, spots.length]} key={fill}>
            <sphereGeometry args={[0.022, 14, 10]} />
            <meshStandardMaterial color={fill === 'eyes' ? '#fffbe6' : '#ffffff'} roughness={0.25} />
          </instancedMesh>
        )}
        {fill === 'eyes' && (
          <instancedMesh ref={pupils} args={[undefined, undefined, spots.length]}>
            <sphereGeometry args={[0.008, 10, 8]} />
            <meshBasicMaterial color="#111" />
          </instancedMesh>
        )}
        <mesh renderOrder={2}>
          <sphereGeometry args={[0.16, 40, 28]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.22} roughness={0.03} clearcoat={1} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <sphereGeometry args={[0.05, 24, 12, 0, PI * 2, 0, PI / 2]} />
          <meshStandardMaterial color="#e0262a" metalness={0.4} roughness={0.35} />
        </mesh>
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Drinks fridge (front is +z)
// ---------------------------------------------------------------------------

const BOTTLE = new LatheGeometry(
  [
    [0, 0],
    [0.032, 0],
    [0.034, 0.02],
    [0.034, 0.15],
    [0.016, 0.21],
    [0.012, 0.25],
    [0, 0.25],
  ].map(([x, y]) => new Vector2(x, y)),
  20,
)
const BOTTLE_COLOURS = ['#ff3131', '#2fbf71', '#ff8a1f', '#16d0ff', '#8a4dff']
const BOTTLE_MATS = BOTTLE_COLOURS.map((color) => new MeshStandardMaterial({ color, roughness: 0.15, transparent: true, opacity: 0.88 }))

export function Fridge({ contents, kind = 'fizzy' }: { contents: 'drinks' | 'empty' | 'eye'; kind?: FridgeKind }) {
  const eye = useRef<Group>(null)
  useFrame(({ camera }) => {
    if (eye.current) eye.current.lookAt(camera.position)
  })
  const rows = FRIDGE_SHELVES
  return (
    <>
      {/* a hollow cabinet: back, sides, base and header around a glass door */}
      <Block size={[1.2, 2.0, 0.04]} position={[0, 1.0, -0.33]} color="#f4f4f0" roughness={0.35} radius={0.01} paint />
      {[-1, 1].map((sx) => (
        <Block key={sx} size={[0.06, 2.0, 0.7]} position={[sx * 0.57, 1.0, 0]} color="#f4f4f0" roughness={0.35} radius={0.02} paint />
      ))}
      <Block size={[1.2, 0.16, 0.7]} position={[0, 0.08, 0]} color="#f4f4f0" roughness={0.35} radius={0.02} paint />
      <Block size={[1.2, 0.26, 0.7]} position={[0, 1.87, 0]} color="#f4f4f0" roughness={0.35} radius={0.02} paint />
      {/* lit back panel */}
      <mesh position={[0, 0.95, -0.305]}>
        <planeGeometry args={[1.08, 1.58]} />
        <meshStandardMaterial color="#cfe9ff" emissive="#9fd6ff" emissiveIntensity={0.55} />
      </mesh>
      {rows.map((y) => (
        <Block key={y} size={[1.08, 0.02, 0.6]} position={[0, y - 0.02, 0]} color="#c9ced6" metalness={0.7} roughness={0.3} radius={0.004} />
      ))}
      {contents === 'drinks' && <FridgeStock kind={kind} />}
      {contents === 'eye' && (
        <group ref={eye} position={[0, 0.95, 0]}>
          <mesh>
            <sphereGeometry args={[0.28, 48, 32]} />
            <meshStandardMaterial color="#fffbe6" roughness={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.26]}>
            <circleGeometry args={[0.12, 40]} />
            <meshStandardMaterial color="#2fbf71" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.265]}>
            <circleGeometry args={[0.055, 32]} />
            <meshBasicMaterial color="#050505" />
          </mesh>
        </group>
      )}
      {/* glass door, handle, sign */}
      <mesh position={[0, 0.95, 0.36]} renderOrder={2}>
        <planeGeometry args={[1.08, 1.68]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.15} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      <Block size={[0.04, 0.6, 0.04]} position={[0.5, 1.0, 0.39]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.01} />
      <Block size={[1.1, 0.2, 0.02]} position={[0, 1.87, 0.36]} color="#1f6bff" emissive="#1f6bff" emissiveIntensity={0.4} radius={0.01} />
      <pointLight position={[0, 1.0, 0.8]} intensity={1} distance={3} decay={2} color="#bfe6ff" />
    </>
  )
}

// ---------------------------------------------------------------------------
// Neon sign, security camera, strip lights
// ---------------------------------------------------------------------------

export function NeonSign({ text, colour }: { text: string; colour: string }) {
  const map = useMemo(() => neonText(text, colour), [text, colour])
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    // the odd neon stutter
    if (ref.current) ref.current.visible = Math.sin(clock.elapsedTime * 13) > -0.98
  })
  return (
    <>
      <Block size={[1.7, 0.5, 0.03]} position={[0, 0, 0.015]} color="#151515" roughness={0.6} radius={0.01} />
      <mesh ref={ref} position={[0, 0, 0.035]} userData={{ paint: true }}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshBasicMaterial map={map} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0.4]} intensity={1.2} distance={3} decay={2} color={colour} />
    </>
  )
}

/** Ceiling-mounted CCTV camera; points at you unless `away`. Built with the lens facing +z. */
export function SecurityCamera({ away = false }: { away?: boolean }) {
  const head = (
    <>
      <Block size={[0.12, 0.11, 0.26]} position={[0, 0, 0.05]} color="#e8e8e2" roughness={0.4} radius={0.02} paint />
      <mesh position={[0, 0, 0.19]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.045, 0.03, 24]} />
        <meshStandardMaterial color="#111" roughness={0.2} />
      </mesh>
      <mesh position={[0.04, 0.035, 0.18]}>
        <sphereGeometry args={[0.008, 8, 6]} />
        <meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={3} />
      </mesh>
    </>
  )
  return (
    <group scale={1.8}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.14, 10]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.8} />
      </mesh>
      {away ? (
        <group rotation={[0.5, PI * 0.75, 0]}>{head}</group>
      ) : (
        <FacesYou position={[0, 0, 0]}>{head}</FacesYou>
      )}
    </group>
  )
}

/**
 * Fluorescent tubes along x at the given z positions. The flickering tube dims
 * its light and glow rather than switching them off: hiding a light changes
 * the scene's light count, which makes three.js recompile every shader.
 */
export function StripLights({ mode, zs, height, length }: { mode: 'normal' | 'flicker' | 'green'; zs: number[]; height: number; length: number }) {
  const power = 2.6
  const flicker = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!flicker.current) return
    const t = clock.elapsedTime
    const level = Math.sin(t * 23) + Math.sin(t * 7.3) > -0.6 ? 1 : 0.08
    flicker.current.traverse((o) => {
      if ((o as RectAreaLight).isRectAreaLight) (o as RectAreaLight).intensity = power * level
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (m?.emissive) m.emissiveIntensity = 2 * level
    })
  })
  return (
    <>
      {zs.map((z, i) => {
        // the green swap turns just one tube green
        const colour = mode === 'green' && i === 2 ? '#7dff9a' : '#f2fbff'
        return (
        <group key={z}>
          <Block size={[length + 0.1, 0.03, 0.16]} position={[0, height - 0.012, z]} color="#d8dde2" metalness={0.5} roughness={0.4} radius={0.01} />
          <group ref={mode === 'flicker' && i === 1 ? flicker : undefined}>
            <Block size={[length, 0.05, 0.09]} position={[0, height - 0.035, z]} color={colour} emissive={colour} emissiveIntensity={2} radius={0.02} />
            <PanelLight position={[0, height - 0.07, z]} size={[length, 0.2]} facing={[0, 0, z]} color={colour} intensity={power} />
          </group>
        </group>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Door and doormat
// ---------------------------------------------------------------------------

/** The shop door, its glass onto the street; `watcher`: someone's standing outside it, looking in. */
export function ShopDoor({ watcher, ...slice }: { watcher: boolean } & Slice) {
  const { width: gw, y0, y1 } = SHOP_DOOR.glass
  const stile = (0.95 - gw) / 2
  const door = { color: '#2f5d50', roughness: 0.45, radius: 0.004, paint: true }
  return (
    <>
      <Outside layers={nightStreet()} {...slice} />
      {/* stiles either side of the glass, rails above and below it */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[stile, 2.1, 0.05]} position={[s * (gw + stile) / 2, 1.05, 0.025]} {...door} />
      ))}
      <Block size={[gw, y0, 0.05]} position={[0, y0 / 2, 0.025]} {...door} />
      <Block size={[gw, 2.1 - y1, 0.05]} position={[0, (y1 + 2.1) / 2, 0.025]} {...door} />
      <mesh position={[0, (y0 + y1) / 2, 0.025]} renderOrder={2}>
        <planeGeometry args={[gw, y1 - y0]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      {watcher && (
        // a tall dark someone, a step back from the glass on the pavement, looking in
        <group position={[0.06, 0, -0.75]}>
          <ShadowFigure height={1.9} />
        </group>
      )}
      <Block size={[0.66, 0.04, 0.03]} position={[0, 1.88, 0.06]} color="#d8dde2" metalness={0.6} roughness={0.3} radius={0.005} />
      <Block size={[0.66, 0.04, 0.03]} position={[0, 0.88, 0.06]} color="#d8dde2" metalness={0.6} roughness={0.3} radius={0.005} />
      <Block size={[0.04, 0.3, 0.04]} position={[0.36, 1.0, 0.08]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.01} />
      {/* frame */}
      <Block size={[0.07, 2.16, 0.07]} position={[-0.51, 1.08, 0.03]} color="#f2efe8" roughness={0.45} />
      <Block size={[0.07, 2.16, 0.07]} position={[0.51, 1.08, 0.03]} color="#f2efe8" roughness={0.45} />
      <Block size={[1.09, 0.07, 0.07]} position={[0, 2.16, 0.03]} color="#f2efe8" roughness={0.45} />
    </>
  )
}

export function Doormat({ text }: { text: string }) {
  const map = useMemo(() => matTexture(text), [text])
  return (
    // reads the right way up to someone walking in through the door
    <mesh position={[0, 0.008, 0]} rotation={[-PI / 2, 0, 0]} receiveShadow userData={{ paint: true }}>
      <boxGeometry args={[0.9, 0.56, 0.015]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}

/** The big front window, looking out at the street at night. `y`: how high its middle is. */
export function ShopWindow({ width, height, y, ...slice }: { width: number; height: number; y: number } & Slice) {
  return (
    <>
      <Outside layers={nightStreet()} y={y} {...slice} />
      {/* glass sheen */}
      <mesh position={[0, 0, 0.02]} renderOrder={2}>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      {[-1, 1].map((sy) => (
        <Block key={sy} size={[width + 0.12, 0.08, 0.1]} position={[0, sy * (height / 2 + 0.04), 0.05]} color="#f2efe8" roughness={0.45} radius={0.01} />
      ))}
      {[-1, 0, 1].map((sx) => (
        <Block key={sx} size={[0.07, height, 0.08]} position={[sx * (width / 2 + 0.025) * (sx === 0 ? 0 : 1), 0, 0.04]} color="#f2efe8" roughness={0.45} radius={0.01} />
      ))}
      <Block size={[width + 0.2, 0.04, 0.25]} position={[0, -height / 2 - 0.08, 0.12]} color="#f2efe8" roughness={0.45} radius={0.01} />
    </>
  )
}
