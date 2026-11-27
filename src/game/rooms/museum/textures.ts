import { CanvasTexture, ClampToEdgeWrapping, SRGBColorSpace } from 'three'
import { mulberry32 } from '../../rng'
import { PORTRAIT_EYES } from './plan'

/*
 * Every picture in the gallery is painted on a canvas at load time: the old
 * masters, their plaques, the signs, and the frosted skylight overhead.
 * Each swap redraws the whole canvas with just one detail changed.
 */

export type G = CanvasRenderingContext2D

export function canvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

export function finish(c: HTMLCanvasElement) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  t.wrapS = t.wrapT = ClampToEdgeWrapping
  return t
}

export function ellipse(g: G, x: number, y: number, rx: number, ry: number, colour: string, rot = 0) {
  g.fillStyle = colour
  g.beginPath()
  g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
  g.fill()
}

export function poly(g: G, colour: string, pts: [number, number][]) {
  g.fillStyle = colour
  g.beginPath()
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.closePath()
  g.fill()
}

/** Visible brushwork, a yellowed varnish and fine cracks, so it reads as an old oil painting. */
export function age(g: G, w: number, h: number, seed: number, cracks = true) {
  const rng = mulberry32(seed)
  for (let i = 0; i < (w * h) / 90; i++) {
    const light = rng() < 0.5
    g.strokeStyle = light ? `rgba(255,240,210,${rng() * 0.07})` : `rgba(20,10,0,${rng() * 0.08})`
    g.lineWidth = 1 + rng() * 2.5
    const x = rng() * w
    const y = rng() * h
    const a = rng() * Math.PI
    const l = 3 + rng() * 9
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    g.stroke()
  }
  if (cracks) {
    g.strokeStyle = 'rgba(15,8,0,0.16)'
    g.lineWidth = 0.7
    for (let i = 0; i < (w * h) / 2500; i++) {
      let x = rng() * w
      let y = rng() * h
      g.beginPath()
      g.moveTo(x, y)
      for (let k = 0; k < 4; k++) {
        x += (rng() - 0.5) * 22
        y += (rng() - 0.5) * 22
        g.lineTo(x, y)
      }
      g.stroke()
    }
  }
  g.fillStyle = 'rgba(150,100,20,0.1)'
  g.fillRect(0, 0, w, h)
  // darker towards the edges, where the frame's rebate shades it
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.3)')
  g.fillStyle = v
  g.fillRect(0, 0, w, h)
}

export function clouds(g: G, rng: () => number, n: number, w: number, top: number, bottom: number, colour: string) {
  for (let i = 0; i < n; i++) {
    const cx = rng() * w
    const cy = top + rng() * (bottom - top)
    for (let k = 0; k < 9; k++) ellipse(g, cx + (rng() - 0.5) * 90, cy + (rng() - 0.5) * 18, 20 + rng() * 34, 10 + rng() * 14, colour)
  }
}

// ---------------------------------------------------------------------------
// The star painting: a pastoral landscape with a lake
// ---------------------------------------------------------------------------

export type LandscapeMode = 'normal' | 'sitter' | 'monster'

