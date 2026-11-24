import { Block, Decoy, Item, PanelLight, PI, Variant } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { CORRIDOR, ROOM } from './bounds'
import {
  CageDoor,
  CoolantLevel,
  CoolantShell,
  DeskBody,
  DeskLever,
  DeskScreen,
  Drum,
  FuseBox,
  GaugeBacking,
  GaugePanel,
  LockerBank,
  LockerDoor,
  LockerEyes,
  Pipe,
  PipeJoint,
  PipePlaster,
  ReactorCore,
  ReactorFrame,
  ReactorHeart,
  Spanner,
  Spoon,
  SteamLeak,
  ToolBoard,
  ValveBody,
  ValveWheel,
  Workbench,
} from './engine'
import { ConsoleLights } from './parts'
import { useGratingTexture, useHazardTexture, usePanelTexture } from './textures'

/*
 * The engine room, in its own coordinates: the door from the corridor is in
 * the -x wall. The reactor stands in the middle in its cage, inside a hazard
 * ring; coolant tank in the far corner piped up to it; the engineer's desk
 * by the door, facing in; lockers and the workbench along the +z wall; gauges
 * and a riser pipe on the far wall.
 */

const { halfX, halfZ, height } = ROOM
const REACTOR: Vec3 = [0.4, 0, 0]
const COOLANT: Vec3 = [2.45, 0, -1.8]
const WALL = '#a3a698'

