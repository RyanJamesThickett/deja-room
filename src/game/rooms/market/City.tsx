import { PI } from '../../kit'
import { cityGeometry } from './cityPlan'
import { COBBLE, COBBLE_MAT, cityMaterials, fountainCobbles } from './materials'
import { Tinted } from './Tinted'

/*
 * Everything that isn't part of the market itself: the sky, the paving, and
 * the buildings round the square with the street and alley leading off it.
 */

/** A dome of sky, big enough to sit behind everything and inside the camera's reach. */
function Sky() {
  const { sky } = cityMaterials()
  return (
    <mesh material={sky} renderOrder={-10} raycast={() => null} rotation={[0, 1.2, 0]}>
      <sphereGeometry args={[160, 48, 24]} />
    </mesh>
  )
}

function Ground() {
  const m = cityMaterials()
  const cobbles = fountainCobbles()
  return (
    <>
      {/* tarmac under everything: the street, and anything past the paving */}
      <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.01, 10]} material={m.tarmac} receiveShadow>
        <planeGeometry args={[120, 120]} />
      </mesh>
      {/* the square: granite slabs from wall to wall */}
      <mesh rotation={[-PI / 2, 0, 0]} material={m.paving} receiveShadow>
        <planeGeometry args={[32, 26]} />
      </mesh>
      {/* pavements down each side of the street and along the alley */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh rotation={[-PI / 2, 0, 0]} position={[s * 1.59, 0.12, 28]} receiveShadow>
            <planeGeometry args={[0.78, 34]} />
            <meshStandardMaterial color="#a19b90" roughness={0.9} />
          </mesh>
          <mesh position={[s * 1.25, 0.06, 28]} receiveShadow>
            <boxGeometry args={[0.12, 0.12, 34]} />
            <meshStandardMaterial color="#c9c4ba" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh rotation={[-PI / 2, 0, 0]} position={[-19, 0.001, 4.48]} receiveShadow>
        <planeGeometry args={[10, 2]} />
        <meshStandardMaterial color="#8c867c" roughness={0.9} />
      </mesh>
      {/* cobbles in a ring round the fountain, on dark mortar */}
      <mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <ringGeometry args={[2.2, 3.35, 64]} />
        <meshStandardMaterial color="#4a4743" roughness={0.95} />
      </mesh>
      <Tinted geometry={COBBLE} material={COBBLE_MAT} items={cobbles.items} colours={cobbles.colours} />
    </>
  )
}

function Buildings() {
  const g = cityGeometry()
  const m = cityMaterials()
  return (
    <>
      <mesh geometry={g.brick} material={m.brick} castShadow receiveShadow />
      <mesh geometry={g.stone} material={m.stone} castShadow receiveShadow />
      <mesh geometry={g.render} material={m.render} castShadow receiveShadow />
      <mesh geometry={g.trim} material={m.trim} castShadow receiveShadow />
      <mesh geometry={g.glass} material={m.glass} receiveShadow />
      <mesh geometry={g.shop} material={m.shop} receiveShadow />
      <mesh geometry={g.signs} material={m.signs} receiveShadow />
    </>
  )
}

export function City() {
  return (
    <>
      <Sky />
      <Ground />
      <Buildings />
    </>
  )
}