export function landscapeTexture(mode: LandscapeMode) {
  const W = 768
  const H = 512
  const [c, g] = canvas(W, H)
  const rng = mulberry32(31)
  const sky = g.createLinearGradient(0, 0, 0, 280)
  sky.addColorStop(0, '#5f80a8')
  sky.addColorStop(0.6, '#b7c2c2')
  sky.addColorStop(1, '#ecd6a4')
  g.fillStyle = sky
  g.fillRect(0, 0, W, 300)
  const sun = g.createRadialGradient(570, 215, 5, 570, 215, 160)
  sun.addColorStop(0, 'rgba(255,240,190,0.9)')
  sun.addColorStop(1, 'rgba(255,240,190,0)')
  g.fillStyle = sun
  g.fillRect(0, 0, W, 300)
  clouds(g, rng, 7, W, 40, 170, 'rgba(250,246,235,0.35)')
  // far mountains, then a nearer blue-green ridge
  poly(g, '#8e9db3', [[0, 250], [90, 205], [170, 228], [260, 180], [340, 222], [430, 196], [520, 232], [640, 200], [768, 236], [768, 300], [0, 300]])
  poly(g, '#6f8577', [[0, 272], [120, 248], [230, 268], [330, 252], [470, 276], [600, 254], [768, 270], [768, 310], [0, 310]])
  // midground meadow and the lake in it
  g.fillStyle = '#76863f'
  g.fillRect(0, 290, W, 222)
  const lake = g.createLinearGradient(0, 300, 0, 360)
  lake.addColorStop(0, '#c9d6d2')
  lake.addColorStop(1, '#7d9ca8')
  ellipse(g, 290, 330, 250, 30, '#5b6e3a')
  g.fillStyle = lake
  g.beginPath()
  g.ellipse(290, 330, 238, 24, 0, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = 'rgba(255,255,240,0.5)'
  g.lineWidth = 2
  for (let i = 0; i < 12; i++) {
    const x = 120 + rng() * 330
    const y = 318 + rng() * 22
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + 20 + rng() * 30, y)
    g.stroke()
  }
  // foreground slope
  g.fillStyle = '#4f5b2b'
  g.beginPath()
  g.moveTo(0, 390)
  g.bezierCurveTo(200, 360, 420, 420, 768, 372)
  g.lineTo(768, 512)
  g.lineTo(0, 512)
  g.fill()
  // a path winding up to the cottage
  g.strokeStyle = '#b39a64'
  g.lineWidth = 9
  g.beginPath()
  g.moveTo(420, 512)
  g.bezierCurveTo(470, 440, 520, 380, 560, 340)
  g.stroke()
  // cottage
  g.fillStyle = '#e6dcc0'
  g.fillRect(545, 314, 40, 26)
  poly(g, '#8e3a28', [[540, 316], [565, 296], [590, 316]])
  g.fillStyle = '#3a2c20'
  g.fillRect(560, 326, 8, 14)
  // clumps of trees
  for (const [x, y, s] of [
    [70, 330, 1.3],
    [130, 345, 1],
    [655, 330, 1.2],
    [710, 342, 1.4],
    [30, 400, 1.6],
  ] as const) {
    g.fillStyle = '#3b2a1a'
    g.fillRect(x - 3 * s, y, 6 * s, 30 * s)
    for (let k = 0; k < 7; k++) ellipse(g, x + (rng() - 0.5) * 40 * s, y - 10 * s + (rng() - 0.5) * 34 * s, 18 * s, 16 * s, k % 2 ? '#2f3d1f' : '#3e4f27')
  }
  // grazing sheep
  for (const [x, y] of [
    [230, 420],
    [262, 428],
    [610, 410],
  ])
    ellipse(g, x, y, 9, 6, '#ece6d6')

  if (mode === 'monster') {
    // a long neck and three humps breaking the surface of the lake
    g.fillStyle = '#2c4334'
    for (const x of [200, 236, 270]) {
      g.beginPath()
      g.ellipse(x, 332, 13, 11, 0, Math.PI, 0)
      g.fill()
    }
    g.strokeStyle = '#2c4334'
    g.lineWidth = 11
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(312, 332)
    g.bezierCurveTo(318, 300, 300, 290, 322, 276)
    g.stroke()
    ellipse(g, 330, 274, 13, 8, '#2c4334', -0.2)
    ellipse(g, 334, 271, 2, 2, '#e8e0a0')
  }
  if (mode === 'sitter') {
    // someone sitting on a gallery bench in the foreground, admiring the view
    g.fillStyle = '#2a1d16'
    g.fillRect(285, 448, 210, 26)
    g.fillStyle = '#6b4a2e'
    g.fillRect(285, 444, 210, 8)
    g.fillStyle = '#9aa0a6'
    g.fillRect(298, 474, 8, 38)
    g.fillRect(474, 474, 8, 38)
    poly(g, '#1d2533', [[352, 450], [356, 398], [372, 382], [418, 382], [434, 398], [438, 450]])
    ellipse(g, 395, 362, 21, 24, '#3a2a1e')
  }
  age(g, W, H, 101)
  return finish(c)
}

// ---------------------------------------------------------------------------
// Portraits
// ---------------------------------------------------------------------------

export interface Sitter {
  coat: string
  skin: string
  hair: string
  bg: string
  /** Long hair down to the shoulders. */
  long?: boolean
}

