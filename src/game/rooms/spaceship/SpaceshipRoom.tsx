import { Environment } from '@react-three/drei'
import { memo, useMemo } from 'react'
import { Object3D } from 'three'
import { DoubleSide } from 'three'
import { Block, Decoy, Item, PanelLight, PI, Variant } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { wallGeometry } from '../../outsideLayers'
// B is the bridge's own size; the whole ship is longer
import { BRIDGE_X, CORRIDOR, ENGINE_X, ROOM as B } from './bounds'
import { Corridor } from './Corridor'
import { EngineRoom } from './EngineRoom'
import {
  AirlockDoor,
  AirlockFrame,
  CaptainChair,
  ConsoleDuck,
  ConsoleLights,
  Crate,
  CeilingLights,
  Drone,
  EmergencyLocker,
  FloatingMug,
  Helmet,
  Hologram,
  HologramPedestal,
  Spin,
  Tank,
  TankCreature,
} from './parts'
import { wallWithPorthole } from './hull'
import { SpaceBody, SpaceSky, SpaceWhale, StarDust } from './Space'
import { useGratingTexture, useHullWallTexture, usePanelTexture, usePosterTexture, type KeepClear } from './textures'

/*
 * A small spaceship, built entirely from code: panel and grating textures are
 * drawn on canvases, space outside is shaders (see Space.tsx), seen through
 * real holes in the hull. The bridge is at the -x end (laid out here in its
 * own coordinates, door in its +x wall), then a corridor, then the engine room.
 */

const HULL = '#b9c3ce'
const RIB = '#7d8792'
const VIEWPORT = { y: 1.45, w: 3.0, h: 1.25 }
/** The airlock hatch in the -x wall: along the wall, centre height, and the hole in the hull behind it. */
const AIRLOCK = { z: -0.9, y: 1.15, r: 0.68 }
/** How thick the hull looks through its openings. */
const HULL_DEPTH = 0.4
/** Keep the busy back wall plain behind the emergency locker and the poster (metres from its left end, seen from inside). */
const BACK_KEEP: KeepClear[] = [
  [2.0, 1.15, 2.6, 1.85],
  [3.95, 0.95, 4.85, 2.05],
]

