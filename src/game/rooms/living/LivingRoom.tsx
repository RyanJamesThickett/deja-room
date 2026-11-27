import { Environment } from '@react-three/drei'
import { memo, useMemo } from 'react'
import { DoubleSide, LatheGeometry, MeshStandardMaterial, Object3D, Path, PlaneGeometry, Shape, ShapeGeometry, TorusGeometry, Vector2, Vector3 } from 'three'
import { useSurface, type Surface } from '../../assets'
import { Block, Decoy, Instanced, Item, PanelLight, PI, Variant, Wallpaper, type Placement } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { dimCorridorTexture } from '../../doorway'
import { TUBE_ROUTES } from '../../tubeRoutes'
import { AlienSky, FloatingOrb, JellyTube, LavaLamp, LivingPicture } from '../../weird'
import {
  AirFish,
  CoffeePuddle,
  FacesYou,
  GlowingFlowers,
  Hover,
  ImpossibleStairs,
  MeltedClock,
  OpenBook,
  OutsideWorld,
  RainCloud,
  Shark,
  TigerRug,
  TvScreen,
  WallEye,
} from './oddities'
import { LIVING_BOUNDS as ROOM } from './bounds'

/*
 * The living room. Real furniture is Poly Haven scans; the shelf, books,
 * door, curtains and lamp are built here; the strange things live in
 * weird.tsx. Every changeable object is an <Item>: a group named after its
 * id in items.ts. Swappable items have child groups `${id}:default` and
 * `${id}:${variant}`, with only the default visible.
 */

const WALL_TINT = '#f1e6d6'
const TRIM = '#f6f1e8'

// ---------------------------------------------------------------------------
// Walls, floor, window, lights
// ---------------------------------------------------------------------------

function Wall({ width, position, rotation }: { width: number; position: Vec3; rotation: Vec3 }) {
  const plaster = useSurface('painted_plaster_wall', width / 2, ROOM.height / 2)
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[width, ROOM.height]} />
      <meshStandardMaterial color={WALL_TINT} {...plaster} />
    </mesh>
  )
}

/** The back wall, with a real hole where the window is so the outside can show through. */
function WindowWall({ width, z, hole }: { width: number; z: number; hole: { x: number; y: number; w: number; h: number } }) {
  const plaster = useSurface('painted_plaster_wall', 0.5, 0.5)
  const geometry = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-width / 2, 0)
    shape.lineTo(width / 2, 0)
    shape.lineTo(width / 2, ROOM.height)
    shape.lineTo(-width / 2, ROOM.height)
    shape.closePath()
    const opening = new Path()
    opening.moveTo(hole.x - hole.w / 2, hole.y - hole.h / 2)
    opening.lineTo(hole.x - hole.w / 2, hole.y + hole.h / 2)
    opening.lineTo(hole.x + hole.w / 2, hole.y + hole.h / 2)
    opening.lineTo(hole.x + hole.w / 2, hole.y - hole.h / 2)
    opening.closePath()
    shape.holes.push(opening)
    return new ShapeGeometry(shape)
  }, [width, hole])
  return (
    <mesh geometry={geometry} position={[0, 0, z]} receiveShadow>
      <meshStandardMaterial color={WALL_TINT} {...plaster} />
    </mesh>
  )
}

const WINDOW = { x: 1.8, y: 1.5, w: 1.4, h: 1.1 }
/** Centre of the doorway along the right-hand wall. */
const DOOR_Z = -1.3
/** The curtain pole: its height, and how far it stands off the window wall. */
const RAIL = { y: 2.32, z: 0.15 }

