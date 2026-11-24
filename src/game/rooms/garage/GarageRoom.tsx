import { Environment } from '@react-three/drei'
import { memo, useMemo } from 'react'
import { Object3D } from 'three'
import { Block, Decoy, Item, PanelLight, PI, Variant } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { wallGeometry, type Opening } from '../../outsideLayers'
import { OFFICE, WORKSHOP as B, WORKSHOP_SHIFT } from './bounds'
import { Bonnet, CarBody, CatEars, Engine, Headlights, Lift, OddDoor, Wheels } from './car'
import {
  BENCH,
  BENCH_Z,
  CABINET_AT,
  CHAIR_AT,
  COUNTER,
  DESK,
  DOOR,
  FLOOR_BAY,
  FLOOR_DOOR_ALONG,
  LIFT_BAY,
  LIFT_RAISE,
  OFFICE_DOOR_Z,
  OFFICE_DOORWAY,
  OFFICE_SPLIT,
  OFFICE_WINDOW,
  STREET_SPLIT,
  STREET_WINDOW,
  WORKTOP,
} from './layout'
import {
  CarPoster,
  Certificate,
  Counter,
  Desk,
  DeskPhone,
  FilingCabinet,
  JobTray,
  Kettle,
  KeyBoard,
  Mugs,
  OfficeArchitrave,
  OfficeBin,
  OfficeClock,
  OfficeShell,
  OfficeWalls,
  OldComputer,
  OpenDoor,
  StoreDoor,
  StreetWindow,
  SwivelChair,
  TeaThings,
  WaitingSeats,
  Worktop,
} from './office'
import { blockWallTexture, ceilingTexture, floorTexture } from './textures'
import { Battens, Calendar, OfficeDoorFrame, OfficeWindow, OilPoster, PosterWall, RollerDoor, WallSign } from './walls'
import { BenchClutter, Compressor, Creeper, DrainPan, HoseEnd, OilDrums, PartsShelf, Pegboard, PegboardTools, ToolChest, TrolleyJack, TyreChanger, TyreStack, Vice, Workbench } from './workshop'

/*
 * An independent car repair workshop, laid out like a real one.
 *
 * Front wall (+z): two roller doors, one per bay. Cars drive in nose first,
 * so both point at the back wall. The left bay has a two-post lift, a post
 * either side of the car, holding a green hatchback at chest height for brake
 * work, with a drain pan under its engine. The right bay has a yellow car on
 * the floor with its bonnet up. Along the back wall: the roll cab in the
 * corner, then the long bench with its vice and the tool board above it, the
 * calendar, the parts racking and the oil drums. The office is through the
 * right-hand wall: its door near the back, and the reception window looking
 * out over the workshop, with the tyre machine, a stack of old tyres and the
 * compressor along that wall. The left wall is papered with years of posters.
 *
 * The office is a real room you can walk into (see office.tsx): built in
 * workshop space like everything else, and the whole building is shifted so
 * it sits centred in the room's bounds.
 *
 * Every piece of furniture blocks the player and can be clicked, changeable
 * or not, so neither walking through it nor clicking it gives away that it
 * can't be the answer.
 */

const GREEN = '#2e5e4e'
const YELLOW = '#d9a520'
const LIFT_BLUE = '#2563b0'
const LIFTED: Vec3 = [LIFT_BAY.x, LIFT_RAISE, LIFT_BAY.z]
const PARKED: Vec3 = [FLOOR_BAY.x, 0, FLOOR_BAY.z]
const POSTER_Z = -1.7
const POSTER_WALL = { width: 7.0, height: 1.6, y: 1.8 }
/** Painted band along the bottom of every wall, and the yellow line along its top. */
const BAND = 1.2
const LINE = 0.02

/**
 * The roller door openings cut through a strip of the front wall that runs
 * from `bottom` up `high` metres (the wall is turned round, so its x runs the
 * other way).
 */
