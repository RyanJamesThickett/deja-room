import { Environment } from '@react-three/drei'
import { memo, useMemo } from 'react'
import { CylinderGeometry, MeshStandardMaterial, Object3D, SphereGeometry, TorusGeometry } from 'three'
import { useSurface } from '../../assets'
import { Block, Decoy, Item, PI, Variant, Wallpaper } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { MeltedClock } from '../living/oddities'
import { wallGeometry } from '../../outsideLayers'
import { SHOP_BOUNDS as B } from './bounds'
import { DOOR_ALONG, SHOP_DOOR, SHOP_WINDOW, STREET_SPLIT } from './front'
import {
  CerealBoxes,
  Counter,
  Doormat,
  DuckStock,
  Fridge,
  GumballMachine,
  Jars,
  LuckyCat,
  NeonSign,
  PopBottles,
  SecurityCamera,
  Shelving,
  ShopDoor,
  ShopWindow,
  Stool,
  StripLights,
  Tins,
} from './parts'
import { closeTillDrawer, openTillDrawer } from './poses'
import { AISLE_UNIT, WALL_BAY } from './shelving'
import {
  BreadRack,
  CardReader,
  ChestFreezer,
  CrispPackets,
  Detergent,
  LooRolls,
  MagazineRack,
  PaperStand,
  StaffDoor,
  VegStand,
  WetFloorSign,
} from './stock'
import { useCheckerTexture } from './textures'

/*
 * A corner shop at night, laid out like a real British one.
 *
 * Front wall (+z): the big window with the ice cream freezer and the fruit
 * and veg under it, the newspapers and gumball machine by the door, and the
 * door itself. The counter runs back along the right wall from the front, so
 * whoever comes in has it on their right; the cashier stands behind it facing
 * across the shop with the door in view, the till's keypad and drawer on
 * their side, and gets in and out by the gap at the far end, next to the
 * staff door. Down the middle, four aisles run front to back; the drinks
 * fridges and the bread are along the back wall; tins and magazines line the
 * left wall and loo roll the right.
 *
 * Every piece of furniture blocks the player and can be clicked, changeable
 * or not, so neither walking through it nor clicking it gives away that it
 * can't be the answer.
 */

const WALL = '#d3eadc'
const AISLE = { ...AISLE_UNIT, width: 2.6 }
const SHORT_AISLE = { ...AISLE_UNIT, width: 2.0 }
const LOO_BAY = { ...WALL_BAY, width: 2.2 }
const FRIDGE_XS = [-3.6, -2.35, -1.1]
const COUNTER = { x: B.halfX - 1.175, z: 2.3, length: 2.6 }
const BIN_BODY = new CylinderGeometry(0.19, 0.17, 0.6, 32)
const BIN_FOOT = new CylinderGeometry(0.175, 0.18, 0.05, 32)
const BIN_RIM = new TorusGeometry(0.19, 0.014, 10, 40)
const BIN_LID = new SphereGeometry(0.196, 32, 12, 0, PI * 2, 0, PI / 2)
const BIN_STEEL = new MeshStandardMaterial({ color: '#3b4148', metalness: 0.6, roughness: 0.4 })
const BIN_DARK = new MeshStandardMaterial({ color: '#2a2f35', metalness: 0.6, roughness: 0.35 })
/** Which crisp shelf each swap changes. */
const CRISP_SHELF = { normal: [], puffed: [3], float: [2] }

