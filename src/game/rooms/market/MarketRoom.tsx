import { Environment } from '@react-three/drei'
import { memo, useMemo, type ReactNode } from 'react'
import { BackSide, Object3D } from 'three'
import { Decoy, Item, PI, Variant } from '../../kit'
import type { Vec3 } from './build'
import { City } from './City'
import { ON_WALL } from './cityPlan'
import { Billboard, BarberPole, CafeAwning, Clock, Dish, FireEscape, Flag, PharmacyCross, PubSign, Shutter, WatchWindow } from './Facades'
import { Fountain, FountainChange, StatueChange } from './Fountain'
import { FLOCKS, FOUNTAIN } from './squareParts'
import { BakeryChange, BakeryStall, CheeseChange, CheeseStall, FishChange, FishStall, FlowerChange, FlowerStall } from './NorthStalls'
import { ABoard, Amp, BalloonCart, BuskerStool, CafeTable, CardSign, ClothesRail, CrateStack, Flock, GuitarCase, GuitarOnStand, Mannequin, Pigeon, Planter } from './Odds'
import { AntiquesChange, AntiquesStall, FruitChange, FruitStall, HatChange, HatStall, RecordChange, RecordStall } from './SouthStalls'
import { Barrier, Bench, BentLamp, Bike, Bin, Bollard, Bunting, Lamp, LetterBunting, PhoneBox, PostBox, Tree } from './Street'
import { skyTexture } from './textures'
import { CoffeeCart, DeliveryVan, FoodVan } from './Vehicles'

/*
 * A Sunday street market in a city square, early afternoon.
 *
 * The square runs east-west (x) between building fronts on all four sides.
 * You start at the east end looking west, past the fountain and its statue
 * to the hot dog van at the far end. Two rows of stalls face each other
 * across the middle: fish, cheese, bakery and flowers along the north side
 * (-z), fruit and veg, antiques, records and hats along the south. A street
 * leads off the south side behind a parked van, and an alley off the west
 * end behind crowd barriers. Aisles between stalls are 2 m, the walkway down
 * the middle nearly 6 m, and you can walk all the way round behind each row.
 */

/** Stall centres along each row; the rows face each other across z = 0. */
const ROW_Z = 6.6
const STALL_XS = [-9.1, -4.3, 4.3, 9.1]
/** The bunting lamps, and the rope's length between their hooks. */
const LAMP_X = 6.8
const LAMP_Z = 4.0
const SPAN = LAMP_X * 2 - 0.26

/** One <Variant> per mode, each drawn by `render`. */
function Swaps<M extends string>({ id, modes, render }: { id: string; modes: readonly M[]; render: (mode: M) => ReactNode }) {
  return (
    <>
      {modes.map((m) => (
        <Variant key={m} of={id} name={m}>
          {render(m)}
        </Variant>
      ))}
    </>
  )
}

function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      {/* the sky itself lights and reflects in everything */}
      <Environment resolution={64} environmentIntensity={0.45}>
        <mesh>
          <sphereGeometry args={[50, 32, 16]} />
          <meshBasicMaterial map={skyTexture()} side={BackSide} toneMapped={false} />
        </mesh>
      </Environment>
      <hemisphereLight args={['#d9e9ff', '#a49884', 0.55]} />
      <primitive object={target} position={[0, 0, 0]} />
      {/* the sun, high over the east end, its shadow fitted to the square */}
      <directionalLight
        position={[9, 30, -7]}
        target={target}
        intensity={2.5}
        color="#fff4e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-19}
        shadow-camera-right={19}
        shadow-camera-top={17}
        shadow-camera-bottom={-17}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
    </>
  )
}