export const GENTLEMAN: Sitter = { coat: '#1b1a1f', skin: '#e2b896', hair: '#3a2416', bg: '#3b2f22' }
export const LADY: Sitter = { coat: '#2d4f86', skin: '#efcfb3', hair: '#5a3a1e', bg: '#2a2a24', long: true }
/** Sitters glimpsed in the neighbouring galleries, so nothing seen through a doorway repeats this room. */
export const ADMIRAL: Sitter = { coat: '#1f3550', skin: '#dcae8c', hair: '#b9b4ab', bg: '#33302a' }
export const DUCHESS: Sitter = { coat: '#6e1f2a', skin: '#f0d2bc', hair: '#2a1a10', bg: '#262a22', long: true }

export type PortraitMode = 'normal' | 'blank' | 'grin' | 'empty' | 'cutout'

/**
 * Head and shoulders against a dark ground, with a red curtain. `blank`
 * leaves the irises out, for the swap whose eyes are real and follow you.
 * `empty` is the background with nobody in it, and `cutout` the sitter alone
 * on transparency, for a sitter who has climbed out of the frame.
 */
export function portraitTexture(s: Sitter, mode: PortraitMode, W = 512, H = 640) {
  const [c, g] = canvas(W, H)
  g.scale(W / 512, H / 640)
  if (mode !== 'cutout') {
    const bg = g.createRadialGradient(256, 260, 20, 256, 300, 420)
    bg.addColorStop(0, s.bg)
    bg.addColorStop(1, '#0c0907')
    g.fillStyle = bg
    g.fillRect(0, 0, 512, 640)
    // curtain swag on the left
    poly(g, '#4e1212', [[0, 0], [150, 0], [110, 120], [60, 300], [0, 380]])
    g.strokeStyle = 'rgba(0,0,0,0.35)'
    g.lineWidth = 8
    for (const x of [30, 70, 105]) {
      g.beginPath()
      g.moveTo(x, 0)
      g.quadraticCurveTo(x - 20, 150, x - 60, 330)
      g.stroke()
    }
  }
  if (mode === 'empty') {
    // a paler patch where the sitter was, the way a picture leaves a mark on a wall
    ellipse(g, 256, 250, 100, 130, 'rgba(120,100,70,0.12)')
    age(g, 512, 640, s.long ? 77 : 55)
    return finish(c)
  }
  if (s.long) ellipse(g, 256, 300, 125, 190, s.hair)
  // shoulders and coat
  g.fillStyle = s.coat
  g.beginPath()
  g.moveTo(60, 640)
  g.bezierCurveTo(70, 520, 120, 470, 220, 440)
  g.lineTo(292, 440)
  g.bezierCurveTo(392, 470, 442, 520, 452, 640)
  g.fill()
  ellipse(g, 256, 410, 28, 46, s.skin)
  // a white ruff, or a lace collar
  for (let i = 0; i < 12; i++) ellipse(g, 186 + i * 12.7, 448, 11, 15, '#efe9dc')
  ellipse(g, 256, 452, 78, 10, '#e2dacb')
  // head
  ellipse(g, 256, 190, 98, 92, s.hair)
  ellipse(g, 256, 240, 88, 116, s.skin)
  const shade = g.createRadialGradient(230, 220, 20, 256, 250, 130)
  shade.addColorStop(0, 'rgba(255,230,210,0.18)')
  shade.addColorStop(1, 'rgba(60,30,10,0.35)')
  g.fillStyle = shade
  g.beginPath()
  g.ellipse(256, 240, 88, 116, 0, 0, Math.PI * 2)
  g.fill()
  // hairline
  g.fillStyle = s.hair
  g.beginPath()
  g.ellipse(256, 150, 92, 50, 0, Math.PI, 0)
  g.fill()
  ellipse(g, 212, 300, 18, 11, 'rgba(200,90,80,0.18)')
  ellipse(g, 300, 300, 18, 11, 'rgba(200,90,80,0.18)')
  // eyes: whites, brows, and irises glancing off to the sitter's right
  const eyes = PORTRAIT_EYES.map(([u, v]) => [u * 512, v * 640] as const)
  g.strokeStyle = s.hair
  g.lineWidth = 5
  for (const [x, y] of eyes) {
    ellipse(g, x, y, 17, 8, '#efe6da')
    g.beginPath()
    g.moveTo(x - 20, y - 18)
    g.quadraticCurveTo(x, y - 25, x + 20, y - 17)
    g.stroke()
    if (mode !== 'blank') {
      ellipse(g, x - 8, y, 8, 8, '#4a2e1a')
      ellipse(g, x - 8, y, 3.2, 3.2, '#0a0605')
      ellipse(g, x - 6, y - 3, 1.6, 1.6, '#ffffff')
    }
    g.strokeStyle = 'rgba(70,40,25,0.7)'
    g.lineWidth = 2
    g.beginPath()
    g.ellipse(x, y, 17, 8, 0, Math.PI, 0)
    g.stroke()
    g.strokeStyle = s.hair
    g.lineWidth = 5
  }
  // nose
  g.strokeStyle = 'rgba(110,60,35,0.7)'
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(256, 222)
  g.quadraticCurveTo(246, 262, 246, 276)
  g.quadraticCurveTo(256, 284, 268, 276)
  g.stroke()
  if (mode === 'grin') {
    // a wide, toothy grin
    g.fillStyle = '#3a1210'
    g.beginPath()
    g.moveTo(206, 304)
    g.quadraticCurveTo(256, 352, 306, 304)
    g.quadraticCurveTo(256, 318, 206, 304)
    g.fill()
    g.fillStyle = '#f1ebdc'
    g.beginPath()
    g.moveTo(212, 307)
    g.quadraticCurveTo(256, 324, 300, 307)
    g.quadraticCurveTo(256, 336, 212, 307)
    g.fill()
    g.strokeStyle = 'rgba(80,50,40,0.6)'
    g.lineWidth = 1.5
    for (let x = 222; x <= 292; x += 10) {
      g.beginPath()
      g.moveTo(x, 309)
      g.lineTo(x, 322)
      g.stroke()
    }
  } else {
    g.strokeStyle = '#8c3f3a'
    g.lineWidth = 6
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(236, 312)
    g.quadraticCurveTo(256, 316, 276, 312)
    g.stroke()
  }
  // a cut-out keeps its transparency: age only what is painted
  if (mode === 'cutout') g.globalCompositeOperation = 'source-atop'
  age(g, 512, 640, s.long ? 77 : 55)
  return finish(c)
}

