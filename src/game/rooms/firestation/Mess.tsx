import { useMemo } from 'react'
import { Block, Decoy, Item, PI, Variant, Wallpaper } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { wallGeometry } from '../../outsideLayers'
import { TurnoutPrinter } from './fixtures'
import {
  CHAIR_ITEM,
  CHAIR_XS,
  CHAIR_Z,
  DARTBOARD,
  FRIDGE,
  KETTLE_Z,
  KITCHEN,
  MESS,
  MESS_DOOR,
  MESS_SINK_Z,
  MESS_WINDOW,
  MICROWAVE_Z,
  PARTITION,
  ROOM,
  SOFA,
  TABLE,
  TOASTER_Z,
  TV,
  WALL_UNITS,
} from './layout'
import {
  BaseUnits,
  Canisters,
  CeilingPanel,
  Chair,
  Dartboard,
  FishTank,
  Fridge,
  Kettle,
  MessBoard,
  MessSink,
  MessTable,
  MessWindow,
  Microwave,
  Radiator,
  Sleeper,
  TableTop,
  Telly,
  Toaster,
  TvUnit,
  WallUnits,
} from './messParts'
import { linoTexture, tiled } from './textures'

/*
 * The mess, through the door in the bay's back wall: a kitchen run along the
 * far wall under a window onto the drill yard, the big table the watch eats
 * at, and a sofa and TV at the -z end. Built in bay coordinates, like the
 * rest of the station.
 */

const { halfZ } = ROOM
const H = MESS.height
const PAINT = '#efebe2'
const WIDTH = MESS.x1 - MESS.x0
const MID = (MESS.x0 + MESS.x1) / 2
const DOOR_Z0 = MESS_DOOR.z - MESS_DOOR.width / 2 - 0.06
const DOOR_Z1 = MESS_DOOR.z + MESS_DOOR.width / 2 + 0.06
const DOOR_TOP = MESS_DOOR.height + 0.06
/** The window's hole in the far wall, in the wall plane's own space (its x runs towards -z). */
const WINDOW_HOLE = [{ x0: -MESS_WINDOW.z1, x1: -MESS_WINDOW.z0, y0: MESS_WINDOW.y0 - H / 2, y1: MESS_WINDOW.y1 - H / 2 }]
/** Along the far wall, facing into the mess: local x runs towards -z. */
const FAR: Vec3 = [0, PI / 2, 0]
const farWall = (z: number, y = 0): Vec3 => [MESS.x0, y, z]

function Painted({ width, high, at, rot, y0 = 0, hole }: { width: number; high: number; at: Vec3; rot: Vec3; y0?: number; hole?: typeof WINDOW_HOLE }) {
  const geo = useMemo(() => (hole ? wallGeometry(width, high, hole) : null), [width, high, hole])
  return (
    <mesh position={[at[0], y0 + high / 2, at[2]]} rotation={rot} receiveShadow>
      {geo ? <primitive object={geo} attach="geometry" /> : <planeGeometry args={[width, high]} />}
      <meshStandardMaterial color={PAINT} roughness={0.9} />
    </mesh>
  )
}

/**
 * The wall between the bay and the mess: one solid box each side of the
 * doorway (so collision stays tight round the opening) and the lintel over
 * it. They cast the bay lamp's shadow, so the mess isn't lit through the
 * wall. Each face is papered over by its own planes.
 */
