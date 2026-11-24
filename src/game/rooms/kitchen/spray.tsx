import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Box3, Object3D, Vector3, type Group, type InstancedMesh, type Mesh } from 'three'
import { PI } from '../../kit'
import type { Vec3 } from '../../mutations'
import { BENCH } from './layout'
import { JET_LEN, puddleGeometry, SEG, SPRAY } from './sprayParts'

/*
 * The pot-wash sink's pre-rinse arm, gone wild: the hose under its spring
 * thrashes about like something alive, and the spray head sprays water all
 * over the sink, the wall, the floor and whoever's standing there. Built in
 * the sink's own space (see PotSink), with the hose hanging from `anchor`.
 */

const SEGMENTS = 10
const DROPS = 170
const LIFE = 0.7
const UP = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)

const noClick = () => null

/** The hose: a chain of short pieces, each bending a little more than the last, like a whip. */
function Hose({ children }: { children: ReactNode }) {
  let inner = children
  for (let i = SEGMENTS - 1; i >= 0; i--) {
    inner = (
      <group key={i} name="joint" position={[0, i === 0 ? 0 : -SEG, 0]}>
        <mesh geometry={SPRAY.hose} material={SPRAY.rubber} position={[0, -SEG / 2, 0]} />
        <mesh geometry={SPRAY.knuckle} material={SPRAY.rubber} />
        {inner}
      </group>
    )
  }
  return <>{inner}</>
}