// ---------------------------------------------------------------------------
// Still life: fruit on a pewter dish
// ---------------------------------------------------------------------------

export type StillLifeMode = 'normal' | 'core' | 'eyeball'

export function stillLifeTexture(mode: StillLifeMode) {
  const W = 640
  const H = 534
  const [c, g] = canvas(W, H)
  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#30261a')
  bg.addColorStop(1, '#0c0906')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  // table top and a white cloth over its edge
  g.fillStyle = '#4b2f1a'
  g.fillRect(0, 390, W, 144)
  g.fillStyle = '#2b1a0e'
  g.fillRect(0, 470, W, 64)
  poly(g, '#e6e0d2', [[40, 392], [300, 392], [270, 520], [60, 534], [20, 500]])
  g.strokeStyle = 'rgba(120,110,95,0.5)'
  g.lineWidth = 3
  for (const x of [90, 150, 210]) {
    g.beginPath()
    g.moveTo(x, 395)
    g.lineTo(x - 15, 525)
    g.stroke()
  }
  // pewter jug
  ellipse(g, 140, 320, 52, 78, '#8b8e8f')
  g.fillStyle = '#7b7e80'
  g.fillRect(118, 214, 44, 50)
  ellipse(g, 140, 214, 26, 8, '#5d6062')
  g.strokeStyle = '#6f7274'
  g.lineWidth = 10
  g.beginPath()
  g.arc(196, 300, 34, -1.3, 1.2)
  g.stroke()
  ellipse(g, 122, 300, 10, 40, 'rgba(255,255,255,0.35)')
  // dish
  ellipse(g, 380, 398, 150, 34, '#6e7172')
  ellipse(g, 380, 392, 140, 26, '#9a9d9e')
  // pear, apples, grapes, lemon
  ellipse(g, 270, 350, 30, 42, '#b8b04a', -0.3)
  ellipse(g, 258, 312, 18, 22, '#b8b04a')
  const apple = (x: number, y: number, r: number) => {
    const grad = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r)
    grad.addColorStop(0, '#e55a3a')
    grad.addColorStop(1, '#6e1410')
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#3a2410'
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(x, y - r + 4)
    g.lineTo(x + 4, y - r - 10)
    g.stroke()
  }
  apple(335, 350, 40)
  apple(408, 340, 42)
  for (let i = 0; i < 16; i++) {
    const x = 450 + (i % 4) * 16 + (Math.floor(i / 4) % 2) * 8
    const y = 360 + Math.floor(i / 4) * 15
    ellipse(g, x, y, 10, 10, '#3e1f4a')
    ellipse(g, x - 3, y - 3, 3, 3, 'rgba(255,255,255,0.35)')
  }
  ellipse(g, 556, 410, 30, 20, '#d9b42e', 0.2)
  // the apple that has rolled off onto the table
  if (mode === 'normal') apple(505, 440, 34)
  if (mode === 'core') {
    // eaten down to the core: a narrow waist, browned flesh, pips
    g.fillStyle = '#e7d9a6'
    g.beginPath()
    g.moveTo(490, 412)
    g.quadraticCurveTo(512, 418, 520, 412)
    g.quadraticCurveTo(508, 440, 522, 470)
    g.quadraticCurveTo(505, 476, 488, 470)
    g.quadraticCurveTo(500, 440, 490, 412)
    g.fill()
    ellipse(g, 505, 412, 18, 6, '#7e1712')
    ellipse(g, 505, 470, 18, 6, '#7e1712')
    ellipse(g, 503, 436, 3, 5, '#3a2210')
    ellipse(g, 509, 446, 3, 5, '#3a2210')
    g.strokeStyle = '#3a2410'
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(505, 408)
    g.lineTo(509, 394)
    g.stroke()
  }
  if (mode === 'eyeball') {
    // an eyeball the size of an apple, looking straight out
    const grad = g.createRadialGradient(495, 430, 4, 505, 440, 36)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(1, '#c9bfae')
    g.fillStyle = grad
    g.beginPath()
    g.arc(505, 440, 34, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = 'rgba(180,30,30,0.6)'
    g.lineWidth = 1.5
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      g.beginPath()
      g.moveTo(505 + Math.cos(a) * 33, 440 + Math.sin(a) * 33)
      g.lineTo(505 + Math.cos(a + 0.3) * 18, 440 + Math.sin(a + 0.3) * 18)
      g.stroke()
    }
    ellipse(g, 505, 440, 14, 14, '#3a78a8')
    ellipse(g, 505, 440, 6, 6, '#06080a')
    ellipse(g, 500, 435, 3, 3, '#ffffff')
  }
  // highlights
  ellipse(g, 320, 335, 7, 5, 'rgba(255,240,230,0.5)')
  ellipse(g, 394, 324, 7, 5, 'rgba(255,240,230,0.5)')
  age(g, W, H, 63)
  return finish(c)
}

