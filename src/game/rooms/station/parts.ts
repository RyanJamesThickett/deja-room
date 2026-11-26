import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  LatheGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  type Texture,
} from 'three'
import { cached } from '../market/build'

/* Geometry and materials shared across the station, made once. */

export const BOX = new BoxGeometry(1, 1, 1)
export const CYL = new CylinderGeometry(1, 1, 1, 28)
/** A cheap round bar, for rods, legs and handles. */
export const ROD = new CylinderGeometry(1, 1, 1, 8)
export const BALL = new SphereGeometry(1, 20, 14)
export const BALL_LOW = new SphereGeometry(1, 10, 7)
export const PLANE = new PlaneGeometry(1, 1)
export const RING = new TorusGeometry(1, 0.06, 8, 32)

export const lathe = (profile: [number, number][], segments = 24) => new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), segments)

export const gloss = cached((colour: string) => new MeshStandardMaterial({ color: colour, roughness: 0.32 }))
export const matte = cached((colour: string) => new MeshStandardMaterial({ color: colour, roughness: 0.85 }))
export const metal = cached((colour: string) => new MeshStandardMaterial({ color: colour, roughness: 0.32, metalness: 0.75 }))
/** Something lit from inside: a lamp globe, an indicator. */
export const glow = cached((colour: string) => new MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: 1.6, roughness: 0.4 }))
/** Printed: a sign, a poster, a page. */
export const printed = cached((map: Texture) => new MeshStandardMaterial({ map, roughness: 0.55 }))
/** Printed on both sides, for things that hang in the air. */
export const printed2 = cached((map: Texture) => new MeshStandardMaterial({ map, roughness: 0.6, side: DoubleSide }))
/** A screen or a backlit sign: shows its picture whatever the lighting. */
export const shining = cached((map: Texture) => new MeshStandardMaterial({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.85, roughness: 0.3 }))
/** Cut out round its alpha (a flag of tape, a paper with a ragged edge). */
export const cutout = cached((map: Texture) => new MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 0.7, side: DoubleSide }))

export const MAT = {
  iron: new MeshStandardMaterial({ color: '#1f2a30', roughness: 0.45, metalness: 0.6 }),
  steel: new MeshStandardMaterial({ color: '#aeb3b8', roughness: 0.3, metalness: 0.8 }),
  chrome: new MeshStandardMaterial({ color: '#e2e6ea', roughness: 0.12, metalness: 1 }),
  black: new MeshStandardMaterial({ color: '#161616', roughness: 0.6 }),
  rubber: new MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.9 }),
  white: new MeshStandardMaterial({ color: '#f3f1ea', roughness: 0.55 }),
  paleWood: new MeshStandardMaterial({ color: '#d6ad6e', roughness: 0.7 }),
  wood: new MeshStandardMaterial({ color: '#9a6232', roughness: 0.7 }),
  darkWood: new MeshStandardMaterial({ color: '#4e2f1c', roughness: 0.65 }),
  stone: new MeshStandardMaterial({ color: '#d9cfbb', roughness: 0.85 }),
  bronze: new MeshStandardMaterial({ color: '#6f8a6a', roughness: 0.42, metalness: 0.65 }),
  brass: new MeshStandardMaterial({ color: '#d4a63e', roughness: 0.28, metalness: 0.9 }),
  glass: new MeshStandardMaterial({ color: '#b9d2de', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false }),
  darkGlass: new MeshStandardMaterial({ color: '#1d2733', roughness: 0.08, metalness: 0.4 }),
  /** Vertex-coloured, for baked shapes (pigeons, the roof's ironwork). */
  baked: new MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
  bakedMetal: new MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.45 }),
}

/** The pop palette everything in the station is painted from. */
export const POP = {
  red: '#ff3131',
  blue: '#1f6bff',
  yellow: '#ffd21f',
  green: '#22b56a',
  pink: '#ff3fa4',
  violet: '#8a4dff',
  cyan: '#16c6f0',
  orange: '#ff8a1f',
  teal: '#12a19a',
  cream: '#f4ecd8',
  ink: '#141414',
}

/**
 * A plane `w` × `h` (facing +z) whose texture repeats every `tileW` × `tileH`
 * metres, without touching the texture's own repeat (so one texture can
 * cover planes of any size).
 */
export const tiledPlane = cached((key: string) => {
  const [w, h, tileW, tileH] = key.split(',').map(Number)
  const g = new PlaneGeometry(w, h)
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tileW, (uv.getY(i) * h) / tileH)
  return g
})
export const tiled = (w: number, h: number, tileW: number, tileH = tileW) => tiledPlane([w, h, tileW, tileH].join(','))