function Shell() {
  const { halfX, halfZ, height } = B
  const w = halfX * 2
  const d = halfZ * 2
  const floor = useGratingTexture(w / 1.2, d / 1.2)
  const wallsLong = usePanelTexture(HULL, w / 1.3, height / 1.3, 2)
  const wallsShort = usePanelTexture(HULL, d / 1.3, height / 1.3, 2)
  const back = useHullWallTexture('#aab4bf', w, height, 17, BACK_KEEP)
  const side = halfZ - CORRIDOR.door
  const wallsBeside = usePanelTexture(HULL, side / 1.3, height / 1.3, 2)
  const ceiling = usePanelTexture('#8e98a4', w / 1.5, d / 1.5, 3)
  const front = useMemo(
    () =>
      wallGeometry(w, height, [
        {
          x0: -VIEWPORT.w / 2,
          x1: VIEWPORT.w / 2,
          y0: VIEWPORT.y - VIEWPORT.h / 2 - height / 2,
          y1: VIEWPORT.y + VIEWPORT.h / 2 - height / 2,
        },
      ]),
    [w, height],
  )
  // the -x wall turns its own +x towards -z
  const port = useMemo(() => wallWithPorthole(d, height, -AIRLOCK.z, AIRLOCK.y - height / 2, AIRLOCK.r), [d, height])
  const walls: { width: number; at: Vec3; rot: Vec3; map: typeof wallsLong }[] = [
    { width: w, at: [0, height / 2, halfZ], rot: [0, PI, 0], map: back },
    // either side of the door to the corridor
    { width: side, at: [halfX, height / 2, -(CORRIDOR.door + side / 2)], rot: [0, -PI / 2, 0], map: wallsBeside },
    { width: side, at: [halfX, height / 2, CORRIDOR.door + side / 2], rot: [0, -PI / 2, 0], map: wallsBeside },
  ]
  const reveal = { color: '#5a636d', metalness: 0.7, roughness: 0.45 }
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
          <meshStandardMaterial map={map} metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      {/* the walls with real holes in: the viewport, and behind the airlock hatch */}
      <mesh geometry={front} position={[0, height / 2, -halfZ]} receiveShadow>
        <meshStandardMaterial map={wallsLong} metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh geometry={port} position={[-halfX, height / 2, 0]} rotation={[0, PI / 2, 0]} receiveShadow>
        <meshStandardMaterial map={wallsShort} metalness={0.55} roughness={0.45} />
      </mesh>
      {/* the thickness of the hull round the viewport */}
      <group position={[0, VIEWPORT.y, -halfZ - HULL_DEPTH / 2]}>
        {[-1, 1].map((s) => (
          <Block key={`h${s}`} size={[VIEWPORT.w + 0.04, 0.02, HULL_DEPTH]} position={[0, s * (VIEWPORT.h / 2 + 0.01), 0]} {...reveal} />
        ))}
        {[-1, 1].map((s) => (
          <Block key={`v${s}`} size={[0.02, VIEWPORT.h, HULL_DEPTH]} position={[s * (VIEWPORT.w / 2 + 0.01), 0, 0]} {...reveal} />
        ))}
      </group>
      {/* and the airlock's tube out through it */}
      <group position={[-halfX, AIRLOCK.y, AIRLOCK.z]} rotation={[0, PI / 2, 0]}>
        <mesh position={[0, 0, -HULL_DEPTH / 2]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[AIRLOCK.r, AIRLOCK.r, HULL_DEPTH, 48, 1, true]} />
          <meshStandardMaterial {...reveal} side={DoubleSide} />
        </mesh>
        {[-0.12, -0.3].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <torusGeometry args={[AIRLOCK.r, 0.015, 8, 48]} />
            <meshStandardMaterial color="#3a3f46" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* structural ribs on the side walls, and kick plates */}
      {[-2.0, 0.3, 1.6].map((z) => (
        <Block key={`l${z}`} size={[0.14, height, 0.16]} position={[-halfX + 0.07, height / 2, z]} color={RIB} metalness={0.8} roughness={0.35} radius={0.02} />
      ))}
      {[-2.0, 1.0].map((z) => (
        <Block key={`r${z}`} size={[0.14, height, 0.16]} position={[halfX - 0.07, height / 2, z]} color={RIB} metalness={0.8} roughness={0.35} radius={0.02} />
      ))}
      {[
        { size: [w, 0.14, 0.03] as Vec3, at: [0, 0.07, -halfZ + 0.015] as Vec3 },
        { size: [w, 0.14, 0.03] as Vec3, at: [0, 0.07, halfZ - 0.015] as Vec3 },
        { size: [0.03, 0.14, d] as Vec3, at: [-halfX + 0.015, 0.07, 0] as Vec3 },
        { size: [0.03, 0.14, side] as Vec3, at: [halfX - 0.015, 0.07, -(CORRIDOR.door + side / 2)] as Vec3 },
        { size: [0.03, 0.14, side] as Vec3, at: [halfX - 0.015, 0.07, CORRIDOR.door + side / 2] as Vec3 },
      ].map(({ size, at }, i) => (
        <Block key={i} size={size} position={at} color="#ffcc1a" roughness={0.6} radius={0.005} />
      ))}

      {/* viewport frame */}
      <group position={[0, VIEWPORT.y, -halfZ]}>
        <Block size={[VIEWPORT.w + 0.3, 0.16, 0.2]} position={[0, VIEWPORT.h / 2 + 0.08, 0.1]} color={RIB} metalness={0.8} roughness={0.3} radius={0.03} />
        <Block size={[VIEWPORT.w + 0.3, 0.16, 0.2]} position={[0, -VIEWPORT.h / 2 - 0.08, 0.1]} color={RIB} metalness={0.8} roughness={0.3} radius={0.03} />
        <Block size={[0.16, VIEWPORT.h + 0.3, 0.2]} position={[-VIEWPORT.w / 2 - 0.08, 0, 0.1]} color={RIB} metalness={0.8} roughness={0.3} radius={0.03} />
        <Block size={[0.16, VIEWPORT.h + 0.3, 0.2]} position={[VIEWPORT.w / 2 + 0.08, 0, 0.1]} color={RIB} metalness={0.8} roughness={0.3} radius={0.03} />
        {[-0.5, 0.5].map((x) => (
          <Block key={x} size={[0.05, VIEWPORT.h, 0.06]} position={[x * VIEWPORT.w * 0.66, 0, 0.04]} color={RIB} metalness={0.8} roughness={0.3} radius={0.01} />
        ))}
      </group>

      {/* helmet shelf on the right wall */}
      <Block size={[0.36, 0.04, 0.6]} position={[halfX - 0.18, 1.1, -1.2]} color={RIB} metalness={0.8} roughness={0.35} radius={0.01} />
      {/* brackets under it, back to the wall, so it doesn't just hang there */}
      {[-0.22, 0.22].map((dz) => (
        <group key={dz}>
          <Block size={[0.03, 0.2, 0.03]} position={[halfX - 0.015, 0.98, -1.2 + dz]} color={RIB} metalness={0.8} roughness={0.35} radius={0.006} />
          <Block size={[0.33, 0.03, 0.03]} position={[halfX - 0.16, 0.99, -1.2 + dz]} rotation={[0, 0, -0.54]} color={RIB} metalness={0.8} roughness={0.35} radius={0.006} />
        </group>
      ))}
    </group>
  )
}

