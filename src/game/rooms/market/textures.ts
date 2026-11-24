import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { cached } from './build'

/*
 * Everything printed or patterned in the market is drawn on a canvas at load
 * time: the paving, brick and stone of the buildings (pale, so each building's
 * own colour can tint them), windows, shopfronts and their signs, the sky,
 * awning stripes, chalkboards, the clock, the advert and the pub sign.
 */

function canvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function finish(c: HTMLCanvasElement, repeat = false) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  t.wrapS = t.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping
  return t
}

const SANS = '"Arial Black", "Segoe UI Black", Impact, sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'
const CHALK = '"Segoe Print", "Comic Sans MS", "Bradley Hand", cursive'

/** Light speckle all over, for grit. */
function grit(g: CanvasRenderingContext2D, w: number, h: number, n: number, alpha: number, seed: number) {
  const rng = mulberry32(seed)
  for (let k = 0; k < n; k++) {
    g.fillStyle = rng() < 0.5 ? `rgba(0,0,0,${rng() * alpha})` : `rgba(255,255,255,${rng() * alpha})`
    g.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2)
  }
}

// ---------------------------------------------------------------------------
// Ground and walls (tiling, in metres: see each one's size)
// ---------------------------------------------------------------------------

/** Granite paving slabs, 2 m square per repeat: 4 × 4 slabs of 0.5 m, laid in stretcher bond. */
export const pavingTexture = once(() => {
  const [c, g] = canvas(512)
  const rng = mulberry32(5)
  const s = 128
  for (let j = 0; j < 4; j++)
    for (let i = -1; i < 4; i++) {
      const x = i * s + (j % 2 ? s / 2 : 0)
      const v = 128 + rng() * 26
      g.fillStyle = `rgb(${v},${v - 3},${v - 8})`
      g.fillRect(x, j * s, s, s)
    }
  grit(g, 512, 512, 9000, 0.12, 6)
  // a few darker stains and chewing gum spots
  for (let k = 0; k < 40; k++) {
    g.fillStyle = `rgba(40,36,30,${0.05 + rng() * 0.08})`
    g.beginPath()
    g.arc(rng() * 512, rng() * 512, 2 + rng() * 9, 0, Math.PI * 2)
    g.fill()
  }
  g.strokeStyle = 'rgba(55,50,44,0.75)'
  g.lineWidth = 3
  for (let j = 0; j <= 4; j++) {
    g.beginPath()
    g.moveTo(0, j * s)
    g.lineTo(512, j * s)
    g.stroke()
    for (let i = -1; i <= 4; i++) {
      const x = i * s + (j % 2 ? s / 2 : 0)
      g.beginPath()
      g.moveTo(x, j * s)
      g.lineTo(x, j * s + s)
      g.stroke()
    }
  }
  return finish(c, true)
})

/** Tarmac for the street beyond the van. */
export const tarmacTexture = once(() => {
  const [c, g] = canvas(256)
  g.fillStyle = '#4a4a4c'
  g.fillRect(0, 0, 256, 256)
  grit(g, 256, 256, 8000, 0.25, 9)
  return finish(c, true)
})

/** Brick, 1.125 m per repeat: 5 bricks by 15 courses, pale so a building's colour tints it. */
export const BRICK_TILE = 1.125
export const brickTexture = once(() => {
  const [c, g] = canvas(512)
  const rng = mulberry32(11)
  g.fillStyle = '#d9d4cc'
  g.fillRect(0, 0, 512, 512)
  const bw = 512 / 5
  const bh = 512 / 15
  for (let j = 0; j < 15; j++)
    for (let i = -1; i < 6; i++) {
      const x = i * bw + (j % 2 ? bw / 2 : 0)
      const v = 150 + rng() * 80
      g.fillStyle = `rgb(${v},${v * (0.94 + rng() * 0.05)},${v * (0.9 + rng() * 0.08)})`
      g.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4)
    }
  grit(g, 512, 512, 7000, 0.14, 12)
  return finish(c, true)
})