function Stalls() {
  const [a, b, c, d] = STALL_XS
  return (
    <>
      <Item id="fish" position={[a, 0, -ROW_Z]}>
        <FishStall />
        <Swaps id="fish" modes={['default', 'catfish', 'stare', 'bones'] as const} render={(m) => <FishChange mode={m} />} />
      </Item>
      <Item id="cheese" position={[b, 0, -ROW_Z]}>
        <CheeseStall />
        <Swaps id="cheese" modes={['default', 'snail', 'tower', 'stripes'] as const} render={(m) => <CheeseChange mode={m} />} />
      </Item>
      <Item id="bakery" position={[c, 0, -ROW_Z]}>
        <BakeryStall />
        <Swaps id="bakery" modes={['default', 'giant', 'halo'] as const} render={(m) => <BakeryChange mode={m} />} />
      </Item>
      <Item id="flowers" position={[d, 0, -ROW_Z]}>
        <FlowerStall />
        <Swaps id="flowers" modes={['default', 'black', 'watch'] as const} render={(m) => <FlowerChange mode={m} />} />
      </Item>

      {/* the south row, turned to face the fountain */}
      <Item id="fruit" position={[a, 0, ROW_Z]} rotation={[0, PI, 0]}>
        <FruitStall />
        <Swaps id="fruit" modes={['default', 'square', 'blue'] as const} render={(m) => <FruitChange mode={m} />} />
      </Item>
      <Item id="antiques" position={[b, 0, ROW_Z]} rotation={[0, PI, 0]}>
        <AntiquesStall />
        <Swaps id="antiques" modes={['default', 'watch', 'horn'] as const} render={(m) => <AntiquesChange mode={m} />} />
      </Item>
      <Item id="records" position={[c, 0, ROW_Z]} rotation={[0, PI, 0]}>
        <RecordStall />
        <Swaps id="records" modes={['default', 'flying', 'melted'] as const} render={(m) => <RecordChange mode={m} />} />
      </Item>
      <Item id="hats" position={[d, 0, ROW_Z]} rotation={[0, PI, 0]}>
        <HatStall />
        <Swaps id="hats" modes={['default', 'floating', 'stacked'] as const} render={(m) => <HatChange mode={m} />} />
      </Item>

      {/* chalkboards out front, and crates */}
      <Item id="fruit-board" position={[-10.15, 0, 4.6]} rotation={[0, PI + 0.3, 0]}>
        <Swaps
          id="fruit-board"
          modes={['default', 'yesterday'] as const}
          render={(m) => <ABoard text={`FRESH ${m === 'default' ? 'TODAY' : 'YESTERDAY'}!\nAPPLES 6 FOR £1\nBANANAS 50p\nMELONS £2 EACH`} />}
        />
      </Item>
      <Item id="cheese-board" position={[-2.55, 0, -4.85]} rotation={[0, -0.35, 0]}>
        <Swaps
          id="cheese-board"
          modes={['default', 'moon'] as const}
          render={(m) => <ABoard text={`CHEESE OF THE DAY\n${m === 'default' ? 'MATURE CHEDDAR' : 'THE MOON'}\nTASTE BEFORE\nYOU BUY`} />}
        />
      </Item>
      <Decoy label="bakery's chalkboard" position={[6.0, 0, -4.9]} rotation={[0, 0.3, 0]} solid>
        <ABoard text={'FRESH BREAD\nSOURDOUGH £4\nDOUGHNUTS 3 FOR £2\nCROISSANTS £1.50'} />
      </Decoy>
      <Decoy label="record stall's chalkboard" position={[2.55, 0, 4.85]} rotation={[0, PI - 0.3, 0]} solid>
        <ABoard text={'VINYL\nALL LPs £5\n3 FOR £12\nBOOKS £1'} />
      </Decoy>
      <Item id="crates" position={[-11.25, 0, 6.9]} rotation={[0, PI, 0]}>
        <Swaps id="crates" modes={['default', 'fallen'] as const} render={(m) => <CrateStack fallen={m === 'fallen'} />} />
      </Item>
      <Decoy label="stack of crates" position={[6.75, 0, -8.7]} rotation={[0, 0.3, 0]} solid>
        <CrateStack />
      </Decoy>
      <Decoy label="stack of crates" position={[-6.75, 0, 8.7]} rotation={[0, -0.2, 0]} solid>
        <CrateStack />
      </Decoy>
    </>
  )
}

