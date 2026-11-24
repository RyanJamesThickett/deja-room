import { Environment } from '@react-three/drei'
import { memo, useMemo } from 'react'
import { Object3D } from 'three'
import { Block, Decoy, Item, PanelLight, PI, Variant } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { wallGeometry, type Opening } from '../../outsideLayers'
import { MeltedClock } from '../living/oddities'
import { Beacons, CabDoor, DisplayBoard, Engine, EngineLocker, Headlights, Ladder, NumberPlate, RearLocker, Siren, Wheel, WingMirror } from './engine'
import {
  BaBoard,
  BaParts,
  BayDoor,
  BayWindows,
  ConeStack,
  DryingRack,
  EquipmentShelf,
  ExitSign,
  HoseRack,
  HoseRolls,
  Lamps,
  LampPair,
  MessDoor,
  MessDoorway,
  MopBucket,
  MopSink,
  NoticeBoard,
  Poster,
  Roster,
  RosterFrame,
  ShelfStock,
  SinkContents,
  SpillKit,
  WallSign,
} from './fixtures'
import { BootBays, Boots, CrashMat, HelmetBays, Helmets, LockerDoor, Lockers, Pole, TunicBays, Tunics } from './gear'
import { BAY_DOOR, BEAM_XS, CAB, ENGINE_X, EQUIP, LOCKERS, MESS_DOOR, PANE_W, PANE_XS, PARTITION, POLE, ROOM, SHIFT, SHUTTERS, SIGN_WALL } from './layout'
import { Mess, Partition } from './Mess'
import { brickTexture, floorTexture, letteringTexture, signWallTexture, tiled } from './textures'

/*
 * The appliance bay of a British fire station, laid out like a real one.
 *
 * The engine stands in its painted box facing the folding doors at the front
 * (+x), so it can drive straight out. The riders' kit is along the left wall
 * (-z) right beside it: open lockers with helmet, tunic, and leggings pushed
 * down over boots on the floor, so a crew can dress in seconds. The pole
 * drops from the dormitory above into the back corner, by the first locker.
 * The equipment wall (+z) has the mop sink, shelving, breathing apparatus,
 * the hose rack and lengths hung up to dry. The back wall has the roster and
 * notice board, and the door through to the mess (Mess.tsx), held open.
 */

const { halfX, halfZ, height } = ROOM
const WALL = '#ebe7dd'
const DADO = '#9a2a22'
const DADO_H = 1.2
const DOOR_Z0 = MESS_DOOR.z - MESS_DOOR.width / 2 - 0.06
const DOOR_Z1 = MESS_DOOR.z + MESS_DOOR.width / 2 + 0.06
const DOOR_TOP = MESS_DOOR.height + 0.06
const WALL_T = PARTITION.x1 - PARTITION.x0
/** Holes through the front wall behind the bay door's windows, so the street outside shows through. */
const PANE_HOLES: Opening[] = PANE_XS.map((x) => ({
  x0: x - PANE_W / 2,
  x1: x + PANE_W / 2,
  y0: BAY_DOOR.glassY - height / 2,
  y1: BAY_DOOR.glassY + BAY_DOOR.glassH - height / 2,
}))

/** A painted brick wall panel with a red dado, facing +z in its own space, with any `openings` cut through (above the dado). */
function BrickWall({
  width,
  high,
  at,
  rot,
  dado = true,
  y0 = 0,
  openings,
}: {
  width: number
  high: number
  at: Vec3
  rot: Vec3
  dado?: boolean
  y0?: number
  openings?: Opening[]
}) {
  const map = useMemo(() => tiled(brickTexture(), width / 0.9, high / 0.9), [width, high])
  const lower = useMemo(() => tiled(brickTexture(), width / 0.9, DADO_H / 0.9), [width])
  const cut = useMemo(() => openings && wallGeometry(width, high, openings), [width, high, openings])
  return (
    <group position={at} rotation={rot}>
      <mesh position={[0, y0 + high / 2, 0]} receiveShadow>
        {cut ? <primitive object={cut} attach="geometry" /> : <planeGeometry args={[width, high]} />}
        <meshStandardMaterial color={WALL} map={map} roughness={0.9} />
      </mesh>
      {dado && y0 < DADO_H && (
        <mesh position={[0, DADO_H / 2, 0.003]} receiveShadow>
          <planeGeometry args={[width, DADO_H]} />
          <meshStandardMaterial color={DADO} map={lower} roughness={0.7} />
        </mesh>
      )}
    </group>
  )
}