function EngineShell() {
  const w = halfX * 2
  const d = halfZ * 2
  const floor = useGratingTexture(w / 1.2, d / 1.2)
  const long = usePanelTexture(WALL, w / 1.3, height / 1.3, 2)
  const short = usePanelTexture(WALL, d / 1.3, height / 1.3, 2)
  const beside = usePanelTexture(WALL, (halfZ - CORRIDOR.door) / 1.3, height / 1.3, 2)
  const ceiling = usePanelTexture('#7e857c', w / 1.5, d / 1.5, 3)
  const stripes = useHazardTexture(w / 0.25, 0.6)
  const ring = useHazardTexture(10, 10)
  const side = halfZ - CORRIDOR.door
  const walls: { width: number; at: Vec3; rot: Vec3; map: typeof long }[] = [
    { width: w, at: [0, height / 2, -halfZ], rot: [0, 0, 0], map: long },
    { width: w, at: [0, height / 2, halfZ], rot: [0, PI, 0], map: long },
    { width: d, at: [halfX, height / 2, 0], rot: [0, -PI / 2, 0], map: short },
    // the bulkhead either side of the door
    { width: side, at: [-halfX, height / 2, -(CORRIDOR.door + side / 2)], rot: [0, PI / 2, 0], map: beside },
    { width: side, at: [-halfX, height / 2, CORRIDOR.door + side / 2], rot: [0, PI / 2, 0], map: beside },
  ]
  return (
    <group>
      <mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floor} metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={ceiling} metalness={0.5} roughness={0.6} />
      </mesh>
      {walls.map(({ width, at, rot, map }, i) => (
        <mesh key={i} position={at} rotation={rot} receiveShadow>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial map={map} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* hazard-striped kick plates */}
      {[
        { width: w, at: [0, 0.075, -halfZ + 0.003] as Vec3, rot: [0, 0, 0] as Vec3 },
        { width: w, at: [0, 0.075, halfZ - 0.003] as Vec3, rot: [0, PI, 0] as Vec3 },
        { width: d, at: [halfX - 0.003, 0.075, 0] as Vec3, rot: [0, -PI / 2, 0] as Vec3 },
      ].map(({ width, at, rot }, i) => (
        <mesh key={i} position={at} rotation={rot}>
          <planeGeometry args={[width, 0.15]} />
          <meshStandardMaterial map={stripes} roughness={0.6} />
        </mesh>
      ))}
      {/* keep-clear ring round the reactor */}
      <mesh position={[REACTOR[0], 0.004, REACTOR[2]]} rotation={[-PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.0, 1.15, 64]} />
        <meshStandardMaterial map={ring} roughness={0.6} />
      </mesh>

      {/* ribs, where the wall isn't already taken */}
      {[
        [-2.6, -1],
        [-2.6, 1],
        [-0.65, 1],
      ].map(([x, s]) => (
        <Block key={`${x}${s}`} size={[0.16, height, 0.14]} position={[x, height / 2, s * (halfZ - 0.07)]} color="#6b6f66" metalness={0.8} roughness={0.35} radius={0.02} />
      ))}

      {/* coolant feed: up out of the tank, along the deckhead and into the reactor's conduit */}
      <Pipe from={[COOLANT[0], 2.1, COOLANT[2]]} to={[COOLANT[0], 2.4, COOLANT[2]]} radius={0.06} />
      <Pipe from={[COOLANT[0], 2.4, COOLANT[2]]} to={[REACTOR[0], 2.4, COOLANT[2]]} radius={0.06} />
      <Pipe from={[REACTOR[0], 2.4, COOLANT[2]]} to={[REACTOR[0], 2.4, -0.1]} radius={0.06} />
      {[COOLANT[0], REACTOR[0]].map((x) => (
        <mesh key={x} position={[x, 2.4, COOLANT[2]]}>
          <sphereGeometry args={[0.075, 16, 12]} />
          <meshStandardMaterial color="#7f8a84" metalness={0.75} roughness={0.4} />
        </mesh>
      ))}
      {/* the line the valve sits on, along the -z wall behind the tank */}
      <Pipe from={[-0.6, 0, -halfZ + 0.12]} to={[-0.6, 1.05, -halfZ + 0.12]} radius={0.05} />
      <Pipe from={[-0.6, 1.05, -halfZ + 0.12]} to={[halfX, 1.05, -halfZ + 0.12]} radius={0.05} />
      <mesh position={[-0.6, 1.05, -halfZ + 0.12]}>
        <sphereGeometry args={[0.062, 16, 12]} />
        <meshStandardMaterial color="#7f8a84" metalness={0.75} roughness={0.4} />
      </mesh>
      {/* riser on the far wall */}
      <Pipe from={[halfX - 0.12, 0, 1.0]} to={[halfX - 0.12, height, 1.0]} radius={0.06} />
    </group>
  )
}

function EngineLights() {
  return (
    <>
      {[-1.7, 2.2].map((x) => (
        <group key={x}>
          <Block size={[0.16, 0.04, 4.2]} position={[x, height - 0.03, 0]} color="#ffe9c4" emissive="#ffe9c4" emissiveIntensity={1.8} radius={0.01} />
          <PanelLight position={[x, height - 0.06, 0]} size={[0.25, 4.2]} facing={[x, 0, 0]} color="#ffe9c4" intensity={2.4} />
        </group>
      ))}
    </>
  )
}

export function EngineRoom() {
  return (
    <>
      <EngineShell />
      <EngineLights />

      <Item id="reactor" position={REACTOR}>
        <ReactorFrame />
        <Variant of="reactor" name="default">
          <CageDoor open={false} />
          <ReactorCore />
        </Variant>
        <Variant of="reactor" name="door">
          <CageDoor open />
          <ReactorCore />
        </Variant>
        <Variant of="reactor" name="heart">
          <CageDoor open={false} />
          <ReactorHeart />
        </Variant>
      </Item>

      {/* sight glass turned towards the door */}
      <Item id="coolant" position={COOLANT} rotation={[0, -0.9, 0]}>
        <CoolantShell />
        <Variant of="coolant" name="default">
          <CoolantLevel level={0.8} />
        </Variant>
        <Variant of="coolant" name="low">
          <CoolantLevel level={0.2} />
        </Variant>
        <Variant of="coolant" name="fish">
          <CoolantLevel level={0.8} fish />
        </Variant>
      </Item>

      <Item id="desk" position={[-1.6, 0, -halfZ + 0.29]}>
        <DeskBody>
          <ConsoleLights alarm={false} size={[1.3, 0.34]} position={[0, 0.98, 0.09]} rotation={[0.45 - PI / 2, 0, 0]} />
        </DeskBody>
        <Variant of="desk" name="default">
          <DeskScreen kind="trace" />
          <DeskLever pulled={false} />
        </Variant>
        <Variant of="desk" name="lever">
          <DeskScreen kind="trace" />
          <DeskLever pulled />
        </Variant>
        <Variant of="desk" name="smile">
          <DeskScreen kind="smile" />
          <DeskLever pulled={false} />
        </Variant>
      </Item>

      <Item id="lockers" position={[-1.75, 0, halfZ - 0.235]} rotation={[0, PI, 0]}>
        <LockerBank />
        <Variant of="lockers" name="default">
          <LockerDoor open={false} />
        </Variant>
        <Variant of="lockers" name="ajar">
          <LockerDoor open />
        </Variant>
        <Variant of="lockers" name="eyes">
          <LockerDoor open={false} />
          <LockerEyes />
        </Variant>
      </Item>

      <Item id="gauges" position={[halfX, 1.55, -0.7]} rotation={[0, -PI / 2, 0]}>
        <GaugeBacking />
        <Variant of="gauges" name="default">
          <GaugePanel kind="normal" />
        </Variant>
        <Variant of="gauges" name="redline">
          <GaugePanel kind="redline" />
        </Variant>
        <Variant of="gauges" name="eye">
          <GaugePanel kind="eye" />
        </Variant>
      </Item>

      <Item id="valve" position={[0.6, 1.05, -halfZ]}>
        <ValveBody />
        <Variant of="valve" name="default">
          <group position={[0, 0, 0.34]}>
            <ValveWheel />
          </group>
        </Variant>
        <Variant of="valve" name="dropped">
          {/* come off its stem and landed on the floor below */}
          <group position={[0.22, -1.025, 0.42]} rotation={[-PI / 2, 0, 0.6]}>
            <ValveWheel />
          </group>
        </Variant>
      </Item>

      <Item id="steam" position={[halfX, 1.75, 1.0]} rotation={[0, -PI / 2, 0]}>
        <PipeJoint />
        <Variant of="steam" name="default">
          {null}
        </Variant>
        <Variant of="steam" name="leak">
          <SteamLeak />
        </Variant>
        <Variant of="steam" name="plaster">
          <PipePlaster />
        </Variant>
      </Item>

      <Item id="tools" position={[0.6, 1.5, halfZ]} rotation={[0, PI, 0]}>
        <ToolBoard />
        <Variant of="tools" name="default">
          <Spanner />
        </Variant>
        <Variant of="tools" name="missing">
          {null}
        </Variant>
        <Variant of="tools" name="spoon">
          <Spoon />
        </Variant>
      </Item>

      <Decoy label="workbench" position={[0.6, 0, halfZ - 0.31]} rotation={[0, PI, 0]} solid>
        <Workbench />
      </Decoy>
      {/* each drum blocks as its own circle */}
      <Decoy label="oil drums" position={[2.65, 0, 2.15]}>
        <group userData={{ solid: true, round: true }}>
          <Drum />
        </group>
        <group position={[0.05, 0, -0.62]} userData={{ solid: true, round: true }}>
          <Drum color="#8a2b22" />
        </group>
      </Decoy>
      <Decoy label="cardboard box" position={[1.85, 0, 2.25]} rotation={[0, 0.3, 0]} solid>
        <Model id="cardboard_box_01" />
      </Decoy>
      <Decoy label="fuse box" position={[1.6, 1.75, -halfZ]}>
        <FuseBox />
      </Decoy>
      <Decoy label="stool" position={[-1.6, 0, -1.5]} solid round>
        <Model id="metal_stool_01" />
      </Decoy>
    </>
  )
}
