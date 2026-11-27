import { Environment, Lightformer } from '@react-three/drei'
import { memo, useMemo } from 'react'
import { Object3D, Path, PlaneGeometry, Shape, ShapeGeometry } from 'three'
import { Block, Decoy, Item, PanelLight, PI, Variant } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { wallGeometry, type Opening } from '../../outsideLayers'
import {
  CutleryTub,
  Dishwasher,
  DryStore,
  GlassRack,
  KitchenBin,
  MopBucket,
  PlateRack,
  PlateStack,
  PotShelves,
  PotSink,
  PotStock,
  ReachInFridge,
  WalkInDoor,
  Whiteboard,
} from './back'
import { KITCHEN_BOUNDS as B } from './bounds'
import {
  BENCH,
  COLD,
  FRYER,
  GRIDDLE,
  LINE,
  LINE_LEFT,
  LINE_RIGHT,
  PASS,
  PASS_DEPTH,
  PORTHOLE,
  POT_SHELF,
  PREP,
  RANGE,
  STAINLESS,
  SWING_DOOR_X,
} from './layout'
import {
  ColdCounter,
  Flame,
  Fryer,
  FryerBaskets,
  Griddle,
  GriddleFood,
  HoodFilters,
  HoodLights,
  HoodShell,
  LineSpine,
  OvenDoor,
  Range,
  RoaringFlame,
  Salamander,
  StovePans,
  Stockpot,
} from './line'
import { DiningRoom } from './dining'
import { CoatHooks, HandSink, HeatLamps, PassCounter, PassPlates, SwingDoor, TicketRail } from './pass'
import {
  BoardRack,
  FireBlanket,
  Fish,
  FishBoard,
  KnifeRack,
  Lemons,
  MixerAndFlour,
  PlateWarmer,
  SpiceShelf,
  SteelTable,
  TrayTrolley,
  UtensilRack,
  VegPrep,
} from './prep'
import { busyTiles, quarryTiles, subwayTiles, TILE_SPAN } from './textures'
import { WalkInRoom } from './walkin'

/*
 * A restaurant kitchen mid-service, laid out the way real ones are (see
 * layout.ts): the pass and the swing door in the front wall onto the dining
 * room, the island cooking line facing the pass, prep tables behind it,
 * storage on the back wall, and the dish run down the right-hand wall next
 * to the door so the waiters can drop dirty plates on the way in.
 *
 * Every piece of furniture blocks the player and can be clicked, changeable
 * or not, so neither walking through it nor clicking it gives away that it
 * can't be the answer.
 */

const LINE_Z = (LINE.front + LINE.back) / 2
const SPINE_Z = (LINE.spine + LINE.back) / 2
const LINE_X = (LINE_LEFT + LINE_RIGHT) / 2
const HOOD_W = LINE_RIGHT - LINE_LEFT + 0.3
const HOOD_D = 1.35
const HOOD_Z = LINE.spine - 0.1 + HOOD_D / 2

/** Where the walk-in's door is along the back wall. */
const WALKIN_X = -2.4

const FRONT: Vec3 = [0, PI, 0]
const LEFT: Vec3 = [0, PI / 2, 0]
const RIGHT: Vec3 = [0, -PI / 2, 0]

// ---------------------------------------------------------------------------
// Walls, floor, ceiling
// ---------------------------------------------------------------------------

/** The front wall, with the pass cut out of it. Shape space is the wall seen from the kitchen. */
function PassWall() {
  const { halfX, height } = B
  const geometry = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-halfX, 0)
    shape.lineTo(halfX, 0)
    shape.lineTo(halfX, height)
    shape.lineTo(-halfX, height)
    shape.closePath()
    // turned to face the kitchen, the wall's x runs the other way
    const x0 = -PASS.x - PASS.width / 2
    const hole = new Path()
    hole.moveTo(x0, PASS.sill)
    hole.lineTo(x0, PASS.top)
    hole.lineTo(x0 + PASS.width, PASS.top)
    hole.lineTo(x0 + PASS.width, PASS.sill)
    hole.closePath()
    shape.holes.push(hole)
    // and through behind the swing door's porthole (a little bigger, so the door's own hole frames the view)
    const port = new Path()
    port.absarc(-SWING_DOOR_X, PORTHOLE.y, PORTHOLE.r + 0.05, 0, PI * 2, true)
    shape.holes.push(port)
    return new ShapeGeometry(shape, 40)
  }, [halfX, height])
  // shape UVs are in metres
  const map = useMemo(() => subwayTiles(1 / TILE_SPAN, 1 / TILE_SPAN), [])
  return (
    <mesh geometry={geometry} position={[0, 0, B.halfZ]} rotation={FRONT} receiveShadow>
      <meshStandardMaterial map={map} roughness={0.25} />
    </mesh>
  )
}

