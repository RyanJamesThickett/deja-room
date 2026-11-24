import { mulberry32 } from '../../rng'
import { age, canvas, clouds, ellipse, finish, poly, type G, type Sitter } from './textures'

/*
 * The smaller pictures hung salon-style round the big ones: little
 * landscapes, flower pieces and portraits, each drawn from a seed so no two
 * match, plus the Dutch meadow with its cows.
 */

/** More sitters for the small portraits, so the wall isn't one face over and over. */
export const SITTERS: Sitter[] = [
  { coat: '#2b2b2b', skin: '#d8b090', hair: '#8e8a84', bg: '#2e3528' },
  { coat: '#3d5a2a', skin: '#f0cdb0', hair: '#c08a3e', bg: '#3a2c22', long: true },
  { coat: '#4a2a4e', skin: '#e6c0a0', hair: '#1e140c', bg: '#26221e' },
  { coat: '#7a5a22', skin: '#d9a982', hair: '#2a1a10', bg: '#33291f', long: true },
]

function tree(g: G, rng: () => number, x: number, y: number, s: number, dark: string, light: string) {
  g.fillStyle = '#3b2a1a'
  g.fillRect(x - 3 * s, y, 6 * s, 26 * s)
  for (let k = 0; k < 7; k++) ellipse(g, x + (rng() - 0.5) * 36 * s, y - 8 * s + (rng() - 0.5) * 30 * s, 16 * s, 14 * s, k % 2 ? dark : light)
}

/** A small landscape: a sky, a ridge or two, fields and a few trees. Each seed is a different view. */
export function miniLandscapeTexture(seed: number) {
  const W = 448
  const H = 320
  const [c, g] = canvas(W, H)
  const rng = mulberry32(seed)
  const skies = [
    ['#6f8fb5', '#e9d9b0'],
    ['#8a7fa0', '#f1c58f'],
    ['#9fb6c4', '#dfe4d8'],
    ['#4f6a8e', '#d9b98a'],
  ]
  const [top, low] = skies[seed % skies.length]
  const horizon = 150 + rng() * 40
  const sky = g.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, top)
  sky.addColorStop(1, low)
  g.fillStyle = sky
  g.fillRect(0, 0, W, horizon + 10)
  clouds(g, rng, 3 + Math.floor(rng() * 3), W, 20, horizon - 50, 'rgba(255,250,240,0.35)')
  const ridge: [number, number][] = [[0, horizon]]
  for (let x = 0; x <= W; x += 56) ridge.push([x, horizon - 10 - rng() * 40])
  ridge.push([W, horizon + 20], [0, horizon + 20])
  poly(g, '#8a97a6', ridge)
  const greens = ['#6f7d3a', '#7d8a48', '#5d6b34', '#8b8a4a']
  g.fillStyle = greens[seed % greens.length]
  g.fillRect(0, horizon, W, H - horizon)
  // a river or a road winding off into the distance
  if (rng() < 0.5) poly(g, '#a9bcc0', [[W * 0.45, horizon], [W * 0.52, horizon], [W * 0.7, H], [W * 0.3, H]])
  else {
    g.strokeStyle = '#b59b66'
    g.lineWidth = 10
    g.beginPath()
    g.moveTo(W * 0.2, H)
    g.bezierCurveTo(W * 0.4, horizon + 60, W * 0.6, horizon + 30, W * 0.55, horizon)
    g.stroke()
  }
  for (let i = 0; i < 4; i++) tree(g, rng, rng() * W, horizon + 10 + rng() * 60, 0.8 + rng() * 0.9, '#2f3d1f', '#43552a')
  // a church spire or a cottage on the ridge
  if (rng() < 0.5) {
    const x = 80 + rng() * 280
    g.fillStyle = '#d9cfb6'
    g.fillRect(x, horizon - 16, 22, 18)
    poly(g, '#6b6458', [[x + 4, horizon - 16], [x + 11, horizon - 56], [x + 18, horizon - 16]])
  }
  age(g, W, H, seed * 7 + 3)
  return finish(c)
}

/** A Dutch flower piece: a dark ground, a stone ledge and a vase spilling blooms. */
export function flowersTexture(seed: number) {
  const W = 352
  const H = 448
  const [c, g] = canvas(W, H)
  const rng = mulberry32(seed)
  const bg = g.createRadialGradient(176, 180, 20, 176, 220, 320)
  bg.addColorStop(0, '#3a3224')
  bg.addColorStop(1, '#0e0b08')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#5a4c3a'
  g.fillRect(0, 360, W, 88)
  g.fillStyle = '#3c3226'
  g.fillRect(0, 360, W, 8)
  // the vase
  g.fillStyle = seed % 2 ? '#8c8f92' : '#5d4632'
  g.beginPath()
  g.moveTo(140, 362)
  g.bezierCurveTo(110, 320, 120, 280, 150, 262)
  g.lineTo(202, 262)
  g.bezierCurveTo(232, 280, 242, 320, 212, 362)
  g.fill()
  // stems, leaves and flowers
  const blooms = ['#e8e0cc', '#d0453a', '#e9b23a', '#c75478', '#f1efe4', '#8a3fa0']
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI / 2 + (rng() - 0.5) * 2.4
    const r = 60 + rng() * 130
    const x = 176 + Math.cos(a) * r * 0.9
    const y = 250 + Math.sin(a) * r
    g.strokeStyle = '#3d5228'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(176, 262)
    g.quadraticCurveTo((176 + x) / 2 + (rng() - 0.5) * 30, (262 + y) / 2, x, y)
    g.stroke()
    if (i % 3 === 0) ellipse(g, x + 10, y + 16, 14, 6, '#4b6a30', rng() * 3)
  }
  for (let i = 0; i < 22; i++) {
    const a = -Math.PI / 2 + (rng() - 0.5) * 2.4
    const r = 60 + rng() * 130
    const x = 176 + Math.cos(a) * r * 0.9
    const y = 250 + Math.sin(a) * r
    const col = blooms[Math.floor(rng() * blooms.length)]
    const s = 10 + rng() * 12
    for (let k = 0; k < 6; k++) ellipse(g, x + Math.cos(k) * s * 0.6, y + Math.sin(k) * s * 0.6, s * 0.6, s * 0.5, col, k)
    ellipse(g, x, y, s * 0.3, s * 0.3, 'rgba(60,30,10,0.6)')
  }
  // a fallen petal and a fly on the ledge, as the Dutch liked
  ellipse(g, 250, 384, 8, 4, '#d0453a', 0.4)
  ellipse(g, 98, 380, 3, 2, '#111')
  age(g, W, H, seed * 11 + 5)
  return finish(c)
}