function Shell() {
  const floor = useMemo(() => floorTexture(), [])
  const signs = useMemo(() => signWallTexture(SIGN_WALL.x1 - SIGN_WALL.x0, SIGN_WALL.height), [])
  const station = useMemo(() => letteringTexture('STATION 21 · RED WATCH', '#c4161c', '#f4f4f0'), [])
  const leftZ = (DOOR_Z0 - halfZ) / 2
  const rightZ = (DOOR_Z1 + halfZ) / 2
  return (
    <group>
      <mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[halfX * 2, halfZ * 2]} />
        <meshStandardMaterial map={floor} roughness={0.55} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[halfX * 2, halfZ * 2]} />
        <meshStandardMaterial color="#eef0f1" roughness={0.9} />
      </mesh>
      {/* steel roof beams across the bay */}
      {BEAM_XS.map((x) => (
        <group key={x}>
          <Block size={[0.02, 0.3, halfZ * 2]} position={[x, height - 0.15, 0]} color="#3f4a55" roughness={0.5} metalness={0.5} radius={0.003} />
          <Block size={[0.16, 0.02, halfZ * 2]} position={[x, height - 0.29, 0]} color="#3f4a55" roughness={0.5} metalness={0.5} radius={0.003} />
        </group>
      ))}

      {/* walls: kit wall, equipment wall, front (behind the doors), and the back wall round the mess door */}
      <BrickWall width={halfX * 2} high={height} at={[0, 0, -halfZ]} rot={[0, 0, 0]} />
      <BrickWall width={halfX * 2} high={height} at={[0, 0, halfZ]} rot={[0, PI, 0]} />
      <BrickWall width={halfZ * 2} high={height} at={[halfX, 0, 0]} rot={[0, -PI / 2, 0]} openings={PANE_HOLES} />
      <BrickWall width={DOOR_Z0 + halfZ} high={height} at={[-halfX, 0, leftZ]} rot={[0, PI / 2, 0]} />
      <BrickWall width={halfZ - DOOR_Z1} high={height} at={[-halfX, 0, rightZ]} rot={[0, PI / 2, 0]} />
      <BrickWall width={DOOR_Z1 - DOOR_Z0} high={height - DOOR_TOP} y0={DOOR_TOP} at={[-halfX, 0, MESS_DOOR.z]} rot={[0, PI / 2, 0]} />

      {/* the busy feature wall: safety signs plastered behind the BA sets and hoses */}
      <mesh position={[(SIGN_WALL.x0 + SIGN_WALL.x1) / 2, SIGN_WALL.height / 2, halfZ - 0.006]} rotation={[0, PI, 0]}>
        <planeGeometry args={[SIGN_WALL.x1 - SIGN_WALL.x0, SIGN_WALL.height]} />
        <meshStandardMaterial map={signs} roughness={0.85} />
      </mesh>
      {/* station name painted high on the kit wall */}
      <mesh position={[-0.6, 3.25, -halfZ + 0.005]}>
        <planeGeometry args={[4.4, 0.55]} />
        <meshStandardMaterial map={station} transparent roughness={0.8} />
      </mesh>
      {/* white tiles behind the mop sink */}
      <Block size={[0.8, 0.6, 0.01]} position={[EQUIP.sink, 1.15, halfZ - 0.005]} color="#f2f2ee" roughness={0.2} radius={0.002} />

      {/* fire point sign over the extinguishers, BA sign over the sets */}
      <group position={[EQUIP.extinguishers, 1.45, halfZ]} rotation={[0, PI, 0]}>
        <WallSign text="FIRE POINT" bg="#c8211b" ink="#ffffff" size={[0.5, 0.16]} />
      </group>
    </group>
  )
}