function TiledWall({ width, at, rot, busy = false, openings }: { width: number; at: Vec3; rot: Vec3; busy?: boolean; openings?: Opening[] }) {
  const map = useMemo(
    () => (busy ? busyTiles(width / TILE_SPAN, B.height / TILE_SPAN) : subwayTiles(width / TILE_SPAN, B.height / TILE_SPAN)),
    [busy, width],
  )
  const geometry = useMemo(() => (openings ? wallGeometry(width, B.height, openings) : new PlaneGeometry(width, B.height)), [openings, width])
  return (
    <mesh position={at} rotation={rot} geometry={geometry} receiveShadow>
      <meshStandardMaterial map={map} roughness={busy ? 0.35 : 0.25} />
    </mesh>
  )
}

/** The walk-in's doorway through the back wall, in the wall's own space. */
const WALKIN_DOORWAY: Opening[] = [{ x0: WALKIN_X - 0.475, x1: WALKIN_X + 0.475, y0: -B.height / 2, y1: -B.height / 2 + 2.0 }]

function Shell() {
  const { halfX, halfZ, height } = B
  const w = halfX * 2
  const d = halfZ * 2
  const floor = useMemo(() => quarryTiles(w / TILE_SPAN, d / TILE_SPAN), [w, d])
  const reveal = 0.15
  return (
    <group>
      <mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floor} roughness={0.6} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#eceeec" roughness={0.9} emissive="#eceeec" emissiveIntensity={0.12} />
      </mesh>
      <PassWall />
      <TiledWall width={w} at={[0, height / 2, -halfZ]} rot={[0, 0, 0]} openings={WALKIN_DOORWAY} />
      {/* the feature wall: loud patterned tiles behind the knife rack and the bench */}
      <TiledWall width={d} at={[-halfX, height / 2, 0]} rot={LEFT} busy />
      <TiledWall width={d} at={[halfX, height / 2, 0]} rot={RIGHT} />
      {/* coved skirting all round, as hygiene rules want */}
      {[
        { size: [w, 0.1, 0.03] as Vec3, at: [0, 0.05, -halfZ + 0.015] as Vec3 },
        { size: [w, 0.1, 0.03] as Vec3, at: [0, 0.05, halfZ - 0.015] as Vec3 },
        { size: [0.03, 0.1, d] as Vec3, at: [-halfX + 0.015, 0.05, 0] as Vec3 },
        { size: [0.03, 0.1, d] as Vec3, at: [halfX - 0.015, 0.05, 0] as Vec3 },
      ].map(({ size, at }, i) => (
        <Block key={i} size={size} position={at} color="#5a2e22" roughness={0.5} radius={0.004} />
      ))}

      {/* the hatch through the wall; the dining room beyond it */}
      <group position={[PASS.x, 0, halfZ]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (PASS.width / 2), (PASS.sill + PASS.top) / 2, reveal / 2]} rotation={[0, -s * (PI / 2), 0]}>
            <planeGeometry args={[reveal, PASS.top - PASS.sill]} />
            <meshStandardMaterial {...STAINLESS} />
          </mesh>
        ))}
        <mesh position={[0, PASS.top, reveal / 2]} rotation={[PI / 2, 0, 0]}>
          <planeGeometry args={[PASS.width, reveal]} />
          <meshStandardMaterial {...STAINLESS} />
        </mesh>
      </group>
      <group position={[0, 0, halfZ]}>
        <DiningRoom />
      </group>

      {/* ceiling fittings for the fluorescent panels */}
      {[...LIGHT_PANELS, SPOT].map(([x, z]) => (
        <Block key={`${x}${z}`} size={[1.2, 0.03, 0.6]} position={[x, height - 0.015, z]} color="#ffffff" emissive="#f4fbff" emissiveIntensity={1.6} radius={0.006} />
      ))}
    </group>
  )
}

/** Recessed fluorescent panels: over the prep tables, the pot shelves, and the dish run by the door. */
const LIGHT_PANELS: [number, number][] = [
  [-1.4, -2.0],
  [2.3, -1.7],
  [2.4, 1.6],
]
/** The middle panel, which is the shadow-casting spotlight instead. */
const SPOT: [number, number] = [-0.6, -0.4]

