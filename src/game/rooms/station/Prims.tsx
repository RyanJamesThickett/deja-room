import type { Material, Texture } from 'three'
import type { Vec3 } from '../../mutations'
import { BALL, BOX, CYL, PLANE, printed, ROD, shining } from './parts'

/*
 * Primitive parts, sized by scaling shared unit geometry. `paint` marks a
 * mesh as the part a recolour changes.
 */

type Common = { at?: Vec3; rot?: Vec3; mat: Material; paint?: boolean; shadow?: boolean }

const tag = (paint?: boolean) => (paint ? { paint: true } : undefined)

export function Box({ size, at, rot, mat, paint, shadow = true }: Common & { size: Vec3 }) {
  return <mesh geometry={BOX} material={mat} position={at} rotation={rot} scale={size} castShadow={shadow} receiveShadow userData={tag(paint)} />
}

/** An upright cylinder, `r` round and `h` tall, centred on `at`. */
export function Cyl({ r, h, at, rot, mat, paint, shadow = true }: Common & { r: number | [number, number]; h: number }) {
  const [rx, rz] = typeof r === 'number' ? [r, r] : r
  return <mesh geometry={CYL} material={mat} position={at} rotation={rot} scale={[rx, h, rz]} castShadow={shadow} receiveShadow userData={tag(paint)} />
}

export function Ball({ r, at, rot, mat, paint, shadow = true }: Common & { r: number | Vec3 }) {
  return <mesh geometry={BALL} material={mat} position={at} rotation={rot} scale={r} castShadow={shadow} userData={tag(paint)} />
}

/** A round bar from `a` to `b`. */
export function Rod({ a, b, r = 0.02, mat, paint }: { a: Vec3; b: Vec3; r?: number; mat: Material; paint?: boolean }) {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = Math.hypot(...d)
  // a cylinder stands along y: turn to face along d, then tip over by its angle from the vertical
  const yaw = Math.atan2(d[0], d[2])
  const pitch = Math.acos(Math.max(-1, Math.min(1, d[1] / len)))
  return (
    <group position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} rotation={[0, yaw, 0]}>
      <mesh geometry={ROD} material={mat} rotation={[pitch, 0, 0]} scale={[r, len, r]} castShadow userData={tag(paint)} />
    </group>
  )
}

/** A flat printed picture facing +z (before `rot`): a sign face, a poster. `lit`: backlit. */
export function Print({ map, w, h, at, rot, lit = false }: { map: Texture; w: number; h: number; at?: Vec3; rot?: Vec3; lit?: boolean }) {
  return <mesh geometry={PLANE} material={lit ? shining(map) : printed(map)} position={at} rotation={rot} scale={[w, h, 1]} receiveShadow={!lit} />
}