export function Partition() {
  const h = ROOM.height
  const x = (PARTITION.x0 + PARTITION.x1) / 2
  const t = PARTITION.x1 - PARTITION.x0 - 0.02
  return (
    <>
      {[
        [-halfZ, DOOR_Z0],
        [DOOR_Z1, halfZ],
      ].map(([z0, z1]) => (
        <group key={z0} userData={{ solid: true }}>
          <mesh position={[x, h / 2, (z0 + z1) / 2]} castShadow receiveShadow>
            <boxGeometry args={[t, h, z1 - z0]} />
            <meshStandardMaterial color={PAINT} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[x, (DOOR_TOP + h) / 2, MESS_DOOR.z]} castShadow>
        <boxGeometry args={[t, h - DOOR_TOP, DOOR_Z1 - DOOR_Z0]} />
        <meshStandardMaterial color={PAINT} roughness={0.9} />
      </mesh>
      {/* the threshold strip */}
      <Block size={[PARTITION.x1 - PARTITION.x0 + 0.04, 0.006, MESS_DOOR.width]} position={[x, 0.003, MESS_DOOR.z]} color="#b9bec3" metalness={0.7} roughness={0.35} radius={0.002} />
    </>
  )
}

function MessShell() {
  const floor = useMemo(() => tiled(linoTexture(), (WIDTH + 0.2) / 0.6, (halfZ * 2) / 0.6), [])
  const face = PARTITION.x0
  return (
    <group>
      <mesh position={[MID + 0.1, 0, 0]} rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WIDTH + 0.2, halfZ * 2]} />
        <meshStandardMaterial map={floor} roughness={0.5} />
      </mesh>
      <mesh position={[MID, H, 0]} rotation={[PI / 2, 0, 0]}>
        <planeGeometry args={[WIDTH, halfZ * 2]} />
        <meshStandardMaterial color="#eeece6" roughness={0.9} />
      </mesh>

      {/* far wall with the window, the +z wall, the papered TV wall, and the mess side of the partition */}
      <Painted width={halfZ * 2} high={H} at={[MESS.x0, 0, 0]} rot={FAR} hole={WINDOW_HOLE} />
      <Painted width={WIDTH} high={H} at={[MID, 0, halfZ]} rot={[0, PI, 0]} />
      <Wallpaper kind="retro" width={WIDTH} height={H} position={[MID, H / 2, -halfZ]} />
      <Painted width={DOOR_Z0 + halfZ} high={H} at={[face, 0, (DOOR_Z0 - halfZ) / 2]} rot={[0, -PI / 2, 0]} />
      <Painted width={halfZ - DOOR_Z1} high={H} at={[face, 0, (DOOR_Z1 + halfZ) / 2]} rot={[0, -PI / 2, 0]} />
      <Painted width={DOOR_Z1 - DOOR_Z0} high={H - DOOR_TOP} y0={DOOR_TOP} at={[face, 0, MESS_DOOR.z]} rot={[0, -PI / 2, 0]} />

      {/* skirting all round, broken at the doorway and the kitchen */}
      <Block size={[WIDTH, 0.1, 0.015]} position={[MID, 0.05, halfZ - 0.0075]} color="#f4f2ec" roughness={0.5} radius={0.003} />
      <Block size={[WIDTH, 0.1, 0.015]} position={[MID, 0.05, -halfZ + 0.0075]} color="#f4f2ec" roughness={0.5} radius={0.003} />
      <Block size={[0.015, 0.1, DOOR_Z0 + halfZ]} position={[face - 0.0075, 0.05, (DOOR_Z0 - halfZ) / 2]} color="#f4f2ec" roughness={0.5} radius={0.003} />
      <Block size={[0.015, 0.1, halfZ - DOOR_Z1]} position={[face - 0.0075, 0.05, (DOOR_Z1 + halfZ) / 2]} color="#f4f2ec" roughness={0.5} radius={0.003} />

      {/* tiled splashback over the worktop, stopping under the window */}
      {[
        [KITCHEN.z0, MESS_WINDOW.z0, 0.5],
        [MESS_WINDOW.z0, MESS_WINDOW.z1, MESS_WINDOW.y0 - KITCHEN.top],
        [MESS_WINDOW.z1, KITCHEN.z1, 0.5],
      ].map(([z0, z1, h]) => (
        <Block key={z0} size={[0.008, h, z1 - z0]} position={[MESS.x0 + 0.004, KITCHEN.top + h / 2, (z0 + z1) / 2]} color="#eef0ec" roughness={0.2} radius={0.002} />
      ))}

      {/* light fittings, and the one light that does the work (short reach, so it barely gets into the bay) */}
      {[-1.6, 1.6].map((z) => (
        <group key={z} position={[MID, H, z]}>
          <CeilingPanel />
        </group>
      ))}
      <pointLight position={[MID - 0.3, H - 0.35, 0.2]} intensity={3.6} distance={5.2} decay={1.1} color="#fff8f0" />
    </group>
  )
}

function Kitchen() {
  const run = KITCHEN.z1 - KITCHEN.z0
  return (
    <>
      <Decoy label="kitchen units" position={farWall((KITCHEN.z0 + KITCHEN.z1) / 2)} rotation={FAR} solid>
        <BaseUnits length={run} />
      </Decoy>
      <Decoy label="sink" position={farWall(MESS_SINK_Z)} rotation={FAR}>
        <MessSink />
      </Decoy>
      {WALL_UNITS.map(([z0, z1]) => (
        <Decoy key={z0} label="wall cupboards" position={farWall((z0 + z1) / 2)} rotation={FAR}>
          <WallUnits length={z1 - z0} />
        </Decoy>
      ))}
      <Decoy label="window" position={farWall((MESS_WINDOW.z0 + MESS_WINDOW.z1) / 2)} rotation={FAR}>
        <MessWindow />
      </Decoy>
      <Decoy label="microwave" position={farWall(MICROWAVE_Z, KITCHEN.top)} rotation={FAR}>
        <group position={[0, 0, 0.3]}>
          <Microwave />
        </group>
      </Decoy>
      <Decoy label="tea and coffee tins" position={farWall(2.45, KITCHEN.top)} rotation={FAR}>
        <group position={[0, 0, 0.18]}>
          <Canisters />
        </group>
      </Decoy>

      <Item id="kettle" position={[MESS.x0 + 0.3, KITCHEN.top, KETTLE_Z]} rotation={[0, PI / 2, 0]}>
        <Variant of="kettle" name="default">
          <Kettle boiling={false} />
        </Variant>
        <Variant of="kettle" name="boiling">
          <Kettle boiling />
        </Variant>
      </Item>
      <Item id="toaster" position={[MESS.x0 + 0.3, KITCHEN.top, TOASTER_Z]}>
        <Variant of="toaster" name="default">
          <Toaster floating={false} />
        </Variant>
        <Variant of="toaster" name="floating">
          <Toaster floating />
        </Variant>
      </Item>
      <Item id="fridge" position={[MESS.x0 + FRIDGE.depth / 2 + 0.01, 0, FRIDGE.z]} rotation={[0, PI / 2, 0]}>
        {(['default', 'open', 'letters'] as const).map((m) => (
          <Variant key={m} of="fridge" name={m}>
            <Fridge mode={m} />
          </Variant>
        ))}
      </Item>
    </>
  )
}