function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      {/* reflections of a cool white kitchen, not the warm lounge HDRI: stainless should look like steel */}
      <Environment resolution={128} environmentIntensity={0.55}>
        <color attach="background" args={['#7d858c']} />
        {[...LIGHT_PANELS, SPOT].map(([x, z]) => (
          <Lightformer key={`${x}${z}`} form="rect" intensity={3} color="#f2f8ff" position={[x, B.height, z]} rotation-x={PI / 2} scale={[1.2, 0.6, 1]} />
        ))}
        <Lightformer form="rect" intensity={0.8} color="#ffffff" position={[0, 1.5, -B.halfZ]} scale={[B.halfX * 2, 1.5, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffffff" position={[B.halfX, 1.5, 0]} rotation-y={-PI / 2} scale={[B.halfZ * 2, 1.5, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#ff9a5a" position={[PASS.x, 1.6, B.halfZ]} rotation-y={PI} scale={[PASS.width, 0.5, 1]} />
      </Environment>
      <hemisphereLight args={['#f6fbff', '#a39a94', 0.6]} />
      <primitive object={target} position={[SPOT[0], 0, SPOT[1] - 0.2]} />
      {/* the panel in the middle of the ceiling does the shadows */}
      <spotLight
        position={[SPOT[0], B.height - 0.05, SPOT[1]]}
        target={target}
        angle={1.25}
        penumbra={1}
        intensity={5}
        decay={1.3}
        color="#f4fbff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
      />
      {LIGHT_PANELS.map(([x, z]) => (
        <PanelLight key={`${x}${z}`} position={[x, B.height - 0.04, z]} size={[1.2, 0.6]} facing={[x, 0, z]} color="#f2f8ff" intensity={3.2} />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// The cooking line
// ---------------------------------------------------------------------------

function CookingLine() {
  return (
    <>
      <Decoy label="back of the cooking line" position={[LINE_X, 0, SPINE_Z]} solid>
        <LineSpine length={LINE_RIGHT - LINE_LEFT} />
      </Decoy>

      <Item id="fryer" position={[FRYER.x, 0, LINE_Z]}>
        <Fryer width={FRYER.width} />
        {(['normal', 'basket', 'duck'] as const).map((m) => (
          <Variant key={m} of="fryer" name={m === 'normal' ? 'default' : m}>
            <FryerBaskets mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="griddle" position={[GRIDDLE.x, 0, LINE_Z]}>
        <Griddle width={GRIDDLE.width} />
        {(['normal', 'face', 'square'] as const).map((m) => (
          <Variant key={m} of="griddle" name={m === 'normal' ? 'default' : m}>
            <GriddleFood mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="range" position={[RANGE.x, 0, LINE_Z]}>
        <Range width={RANGE.width} />
        <Variant of="range" name="default">
          <Flame />
          <OvenDoor width={RANGE.width} open={false} />
        </Variant>
        <Variant of="range" name="roar">
          <Flame />
          <RoaringFlame />
          <OvenDoor width={RANGE.width} open={false} />
        </Variant>
        <Variant of="range" name="oven">
          <Flame />
          <OvenDoor width={RANGE.width} open />
        </Variant>
      </Item>

      <Decoy label="pans on the stove" position={[RANGE.x, 0, LINE_Z]}>
        <StovePans />
      </Decoy>
      {/* on the back-left burner */}
      <Item id="stockpot" position={[RANGE.x - 0.38, LINE.top + 0.037, LINE_Z - 0.2]}>
        {(['stock', 'purple', 'tentacle'] as const).map((c) => (
          <Variant key={c} of="stockpot" name={c === 'stock' ? 'default' : c}>
            <Stockpot contents={c} />
          </Variant>
        ))}
      </Item>

      <Decoy label="fridge counter" position={[COLD.x, 0, LINE_Z]} solid>
        <ColdCounter width={COLD.width} />
      </Decoy>

      {/* oil, salt and pepper on the upstand by the fridge counter */}
      <Decoy label="oil and salt" position={[COLD.x + 0.1, LINE.upstand, SPINE_Z]}>
        <mesh position={[-0.15, 0.13, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.26, 16]} />
          <meshStandardMaterial color="#d8b02a" roughness={0.1} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0.0, 0.06, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.12, 16]} />
          <meshStandardMaterial color="#f4f4ef" roughness={0.5} />
        </mesh>
        <mesh position={[0.12, 0.08, 0]}>
          <cylinderGeometry args={[0.022, 0.028, 0.16, 12]} />
          <meshStandardMaterial color="#3a2618" roughness={0.5} />
        </mesh>
      </Decoy>

      <Item id="salamander" position={[GRIDDLE.x, LINE.upstand, SPINE_Z]}>
        {(['normal', 'glow', 'drip'] as const).map((m) => (
          <Variant key={m} of="salamander" name={m === 'normal' ? 'default' : m}>
            <Salamander mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="hood" position={[LINE_X, 0, HOOD_Z]}>
        <HoodShell width={HOOD_W} depth={HOOD_D} ceiling={B.height} />
        <Variant of="hood" name="default">
          <HoodFilters width={HOOD_W} depth={HOOD_D} />
          <HoodLights width={HOOD_W} depth={HOOD_D} on />
        </Variant>
        <Variant of="hood" name="filter">
          <HoodFilters width={HOOD_W} depth={HOOD_D} missing={2} />
          <HoodLights width={HOOD_W} depth={HOOD_D} on />
        </Variant>
        <Variant of="hood" name="dark">
          <HoodFilters width={HOOD_W} depth={HOOD_D} />
          <HoodLights width={HOOD_W} depth={HOOD_D} on={false} />
        </Variant>
      </Item>
    </>
  )
}

// ---------------------------------------------------------------------------
// The front wall: pass, hand-wash sink, swing door
// ---------------------------------------------------------------------------

function FrontWall() {
  const { halfZ, height } = B
  const passZ = halfZ - PASS_DEPTH / 2
  return (
    <>
      <Item id="pass" position={[PASS.x, 0, passZ]} rotation={FRONT}>
        <PassCounter width={PASS.width + 0.1} />
        {(['normal', 'cloche', 'jelly'] as const).map((m) => (
          <Variant key={m} of="pass" name={m === 'normal' ? 'default' : m}>
            <PassPlates mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="heatlamps" position={[PASS.x, 0, passZ]} rotation={FRONT}>
        {(['normal', 'blue', 'low'] as const).map((m) => (
          <Variant key={m} of="heatlamps" name={m === 'normal' ? 'default' : m}>
            <HeatLamps mode={m} ceiling={height} />
          </Variant>
        ))}
      </Item>

      <Item id="tickets" position={[PASS.x, PASS.top - 0.03, halfZ]} rotation={FRONT}>
        {(['normal', 'help', 'long'] as const).map((m) => (
          <Variant key={m} of="tickets" name={m === 'normal' ? 'default' : m}>
            <TicketRail mode={m} width={PASS.width - 0.2} />
          </Variant>
        ))}
      </Item>

      <Item id="handsink" position={[1.35, 0, halfZ]} rotation={FRONT}>
        {(['normal', 'running', 'sign'] as const).map((m) => (
          <Variant key={m} of="handsink" name={m === 'normal' ? 'default' : m}>
            <HandSink mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="door" position={[SWING_DOOR_X, 0, halfZ]} rotation={FRONT}>
        <Variant of="door" name="default">
          <SwingDoor face={false} />
        </Variant>
        <Variant of="door" name="face">
          <SwingDoor face />
        </Variant>
      </Item>

      <Decoy label="clock" position={[SWING_DOOR_X, 2.5, halfZ]} rotation={FRONT}>
        <Model id="wall_clock" anchor="wall" />
      </Decoy>

      <Item id="hat" position={[3.55, 0, halfZ]} rotation={FRONT}>
        <Variant of="hat" name="default">
          <CoatHooks floating={false} />
        </Variant>
        <Variant of="hat" name="float">
          <CoatHooks floating />
        </Variant>
      </Item>

      <Decoy label="hot cupboard" position={[-3.5, 0, halfZ - 0.32]} rotation={FRONT} solid>
        <PlateWarmer />
      </Decoy>
    </>
  )
}

// ---------------------------------------------------------------------------
// Prep: tables, the left-hand wall bench and the rack overhead
// ---------------------------------------------------------------------------

function Prep() {
  const { halfX, height } = B
  return (
    <>
      <Decoy label="prep table" position={[PREP.xs[0], 0, PREP.z]} solid>
        <SteelTable width={PREP.width} depth={PREP.depth} />
      </Decoy>
      {/* what's on the tables are red herrings of their own, so they don't box in the fish */}
      <Decoy label="chopping board" position={[PREP.xs[0] - 0.1, BENCH, PREP.z]}>
        <FishBoard />
      </Decoy>
      <Decoy label="bowl of lemons" position={[PREP.xs[0] + 0.45, BENCH, PREP.z - 0.15]}>
        <Lemons />
      </Decoy>
      <Item id="fish" position={[PREP.xs[0] - 0.1, BENCH + 0.025, PREP.z]}>
        {(['whole', 'staring', 'bones'] as const).map((m) => (
          <Variant key={m} of="fish" name={m === 'whole' ? 'default' : m}>
            <Fish mode={m} />
          </Variant>
        ))}
      </Item>

      <Decoy label="prep table" position={[PREP.xs[1], 0, PREP.z]} solid>
        <SteelTable width={PREP.width} depth={PREP.depth} />
      </Decoy>
      <Decoy label="carrots and onions" position={[PREP.xs[1], 0, PREP.z]}>
        <VegPrep />
      </Decoy>
      <Item id="boards" position={[PREP.xs[1] + 0.55, BENCH, PREP.z - 0.05]}>
        <Variant of="boards" name="default">
          <BoardRack cheese={false} />
        </Variant>
        <Variant of="boards" name="cheese">
          <BoardRack cheese />
        </Variant>
      </Item>

      <Item id="utensils" position={[(PREP.xs[0] + PREP.xs[1]) / 2, 0, PREP.z]}>
        {(['normal', 'swing', 'whisk'] as const).map((m) => (
          <Variant key={m} of="utensils" name={m === 'normal' ? 'default' : m}>
            <UtensilRack mode={m} ceiling={height} />
          </Variant>
        ))}
      </Item>

      {/* --- the left-hand wall, back to front --- */}
      <Decoy label="dry store shelves" position={[-halfX + 0.26, 0, -2.85]} rotation={LEFT} solid>
        <DryStore />
      </Decoy>
      <Decoy label="fridge" position={[-halfX + 0.4, 0, -1.6]} rotation={LEFT} solid>
        <ReachInFridge />
      </Decoy>
      <Decoy label="bench" position={[-halfX + 0.36, 0, 0.05]} rotation={LEFT} solid>
        <SteelTable width={1.8} depth={0.7} />
      </Decoy>
      <Decoy label="stand mixer" position={[-halfX + 0.36, 0, 0.05]} rotation={LEFT}>
        <MixerAndFlour />
      </Decoy>
      <Item id="knives" position={[-halfX, 1.38, -0.45]} rotation={LEFT}>
        {(['normal', 'spoon', 'cleaver'] as const).map((m) => (
          <Variant key={m} of="knives" name={m === 'normal' ? 'default' : m}>
            <KnifeRack mode={m} />
          </Variant>
        ))}
      </Item>
      <Decoy label="shelf of tubs" position={[-halfX, 1.78, 0.05]} rotation={LEFT}>
        <SpiceShelf length={1.6} />
      </Decoy>
      <Decoy label="tray trolley" position={[-halfX + 0.3, 0, 1.6]} rotation={LEFT} solid>
        <TrayTrolley />
      </Decoy>
      <Item id="blanket" position={[-halfX, 1.5, 2.45]} rotation={LEFT}>
        <Variant of="blanket" name="default">
          <FireBlanket pulled={false} />
        </Variant>
        <Variant of="blanket" name="pulled">
          <FireBlanket pulled />
        </Variant>
      </Item>
      <Decoy label="fire extinguisher" position={[-halfX + 0.18, 0, 2.0]} rotation={LEFT} solid>
        <Model id="korean_fire_extinguisher_01" />
      </Decoy>
    </>
  )
}

// ---------------------------------------------------------------------------
// Back wall: walk-in and pot shelves; right wall: the dish run
// ---------------------------------------------------------------------------

function Storage() {
  const { halfX, halfZ, height } = B
  return (
    <>
      <group position={[WALKIN_X, 0, -halfZ]}>
        <WalkInRoom />
      </group>
      <Item id="walkin" position={[WALKIN_X, 0, -halfZ]}>
        {(['normal', 'frost', 'ajar'] as const).map((m) => (
          <Variant key={m} of="walkin" name={m === 'normal' ? 'default' : m}>
            <WalkInDoor mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="whiteboard" position={[-0.75, 1.55, -halfZ]}>
        <Variant of="whiteboard" name="default">
          <Whiteboard />
        </Variant>
        <Variant of="whiteboard" name="you">
          <Whiteboard you />
        </Variant>
      </Item>
      <Decoy label="bin" position={[0.35, 0, -halfZ + 0.3]} solid>
        <KitchenBin />
      </Decoy>
      <Item id="shelving" position={[2.1, 0, -halfZ + POT_SHELF.depth / 2 + 0.01]}>
        <PotShelves />
        {(['normal', 'missing', 'tower'] as const).map((m) => (
          <Variant key={m} of="shelving" name={m === 'normal' ? 'default' : m}>
            <PotStock mode={m} ceiling={height} />
          </Variant>
        ))}
      </Item>
      <Decoy label="delivery boxes" position={[3.85, 0, -halfZ + 0.3]} solid>
        <Model id="cardboard_box_01" rotation={[0, 0.15, 0]} />
        <Model id="cardboard_box_01" position={[0, 0.342, 0]} rotation={[0, -0.2, 0]} />
      </Decoy>

      {/* --- the dish run, from the door backwards --- */}
      <Decoy label="dirty dish table" position={[halfX - 0.36, 0, 2.95]} rotation={RIGHT} solid>
        <SteelTable width={1.1} depth={0.7} />
      </Decoy>
      <Decoy label="tub of cutlery" position={[halfX - 0.4, BENCH, 2.6]} rotation={RIGHT}>
        <CutleryTub />
      </Decoy>
      <Item id="plates" position={[halfX - 0.4, BENCH, 3.05]} rotation={RIGHT}>
        <Variant of="plates" name="default">
          <PlateStack lean={false} />
        </Variant>
        <Variant of="plates" name="lean">
          <PlateStack lean />
        </Variant>
      </Item>
      <Item id="sink" position={[halfX - 0.36, 0, 1.95]} rotation={RIGHT}>
        {(['normal', 'thrash', 'bubbles'] as const).map((m) => (
          <Variant key={m} of="sink" name={m === 'normal' ? 'default' : m}>
            <PotSink mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="dishwasher" position={[halfX - 0.36, 0, 1.12]} rotation={RIGHT}>
        <Variant of="dishwasher" name="default">
          <Dishwasher open={false} />
        </Variant>
        <Variant of="dishwasher" name="open">
          <Dishwasher open />
        </Variant>
      </Item>
      <Decoy label="clean dish table" position={[halfX - 0.36, 0, 0.15]} rotation={RIGHT} solid>
        <SteelTable width={1.1} depth={0.7} upstand>
          <group position={[-0.25, BENCH, 0]}>
            <PlateRack />
          </group>
          <group position={[0.27, BENCH, 0]}>
            <GlassRack />
          </group>
        </SteelTable>
      </Decoy>
      <Decoy label="shelf of glass racks" position={[halfX, 1.75, 0.15]} rotation={RIGHT}>
        <Block size={[1.1, 0.03, 0.5]} position={[0, 0, 0.27]} {...STAINLESS} radius={0.004} />
        {/* the brackets it sits on */}
        {[-0.42, 0.42].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Block size={[0.025, 0.24, 0.025]} position={[0, -0.12, 0.0125]} {...STAINLESS} radius={0.004} />
            <Block size={[0.025, 0.025, 0.42]} position={[0, -0.025, 0.21]} {...STAINLESS} radius={0.004} />
            <Block size={[0.02, 0.022, 0.3]} position={[0, -0.12, 0.13]} rotation={[-0.7, 0, 0]} {...STAINLESS} radius={0.004} />
          </group>
        ))}
        <group position={[-0.27, 0.015, 0.28]}>
          <GlassRack />
        </group>
        <group position={[0.27, 0.015, 0.28]}>
          <GlassRack />
        </group>
      </Decoy>
      <Item id="mop" position={[halfX - 0.36, 0, -1.0]} rotation={RIGHT}>
        <Variant of="mop" name="default">
          <MopBucket standing={false} />
        </Variant>
        <Variant of="mop" name="standing">
          <MopBucket standing />
        </Variant>
      </Item>
      {/* floor drain by the sink */}
      <Decoy label="floor drain" position={[3.2, 0, 1.6]}>
        <Block size={[0.3, 0.01, 0.3]} position={[0, 0.005, 0]} color="#6d7378" metalness={0.8} roughness={0.4} radius={0.003} />
      </Decoy>
    </>
  )
}

export const KitchenRoom = memo(function KitchenRoom() {
  return (
    <>
      <Lights />
      <Shell />
      <CookingLine />
      <FrontWall />
      <Prep />
      <Storage />
    </>
  )
})