function Structure() {
  const { halfX, halfZ, height } = ROOM
  const w = halfX * 2
  const d = halfZ * 2
  const parquet = useSurface('herringbone_parquet', 3, 2.6)
  return (
    <group>
      <mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#d9c3a5" {...parquet} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#f4efe8" roughness={0.95} />
      </mesh>

      <WindowWall width={w} z={-halfZ} hole={WINDOW} />
      <Wall width={w} position={[0, height / 2, halfZ]} rotation={[0, PI, 0]} />
      <Wall width={d} position={[-halfX, height / 2, 0]} rotation={[0, PI / 2, 0]} />
      <Wall width={d} position={[halfX, height / 2, 0]} rotation={[0, -PI / 2, 0]} />

      {/* skirting and coving */}
      {[
        { size: [w, 0.12, 0.018] as Vec3, at: [0, 0, -halfZ + 0.009] as Vec3 },
        { size: [w, 0.12, 0.018] as Vec3, at: [0, 0, halfZ - 0.009] as Vec3 },
        { size: [0.018, 0.12, d] as Vec3, at: [-halfX + 0.009, 0, 0] as Vec3 },
        { size: [0.018, 0.12, d] as Vec3, at: [halfX - 0.009, 0, 0] as Vec3, door: true },
      ].map(({ size, at, door }, i) => (
        <group key={i}>
          {door ? (
            // the skirting stops at the door's architrave rather than running across the doorway
            [
              [-halfZ, DOOR_Z - 0.52],
              [DOOR_Z + 0.52, halfZ],
            ].map(([z0, z1]) => (
              <Block key={z0} size={[size[0], 0.12, z1 - z0]} position={[at[0], 0.06, (z0 + z1) / 2]} color={TRIM} roughness={0.5} radius={0.004} />
            ))
          ) : (
            <Block size={size} position={[at[0], 0.06, at[2]]} color={TRIM} roughness={0.5} radius={0.004} />
          )}
          <Block size={[size[0], 0.06, size[2]]} position={[at[0], height - 0.03, at[2]]} color={TRIM} roughness={0.6} radius={0.004} />
        </group>
      ))}

      {/* window onto somewhere that isn't here */}
      <group position={[WINDOW.x, WINDOW.y, -halfZ]}>
        <Block size={[1.56, 0.08, 0.08]} position={[0, 0.59, 0.04]} color={TRIM} roughness={0.4} />
        <Block size={[1.56, 0.08, 0.08]} position={[0, -0.59, 0.04]} color={TRIM} roughness={0.4} />
        <Block size={[0.08, 1.26, 0.08]} position={[-0.74, 0, 0.04]} color={TRIM} roughness={0.4} />
        <Block size={[0.08, 1.26, 0.08]} position={[0.74, 0, 0.04]} color={TRIM} roughness={0.4} />
        <Block size={[0.04, 1.1, 0.04]} position={[0, 0, 0.03]} color={TRIM} roughness={0.4} />
        <Block size={[1.54, 0.045, 0.2]} position={[0, -0.64, 0.1]} color={TRIM} roughness={0.4} />
        {/* the reveal: the hole is lined back into the wall's thickness, so from an angle you see a deep sill and jambs, not a void */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <Block size={[WINDOW.w + 0.04, 0.02, 0.16]} position={[0, s * (WINDOW.h / 2 + 0.01), -0.08]} color={TRIM} roughness={0.5} radius={0.003} />
            <Block size={[0.02, WINDOW.h, 0.16]} position={[s * (WINDOW.w / 2 + 0.01), 0, -0.08]} color={TRIM} roughness={0.5} radius={0.003} />
          </group>
        ))}
        {/* curtain rail: a pole on two wall brackets, with a ball on each end */}
        <mesh position={[0, RAIL.y - WINDOW.y, RAIL.z]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 2.6, 20]} />
          <meshStandardMaterial color="#2b2622" metalness={0.8} roughness={0.35} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 1.33, RAIL.y - WINDOW.y, RAIL.z]}>
              <sphereGeometry args={[0.035, 24, 16]} />
              <meshStandardMaterial color="#2b2622" metalness={0.8} roughness={0.35} />
            </mesh>
            <mesh position={[s * 1.22, RAIL.y - WINDOW.y, RAIL.z / 2]} rotation={[PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.01, 0.01, RAIL.z, 12]} />
              <meshStandardMaterial color="#2b2622" metalness={0.8} roughness={0.35} />
            </mesh>
            <mesh position={[s * 1.22, RAIL.y - WINDOW.y, 0.005]} rotation={[PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.01, 20]} />
              <meshStandardMaterial color="#2b2622" metalness={0.8} roughness={0.35} />
            </mesh>
          </group>
        ))}
      </group>

      {/* light switch by the door */}
      <group position={[halfX - 0.005, 1.2, -0.7]} rotation={[0, -PI / 2, 0]}>
        <Block size={[0.085, 0.085, 0.012]} position={[0, 0, 0.006]} color="#f8f5ef" roughness={0.3} radius={0.004} />
        <Block size={[0.02, 0.032, 0.012]} position={[0, 0.006, 0.014]} rotation={[0.25, 0, 0]} color="#ece6da" roughness={0.3} />
      </group>

      {/* pendant over the coffee table: the room's one shadow-casting light */}
      <Model id="modern_ceiling_lamp_01" position={[0, height - 0.95, 0.55]} paint={false} castShadow={false} />
      <PendantLight position={[0, height - 1.0, 0.55]} />
    </group>
  )
}

/**
 * Light from the pendant bulb. A downward spotlight casts the shadows (one
 * shadow map, so it's cheap) and a shadowless point light fills the ceiling
 * and upper walls that the spot doesn't reach.
 */
function PendantLight({ position }: { position: Vec3 }) {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      <primitive object={target} position={[position[0], 0, position[2]]} />
      <spotLight
        position={position}
        target={target}
        angle={1.25}
        penumbra={1}
        intensity={9}
        decay={1.5}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-near={0.1}
        shadow-camera-far={6}
      />
      <pointLight position={position} intensity={1.2} distance={8} decay={1.6} color="#ffe2b8" />
    </>
  )
}