export function ThrashingSpray({ anchor, head }: { anchor: Vec3; head: ReactNode }) {
  const root = useRef<Group>(null)
  const top = useRef<Group>(null)
  const nozzle = useRef<Group>(null)
  const drops = useRef<InstancedMesh>(null)
  const jet = useRef<Mesh>(null)
  // each drop: where and when it left the nozzle, and how fast; made on the first frame
  const sim = useRef<{ from: Float32Array; vel: Float32Array; born: Float32Array; o: Object3D; a: Vector3; b: Vector3; v: Vector3 } | null>(null)

  useLayoutEffect(() => {
    const m = drops.current
    if (!m) return
    // the drops fly about, so give them a fixed box over the sink for the layout check
    m.boundingBox = new Box3(new Vector3(-0.45, BENCH - 0.02, -0.34), new Vector3(0.45, BENCH + 0.9, 0.34))
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    let j = top.current?.children.find((c) => c.name === 'joint')
    for (let i = 0; j; i++) {
      const k = i / (SEGMENTS - 1)
      if (i === 0) {
        // the top of the hose swings right out from the wall, over the front of the sink, and round
        // (away from the dish table on its +x side)
        j.rotation.x = -1.15 + Math.sin(t * 2.7) * 0.45 + Math.sin(t * 4.3) * 0.15
        j.rotation.z = -0.25 + Math.sin(t * 1.9 + 0.5) * 0.2
      } else {
        // and each piece below whips after it, a beat late
        j.rotation.x = -0.04 + Math.sin(t * 5.1 - i * 0.8) * (0.22 + k * 0.3)
        j.rotation.z = Math.sin(t * 3.7 - i * 0.7 + 1) * (0.05 + k * 0.12)
      }
      j = j.children.find((c) => c.name === 'joint')
    }
    const r = root.current
    const n = nozzle.current
    const m = drops.current
    if (!r || !n || !m) return
    sim.current ??= { from: new Float32Array(DROPS * 3), vel: new Float32Array(DROPS * 3), born: new Float32Array(DROPS).fill(-1), o: new Object3D(), a: new Vector3(), b: new Vector3(), v: new Vector3() }
    const tmp = sim.current
    // where the nozzle is and which way it points, in the sink's space
    n.getWorldPosition(tmp.a)
    n.localToWorld(tmp.b.set(0, 0, 1))
    r.worldToLocal(tmp.a)
    r.worldToLocal(tmp.b)
    const dir = tmp.b.sub(tmp.a).normalize()
    const { from, vel, born } = tmp
    const o = tmp.o
    for (let i = 0; i < DROPS; i++) {
      let age = t - born[i]
      // (or if the clock has been reset under it)
      if (born[i] < 0 || age > LIFE || age < 0) {
        // off again: a fresh drop from the nozzle, a slightly different way each time
        born[i] = t - (i % 7) * 0.004
        age = t - born[i]
        const spread = 0.8
        const speed = 2.4 + ((i * 37) % 11) * 0.1
        from.set([tmp.a.x, tmp.a.y, tmp.a.z], i * 3)
        vel.set(
          [
            dir.x * speed + Math.sin(i * 12.9898 + t * 7) * spread,
            dir.y * speed + Math.sin(i * 78.233 + t * 5) * spread,
            dir.z * speed + Math.sin(i * 39.425 + t * 3) * spread,
          ],
          i * 3,
        )
      }
      const x = from[i * 3] + vel[i * 3] * age
      let y = from[i * 3 + 1] + vel[i * 3 + 1] * age - 4.9 * age * age
      let z = from[i * 3 + 2] + vel[i * 3 + 2] * age
      // splat on whatever it hits: the sink, the wall behind, the floor
      const overSink = Math.abs(x) < 0.43 && z < 0.33
      const floor = overSink ? BENCH + 0.004 : 0.004
      const hit = y <= floor || z <= -0.335
      z = Math.max(z, -0.335)
      y = Math.max(y, floor)
      o.position.set(x, y, z)
      if (hit) {
        // a splash, flat on the surface it landed on
        o.quaternion.setFromUnitVectors(UP, z <= -0.335 ? FORWARD : UP)
        o.scale.set(2.2, 0.15, 2.2)
      } else {
        // a streak of water along the way it's flying
        tmp.v.set(vel[i * 3], vel[i * 3 + 1] - 9.8 * age, vel[i * 3 + 2])
        const speed = tmp.v.length()
        o.quaternion.setFromUnitVectors(UP, tmp.v.normalize())
        o.scale.set(1, 1 + speed * 1.6, 1)
      }
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    if (jet.current) jet.current.scale.set(1 + Math.sin(t * 31) * 0.15, 1 + Math.sin(t * 23) * 0.1, 1 + Math.sin(t * 27) * 0.15)
  })

  return (
    <group ref={root}>
      <group ref={top} position={anchor}>
        <Hose>
          {/* the head on the end of the hose, nozzle pointing on down the hose */}
          <group position={[0, -SEG, 0]} rotation={[PI / 2, 0, 0]}>
            <group position={[0, 0, -0.07]}>{head}</group>
            <group ref={nozzle} position={[0, 0, 0.095]} />
            <mesh ref={jet} geometry={SPRAY.jet} material={SPRAY.mist} position={[0, 0, 0.1 + JET_LEN / 2]} raycast={noClick} />
          </group>
        </Hose>
      </group>
      <instancedMesh ref={drops} args={[SPRAY.drop, SPRAY.water, DROPS]} frustumCulled={false} raycast={noClick} />
      {/* everything's soaked: a puddle on the floor, the wall tiles streaming, the front of the sink dripping */}
      <mesh geometry={puddleGeometry()} material={SPRAY.wet} position={[-0.08, 0.003, 0.62]} rotation={[-PI / 2, 0, 0]} scale={0.85} />
      {[-0.36, -0.2, -0.05, 0.08, 0.27, 0.4].map((x, i) => (
        // water running down the tiles
        <mesh key={`w${x}`} geometry={SPRAY.trickle} material={SPRAY.water} position={[x, BENCH + 0.3 + (i % 3) * 0.12, -0.343]} scale={[1.4, 3 + (i % 2) * 2, 0.6]} />
      ))}
      {[-0.3, -0.1, 0.12, 0.31].map((x, i) => (
        <mesh key={x} geometry={SPRAY.trickle} material={SPRAY.water} position={[x, BENCH - 0.06 - (i % 2) * 0.05, 0.352]} scale={[1, 1 + (i % 3) * 0.6, 1]} />
      ))}
    </group>
  )
}