function Middle() {
  return (
    <>
      <Item id="fountain" position={[0, 0, 0]}>
        <Fountain />
        <Swaps id="fountain" modes={['default', 'frozen', 'ducks'] as const} render={(m) => <FountainChange mode={m} />} />
      </Item>
      {/* the horse looks east, towards where you come in */}
      <Item id="statue" position={[0, FOUNTAIN.plinthTop, 0]} rotation={[0, PI / 2, 0]}>
        <Swaps id="statue" modes={['default', 'watch', 'duck', 'cat'] as const} render={(m) => <StatueChange mode={m} />} />
      </Item>

      {/* four lamps round the fountain with bunting strung between them along each side */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Decoy key={`${sx}${sz}`} label="lamppost" position={[sx * LAMP_X, 0, sz * LAMP_Z]} rotation={[0, PI / 2, 0]} solid round>
            <Lamp hook basket={sz > 0} />
          </Decoy>
        )),
      )}
      <Item id="bunting" position={[0, 3.55, -LAMP_Z]}>
        <Swaps id="bunting" modes={['default', 'socks', 'upside'] as const} render={(m) => <Bunting span={SPAN} mode={m} />} />
      </Item>
      <Item id="letters" position={[0, 3.55, LAMP_Z]} rotation={[0, PI, 0]}>
        <Swaps
          id="letters"
          modes={['default', 'backwards', 'watching'] as const}
          render={(m) => <LetterBunting span={SPAN} text={m === 'default' ? 'SUNDAY MARKET' : m === 'backwards' ? 'TEKRAM YADNUS' : 'WE SEE YOU'} />}
        />
      </Item>
      <Item id="lamp-east" position={[11.0, 0, 3.6]} rotation={[0, -PI / 2, 0]}>
        <Swaps id="lamp-east" modes={['default', 'bent'] as const} render={(m) => (m === 'bent' ? <BentLamp /> : <Lamp />)} />
      </Item>
      <Item id="lamp-west" position={[-10.8, 0, -4.35]} rotation={[0, PI / 2, 0]}>
        <Swaps id="lamp-west" modes={['default', 'lit'] as const} render={(m) => <Lamp basket lit={m === 'lit'} />} />
      </Item>

      {/* benches either side of the fountain, facing it */}
      <Item id="bench" position={[-3.7, 0, 0]} rotation={[0, PI / 2, 0]}>
        <Swaps id="bench" modes={['default', 'melted'] as const} render={(m) => <Bench melted={m === 'melted'} />} />
      </Item>
      <Decoy label="bench" position={[3.7, 0, 0]} rotation={[0, -PI / 2, 0]} solid>
        <Bench />
      </Decoy>
      <Item id="bin" position={[3.75, 0, 1.45]}>
        <Swaps id="bin" modes={['default', 'overflow', 'eyes'] as const} render={(m) => <Bin mode={m} />} />
      </Item>
      <Decoy label="litter bin" position={[-3.75, 0, -1.45]} rotation={[0, PI, 0]} solid round>
        <Bin />
      </Decoy>

      {/* the busker's pitch, between the fountain and the records */}
      <Item id="case" position={[4.75, 0, 2.15]} rotation={[0, PI / 2, 0]}>
        <Swaps id="case" modes={['default', 'buttons', 'pigeon'] as const} render={(m) => <GuitarCase mode={m} />} />
      </Item>
      <Item id="guitar" position={[5.05, 0, 3.15]} rotation={[0, -PI / 2 + 0.3, 0]}>
        <GuitarOnStand />
      </Item>
      <Decoy label="amp" position={[5.95, 0, 2.2]} rotation={[0, -PI / 2, 0]} solid>
        <Amp />
      </Decoy>
      <Decoy label="busker's stool" position={[5.55, 0, 2.75]} solid round>
        <BuskerStool />
      </Decoy>
      <Item id="busker-sign" position={[5.6, 0, 1.42]} rotation={[0, -PI / 2 - 0.3, 0]}>
        <Swaps
          id="busker-sign"
          modes={['default', 'stop'] as const}
          render={(m) => <CardSign text={m === 'default' ? 'SPARE A SONG?\nTHANK YOU :)' : 'PLEASE STOP\nLISTENING'} />}
        />
      </Item>

      {/* pigeons, and the one that changes */}
      {FLOCKS.map((f, i) => (
        <Decoy key={i} label="pigeons" position={f.at}>
          <Flock index={i} />
        </Decoy>
      ))}
      <Item id="pigeon" position={[2.3, 0, -2.65]} rotation={[0, 2.2, 0]}>
        <Swaps id="pigeon" modes={['default', 'hat'] as const} render={(m) => <Pigeon hat={m === 'hat'} />} />
      </Item>

      <Item id="balloons" position={[-5.0, 0, -2.6]} rotation={[0, 0.4, 0]}>
        <Swaps id="balloons" modes={['default', 'sinking', 'huge'] as const} render={(m) => <BalloonCart mode={m} />} />
      </Item>
      <Item id="tree" position={[11.3, 0, -2.5]}>
        <Swaps id="tree" modes={['default', 'autumn', 'bare'] as const} render={(m) => <Tree crown={m === 'default' ? 'summer' : m} />} />
      </Item>
      <Decoy label="planter" position={[-7.4, 0, 1.4]} solid>
        <Planter />
      </Decoy>
    </>
  )
}