/** Ashlar stone, 1.2 m per repeat: blocks 0.6 × 0.3 m. */
export const STONE_TILE = 1.2
export const stoneTexture = once(() => {
  const [c, g] = canvas(512)
  const rng = mulberry32(13)
  g.fillStyle = '#b8b2a6'
  g.fillRect(0, 0, 512, 512)
  const bw = 256
  const bh = 128
  for (let j = 0; j < 4; j++)
    for (let i = -1; i < 3; i++) {
      const x = i * bw + (j % 2 ? bw / 2 : 0)
      const v = 196 + rng() * 22
      g.fillStyle = `rgb(${v},${v - 2},${v - 6})`
      g.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4)
    }
  grit(g, 512, 512, 9000, 0.08, 14)
  // weathering streaks running down
  for (let k = 0; k < 30; k++) {
    g.fillStyle = `rgba(60,55,45,${0.03 + rng() * 0.05})`
    g.fillRect(rng() * 512, rng() * 512, 2 + rng() * 5, 40 + rng() * 120)
  }
  return finish(c, true)
})

/** Smooth painted render (stucco), 1.2 m per repeat. */
export const renderTexture = once(() => {
  const [c, g] = canvas(256)
  g.fillStyle = '#ece8e0'
  g.fillRect(0, 0, 256, 256)
  grit(g, 256, 256, 5000, 0.06, 15)
  // rusticated joints, like a Georgian ground floor
  g.fillStyle = 'rgba(70,64,56,0.22)'
  for (let j = 0; j < 4; j++) g.fillRect(0, j * 64, 256, 2)
  return finish(c, true)
})

// ---------------------------------------------------------------------------
// Windows and shopfronts (atlases, 2 × 2 cells, see build.cell)
// ---------------------------------------------------------------------------

/** Dark glass with a cold sky reflection running across it. */
function glass(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, interior: string) {
  const grad = g.createLinearGradient(x, y, x + w * 0.6, y + h)
  grad.addColorStop(0, '#6f7f8e')
  grad.addColorStop(0.35, interior)
  grad.addColorStop(1, '#1d2228')
  g.fillStyle = grad
  g.fillRect(x, y, w, h)
  g.fillStyle = 'rgba(255,255,255,0.08)'
  g.beginPath()
  g.moveTo(x + w * 0.15, y)
  g.lineTo(x + w * 0.45, y)
  g.lineTo(x + w * 0.05, y + h)
  g.lineTo(x - w * 0.25, y + h)
  g.closePath()
  g.fill()
}

/** A sash window, cell 256 × 512 (it's tall), with its frame. `inside` draws curtains etc. behind the bars. */
function sash(g: CanvasRenderingContext2D, ox: number, oy: number, inside: (x: number, y: number, w: number, h: number) => void) {
  const w = 256
  const h = 512
  g.fillStyle = '#f2efe6'
  g.fillRect(ox, oy, w, h)
  const fx = ox + 18
  const fy = oy + 18
  const fw = w - 36
  const fh = h - 36
  glass(g, fx, fy, fw, fh, '#2b3036')
  inside(fx, fy, fw, fh)
  // the sash bars: two sashes, each two panes across and three down
  g.fillStyle = '#f2efe6'
  g.fillRect(ox, oy + h / 2 - 9, w, 18)
  g.fillRect(ox + w / 2 - 5, oy, 10, h)
  for (const k of [1, 2]) {
    g.fillRect(ox, oy + 18 + (k * (h / 2 - 27)) / 3 - 3, w, 6)
    g.fillRect(ox, oy + h / 2 + 9 + (k * (h / 2 - 27)) / 3 - 3, w, 6)
  }
  g.strokeStyle = 'rgba(0,0,0,0.25)'
  g.lineWidth = 3
  g.strokeRect(ox + 1.5, oy + 1.5, w - 3, h - 3)
}

/** Four kinds of upstairs window: curtains drawn back, net curtains, a blind, a plant on the sill. */
export const windowAtlas = once(() => {
  const [c, g] = canvas(512, 1024)
  const curtain = (colour: string) => (x: number, y: number, w: number, h: number) => {
    g.fillStyle = colour
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + w * 0.28, y)
    g.quadraticCurveTo(x + w * 0.12, y + h * 0.55, x + w * 0.2, y + h)
    g.lineTo(x, y + h)
    g.fill()
    g.beginPath()
    g.moveTo(x + w, y)
    g.lineTo(x + w * 0.72, y)
    g.quadraticCurveTo(x + w * 0.88, y + h * 0.55, x + w * 0.8, y + h)
    g.lineTo(x + w, y + h)
    g.fill()
  }
  sash(g, 0, 0, curtain('#7a2f3a'))
  sash(g, 256, 0, (x, y, w, h) => {
    // net curtain over the lower half
    g.fillStyle = 'rgba(235,235,228,0.78)'
    g.fillRect(x, y + h * 0.48, w, h * 0.52)
    g.strokeStyle = 'rgba(200,200,190,0.6)'
    for (let k = 0; k < w; k += 8) {
      g.beginPath()
      g.moveTo(x + k, y + h * 0.48)
      g.lineTo(x + k + 3, y + h)
      g.stroke()
    }
  })
  sash(g, 0, 512, (x, y, w, h) => {
    // roller blind two-thirds down
    g.fillStyle = '#d8c79a'
    g.fillRect(x, y, w, h * 0.62)
    g.fillStyle = 'rgba(0,0,0,0.2)'
    g.fillRect(x, y + h * 0.62 - 6, w, 6)
  })
  sash(g, 256, 512, (x, y, w, h) => {
    curtain('#2f5a7a')(x, y, w, h)
    // a pot plant on the inside sill
    g.fillStyle = '#b5532e'
    g.fillRect(x + w * 0.38, y + h - 60, w * 0.24, 60)
    g.fillStyle = '#3f7a35'
    for (let k = 0; k < 7; k++) {
      g.beginPath()
      g.ellipse(x + w * 0.5 + (k - 3) * 14, y + h - 80 - (k % 3) * 18, 18, 30, (k - 3) * 0.3, 0, Math.PI * 2)
      g.fill()
    }
  })
  return finish(c)
})