function Shell() {
  const { halfX, halfZ, height } = B
  const w = halfX * 2
  const d = halfZ * 2
  const floor = useCheckerTexture(w, d)
  const plasterLong = useSurface('painted_plaster_wall', w / 2, height / 2)
  const plasterShort = useSurface('painted_plaster_wall', d / 2, height / 2)
  // the front wall (turned round, so its x runs the other way) is cut through where the window and the door's glass are
  const front = useMemo(() => {
    const { glass } = SHOP_DOOR
    return wallGeometry(w, height, [
      { x0: -SHOP_WINDOW.x - SHOP_WINDOW.width / 2, x1: -SHOP_WINDOW.x + SHOP_WINDOW.width / 2, y0: SHOP_WINDOW.y - SHOP_WINDOW.height / 2 - height / 2, y1: SHOP_WINDOW.y + SHOP_WINDOW.height / 2 - height / 2 },
      { x0: -SHOP_DOOR.x - glass.width / 2, x1: -SHOP_DOOR.x + glass.width / 2, y0: glass.y0 - height / 2, y1: glass.y1 - height / 2 },
    ])
  }, [w, height])
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
        <meshStandardMaterial map={floor} roughness={0.35} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#f1f1ec" roughness={0.9} />
      </mesh>
      {walls.map(({ width, at, rot, long }, i) => (
        <mesh key={i} position={at} rotation={rot} receiveShadow>
          {i === 1 ? <primitive object={front} attach="geometry" /> : <planeGeometry args={[width, height]} />}
          <meshStandardMaterial color={WALL} {...(long ? plasterLong : plasterShort)} />
        </mesh>
      ))}
      {[
        { size: [w, 0.12, 0.02] as Vec3, at: [0, 0.06, -halfZ + 0.01] as Vec3 },
        { size: [w, 0.12, 0.02] as Vec3, at: [0, 0.06, halfZ - 0.01] as Vec3 },
        { size: [0.02, 0.12, d] as Vec3, at: [-halfX + 0.01, 0.06, 0] as Vec3 },
        { size: [0.02, 0.12, d] as Vec3, at: [halfX - 0.01, 0.06, 0] as Vec3 },
      ].map(({ size, at }, i) => (
        <Block key={i} size={size} position={at} color="#1d6b63" roughness={0.5} radius={0.004} />
      ))}

      {/* the front window onto the street */}
      <group position={[SHOP_WINDOW.x, SHOP_WINDOW.y, halfZ]} rotation={[0, PI, 0]}>
        <ShopWindow width={SHOP_WINDOW.width} height={SHOP_WINDOW.height} y={SHOP_WINDOW.y} from={STREET_SPLIT} />
      </group>

      {/* fizzy pop aisle and the cleaning aisle: stocked, solid, never change */}
      <Decoy label="shelf of fizzy drinks" position={[0.8, 0, -0.5]} rotation={[0, PI / 2, 0]} solid>
        <Shelving spec={AISLE} />
        <PopBottles spec={AISLE} />
        <PopBottles spec={AISLE} face={-1} />
      </Decoy>
      <Decoy label="shelf of cleaning products" position={[2.6, 0, -1.0]} rotation={[0, PI / 2, 0]} solid>
        <Shelving spec={SHORT_AISLE} />
        <Detergent spec={SHORT_AISLE} />
        <Detergent spec={SHORT_AISLE} face={-1} />
      </Decoy>

      {/* bread along the back wall, next to the fridges */}
      <Decoy label="bread rack" position={[0.35, 0, -halfZ + 0.25]} solid>
        <BreadRack />
      </Decoy>

      {/* behind the counter: the cashier's stool, and the shelf the jars sit on */}
      <Decoy label="stool" position={[halfX - 0.45, 0, COUNTER.z + 0.3]} solid>
        <Stool />
      </Decoy>
      <Block size={[0.26, 0.03, 1.4]} position={[halfX - 0.14, 1.45, COUNTER.z]} color="#f2efe8" roughness={0.4} radius={0.005} />
      {/* on two brackets screwed to the wall */}
      {[-0.55, 0.55].map((dz) => (
        <group key={dz} position={[halfX, 0, COUNTER.z + dz]}>
          <Block size={[0.018, 0.17, 0.025]} position={[-0.009, 1.35, 0]} color="#c9ced6" metalness={0.8} roughness={0.3} radius={0.004} />
          <Block size={[0.22, 0.018, 0.025]} position={[-0.12, 1.426, 0]} color="#c9ced6" metalness={0.8} roughness={0.3} radius={0.004} />
          <Block size={[0.2, 0.016, 0.02]} position={[-0.1, 1.355, 0]} rotation={[0, 0, -0.66]} color="#c9ced6" metalness={0.8} roughness={0.3} radius={0.004} />
        </group>
      ))}
      {/* card machine on the customer's side of the counter */}
      <Decoy label="card machine" position={[COUNTER.x - 0.17, 0.95, COUNTER.z + 0.35]} rotation={[0, -PI / 2, 0]}>
        <CardReader />
      </Decoy>
    </group>
  )
}