function Ends() {
  return (
    <>
      {/* west end: the hot dog van, its hatch to the square, and its menu */}
      <Item id="food-van" position={[-12.5, 0, 0]}>
        <Swaps id="food-van" modes={['default', 'queue', 'shut'] as const} render={(m) => <FoodVan mode={m} />} />
      </Item>
      <Item id="menu" position={[-10.85, 0, -2.4]} rotation={[0, PI / 2 - 0.3, 0]}>
        <Swaps
          id="menu"
          modes={['default', 'tomorrow'] as const}
          render={(m) => <ABoard text={`HOT DOGS £5\nCHIPS £3\nTEA £2\n${m === 'default' ? 'CAN OF POP £1' : 'TOMORROW £9'}`} />}
        />
      </Item>
      {/* the alley beside it, fenced off */}
      <Decoy label="crowd barrier" position={[-13.72, 0, 4.48]} rotation={[0, PI / 2, 0]} solid>
        <Barrier />
      </Decoy>

      {/* east end: the coffee cart, a red phone box and a pillar box in the corner, clothes on the other side */}
      <Item id="coffee" position={[12.9, 0, -6.4]} rotation={[0, PI, 0]}>
        <Swaps id="coffee" modes={['default', 'steam', 'cups'] as const} render={(m) => <CoffeeCart mode={m} />} />
      </Item>
      <Decoy label="coffee cart's chalkboard" position={[11.0, 0, -5.38]} rotation={[0, -PI / 2 + 0.4, 0]} solid>
        <ABoard text={'COFFEE\nFLAT WHITE £3\nTEA £2\nCAKE £2.50'} />
      </Decoy>
      <Item id="phone-box" position={[12.75, 0, -9.95]}>
        <Swaps id="phone-box" modes={['default', 'figure'] as const} render={(m) => <PhoneBox inside={m === 'figure'} />} />
      </Item>
      <Item id="post-box" position={[10.95, 0, -10.35]}>
        <Swaps id="post-box" modes={['default', 'letters'] as const} render={(m) => <PostBox letters={m === 'letters'} />} />
      </Item>
      <Item id="rail" position={[12.1, 0, 7.25]} rotation={[0, PI / 2, 0]}>
        <Swaps id="rail" modes={['default', 'empty', 'invisible'] as const} render={(m) => <ClothesRail mode={m} />} />
      </Item>
      <Item id="mannequin" position={[12.35, 0, 4.9]} rotation={[0, -PI / 2, 0]}>
        <Swaps id="mannequin" modes={['default', 'watch', 'wave'] as const} render={(m) => <Mannequin mode={m} />} />
      </Item>

      {/* south side: the van parked across the street, bollards either side, a bike on a stand */}
      <Item id="van" position={[0, 0, 9.75]}>
        <Swaps id="van" modes={['default', 'ajar'] as const} render={(m) => <DeliveryVan ajar={m === 'ajar'} />} />
      </Item>
      {[-3.25, 3.25].map((x) => (
        <Decoy key={x} label="bollard" position={[x, 0, 10.35]} solid round>
          <Bollard />
        </Decoy>
      ))}
      <Item id="bike" position={[6.7, 0, 9.75]}>
        <Swaps id="bike" modes={['default', 'wheel', 'penny'] as const} render={(m) => <Bike mode={m} />} />
      </Item>

      {/* north side: café tables under the café's awning */}
      <Item id="cafe-table" position={[2.6, 0, -9.45]}>
        <Swaps id="cafe-table" modes={['default', 'stacked', 'cup'] as const} render={(m) => <CafeTable mode={m} />} />
      </Item>
      {[-1.7, 0.45].map((x) => (
        <Decoy key={x} label="café table" position={[x, 0, -9.45]} solid>
          <CafeTable />
        </Decoy>
      ))}
    </>
  )
}