// ---------------------------------------------------------------------------
// Seascape: a ship in a squall off a lighthouse
// ---------------------------------------------------------------------------

export type SeascapeMode = 'normal' | 'tentacle' | 'sunk'

export function seascapeTexture(mode: SeascapeMode) {
  const W = 704
  const H = 460
  const [c, g] = canvas(W, H)
  const rng = mulberry32(44)
  const sky = g.createLinearGradient(0, 0, 0, 240)
  sky.addColorStop(0, '#47515c')
  sky.addColorStop(0.7, '#8d8f8a')
  sky.addColorStop(1, '#c9bf9f')
  g.fillStyle = sky
  g.fillRect(0, 0, W, 250)
  clouds(g, rng, 9, W, 20, 150, 'rgba(40,44,52,0.35)')
  clouds(g, rng, 4, W, 120, 200, 'rgba(230,220,200,0.25)')
  const sea = g.createLinearGradient(0, 230, 0, H)
  sea.addColorStop(0, '#3d5c63')
  sea.addColorStop(1, '#14262c')
  g.fillStyle = sea
  g.fillRect(0, 232, W, H - 232)
  // waves
  for (let i = 0; i < 90; i++) {
    const y = 240 + Math.pow(rng(), 0.8) * 220
    const x = rng() * W
    const s = 0.5 + (y - 240) / 120
    g.fillStyle = `rgba(${rng() < 0.4 ? '230,235,225' : '90,120,125'},${0.3 + rng() * 0.4})`
    g.beginPath()
    g.moveTo(x - 24 * s, y)
    g.quadraticCurveTo(x, y - 9 * s, x + 24 * s, y)
    g.quadraticCurveTo(x, y - 3 * s, x - 24 * s, y)
    g.fill()
  }
  // lighthouse on its rocks
  poly(g, '#1d1a17', [[540, 262], [580, 238], [640, 232], [690, 250], [704, 270], [520, 274]])
  poly(g, '#e9e3d4', [[596, 236], [600, 150], [624, 150], [628, 236]])
  g.fillStyle = '#8f2a20'
  g.fillRect(598, 176, 28, 12)
  g.fillRect(597, 208, 30, 12)
  g.fillStyle = '#26221e'
  g.fillRect(594, 140, 36, 12)
  const beam = g.createLinearGradient(612, 140, 420, 120)
  beam.addColorStop(0, 'rgba(255,240,170,0.55)')
  beam.addColorStop(1, 'rgba(255,240,170,0)')
  g.fillStyle = beam
  g.beginPath()
  g.moveTo(612, 144)
  g.lineTo(400, 100)
  g.lineTo(400, 160)
  g.fill()
  ellipse(g, 612, 145, 8, 6, '#fff3b8')

  if (mode === 'sunk') {
    // just the tips of the masts and some wreckage
    g.strokeStyle = '#2a1c12'
    g.lineWidth = 4
    for (const x of [236, 262]) {
      g.beginPath()
      g.moveTo(x, 262)
      g.lineTo(x + 6, 236)
      g.stroke()
    }
    g.fillStyle = '#4a3220'
    g.fillRect(300, 262, 26, 5)
    g.fillRect(190, 270, 16, 4)
  } else {
    // the ship, heeling over in the wind
    g.save()
    g.translate(255, 258)
    g.rotate(-0.08)
    poly(g, '#3a2414', [[-80, -14], [86, -14], [70, 12], [-66, 12]])
    g.fillStyle = '#c8a050'
    g.fillRect(-74, -10, 150, 3)
    g.strokeStyle = '#2a1c12'
    g.lineWidth = 3.5
    for (const [x, h] of [
      [-40, 110],
      [6, 130],
      [48, 100],
    ]) {
      g.beginPath()
      g.moveTo(x, -14)
      g.lineTo(x, -14 - h)
      g.stroke()
      for (let k = 0; k < 3; k++) {
        const y0 = -24 - k * (h / 3.4)
        poly(g, '#e6dcc4', [[x - 26 + k * 5, y0], [x + 26 - k * 5, y0], [x + 22 - k * 5, y0 - h / 4.2], [x - 22 + k * 5, y0 - h / 4.2]])
      }
    }
    g.restore()
  }
  if (mode === 'tentacle') {
    // a vast tentacle rising out of the swell beside the ship, its tip curling over the masts
    g.fillStyle = '#6e2a45'
    g.beginPath()
    g.moveTo(362, 304)
    g.bezierCurveTo(350, 220, 420, 160, 378, 100)
    g.bezierCurveTo(352, 70, 316, 92, 332, 120)
    g.bezierCurveTo(342, 136, 362, 124, 358, 110)
    g.bezierCurveTo(404, 160, 396, 230, 416, 304)
    g.fill()
    for (let i = 0; i < 10; i++) {
      const t = i / 10
      ellipse(g, 366 + Math.sin(t * 3) * 12 - t * 8, 296 - t * 180, 6 - t * 3, 6 - t * 3, '#d99aae')
    }
    ellipse(g, 389, 304, 40, 8, 'rgba(230,235,225,0.75)')
  }
  age(g, W, H, 88)
  return finish(c)
}

