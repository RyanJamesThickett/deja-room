import {
  BoxGeometry,
  BufferAttribute,
  Color,
  Euler,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/*
 * Bakes lots of simple parts into one vertex-coloured mesh, so a whole row of
 * buildings (or a crate, or a pigeon) is a single draw call. Parts are placed
 * in the builder's current frame (`frame`), which lets each side of the
 * square be built in its own facade space and still land in one mesh.
 */

export type Vec3 = [number, number, number]
/** A rectangle of a texture atlas: u0, v0, u1, v1. */
export type Rect = [number, number, number, number]

const UNIT_BOX = new BoxGeometry(1, 1, 1)
const UNIT_PLANE = new PlaneGeometry(1, 1)

export class Builder {
  parts: BufferGeometry[] = []
  /** Where parts go: the facade (or other) space they're given in. */
  frame = new Matrix4()
  private m = new Matrix4()
  private q = new Quaternion()
  private e = new Euler(0, 0, 0, 'YXZ')
  private c = new Color()

  /** Puts the following parts in a frame turned `turn` about y and moved to `at`. */
  setFrame(at: Vec3, turn: number) {
    this.frame.compose(new Vector3(...at), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), turn), new Vector3(1, 1, 1))
  }

  /**
   * `rot` turns the part about its own x and z, then about y. `tile`: give it
   * UVs in metres over this many metres per repeat, projected along whichever
   * axis each face points down (for brick and stone that line up across parts).
   */
  add(geo: BufferGeometry, colour: string, at: Vec3, rot: Vec3 = [0, 0, 0], scale: Vec3 = [1, 1, 1], tile?: number) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    this.m.compose(new Vector3(...at), this.q.setFromEuler(this.e.set(rot[0], rot[1], rot[2], 'YXZ')), new Vector3(...scale))
    g.applyMatrix4(this.m)
    if (tile) boxUvs(g, tile)
    g.applyMatrix4(this.frame)
    this.c.set(colour)
    const n = g.attributes.position.count
    const col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) col.set([this.c.r, this.c.g, this.c.b], i * 3)
    g.setAttribute('color', new BufferAttribute(col, 3))
    if (!g.attributes.uv) g.setAttribute('uv', new BufferAttribute(new Float32Array(n * 2), 2))
    this.parts.push(g)
  }

  /** A box by its size and centre. */
  box(size: Vec3, at: Vec3, colour: string, rot?: Vec3, tile?: number) {
    this.add(UNIT_BOX, colour, at, rot, size, tile)
  }

  /** A flat panel facing +z (before `rot`), showing `rect` of a texture atlas. */
  panel(width: number, height: number, at: Vec3, rect: Rect, colour = '#ffffff', rot?: Vec3) {
    const g = UNIT_PLANE.clone()
    const uv = g.attributes.uv
    const [u0, v0, u1, v1] = rect
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0))
    this.add(g, colour, at, rot, [width, height, 1])
    g.dispose()
  }

  merge() {
    const g = this.parts.length ? mergeGeometries(this.parts) : new BoxGeometry(0, 0, 0)
    this.parts.forEach((p) => p.dispose())
    this.parts = []
    return g
  }
}

/** UVs in metres, projected along each face's main axis. */
function boxUvs(g: BufferGeometry, tile: number) {
  if (!g.attributes.normal) g.computeVertexNormals()
  const pos = g.attributes.position
  const nor = g.attributes.normal
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i))
    const ay = Math.abs(nor.getY(i))
    const az = Math.abs(nor.getZ(i))
    const [u, v] = az >= ax && az >= ay ? [pos.getX(i), pos.getY(i)] : ax >= ay ? [pos.getZ(i), pos.getY(i)] : [pos.getX(i), pos.getZ(i)]
    uv[i * 2] = u / tile
    uv[i * 2 + 1] = v / tile
  }
  g.setAttribute('uv', new BufferAttribute(uv, 2))
}

/** One cell of an atlas laid out `cols` × `rows`, counted from the top left. */
export function cell(i: number, cols: number, rows: number): Rect {
  const c = i % cols
  const r = Math.floor(i / cols)
  return [c / cols, 1 - (r + 1) / rows, (c + 1) / cols, 1 - r / rows]
}

/** Keyed cache: makes each thing once, on first use. */
export function cached<K, T>(make: (key: K) => T) {
  const made = new Map<K, T>()
  return (key: K) => {
    let t = made.get(key)
    if (t === undefined) {
      t = make(key)
      made.set(key, t)
    }
    return t
  }
}