function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      {/* starlight through the viewport */}
      <PanelLight
        position={[0, VIEWPORT.y, -B.halfZ + 0.03]}
        size={[VIEWPORT.w, VIEWPORT.h]}
        facing={[0, 1, 0]}
        color="#9fb8ff"
        intensity={2.5}
      />
      {/* one overhead spot casts the shadows */}
      <primitive object={target} position={[0, 0, 0]} />
      <spotLight
        position={[0, B.height - 0.1, 0]}
        target={target}
        angle={1.2}
        penumbra={1}
        intensity={7}
        decay={1.5}
        color="#e6f0ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-near={0.1}
        shadow-camera-far={6}
      />
    </>
  )
}

function Furnishings() {
  const { halfX, halfZ, height } = B
  const poster = usePosterTexture('space')
  const tankPoster = usePosterTexture('tank')
  return (
    <>
      {/* the glass is what you click; what's outside stands 60 to 120 m beyond it */}
      <Item id="viewport" position={[0, VIEWPORT.y, -halfZ]}>
        <mesh position={[0, 0, -0.015]}>
          <planeGeometry args={[VIEWPORT.w, VIEWPORT.h]} />
          <meshStandardMaterial color="#9fc4ff" transparent opacity={0.06} metalness={0.9} roughness={0.05} depthWrite={false} />
        </mesh>
        <Variant of="viewport" name="default">
          <SpaceBody kind="planet" position={[12, 2, -110]} size={60} />
        </Variant>
        <Variant of="viewport" name="blackhole">
          <SpaceBody kind="blackhole" position={[8, 1, -120]} size={70} />
        </Variant>
        <Variant of="viewport" name="earth">
          <SpaceBody kind="earth" position={[9, 0, -90]} size={50} />
        </Variant>
        <Variant of="viewport" name="whale">
          <SpaceBody kind="planet" position={[12, 2, -110]} size={60} />
          <SpaceWhale position={[-11, 3, -60]} size={30} />
        </Variant>
      </Item>

      <Item id="lights" position={[0, 0, 0]}>
        <Variant of="lights" name="default">
          <CeilingLights alert={false} height={height} length={halfZ * 2 - 0.6} />
        </Variant>
        <Variant of="lights" name="alert">
          <CeilingLights alert height={height} length={halfZ * 2 - 0.6} />
        </Variant>
      </Item>

      <Item id="console" position={[0, 0, -halfZ + 0.45]}>
        <Block size={[2.7, 0.85, 0.55]} position={[0, 0.425, 0]} color="#4a525c" metalness={0.75} roughness={0.35} radius={0.03} paint />
        {/* a dark kick plate along the foot, and service-panel seams on the front */}
        <Block size={[2.62, 0.09, 0.02]} position={[0, 0.06, 0.28]} color="#2b3038" metalness={0.7} roughness={0.4} radius={0.005} />
        {[-0.45, 0.45].map((x) => (
          <Block key={x} size={[0.012, 0.6, 0.01]} position={[x, 0.44, 0.277]} color="#2b3038" metalness={0.7} roughness={0.4} radius={0.003} />
        ))}
        {/* sloped control surface */}
        {/* tilted towards whoever is sitting in the chair */}
        <group position={[0, 0.92, 0.12]} rotation={[0.45, 0, 0]}>
          <Block size={[2.6, 0.05, 0.42]} color="#2b3038" metalness={0.7} roughness={0.35} radius={0.015} paint />
        </group>
        {/* flat rear shelf */}
        <Block size={[2.7, 0.06, 0.2]} position={[0, 1.1, -0.17]} color="#4a525c" metalness={0.75} roughness={0.35} radius={0.02} paint />
        <Variant of="console" name="default">
          <ConsoleLights alarm={false} size={[2.45, 0.36]} position={[0, 0.95, 0.13]} rotation={[0.45 - PI / 2, 0, 0]} />
        </Variant>
        <Variant of="console" name="alarm">
          <ConsoleLights alarm size={[2.45, 0.36]} position={[0, 0.95, 0.13]} rotation={[0.45 - PI / 2, 0, 0]} />
        </Variant>
      </Item>

      <Item id="red-button" position={[0.95, 1.13, -halfZ + 0.28]}>
        <mesh position={[0, 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.1, 0.03, 32]} />
          <meshStandardMaterial color="#2b2f36" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* the skirt under the dome: closes the gap down to the base */}
        <mesh position={[0, 0.04, 0]} userData={{ paint: true }}>
          <cylinderGeometry args={[0.07, 0.07, 0.022, 32]} />
          <meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.05, 0]} castShadow userData={{ paint: true }}>
          <sphereGeometry args={[0.07, 32, 16, 0, PI * 2, 0, PI / 2]} />
          <meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={0.6} roughness={0.3} />
        </mesh>
      </Item>

      <Item id="duck" position={[-0.95, 1.13, -halfZ + 0.28]}>
        <Variant of="duck" name="default">
          <ConsoleDuck />
        </Variant>
        <Variant of="duck" name="helmet">
          <ConsoleDuck helmet />
        </Variant>
      </Item>

      <Item id="chair" position={[0, 0, -0.55]} rotation={[0, PI, 0]}>
        <Variant of="chair" name="default">
          <CaptainChair />
        </Variant>
        <Variant of="chair" name="spin">
          <Spin>
            <CaptainChair />
          </Spin>
        </Variant>
      </Item>

      <Item id="mug" position={[0.9, 1.35, -0.95]}>
        <Variant of="mug" name="default">
          <FloatingMug />
        </Variant>
        <Variant of="mug" name="blob">
          <FloatingMug bigBlob />
        </Variant>
      </Item>

      <Item id="hologram" position={[-1.9, 0, 0.6]}>
        {/* only the pedestal blocks: you can walk through light */}
        <group userData={{ solid: true, round: true }}>
          <HologramPedestal />
        </group>
        <Variant of="hologram" name="default">
          <Hologram shape="planet" />
        </Variant>
        <Variant of="hologram" name="cube">
          <Hologram shape="cube" />
        </Variant>
        <Variant of="hologram" name="knot">
          <Hologram shape="knot" />
        </Variant>
      </Item>

      {/* in the back corner, out of the way of the door */}
      <Item id="tank" position={[-halfX + 0.65, 0, 1.75]}>
        <Tank />
        <Variant of="tank" name="default">
          <TankCreature awake={false} />
        </Variant>
        <Variant of="tank" name="awake">
          <TankCreature awake />
        </Variant>
      </Item>

      <Item id="crates" position={[2.15, 0, 1.8]}>
        <Crate position={[0, 0, 0]} />
        <Crate position={[0.64, 0, 0.04]} rotation={[0, 0.08, 0]} />
        <Variant of="crates" name="default">
          <Crate position={[0.3, 0.6, 0.02]} rotation={[0, -0.2, 0]} />
        </Variant>
        <Variant of="crates" name="fallen">
          <Crate position={[-0.75, 0, 0.35]} rotation={[0, 0.7, 0]} />
        </Variant>
      </Item>

      <Item id="airlock" position={[-halfX, 0, AIRLOCK.z]} rotation={[0, PI / 2, 0]}>
        <AirlockFrame />
        <Variant of="airlock" name="default">
          <AirlockDoor open={false} />
        </Variant>
        <Variant of="airlock" name="open">
          <AirlockDoor open />
          {/* nothing but space on the other side, and a moon a long way off */}
          <SpaceBody kind="moon" position={[6, -25, -140]} size={30} />
        </Variant>
      </Item>

      <Item id="drone" position={[1.5, 1.5, -0.3]}>
        <Variant of="drone" name="default">
          <Drone asleep={false} />
        </Variant>
        <Variant of="drone" name="asleep">
          <Drone asleep />
        </Variant>
        <Variant of="drone" name="pair">
          <group position={[-0.3, 0, 0]}>
            <Drone asleep={false} />
          </group>
          <group position={[0.35, 0.25, 0.1]}>
            <Drone asleep={false} />
          </group>
        </Variant>
      </Item>

      <Item id="helmet" position={[halfX - 0.18, 1.12, -1.2]} rotation={[0, -PI / 2, 0]}>
        <Variant of="helmet" name="default">
          <Helmet />
        </Variant>
        <Variant of="helmet" name="occupied">
          <Helmet occupied />
        </Variant>
      </Item>

      <Item id="poster" position={[-1.2, 1.5, halfZ]} rotation={[0, PI, 0]}>
        <Block size={[0.7, 0.95, 0.02]} position={[0, 0, 0.01]} color="#2b2f36" metalness={0.6} roughness={0.4} radius={0.01} />
        <Variant of="poster" name="default">
          <mesh position={[0, 0, 0.022]} userData={{ paint: true }}>
            <planeGeometry args={[0.62, 0.87]} />
            <meshStandardMaterial map={poster} roughness={0.7} />
          </mesh>
        </Variant>
        <Variant of="poster" name="other">
          <mesh position={[0, 0, 0.022]} userData={{ paint: true }}>
            <planeGeometry args={[0.62, 0.87]} />
            <meshStandardMaterial map={tankPoster} roughness={0.7} />
          </mesh>
        </Variant>
      </Item>
    </>
  )
}

