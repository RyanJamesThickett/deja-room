import { memo, type ReactNode } from 'react'
import { Decoy, Item, PI, Variant } from '../../kit'
import {
  Balloon,
  Bench,
  Bin,
  Cat,
  Cctv,
  CleanerCart,
  Flock,
  LampStandard,
  Piano,
  PianoStool,
  Pigeon,
  Rucksack,
  Scooter,
  SEAT_Y,
  Speaker,
  Statue,
  Suitcase,
  Tree,
  Trolley,
  Umbrella,
  WetFloor,
} from './Concourse'
import { Atm, HelpPoint, InfoDesk, LostProperty, MapBoard, Poster, TakeawayCup, TicketMachines, TicketOffice } from './Counters'
import { Banner, Entrance, ExitSign, FanWindow, StationClock } from './Entrance'
import { Hall, Lights } from './Hall'
import { gloss, matte, POP } from './parts'
import { BEAM, DESK, FLOCKS, GATES, HALL, LAMPS, roofY, TRACKS } from './plan'
import { BufferStop, DeparturesBoard, Gates, PlatformSigns, SteamTrain, Train } from './Platforms'
import { Box, Cyl } from './Prims'
import { ABoard, CoffeeKiosk, Flowers, Lockers, Newsagent, PhotoBooth, Vending, WallSign } from './Shops'

/*
 * Central station, early on a winter evening.
 *
 * A grand concourse under a glass barrel vault, running north-south. You
 * start just inside the main doors at the south end, looking north up the
 * concourse past the hanging clock to the departures board, which sits on
 * a red girder over the line of ticket barriers; beyond them, under the
 * platform canopy, the 18:12 to Brighton waits at platform 2. Shops and
 * machines line the west wall (left-luggage lockers, a coffee kiosk, the
 * newsagent, a photo booth, a snack machine, flowers), tickets and lost
 * property the east (the map, the ticket office, ticket machines, lost
 * property, a cash machine). Out on the floor: a Christmas tree, a public
 * piano, the information desk, a statue of a commuter, benches facing the
 * board, trolleys, luggage, pigeons and four lamp standards.
 */

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

/** Wall-hung things face into the hall from each wall. */
const WEST = [0, PI / 2, 0] as [number, number, number]
const EAST = [0, -PI / 2, 0] as [number, number, number]
const SOUTH = [0, PI, 0] as [number, number, number]
const { halfX, halfZ } = HALL
const ON_WEST = -halfX + 0.02
const ON_EAST = halfX - 0.02
const ON_SOUTH = halfZ - 0.02

function NorthEnd() {
  return (
    <>
      <Item id="gates" position={[0, 0, GATES.z]}>
        <Swaps id="gates" modes={['default', 'open', 'red', 'tape'] as const} render={(m) => <Gates mode={m} />} />
      </Item>
      <Item id="departures" position={[0, BEAM.y1 + 1.55, -halfZ + 0.16]}>
        <Swaps id="departures" modes={['default', 'atlantis', 'delayed', 'arrivals'] as const} render={(m) => <DeparturesBoard mode={m} />} />
      </Item>
      <Item id="platform-signs" position={[0, 4.2, -halfZ + 0.25]}>
        <Swaps
          id="platform-signs"
          modes={['default', 'swapped', 'thirteen'] as const}
          render={(m) => <PlatformSigns numbers={m === 'swapped' ? ['1', '3', '2', '4'] : m === 'thirteen' ? ['1', '2', '3', '13'] : ['1', '2', '3', '4']} />}
        />
      </Item>
      {/* the 18:12 at platform 2, and the 18:20 further back at platform 4 */}
      <Item id="train" position={[TRACKS[1], 0, -13]}>
        <Swaps
          id="train"
          modes={['default', 'gone', 'faces', 'steam'] as const}
          render={(m) => (m === 'gone' ? null : m === 'steam' ? <SteamTrain /> : <Train faces={m === 'faces'} />)}
        />
      </Item>
      <Decoy label="train at platform 4" position={[TRACKS[3], 0, -24]}>
        <Train body={POP.red} destination="MANCHESTER" />
      </Decoy>
      {TRACKS.map((x) => (
        <group key={x} position={[x, 0, -12.3]}>
          <BufferStop />
        </group>
      ))}
    </>
  )
}