/** Something hung on a building, at its spot from cityPlan. */
function OnWall({ at, children }: { at: { at: Vec3; turn: number }; children: ReactNode }) {
  return (
    <group position={at.at} rotation={[0, at.turn, 0]}>
      {children}
    </group>
  )
}

function Walls() {
  return (
    <>
      <OnWall at={ON_WALL.clock}>
        <Item id="clock" position={[0, 0, 0]}>
          <Swaps id="clock" modes={['default', 'thirteen', 'backwards', 'melted'] as const} render={(m) => <Clock mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.billboard}>
        <Item id="billboard" position={[0, 0, 0]}>
          <Swaps id="billboard" modes={['default', 'eyes', 'text'] as const} render={(m) => <Billboard mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.fireEscape}>
        <Item id="fire-escape" position={[0, 0, 0]}>
          <Swaps id="fire-escape" modes={['default', 'ladder', 'washing'] as const} render={(m) => <FireEscape mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.window}>
        <Item id="window" position={[0, 0, 0]}>
          <Swaps id="window" modes={['default', 'figure', 'drawn'] as const} render={(m) => <WatchWindow mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.shutter}>
        <Item id="shutter" position={[0, 0, 0]}>
          <Swaps id="shutter" modes={['default', 'open', 'eye'] as const} render={(m) => <Shutter mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.cafe}>
        <Item id="cafe-awning" position={[0, 0, 0]}>
          <Swaps id="cafe-awning" modes={['default', 'rolled'] as const} render={(m) => <CafeAwning mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.flag}>
        <Item id="flag" position={[0, 0, 0]}>
          <Swaps id="flag" modes={['default', 'pirate', 'halfmast'] as const} render={(m) => <Flag mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.dish}>
        <Item id="dish" position={[0, 0, 0]}>
          <Swaps id="dish" modes={['default', 'watch'] as const} render={(m) => <Dish mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.pubSign}>
        <Item id="pub-sign" position={[0, 0, 0]}>
          <Swaps id="pub-sign" modes={['default', 'headless'] as const} render={(m) => <PubSign mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.pharmacy}>
        <Item id="pharmacy" position={[0, 0, 0]}>
          <Swaps id="pharmacy" modes={['default', 'heart'] as const} render={(m) => <PharmacyCross mode={m} />} />
        </Item>
      </OnWall>
      <OnWall at={ON_WALL.barberPole}>
        <Item id="barber-pole" position={[0, 0, 0]}>
          <BarberPole />
        </Item>
      </OnWall>
    </>
  )
}

export const MarketRoom = memo(function MarketRoom() {
  return (
    <>
      <Lights />
      <City />
      <Stalls />
      <Middle />
      <Ends />
      <Walls />
    </>
  )
})
