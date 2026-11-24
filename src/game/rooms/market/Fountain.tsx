import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MeshStandardMaterial, RingGeometry, type Group, type Mesh } from 'three'
import { PI } from '../../kit'
import { Model } from '../../Model'
import { MAT } from './materials'
import { BALL, DISC, UNIT_BOX } from './stallParts'
import { BASIN, FOUNTAIN, ICICLE, waterArc } from './squareParts'
import { Watching } from './Watching'

/*
 * The landmark in the middle of the square: a round stone basin with a
 * pedestal in it, a bronze lion's head on each face of the pedestal
 * spouting water, and a bronze horse on top.
 */

const WATER = new MeshStandardMaterial({ color: '#3d6d78', roughness: 0.06, metalness: 0.35 })
const SPOUT = new MeshStandardMaterial({ color: '#e4f4ff', roughness: 0.1, transparent: true, opacity: 0.62, emissive: '#9fc8e0', emissiveIntensity: 0.25 })
const ICE = new MeshStandardMaterial({ color: '#dceef6', roughness: 0.35, metalness: 0.05 })
const ICICLE_MAT = new MeshStandardMaterial({ color: '#eef8ff', roughness: 0.15, transparent: true, opacity: 0.85 })
const RIPPLE = new RingGeometry(0.9, 1, 32)

/** Facing out of each face of the pedestal: +z, +x, -z, -x. */
const FACES = [0, PI / 2, PI, -PI / 2]

function LionHead() {
  return (
    <group>
      {/* mane, face and muzzle, in bronze gone green */}
      <mesh geometry={DISC} material={MAT.bronze} rotation={[PI / 2, 0, 0]} scale={[0.17, 0.05, 0.17]} castShadow />
      <mesh geometry={BALL} material={MAT.bronze} position={[0, 0, 0.05]} scale={[0.1, 0.11, 0.07]} />
      <mesh geometry={BALL} material={MAT.bronze} position={[0, -0.04, 0.1]} scale={[0.055, 0.045, 0.05]} />
      <mesh geometry={BALL} material={MAT.black} position={[0, -0.06, 0.13]} scale={[0.025, 0.02, 0.02]} />
    </group>
  )
}

export function Fountain() {
  const { plinthTop } = FOUNTAIN
  return (
    <>
      <mesh geometry={BASIN} material={MAT.stone} castShadow receiveShadow />
      {/* the pedestal: a base, a shaft with a lion on each face, a cornice */}
      <mesh geometry={UNIT_BOX} material={MAT.stone} position={[0, 0.58, 0]} scale={[1.5, 0.32, 1.26]} castShadow receiveShadow />
      <mesh geometry={UNIT_BOX} material={MAT.stone} position={[0, 1.2, 0]} scale={[1.16, 0.94, 0.92]} castShadow receiveShadow />
      <mesh geometry={UNIT_BOX} material={MAT.darkStone} position={[0, 1.7, 0]} scale={[1.36, 0.08, 1.12]} castShadow receiveShadow />
      <mesh geometry={UNIT_BOX} material={MAT.stone} position={[0, plinthTop - 0.06, 0]} scale={[1.3, 0.12, 1.06]} castShadow receiveShadow />
      {FACES.map((a, i) => (
        <group key={a} rotation={[0, a, 0]}>
          <group position={[0, 1.2, i % 2 ? 0.58 : 0.46]}>
            <LionHead />
          </group>
        </group>
      ))}
    </>
  )
}

/** Rings spreading out where a spout lands, over and over. */
function Ripples() {
  const refs = useRef<(Mesh | null)[]>([])
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = (clock.elapsedTime * 0.7 + i * 0.25) % 1
      m.scale.setScalar(0.05 + t * 0.3)
      ;(m.material as MeshStandardMaterial).opacity = 0.5 * (1 - t)
    })
  })
  return (
    <>
      {FACES.flatMap((a, i) =>
        [0, 1].map((k) => (
          <group key={`${i}${k}`} rotation={[0, a, 0]}>
            <mesh
              ref={(m) => {
                refs.current[i * 2 + k] = m
              }}
              geometry={RIPPLE}
              position={[0, FOUNTAIN.water + 0.005, i % 2 ? 1.3 : 1.2]}
              rotation={[-PI / 2, 0, 0]}
            >
              <meshBasicMaterial color="#e8f6ff" transparent depthWrite={false} />
            </mesh>
          </group>
        )),
      )}
    </>
  )
}

/** Rubber ducks paddling round the basin in a slow procession. */
function Ducks() {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15
  })
  return (
    <group ref={ref} position={[0, FOUNTAIN.water - 0.03, 0]}>
      {Array.from({ length: 9 }, (_, k) => {
        const a = (k / 9) * PI * 2
        const r = 1.55
        // each faces (+z) along the circle, the way they're all going
        return (
          <group key={k} position={[Math.cos(a) * r, 0, -Math.sin(a) * r]} rotation={[0, a + PI, 0]}>
            <Model id="rubber_duck_toy" scale={1.3} paint={false} />
          </group>
        )
      })}
    </group>
  )
}

export function FountainChange({ mode }: { mode: 'default' | 'frozen' | 'ducks' }) {
  const frozen = mode === 'frozen'
  return (
    <>
      <mesh position={[0, FOUNTAIN.water, 0]} rotation={[-PI / 2, 0, 0]} material={frozen ? ICE : WATER} receiveShadow>
        <circleGeometry args={[FOUNTAIN.inner + 0.01, 64]} />
      </mesh>
      {FACES.map((a, i) => (
        <group key={a} rotation={[0, a, 0]} position={[0, 0, 0]}>
          <group position={[0, 0, i % 2 ? 0.12 : 0]}>
            <mesh geometry={waterArc()} material={frozen ? ICICLE_MAT : SPOUT} />
          </group>
          {frozen &&
            [-0.08, 0, 0.07].map((x, k) => (
              <mesh key={x} geometry={ICICLE} material={ICICLE_MAT} position={[x, 1.02 - k * 0.04, i % 2 ? 0.7 : 0.58]} scale={[1, 0.7 + k * 0.3, 1]} />
            ))}
        </group>
      ))}
      {frozen && (
        // frost on the coping
        <mesh position={[0, 0.605, 0]} rotation={[-PI / 2, 0, 0]}>
          <ringGeometry args={[1.88, 2.1, 64]} />
          <meshStandardMaterial color="#f4fbff" roughness={0.6} />
        </mesh>
      )}
      {mode === 'default' && <Ripples />}
      {mode === 'ducks' && (
        <>
          <Ripples />
          <Ducks />
        </>
      )}
    </>
  )
}

/** Turned so its head (the model's -x end) points along +z. */
const HORSE_TURN = PI / 2

function Horse() {
  return (
    <group rotation={[0, HORSE_TURN, 0]}>
      <Model id="horse_statue_01" scale={9} />
    </group>
  )
}

export function StatueChange({ mode }: { mode: 'default' | 'watch' | 'duck' | 'cat' }) {
  if (mode === 'watch')
    return (
      <Watching>
        <Horse />
      </Watching>
    )
  // the duck and cat models already face +z, like the turned horse
  if (mode === 'duck') return <Model id="rubber_duck_toy" scale={6.5} />
  if (mode === 'cat') return <Model id="concrete_cat_statue" scale={7} />
  return <Horse />
}