function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      <Environment files="/hdri/lythwood_lounge.hdr" environmentIntensity={0.4} />
      <hemisphereLight args={['#f4fff8', '#4a504a', 0.6]} />
      <primitive object={target} position={[0, 0, 0]} />
      <spotLight
        position={[0, B.height - 0.1, 0]}
        target={target}
        angle={1.3}
        penumbra={1}
        intensity={6}
        decay={1.4}
        color="#f2fbff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
      />
    </>
  )
}

function Front() {
  const { halfX, halfZ, height } = B
  return (
    <>
      {/* tubes run front to back, one over each pair of aisles */}
      <Item id="lights" position={[0, 0, 0]} rotation={[0, PI / 2, 0]}>
        {(['normal', 'flicker', 'green'] as const).map((mode) => (
          <Variant key={mode} of="lights" name={mode === 'normal' ? 'default' : mode}>
            <StripLights mode={mode} zs={[-3.3, -1.1, 1.1, 3.3]} height={height} length={6.6} />
          </Variant>
        ))}
      </Item>

      <Item id="door" position={[SHOP_DOOR.x, 0, halfZ]} rotation={[0, PI, 0]}>
        <Variant of="door" name="default">
          <ShopDoor watcher={false} along={DOOR_ALONG} to={STREET_SPLIT} />
        </Variant>
        <Variant of="door" name="watcher">
          <ShopDoor watcher along={DOOR_ALONG} to={STREET_SPLIT} />
        </Variant>
      </Item>

      <Item id="mat" position={[1.6, 0, halfZ - 0.45]}>
        <Variant of="mat" name="default">
          <Doormat text="WELCOME" />
        </Variant>
        <Variant of="mat" name="goaway">
          <Doormat text="GO AWAY" />
        </Variant>
      </Item>

      {/* turned to face the shop, so its coin slot and its contents look at the customers */}
      <Item id="gumball" position={[0.6, 0, halfZ - 0.35]} rotation={[0, PI, 0]}>
        {(['gum', 'eyes', 'empty'] as const).map((f) => (
          <Variant key={f} of="gumball" name={f === 'gum' ? 'default' : f}>
            <GumballMachine fill={f} />
          </Variant>
        ))}
      </Item>

      <Item id="papers" position={[-0.25, 0, halfZ - 0.3]} rotation={[0, PI, 0]}>
        {(['normal', 'weird', 'blank'] as const).map((m) => (
          <Variant key={m} of="papers" name={m === 'normal' ? 'default' : m}>
            <PaperStand mode={m} />
          </Variant>
        ))}
      </Item>

      {/* under the window: fruit and veg, and the ice cream freezer */}
      <Item id="veg" position={[-1.75, 0, halfZ - 0.6]} rotation={[0, PI, 0]}>
        {(['normal', 'faces', 'cubes'] as const).map((f) => (
          <Variant key={f} of="veg" name={f === 'normal' ? 'default' : f}>
            <VegStand fruit={f} />
          </Variant>
        ))}
      </Item>

      {/* far enough off the wall to clear the window sill */}
      <Item id="freezer" position={[-3.3, 0, halfZ - 0.47]} rotation={[0, PI, 0]}>
        {(['lollies', 'fish', 'snowman'] as const).map((c) => (
          <Variant key={c} of="freezer" name={c === 'lollies' ? 'default' : c}>
            <ChestFreezer contents={c} />
          </Variant>
        ))}
      </Item>

      {/* --- the counter: customer side faces the shop (-x), cashier's side the wall --- */}
      <Item id="counter" position={[COUNTER.x, 0, COUNTER.z]} rotation={[0, -PI / 2, 0]}>
        <Counter length={COUNTER.length} />
      </Item>

      {/* at the door end, keypad and drawer towards the cashier */}
      <Item id="register" position={[COUNTER.x + 0.05, 0.95, COUNTER.z + 0.75]} rotation={[0, PI / 2, 0]}>
        <Variant of="register" name="default">
          <Model id="CashRegister_01" adjust={closeTillDrawer} />
        </Variant>
        <Variant of="register" name="open">
          <Model id="CashRegister_01" adjust={openTillDrawer} />
        </Variant>
      </Item>

      {/* lucky cat waving at customers from the far end */}
      <Item id="cat" position={[COUNTER.x - 0.1, 0.95, COUNTER.z - 0.85]} rotation={[0, -PI / 2, 0]}>
        <Variant of="cat" name="default">
          <LuckyCat />
        </Variant>
        <Variant of="cat" name="other">
          <LuckyCat mirrored />
        </Variant>
        <Variant of="cat" name="stare">
          <LuckyCat staring />
        </Variant>
        <Variant of="cat" name="pair">
          <group position={[-0.13, 0, 0]}>
            <LuckyCat />
          </group>
          <group position={[0.13, 0, 0]}>
            <LuckyCat mirrored />
          </group>
        </Variant>
      </Item>

      <Item id="jars" position={[halfX - 0.14, 1.465, COUNTER.z]} rotation={[0, -PI / 2, 0]}>
        {(['pickles', 'eyes', 'glow'] as const).map((c) => (
          <Variant key={c} of="jars" name={c === 'pickles' ? 'default' : c}>
            <Jars contents={c} />
          </Variant>
        ))}
      </Item>

      <Item id="neon" position={[halfX, 2.25, COUNTER.z]} rotation={[0, -PI / 2, 0]}>
        <Variant of="neon" name="default">
          <NeonSign text="Open 25 hrs" colour="#ff3fa4" />
        </Variant>
        <Variant of="neon" name="never">
          <NeonSign text="Open never" colour="#ff3fa4" />
        </Variant>
        <Variant of="neon" name="closed">
          <NeonSign text="Closed" colour="#ff3131" />
        </Variant>
      </Item>

      {/* in the ceiling corner over the till, watching the shop floor */}
      <Item id="cctv" position={[halfX - 0.3, height - 0.25, halfZ - 0.3]}>
        <Variant of="cctv" name="default">
          <SecurityCamera />
        </Variant>
        <Variant of="cctv" name="away">
          <SecurityCamera away />
        </Variant>
        <Variant of="cctv" name="pair">
          <SecurityCamera />
          {/* and another in the far corner */}
          <group position={[-(halfX * 2 - 0.6), 0, -(halfZ * 2 - 0.6)]}>
            <SecurityCamera />
          </group>
        </Variant>
      </Item>

      {/* the cashier's way out the back, past the end of the counter */}
      <Item id="staffdoor" position={[halfX, 0, 0.35]} rotation={[0, -PI / 2, 0]}>
        <Variant of="staffdoor" name="default">
          <StaffDoor ajar={false} />
        </Variant>
        <Variant of="staffdoor" name="ajar">
          <StaffDoor ajar />
        </Variant>
      </Item>
    </>
  )
}