function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      {/* the lounge HDR is warm on one side; kept low so it only gives the metal something to reflect */}
      <Environment files="/hdri/lythwood_lounge.hdr" environmentIntensity={0.2} />
      <hemisphereLight args={['#f4f6ff', '#57524c', 0.7]} />
      <primitive object={target} position={[0, 0, 0]} />
      {/* the high-bay lamps over the engine: one casts the shadows, two rows of soft light */}
      <spotLight
        position={[0, height - 0.6, 0]}
        target={target}
        angle={1.35}
        penumbra={1}
        intensity={16}
        decay={1.3}
        color="#f4f8ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-near={0.1}
        shadow-camera-far={16}
      />
      {[-1.7, 1.7].map((z) => (
        <PanelLight key={z} position={[0, height - 0.7, z]} size={[7.6, 0.5]} facing={[0, 0, z]} color="#f4f8ff" intensity={3} />
      ))}
      {/* daylight through the windows in the bay doors */}
      <PanelLight position={[halfX - 0.1, 2.85, 0]} size={[4.2, 0.8]} facing={[0, 1.2, 0]} color="#fff3df" intensity={5} />
    </>
  )
}

function TheEngine() {
  const [x0, x1] = SHUTTERS[1]
  return (
    <group position={[ENGINE_X, 0, 0]}>
      <Item id="engine" position={[0, 0, 0]}>
        <Engine />
        {/* the driver's door sits inside the engine, so a recolour of the engine takes the door with it */}
        <Item id="cab" position={[CAB.x1, 0, CAB.side]}>
          {(['shut', 'open', 'dog'] as const).map((m) => (
            <Variant key={m} of="cab" name={m === 'shut' ? 'default' : m}>
              <CabDoor mode={m} />
            </Variant>
          ))}
        </Item>
      </Item>
      <Item id="beacons" position={[3.8, 2.9, 0]}>
        <Variant of="beacons" name="default">
          <Beacons flashing={false} />
        </Variant>
        <Variant of="beacons" name="flashing">
          <Beacons flashing />
        </Variant>
      </Item>
      <Item id="headlights" position={[3.81, 1.03, 0]}>
        {(['off', 'on', 'eyes'] as const).map((m) => (
          <Variant key={m} of="headlights" name={m === 'off' ? 'default' : m}>
            <Headlights mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="board" position={[3.805, 2.68, 0]}>
        {(
          [
            ['default', 'STATION 21'],
            ['see', 'I CAN SEE YOU'],
            ['tea', 'GONE FOR TEA'],
          ] as const
        ).map(([name, text]) => (
          <Variant key={name} of="board" name={name}>
            <DisplayBoard text={text} />
          </Variant>
        ))}
      </Item>
      <Item id="plate" position={[3.97, 0.74, 0]}>
        <Variant of="plate" name="default">
          <NumberPlate text="HP26 FRE" />
        </Variant>
        <Variant of="plate" name="neenaw">
          <NumberPlate text="NEE NAW" />
        </Variant>
      </Item>
      <Item id="siren" position={[3.96, 0.74, 0.62]}>
        <Variant of="siren" name="default">
          <Siren gramophone={false} />
        </Variant>
        <Variant of="siren" name="gramophone">
          <Siren gramophone />
        </Variant>
      </Item>
      <Item id="mirror" position={[3.7, 2.45, 1.2]}>
        <Variant of="mirror" name="default">
          <WingMirror watching={false} />
        </Variant>
        <Variant of="mirror" name="watching">
          <WingMirror watching />
        </Variant>
      </Item>
      <Item id="wheel" position={[-1.9, 0, 0.93]}>
        {(['round', 'square', 'flat'] as const).map((k) => (
          <Variant key={k} of="wheel" name={k === 'round' ? 'default' : k}>
            <Wheel rear kind={k} />
          </Variant>
        ))}
      </Item>
      <Item id="ladder" position={[-0.5, 3.0, 0]}>
        {(['normal', 'extended', 'wooden'] as const).map((k) => (
          <Variant key={k} of="ladder" name={k === 'normal' ? 'default' : k}>
            <Ladder kind={k} />
          </Variant>
        ))}
      </Item>
      <Item id="shutter" position={[(x0 + x1) / 2, 0, 1.2]}>
        {(['shut', 'ajar', 'snake'] as const).map((m) => (
          <Variant key={m} of="shutter" name={m === 'shut' ? 'default' : m}>
            <EngineLocker mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="reel" position={[-3.85, 0, 0]} rotation={[0, -PI / 2, 0]}>
        {(['shut', 'unspooled', 'sausages'] as const).map((m) => (
          <Variant key={m} of="reel" name={m === 'shut' ? 'default' : m}>
            <RearLocker mode={m} />
          </Variant>
        ))}
      </Item>
    </group>
  )
}

function KitWall() {
  const at: Vec3 = [LOCKERS.x, 0, -halfZ]
  return (
    <>
      <Item id="lockers" position={at}>
        <Lockers />
        <Variant of="lockers" name="default">
          {null}
        </Variant>
        <Variant of="lockers" name="shut">
          <LockerDoor />
        </Variant>
      </Item>
      <Item id="helmets" position={at}>
        <Helmets />
        {(['default', 'watching', 'cone'] as const).map((m) => (
          <Variant key={m} of="helmets" name={m}>
            <HelmetBays mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="tunics" position={at}>
        <Tunics />
        {(['default', 'ghost', 'tiny'] as const).map((m) => (
          <Variant key={m} of="tunics" name={m}>
            <TunicBays mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="boots" position={at}>
        <Boots />
        {(['default', 'goldfish', 'backwards'] as const).map((m) => (
          <Variant key={m} of="boots" name={m}>
            <BootBays mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="pole" position={[POLE.x, 0, POLE.z]}>
        {(['default', 'through', 'twist'] as const).map((m) => (
          <Variant key={m} of="pole" name={m}>
            <Pole mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="mat" position={[POLE.x, 0, POLE.z]}>
        <Variant of="mat" name="default">
          <CrashMat target={false} />
        </Variant>
        <Variant of="mat" name="target">
          <CrashMat target />
        </Variant>
      </Item>
    </>
  )
}

function EquipmentWall() {
  const wall = (x: number, y = 0): Vec3 => [x, y, halfZ]
  const facing: Vec3 = [0, PI, 0]
  return (
    <>
      <Item id="sink" position={wall(EQUIP.sink)} rotation={facing}>
        <MopSink />
        {(['default', 'running', 'duck'] as const).map((m) => (
          <Variant key={m} of="sink" name={m}>
            <SinkContents mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="shelf" position={wall(EQUIP.shelf)} rotation={facing}>
        <EquipmentShelf />
        {(['default', 'cat', 'empty'] as const).map((m) => (
          <Variant key={m} of="shelf" name={m}>
            <ShelfStock mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="ba" position={wall(EQUIP.ba)} rotation={facing}>
        <BaBoard />
        {(['default', 'balloon', 'snorkel'] as const).map((m) => (
          <Variant key={m} of="ba" name={m}>
            <BaParts mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="hoses" position={wall(EQUIP.hoses)} rotation={facing}>
        <HoseRack />
        {(['default', 'bow', 'unrolled'] as const).map((m) => (
          <Variant key={m} of="hoses" name={m}>
            <HoseRolls mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="drying" position={wall(EQUIP.drying)} rotation={facing}>
        <Variant of="drying" name="default">
          <DryingRack knot={false} />
        </Variant>
        <Variant of="drying" name="knot">
          <DryingRack knot />
        </Variant>
      </Item>
      <Item id="extinguisher" position={[EQUIP.extinguishers, 0, halfZ - 0.25]} rotation={facing}>
        <group position={[-0.2, 0, 0]}>
          <Model id="korean_fire_extinguisher_01" />
        </group>
        <Variant of="extinguisher" name="default">
          <group position={[0.2, 0, 0]}>
            <Model id="korean_fire_extinguisher_01" />
          </group>
        </Variant>
        <Variant of="extinguisher" name="upside">
          <group position={[0.2, 0.659, 0]} rotation={[0, 0, PI]}>
            <Model id="korean_fire_extinguisher_01" />
          </group>
        </Variant>
      </Item>
    </>
  )
}

function BackAndFront() {
  const back: Vec3 = [0, PI / 2, 0]
  return (
    <>
      <group position={[-halfX, 0, MESS_DOOR.z]} rotation={back}>
        <MessDoorway wall={WALL_T} />
      </group>
      <Item id="door" position={[-halfX, 0, MESS_DOOR.z]} rotation={back}>
        {(['default', 'flap', 'inwards'] as const).map((m) => (
          <Variant key={m} of="door" name={m}>
            <MessDoor mode={m} wall={WALL_T} />
          </Variant>
        ))}
      </Item>
      <Item id="roster" position={[-halfX, 1.55, 0.4]} rotation={back}>
        <RosterFrame />
        {(['normal', 'you', 'clean'] as const).map((m) => (
          <Variant key={m} of="roster" name={m === 'normal' ? 'default' : m}>
            <Roster mode={m} />
          </Variant>
        ))}
      </Item>
      <Item id="noticeboard" position={[-halfX, 1.5, -1.3]} rotation={back}>
        <NoticeBoard />
        <Variant of="noticeboard" name="default">
          <Poster kind="smoke" />
        </Variant>
        <Variant of="noticeboard" name="missing">
          <Poster kind="missing" />
        </Variant>
        <Variant of="noticeboard" name="upside">
          <Poster kind="smoke" upside />
        </Variant>
      </Item>
      <Item id="clock" position={[-halfX, 3.0, 0.4]} rotation={back}>
        <Variant of="clock" name="default">
          <Model id="wall_clock" anchor="wall" scale={1.4} />
        </Variant>
        <Variant of="clock" name="melted">
          <MeltedClock radius={0.22} />
        </Variant>
      </Item>

      <Item id="baydoor" position={[halfX, 0, 0]} rotation={[0, -PI / 2, 0]}>
        <BayDoor />
        <Variant of="baydoor" name="default">
          <BayWindows view="day" />
        </Variant>
        <Variant of="baydoor" name="underwater">
          <BayWindows view="underwater" />
        </Variant>
        <Variant of="baydoor" name="bricked">
          <BayWindows view="day" bricked />
        </Variant>
      </Item>

      <Item id="lamps" position={[0, 0, 0]}>
        <Lamps />
        {(['default', 'swinging', 'out'] as const).map((m) => (
          <Variant key={m} of="lamps" name={m}>
            <LampPair mode={m} />
          </Variant>
        ))}
      </Item>
    </>
  )
}

/** Red herrings: station clutter that never changes. */
function Clutter() {
  return (
    <>
      <Decoy label="traffic cones" position={[halfX - 0.6, 0, -halfZ + 0.45]} solid>
        <ConeStack />
      </Decoy>
      <Decoy label="spill kit" position={[3.3, 0, -halfZ + 0.32]} solid>
        <SpillKit />
      </Decoy>
      <Decoy label="tool chest" position={[EQUIP.chest, 0, halfZ - 0.22]} rotation={[0, PI, 0]} solid>
        <Model id="metal_tool_chest" />
      </Decoy>
      <Decoy label="mop bucket" position={[EQUIP.bucket, 0, halfZ - 0.3]} solid>
        <MopBucket />
      </Decoy>
      <Decoy label="first aid kit" position={[-halfX, 1.5, -3.2]} rotation={[0, PI / 2, 0]}>
        {/* lid out from the wall, spun round so the lettering reads the right way up */}
        <group rotation={[PI / 2, PI, 0]}>
          <Model id="medical_box" />
        </group>
      </Decoy>
      <Decoy label="exit sign" position={[-halfX, 2.4, MESS_DOOR.z]} rotation={[0, PI / 2, 0]}>
        <ExitSign />
      </Decoy>
    </>
  )
}

export const FireStationRoom = memo(function FireStationRoom() {
  return (
    // built in bay coordinates, moved along so the bay and the mess behind it sit centred in the bounds
    <group position={[SHIFT, 0, 0]}>
      <Lights />
      <Shell />
      <Partition />
      <TheEngine />
      <KitWall />
      <EquipmentWall />
      <BackAndFront />
      <Clutter />
      <Mess />
    </group>
  )
})
