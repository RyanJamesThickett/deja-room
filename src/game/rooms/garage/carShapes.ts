import { CylinderGeometry, ExtrudeGeometry, LatheGeometry, Shape, Vector2 } from 'three'
import type { Vec3 } from '../../mutations'
import { LIFT_TOP } from './layout'

/*
 * A small family hatchback, built from side profiles. Car space: the car
 * stands on y = 0, centred on the origin, nose towards -z. Profiles are drawn
 * with x = position along the car (z) and y = height, then extruded across
 * its width.
 */

export const CAR = {
  width: 1.78,
  /** Axles sit this far either side of the middle. */
  axle: 1.3,
  wheelX: 0.78,
  wheelR: 0.31,
  /** Where the bonnet meets the windscreen. */
  scuttle: -0.88,
  /** Bonnet hinge, and how far the open one is lifted (radians). */
  hinge: [0, 0.87, -0.9] as Vec3,
  bonnetOpen: 1.1,
  bonnetLength: 1.12,
}

const BEVEL = 0.02
const ARCH_R = 0.37

/** Front of the car, up to the windscreen: bumper face, bonnet line, front wheel arch. */
function frontProfile() {
  const s = new Shape()
  s.moveTo(CAR.scuttle, 0.3)
  s.lineTo(-CAR.axle + ARCH_R, 0.3)
  s.absarc(-CAR.axle, CAR.wheelR, ARCH_R, 0, Math.PI, false)
  s.lineTo(-CAR.axle - ARCH_R, 0.3)
  s.lineTo(-2.06, 0.3)
  s.lineTo(-2.09, 0.52)
  s.lineTo(-2.03, 0.71)
  s.lineTo(CAR.scuttle, 0.85)
  s.closePath()
  return s
}

/** Everything behind the windscreen base: sills, rear arch, hatch and rear bumper. */
function rearProfile() {
  const s = new Shape()
  s.moveTo(CAR.scuttle, 0.85)
  s.lineTo(1.62, 0.9)
  s.lineTo(2.03, 0.86)
  s.lineTo(2.09, 0.55)
  s.lineTo(2.05, 0.3)
  s.lineTo(CAR.axle + ARCH_R, 0.3)
  s.absarc(CAR.axle, CAR.wheelR, ARCH_R, 0, Math.PI, false)
  s.lineTo(CAR.axle - ARCH_R, 0.3)
  s.lineTo(CAR.scuttle, 0.3)
  s.closePath()
  return s
}

/** The glasshouse: windscreen, roof line and the hatchback's rear screen. */
function cabinProfile() {
  const s = new Shape()
  s.moveTo(CAR.scuttle + 0.02, 0.85)
  s.lineTo(-0.22, 1.36)
  s.lineTo(1.05, 1.38)
  s.lineTo(1.58, 0.9)
  s.closePath()
  return s
}

const extrude = (shape: Shape, depth: number, bevel = BEVEL) =>
  new ExtrudeGeometry(shape, { depth: depth - bevel * 2, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 18 })

/** Extruded along local z from 0; place with rotation [0, -PI/2, 0] at x = width/2 - bevel. */
export const FRONT_GEO = extrude(frontProfile(), CAR.width)
export const REAR_GEO = extrude(rearProfile(), CAR.width)
export const CABIN_GEO = extrude(cabinProfile(), 1.5, 0.03)
/** One front wing on its own, for the car whose bonnet is up. */
export const WING_GEO = extrude(frontProfile(), 0.07, 0.01)

/** Tyre cross-section spun round: lies flat (axis y), 0.31 m radius, 0.2 m wide. */
export const TYRE_GEO = new LatheGeometry(
  [
    [0.2, -0.1],
    [0.285, -0.1],
    [0.31, -0.075],
    [0.31, 0.075],
    [0.285, 0.1],
    [0.2, 0.1],
    [0.2, -0.1],
  ].map(([x, y]) => new Vector2(x, y)),
  40,
)
export const RIM_GEO = new CylinderGeometry(0.2, 0.2, 0.17, 32)
export const HUB_GEO = new CylinderGeometry(0.06, 0.06, 0.04, 16)
export const NUT_GEO = new CylinderGeometry(0.012, 0.012, 0.03, 6)

/** Where each wheel sits: front right, front left, rear right, rear left. */
export const WHEEL_SPOTS: { at: Vec3; side: 1 | -1 }[] = [
  { at: [CAR.wheelX, CAR.wheelR, -CAR.axle], side: 1 },
  { at: [-CAR.wheelX, CAR.wheelR, -CAR.axle], side: -1 },
  { at: [CAR.wheelX, CAR.wheelR, CAR.axle], side: 1 },
  { at: [-CAR.wheelX, CAR.wheelR, CAR.axle], side: -1 },
]

/** Sideways offset of the wobbly lift post at height `y`: an S-bend that runs straight into the floor and the beam. */
export function wobbleAt(y: number) {
  const t = y / LIFT_TOP
  return 0.12 * Math.sin(3 * Math.PI * t) * Math.sin(Math.PI * t)
}

/** A point on the open bonnet's underside, `along` metres from the hinge. */
export function bonnetPoint(x: number, along: number): Vec3 {
  const [, hy, hz] = CAR.hinge
  return [x, hy + along * Math.sin(CAR.bonnetOpen) - 0.03, hz - along * Math.cos(CAR.bonnetOpen)]
}