function Floor() {
  const { halfX, halfZ } = B
  return (
    <>
      {/* left wall: tins, magazines and the clock */}
      <Item id="shelf-tins" position={[-halfX + WALL_BAY.depth / 2, 0, -1.2]} rotation={[0, PI / 2, 0]}>
        <Shelving spec={WALL_BAY} />
        <Variant of="shelf-tins" name="default">
          <Tins spec={WALL_BAY} />
        </Variant>
        {/* one shelf of ducks among the tins, or one shelf cleared */}
        <Variant of="shelf-tins" name="ducks">
          <Tins spec={WALL_BAY} skip={[2]} />
          <DuckStock spec={WALL_BAY} only={[2]} />
        </Variant>
        <Variant of="shelf-tins" name="empty">
          <Tins spec={WALL_BAY} skip={[3]} />
        </Variant>
      </Item>

      <Item id="mags" position={[-halfX, 0, 1.6]} rotation={[0, PI / 2, 0]}>
        {(['normal', 'eyes', 'sideways'] as const).map((m) => (
          <Variant key={m} of="mags" name={m === 'normal' ? 'default' : m}>
            <MagazineRack mode={m} />
          </Variant>
        ))}
      </Item>

      <Item id="clock" position={[-halfX, 2.35, -1.2]} rotation={[0, PI / 2, 0]}>
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

      {/* the aisles, left to right: cereal, crisps (then the two static ones in Shell) */}
      <Item id="shelf-cereal" position={[-2.6, 0, -0.5]} rotation={[0, PI / 2, 0]}>
        <Shelving spec={AISLE} />
        <Variant of="shelf-cereal" name="default">
          <CerealBoxes spec={AISLE} />
          <CerealBoxes spec={AISLE} face={-1} />
        </Variant>
        {/* the swaps change one shelf, on both sides of the aisle */}
        <Variant of="shelf-cereal" name="upside">
          <CerealBoxes spec={AISLE} upside levels={[2]} />
          <CerealBoxes spec={AISLE} face={-1} upside levels={[2]} />
        </Variant>
        <Variant of="shelf-cereal" name="tiny">
          <CerealBoxes spec={AISLE} tiny levels={[1]} />
          <CerealBoxes spec={AISLE} face={-1} tiny levels={[1]} />
        </Variant>
      </Item>

      <Item id="shelf-crisps" position={[-0.9, 0, -0.5]} rotation={[0, PI / 2, 0]}>
        <Shelving spec={AISLE} />
        {(['normal', 'puffed', 'float'] as const).map((m) => (
          <Variant key={m} of="shelf-crisps" name={m === 'normal' ? 'default' : m}>
            <CrispPackets spec={AISLE} mode={m} levels={CRISP_SHELF[m]} />
            <CrispPackets spec={AISLE} face={-1} mode={m} levels={CRISP_SHELF[m]} />
          </Variant>
        ))}
      </Item>

      {/* right wall, past the staff door: loo roll */}
      <Item id="loo" position={[halfX - LOO_BAY.depth / 2, 0, -1.6]} rotation={[0, -PI / 2, 0]}>
        <Shelving spec={LOO_BAY} />
        <LooRolls spec={LOO_BAY} />
      </Item>

      {/* --- back wall: a run of drinks fridges, the delivery boxes, a wet floor --- */}
      <Item id="fridge" position={[0, 0, -halfZ + 0.37]}>
        {(['drinks', 'empty', 'eye'] as const).map((c) => (
          <Variant key={c} of="fridge" name={c === 'drinks' ? 'default' : c}>
            {FRIDGE_XS.map((x, i) => (
              <group key={x} position={[x, 0, 0]}>
                {/* each swap touches one fridge: the left one empties, the middle one stares */}
                <Fridge
                  kind={(['fizzy', 'water', 'dairy'] as const)[i]}
                  contents={c === 'empty' ? (i === 0 ? 'empty' : 'drinks') : c === 'eye' ? (i === 1 ? 'eye' : 'drinks') : c}
                />
              </group>
            ))}
          </Variant>
        ))}
      </Item>

      <Item id="wet-sign" position={[1.7, 0, -2.45]} rotation={[0, 0.5, 0]}>
        <Variant of="wet-sign" name="default">
          <WetFloorSign lines={['CAUTION', 'WET', 'FLOOR']} />
        </Variant>
        <Variant of="wet-sign" name="ceiling">
          <WetFloorSign lines={['CAUTION', 'WET', 'CEILING']} />
        </Variant>
      </Item>

      <Item id="boxes" position={[halfX - 0.6, 0, -halfZ + 0.5]}>
        <Model id="cardboard_box_01" />
        <Model id="cardboard_box_01" position={[0, 0.342, 0]} rotation={[0, 0.2, 0]} />
        <Variant of="boxes" name="default">
          <Model id="cardboard_box_01" position={[0, 0.684, 0]} rotation={[0, -0.15, 0]} />
        </Variant>
        <Variant of="boxes" name="fallen">
          <Model id="cardboard_box_01" position={[-0.55, 0, 0.45]} rotation={[0, 0.8, 0]} />
        </Variant>
      </Item>
    </>
  )
}

