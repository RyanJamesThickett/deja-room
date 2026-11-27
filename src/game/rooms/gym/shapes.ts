import { CatmullRomCurve3, LatheGeometry, TubeGeometry, Vector2, Vector3 } from 'three'

/*
 * Module-level geometry for the gym's round things: weight plates and water
 * bottles turned on a lathe, and the kettlebell's handle.
 */

/**
 * A lathe whose profile corners stay crisp: each corner is cut by a tiny
 * chamfer `eps` long, so the smoothed normals only bend across that sliver
 * instead of shading the whole face. Trace the profile anticlockwise (x out,
 * y up) and the faces point outwards.
 */
export function sharpLathe(profile: [number, number][], segments: number, eps = 0.01) {
  const pts: Vector2[] = []
  for (let i = 0; i < profile.length - 1; i++) {
    const a = new Vector2(...profile[i])
    const b = new Vector2(...profile[i + 1])
    const step = b.clone().sub(a)
    const len = step.length()
    if (len === 0) continue
    const e = Math.min(eps, len / 3)
    step.multiplyScalar(e / len)
    pts.push(a.clone().add(step), b.clone().sub(step))
  }
  // close the loop
  if (profile[0][0] === profile.at(-1)![0] && profile[0][1] === profile.at(-1)![1]) pts.push(pts[0].clone())
  return new LatheGeometry(pts, segments)
}

/**
 * A weight plate one unit across (radius 1) and one unit thick along y: a
 * raised rim, recessed faces, a raised hub and a hole through the middle.
 * Scale it [radius, thickness, radius].
 */
export const PLATE_GEO = sharpLathe(
  [
    [1, -0.42],
    [1, 0.42],
    [0.95, 0.5],
    [0.84, 0.5],
    [0.8, 0.28],
    [0.3, 0.28],
    [0.26, 0.5],
    [0.13, 0.5],
    [0.13, -0.5],
    [0.26, -0.5],
    [0.3, -0.28],
    [0.8, -0.28],
    [0.84, -0.5],
    [0.95, -0.5],
    [1, -0.42],
  ],
  40,
  0.02,
)

/** Kettlebell handle for a bell of radius 1 centred at y = 1: two horns rising out of the shoulders into a flat grip. */
export const KB_HANDLE_GEO = (() => {
  const curve = new CatmullRomCurve3(
    [
      new Vector3(-0.5, 1.6, 0),
      new Vector3(-0.6, 1.95, 0),
      new Vector3(-0.42, 2.18, 0),
      new Vector3(0, 2.24, 0),
      new Vector3(0.42, 2.18, 0),
      new Vector3(0.6, 1.95, 0),
      new Vector3(0.5, 1.6, 0),
    ],
    false,
    'catmullrom',
    0.4,
  )
  return new TubeGeometry(curve, 40, 0.12, 12, false)
})()

/**
 * The water cooler's bottle, upside down: neck at the bottom (in the cooler's
 * socket), shoulders, a ridged body and a rounded base on top. y = 0 at the tip of the neck.
 */
export const BOTTLE_GEO = sharpLathe(
  [
    [0, 0],
    [0.035, 0],
    [0.035, 0.07],
    [0.06, 0.09],
    [0.122, 0.13],
    [0.135, 0.17],
    [0.135, 0.24],
    [0.128, 0.255],
    [0.135, 0.27],
    [0.135, 0.34],
    [0.128, 0.355],
    [0.135, 0.37],
    [0.135, 0.46],
    [0.12, 0.49],
    [0, 0.5],
  ],
  32,
  0.006,
)

/** The water inside, filling the neck and most of the body. */
export const WATER_GEO = sharpLathe(
  [
    [0, 0.005],
    [0.03, 0.005],
    [0.03, 0.07],
    [0.055, 0.09],
    [0.117, 0.13],
    [0.128, 0.17],
    [0.128, 0.4],
    [0, 0.4],
  ],
  32,
  0.006,
)
