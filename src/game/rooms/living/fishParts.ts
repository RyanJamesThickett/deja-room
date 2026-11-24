import { BufferAttribute, Color, LatheGeometry, Matrix4, Shape, ShapeGeometry, Vector2, type BufferGeometry } from 'three'

/*
 * Shapes for the living room's flying goldfish and the shark that joins them.
 * Every fish here has its head along +z, back up (+y).
 *
 * Fins are flat outlines. They're drawn in 2D with x pointing forward (towards
 * the head), then turned into place: upright for the back and tail fins,
 * sideways for the side fins.
 */

type Outline = readonly (readonly [number, number])[]

function outline(points: Outline) {
  const shape = new Shape()
  shape.moveTo(points[0][0], points[0][1])
  shape.splineThru(points.slice(1).map(([x, y]) => new Vector2(x, y)))
  shape.closePath()
  return new ShapeGeometry(shape, 12)
}

/** Drawn x (forward) → z, drawn y → up: a fin standing upright along the body (back fin, tail). */
function upright(points: Outline): BufferGeometry {
  return outline(points).applyMatrix4(new Matrix4().set(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1))
}

/** Drawn x (forward) → z, drawn y → out to the fish's left (+x): a side fin lying flat, to be tilted into place. */
function sideways(points: Outline): BufferGeometry {
  return outline(points).applyMatrix4(new Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1))
}

/**
 * The shark's body: round at the front, fattest just ahead of the middle, then
 * narrowing to a thin tail stock where the tail fin joins. Grey on top,
 * fading to a white belly.
 */
function sharkBody(): BufferGeometry {
  // [radius, along the body]: tail end first, nose last
  const profile: [number, number][] = [
    [0, -0.47],
    [0.014, -0.46],
    [0.022, -0.4],
    [0.04, -0.3],
    [0.07, -0.18],
    [0.095, -0.04],
    [0.105, 0.06],
    [0.1, 0.16],
    [0.083, 0.26],
    [0.058, 0.34],
    [0.03, 0.4],
    [0, 0.43],
  ]
  const g = new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r, y)),
    32,
  )
  // lathe runs along y; lay it along z, nose forward, and slightly narrower than it is tall
  g.rotateX(PI_2)
  g.scale(0.85, 1, 1)
  g.computeVertexNormals()
  const top = new Color('#76848f')
  const belly = new Color('#eef1f4')
  const normals = g.attributes.normal
  const colours = new Float32Array(normals.count * 3)
  const c = new Color()
  for (let i = 0; i < normals.count; i++) {
    // white below about a third of the way down the side, with a soft edge
    const t = Math.min(1, Math.max(0, (normals.getY(i) + 0.45) / 0.3))
    c.copy(belly).lerp(top, t).toArray(colours, i * 3)
  }
  g.setAttribute('color', new BufferAttribute(colours, 3))
  return g
}

const PI_2 = Math.PI / 2

/** Shark fins and body, built once and shared. */
export const SHARK = {
  body: sharkBody(),
  /** Tall, swept-back triangle with a curved trailing edge. Its base sits at y = 0. */
  dorsal: upright([
    [0.1, -0.01],
    [0.05, 0.07],
    [-0.01, 0.14],
    [-0.04, 0.17],
    [-0.035, 0.11],
    [-0.06, 0.03],
    [-0.09, -0.01],
  ]),
  /**
   * The crescent tail: a long upper lobe sweeping up and back, a shorter lower
   * one, and a notch between them. Joins the body at (0, 0).
   */
  tail: upright([
    [0.04, 0.012],
    [-0.04, 0.07],
    [-0.12, 0.16],
    [-0.17, 0.215],
    [-0.13, 0.12],
    [-0.08, 0.035],
    [-0.065, 0.0],
    [-0.1, -0.06],
    [-0.125, -0.105],
    [-0.06, -0.06],
    [0.04, -0.012],
  ]),
  /** Long side fin swept back, to be tilted down from the body's side. */
  pectoral: sideways([
    [0.06, 0],
    [0.02, 0.07],
    [-0.04, 0.14],
    [-0.085, 0.175],
    [-0.065, 0.1],
    [-0.035, 0.035],
    [-0.025, 0],
  ]),
}

/** Goldfish fins: a little rounded back fin and paddle-shaped side fins. */
export const GOLDFISH = {
  dorsal: upright([
    [0.04, -0.005],
    [0.02, 0.03],
    [-0.02, 0.045],
    [-0.05, 0.03],
    [-0.055, -0.005],
  ]),
  pectoral: sideways([
    [0.015, 0],
    [0.01, 0.025],
    [-0.015, 0.042],
    [-0.035, 0.035],
    [-0.025, 0.012],
    [-0.01, 0],
  ]),
}