/** Red herrings: odds and ends that never change. */
function Clutter() {
  const { halfX, halfZ } = B
  return (
    <>
      {/* candy-striped paper behind the counter, so the jars and the neon have to compete with it */}
      <Wallpaper kind="stripes" width={halfZ - 1.0} height={B.height - 0.12} position={[halfX, 0.12 + (B.height - 0.12) / 2, (halfZ + 1.0) / 2]} rotation={[0, -PI / 2, 0]} />
      {/* a bin just inside the door */}
      {/* a pedal bin: foot band, body, rolled rim, domed lid with a hinge at the back */}
      <Decoy label="bin" position={[2.45, 0, halfZ - 0.3]} rotation={[0, PI, 0]} solid>
        <mesh geometry={BIN_FOOT} material={BIN_DARK} position={[0, 0.025, 0]} receiveShadow />
        <mesh geometry={BIN_BODY} material={BIN_STEEL} position={[0, 0.33, 0]} castShadow receiveShadow />
        <mesh geometry={BIN_RIM} material={BIN_DARK} position={[0, 0.63, 0]} rotation={[PI / 2, 0, 0]} />
        <mesh geometry={BIN_LID} material={BIN_STEEL} position={[0, 0.635, 0]} scale={[1, 0.32, 1]} castShadow />
        <Block size={[0.08, 0.03, 0.03]} position={[0, 0.635, -0.195]} color="#2a2f35" metalness={0.6} roughness={0.35} radius={0.008} />
        <Block size={[0.12, 0.022, 0.09]} position={[0, 0.03, 0.2]} rotation={[0.18, 0, 0]} color="#2a2f35" metalness={0.6} roughness={0.35} radius={0.008} />
      </Decoy>
      <Decoy label="fire extinguisher" position={[halfX - 0.165, 0, -0.3]} rotation={[0, -PI / 2, 0]} solid>
        <Model id="korean_fire_extinguisher_01" />
      </Decoy>
      {/* a delivery that never gets unpacked: looks just like the boxes that can change */}
      <Decoy label="stack of boxes" position={[1.4, 0, -halfZ + 0.35]} solid>
        <Model id="cardboard_box_01" rotation={[0, 0.4, 0]} />
        <Model id="cardboard_box_01" position={[0, 0.342, 0]} rotation={[0, 0.1, 0]} />
      </Decoy>
      {/* broom by the magazines: foot out on the floor, top resting back against the wall */}
      <Decoy label="broom" position={[-halfX + 0.26, 0, 2.62]} rotation={[0, 0, 0.12]} solid>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 1.3, 12]} />
          <meshStandardMaterial color="#c98a4b" roughness={0.6} />
        </mesh>
        <Block size={[0.06, 0.07, 0.3]} position={[0, 0.06, 0]} color="#2f6bd8" roughness={0.6} radius={0.01} />
        <Block size={[0.07, 0.05, 0.28]} position={[0, 0.015, 0]} color="#1c1c1f" roughness={0.9} radius={0.01} />
      </Decoy>
    </>
  )
}

export const ShopRoom = memo(function ShopRoom() {
  return (
    <>
      <Lights />
      <Shell />
      <Front />
      <Floor />
      <Clutter />
    </>
  )
})