export type PastureMode = 'normal' | 'ufo'

/** A cow, side on: black and white or brown, facing right unless `flip`. */
function cow(g: G, x: number, y: number, s: number, coat: string, patch: string, flip = false) {
  g.save()
  g.translate(x, y)
  g.scale(flip ? -s : s, s)
  g.fillStyle = coat
  for (const lx of [-22, -12, 14, 22]) g.fillRect(lx - 3, 4, 6, 22)
  g.beginPath()
  g.roundRect(-30, -16, 60, 26, 10)
  g.fill()
  ellipse(g, 36, -10, 10, 8, coat)
  ellipse(g, 44, -6, 6, 5, '#d8a89a')
  ellipse(g, -6, -6, 9, 7, patch)
  ellipse(g, 14, -2, 7, 6, patch)
  ellipse(g, 32, -18, 3, 2, '#e8e0cc')
  g.restore()
}

/**
 * A flat Dutch meadow with a windmill and cows. In `ufo` one of the cows is
 * rising up a beam of light into a flying saucer.
 */
export function pastureTexture(mode: PastureMode) {
  const W = 640
  const H = 448
  const [c, g] = canvas(W, H)
  const rng = mulberry32(61)
  const sky = g.createLinearGradient(0, 0, 0, 280)
  sky.addColorStop(0, '#7f96b0')
  sky.addColorStop(1, '#e8e2cc')
  g.fillStyle = sky
  g.fillRect(0, 0, W, 290)
  clouds(g, rng, 8, W, 30, 200, 'rgba(250,248,240,0.45)')
  g.fillStyle = '#6f7f3c'
  g.fillRect(0, 280, W, H - 280)
  g.fillStyle = '#5c6a30'
  g.fillRect(0, 280, W, 10)
  // a ditch of water running off to the horizon
  poly(g, '#b3c4c6', [[380, 282], [392, 282], [470, 448], [420, 448]])
  // the windmill
  g.fillStyle = '#5a4a3a'
  poly(g, '#5a4a3a', [[96, 282], [108, 200], [132, 200], [144, 282]])
  poly(g, '#3a2e24', [[104, 204], [120, 184], [136, 204]])
  g.strokeStyle = '#3a2e24'
  g.lineWidth = 5
  for (const a of [0.4, 0.4 + Math.PI / 2, 0.4 + Math.PI, 0.4 + (3 * Math.PI) / 2]) {
    g.beginPath()
    g.moveTo(120, 196)
    g.lineTo(120 + Math.cos(a) * 70, 196 + Math.sin(a) * 70)
    g.stroke()
  }
  tree(g, rng, 560, 262, 1.1, '#2f3d1f', '#43552a')
  tree(g, rng, 600, 270, 0.8, '#2f3d1f', '#43552a')
  cow(g, 210, 340, 1.3, '#1c1a18', '#efe9dc')
  cow(g, 520, 380, 1.6, '#7a4a2a', '#e8dcc8', true)
  if (mode === 'ufo') {
    // the beam, the saucer, and a cow on its way up, legs dangling
    const beam = g.createLinearGradient(0, 110, 0, 360)
    beam.addColorStop(0, 'rgba(255,246,170,0.8)')
    beam.addColorStop(1, 'rgba(255,246,170,0.25)')
    g.fillStyle = beam
    g.beginPath()
    g.moveTo(320, 118)
    g.lineTo(384, 118)
    g.lineTo(440, 372)
    g.lineTo(264, 372)
    g.fill()
    ellipse(g, 352, 110, 112, 24, '#4d545c')
    ellipse(g, 352, 102, 108, 15, '#9aa3ab')
    ellipse(g, 352, 84, 42, 26, '#8fd0e0')
    for (const x of [270, 310, 352, 394, 434]) ellipse(g, x, 116, 7, 4, '#ffe27a')
    g.save()
    g.translate(352, 236)
    g.rotate(0.5)
    cow(g, 0, 0, 1.6, '#1c1a18', '#efe9dc')
    g.restore()
  } else {
    cow(g, 340, 310, 1.0, '#1c1a18', '#efe9dc', true)
  }
  age(g, W, H, 67)
  return finish(c)
}
