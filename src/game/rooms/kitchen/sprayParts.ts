import { AdditiveBlending, BufferAttribute, CapsuleGeometry, ConeGeometry, CylinderGeometry, DoubleSide, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Shape, ShapeGeometry, SphereGeometry } from 'three'
import { once } from '../../outsideLayers'

/** Length of one piece of the thrashing hose. */
export const SEG = 0.062
/** Length of the cone of spray out of the nozzle. */
export const JET_LEN = 0.42

/** The cone of spray from the nozzle, opening away along +z, bright at the nozzle and fading out to nothing. */
function jetGeometry() {
  const g = new ConeGeometry(0.1, JET_LEN, 20, 6, true).rotateX(-Math.PI / 2)
  const pos = g.attributes.position
  const col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    // z runs from -JET_LEN/2 at the nozzle to +JET_LEN/2 at the open end
    const k = 0.75 * (1 - (pos.getZ(i) / JET_LEN + 0.5)) ** 1.5
    col.set([k * 0.9, k * 0.95, k], i * 3)
  }
  g.setAttribute('color', new BufferAttribute(col, 3))
  return g
}

/** Shared geometry and materials for the sink's thrashing spray arm. */
export const SPRAY = {
  hose: new CylinderGeometry(0.012, 0.012, SEG + 0.008, 10),
  knuckle: new SphereGeometry(0.012, 10, 8),
  rubber: new MeshStandardMaterial({ color: '#3a3d42', roughness: 0.5 }),
  jet: jetGeometry(),
  mist: new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }),
  // one drop: a little round blob, stretched into a streak while it flies
  drop: new SphereGeometry(0.012, 6, 4),
  water: new MeshStandardMaterial({ color: '#eef8ff', emissive: '#7a9ab0', emissiveIntensity: 0.5, transparent: true, opacity: 0.9, roughness: 0.05 }),
  wet: new MeshPhysicalMaterial({ color: '#7f9fb0', transparent: true, opacity: 0.5, roughness: 0.02, clearcoat: 1, depthWrite: false }),
  trickle: new CapsuleGeometry(0.005, 0.06, 4, 6),
}

/** A splashy puddle on the floor, lumpy round the edge. */
export const puddleGeometry = once(() => {
  const shape = new Shape()
  const n = 48
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = 0.32 * (1 + 0.22 * Math.sin(a * 3 + 0.4) + 0.12 * Math.sin(a * 5 + 1.3) + 0.06 * Math.sin(a * 9))
    const x = Math.cos(a) * r * 1.3
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  return new ShapeGeometry(shape)
})