function Lights() {
  return (
    <>
      <Environment files="/hdri/lythwood_lounge.hdr" environmentIntensity={0.5} />
      <hemisphereLight args={['#fff4e0', '#5a4636', 0.35]} />
      <PanelLight position={[1.8, 1.5, -ROOM.halfZ + 0.02]} size={[1.4, 1.1]} facing={[1.8, 1.1, 0]} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Built pieces
// ---------------------------------------------------------------------------

const BOOK_COLOURS = ['#7d3b46', '#2e5e7e', '#d9a441', '#3f7a3a', '#e9e4da', '#264653', '#b23a48', '#6a4c93', '#e07a5f', '#2f5d50']

/** A row of books standing on a shelf, starting at local x = start. */
function BookRow({ y, start, count, seed }: { y: number; start: number; count: number; seed: number }) {
  const books = useMemo(() => {
    // x is each book's bottom-left corner, the corner a leaning book pivots on
    const out: { x: number; w: number; h: number; d: number; tilt: number; colour: string }[] = []
    let x = start
    for (let i = 0; i < count; i++) {
      const r = (n: number) => (Math.sin((seed + i) * 12.9898 + n * 78.233) * 43758.5453) % 1
      const w = 0.028 + Math.abs(r(1)) * 0.03
      const h = 0.2 + Math.abs(r(2)) * 0.09
      const d = 0.17 + Math.abs(r(3)) * 0.05
      const tilt = i === count - 1 && count > 1 ? 0.12 : 0
      // a leaning book stands off from its neighbour just far enough for its top to rest against it
      const lean = tilt ? Math.min(h, out[i - 1].h) * Math.sin(tilt) : 0
      out.push({ x: x + lean, w, h, d, tilt, colour: BOOK_COLOURS[(seed + i) % BOOK_COLOURS.length] })
      x += w + 0.003 + lean
    }
    return out
  }, [start, count, seed])
  return (
    <>
      {books.map((b, i) => (
        <group key={i} position={[b.x, y, 0.04 - (0.22 - b.d) / 2]} rotation={[0, 0, b.tilt]}>
          <group position={[b.w / 2, 0, 0]}>
          <Block size={[b.w, b.h, b.d]} position={[0, b.h / 2, 0]} color={b.colour} roughness={0.65} radius={0.004} paint />
          {/* spine out (+z), as books stand on a shelf: gilt bands and a title label */}
          {[0.12, 0.88].map((t) => (
            <Block key={t} size={[b.w * 0.86, 0.006, 0.003]} position={[0, b.h * t, b.d / 2 + 0.001]} color="#d9b35a" metalness={0.8} roughness={0.35} radius={0.001} />
          ))}
          <Block size={[b.w * 0.6, b.h * 0.3, 0.002]} position={[0, b.h * 0.58, b.d / 2 + 0.001]} color="#f2e8cf" roughness={0.8} radius={0.0008} />
          {/* the pages show only along the top edge, between the covers */}
          <Block size={[b.w * 0.8, 0.003, b.d * 0.9]} position={[0, b.h + 0.0005, -b.d * 0.04]} color="#efe6d0" roughness={0.9} radius={0.001} />
          </group>
        </group>
      ))}
    </>
  )
}

const SHELF_TOPS = [0.0525, 0.6325, 1.2125]
/** The top of the bookshelf, where the ornament ends up when it moves (SHELF_TOPS[2] + 0.58). */
const SHELF_TOP_Y = 1.7925

function Bookshelf() {
  const oak = useSurface('oak_veneer_01', 1, 2)
  // the sides stop under an overhanging top board whose upper face is the top of the shelf (1.7925)
  const side = SHELF_TOP_Y - 0.03
  return (
    <>
      <Block size={[0.03, side, 0.35]} position={[-0.485, side / 2, 0]} color="#c8a47e" surface={oak} paint />
      <Block size={[0.03, side, 0.35]} position={[0.485, side / 2, 0]} color="#c8a47e" surface={oak} paint />
      <Block size={[0.94, side, 0.02]} position={[0, side / 2, -0.165]} color="#b8946e" surface={oak} paint />
      <Block size={[1.05, 0.03, 0.37]} position={[0, SHELF_TOP_Y - 0.015, 0.01]} color="#c8a47e" surface={oak} radius={0.008} paint />
      {[0.04, 0.62, 1.2].map((y) => (
        <group key={y}>
          <Block size={[0.94, 0.025, 0.33]} position={[0, y, 0]} color="#c8a47e" surface={oak} paint />
          {/* a darker lipping along each shelf's front edge */}
          <Block size={[0.94, 0.027, 0.012]} position={[0, y, 0.169]} color="#8a5f3c" roughness={0.55} radius={0.004} paint />
        </group>
      ))}
      {/* recessed kick board under the bottom shelf, so it doesn't look hollow at floor level */}
      <Block size={[0.94, 0.028, 0.02]} position={[0, 0.014, 0.14]} color="#8a5f3c" roughness={0.55} radius={0.004} paint />
    </>
  )
}

const LAMP_BASE = new LatheGeometry(
  [
    [0, 0],
    [0.16, 0],
    [0.165, 0.008],
    [0.162, 0.016],
    [0.12, 0.032],
    [0.05, 0.048],
    [0.022, 0.056],
    [0.02, 0.07],
    [0, 0.07],
  ].map(([x, y]) => new Vector2(x, y)),
  48,
)
const LAMP_SHADE = new LatheGeometry(
  [
    [0.24, 0],
    [0.235, 0.02],
    [0.16, 0.3],
    [0.15, 0.32],
  ].map(([x, y]) => new Vector2(x, y)),
  64,
)
/** A thin brass ring: the wire frame showing at the shade's top and bottom edges. */
const SHADE_RIM_BOTTOM = new TorusGeometry(0.241, 0.006, 8, 64).rotateX(PI / 2)
const SHADE_RIM_TOP = new TorusGeometry(0.151, 0.005, 8, 48).rotateX(PI / 2)
/** Where the pole stops and the bulb socket starts. */
const POLE_TOP = 1.33

function LampMetal() {
  return <meshStandardMaterial color="#2b2622" metalness={0.7} roughness={0.35} />
}
function Brass() {
  return <meshStandardMaterial color="#c9a25a" metalness={0.85} roughness={0.3} />
}

/** The shade, its wire rims, the harp that holds it over the bulb, the socket and the bulb, all upright with the shade's bottom at y = 0. */
function LampHead({ glow }: { glow: string }) {
  return (
    <>
      <mesh geometry={LAMP_SHADE} castShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#efe0c0" emissive={glow} emissiveIntensity={0.45} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh geometry={SHADE_RIM_BOTTOM}>
        <Brass />
      </mesh>
      <mesh geometry={SHADE_RIM_TOP} position={[0, 0.32, 0]}>
        <Brass />
      </mesh>
      {/* the harp: two uprights from the socket, three spokes out to the top rim, a finial on top */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.065, 0.19, 0]}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.26, 8]} />
          <Brass />
        </mesh>
      ))}
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.004, 0.004, 0.13, 8]} />
        <Brass />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.31, 0]} rotation={[0, (i / 3) * PI * 2, PI / 2]}>
          <cylinderGeometry args={[0.003, 0.003, 0.3, 6]} />
          <Brass />
        </mesh>
      ))}
      <mesh position={[0, 0.325, 0]}>
        <sphereGeometry args={[0.014, 16, 12]} />
        <Brass />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.02, 0.022, 0.06, 20]} />
        <LampMetal />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <sphereGeometry args={[0.045, 24, 16]} />
        <meshStandardMaterial color="#fff3d6" emissive={glow} emissiveIntensity={3} />
      </mesh>
    </>
  )
}

