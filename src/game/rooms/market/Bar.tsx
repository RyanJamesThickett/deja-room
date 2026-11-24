import type { Material } from 'three'
import type { Vec3 } from './build'
import { POLE } from './stallParts'

/** A round bar from `a` to `b` (a stall pole, a lamppost's arm, a guitar stand's leg). */
export function Bar({ a, b, r = 0.025, material }: { a: Vec3; b: Vec3; r?: number; material: Material }) {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = Math.hypot(...d)
  // a cylinder stands along y: turn to face along d, then tip over by its angle from the vertical
  const yaw = Math.atan2(d[0], d[2])
  const pitch = Math.acos(d[1] / len)
  return (
    <group position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} rotation={[0, yaw, 0]}>
      <mesh geometry={POLE} material={material} rotation={[pitch, 0, 0]} scale={[r / 0.025, len, r / 0.025]} castShadow />
    </group>
  )
}