// ---------------------------------------------------------------------------
// Smaller works
// ---------------------------------------------------------------------------

/** A modernist grid: black bars and blocks of primary colour, deliberately lopsided. */
export function abstractTexture() {
  const [c, g] = canvas(660, 450)
  g.fillStyle = '#f1ece0'
  g.fillRect(0, 0, 660, 450)
  g.fillStyle = '#c8241c'
  g.fillRect(0, 0, 210, 160)
  g.fillStyle = '#1f3f9a'
  g.fillRect(470, 330, 190, 120)
  g.fillStyle = '#efc419'
  g.fillRect(600, 0, 60, 160)
  g.fillStyle = '#111'
  g.fillRect(210, 0, 14, 450)
  g.fillRect(470, 0, 14, 450)
  g.fillRect(0, 160, 660, 14)
  g.fillRect(224, 330, 436, 14)
  g.fillRect(586, 0, 14, 160)
  g.fillRect(0, 380, 210, 10)
  age(g, 660, 450, 12, false)
  return finish(c)
}

export function riverTexture() {
  const W = 448
  const H = 320
  const [c, g] = canvas(W, H)
  const rng = mulberry32(9)
  const sky = g.createLinearGradient(0, 0, 0, 170)
  sky.addColorStop(0, '#9fb3c4')
  sky.addColorStop(1, '#e8dcbc')
  g.fillStyle = sky
  g.fillRect(0, 0, W, 180)
  clouds(g, rng, 4, W, 30, 110, 'rgba(255,250,240,0.35)')
  g.fillStyle = '#7b8a52'
  g.fillRect(0, 170, W, 150)
  poly(g, '#8eaab4', [[200, 170], [236, 170], [300, 320], [120, 320]])
  for (const [x, y, s] of [
    [80, 170, 1.4],
    [150, 190, 1],
    [340, 175, 1.6],
    [400, 200, 1.1],
  ] as const)
    for (let k = 0; k < 6; k++) ellipse(g, x + (rng() - 0.5) * 30 * s, y - 20 * s + (rng() - 0.5) * 28 * s, 15 * s, 13 * s, k % 2 ? '#3c4a26' : '#56663a')
  age(g, W, H, 19)
  return finish(c)
}