/** The one window that changes: curtains open (default), a figure watching, or curtains drawn. 1 × 3 cells. */
export const watchWindowTexture = cached((mode: 'default' | 'figure' | 'drawn') => {
  const [c, g] = canvas(256, 512)
  sash(g, 0, 0, (x, y, w, h) => {
    if (mode === 'drawn') {
      g.fillStyle = '#c8242c'
      g.fillRect(x, y, w, h)
      g.fillStyle = 'rgba(0,0,0,0.25)'
      for (let k = 0; k < w; k += 22) g.fillRect(x + k, y, 6, h)
      return
    }
    if (mode === 'figure') {
      // the room's light is on, and someone is standing right up at the glass, looking out
      const lamp = g.createRadialGradient(x + w * 0.5, y + h * 0.25, 10, x + w * 0.5, y + h * 0.3, h * 0.7)
      lamp.addColorStop(0, '#ffe6b0')
      lamp.addColorStop(1, '#8a6a48')
      g.fillStyle = lamp
      g.fillRect(x, y, w, h)
    }
    g.fillStyle = '#e7dfc8'
    g.fillRect(x, y, w * 0.18, h)
    g.fillRect(x + w * 0.82, y, w * 0.18, h)
    if (mode === 'figure') {
      g.fillStyle = '#0b0b0e'
      g.beginPath()
      g.ellipse(x + w * 0.5, y + h * 1.02, w * 0.42, h * 0.5, 0, Math.PI, 0)
      g.fill()
      g.beginPath()
      g.ellipse(x + w * 0.5, y + h * 0.33, w * 0.2, h * 0.12, 0, 0, Math.PI * 2)
      g.fill()
      g.fillRect(x + w * 0.42, y + h * 0.4, w * 0.16, h * 0.15)
      // a pale smudge where a face should be
      g.fillStyle = 'rgba(214,206,192,0.75)'
      g.beginPath()
      g.ellipse(x + w * 0.5, y + h * 0.34, w * 0.12, h * 0.08, 0, 0, Math.PI * 2)
      g.fill()
    }
  })
  return finish(c)
})