function WestWall() {
  return (
    <>
      <Item id="lockers" position={[ON_WEST + 0.28, 0, -8.5]} rotation={WEST}>
        <Swaps id="lockers" modes={['default', 'open', 'glow'] as const} render={(m) => <Lockers mode={m} />} />
      </Item>
      <Item id="toilet-sign" position={[ON_WEST, 3.0, -7.0]} rotation={WEST}>
        <Swaps
          id="toilet-sign"
          modes={['default', 'arrow'] as const}
          render={(m) => <WallSign text={m === 'default' ? 'TOILETS ➜' : '⬅ TOILETS'} bg="#1f6bff" fg="#ffffff" w={1.4} h={0.4} />}
        />
      </Item>
      <Item id="coffee" position={[ON_WEST + 1.1, 0, -4.4]} rotation={WEST}>
        <Swaps id="coffee" modes={['default', 'cup', 'queue', 'shut'] as const} render={(m) => <CoffeeKiosk mode={m} />} />
      </Item>
      <Item id="coffee-board" position={[-12.0, 0, -2.3]} rotation={[0, PI / 2 - 0.35, 0]}>
        <Swaps
          id="coffee-board"
          modes={['default', 'price'] as const}
          render={(m) => <ABoard text={`COFFEE\nFLAT WHITE ${m === 'default' ? '£3.20' : '£30.00'}\nLATTE £3.40\nHOT CHOC £3\nTEA £2.10`} />}
        />
      </Item>
      <Item id="newsagent" position={[ON_WEST + 0.95, 0, 1.2]} rotation={WEST}>
        <Swaps id="newsagent" modes={['default', 'headline', 'blank', 'sweets'] as const} render={(m) => <Newsagent mode={m} />} />
      </Item>
      <Item id="photo-booth" position={[ON_WEST + 0.78, 0, 4.7]} rotation={WEST}>
        <Swaps id="photo-booth" modes={['default', 'feet', 'flash', 'broken'] as const} render={(m) => <PhotoBooth mode={m} />} />
      </Item>
      <Item id="vending" position={[ON_WEST + 0.46, 0, 6.4]} rotation={WEST}>
        <Swaps id="vending" modes={['default', 'empty', 'stuck'] as const} render={(m) => <Vending mode={m} />} />
      </Item>
      <Item id="flowers" position={[ON_WEST + 0.7, 0, 8.6]} rotation={WEST}>
        <Swaps id="flowers" modes={['default', 'dead'] as const} render={(m) => <Flowers dead={m === 'dead'} />} />
      </Item>
      <Decoy label="newsagent's chalkboard" position={[-12.0, 0, 3.0]} rotation={[0, PI / 2 + 0.3, 0]} solid>
        <ABoard text={"TODAY'S PAPERS\nEVENING POST\nCROSSWORDS\nMAPS & GUIDES"} />
      </Decoy>
    </>
  )
}

function EastWall() {
  return (
    <>
      <Item id="map" position={[ON_EAST, 1.9, -9.0]} rotation={EAST}>
        <Swaps id="map" modes={['default', 'moved'] as const} render={(m) => <MapBoard moved={m === 'moved'} />} />
      </Item>
      <Item id="ticket-office" position={[ON_EAST, 0, -4.3]} rotation={EAST}>
        <Swaps id="ticket-office" modes={['default', 'closed', 'figure'] as const} render={(m) => <TicketOffice mode={m} />} />
      </Item>
      <Item id="machines" position={[ON_EAST - 0.27, 0, 1.9]} rotation={EAST}>
        <Swaps id="machines" modes={['default', 'face', 'ticket', 'dark'] as const} render={(m) => <TicketMachines mode={m} />} />
      </Item>
      <Item id="lost-property" position={[ON_EAST, 0, 6.2]} rotation={EAST}>
        <Swaps id="lost-property" modes={['default', 'umbrellas', 'teddy', 'helmet'] as const} render={(m) => <LostProperty mode={m} />} />
      </Item>
      <Item id="atm" position={[ON_EAST, 0, 9.4]} rotation={EAST}>
        <Swaps id="atm" modes={['default', 'money'] as const} render={(m) => <Atm money={m === 'money'} />} />
      </Item>
      <Item id="cleaner" position={[12.2, 0, -8.0]} rotation={[0, -0.3, 0]}>
        <Swaps id="cleaner" modes={['default', 'mop', 'spill'] as const} render={(m) => <CleanerCart mode={m} />} />
      </Item>
    </>
  )
}

