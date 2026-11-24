import { Box3, CanvasTexture, ClampToEdgeWrapping, Path, PlaneGeometry, RepeatWrapping, Shape, ShapeGeometry, SRGBColorSpace, type Texture } from 'three'

/*
 * The world outside a window, built from a few flat layers standing at
 * different distances behind the wall, so that walking past it the near
 * things slide across the glass faster than the far ones, as they do through
 * a real window. A picture stuck on the glass doesn't move at all.
 *
 * Layers are placed in street coordinates: x runs along the wall (the
 * opening's own local x, shifted by where the opening sits along the street),
 * y is height above the room's floor, and depth is distance out from the
 * wall. Each opening in a wall draws its own slice of the same street, so the
 * views through a shop window and the door beside it join up.
 */

/** Where a layer stands outside. */
export interface LayerPlace {
  /** Metres out from the wall. A flat layer lies on the ground from the wall out to here. */
  depth: number
  /** The street x the texture spans once. Past that it repeats or smears its edge, as its wrapping says. */
  x: [number, number]
  /** Bottom and top of the layer above the floor. A flat layer lies at y[0]. */
  y: [number, number]
  /** The heights the texture spans, if not the whole of `y` (it smears its edge rows beyond). */
  v?: [number, number]
  flat?: boolean
}

export interface OutsideLayer extends LayerPlace {
  /** Drawn blended, so it can have soft edges (a lamp's glow) and see-through parts. */
  map: Texture
}

/** Which part of the street an opening shows: where it sits along the street, and the stretch it draws. */
export interface Slice {
  along?: number
  from?: number
  to?: number
}

/*
 * Draw order. Layers don't write depth: they're drawn back to front after
 * everything solid in the room (which still hides them), and before anything
 * see-through in it (renderOrder 0 and up). Openings in one wall that show
 * different worlds (the gym's day window beside its night door) draw in
 * passes: the first pass, then a depth-only mask over its opening, then the
 * second, which covers the first everywhere except behind the mask.
 */
export function layerOrder(place: LayerPlace, pass = 0) {
  // ground is drawn before what stands on its far edge
  return -1000 + pass * 300 + 250 - Math.round(place.depth + (place.flat ? 1 : 0))
}
/** Between the first pass's layers and the second's. */
export const MASK_ORDER = -1000 + 299

/** How far either side of its opening a layer reaches: enough for a steep sideways look through the glass. */
const reach = (depth: number) => 10 + depth * 6

/**
 * One layer's slice for one opening, in the opening's own space: the wall at
 * z = 0 and the room towards +z, with the floor at y = `floor`. Null if the
 * opening draws none of it.
 */
export function layerGeometry(place: LayerPlace, floor: number, { along = 0, from = -Infinity, to = Infinity }: Slice) {
  const a = Math.max(from, along - reach(place.depth))
  const b = Math.min(to, along + reach(place.depth))
  if (b <= a) return null
  const [y0, y1] = place.y
  const g = new PlaneGeometry(b - a, place.flat ? place.depth : y1 - y0)
  if (place.flat) {
    // lying down, the texture's top edge furthest from the wall
    g.rotateX(-Math.PI / 2)
    g.translate((a + b) / 2 - along, floor + y0, -place.depth / 2)
  } else {
    g.translate((a + b) / 2 - along, floor + (y0 + y1) / 2, -place.depth)
  }
  // the texture is pinned to the street, not to the slice
  const pos = g.attributes.position
  const uv = g.attributes.uv
  const [x0, x1] = place.x
  const [v0, v1] = place.v ?? place.y
  for (let i = 0; i < uv.count; i++) {
    uv.setX(i, (pos.getX(i) + along - x0) / (x1 - x0))
    if (!place.flat) uv.setY(i, (pos.getY(i) - floor - v0) / (v1 - v0))
  }
  // An empty bounding box: clicks pass through to nothing, and the window's
  // outline and click box stay the size of the window, not the street.
  g.boundingBox = new Box3()
  return g
}

/** A canvas made into a layer's texture, repeating along the street or smearing its edges. */
export function layerTexture(c: HTMLCanvasElement, repeat = false) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  t.wrapS = repeat ? RepeatWrapping : ClampToEdgeWrapping
  t.wrapT = ClampToEdgeWrapping
  return t
}

/** Runs `make` once, on first use, and hands back the same thing every time after. */
export function once<T>(make: () => T) {
  let made: T | undefined
  return () => (made ??= make())
}

/** A rectangular opening in a wall, in the wall plane's own space (origin at its centre). */
export interface Opening {
  x0: number
  x1: number
  y0: number
  y1: number
}

/**
 * Stands in for PlaneGeometry(width, height), UVs and all, with openings cut
 * right through it. One that reaches the bottom edge (a doorway) is cut as a
 * notch, and one that reaches both edges splits the plane in two.
 */
export function wallGeometry(width: number, height: number, openings: Opening[]) {
  const hw = width / 2
  const hh = height / 2
  const atBottom = (o: Opening) => o.y0 <= -hh + 1e-4
  const across = openings.filter((o) => atBottom(o) && o.y1 >= hh - 1e-4).sort((p, q) => p.x0 - q.x0)
  const strips: [number, number][] = []
  let left = -hw
  for (const o of across) {
    if (o.x0 > left) strips.push([left, o.x0])
    left = Math.max(left, o.x1)
  }
  if (left < hw) strips.push([left, hw])
  const shapes = strips.map(([a, b]) => {
    const within = openings.filter((o) => !across.includes(o) && o.x0 >= a && o.x1 <= b)
    const shape = new Shape()
    shape.moveTo(a, -hh)
    for (const o of within.filter(atBottom).sort((p, q) => p.x0 - q.x0)) {
      shape.lineTo(o.x0, -hh)
      shape.lineTo(o.x0, o.y1)
      shape.lineTo(o.x1, o.y1)
      shape.lineTo(o.x1, -hh)
    }
    shape.lineTo(b, -hh)
    shape.lineTo(b, hh)
    shape.lineTo(a, hh)
    shape.closePath()
    for (const o of within.filter((o) => !atBottom(o))) {
      const hole = new Path()
      hole.moveTo(o.x0, o.y0)
      hole.lineTo(o.x0, o.y1)
      hole.lineTo(o.x1, o.y1)
      hole.lineTo(o.x1, o.y0)
      hole.closePath()
      shape.holes.push(hole)
    }
    return shape
  })
  const g = new ShapeGeometry(shapes)
  const pos = g.attributes.position
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + hw) / width, (pos.getY(i) + hh) / height)
  return g
}