function FloorLamp() {
  return (
    <>
      <mesh geometry={LAMP_BASE} castShadow receiveShadow>
        <LampMetal />
      </mesh>
      <mesh position={[0, (0.07 + POLE_TOP) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, POLE_TOP - 0.07, 16]} />
        <LampMetal />
      </mesh>
      {/* a little foot switch on the cable side of the base */}
      <mesh position={[0.1, 0.034, 0.06]} rotation={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.016, 0.018, 0.014, 16]} />
        <meshStandardMaterial color="#c9a25a" metalness={0.85} roughness={0.3} />
      </mesh>
      <Variant of="lamp" name="watching">
        {/* the pole carries on up to a knuckle, and the head swivels on it to point at you */}
        <mesh position={[0, (POLE_TOP + 1.45) / 2, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.45 - POLE_TOP, 16]} />
          <LampMetal />
        </mesh>
        <FacesYou position={[0, 1.45, 0]}>
          <mesh>
            <sphereGeometry args={[0.024, 20, 14]} />
            <Brass />
          </mesh>
          <group position={[0, 0, 0.22]} rotation={[-PI / 2, 0, 0]}>
            <LampHead glow="#ffcf8a" />
          </group>
          {/* the neck from the knuckle to the socket */}
          <mesh position={[0, 0, 0.09]} rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.18, 12]} />
            <LampMetal />
          </mesh>
          <pointLight position={[0, 0, 0.3]} intensity={2.2} distance={6} decay={1.6} color="#ffc983" />
        </FacesYou>
      </Variant>
      {(
        [
          ['default', '#ffcf8a', '#ffc983'],
          ['green', '#4dff7a', '#3dff6e'],
        ] as const
      ).map(([name, glow, light]) => (
        <Variant key={name} of="lamp" name={name}>
          <group position={[0, 1.3, 0]}>
            <LampHead glow={glow} />
          </group>
          <pointLight position={[0, 1.35, 0]} intensity={2.2} distance={6} decay={1.6} color={light} />
        </Variant>
      ))}
    </>
  )
}

/** Top of the curtains (just under the rail) and top of the windowsill, in room height. */
const CURTAIN_TOP = 2.29
const SILL_TOP = 0.89

/** Pleated curtain panel: a plane with folds pushed in and out, hanging from CURTAIN_TOP down to `bottom`. */
function CurtainPanel({ width, x, bottom, velvet }: { width: number; x: number; bottom: number; velvet: Surface }) {
  const height = CURTAIN_TOP - bottom
  const geometry = useMemo(() => new PlaneGeometryWithFolds(width, height, Math.round(width * 14)), [width, height])
  // one ring on the pole at the top of each fold
  const rings = useMemo(() => {
    const n = Math.round(width * 14) + 1
    return Array.from({ length: n }, (_, i): Placement => ({ at: [x - width / 2 + 0.015 + (i / (n - 1)) * (width - 0.03), RAIL.y, 0] }))
  }, [width, x])
  return (
    <>
      <mesh geometry={geometry} position={[x, bottom + height / 2, 0]} castShadow receiveShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#8c2f45" roughness={0.9} side={DoubleSide} {...velvet} />
      </mesh>
      <Instanced geometry={CURTAIN_RING} material={RING_METAL} items={rings} />
    </>
  )
}

/** A curtain ring round the pole, on its side so the pole runs through it. */
const CURTAIN_RING = new TorusGeometry(0.026, 0.005, 8, 20).rotateY(PI / 2)
const RING_METAL = new MeshStandardMaterial({ color: '#2b2622', metalness: 0.8, roughness: 0.35 })

class PlaneGeometryWithFolds extends PlaneGeometry {
  constructor(width: number, height: number, folds: number) {
    super(width, height, folds * 8, 12)
    const pos = this.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // deeper folds lower down, where the fabric hangs free
      const depth = 0.028 + 0.016 * (1 - (y + height / 2) / height)
      pos.setZ(i, Math.sin((x / width) * folds * Math.PI * 2) * depth)
    }
    this.computeVertexNormals()
  }
}

function Curtains() {
  const velvet = useSurface('velour_velvet', 1, 3)
  return (
    <>
      {/* open: floor length, either side of the window, clear of the sill */}
      <Variant of="curtains" name="default">
        <CurtainPanel width={0.42} x={-0.99} bottom={0.02} velvet={velvet} />
        <CurtainPanel width={0.42} x={0.99} bottom={0.02} velvet={velvet} />
      </Variant>
      {/* drawn: they meet in the middle and stop just above the sill */}
      <Variant of="curtains" name="closed">
        <CurtainPanel width={0.82} x={-0.39} bottom={SILL_TOP + 0.02} velvet={velvet} />
        <CurtainPanel width={0.82} x={0.39} bottom={SILL_TOP + 0.02} velvet={velvet} />
      </Variant>
    </>
  )
}

