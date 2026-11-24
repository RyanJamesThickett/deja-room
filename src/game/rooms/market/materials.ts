import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry } from 'three'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import type { Placement } from '../../kit'
import { signsTexture } from './cityPlan'
import { brickTexture, pavingTexture, renderTexture, shopAtlas, skyTexture, stoneTexture, tarmacTexture, windowAtlas } from './textures'

/* Materials shared across the market, made once. */

export const cityMaterials = once(() => ({
  brick: new MeshStandardMaterial({ map: brickTexture(), vertexColors: true, roughness: 0.92 }),
  stone: new MeshStandardMaterial({ map: stoneTexture(), vertexColors: true, roughness: 0.88 }),
  render: new MeshStandardMaterial({ map: renderTexture(), vertexColors: true, roughness: 0.85 }),
  trim: new MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }),
  glass: new MeshStandardMaterial({ map: windowAtlas(), roughness: 0.25, metalness: 0.15 }),
  shop: new MeshStandardMaterial({ map: shopAtlas(), roughness: 0.3, metalness: 0.1, emissive: '#ffffff', emissiveMap: shopAtlas(), emissiveIntensity: 0.12 }),
  signs: new MeshStandardMaterial({ map: signsTexture(), roughness: 0.5 }),
  sky: new MeshBasicMaterial({ map: skyTexture(), side: DoubleSide, depthWrite: false, fog: false, toneMapped: false }),
  paving: (() => {
    const map = pavingTexture().clone()
    map.repeat.set(16, 13)
    map.needsUpdate = true
    return new MeshStandardMaterial({ map, roughness: 0.85 })
  })(),
  tarmac: (() => {
    const map = tarmacTexture().clone()
    map.repeat.set(30, 30)
    map.needsUpdate = true
    return new MeshStandardMaterial({ map, roughness: 0.95 })
  })(),
}))

/** Plain materials many things share. */
export const MAT = {
  iron: new MeshStandardMaterial({ color: '#1f2a24', roughness: 0.45, metalness: 0.6 }),
  steel: new MeshStandardMaterial({ color: '#a9adb2', roughness: 0.35, metalness: 0.8 }),
  chrome: new MeshStandardMaterial({ color: '#dfe3e6', roughness: 0.12, metalness: 1 }),
  black: new MeshStandardMaterial({ color: '#151515', roughness: 0.6 }),
  rubber: new MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 }),
  wood: new MeshStandardMaterial({ color: '#a8743f', roughness: 0.75 }),
  darkWood: new MeshStandardMaterial({ color: '#5a3a22', roughness: 0.7 }),
  paleWood: new MeshStandardMaterial({ color: '#d2b07a', roughness: 0.8 }),
  stone: new MeshStandardMaterial({ color: '#cfc7b6', roughness: 0.85 }),
  darkStone: new MeshStandardMaterial({ color: '#9b9384', roughness: 0.9 }),
  brass: new MeshStandardMaterial({ color: '#c9a13f', roughness: 0.3, metalness: 0.9 }),
  bronze: new MeshStandardMaterial({ color: '#5f7a5a', roughness: 0.45, metalness: 0.7 }),
  white: new MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.6 }),
  glass: new MeshStandardMaterial({ color: '#9fb4bf', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.35, depthWrite: false }),
  darkGlass: new MeshStandardMaterial({ color: '#27313a', roughness: 0.08, metalness: 0.4 }),
  cardboard: new MeshStandardMaterial({ color: '#b88a55', roughness: 0.95 }),
  string: new MeshStandardMaterial({ color: '#e8e2d0', roughness: 0.9 }),
  /** Vertex-coloured, for baked shapes like the snail's shell. */
  shell: new MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }),
  vinyl: new MeshStandardMaterial({ color: '#0e0e10', roughness: 0.22, side: DoubleSide }),
  slime: new MeshStandardMaterial({ color: '#d8e2c8', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.5 }),
}

/** Cobbles laid in rings round the fountain, from `r0` to `r1`, and their colours. */
export const fountainCobbles = once(() => {
  const rng = mulberry32(81)
  const items: Placement[] = []
  const colours: string[] = []
  const shades = ['#8d8a84', '#7a7670', '#a19c92', '#6e6a64', '#958f86']
  for (let r = 2.28; r < 3.3; r += 0.105) {
    const n = Math.floor((2 * Math.PI * r) / 0.105)
    const off = rng()
    for (let i = 0; i < n; i++) {
      const a = ((i + off) / n) * Math.PI * 2
      const s = 0.85 + rng() * 0.3
      items.push({ at: [Math.cos(a) * r, 0, Math.sin(a) * r], rot: [0, -a + (rng() - 0.5) * 0.3, 0], scale: [s, 0.8 + rng() * 0.5, s] })
      colours.push(shades[Math.floor(rng() * shades.length)])
    }
  }
  return { items, colours }
})

/** A cobble: a low dome, 9 cm across. */
export const COBBLE = new SphereGeometry(0.05, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.5, 1)
export const COBBLE_MAT = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 })