function SouthEnd() {
  return (
    <>
      <Item id="entrance" position={[0, 0, halfZ]} rotation={SOUTH}>
        <Swaps id="entrance" modes={['default', 'bus', 'rain'] as const} render={(m) => <Entrance mode={m} />} />
      </Item>
      <Item id="window" position={[0, HALL.wallH, ON_SOUTH]} rotation={SOUTH}>
        <Swaps id="window" modes={['default', 'moon', 'night'] as const} render={(m) => <FanWindow mode={m} />} />
      </Item>
      <Item id="banner" position={[0, 7.75, ON_SOUTH]} rotation={SOUTH}>
        <Swaps
          id="banner"
          modes={['default', 'stay', 'backwards'] as const}
          render={(m) => <Banner text={m === 'default' ? 'HAVE A SAFE JOURNEY' : m === 'stay' ? "PLEASE DON'T GO" : 'YENRUOJ EFAS A EVAH'} />}
        />
      </Item>
      <Item id="exit-sign" position={[0, 3.45, ON_SOUTH]} rotation={SOUTH}>
        <Swaps id="exit-sign" modes={['default', 'noway'] as const} render={(m) => <ExitSign text={m === 'default' ? 'WAY OUT' : 'NO WAY OUT'} />} />
      </Item>
      <Item id="poster" position={[-11.6, 2.0, ON_SOUTH]} rotation={SOUTH}>
        <Swaps id="poster" modes={['default', 'shark', 'rain'] as const} render={(m) => <Poster mode={m} />} />
      </Item>
      <Item id="scooter" position={[11.8, 0, 10.35]}>
        <Scooter />
      </Item>
      {/* planters either side of the middle doors */}
      {[-3.9, 3.9].map((x) => (
        <Decoy key={x} label="planter" position={[x, 0, 10.3]} solid>
          <Box size={[0.9, 0.6, 0.9]} at={[0, 0.3, 0]} mat={gloss(POP.ink)} />
          <Box size={[0.94, 0.06, 0.94]} at={[0, 0.6, 0]} mat={gloss(POP.yellow)} />
          <Cyl r={0.05} h={0.6} at={[0, 0.9, 0]} mat={matte('#5a3a22')} />
          <mesh position={[0, 1.45, 0]} scale={[0.5, 0.6, 0.5]} castShadow>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color="#2f8a3a" roughness={0.85} />
          </mesh>
        </Decoy>
      ))}
    </>
  )
}

