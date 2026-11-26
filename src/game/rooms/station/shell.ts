import { BufferAttribute, BufferGeometry, DoubleSide, MeshBasicMaterial, MeshStandardMaterial, Path, Shape, ShapeGeometry } from 'three'
import { once } from '../../outsideLayers'
import { Builder, type Vec3 } from '../market/build'
import { DOORWAYS, HALL, PIT, PLATFORM_END, TRACKS, VAULT } from './plan'
import { ashlarTexture, glazingTexture, nightTexture, rainTexture, skyTexture, streetTexture } from './textures'

/*
 * The big fixed shapes of the building: the glass vault and its ironwork,
 * the glazed screens at each end of it, and the south wall with its
 * doorways. Shapes are in metres, so their UVs are too.
 */

const { halfX, wallH } = HALL
/** Angle round the vault's circle where it meets the top of the east wall. */
const A0 = Math.atan2(wallH - VAULT.cy, halfX)
const arcPoint = (a: number): [number, number] => [VAULT.r * Math.cos(a), VAULT.cy + VAULT.r * Math.sin(a)]

/**
 * A lunette: the end of the vault from height `bottom` up to the arc, as a
 * shape, with y measured from `origin`.
 */
export function lunette(bottom: number, origin: number) {
  const s = new Shape()
  s.moveTo(-halfX, bottom - origin)
  s.lineTo(halfX, bottom - origin)
  s.lineTo(halfX, wallH - origin)
  s.absarc(0, VAULT.cy - origin, VAULT.r, A0, Math.PI - A0, false)
  s.lineTo(-halfX, bottom - origin)
  return new ShapeGeometry(s, 48)
}

/** How far from (0, y0) along direction `a` before leaving the lunette (the arc or a side). */
export function spokeLength(y0: number, a: number) {
  const dx = Math.cos(a)
  const dy = Math.sin(a)
  // (t dx)² + (y0 + t dy - cy)² = r²
  const k = y0 - VAULT.cy
  const b = 2 * k * dy
  const c = k * k - VAULT.r * VAULT.r
  const t = (-b + Math.sqrt(b * b - 4 * c)) / 2
  const side = Math.abs(dx) > 1e-6 ? halfX / Math.abs(dx) : Infinity
  return Math.min(t, side)
}

/** The curved glass of the roof, from the north screen to the south, UVs in metres. */
export const vaultGeometry = once(() => {
  const n = 64
  const z0 = -HALL.halfZ
  const z1 = HALL.halfZ
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const a = A0 + ((Math.PI - 2 * A0) * i) / n
    const [x, y] = arcPoint(a)
    for (const z of [z0, z1]) {
      pos.push(x, y, z)
      nor.push(-Math.cos(a), -Math.sin(a), 0)
      uv.push(VAULT.r * (a - A0), z)
    }
  }
  for (let i = 0; i < n; i++) {
    const p = i * 2
    idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.setIndex(idx)
  return g
})

/** The roof's ironwork: arched ribs across, purlins along. One mesh. */
export const ironGeometry = once(() => {
  const b = new Builder()
  const n = 32
  const ribZ = Array.from({ length: 9 }, (_, k) => -HALL.halfZ + 0.12 + (k * (HALL.halfZ * 2 - 0.24)) / 8)
  for (const z of ribZ)
    for (let i = 0; i < n; i++) {
      const a0 = A0 + ((Math.PI - 2 * A0) * i) / n
      const a1 = A0 + ((Math.PI - 2 * A0) * (i + 1)) / n
      const am = (a0 + a1) / 2
      const len = VAULT.r * (a1 - a0) + 0.02
      const rr = VAULT.r - 0.22
      b.box([len, 0.4, 0.2], [rr * Math.cos(am), VAULT.cy + rr * Math.sin(am), z], '#f2eee4', [0, 0, am + Math.PI / 2])
    }
  for (let k = 1; k < 8; k++) {
    const a = A0 + ((Math.PI - 2 * A0) * k) / 8
    const rr = VAULT.r - 0.1
    b.box([0.14, 0.14, HALL.halfZ * 2], [rr * Math.cos(a), VAULT.cy + rr * Math.sin(a), 0], '#1d5a63', [0, 0, a])
  }
  // a cornice along the top of each side wall where the vault springs
  for (const s of [-1, 1]) b.box([0.5, 0.4, HALL.halfZ * 2], [s * (halfX - 0.2), wallH - 0.1, 0], '#e8202a')
  return b.merge()
})

/** Sunburst ironwork for an end screen: spokes from the middle of its base, and a ring round the hub. */
export function sunburst(y0: number, origin: number, spokes: number, colour: string) {
  const b = new Builder()
  for (let k = 0; k <= spokes; k++) {
    const a = (Math.PI * k) / spokes
    const len = spokeLength(y0, a)
    b.box([len, 0.14, 0.1], [(Math.cos(a) * len) / 2, y0 - origin + (Math.sin(a) * len) / 2, 0], colour, [0, 0, a])
  }
  // two arcs of transom across the spokes
  for (const r of [3.2, 6.4]) {
    const m = 40
    for (let i = 0; i < m; i++) {
      const a = (Math.PI * (i + 0.5)) / m
      const len = (Math.PI * r) / m + 0.02
      const p: Vec3 = [Math.cos(a) * r, y0 - origin + Math.sin(a) * r, 0]
      if (spokeLength(y0, a) < r) continue
      b.box([len, 0.12, 0.1], p, colour, [0, 0, a + Math.PI / 2])
    }
  }
  b.box([HALL.halfX * 2, 0.2, 0.12], [0, y0 - origin + 0.1, 0], colour)
  return b.merge()
}