function Door() {
  const handle = useMemo(
    () =>
      new LatheGeometry(
        [
          [0, 0],
          [0.032, 0],
          [0.032, 0.01],
          [0.012, 0.02],
          [0.012, 0.05],
          [0.03, 0.065],
          [0.026, 0.08],
          [0, 0.082],
        ].map(([x, y]) => new Vector2(x, y)),
        32,
      ),
    [],
  )
  const corridor = useMemo(() => dimCorridorTexture(), [])
  return (
    <>
      <Block size={[0.07, 2.12, 0.06]} position={[-0.485, 1.06, 0.03]} color={TRIM} roughness={0.45} />
      <Block size={[0.07, 2.12, 0.06]} position={[0.485, 1.06, 0.03]} color={TRIM} roughness={0.45} />
      <Block size={[1.04, 0.07, 0.06]} position={[0, 2.12, 0.03]} color={TRIM} roughness={0.45} />
      {(['default', 'open'] as const).map((name) => (
        <Variant key={name} of="door" name={name}>
          {/* hinge on the left edge */}
          <group position={[-0.45, 0, 0]} rotation={[0, name === 'open' ? -0.22 : 0, 0]}>
            <group position={[0.45, 0, 0]}>
              <Block size={[0.9, 2.04, 0.045]} position={[0, 1.02, 0.0225]} color="#e9e1d3" roughness={0.45} paint />
              {[1.5, 0.55].map((y) => (
                <group key={y} position={[0, y, 0]}>
                  <Block size={[0.6, 0.76, 0.012]} position={[0, 0, 0.05]} color="#e4dccd" roughness={0.45} radius={0.005} paint />
                  {/* a moulded bead framing the panel */}
                  {[-1, 1].map((s) => (
                    <group key={s}>
                      <Block size={[0.66, 0.02, 0.016]} position={[0, s * 0.39, 0.052]} color="#e9e1d3" roughness={0.4} radius={0.006} paint />
                      <Block size={[0.02, 0.8, 0.016]} position={[s * 0.32, 0, 0.052]} color="#e9e1d3" roughness={0.4} radius={0.006} paint />
                    </group>
                  ))}
                </group>
              ))}
              <mesh geometry={handle} position={[0.36, 1.0, 0.045]} rotation={[PI / 2, 0, 0]} castShadow>
                <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
              </mesh>
              {/* back plate for the knob and a keyhole below it */}
              <mesh position={[0.36, 1.0, 0.046]} rotation={[PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.036, 0.036, 0.003, 24]} />
                <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
              </mesh>
              <Block size={[0.03, 0.07, 0.004]} position={[0.36, 0.9, 0.047]} color="#b08d57" metalness={0.9} roughness={0.25} radius={0.0015} />
              <Block size={[0.007, 0.022, 0.002]} position={[0.36, 0.895, 0.0495]} color="#2b2622" roughness={0.6} radius={0.0008} />
              {/* hinge knuckles on the hinge edge */}
              {[0.25, 1.02, 1.8].map((y) => (
                <mesh key={y} position={[-0.452, y, 0.045]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.09, 12]} />
                  <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
                </mesh>
              ))}
            </group>
          </group>
          {name === 'open' && (
            // a dim corridor beyond, where this house has no corridor
            <mesh position={[0, 1.02, 0.004]}>
              <planeGeometry args={[0.9, 2.04]} />
              <meshBasicMaterial map={corridor} />
            </mesh>
          )}
        </Variant>
      ))}
    </>
  )
}

/** Leaves the cabinet's left door ajar (the doors are separate nodes, hinged at the outer edges). */
function openCabinetDoor(root: Object3D) {
  root.getObjectByName('modern_wooden_cabinet_door_l')?.rotateOnWorldAxis(new Vector3(0, 1, 0), -0.55)
}

/** Whatever has been living in the TV cabinet. */
function CabinetEggs() {
  return (
    <>
      {(
        [
          [-0.85, 0.25, 0.02, 0.09],
          [-0.62, 0.23, -0.05, 0.075],
          [-0.4, 0.22, 0.03, 0.07],
        ] as const
      ).map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 1.35, 1]}>
          <sphereGeometry args={[r, 32, 24]} />
          <meshStandardMaterial color="#ff7ad9" emissive="#ff3fa4" emissiveIntensity={1.4} roughness={0.3} />
        </mesh>
      ))}
      <pointLight position={[-0.6, 0.35, 0.25]} intensity={1.2} distance={2} decay={2} color="#ff5fc0" />
    </>
  )
}

const lathe = (points: [number, number][], segments: number) =>
  new LatheGeometry(
    points.map(([x, y]) => new Vector2(x, y)),
    segments,
  )

const GLASS = lathe(
  [
    [0, 0],
    [0.034, 0],
    [0.035, 0.002],
    [0.034, 0.004],
    [0.005, 0.01],
    [0.004, 0.09],
    [0.03, 0.115],
    [0.04, 0.16],
    [0.036, 0.21],
  ],
  40,
)
/** The wine follows the inside of the bowl, so it doesn't hang in it as a flat-bottomed puck. */
const WINE = lathe(
  [
    [0, 0.093],
    [0.012, 0.1],
    [0.026, 0.113],
    [0.0335, 0.14],
    [0, 0.14],
  ],
  32,
)

function WineGlass() {
  return (
    <>
      <mesh geometry={GLASS} castShadow>
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.3} roughness={0.05} clearcoat={1} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh geometry={WINE} userData={{ paint: true }}>
        <meshStandardMaterial color="#7a0f2a" roughness={0.1} />
      </mesh>
    </>
  )
}

/** The mug's body: a rounded foot, straight sides, a rolled lip and the inside wall down to the bottom. */
const MUG_BODY = lathe(
  [
    [0, 0],
    [0.034, 0],
    [0.038, 0.002],
    [0.04, 0.006],
    [0.041, 0.095],
    [0.0402, 0.0985],
    [0.0375, 0.0985],
    [0.036, 0.095],
    [0.035, 0.012],
    [0, 0.012],
  ],
  40,
)
/** A loop handle whose two ends sink into the side of the mug. */
const MUG_HANDLE = new TorusGeometry(0.025, 0.0075, 12, 32, PI * 1.25).rotateZ(-PI * 0.625).scale(1, 1.2, 1)

