import { Environment } from '@react-three/drei'
import { memo, useMemo } from 'react'
import { Object3D } from 'three'
import { useSurface } from '../../assets'
import { Block, Decoy, Item, PI, Variant, Wallpaper } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { wallGeometry } from '../../outsideLayers'
import { GYM_BOUNDS as B } from './bounds'
import {
  Bench,
  CableMachine,
  DumbbellRack,
  ExerciseBike,
  Kettlebells,
  OddDumbbells,
  PlateTree,
  PowerRack,
  RackedBar,
  Rower,
  Treadmill,
} from './equipment'
import {
  Battens,
  Bin,
  ExerciseBall,
  GlassDoor,
  GymBag,
  GymSign,
  GymWindow,
  LedClock,
  MirrorWall,
  PlyoBoxes,
  Poster,
  ReceptionDesk,
  StretchMats,
  TowelRail,
  Tv,
  WaterCooler,
  WipesStation,
} from './fittings'
import {
  BALL_AT,
  BENCH_AT,
  BIKE_AT,
  CABLE_AT,
  COOLER_AT,
  DESK_AT,
  DOOR_ALONG,
  DOOR_X,
  DOORWAY,
  FIGURE_AT,
  FLAT_BENCH_AT,
  KETTLEBELLS_AT,
  MIRROR,
  PLATE_TREE_AT,
  POWER_RACK_AT,
  RACK_AT,
  ROWER_AT,
  TREADMILL_XS,
  TREADMILL_Z,
  TV_AT,
  WINDOW,
} from './layout'
import { useRubberFloor } from './textures'

/*
 * A 24-hour high-street gym at night, laid out like a real one (see
 * layout.ts for the plan). You come in through the glass door with
 * reception on your right; the runners face the street through the window
 * with the TV hung above it, and the free weights face the mirror wall.
 *
 * Every piece of furniture blocks the player and can be clicked, changeable
 * or not, so neither walking through it nor clicking it gives away that it
 * can't be the answer.
 */

const WALL = '#dcded9'
const LEFT = -B.halfX
const RIGHT = B.halfX
const BACK = -B.halfZ
const FRONT = B.halfZ
const TURN_IN_FROM_RIGHT: Vec3 = [0, -PI / 2, 0]
const TURN_IN_FROM_LEFT: Vec3 = [0, PI / 2, 0]
const MIDDLE_TREADMILL = 1

