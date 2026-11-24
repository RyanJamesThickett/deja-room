import { Path, Shape, ShapeGeometry } from 'three'

/**
 * Stands in for PlaneGeometry(width, height), UVs and all, with a round hole
 * of radius `r` centred at (x, y) in the plane's own space (origin at its
 * centre): the hull behind the airlock hatch.
 */
export function wallWithPorthole(width: number, height: number, x: number, y: number, r: number) {
  const hw = width / 2
  const hh = height / 2
  const shape = new Shape()
  shape.moveTo(-hw, -hh)
  shape.lineTo(hw, -hh)
  shape.lineTo(hw, hh)
  shape.lineTo(-hw, hh)
  shape.closePath()
  const hole = new Path()
  hole.absarc(x, y, r, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const g = new ShapeGeometry(shape, 48)
  const pos = g.attributes.position
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + hw) / width, (pos.getY(i) + hh) / height)
  return g
}