const doorways = (bottom: number, high: number): Opening[] =>
  [LIFT_BAY.x, FLOOR_BAY.x].map((x) => ({ x0: -x - DOOR.width / 2, x1: -x + DOOR.width / 2, y0: -bottom - high / 2, y1: DOOR.height - bottom - high / 2 }))

/** The office doorway and the reception hatch, through the right wall (turned to face -x, so its own x runs along +z). */
const officeOpenings = (bottom: number, high: number): Opening[] => [
  { x0: OFFICE_DOOR_Z - OFFICE_DOORWAY.half, x1: OFFICE_DOOR_Z + OFFICE_DOORWAY.half, y0: -bottom - high / 2, y1: OFFICE_DOORWAY.height - bottom - high / 2 },
  {
    x0: OFFICE_WINDOW.z - OFFICE_WINDOW.width / 2,
    x1: OFFICE_WINDOW.z + OFFICE_WINDOW.width / 2,
    y0: OFFICE_WINDOW.y - OFFICE_WINDOW.height / 2 - bottom - high / 2,
    y1: OFFICE_WINDOW.y + OFFICE_WINDOW.height / 2 - bottom - high / 2,
  },
]

function Shell() {
  const { halfX, halfZ, height } = B
  const w = halfX * 2
  const d = halfZ * 2
  const floor = useMemo(() => floorTexture(), [])
  const long = useMemo(() => blockWallTexture(w / 1.8, height / 0.9), [w, height])
  const short = useMemo(() => blockWallTexture(d / 1.8, height / 0.9), [d, height])
  const ceiling = useMemo(() => ceilingTexture(w, d), [w, d])
  // the front wall, its band and its line, open where the roller doors are; the right wall open into the office
  const cut = useMemo(
    () => ({
      1: { wall: wallGeometry(w, height, doorways(0, height)), band: wallGeometry(w, BAND, doorways(0, BAND)), line: wallGeometry(w, LINE, doorways(BAND, LINE)) },
      3: { wall: wallGeometry(d, height, officeOpenings(0, height)), band: wallGeometry(d, BAND, officeOpenings(0, BAND)), line: wallGeometry(d, LINE, officeOpenings(BAND, LINE)) },
    }),
    [w, d, height],
  )
  const walls: { width: number; at: Vec3; rot: Vec3; long: boolean }[] = [
    { width: w, at: [0, height / 2, -halfZ], rot: [0, 0, 0], long: true },
    { width: w, at: [0, height / 2, halfZ], rot: [0, PI, 0], long: true },
    { width: d, at: [-halfX, height / 2, 0], rot: [0, PI / 2, 0], long: false },
    { width: d, at: [halfX, height / 2, 0], rot: [0, -PI / 2, 0], long: false },
  ]
  return (
    <group>
      <mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floor} roughness={0.7} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={ceiling} roughness={0.8} />
      </mesh>
      {walls.map(({ width, at, rot, long: isLong }, i) => (
        <group key={i} position={at} rotation={rot}>
          <mesh receiveShadow>
            {i === 1 || i === 3 ? <primitive object={cut[i].wall} attach="geometry" /> : <planeGeometry args={[width, height]} />}
            <meshStandardMaterial map={isLong ? long : short} roughness={0.9} />
          </mesh>
          {/* the bottom of every wall painted a darker colour that hides the grime */}
          <mesh position={[0, -height / 2 + BAND / 2, 0.002]} receiveShadow>
            {i === 1 || i === 3 ? <primitive object={cut[i].band} attach="geometry" /> : <planeGeometry args={[width, BAND]} />}
            <meshStandardMaterial color="#56635d" roughness={0.85} />
          </mesh>
          <mesh position={[0, -height / 2 + BAND + LINE / 2, 0.003]}>
            {i === 1 || i === 3 ? <primitive object={cut[i].line} attach="geometry" /> : <planeGeometry args={[width, LINE]} />}
            <meshStandardMaterial color="#e8b828" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* steel roof beams across the building */}
      {[-1.8, 2.7].map((z) => (
        <group key={z}>
          <Block size={[w, 0.02, 0.16]} position={[0, height - 0.01, z]} color="#5d666e" metalness={0.5} roughness={0.5} radius={0.002} />
          <Block size={[w, 0.24, 0.015]} position={[0, height - 0.14, z]} color="#5d666e" metalness={0.5} roughness={0.5} radius={0.002} />
          <Block size={[w, 0.02, 0.16]} position={[0, height - 0.27, z]} color="#5d666e" metalness={0.5} roughness={0.5} radius={0.002} />
        </group>
      ))}
    </group>
  )
}

function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      <Environment files="/hdri/lythwood_lounge.hdr" environmentIntensity={0.2} />
      <hemisphereLight args={['#f2f5ff', '#55564f', 0.95]} />
      <primitive object={target} position={[-0.5, 0, 0]} />
      <spotLight
        position={[-0.5, B.height - 0.1, 0.2]}
        target={target}
        angle={1.25}
        penumbra={1}
        intensity={12}
        decay={1.3}
        color="#f4f8ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-near={0.1}
        shadow-camera-far={13}
      />
      {/* daylight through the roller doors' vision panels */}
      <PanelLight position={[-0.55, 2.3, B.halfZ - 0.1]} size={[7.5, 0.5]} facing={[-0.55, 0.8, 0]} color="#e3ecff" intensity={3} />
    </>
  )
}

