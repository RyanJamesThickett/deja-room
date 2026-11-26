import { Environment } from '@react-three/drei'
import { useMemo } from 'react'
import { BackSide, MeshStandardMaterial, Object3D } from 'three'
import { PI } from '../../kit'
import { once } from '../../outsideLayers'
import { BOX, gloss, MAT, matte, POP, tiled } from './parts'
import { Box } from './Prims'
import { BEAM, DOORWAYS, HALL, LAMPS, PIT, PLATFORM_END, TRACKS } from './plan'
import { canopyLightGeometry, ironGeometry, lunette, platformGeometry, shellMaterials, southWallGeometry, sunburst, vaultGeometry } from './shell'
import { ballastTexture, floorTexture, sideWallTexture, skyTexture, tileTexture } from './textures'
import { StreetLamp } from './Entrance'

/*
 * The building itself: floor, walls, the glass vault and its ironwork, the
 * glazed screen over the barriers, the platforms beyond under their canopy,
 * the street outside the doors, the evening sky over it all, and the lights.
 */

const { halfX, halfZ, wallH } = HALL

const northGlass = once(() => lunette(BEAM.y1, 0))
const northIron = once(() => sunburst(BEAM.y1, 0, 14, '#f2eee4'))

const materials = once(() => ({
  floor: new MeshStandardMaterial({ map: floorTexture(), roughness: 0.35, metalness: 0.05 }),
  wall: new MeshStandardMaterial({ map: sideWallTexture(), roughness: 0.8 }),
  tiles: new MeshStandardMaterial({ map: tileTexture(), roughness: 0.3 }),
  ballast: new MeshStandardMaterial({ map: ballastTexture(), roughness: 0.95 }),
  pavement: matte('#8f8a84'),
  road: matte('#34313a'),
}))

function Sky() {
  const m = shellMaterials()
  return (
    <mesh material={m.sky} renderOrder={-10} raycast={() => null} rotation={[0, -0.6, 0]}>
      <sphereGeometry args={[150, 48, 24]} />
    </mesh>
  )
}

function Ground() {
  const m = materials()
  return (
    <>
      {/* the concourse floor runs a little past the barriers, to where the tracks start */}
      <mesh geometry={tiled(halfX * 2, halfZ * 2 + 1, 2)} material={m.floor} rotation={[-PI / 2, 0, 0]} position={[0, 0, -0.5]} receiveShadow />
      {/* a yellow tactile strip in front of the barriers */}
      <Box size={[halfX * 2 - 0.6, 0.01, 0.4]} at={[0, 0.005, -9.2]} mat={gloss(POP.yellow)} shadow={false} />
      {/* the ballast between the platforms */}
      {TRACKS.map((x) => (
        <mesh
          key={x}
          geometry={tiled(PIT.half * 2, -halfZ - 1 - PLATFORM_END, PIT.half * 2)}
          material={m.ballast}
          rotation={[-PI / 2, 0, 0]}
          position={[x, -PIT.depth, (-halfZ - 1 + PLATFORM_END) / 2]}
          receiveShadow
        />
      ))}
      <mesh geometry={platformGeometry()} material={MAT.baked} receiveShadow />
      <mesh geometry={canopyLightGeometry()} material={shellMaterials().canopyLight} />
    </>
  )
}

function Walls() {
  const m = materials()
  const s = shellMaterials()
  return (
    <>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * halfX, wallH / 2, 0]} rotation={[0, (-side * PI) / 2, 0]} material={m.wall} receiveShadow>
          <planeGeometry args={[halfZ * 2, wallH]} />
        </mesh>
      ))}
      {/* the south wall, its doorways framed in red */}
      <mesh geometry={southWallGeometry()} material={s.ashlar} position={[0, 0, halfZ]} rotation={[0, PI, 0]} receiveShadow />
      {[
        [-halfX, -8.8],
        [-5.2, -2.6],
        [2.6, 5.2],
        [8.8, halfX],
      ].map(([x0, x1]) => (
        <group key={x0}>
          <mesh geometry={tiled(x1 - x0, 3.2, 0.6)} material={m.tiles} position={[(x0 + x1) / 2, 1.6, halfZ - 0.02]} rotation={[0, PI, 0]} receiveShadow />
          <Box size={[x1 - x0, 0.25, 0.04]} at={[(x0 + x1) / 2, 3.325, halfZ - 0.02]} mat={gloss(POP.yellow)} shadow={false} />
        </group>
      ))}
      {DOORWAYS.map((d) => (
        <group key={d.x} position={[d.x, 0, halfZ - 0.1]}>
          {[-1, 1].map((sx) => (
            <Box key={sx} size={[0.25, d.spring, 0.25]} at={[sx * (d.half + 0.125), d.spring / 2, 0]} mat={gloss(POP.red)} />
          ))}
          <mesh position={[0, d.spring, 0]} castShadow>
            <torusGeometry args={[d.half + 0.125, 0.14, 8, 32, PI]} />
            <meshStandardMaterial color={POP.red} roughness={0.32} />
          </mesh>
        </group>
      ))}
      {/* skirting along the side walls */}
      {[-1, 1].map((side) => (
        <Box key={side} size={[0.05, 0.15, halfZ * 2]} at={[side * (halfX - 0.025), 0.075, 0]} mat={MAT.black} shadow={false} />
      ))}
    </>
  )
}