function Mug({ empty = false }: { empty?: boolean }) {
  return (
    <>
      <mesh geometry={MUG_BODY} castShadow receiveShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#f0ebe1" roughness={0.2} side={DoubleSide} />
      </mesh>
      <mesh geometry={MUG_HANDLE} position={[0.046, 0.052, 0]} castShadow userData={{ paint: true }}>
        <meshStandardMaterial color="#f0ebe1" roughness={0.2} />
      </mesh>
      {!empty && (
        <mesh position={[0, 0.08, 0]} rotation={[-PI / 2, 0, 0]}>
          <circleGeometry args={[0.0358, 40]} />
          <meshStandardMaterial color="#3b2416" roughness={0.1} />
        </mesh>
      )}
    </>
  )
}

/**
 * A hardback lying flat: two boards and a spine wrapped round a block of
 * pages that's set back from the edges, so you can see it's a book.
 */
function TableBook({ w, h, d, colour, position, rotation }: { w: number; h: number; d: number; colour: string; position: Vec3; rotation?: Vec3 }) {
  const board = 0.004
  return (
    <group position={position} rotation={rotation}>
      <Block size={[w, board, d]} position={[0, board / 2, 0]} color={colour} roughness={0.6} radius={0.0015} paint />
      <Block size={[w, board, d]} position={[0, h - board / 2, 0]} color={colour} roughness={0.6} radius={0.0015} paint />
      <Block size={[0.007, h, d]} position={[-w / 2 + 0.0035, h / 2, 0]} color={colour} roughness={0.6} radius={0.003} paint />
      <Block size={[w - 0.012, h - board * 2 + 0.001, d - 0.008]} position={[0.0015, h / 2, 0]} color="#f1ead8" roughness={0.9} radius={0.001} />
      {/* gilt title bands on the spine */}
      {[-0.3, 0.3].map((t) => (
        <Block key={t} size={[0.002, h * 0.5, 0.006]} position={[-w / 2 - 0.0002, h / 2, d * t]} color="#d9b35a" metalness={0.8} roughness={0.35} radius={0.0008} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

function Furniture() {
  const { halfX, halfZ } = ROOM
  const rug = useSurface('fabric_pattern_07', 2, 1.3)
  const jacquard = useSurface('quatrefoil_jacquard_fabric', 1.6, 1.05)
  const shelf: Vec3 = [-halfX + 0.18, 0, -0.6]

  return (
    <>
      <Item id="rug" position={[0, 0, 0.55]}>
        <Variant of="rug" name="default">
          <Block size={[2.6, 0.01, 1.7]} position={[0, 0.005, 0]} color="#ffffff" roughness={1} radius={0.004} surface={rug} paint />
        </Variant>
        <Variant of="rug" name="pattern">
          <Block size={[2.6, 0.01, 1.7]} position={[0, 0.005, 0]} color="#ffffff" roughness={1} radius={0.004} surface={jacquard} paint />
        </Variant>
        {/* the usual rug, with a tiger's tail poking out from under one end */}
        <Variant of="rug" name="tiger">
          <Block size={[2.6, 0.01, 1.7]} position={[0, 0.005, 0]} color="#ffffff" roughness={1} radius={0.004} surface={rug} paint />
          {/* the top of the rug humps up over whatever is under it, and the tail comes out from under the lifted edge */}
          <TigerRug surface={rug} />
        </Variant>
      </Item>

      <Item id="coffee-table" position={[0, 0, 0.55]}>
        <Variant of="coffee-table" name="default">
          <Model id="modern_coffee_table_01" rotation={[0, PI / 2, 0]} />
        </Variant>
        <Variant of="coffee-table" name="square">
          {/* stretched 2cm taller so it's exactly the same height as the original */}
          <Model id="modern_coffee_table_02" scale={[1, 0.39 / 0.369, 1]} />
        </Variant>
      </Item>

      <Item id="mug" position={[0.35, 0.39, 0.65]}>
        <Variant of="mug" name="default">
          <Mug />
        </Variant>
        <Variant of="mug" name="glass">
          <WineGlass />
        </Variant>
        <Variant of="mug" name="spilled">
          <group position={[0.04, 0.041, 0]} rotation={[0, 0, PI / 2]}>
            <Mug empty />
          </group>
          <CoffeePuddle />
        </Variant>
      </Item>

      <Item id="table-book" position={[-0.3, 0.39, 0.5]} rotation={[0, 0.35, 0]}>
        <Variant of="table-book" name="default">
          <TableBook w={0.24} h={0.035} d={0.17} colour="#2f5d50" position={[0, 0, 0]} />
        </Variant>
        <Variant of="table-book" name="stack">
          <TableBook w={0.24} h={0.035} d={0.17} colour="#2f5d50" position={[0, 0, 0]} />
          <TableBook w={0.22} h={0.03} d={0.16} colour="#b23a48" position={[0.01, 0.035, 0]} rotation={[0, 0.3, 0]} />
          <TableBook w={0.2} h={0.04} d={0.15} colour="#d9a441" position={[-0.01, 0.065, 0]} rotation={[0, -0.2, 0]} />
          <TableBook w={0.18} h={0.028} d={0.13} colour="#264653" position={[0, 0.105, 0]} rotation={[0, 0.5, 0]} />
        </Variant>
        <Variant of="table-book" name="open">
          <OpenBook colour="#2f5d50" />
        </Variant>
      </Item>

      <Item id="orb" position={[0, 1.15, 0.55]}>
        <Variant of="orb" name="default">
          <FloatingOrb />
        </Variant>
        <Variant of="orb" name="cube">
          <FloatingOrb shape="cube" />
        </Variant>
        <Variant of="orb" name="split">
          <FloatingOrb shape="split" />
        </Variant>
      </Item>

      <Item id="fish" position={[0, 2.1, 0.55]}>
        <Variant of="fish" name="default">
          <AirFish count={4} />
        </Variant>
        <Variant of="fish" name="school">
          <AirFish count={11} radius={1.05} />
        </Variant>
        <Variant of="fish" name="shark">
          <AirFish count={4} />
          <Shark />
        </Variant>
      </Item>

      <Item id="sofa" position={[0, 0, 2.22]} rotation={[0, PI, 0]}>
        <Variant of="sofa" name="default">
          <Model id="sofa_02" />
          <Model id="throw_pillows_01" position={[0, 0.36, -0.12]} scale={0.95} paint={false} />
        </Variant>
        <Variant of="sofa" name="bare">
          <Model id="sofa_02" />
        </Variant>
        <Variant of="sofa" name="other">
          <Model id="Sofa_01" />
          <Model id="throw_pillows_01" position={[0, 0.4, -0.08]} scale={0.85} paint={false} />
        </Variant>
      </Item>

      <Item id="clock" position={[0, 1.85, halfZ]} rotation={[0, PI, 0]}>
        <Variant of="clock" name="default">
          <Model id="wall_clock" anchor="wall" />
        </Variant>
        <Variant of="clock" name="telephone">
          <Model id="vintage_telephone_wall_clock" anchor="wall" />
        </Variant>
        <Variant of="clock" name="melted">
          <MeltedClock />
        </Variant>
      </Item>

      <Item id="armchair" position={[2.55, 0, 0.35]} rotation={[0, -PI / 2, 0]}>
        <Variant of="armchair" name="default">
          <Model id="ArmChair_01" />
        </Variant>
        <Variant of="armchair" name="modern">
          <Model id="modern_arm_chair_01" />
        </Variant>
        <Variant of="armchair" name="float">
          <Hover height={0.45}>
            <Model id="ArmChair_01" />
          </Hover>
        </Variant>
      </Item>

      <Item id="side-table" position={[2.8, 0, 1.45]}>
        <Model id="side_table_01" />
      </Item>

      <Item id="vase" position={[2.8, 0.55, 1.45]}>
        <Variant of="vase" name="default">
          <Model id="ceramic_vase_01" />
        </Variant>
        <Variant of="vase" name="brass">
          <Model id="brass_vase_02" />
        </Variant>
        <Variant of="vase" name="antique">
          <Model id="antique_ceramic_vase_01" />
        </Variant>
      </Item>

      <Item id="lamp" position={[2.95, 0, 2.36]}>
        <FloorLamp />
      </Item>

      <Item id="cloud" position={[2.95, 2.3, -2.45]}>
        <Variant of="cloud" name="default">
          <RainCloud />
        </Variant>
        <Variant of="cloud" name="storm">
          <RainCloud stormy />
        </Variant>
      </Item>

      <Item id="plant" position={[3.0, 0, -2.45]}>
        <Variant of="plant" name="default">
          <Model id="potted_plant_01" />
        </Variant>
        <Variant of="plant" name="bush">
          <Model id="potted_plant_02" />
        </Variant>
        <Variant of="plant" name="succulent">
          <Model id="potted_plant_04" scale={3.4} />
        </Variant>
        <Variant of="plant" name="bloom">
          <Model id="potted_plant_01" />
          <GlowingFlowers />
        </Variant>
      </Item>

      <Item id="tv-cabinet" position={[-1.1, 0, -2.67]}>
        <Variant of="tv-cabinet" name="default">
          <Model id="modern_wooden_cabinet" />
        </Variant>
        <Variant of="tv-cabinet" name="open">
          <Model id="modern_wooden_cabinet" adjust={openCabinetDoor} />
          <CabinetEggs />
        </Variant>
      </Item>

      <Item id="tv" position={[-1.7, 0.68, -2.67]}>
        <Model id="Television_01" />
        <Variant of="tv" name="default">
          {null}
        </Variant>
        <Variant of="tv" name="on">
          <TvScreen position={[-0.062, 0.25, 0.238]} size={[0.385, 0.32]} />
        </Variant>
      </Item>

      <Item id="photo" position={[-0.85, 0.68, -2.6]} rotation={[0, 0.25, 0]}>
        {/* these two models face +x, so turn them to face the room */}
        <Variant of="photo" name="default">
          <Model id="standing_picture_frame_01" rotation={[0, -PI / 2, 0]} />
        </Variant>
        <Variant of="photo" name="other">
          <Model id="standing_picture_frame_02" rotation={[0, -PI / 2, 0]} />
        </Variant>
      </Item>

      <Item id="lava-lamp" position={[-0.2, 0.68, -2.65]}>
        <Variant of="lava-lamp" name="default">
          <LavaLamp />
        </Variant>
        <Variant of="lava-lamp" name="globe">
          <LavaLamp shape="globe" />
        </Variant>
        <Variant of="lava-lamp" name="rocket">
          <LavaLamp shape="rocket" />
        </Variant>
      </Item>

      <Item id="living-picture" position={[-1.1, 1.75, -halfZ]}>
        <LivingPicture name="living-picture" />
      </Item>

      <Item id="bookshelf" position={shelf} rotation={[0, PI / 2, 0]}>
        <Bookshelf />
      </Item>

      <Item id="books" position={shelf} rotation={[0, PI / 2, 0]}>
        <Variant of="books" name="default">
          <BookRow y={SHELF_TOPS[1]} start={-0.44} count={7} seed={1} />
          <BookRow y={SHELF_TOPS[2]} start={-0.44} count={4} seed={9} />
        </Variant>
        <Variant of="books" name="fewer">
          <BookRow y={SHELF_TOPS[1]} start={-0.44} count={2} seed={1} />
        </Variant>
        <Variant of="books" name="more">
          <BookRow y={SHELF_TOPS[0]} start={-0.45} count={15} seed={4} />
          <BookRow y={SHELF_TOPS[1]} start={-0.45} count={15} seed={1} />
          <BookRow y={SHELF_TOPS[2]} start={-0.44} count={4} seed={9} />
        </Variant>
      </Item>

      <Item id="ornament" position={[shelf[0], SHELF_TOPS[2], shelf[2] - 0.3]} rotation={[0, PI / 2, 0]}>
        <Variant of="ornament" name="default">
          <Model id="horse_statue_01" />
        </Variant>
        <Variant of="ornament" name="cat">
          <Model id="concrete_cat_statue" />
        </Variant>
        <Variant of="ornament" name="bust">
          <Model id="marble_bust_01" scale={0.85} />
        </Variant>
        <Variant of="ornament" name="duck">
          <Model id="rubber_duck_toy" scale={0.8} />
        </Variant>
      </Item>

      <Item id="painting" position={[halfX, 1.55, 1.0]} rotation={[0, -PI / 2, 0]}>
        <Variant of="painting" name="default">
          <Model id="hanging_picture_frame_02" anchor="wall" scale={1.6} />
        </Variant>
        <Variant of="painting" name="fancy">
          <Model id="fancy_picture_frame_01" anchor="wall" scale={1.2} />
        </Variant>
      </Item>

      <Item id="door" position={[halfX, 0, DOOR_Z]} rotation={[0, -PI / 2, 0]}>
        <Door />
      </Item>

      <Item id="curtains" position={[WINDOW.x, 0, -halfZ + RAIL.z]}>
        <Curtains />
      </Item>

      <Item id="jelly-tube" position={[0, 0, 0]}>
        <Variant of="jelly-tube" name="default">
          <JellyTube route={TUBE_ROUTES.wall} />
        </Variant>
        <Variant of="jelly-tube" name="reverse">
          <JellyTube route={TUBE_ROUTES.wall} speed={-3.2} />
        </Variant>
        <Variant of="jelly-tube" name="loop">
          <JellyTube route={TUBE_ROUTES.loop} />
        </Variant>
        <Variant of="jelly-tube" name="floor">
          <JellyTube route={TUBE_ROUTES.floor} />
        </Variant>
      </Item>

      <Item id="window" position={[WINDOW.x, WINDOW.y, -halfZ]}>
        <Variant of="window" name="default">
          <AlienSky size={[WINDOW.w, WINDOW.h]} y={WINDOW.y} />
        </Variant>
        <Variant of="window" name="outside">
          <OutsideWorld />
        </Variant>
      </Item>

      <Item id="wall-eye" position={[-halfX, 1.6, 1.25]} rotation={[0, PI / 2, 0]}>
        <Variant of="wall-eye" name="default">
          <WallEye />
        </Variant>
        <Variant of="wall-eye" name="closed">
          <WallEye asleep />
        </Variant>
        <Variant of="wall-eye" name="pair">
          <WallEye x={-0.32} />
          <WallEye x={0.32} />
        </Variant>
      </Item>

      {/* Escher-style stairs along the front wall: floor, wall and ceiling flights */}
      <Item id="stairs" position={[0, 0, 0]}>
        {(['default', 'reverse', 'more', 'walker', 'sloped'] as const).map((v) => (
          <Variant key={v} of="stairs" name={v}>
            <ImpossibleStairs variant={v} />
          </Variant>
        ))}
      </Item>
    </>
  )
}

/** Memoised with no props so re-renders never reset what mutations changed. */
/** Red herrings: ordinary things that never change, to make the hunt harder. */
function Clutter() {
  const { halfX, halfZ } = ROOM
  return (
    <>
      {/* loud 70s wallpaper on the left wall, behind the bookshelf and the eye */}
      <Wallpaper kind="retro" width={halfZ * 2} height={2.5} position={[-halfX, 1.37, 0]} rotation={[0, PI / 2, 0]} />
      {/* footstool in front of the armchair */}
      <Decoy label="footstool" position={[1.6, 0, 0.35]} rotation={[0, PI / 2 + 0.15, 0]} solid>
        <Model id="Ottoman_01" scale={0.7} />
      </Decoy>
      {/* a second houseplant, so "the plant" isn't the only one */}
      <Decoy label="houseplant" position={[-halfX + 0.4, 0, halfZ - 0.45]} solid>
        <Model id="potted_plant_02" />
      </Decoy>
      <Decoy label="mirror" position={[halfX, 1.6, -0.2]} rotation={[0, -PI / 2, 0]}>
        <Model id="ornate_mirror_01" anchor="wall" />
      </Decoy>
      <Decoy label="boombox" position={[-halfX + 0.2, 0, 0.55]} rotation={[0, PI / 2 - 0.25, 0]}>
        <Model id="boombox" />
      </Decoy>
      <Decoy label="picture frame" position={[-halfX, 1.65, -2.05]} rotation={[0, PI / 2, 0]}>
        <Model id="fancy_picture_frame_01" anchor="wall" scale={0.8} />
      </Decoy>
    </>
  )
}

export const LivingRoom = memo(function LivingRoom() {
  return (
    <>
      <Lights />
      <Structure />
      <Furniture />
      <Clutter />
    </>
  )
})