function Floor() {
  return (
    <>
      {/* lamp standards, and what's fixed to them */}
      {LAMPS.map(([x, z]) => (
        <Decoy key={`${x}${z}`} label="lamp standard" position={[x, 0, z]} solid>
          <LampStandard />
        </Decoy>
      ))}
      <Item id="cctv" position={[LAMPS[1][0], 4.0, LAMPS[1][1]]} rotation={[0, PI + 0.6, 0]}>
        <Swaps id="cctv" modes={['default', 'watch'] as const} render={(m) => <Cctv watch={m === 'watch'} />} />
      </Item>
      <Item id="speaker" position={[LAMPS[0][0], 3.7, LAMPS[0][1]]} rotation={[0, 0.4, 0]}>
        <Swaps id="speaker" modes={['default', 'nest'] as const} render={(m) => <Speaker nest={m === 'nest'} />} />
      </Item>
      <Item id="help-point" position={[LAMPS[3][0], 0, LAMPS[3][1]]}>
        <Swaps id="help-point" modes={['default', 'phone'] as const} render={(m) => <HelpPoint phone={m === 'phone'} />} />
      </Item>

      <Item id="clock" position={[0, 6.4, -1.5]}>
        <Swaps id="clock" modes={['default', 'late', 'backwards', 'melted'] as const} render={(m) => <StationClock mode={m} />} />
      </Item>
      <Item id="balloon" position={[-3.5, roofY(-3.5) - 0.5, -3]}>
        <Balloon />
      </Item>
      <Item id="tree" position={[-7.5, 0, -1.0]}>
        <Swaps id="tree" modes={['default', 'upside', 'bare', 'present'] as const} render={(m) => <Tree mode={m} />} />
      </Item>
      <Item id="info" position={[3.4, 0, 2.2]}>
        <Swaps id="info" modes={['default', 'question', 'bell'] as const} render={(m) => <InfoDesk mode={m} />} />
      </Item>
      <Item id="cup" position={[2.55, DESK.top, 2.75]}>
        <TakeawayCup />
      </Item>
      <Item id="statue" position={[8.8, 0, -1.8]} rotation={[0, -PI / 2, 0]}>
        <Swaps id="statue" modes={['default', 'watch', 'umbrella', 'pigeon'] as const} render={(m) => <Statue mode={m} />} />
      </Item>

      {/* the piano, near the doors */}
      <Item id="piano" position={[-3.5, 0, 5.6]}>
        <Swaps id="piano" modes={['default', 'open', 'keys', 'music'] as const} render={(m) => <Piano mode={m} />} />
      </Item>
      <Item id="piano-stool" position={[-3.5, 0, 6.35]}>
        <PianoStool />
      </Item>

      {/* benches facing the departures board, a cat asleep on one */}
      <Item id="bench" position={[2.6, 0, -4.4]} rotation={[0, PI, 0]}>
        <Swaps id="bench" modes={['default', 'paper'] as const} render={(m) => <Bench paper={m === 'paper'} />} />
      </Item>
      <Decoy label="bench" position={[-2.6, 0, -4.4]} rotation={[0, PI, 0]} solid>
        <Bench />
      </Decoy>
      <Decoy label="bench" position={[10.9, 0, 4.2]} rotation={[0, -PI / 2, 0]} solid>
        <Bench />
      </Decoy>
      <Decoy label="bench" position={[-10.4, 0, 5.4]} rotation={[0, PI / 2, 0]} solid>
        <Bench />
      </Decoy>
      <Item id="cat" position={[-3.1, SEAT_Y, -4.4]}>
        <Swaps id="cat" modes={['default', 'awake'] as const} render={(m) => <Cat awake={m === 'awake'} />} />
      </Item>
      <Item id="rucksack" position={[-1.2, 0, -4.4]} rotation={[0, 0, 0]}>
        <Rucksack />
      </Item>

      {/* luggage and trolleys */}
      <Item id="trolley" position={[8.2, 0, -7.4]}>
        <Swaps id="trolley" modes={['default', 'tower', 'empty'] as const} render={(m) => <Trolley mode={m} />} />
      </Item>
      <Item id="trolley-2" position={[-9.4, 0, 7.2]}>
        <Trolley />
      </Item>
      <Item id="suitcase" position={[-1.8, 0, -7.6]} rotation={[0, 0, 0]}>
        <Swaps id="suitcase" modes={['default', 'open'] as const} render={(m) => <Suitcase open={m === 'open'} />} />
      </Item>
      <Item id="umbrella" position={[LAMPS[2][0] + 0.4, 0, LAMPS[2][1]]}>
        <Swaps id="umbrella" modes={['default', 'open'] as const} render={(m) => <Umbrella open={m === 'open'} />} />
      </Item>

      {/* by the barriers: bins, a wet floor, pigeons */}
      <Item id="bin" position={[4.3, 0, -8.4]}>
        <Swaps id="bin" modes={['default', 'overflow', 'eyes'] as const} render={(m) => <Bin mode={m} />} />
      </Item>
      <Decoy label="litter bin" position={[-4.3, 0, -8.4]} solid round>
        <Bin />
      </Decoy>
      <Item id="wet-floor" position={[1.6, 0, -8.0]}>
        <Swaps id="wet-floor" modes={['default', 'fallen'] as const} render={(m) => <WetFloor fallen={m === 'fallen'} />} />
      </Item>
      <Item id="pigeon" position={[-0.6, 0, -5.8]} rotation={[0, 2.2, 0]}>
        <Swaps id="pigeon" modes={['default', 'ticket', 'suitcase'] as const} render={(m) => <Pigeon mode={m} />} />
      </Item>
      {FLOCKS.map((f, i) => (
        <Decoy key={i} label="pigeons" position={f.at}>
          <Flock index={i} />
        </Decoy>
      ))}
    </>
  )
}

export const StationRoom = memo(function StationRoom() {
  return (
    <>
      <Lights />
      <Hall />
      <NorthEnd />
      <WestWall />
      <EastWall />
      <SouthEnd />
      <Floor />
    </>
  )
})