/** A hand-coloured botanical plate of a rose that does not exist. */
export function botanicalTexture() {
  const W = 320
  const H = 448
  const [c, g] = canvas(W, H)
  g.fillStyle = '#efe6cf'
  g.fillRect(0, 0, W, H)
  g.strokeStyle = '#4c6a33'
  g.lineWidth = 4
  g.beginPath()
  g.moveTo(160, 390)
  g.bezierCurveTo(150, 300, 175, 200, 160, 130)
  g.stroke()
  for (const [x, y, a] of [
    [150, 320, -0.7],
    [172, 260, 0.7],
    [152, 200, -0.6],
  ] as const) {
    ellipse(g, x + Math.cos(a) * 26 * Math.sign(a), y, 28, 11, '#5f8240', a)
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    ellipse(g, 160 + Math.cos(a) * 20, 112 + Math.sin(a) * 16, 22, 14, i % 2 ? '#c75478' : '#e07e9a', a)
  }
  ellipse(g, 160, 112, 12, 10, '#9c2f50')
  g.fillStyle = '#3d3226'
  g.textAlign = 'center'
  g.font = 'italic 22px Georgia, serif'
  g.fillText('Rosa improbabilis', 160, 425)
  age(g, W, H, 23, false)
  return finish(c)
}

// ---------------------------------------------------------------------------
// Signs and labels
// ---------------------------------------------------------------------------

/** A wall label: title in italics, then the artist and the details. */
export function plaqueTexture(title: string, artist: string, detail: string) {
  const [c, g] = canvas(320, 200)
  g.fillStyle = '#f5f2ea'
  g.fillRect(0, 0, 320, 200)
  g.fillStyle = '#2b2824'
  g.font = 'bold 30px Georgia, serif'
  g.fillText(artist, 22, 52)
  g.font = 'italic 28px Georgia, serif'
  g.fillText(title, 22, 96)
  g.font = '20px Georgia, serif'
  g.fillStyle = '#5a554e'
  g.fillText(detail, 22, 134)
  g.fillRect(22, 156, 180, 2)
  g.fillRect(22, 168, 120, 2)
  return finish(c)
}

/** A plain printed card with centred lines of text; the first line is the big one. */
export function cardTexture(lines: string[], { w = 384, h = 256, bg = '#f5f2ea', ink = '#2b2824', size = 46, even = false } = {}) {
  const [c, g] = canvas(w, h)
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.fillStyle = ink
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const gap = h / (lines.length + 1)
  lines.forEach((line, i) => {
    g.font = i === 0 || even ? `bold ${size}px Georgia, serif` : `${Math.round(size * 0.5)}px Georgia, serif`
    g.fillText(line, w / 2, gap * (i + 1))
  })
  return finish(c)
}