/** The south wall's face, with its three arched doorways cut out. Built facing +z; turn it to face into the hall. */
export const southWallGeometry = once(() => {
  const s = new Shape()
  s.moveTo(-halfX, 0)
  s.lineTo(halfX, 0)
  s.lineTo(halfX, wallH)
  s.lineTo(-halfX, wallH)
  s.lineTo(-halfX, 0)
  for (const d of DOORWAYS) {
    const h = new Path()
    h.moveTo(d.x - d.half, 0)
    h.lineTo(d.x - d.half, d.spring)
    h.absarc(d.x, d.spring, d.half, Math.PI, 0, true)
    h.lineTo(d.x + d.half, 0)
    h.lineTo(d.x - d.half, 0)
    s.holes.push(h)
  }
  return new ShapeGeometry(s, 24)
})

/** Materials for the shell, made once. */
export const shellMaterials = once(() => {
  const glazing = glazingTexture().clone()
  glazing.repeat.set(1 / 1.5, 1 / 1.5)
  glazing.needsUpdate = true
  const ashlar = ashlarTexture().clone()
  ashlar.repeat.set(0.5, 1)
  ashlar.needsUpdate = true
  const night = nightTexture().clone()
  night.repeat.set(1 / 30, 1 / 7.5)
  night.offset.set(0.5, 0)
  night.needsUpdate = true
  return {
    glass: new MeshStandardMaterial({ map: glazing, transparent: true, depthWrite: false, side: DoubleSide, roughness: 0.2, metalness: 0.2 }),
    ashlar: new MeshStandardMaterial({ map: ashlar, roughness: 0.85 }),
    sky: new MeshBasicMaterial({ map: skyTexture(), side: DoubleSide, depthWrite: false, fog: false, toneMapped: false }),
    street: new MeshBasicMaterial({ map: streetTexture(), alphaTest: 0.5 }),
    night: new MeshBasicMaterial({ map: night }),
    rain: (() => {
      const map = rainTexture().clone()
      map.repeat.set(24 / 2, 8 / 4)
      map.needsUpdate = true
      return new MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: 0.3, opacity: 0.9 })
    })(),
    iron: new MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.3 }),
    canopyLight: new MeshStandardMaterial({ vertexColors: true, emissive: '#fff2cc', emissiveIntensity: 1.4, roughness: 0.5 }),
  }
})

/** The platforms beyond the barriers: raised islands between the track pits, as box parts. */
export const platformGeometry = once(() => {
  const b = new Builder()
  const z0 = -HALL.halfZ - 1
  const len = z0 - PLATFORM_END
  const zc = (z0 + PLATFORM_END) / 2
  const edges = [-halfX, ...TRACKS.flatMap((x) => [x - PIT.half, x + PIT.half]), halfX]
  for (let k = 0; k < edges.length; k += 2) {
    const [x0, x1] = [edges[k], edges[k + 1]]
    b.box([x1 - x0, PIT.depth, len], [(x0 + x1) / 2, -PIT.depth / 2, zc], '#9a948c')
    // yellow lines back from each edge that has a track beside it
    if (x0 > -halfX) b.box([0.1, 0.01, len], [x0 + 0.5, 0.004, zc], '#ffd21f')
    if (x1 < halfX) b.box([0.1, 0.01, len], [x1 - 0.5, 0.004, zc], '#ffd21f')
    // white edging slabs
    if (x0 > -halfX) b.box([0.3, 0.012, len], [x0 + 0.15, 0.003, zc], '#e8e4da')
    if (x1 < halfX) b.box([0.3, 0.012, len], [x1 - 0.15, 0.003, zc], '#e8e4da')
  }
  // rails
  for (const x of TRACKS) for (const s of [-1, 1]) b.box([0.07, 0.15, len + 1], [x + s * 0.72, -PIT.depth + 0.075, zc], '#b8bcc0')
  // the canopy over the platforms, its columns, and brick walls down each side
  b.box([halfX * 2, 0.3, len + 1], [0, 5.65, zc - 0.5], '#2e2a36')
  for (const x of [-12.65, -6, 0, 6, 12.65]) for (let z = z0 - 6; z > PLATFORM_END + 2; z -= 9) b.box([0.22, 5.5, 0.22], [x, 2.75, z], '#1d5a63')
  for (const s of [-1, 1]) b.box([0.4, 6.8, len + 1], [s * (halfX + 0.2), 2.3, zc - 0.5], '#6a3a3a')
  return b.merge()
})

/** Light strips under the canopy, one along each platform. */
export const canopyLightGeometry = once(() => {
  const b = new Builder()
  const z0 = -HALL.halfZ - 1.5
  const zc = (z0 + PLATFORM_END) / 2
  for (const x of [-12.65, -6, 0, 6, 12.65]) b.box([0.3, 0.06, z0 - PLATFORM_END - 2], [x, 5.47, zc], '#fff2cc')
  return b.merge()
})