/** Shopfronts, 2 × 2 cells of 512: a shop with shelves, a café, a roller shutter, a launderette. */
export const shopAtlas = once(() => {
  const [c, g] = canvas(1024)
  const rng = mulberry32(21)
  // shelves of stuff, dim
  glass(g, 0, 0, 512, 512, '#3a3630')
  for (let s = 0; s < 4; s++) {
    const y = 120 + s * 95
    g.fillStyle = '#5a4a38'
    g.fillRect(20, y, 472, 8)
    for (let k = 0; k < 22; k++) {
      const v = 70 + rng() * 90
      g.fillStyle = `rgb(${v + rng() * 60},${v},${v - rng() * 30})`
      const bw = 10 + rng() * 14
      const bh = 30 + rng() * 45
      g.fillRect(24 + k * 21, y - bh, bw, bh)
    }
  }
  // café: warm lit counter, cake stand, pendant lamps
  glass(g, 512, 0, 512, 512, '#5a3f2a')
  g.fillStyle = 'rgba(255,196,120,0.35)'
  for (const x of [640, 768, 896]) {
    g.beginPath()
    g.arc(x, 110, 46, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#f3d79a'
    g.fillRect(x - 14, 96, 28, 18)
    g.fillStyle = 'rgba(255,196,120,0.35)'
  }
  g.fillStyle = '#6b4a30'
  g.fillRect(540, 330, 460, 182)
  g.fillStyle = '#d9c7a8'
  g.fillRect(540, 322, 460, 12)
  g.fillStyle = '#c9b8a0'
  g.fillRect(600, 260, 50, 62)
  g.fillStyle = '#e6a2b8'
  g.beginPath()
  g.arc(625, 255, 30, Math.PI, 0)
  g.fill()
  // roller shutter
  g.fillStyle = '#8d9196'
  g.fillRect(0, 512, 512, 512)
  for (let y = 512; y < 1024; y += 14) {
    g.fillStyle = 'rgba(255,255,255,0.18)'
    g.fillRect(0, y, 512, 3)
    g.fillStyle = 'rgba(0,0,0,0.22)'
    g.fillRect(0, y + 10, 512, 4)
  }
  graffiti(g, 70, 700, '#e0326a', '#ffd23a', 'ZONK')
  // launderette: a row of round machine doors
  glass(g, 512, 512, 512, 512, '#9aa7ad')
  g.fillStyle = '#e8ecef'
  g.fillRect(530, 760, 476, 240)
  for (let k = 0; k < 4; k++) {
    const x = 590 + k * 118
    g.fillStyle = '#c3c9ce'
    g.beginPath()
    g.arc(x, 860, 46, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#3b4c58'
    g.beginPath()
    g.arc(x, 860, 34, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#6fa0c0'
    g.beginPath()
    g.arc(x + 6, 868, 22, 0, Math.PI * 2)
    g.fill()
  }
  grit(g, 1024, 1024, 6000, 0.06, 22)
  return finish(c)
})

/** A spray-painted tag with a drop shadow. */
function graffiti(g: CanvasRenderingContext2D, x: number, y: number, fill: string, edge: string, text: string) {
  g.save()
  g.translate(x, y)
  g.rotate(-0.12)
  g.font = `italic 900 130px ${SANS}`
  g.lineJoin = 'round'
  g.lineWidth = 16
  g.strokeStyle = '#111'
  g.strokeText(text, 6, 6)
  g.strokeStyle = edge
  g.lineWidth = 10
  g.strokeText(text, 0, 0)
  g.fillStyle = fill
  g.fillText(text, 0, 0)
  g.restore()
}

/** The pawnbroker's roller shutter on its own: a tag, or a big painted eye. */
export const shutterTexture = cached((mode: 'tag' | 'eye') => {
  const [c, g] = canvas(512, 512)
  g.fillStyle = '#8d9196'
  g.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 14) {
    g.fillStyle = 'rgba(255,255,255,0.18)'
    g.fillRect(0, y, 512, 3)
    g.fillStyle = 'rgba(0,0,0,0.22)'
    g.fillRect(0, y + 10, 512, 4)
  }
  if (mode === 'tag') graffiti(g, 40, 300, '#25b4e8', '#fff', 'DEJA')
  else {
    g.fillStyle = '#f4f1e6'
    g.beginPath()
    g.ellipse(256, 256, 220, 120, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#2f8a4a'
    g.beginPath()
    g.arc(256, 256, 90, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#0b0b0b'
    g.beginPath()
    g.arc(256, 256, 44, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(232, 232, 16, 0, Math.PI * 2)
    g.fill()
    g.lineWidth = 14
    g.strokeStyle = '#111'
    g.beginPath()
    g.ellipse(256, 256, 220, 120, 0, 0, Math.PI * 2)
    g.stroke()
  }
  grit(g, 512, 512, 3000, 0.08, 23)
  return finish(c)
})

// ---------------------------------------------------------------------------
// Signs: one atlas of 32 rows, each 1024 × 64. A sign shows one row.
// ---------------------------------------------------------------------------

export interface SignSpec {
  text: string
  bg: string
  ink: string
  /** Width over height of the board it goes on, so the letters aren't stretched. */
  aspect: number
  serif?: boolean
}

export const SIGN_ROWS = 32

export const signAtlas = cached((signs: readonly SignSpec[]) => {
  const [c, g] = canvas(1024, 64 * SIGN_ROWS)
  signs.forEach((s, i) => {
    const y = i * 64
    g.fillStyle = s.bg
    g.fillRect(0, y, 1024, 64)
    // the board's moulded edge
    g.strokeStyle = 'rgba(0,0,0,0.35)'
    g.lineWidth = 4
    g.strokeRect(2, y + 2, 1020, 60)
    g.strokeStyle = 'rgba(255,255,255,0.25)'
    g.lineWidth = 2
    g.strokeRect(8, y + 7, 1008, 50)
    // a 1 m-wide board is 1024 px wide but `aspect` times taller in the texture than on the board
    const squash = (16 * 1) / s.aspect
    g.save()
    g.translate(512, y + 33)
    g.scale(squash, 1)
    g.font = s.serif ? `bold 40px ${SERIF}` : `40px ${SANS}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const width = g.measureText(s.text).width
    const fit = Math.min(1, (900 / squash) / width)
    g.scale(fit, 1)
    g.fillStyle = s.ink
    g.fillText(s.text, 0, 0)
    g.restore()
  })
  return finish(c)
})

// ---------------------------------------------------------------------------
// Sky
// ---------------------------------------------------------------------------

/** Early afternoon: deep blue overhead fading to a pale haze at the horizon, with a few fair-weather clouds. */
export const skyTexture = once(() => {
  const [c, g] = canvas(2048, 512)
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#2c69c4')
  grad.addColorStop(0.3, '#4f8cd8')
  grad.addColorStop(0.46, '#a3c6ea')
  grad.addColorStop(0.5, '#d3e3f0')
  grad.addColorStop(1, '#d3e3f0')
  g.fillStyle = grad
  g.fillRect(0, 0, 2048, 512)
  const rng = mulberry32(31)
  // clouds in the band above the rooftops: clusters of soft puffs, flat bottomed
  for (let k = 0; k < 9; k++) {
    const cx = (k / 9) * 2048 + rng() * 120
    const cy = 70 + rng() * 120
    const size = 14 + rng() * 22
    for (let p = 0; p < 12; p++) {
      const x = cx + (rng() - 0.5) * size * 5
      const y = cy - rng() * size * 0.9
      const r = size * (0.5 + rng() * 0.7)
      const puff = g.createRadialGradient(x, y, 0, x, y, r)
      puff.addColorStop(0, 'rgba(255,255,255,0.6)')
      puff.addColorStop(0.6, 'rgba(250,252,255,0.3)')
      puff.addColorStop(1, 'rgba(240,246,255,0)')
      g.fillStyle = puff
      for (const dx of [0, 2048, -2048]) {
        g.save()
        g.translate(dx, 0)
        g.beginPath()
        g.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
    }
  }
  const t = finish(c)
  t.wrapS = RepeatWrapping
  return t
})

// ---------------------------------------------------------------------------
// Market stalls
// ---------------------------------------------------------------------------

/** Awning canvas: white and `colour` stripes, running along v (front to back) or along u (across). */
export const awningTexture = cached((key: string) => {
  const [colour, dir] = key.split('|')
  const [c, g] = canvas(256)
  g.fillStyle = '#f6f2e8'
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = colour
  for (let k = 0; k < 8; k += 2) {
    if (dir === 'across') g.fillRect(0, k * 32, 256, 32)
    else g.fillRect(k * 32, 0, 32, 256)
  }
  grit(g, 256, 256, 1500, 0.06, 41)
  return finish(c)
})

/** The scalloped valance hanging off the front of an awning: stripes, cut into scallops (alpha). */
export const valanceTexture = cached((key: string) => {
  const [colour, dir] = key.split('|')
  const [c, g] = canvas(512, 64)
  g.fillStyle = '#f6f2e8'
  g.fillRect(0, 0, 512, 64)
  g.fillStyle = colour
  if (dir === 'across') g.fillRect(0, 0, 512, 22)
  else for (let k = 0; k < 16; k += 2) g.fillRect(k * 32, 0, 32, 64)
  // scallops: cut away the space between them
  g.globalCompositeOperation = 'destination-in'
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(512, 0)
  g.lineTo(512, 26)
  for (let k = 8; k > 0; k--) g.arc(k * 64 - 32, 26, 32, 0, Math.PI)
  g.closePath()
  g.fill()
  return finish(c)
})

/** Crushed ice for the fishmonger. */
export const iceTexture = once(() => {
  const [c, g] = canvas(256)
  g.fillStyle = '#dfeef4'
  g.fillRect(0, 0, 256, 256)
  const rng = mulberry32(51)
  for (let k = 0; k < 900; k++) {
    const v = 190 + rng() * 65
    g.fillStyle = `rgba(${v - 10},${v},${v + 10},0.8)`
    g.beginPath()
    g.arc(rng() * 256, rng() * 256, 2 + rng() * 6, 0, Math.PI * 2)
    g.fill()
  }
  for (let k = 0; k < 300; k++) {
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.fillRect(rng() * 256, rng() * 256, 2, 2)
  }
  return finish(c, true)
})

/** Watermelon rind: dark and light green stripes running pole to pole. */
export const melonTexture = once(() => {
  const [c, g] = canvas(256, 64)
  g.fillStyle = '#4c8a3a'
  g.fillRect(0, 0, 256, 64)
  g.fillStyle = '#21471c'
  for (let k = 0; k < 12; k++) {
    g.beginPath()
    const x = k * 21.3
    g.moveTo(x, 0)
    for (let y = 0; y <= 64; y += 8) g.lineTo(x + Math.sin(y * 0.4 + k) * 3 + 6, y)
    for (let y = 64; y >= 0; y -= 8) g.lineTo(x + Math.sin(y * 0.4 + k) * 3, y)
    g.fill()
  }
  return finish(c, true)
})

// ---------------------------------------------------------------------------
// Boards with writing on
// ---------------------------------------------------------------------------

/** A chalk A-board face: a heading and a few lines, 256 × 384. */
export const chalkTexture = cached((text: string) => {
  const [c, g] = canvas(256, 384)
  g.fillStyle = '#23272a'
  g.fillRect(0, 0, 256, 384)
  const rng = mulberry32(text.length * 7)
  // ghosts of old writing wiped off
  for (let k = 0; k < 40; k++) {
    g.fillStyle = `rgba(255,255,255,${rng() * 0.05})`
    g.fillRect(rng() * 256, rng() * 384, 20 + rng() * 60, 3 + rng() * 8)
  }
  const [head, ...lines] = text.split('\n')
  g.textAlign = 'center'
  g.fillStyle = '#ffe36b'
  g.font = `bold 34px ${CHALK}`
  fitText(g, head, 128, 62, 236)
  g.font = `24px ${CHALK}`
  const colours = ['#ffffff', '#ff9fc4', '#9fe2ff', '#c8ff9f', '#ffffff']
  lines.forEach((l, i) => {
    g.fillStyle = colours[i % colours.length]
    fitText(g, l, 128, 120 + i * 48, 236)
  })
  return finish(c)
})

function fitText(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number) {
  const w = g.measureText(text).width
  g.save()
  g.translate(x, y)
  if (w > max) g.scale(max / w, 1)
  g.fillText(text, 0, 0)
  g.restore()
}

/** A hand-lettered cardboard sign (the busker's). */
export const cardboardTexture = cached((text: string) => {
  const [c, g] = canvas(256, 192)
  g.fillStyle = '#c49a64'
  g.fillRect(0, 0, 256, 192)
  grit(g, 256, 192, 1500, 0.1, 61)
  g.fillStyle = '#1a1a1a'
  g.textAlign = 'center'
  g.font = `bold 30px ${CHALK}`
  text.split('\n').forEach((l, i) => fitText(g, l, 128, 56 + i * 44, 236))
  return finish(c)
})

/** Newsprint: a masthead, a headline and columns of grey. */
export const newspaperTexture = once(() => {
  const [c, g] = canvas(256, 192)
  g.fillStyle = '#ecebe4'
  g.fillRect(0, 0, 256, 192)
  g.fillStyle = '#111'
  g.font = `bold 22px ${SERIF}`
  g.textAlign = 'center'
  g.fillText('The Daily Echo', 64, 26)
  g.font = `bold 15px ${SANS}`
  g.fillText('IT HAPPENED', 64, 52)
  g.fillText('AGAIN', 64, 70)
  g.fillStyle = 'rgba(0,0,0,0.35)'
  for (let col = 0; col < 2; col++) for (let y = 84; y < 180; y += 6) g.fillRect(8 + col * 60, y, 52, 3)
  g.fillStyle = 'rgba(0,0,0,0.3)'
  for (let col = 0; col < 3; col++) for (let y = 14; y < 180; y += 6) g.fillRect(136 + col * 40, y, 34, 3)
  return finish(c)
})

// ---------------------------------------------------------------------------
// The big things on the buildings
// ---------------------------------------------------------------------------

const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
const ROMAN13 = ['XIII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

/** The clock face: Roman numerals, ordinary, with thirteen hours, or running backwards. */
export const clockTexture = cached((mode: 'default' | 'thirteen' | 'backwards') => {
  const [c, g] = canvas(512)
  g.fillStyle = '#f4efdf'
  g.beginPath()
  g.arc(256, 256, 250, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#1b1b1b'
  g.lineWidth = 6
  g.beginPath()
  g.arc(256, 256, 236, 0, Math.PI * 2)
  g.stroke()
  g.beginPath()
  g.arc(256, 256, 160, 0, Math.PI * 2)
  g.stroke()
  const labels = mode === 'thirteen' ? ROMAN13 : ROMAN
  const n = labels.length
  g.fillStyle = '#1b1b1b'
  g.font = `bold 44px ${SERIF}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  for (let k = 0; k < n; k++) {
    const a = ((mode === 'backwards' ? -k : k) / n) * Math.PI * 2
    g.save()
    g.translate(256 + Math.sin(a) * 198, 256 - Math.cos(a) * 198)
    g.rotate(a)
    g.fillText(labels[k], 0, 0)
    g.restore()
  }
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2
    const r0 = k % 5 ? 228 : 218
    g.lineWidth = k % 5 ? 2 : 5
    g.beginPath()
    g.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0)
    g.lineTo(256 + Math.sin(a) * 236, 256 - Math.cos(a) * 236)
    g.stroke()
  }
  return finish(c)
})

/** The billboard: a mattress advert with a sleeping face; awake and staring; or a different slogan. */
export const billboardTexture = cached((mode: 'default' | 'eyes' | 'text') => {
  const [c, g] = canvas(1024, 512)
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#2a3f8f')
  grad.addColorStop(1, '#10183c')
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 512)
  // stars
  const rng = mulberry32(71)
  g.fillStyle = '#fff6c8'
  for (let k = 0; k < 60; k++) g.fillRect(rng() * 1024, rng() * 300, 3, 3)
  // a big moon-pale face on a pillow
  g.fillStyle = '#e9e4f5'
  g.beginPath()
  g.ellipse(330, 330, 300, 120, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#f2c9a5'
  g.beginPath()
  g.arc(300, 260, 150, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#5a3a24'
  g.beginPath()
  g.arc(300, 210, 150, Math.PI * 1.05, Math.PI * 1.95)
  g.fill()
  g.strokeStyle = '#3a2418'
  g.lineCap = 'round'
  g.lineWidth = 10
  for (const x of [240, 360]) {
    if (mode === 'eyes') {
      g.fillStyle = '#fff'
      g.beginPath()
      g.ellipse(x, 255, 38, 30, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#16120f'
      g.beginPath()
      g.arc(x + 4, 262, 17, 0, Math.PI * 2)
      g.fill()
      g.stroke()
    } else {
      g.beginPath()
      g.arc(x, 250, 30, 0.15 * Math.PI, 0.85 * Math.PI)
      g.stroke()
    }
  }
  g.beginPath()
  if (mode === 'eyes') g.arc(300, 340, 26, 0, Math.PI * 2)
  else g.arc(300, 320, 40, 0.2 * Math.PI, 0.8 * Math.PI)
  g.stroke()
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.font = `76px ${SANS}`
  const [line1, line2] = mode === 'text' ? ["YOU'VE BEEN", 'HERE BEFORE'] : ['SLEEP LIKE', 'A LOG']
  g.fillText(line1, 760, 190)
  g.fillText(line2, 760, 280)
  g.fillStyle = '#ffd34a'
  g.font = `bold 40px ${SERIF}`
  g.fillText('DREAMWELL BEDS', 760, 390)
  return finish(c)
})

/** The pub's hanging sign: a crowned king, or the crown floating over an empty collar. */
export const pubSignTexture = cached((mode: 'default' | 'headless') => {
  const [c, g] = canvas(256, 320)
  g.fillStyle = '#1f3d2b'
  g.fillRect(0, 0, 256, 320)
  g.strokeStyle = '#d9b44a'
  g.lineWidth = 8
  g.strokeRect(8, 8, 240, 304)
  g.fillStyle = '#d9b44a'
  g.textAlign = 'center'
  g.font = `bold 26px ${SERIF}`
  g.fillText("THE KING'S", 128, 46)
  g.fillText('HEAD', 128, 296)
  // shoulders in an ermine-trimmed robe
  g.fillStyle = '#8c1f2a'
  g.beginPath()
  g.ellipse(128, 268, 92, 52, 0, Math.PI, 0)
  g.fill()
  g.fillStyle = '#f4f0e6'
  g.fillRect(60, 216, 136, 18)
  if (mode === 'default') {
    g.fillStyle = '#e8b892'
    g.beginPath()
    g.ellipse(128, 160, 46, 56, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#7a5a3a'
    g.beginPath()
    g.ellipse(128, 196, 40, 26, 0, 0, Math.PI)
    g.fill()
    g.fillStyle = '#1a1a1a'
    g.fillRect(108, 150, 8, 8)
    g.fillRect(140, 150, 8, 8)
  }
  // the crown, sitting on the head or on nothing
  g.fillStyle = '#e8c33a'
  g.beginPath()
  g.moveTo(88, 112)
  for (let k = 0; k <= 4; k++) {
    g.lineTo(88 + k * 20, k % 2 ? 98 : 70)
  }
  g.lineTo(168, 112)
  g.closePath()
  g.fill()
  g.fillStyle = '#c8242c'
  g.beginPath()
  g.arc(128, 100, 6, 0, Math.PI * 2)
  g.fill()
  return finish(c)
})

/** Pennants for the lettered bunting: 8 × 4 cells, each a white triangle (apex down) with a black letter, clear round it. */
export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ'! "
export const letterAtlas = once(() => {
  const [c, g] = canvas(512, 256)
  g.font = `40px ${SANS}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  for (let k = 0; k < LETTERS.length; k++) {
    const x = (k % 8) * 64
    const y = Math.floor(k / 8) * 64
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.moveTo(x + 1, y + 1)
    g.lineTo(x + 63, y + 1)
    g.lineTo(x + 32, y + 63)
    g.closePath()
    g.fill()
    g.fillStyle = '#141414'
    g.fillText(LETTERS[k], x + 32, y + 22)
  }
  return finish(c)
})

/** Glazing bars of a phone box side: three panes across, eight down. */
export const phoneGlassTexture = once(() => {
  const [c, g] = canvas(256, 512)
  // white, so the material's own colour paints the bars (and a recolour repaints them)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 256, 512)
  // the panes are cut right out (the material alpha-tests them away), so you can see who's inside
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 3; i++) g.clearRect(22 + i * 72, 18 + j * 60, 64, 52)
  return finish(c)
})

/** The flag on the stone building: the city's (blue, a white saltire, a gold star) or a pirate's. */
export const flagTexture = cached((mode: 'city' | 'pirate') => {
  const [c, g] = canvas(256, 160)
  if (mode === 'pirate') {
    g.fillStyle = '#111111'
    g.fillRect(0, 0, 256, 160)
    g.fillStyle = '#f4f1e6'
    g.lineCap = 'round'
    g.strokeStyle = '#f4f1e6'
    g.lineWidth = 16
    g.beginPath()
    g.moveTo(80, 120)
    g.lineTo(176, 40)
    g.moveTo(80, 40)
    g.lineTo(176, 120)
    g.stroke()
    g.beginPath()
    g.arc(128, 68, 34, 0, Math.PI * 2)
    g.fill()
    g.fillRect(108, 84, 40, 24)
    g.fillStyle = '#111111'
    g.beginPath()
    g.arc(115, 66, 9, 0, Math.PI * 2)
    g.arc(141, 66, 9, 0, Math.PI * 2)
    g.fill()
    g.fillRect(114, 98, 4, 10)
    g.fillRect(126, 98, 4, 10)
    g.fillRect(138, 98, 4, 10)
  } else {
    g.fillStyle = '#1d3f8a'
    g.fillRect(0, 0, 256, 160)
    g.strokeStyle = '#ffffff'
    g.lineWidth = 26
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(256, 160)
    g.moveTo(256, 0)
    g.lineTo(0, 160)
    g.stroke()
    g.fillStyle = '#f2c230'
    g.beginPath()
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2
      const r = k % 2 ? 16 : 38
      g.lineTo(128 + Math.cos(a) * r, 80 + Math.sin(a) * r)
    }
    g.closePath()
    g.fill()
  }
  return finish(c)
})

/** Red, white and blue spiral stripes for the barber's pole (repeats). */
export const barberTexture = once(() => {
  const [c, g] = canvas(128)
  g.fillStyle = '#f4f4f0'
  g.fillRect(0, 0, 128, 128)
  const band = (colour: string, off: number) => {
    g.fillStyle = colour
    g.beginPath()
    g.moveTo(off, 0)
    g.lineTo(off + 32, 0)
    g.lineTo(off + 32 - 128, 128)
    g.lineTo(off - 128, 128)
    g.closePath()
    g.fill()
    g.beginPath()
    g.moveTo(off + 128, 0)
    g.lineTo(off + 160, 0)
    g.lineTo(off + 32, 128)
    g.lineTo(off, 128)
    g.closePath()
    g.fill()
  }
  band('#c8202a', 0)
  band('#1f4f9a', 64)
  return finish(c, true)
})