function Dining() {
  const spots = CHAIR_XS.flatMap((x, i) => [
    { x, z: TABLE.z - CHAIR_Z, turn: 0, item: false },
    { x, z: TABLE.z + CHAIR_Z, turn: PI, item: i === CHAIR_ITEM },
  ])
  return (
    <>
      <Item id="table" position={[TABLE.x, 0, TABLE.z]}>
        <MessTable />
        {(['default', 'tower', 'cake'] as const).map((m) => (
          <Variant key={m} of="table" name={m}>
            <TableTop mode={m} />
          </Variant>
        ))}
      </Item>
      {spots.map((c) =>
        c.item ? (
          <Item key={`${c.x}${c.z}`} id="chair" position={[c.x, 0, c.z]} rotation={[0, c.turn, 0]}>
            <Variant of="chair" name="default">
              <Chair />
            </Variant>
            <Variant of="chair" name="ceiling">
              {/* stood on the ceiling, upside down, as if it were the floor */}
              <group position={[0, H, 0]} rotation={[PI, 0, 0]}>
                <Chair />
              </group>
            </Variant>
          </Item>
        ) : (
          <Decoy key={`${c.x}${c.z}`} label="chair" position={[c.x, 0, c.z]} rotation={[0, c.turn, 0]} solid>
            <Chair />
          </Decoy>
        ),
      )}
      <Item id="dartboard" position={[DARTBOARD.x, DARTBOARD.y, halfZ]} rotation={[0, PI, 0]}>
        <Variant of="dartboard" name="default">
          <Dartboard axe={false} />
        </Variant>
        <Variant of="dartboard" name="axe">
          <Dartboard axe />
        </Variant>
      </Item>
      <Decoy label="notice board" position={[-9.7, 1.5, halfZ]} rotation={[0, PI, 0]}>
        <MessBoard />
      </Decoy>
    </>
  )
}

function Lounge() {
  return (
    <>
      <Decoy label="TV unit" position={[TV.x, 0, -halfZ]} solid>
        <TvUnit />
      </Decoy>
      <Item id="tv" position={[TV.x, TV.unit.height, -halfZ + TV.unit.depth / 2]}>
        <Variant of="tv" name="default">
          <Telly on={false} />
        </Variant>
        <Variant of="tv" name="static">
          <Telly on />
        </Variant>
        <Variant of="tv" name="tank">
          <FishTank />
        </Variant>
      </Item>
      <Decoy label="coffee table" position={[TV.x, 0, -2.85]} solid>
        <Model id="modern_coffee_table_01" />
      </Decoy>
      <Item id="sofa" position={[SOFA.x, 0, SOFA.z]} rotation={[0, PI, 0]}>
        <Model id="sofa_02" />
        <Variant of="sofa" name="default">
          {null}
        </Variant>
        <Variant of="sofa" name="sleeper">
          <Sleeper seat={0.42} />
        </Variant>
      </Item>
      <Decoy label="armchair" position={[-10.5, 0, -2.55]} rotation={[0, PI - 0.6, 0]} solid>
        <Model id="ArmChair_01" />
      </Decoy>
      <Decoy label="radiator" position={[PARTITION.x0, 0, -0.3]} rotation={[0, -PI / 2, 0]}>
        <Radiator length={1.2} />
      </Decoy>
      <Decoy label="turnout printer" position={[PARTITION.x0, 0, -3.2]} rotation={[0, -PI / 2, 0]}>
        <TurnoutPrinter />
      </Decoy>
    </>
  )
}

export function Mess() {
  return (
    <>
      <MessShell />
      <Kitchen />
      <Dining />
      <Lounge />
    </>
  )
}