function Shell() {
  const { halfX, halfZ, height } = B
  const w = halfX * 2
  const d = halfZ * 2
  const floor = useRubberFloor(w, d)
  const plasterLong = useSurface('painted_plaster_wall', w / 2, height / 2)
  const plasterShort = useSurface('painted_plaster_wall', d / 2, height / 2)
  // the front wall (turned round, so its x runs the other way) is cut through for the window and the doorway
  const front = useMemo(
    () =>
      wallGeometry(w, height, [
        { x0: -WINDOW.x - WINDOW.width / 2, x1: -WINDOW.x + WINDOW.width / 2, y0: WINDOW.y - WINDOW.height / 2 - height / 2, y1: WINDOW.y + WINDOW.height / 2 - height / 2 },
        { x0: -DOOR_X - DOORWAY.width / 2, x1: -DOOR_X + DOORWAY.width / 2, y0: -height / 2, y1: DOORWAY.height - height / 2 },
      ]),
    [w, height],
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
        <meshStandardMaterial map={floor} roughness={0.95} />
      </mesh>
      {/* exposed, painted-black ceiling with a ventilation duct */}
      <mesh rotation={[PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#26282c" roughness={0.9} />
      </mesh>
      <mesh position={[0, height - 0.16, 1.1]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, w, 24, 1, true]} />
        <meshStandardMaterial color="#9aa1a8" metalness={0.8} roughness={0.35} />
      </mesh>
      {walls.map(({ width, at, rot, long }, i) => (
        <mesh key={i} position={at} rotation={rot} receiveShadow>
          {i === 1 ? <primitive object={front} attach="geometry" /> : <planeGeometry args={[width, height]} />}
          <meshStandardMaterial color={WALL} {...(long ? plasterLong : plasterShort)} />
        </mesh>
      ))}
      {[
        { size: [w, 0.1, 0.02] as Vec3, at: [0, 0.05, -halfZ + 0.01] as Vec3 },
        { size: [w, 0.1, 0.02] as Vec3, at: [0, 0.05, halfZ - 0.01] as Vec3 },
        { size: [0.02, 0.1, d] as Vec3, at: [-halfX + 0.01, 0.05, 0] as Vec3 },
        { size: [0.02, 0.1, d] as Vec3, at: [halfX - 0.01, 0.05, 0] as Vec3 },
      ].map(({ size, at }, i) => (
        <Block key={i} size={size} position={at} color="#151517" roughness={0.6} radius={0.004} />
      ))}
      {/* the papered feature wall, opposite reception */}
      <Wallpaper kind="harlequin" width={d - 0.04} height={height - 0.1} position={[-halfX, height / 2 + 0.05, 0]} rotation={TURN_IN_FROM_LEFT} />
    </group>
  )
}

function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      <Environment files="/hdri/lythwood_lounge.hdr" environmentIntensity={0.35} />
      <hemisphereLight args={['#f4f8ff', '#3a3c40', 0.55]} />
      <primitive object={target} position={[0, 0, 0]} />
      <spotLight
        position={[0, B.height - 0.1, 0]}
        target={target}
        angle={1.3}
        penumbra={1}
        intensity={6}
        decay={1.4}
        color="#f4f8ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
      />
      <Battens zs={[-2.2, 0, 2.2]} length={B.halfX * 2 - 0.6} height={B.height} />
    </>
  )
}

/** The front of the gym: shopfront, cardio row, TV, reception. */
function Front() {
  return (
    <>
      <Item id="window" position={[WINDOW.x, WINDOW.y, FRONT]} rotation={[0, PI, 0]}>
        <Variant of="window" name="default">
          <GymWindow width={WINDOW.width} height={WINDOW.height} y={WINDOW.y} day={false} />
        </Variant>
        <Variant of="window" name="day">
          <GymWindow width={WINDOW.width} height={WINDOW.height} y={WINDOW.y} day />
        </Variant>
      </Item>

      <Item id="door" position={[DOOR_X, 0, FRONT]} rotation={[0, PI, 0]}>
        <Variant of="door" name="default">
          <GlassDoor ajar={false} along={DOOR_ALONG} />
        </Variant>
        <Variant of="door" name="ajar">
          <GlassDoor ajar along={DOOR_ALONG} />
        </Variant>
      </Item>

      {/* runners face the street */}
      <Item id="treadmills" position={[0, 0, TREADMILL_Z]}>
        {TREADMILL_XS.map((x, i) =>
          i === MIDDLE_TREADMILL ? (
            <group key={x} position={[x, 0, 0]}>
              <Variant of="treadmills" name="default">
                <Treadmill />
              </Variant>
              <Variant of="treadmills" name="running">
                <Treadmill mode="running" />
              </Variant>
              <Variant of="treadmills" name="incline">
                <Treadmill mode="incline" />
              </Variant>
            </group>
          ) : (
            <group key={x} position={[x, 0, 0]}>
              <Treadmill />
            </group>
          ),
        )}
      </Item>

      <Item id="bike" position={BIKE_AT}>
        <Variant of="bike" name="default">
          <ExerciseBike />
        </Variant>
        <Variant of="bike" name="pedalling">
          <ExerciseBike mode="pedalling" />
        </Variant>
        <Variant of="bike" name="basket">
          <ExerciseBike mode="basket" />
        </Variant>
      </Item>

      <Item id="rower" position={ROWER_AT}>
        <Variant of="rower" name="default">
          <Rower />
        </Variant>
        <Variant of="rower" name="oars">
          <Rower mode="oars" />
        </Variant>
        <Variant of="rower" name="seat">
          <Rower mode="seat" />
        </Variant>
      </Item>

      {/* hung from the ceiling over the window, facing the runners */}
      <Item id="tv" position={TV_AT} rotation={[0, PI, 0]}>
        <Variant of="tv" name="default">
          <Tv mode="show" toCeiling={B.height - TV_AT[1]} />
        </Variant>
        <Variant of="tv" name="plan">
          <Tv mode="plan" toCeiling={B.height - TV_AT[1]} />
        </Variant>
        <Variant of="tv" name="off">
          <Tv mode="off" toCeiling={B.height - TV_AT[1]} />
        </Variant>
      </Item>

      {/* reception: the receptionist sits with the right wall behind them, facing the door */}
      <Item id="desk" position={DESK_AT} rotation={TURN_IN_FROM_RIGHT}>
        <Variant of="desk" name="default">
          <ReceptionDesk stare={false} />
        </Variant>
        <Variant of="desk" name="stare">
          <ReceptionDesk stare />
        </Variant>
      </Item>

      {/* the sign sits towards the front corner so it clears the poster beside the cable machine */}
      <Item id="sign" position={[RIGHT, 2.2, DESK_AT[2] + 0.35]} rotation={TURN_IN_FROM_RIGHT}>
        <Variant of="sign" name="default">
          <GymSign name="IRONWORKS" />
        </Variant>
        <Variant of="sign" name="worms">
          <GymSign name="IRONWORMS" />
        </Variant>
      </Item>

      <Item id="poster2" position={[RIGHT, 1.8, 1.25]} rotation={TURN_IN_FROM_RIGHT}>
        <Poster kind="sweat" paint />
      </Item>
    </>
  )
}