function Roof() {
  const s = shellMaterials()
  return (
    <>
      <mesh geometry={vaultGeometry()} material={s.glass} renderOrder={1} raycast={() => null} />
      <mesh geometry={ironGeometry()} material={s.iron} castShadow />
    </>
  )
}

/** The red beam across the north end, and the glazed screen above it over the barriers. */
function NorthScreen() {
  const s = shellMaterials()
  return (
    <group>
      <Box size={[halfX * 2, BEAM.y1 - BEAM.y0, BEAM.depth]} at={[0, (BEAM.y0 + BEAM.y1) / 2, BEAM.z]} mat={gloss('#e8202a')} />
      {Array.from({ length: 29 }, (_, k) => (
        <mesh key={k} geometry={BOX} material={MAT.brass} position={[-14 + k, (BEAM.y0 + BEAM.y1) / 2, BEAM.z + BEAM.depth / 2]} scale={[0.06, 0.06, 0.02]} />
      ))}
      <mesh geometry={northGlass()} material={s.glass} position={[0, 0, BEAM.z]} renderOrder={1} raycast={() => null} />
      <mesh geometry={northIron()} material={s.iron} position={[0, 0, BEAM.z + 0.05]} />
      {/* end posts carrying the beam */}
      {[-1, 1].map((side) => (
        <Box key={side} size={[0.4, BEAM.y0, 0.4]} at={[side * (halfX - 0.2), BEAM.y0 / 2, BEAM.z]} mat={gloss('#e8202a')} />
      ))}
    </group>
  )
}

/** The street outside the main doors. */
function Outside() {
  const m = materials()
  const s = shellMaterials()
  return (
    <group>
      <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.005, halfZ + 2.5]} material={m.pavement} receiveShadow>
        <planeGeometry args={[60, 5]} />
      </mesh>
      <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.1, halfZ + 9]} material={m.road} receiveShadow>
        <planeGeometry args={[60, 8]} />
      </mesh>
      <Box size={[60, 0.12, 0.2]} at={[0, -0.05, halfZ + 5]} mat={matte('#c9c4ba')} shadow={false} />
      <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.005, halfZ + 15]} material={m.pavement}>
        <planeGeometry args={[60, 4]} />
      </mesh>
      <mesh material={s.street} position={[0, 12, halfZ + 17]} rotation={[0, PI, 0]}>
        <planeGeometry args={[64, 32]} />
      </mesh>
      {[-4.5, 4.5, 13].map((x) => (
        <group key={x} position={[x, 0, halfZ + 4.4]}>
          <StreetLamp />
        </group>
      ))}
    </group>
  )
}

export function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      <Environment resolution={64} environmentIntensity={0.5}>
        <mesh>
          <sphereGeometry args={[50, 32, 16]} />
          <meshBasicMaterial map={skyTexture()} side={BackSide} toneMapped={false} />
        </mesh>
      </Environment>
      <hemisphereLight args={['#ffe2c4', '#6a5a62', 0.9]} />
      <primitive object={target} position={[0, 0, -1]} />
      {/* the last of the sun, low through the glass from the south-west */}
      <directionalLight
        position={[-16, 20, 18]}
        target={target}
        intensity={2.2}
        color="#ffc08a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      {/* the lamp standards */}
      {LAMPS.map(([x, z]) => (
        <pointLight key={`${x}${z}`} position={[x, 4.8, z]} color="#ffd9a0" intensity={14} distance={16} decay={1.4} />
      ))}
    </>
  )
}

export function Hall() {
  return (
    <>
      <Sky />
      <Ground />
      <Walls />
      <Roof />
      <NorthScreen />
      <Outside />
    </>
  )
}