/** Vinyl lettering straight onto the wall (transparent everywhere else). */
export function gallerySignTexture(title: string, subtitle: string) {
  const [c, g] = canvas(1024, 320)
  g.fillStyle = '#2f2a26'
  g.textAlign = 'left'
  g.font = '120px Georgia, serif'
  g.fillText(title, 20, 140)
  g.font = 'italic 50px Georgia, serif'
  g.fillStyle = '#4a433d'
  g.fillText(subtitle, 24, 240)
  return finish(c)
}

export type ExitMode = 'normal' | 'entrance' | 'mirror'

/** The green running-man fire exit sign. */
export function exitSignTexture(mode: ExitMode) {
  const [c, g] = canvas(512, 192)
  g.fillStyle = '#1f9a4b'
  g.fillRect(0, 0, 512, 192)
  g.fillStyle = '#f4fff6'
  g.save()
  if (mode === 'mirror') {
    g.translate(512, 0)
    g.scale(-1, 1)
  }
  // doorway and a little running figure heading for it
  g.fillRect(40, 30, 12, 132)
  g.fillRect(40, 30, 70, 12)
  g.fillRect(98, 30, 12, 132)
  ellipse(g, 150, 54, 13, 13, '#f4fff6')
  g.strokeStyle = '#f4fff6'
  g.lineWidth = 15
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(146, 76)
  g.lineTo(136, 116)
  g.moveTo(136, 116)
  g.lineTo(112, 140)
  g.lineTo(100, 160)
  g.moveTo(136, 116)
  g.lineTo(160, 132)
  g.lineTo(170, 162)
  g.moveTo(144, 84)
  g.lineTo(120, 100)
  g.moveTo(144, 84)
  g.lineTo(168, 104)
  g.stroke()
  // arrow
  poly(g, '#f4fff6', [[196, 86], [232, 86], [232, 66], [266, 96], [232, 126], [232, 106], [196, 106]])
  g.restore()
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `bold ${mode === 'entrance' ? 52 : 92}px Arial, sans-serif`
  g.fillText(mode === 'entrance' ? 'ENTRANCE' : 'EXIT', mode === 'mirror' ? 156 : 380, 100)
  return finish(c)
}

export type SkylightMode = 'normal' | 'hand' | 'eye'

/** Frosted laylight glass in a grid of glazing bars, and whatever is on the roof above it. */
export function skylightTexture(mode: SkylightMode) {
  const [c, g] = canvas(1024, 512)
  const glow = g.createRadialGradient(512, 256, 40, 512, 256, 600)
  glow.addColorStop(0, '#ffffff')
  glow.addColorStop(1, '#e3e8ea')
  g.fillStyle = glow
  g.fillRect(0, 0, 1024, 512)
  g.filter = 'blur(6px)'
  g.fillStyle = 'rgba(60,60,68,0.8)'
  if (mode === 'hand') {
    // an enormous hand pressed flat on the roof glass
    ellipse(g, 300, 320, 92, 108, 'rgba(60,60,68,0.8)')
    for (const [x, y, l, a] of [
      [222, 244, 100, -0.45],
      [266, 214, 130, -0.18],
      [314, 208, 138, 0.06],
      [360, 222, 120, 0.3],
      [394, 320, 92, 1.15],
    ] as const) {
      g.save()
      g.translate(x, y)
      g.rotate(a)
      g.beginPath()
      g.roundRect(-20, -l, 40, l + 20, 20)
      g.fill()
      g.restore()
    }
  }
  if (mode === 'eye') {
    // something looking down at the gallery
    g.beginPath()
    g.moveTo(560, 260)
    g.quadraticCurveTo(700, 150, 840, 260)
    g.quadraticCurveTo(700, 370, 560, 260)
    g.fill()
    g.filter = 'blur(8px)'
    ellipse(g, 700, 260, 52, 52, 'rgba(30,30,36,0.9)')
    ellipse(g, 714, 248, 12, 12, 'rgba(255,255,255,0.8)')
  }
  g.filter = 'none'
  // glazing bars
  g.fillStyle = '#9aa2a6'
  for (let i = 0; i <= 8; i++) g.fillRect(i * 128 - 5, 0, 10, 512)
  for (let j = 0; j <= 4; j++) g.fillRect(0, j * 128 - 5, 1024, 10)
  return finish(c)
}