/** Red herrings: kit lying about the bridge that never changes. */
function Clutter() {
  const { halfX, halfZ } = B
  return (
    <>
      <Decoy label="tool chest" position={[-halfX + 0.55, 0, -halfZ + 0.4]} solid>
        <Model id="metal_tool_chest" />
      </Decoy>
      <Decoy label="gas cylinder" position={[halfX - 0.35, 0, -halfZ + 0.35]} solid round>
        <Model id="propane_tank" />
      </Decoy>
      <Decoy label="first aid box" position={[-halfX + 0.3, 0, 0.85]} rotation={[0, PI / 2, 0]} solid>
        <Model id="medical_box" />
      </Decoy>
      <Decoy label="emergency locker" position={[0.9, 1.5, halfZ]} rotation={[0, PI, 0]}>
        <EmergencyLocker />
      </Decoy>
      <Decoy label="stool" position={[-1.0, 0, -1.35]} solid round>
        <Model id="metal_stool_01" />
      </Decoy>
    </>
  )
}

export const SpaceshipRoom = memo(function SpaceshipRoom() {
  return (
    <>
      <Environment files="/hdri/lythwood_lounge.hdr" environmentIntensity={0.3} />
      <hemisphereLight args={['#a9c4ff', '#1b1f2a', 0.35]} />
      <SpaceSky />
      <StarDust />
      <group position={[BRIDGE_X, 0, 0]}>
        <Lights />
        <Shell />
        <Furnishings />
        <Clutter />
      </group>
      <Corridor />
      <group position={[ENGINE_X, 0, 0]}>
        <EngineRoom />
      </group>
    </>
  )
})