/** The back half: mirror wall and free weights, the squat rack and cable machine. */
function Weights() {
  return (
    <>
      <Item id="mirror" position={[MIRROR.x, MIRROR.y, BACK]}>
        <MirrorWall
          width={MIRROR.width}
          height={MIRROR.height}
          item="mirror"
          omit="ball"
          figureAt={[FIGURE_AT[0] - MIRROR.x, -MIRROR.y, FIGURE_AT[2] - BACK]}
        />
        {/* the mirror reads these to decide what to reflect */}
        <Variant of="mirror" name="default">
          {null}
        </Variant>
        <Variant of="mirror" name="figure">
          {null}
        </Variant>
        <Variant of="mirror" name="missing">
          {null}
        </Variant>
      </Item>

      <Item id="timer" position={[MIRROR.x, 2.62, BACK]}>
        <Variant of="timer" name="default">
          <LedClock text="21:47" />
        </Variant>
        <Variant of="timer" name="wrong">
          <LedClock text="66:66" />
        </Variant>
      </Item>

      <Item id="dumbbells" position={RACK_AT}>
        <DumbbellRack />
        <Variant of="dumbbells" name="default">
          <OddDumbbells mode="normal" />
        </Variant>
        <Variant of="dumbbells" name="cheese">
          <OddDumbbells mode="cheese" />
        </Variant>
        <Variant of="dumbbells" name="gap">
          <OddDumbbells mode="gap" />
        </Variant>
      </Item>

      {/* benches face the mirror: seat at the mirror end, backrest behind */}
      <Item id="bench" position={BENCH_AT}>
        <Variant of="bench" name="default">
          <Bench pad="#c0392b" />
        </Variant>
        <Variant of="bench" name="flat">
          <Bench pad="#c0392b" flat />
        </Variant>
      </Item>

      <Item id="kettlebells" position={KETTLEBELLS_AT}>
        <Variant of="kettlebells" name="default">
          <Kettlebells />
        </Variant>
        <Variant of="kettlebells" name="face">
          <Kettlebells mode="face" />
        </Variant>
        <Variant of="kettlebells" name="float">
          <Kettlebells mode="float" />
        </Variant>
      </Item>

      <Item id="plates" position={PLATE_TREE_AT}>
        <Variant of="plates" name="default">
          <PlateTree />
        </Variant>
        <Variant of="plates" name="donut">
          <PlateTree donut />
        </Variant>
      </Item>

      {/* squat rack in the back corner, open side to the room */}
      <Item id="squat-rack" position={POWER_RACK_AT} rotation={TURN_IN_FROM_RIGHT}>
        <PowerRack />
        <Variant of="squat-rack" name="default">
          <RackedBar mode="normal" />
        </Variant>
        <Variant of="squat-rack" name="lopsided">
          <RackedBar mode="lopsided" />
        </Variant>
        <Variant of="squat-rack" name="bent">
          <RackedBar mode="bent" />
        </Variant>
      </Item>

      <Item id="cable" position={CABLE_AT} rotation={TURN_IN_FROM_RIGHT}>
        <Variant of="cable" name="default">
          <CableMachine />
        </Variant>
        <Variant of="cable" name="stack">
          <CableMachine lifted />
        </Variant>
      </Item>
    </>
  )
}