/** Bay one: the green car up on the lift, and the drain pan under its engine. */
function LiftBay() {
  return (
    <>
      <Item id="lift" position={[LIFT_BAY.x, 0, LIFT_BAY.z]}>
        <Variant of="lift" name="default">
          <Lift colour={LIFT_BLUE} />
        </Variant>
        <Variant of="lift" name="wobbly">
          <Lift colour={LIFT_BLUE} wobbly />
        </Variant>
      </Item>

      <Item id="lift-car" position={LIFTED}>
        <CarBody colour={GREEN} plate="GA12 RGE" />
        <Variant of="lift-car" name="default">
          {null}
        </Variant>
        <Variant of="lift-car" name="door">
          <OddDoor />
        </Variant>
      </Item>

      <Item id="lift-wheels" position={LIFTED}>
        <Variant of="lift-wheels" name="default">
          <Wheels />
        </Variant>
        <Variant of="lift-wheels" name="square">
          <Wheels odd={0} kind="square" />
        </Variant>
        <Variant of="lift-wheels" name="missing">
          <Wheels odd={2} kind="missing" />
        </Variant>
      </Item>

      <Item id="lift-lights" position={LIFTED}>
        {(['normal', 'on', 'lashes'] as const).map((m) => (
          <Variant key={m} of="lift-lights" name={m === 'normal' ? 'default' : m}>
            <Headlights mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="drain-pan" position={[LIFT_BAY.x, 0, LIFT_BAY.z - 1.4]}>
        <Variant of="drain-pan" name="default">
          <DrainPan fish={false} />
        </Variant>
        <Variant of="drain-pan" name="fish">
          <DrainPan fish />
        </Variant>
      </Item>
    </>
  )
}

/** Bay two: the yellow car on the floor with its bonnet up. */
function FloorBay() {
  return (
    <>
      <Item id="floor-car" position={PARKED}>
        <CarBody colour={YELLOW} open lights plate="DE14 JAV" />
        <Variant of="floor-car" name="default">
          {null}
        </Variant>
        <Variant of="floor-car" name="ears">
          <CatEars colour={YELLOW} />
        </Variant>
      </Item>

      <Item id="floor-wheels" position={PARKED}>
        <Variant of="floor-wheels" name="default">
          <Wheels />
        </Variant>
        <Variant of="floor-wheels" name="flat">
          <Wheels odd={2} kind="flat" />
        </Variant>
        <Variant of="floor-wheels" name="wooden">
          <Wheels odd={1} kind="wooden" />
        </Variant>
      </Item>

      <Item id="bonnet" position={PARKED}>
        <Variant of="bonnet" name="default">
          <Bonnet colour={YELLOW} stay="rod" />
        </Variant>
        <Variant of="bonnet" name="baguette">
          <Bonnet colour={YELLOW} stay="baguette" />
        </Variant>
      </Item>

      <Item id="engine" position={[FLOOR_BAY.x, 0.325, FLOOR_BAY.z - 1.46]}>
        {(['normal', 'eyes', 'hamster'] as const).map((m) => (
          <Variant key={m} of="engine" name={m === 'normal' ? 'default' : m}>
            <Engine mode={m} />
          </Variant>
        ))}
      </Item>

      {/* between the bays, where they get used */}
      <Item id="creeper" position={[-0.2, 0, 2.2]} rotation={[0, 0.25, 0]}>
        <Variant of="creeper" name="default">
          <Creeper boots={false} />
        </Variant>
        <Variant of="creeper" name="boots">
          <Creeper boots />
        </Variant>
      </Item>

      <Item id="jack" position={[-0.35, 0, -2.45]} rotation={[0, PI / 2, 0]}>
        <Variant of="jack" name="default">
          <TrolleyJack raised={false} />
        </Variant>
        <Variant of="jack" name="raised">
          <TrolleyJack raised />
        </Variant>
      </Item>
    </>
  )
}

/** The back wall: roll cab, bench, vice, tool board, calendar, parts racking, oil drums. */
function BackWall() {
  const { halfX, halfZ } = B
  return (
    <>
      <Item id="tool-chest" position={[-4.35, 0, -halfZ + 0.25]}>
        {(['normal', 'drawer', 'feet'] as const).map((m) => (
          <Variant key={m} of="tool-chest" name={m === 'normal' ? 'default' : m}>
            <ToolChest mode={m} />
          </Variant>
        ))}
      </Item>

      <Decoy label="workbench" position={[BENCH.x, 0, BENCH_Z]} solid>
        <Workbench />
      </Decoy>
      {/* the bench's back upstand, outside its decoy so things on the bench don't count as inside it */}
      <Block size={[BENCH.length, 0.12, 0.02]} position={[BENCH.x, BENCH.height + 0.06, -halfZ + 0.01]} color="#6f777e" metalness={0.6} roughness={0.45} />
      <Decoy label="mug" position={[BENCH.x, BENCH.height, BENCH_Z]}>
        <BenchClutter />
      </Decoy>

      <Item id="vice" position={[0.3, BENCH.height, BENCH_Z + BENCH.depth / 2 - 0.14]}>
        <Variant of="vice" name="default">
          <Vice holds="pipe" />
        </Variant>
        <Variant of="vice" name="duck">
          <Vice holds="duck" />
        </Variant>
        <Variant of="vice" name="teeth">
          <Vice holds="teeth" />
        </Variant>
      </Item>

      <Item id="pegboard" position={[BENCH.x, 1.72, -halfZ]}>
        <Pegboard />
        {(['normal', 'fish', 'gone'] as const).map((m) => (
          <Variant key={m} of="pegboard" name={m === 'normal' ? 'default' : m}>
            <PegboardTools mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="calendar" position={[0.35, 1.78, -halfZ]}>
        {(['normal', 'octember', 'gone'] as const).map((m) => (
          <Variant key={m} of="calendar" name={m === 'normal' ? 'default' : m}>
            <Calendar mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="shelf" position={[2.4, 0, -halfZ + 0.235]}>
        {(['normal', 'gone', 'glow'] as const).map((m) => (
          <Variant key={m} of="shelf" name={m === 'normal' ? 'default' : m}>
            <PartsShelf mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="drums" position={[halfX - 0.75, 0, -halfZ + 0.36]}>
        <Variant of="drums" name="default">
          <OilDrums ooze={false} />
        </Variant>
        <Variant of="drums" name="ooze">
          <OilDrums ooze />
        </Variant>
      </Item>

      <Decoy label="radio" position={[-3.05, BENCH.height, -halfZ + 0.16]}>
        <Model id="boombox" />
      </Decoy>
      <Decoy label="stool" position={[-0.9, 0, -2.92]} rotation={[0, 0.6, 0]} solid>
        <Model id="metal_stool_01" />
      </Decoy>
      <Decoy label="gas bottle" position={[3.78, 0, -halfZ + 0.24]} solid>
        <Model id="propane_tank" />
      </Decoy>
    </>
  )
}

/** The right wall: the office door and window, tyre machine, old tyres and the compressor. */
function OfficeWall() {
  const { halfX } = B
  return (
    <>
      <group position={[halfX, 0, OFFICE_DOOR_Z]} rotation={[0, -PI / 2, 0]}>
        <OfficeDoorFrame />
      </group>
      <Decoy label="fire extinguisher" position={[halfX - 0.2, 0, OFFICE_DOOR_Z - 0.82]} rotation={[0, -PI / 2, 0]} solid>
        <Model id="korean_fire_extinguisher_01" />
      </Decoy>

      <Item id="office-window" position={[halfX, OFFICE_WINDOW.y, OFFICE_WINDOW.z]} rotation={[0, -PI / 2, 0]}>
        {(['normal', 'blinds', 'watcher'] as const).map((m) => (
          <Variant key={m} of="office-window" name={m === 'normal' ? 'default' : m}>
            <OfficeWindow mode={m} />
          </Variant>
        ))}
      </Item>
      <Decoy label="sign" position={[halfX, OFFICE_WINDOW.y + 0.78, OFFICE_WINDOW.z]} rotation={[0, -PI / 2, 0]}>
        <WallSign text="RECEPTION" bg="#1f4fa0" ink="#ffffff" size={[0.9, 0.3]} />
      </Decoy>

      <Decoy label="tyre machine" position={[halfX - 0.65, 0, -0.3]} rotation={[0, -PI / 2, 0]} solid>
        <TyreChanger />
      </Decoy>
      <Decoy label="stack of tyres" position={[halfX - 0.55, 0, 1.55]} solid>
        <TyreStack count={3} />
      </Decoy>

      <Item id="compressor" position={[halfX - 0.6, 0, 3.1]}>
        <Compressor />
        {(['normal', 'snake', 'balloon'] as const).map((m) => (
          <Variant key={m} of="compressor" name={m === 'normal' ? 'default' : m}>
            <HoseEnd mode={m} />
          </Variant>
        ))}
      </Item>
    </>
  )
}

/** The front wall's roller doors and the left wall's posters. */
function FrontAndLeft() {
  const { halfX, halfZ } = B
  // the poster wall is turned to face +x, so its own x runs along -z
  const gapX = (-POSTER_Z + POSTER_WALL.width / 2) / POSTER_WALL.width
  return (
    <>
      <Item id="roller-door" position={[LIFT_BAY.x, 0, halfZ]} rotation={[0, PI, 0]}>
        <Variant of="roller-door" name="default">
          <RollerDoor from={STREET_SPLIT} />
        </Variant>
        <Variant of="roller-door" name="raised">
          <RollerDoor raised from={STREET_SPLIT} />
        </Variant>
      </Item>
      <Decoy label="roller door" position={[FLOOR_BAY.x, 0, halfZ]} rotation={[0, PI, 0]}>
        <RollerDoor along={FLOOR_DOOR_ALONG} from={OFFICE_SPLIT} to={STREET_SPLIT} />
      </Decoy>
      <Decoy label="sign" position={[(LIFT_BAY.x + FLOOR_BAY.x) / 2, 1.9, halfZ]} rotation={[0, PI, 0]}>
        <WallSign text="NO SMOKING" bg="#f4f1e8" ink="#d8342c" size={[0.5, 0.19]} />
      </Decoy>

      <Decoy label="posters" position={[-halfX, POSTER_WALL.y, 0]} rotation={[0, PI / 2, 0]}>
        <PosterWall width={POSTER_WALL.width} height={POSTER_WALL.height} gapX={gapX} />
      </Decoy>
      <Item id="poster" position={[-halfX, POSTER_WALL.y, POSTER_Z]} rotation={[0, PI / 2, 0]}>
        <Variant of="poster" name="default">
          <OilPoster mood="smile" />
        </Variant>
        <Variant of="poster" name="frown">
          <OilPoster mood="frown" />
        </Variant>
      </Item>

      <Item id="tyres" position={[-halfX + 0.55, 0, halfZ - 0.7]}>
        {(['normal', 'lean', 'donut'] as const).map((m) => (
          <Variant key={m} of="tyres" name={m === 'normal' ? 'default' : m}>
            <TyreStack count={4} mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="lights" position={[0, 0, 0]}>
        {(['normal', 'flicker', 'dangle'] as const).map((m) => (
          <Variant key={m} of="lights" name={m === 'normal' ? 'default' : m}>
            <Battens mode={m} />
          </Variant>
        ))}
      </Item>
    </>
  )
}

const TURN_TO_X: Vec3 = [0, PI / 2, 0]
const TURN_TO_MINUS_X: Vec3 = [0, -PI / 2, 0]

/** The office: hatch counter, desk and computer, filing cabinet, keys, the kettle corner. */
function Office() {
  const { x0, x1, z0, z1 } = OFFICE
  return (
    <>
      <OfficeWalls />
      <OfficeShell />
      <group position={[x0, 0, OFFICE_DOOR_Z]} rotation={TURN_TO_X}>
        <OfficeArchitrave />
      </group>
      <Decoy label="office door" position={[x0 + 0.03, 0, OFFICE_DOOR_Z - OFFICE_DOORWAY.half + 0.03]} solid>
        <OpenDoor />
      </Decoy>
      <Decoy label="store room door" position={[7.0, 0, z0]} solid>
        <StoreDoor />
      </Decoy>
      <Decoy label="window" position={[STREET_WINDOW.x, STREET_WINDOW.y, z1]} rotation={[0, PI, 0]}>
        <StreetWindow />
      </Decoy>

      {/* the reception counter under the hatch, and the seats for anyone waiting */}
      <Decoy label="counter" position={[x0 + COUNTER.depth / 2, 0, COUNTER.z]} rotation={TURN_TO_X} solid>
        <Counter length={COUNTER.length} depth={COUNTER.depth} height={COUNTER.height} />
      </Decoy>
      <Decoy label="waiting seats" position={[x0 + 0.3, 0, 2.85]} rotation={TURN_TO_X} solid>
        <WaitingSeats />
      </Decoy>
      <Decoy label="plant" position={[x0 + 0.32, 0, z1 - 0.32]} solid round>
        <Model id="potted_plant_01" />
      </Decoy>

      {/* the boss's desk along the side wall */}
      <Decoy label="desk" position={[x1 - DESK.depth / 2, 0, DESK.z]} rotation={TURN_TO_MINUS_X} solid>
        <Desk length={DESK.length} depth={DESK.depth} height={DESK.height} />
      </Decoy>
      <Decoy label="phone" position={[x1 - DESK.depth / 2, DESK.height, DESK.z]} rotation={TURN_TO_MINUS_X}>
        <DeskPhone />
      </Decoy>
      <Decoy label="job sheets" position={[x1 - DESK.depth / 2, DESK.height, DESK.z]} rotation={TURN_TO_MINUS_X}>
        <JobTray />
      </Decoy>
      <Item id="computer" position={[x1 - 0.36, DESK.height, DESK.z - 0.2]} rotation={TURN_TO_MINUS_X}>
        <Variant of="computer" name="default">
          <OldComputer mode="jobs" />
        </Variant>
        <Variant of="computer" name="message">
          <OldComputer mode="message" />
        </Variant>
      </Item>
      <Item id="chair" position={CHAIR_AT} rotation={TURN_TO_X}>
        <Variant of="chair" name="default">
          <SwivelChair />
        </Variant>
        <Variant of="chair" name="spin">
          <SwivelChair spin />
        </Variant>
      </Item>
      <Item id="car-poster" position={[x1, 1.72, DESK.z - 0.1]} rotation={TURN_TO_MINUS_X}>
        <Variant of="car-poster" name="default">
          <CarPoster mode="car" />
        </Variant>
        <Variant of="car-poster" name="you">
          <CarPoster mode="you" />
        </Variant>
      </Item>
      <Decoy label="bin" position={[x1 - 0.95, 0, DESK.z + DESK.length / 2 + 0.12]} solid round>
        <OfficeBin />
      </Decoy>
      <Decoy label="certificate" position={[x1, 1.6, 1.6]} rotation={TURN_TO_MINUS_X}>
        <Certificate />
      </Decoy>

      {/* the back of the office: filing cabinet in the corner, the clock over the store door, keys by the doorway */}
      <Item id="cabinet" position={CABINET_AT}>
        {(['normal', 'cat', 'stairs'] as const).map((m) => (
          <Variant key={m} of="cabinet" name={m === 'normal' ? 'default' : m}>
            <FilingCabinet mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="office-clock" position={[7.0, 2.35, z0]}>
        <Variant of="office-clock" name="default">
          <OfficeClock backwards={false} />
        </Variant>
        <Variant of="office-clock" name="backwards">
          <OfficeClock backwards />
        </Variant>
      </Item>
      <Item id="keys" position={[x0, 1.5, -0.45]} rotation={TURN_TO_X}>
        {(['normal', 'swing', 'gone'] as const).map((m) => (
          <Variant key={m} of="keys" name={m === 'normal' ? 'default' : m}>
            <KeyBoard mode={m} />
          </Variant>
        ))}
      </Item>

      {/* the kettle corner, by the window */}
      <Decoy label="kitchen cupboard" position={[x1 - WORKTOP.depth / 2, 0, WORKTOP.z]} rotation={TURN_TO_MINUS_X} solid>
        <Worktop length={WORKTOP.length} depth={WORKTOP.depth} height={WORKTOP.height} />
      </Decoy>
      <Item id="kettle" position={[x1 - 0.32, WORKTOP.height, WORKTOP.z - 0.48]} rotation={TURN_TO_MINUS_X}>
        <Variant of="kettle" name="default">
          <Kettle steam={false} toWall={0.32} />
        </Variant>
        <Variant of="kettle" name="steam">
          <Kettle steam toWall={0.32} />
        </Variant>
      </Item>
      <Item id="mugs" position={[x1 - 0.3, WORKTOP.height, WORKTOP.z + 0.02]}>
        <Variant of="mugs" name="default">
          <Mugs tower={false} />
        </Variant>
        <Variant of="mugs" name="tower">
          <Mugs tower />
        </Variant>
      </Item>
      <Decoy label="coffee" position={[x1 - 0.3, WORKTOP.height, WORKTOP.z + 0.48]} rotation={TURN_TO_MINUS_X}>
        <TeaThings />
      </Decoy>
    </>
  )
}

export const GarageRoom = memo(function GarageRoom() {
  return (
    <group position={[WORKSHOP_SHIFT, 0, 0]}>
      <Lights />
      <Shell />
      <LiftBay />
      <FloorBay />
      <BackWall />
      <OfficeWall />
      <FrontAndLeft />
      <Office />
    </group>
  )
})