/** The feature wall: posters, towels, water, and the stretching corner. */
function LeftWall() {
  return (
    <>
      <Item id="poster" position={[LEFT, 1.75, -2.2]} rotation={TURN_IN_FROM_LEFT}>
        <Variant of="poster" name="default">
          <Poster kind="push" />
        </Variant>
        <Variant of="poster" name="sinister">
          <Poster kind="sinister" />
        </Variant>
      </Item>

      <Item id="towels" position={[LEFT, 1.45, -1.0]} rotation={TURN_IN_FROM_LEFT}>
        <Variant of="towels" name="default">
          <TowelRail upward={false} />
        </Variant>
        <Variant of="towels" name="upward">
          <TowelRail upward />
        </Variant>
      </Item>

      <Item id="cooler" position={COOLER_AT} rotation={TURN_IN_FROM_LEFT}>
        <Variant of="cooler" name="default">
          <WaterCooler mode="full" />
        </Variant>
        <Variant of="cooler" name="fish">
          <WaterCooler mode="fish" />
        </Variant>
        <Variant of="cooler" name="empty">
          <WaterCooler mode="empty" />
        </Variant>
      </Item>

      <Item id="ball" position={BALL_AT}>
        <Variant of="ball" name="default">
          <ExerciseBall flat={false} />
        </Variant>
        <Variant of="ball" name="deflated">
          <ExerciseBall flat />
        </Variant>
      </Item>
    </>
  )
}

/** Red herrings: furniture and clutter that never changes. */
function Clutter() {
  return (
    <>
      <Decoy label="flat bench" position={FLAT_BENCH_AT} solid>
        <Bench flat />
      </Decoy>
      <Decoy label="plyo boxes" position={[LEFT + 0.38, 0, BACK + 0.45]} solid>
        <PlyoBoxes />
      </Decoy>
      <Decoy label="stretching mats" position={[-2.8, 0, 0.1]}>
        <StretchMats />
      </Decoy>
      <Decoy label="gym bag" position={[-0.35, 0, BACK + 0.4]} rotation={[0, 0.25, 0]} solid>
        <GymBag />
      </Decoy>
      <Decoy label="wipes" position={[RIGHT, 1.2, -0.98]} rotation={TURN_IN_FROM_RIGHT}>
        <WipesStation />
      </Decoy>
      <Decoy label="bin" position={[1.9, 0, FRONT - 0.3]} solid round>
        <Bin />
      </Decoy>
      <Decoy label="fire extinguisher" position={[3.4, 0, FRONT - 0.18]} rotation={[0, PI, 0]} solid>
        <Model id="korean_fire_extinguisher_01" />
      </Decoy>
      <Decoy label="stool" position={[RIGHT - 0.35, 0, DESK_AT[2] - 0.3]} solid round>
        <Model id="metal_stool_01" />
      </Decoy>
    </>
  )
}

export const GymRoom = memo(function GymRoom() {
  return (
    <>
      <Lights />
      <Shell />
      <Front />
      <Weights />
      <LeftWall />
      <Clutter />
    </>
  )
})
