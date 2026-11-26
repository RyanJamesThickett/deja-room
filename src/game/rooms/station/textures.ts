import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three'
import { once } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { cached } from '../market/build'

/*
 * Everything printed or patterned in the station is drawn on a canvas at load
 * time: the floor, the walls and the glazing, the evening sky and the street
 * outside, the departures board, the clock face, signs, posters, the map,
 * newspapers and magazines, screens, the train's windows.
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
const PLAIN = '"Segoe UI", Arial, Helvetica, sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Consolas", "Lucida Console", "Courier New", monospace'
const CHALK = '"Segoe Print", "Comic Sans MS", "Bradley Hand", cursive'

/** Light speckle all over, for grit. */
function grit(g: CanvasRenderingContext2D, w: number, h: number, n: number, alpha: number, seed: number) {
  const rng = mulberry32(seed)
  for (let k = 0; k < n; k++) {
    g.fillStyle = rng() < 0.5 ? `rgba(0,0,0,${rng() * alpha})` : `rgba(255,255,255,${rng() * alpha})`
    g.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2)
  }
}

/** Writes `text` centred on x, squeezed to fit `max` wide. */
function fitText(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number) {
  const w = g.measureText(text).width
  g.save()
  g.translate(x, y)
  if (w > max) g.scale(max / w, 1)
  g.fillText(text, 0, 0)
  g.restore()
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

// ---------------------------------------------------------------------------
// The building
// ---------------------------------------------------------------------------

/** Polished stone slabs, 2 m per repeat: a checker of 1 m cream and sand slabs. */
export const floorTexture = once(() => {
  const [c, g] = canvas(512)
  const shades = ['#f1e6cd', '#dccaa4']
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      g.fillStyle = shades[(i + j) % 2]
      g.fillRect(i * 256, j * 256, 256, 256)
    }
  grit(g, 512, 512, 5000, 0.07, 3)
  // terrazzo chips
  const rng = mulberry32(17)
  const chips = ['#c9b48a', '#a89676', '#ffffff', '#e0c9a0']
  for (let k = 0; k < 900; k++) {
    g.fillStyle = chips[Math.floor(rng() * chips.length)]
    g.globalAlpha = 0.35
    g.fillRect(rng() * 512, rng() * 512, 2 + rng() * 3, 2 + rng() * 3)
  }
  g.globalAlpha = 1
  g.fillStyle = 'rgba(70,55,35,0.45)'
  for (const p of [0, 256]) {
    g.fillRect(p, 0, 3, 512)
    g.fillRect(0, p, 512, 3)
  }
  return finish(c, true)
})

/** Glazed brick, 0.6 m per repeat: teal, in stretcher bond. */
export const tileTexture = once(() => {
  const [c, g] = canvas(128)
  g.fillStyle = '#14998c'
  g.fillRect(0, 0, 128, 128)
  // 6 courses of 2 bricks
  for (let row = 0; row < 6; row++) {
    const y = row * (128 / 6)
    const off = row % 2 ? 32 : 0
    for (let k = -1; k < 3; k++) {
      const x = off + k * 64
      const grad = g.createLinearGradient(0, y, 0, y + 21)
      grad.addColorStop(0, 'rgba(255,255,255,0.22)')
      grad.addColorStop(0.5, 'rgba(255,255,255,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.12)')
      g.fillStyle = grad
      g.fillRect(x + 2, y + 2, 60, 17)
    }
    g.fillStyle = 'rgba(230,240,230,0.55)'
    g.fillRect(0, y, 128, 2)
    for (let k = -1; k < 3; k++) g.fillRect(off + k * 64, y, 2, 128 / 6)
  }
  return finish(c, true)
})

/** Cream stone blocks, 2 m × 1 m per repeat. */
export const ashlarTexture = once(() => {
  const [c, g] = canvas(256, 128)
  g.fillStyle = '#efe0bf'
  g.fillRect(0, 0, 256, 128)
  grit(g, 256, 128, 1600, 0.06, 5)
  g.fillStyle = 'rgba(120,95,60,0.35)'
  for (const y of [0, 64]) g.fillRect(0, y, 256, 2)
  for (const [x, y] of [
    [0, 0],
    [128, 0],
    [64, 64],
    [192, 64],
  ])
    g.fillRect(x, y, 2, 64)
  return finish(c, true)
})

/** Pixels per metre on the side walls' picture. */
const WALL_PPM = 64

/**
 * The east and west walls, 22 m long and 9 m up to where the roof springs:
 * teal glazed brick to 3.2 m, a yellow band, then cream stone with five tall
 * arched windows full of evening sky, and a red frieze at the top.
 */
export const sideWallTexture = once(() => {
  const W = 22 * WALL_PPM
  const H = 9 * WALL_PPM
  const [c, g] = canvas(W, H)
  const y = (m: number) => (9 - m) * WALL_PPM
  // stone
  g.fillStyle = '#efe0bf'
  g.fillRect(0, 0, W, H)
  grit(g, W, H, 14000, 0.05, 9)
  g.fillStyle = 'rgba(120,95,60,0.28)'
  for (let m = 3.45, k = 0; m < 9; m += 0.6, k++) {
    g.fillRect(0, y(m), W, 2)
    for (let x = (k % 2) * 38; x < W; x += 77) g.fillRect(x, y(m + 0.6), 2, 0.6 * WALL_PPM)
  }
  // glazed brick dado
  const tile = tileTexture().image as HTMLCanvasElement
  const pattern = g.createPattern(tile, 'repeat')!
  g.save()
  g.translate(0, y(3.2))
  g.scale(0.6 * WALL_PPM / 128, 0.6 * WALL_PPM / 128)
  g.fillStyle = pattern
  g.fillRect(0, 0, W * 4, 3.2 * WALL_PPM * 4)
  g.restore()
  g.fillStyle = '#ffd21f'
  g.fillRect(0, y(3.45), W, 0.25 * WALL_PPM)
  g.fillStyle = '#141414'
  g.fillRect(0, y(3.45), W, 3)
  g.fillRect(0, y(3.2) - 3, W, 3)
  // the windows
  for (let k = 0; k < 5; k++) {
    const cx = (2.2 + k * 4.4) * WALL_PPM
    const hw = 1.2 * WALL_PPM
    const bottom = y(4.4)
    const spring = y(7.2)
    const shape = () => {
      g.beginPath()
      g.moveTo(cx - hw, bottom)
      g.lineTo(cx - hw, spring)
      g.arc(cx, spring, hw, Math.PI, 0)
      g.lineTo(cx + hw, bottom)
      g.closePath()
    }
    // a deep reveal
    g.save()
    g.translate(0, 0)
    shape()
    g.lineWidth = 26
    g.strokeStyle = '#d8c59c'
    g.stroke()
    const sky = g.createLinearGradient(0, spring - hw, 0, bottom)
    sky.addColorStop(0, '#2e2f7e')
    sky.addColorStop(0.45, '#9c4a8c')
    sky.addColorStop(1, '#ffab6b')
    g.fillStyle = sky
    shape()
    g.fill()
    // glazing bars
    g.save()
    shape()
    g.clip()
    g.fillStyle = '#f4ecd8'
    for (const f of [1 / 3, 2 / 3]) g.fillRect(cx - hw + f * hw * 2 - 2, spring - hw, 4, bottom - spring + hw)
    for (let m = 4.4; m < 8.4; m += 0.7) g.fillRect(cx - hw, y(m) - 2, hw * 2, 4)
    g.restore()
    g.lineWidth = 7
    g.strokeStyle = '#e8202a'
    shape()
    g.stroke()
    g.restore()
    // a sill
    g.fillStyle = '#d8c59c'
    g.fillRect(cx - hw - 12, bottom, hw * 2 + 24, 10)
  }
  // frieze
  g.fillStyle = '#e8202a'
  g.fillRect(0, y(8.8), W, 0.25 * WALL_PPM)
  g.fillStyle = '#141414'
  for (let x = 6; x < W; x += 24) g.fillRect(x, y(8.55), 12, 10)
  return finish(c)
})

/** Iron glazing bars round panes of glass, 1.5 m per repeat; the panes are see-through. */
export const glazingTexture = once(() => {
  const [c, g] = canvas(128)
  g.fillStyle = 'rgba(205,225,240,0.13)'
  g.fillRect(0, 0, 128, 128)
  g.fillStyle = '#18454f'
  g.fillRect(0, 0, 128, 5)
  g.fillRect(0, 123, 128, 5)
  g.fillRect(0, 0, 5, 128)
  g.fillRect(123, 0, 5, 128)
  g.fillRect(62, 0, 3, 128)
  return finish(c, true)
})

/** Smooth evening sky for the dome round everything: dusk above, the last of the sunset low in the west. */
export const skyTexture = once(() => {
  const [c, g] = canvas(1024, 512)
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, '#101540')
  grad.addColorStop(0.35, '#33307a')
  grad.addColorStop(0.68, '#a0467f')
  grad.addColorStop(0.9, '#ff8556')
  grad.addColorStop(1, '#ffc27a')
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 256)
  g.fillStyle = '#2a2236'
  g.fillRect(0, 256, 1024, 256)
  // the sun's glow, low in the west
  const sun = g.createRadialGradient(768, 250, 4, 768, 250, 220)
  sun.addColorStop(0, 'rgba(255,236,170,0.95)')
  sun.addColorStop(0.15, 'rgba(255,170,90,0.6)')
  sun.addColorStop(1, 'rgba(255,120,90,0)')
  g.fillStyle = sun
  g.fillRect(500, 30, 520, 226)
  // a few long pink clouds
  const rng = mulberry32(41)
  for (let k = 0; k < 26; k++) {
    const x = rng() * 1024
    const yy = 120 + rng() * 110
    g.fillStyle = `rgba(255,${140 + rng() * 60},${150 + rng() * 40},${0.18 + rng() * 0.2})`
    g.beginPath()
    g.ellipse(x, yy, 40 + rng() * 90, 3 + rng() * 5, 0, 0, Math.PI * 2)
    g.fill()
  }
  // the first stars
  for (let k = 0; k < 140; k++) {
    g.fillStyle = `rgba(255,255,255,${0.3 + rng() * 0.6})`
    g.fillRect(rng() * 1024, rng() * 90, 1.5, 1.5)
  }
  return finish(c)
})

/** The street outside the main doors at dusk: shopfronts and flats with their lights on. Clear above the rooftops. */
export const streetTexture = once(() => {
  const [c, g] = canvas(1024, 512)
  const rng = mulberry32(77)
  const colours = ['#3b2f5c', '#2d3557', '#4a2f4f', '#36304a', '#283a4f']
  let x = 0
  while (x < 1024) {
    const w = 70 + rng() * 90
    const top = 60 + rng() * 170
    g.fillStyle = colours[Math.floor(rng() * colours.length)]
    g.fillRect(x, top, w + 1, 512 - top)
    // lit windows
    for (let wy = top + 18; wy < 400; wy += 34)
      for (let wx = x + 10; wx < x + w - 18; wx += 24) {
        if (rng() < 0.45) continue
        g.fillStyle = rng() < 0.7 ? '#ffd27a' : '#ffefc0'
        g.fillRect(wx, wy, 12, 18)
      }
    // a parapet
    g.fillStyle = 'rgba(0,0,0,0.25)'
    g.fillRect(x, top, w, 6)
    x += w
  }
  // shopfronts along the bottom
  for (let k = 0; k < 9; k++) {
    const sx = k * 118 + 6
    g.fillStyle = ['#ff3131', '#1f6bff', '#ffd21f', '#22b56a', '#ff3fa4'][k % 5]
    g.fillRect(sx, 400, 106, 22)
    g.fillStyle = '#ffe9b8'
    g.fillRect(sx + 6, 426, 94, 70)
    g.fillStyle = 'rgba(60,40,30,0.5)'
    g.fillRect(sx + 50, 426, 3, 70)
  }
  g.fillStyle = '#1e1a26'
  g.fillRect(0, 496, 1024, 16)
  return finish(c)
})

/** Streaks of rain, 2 m per repeat, on clear. */
export const rainTexture = once(() => {
  const [c, g] = canvas(128, 256)
  const rng = mulberry32(5)
  g.strokeStyle = 'rgba(220,230,255,0.55)'
  g.lineWidth = 1.5
  for (let k = 0; k < 90; k++) {
    const x = rng() * 128
    const y = rng() * 256
    const len = 14 + rng() * 22
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x - 2, y + len)
    g.stroke()
  }
  return finish(c, true)
})

/** A night sky full of stars, for the fan window when night falls early. */
export const nightTexture = once(() => {
  const [c, g] = canvas(512, 256)
  g.fillStyle = '#060a24'
  g.fillRect(0, 0, 512, 256)
  const rng = mulberry32(99)
  for (let k = 0; k < 260; k++) {
    const r = rng() < 0.08 ? 2.2 : 1.1
    g.fillStyle = `rgba(255,255,${200 + rng() * 55},${0.5 + rng() * 0.5})`
    g.beginPath()
    g.arc(rng() * 512, rng() * 256, r, 0, Math.PI * 2)
    g.fill()
  }
  return finish(c)
})

/** A big round moon with a face, looking down and in. */
export const moonTexture = once(() => {
  const [c, g] = canvas(512)
  const grad = g.createRadialGradient(220, 210, 30, 256, 256, 250)
  grad.addColorStop(0, '#fffbe0')
  grad.addColorStop(1, '#f2d98a')
  g.fillStyle = grad
  g.beginPath()
  g.arc(256, 256, 250, 0, Math.PI * 2)
  g.fill()
  const rng = mulberry32(12)
  for (let k = 0; k < 14; k++) {
    g.fillStyle = `rgba(190,160,90,${0.25 + rng() * 0.2})`
    g.beginPath()
    const a = rng() * Math.PI * 2
    const d = rng() * 200
    g.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, 10 + rng() * 26, 0, Math.PI * 2)
    g.fill()
  }
  // eyes looking down and to the left, into the station
  for (const ex of [180, 330]) {
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.ellipse(ex, 220, 46, 36, 0, 0, Math.PI * 2)
    g.fill()
    g.lineWidth = 8
    g.strokeStyle = '#141414'
    g.stroke()
    g.fillStyle = '#141414'
    g.beginPath()
    g.arc(ex - 16, 236, 18, 0, Math.PI * 2)
    g.fill()
  }
  g.lineWidth = 12
  g.beginPath()
  g.arc(256, 330, 70, 0.2 * Math.PI, 0.8 * Math.PI)
  g.stroke()
  return finish(c)
})

/** Gravel between the rails with concrete sleepers across, 2.6 m per repeat. */
export const ballastTexture = once(() => {
  const [c, g] = canvas(256)
  g.fillStyle = '#4a4540'
  g.fillRect(0, 0, 256, 256)
  grit(g, 256, 256, 6000, 0.35, 23)
  g.fillStyle = '#8e8a84'
  for (let k = 0; k < 4; k++) g.fillRect(14, k * 64 + 24, 228, 16)
  return finish(c, true)
})

// ---------------------------------------------------------------------------
// The departures board and the clock
// ---------------------------------------------------------------------------

export type BoardMode = 'default' | 'atlantis' | 'delayed' | 'arrivals'

const DEPARTURES: [string, string, string, string][] = [
  ['18:12', 'BRIGHTON', '2', 'ON TIME'],
  ['18:20', 'MANCHESTER', '4', 'ON TIME'],
  ['18:27', 'EDINBURGH', '1', 'EXP 18:34'],
  ['18:35', 'CARDIFF', '3', 'ON TIME'],
  ['18:42', 'PORTSMOUTH HBR', '2', 'ON TIME'],
  ['18:50', 'YORK', '4', 'CANCELLED'],
]

/** Board aspect: 9 m by 2.6 m. */
export const BOARD = { w: 9, h: 2.62 }

/** Split-flap departures: amber letters on black flaps, one cell per character. */
export const boardTexture = cached((mode: BoardMode) => {
  const W = 1536
  const H = Math.round((W * BOARD.h) / BOARD.w)
  const [c, g] = canvas(W, H)
  g.fillStyle = '#0d0d0f'
  g.fillRect(0, 0, W, H)
  // the heading, in white on blue
  g.fillStyle = '#1f6bff'
  g.fillRect(0, 0, W, 74)
  g.fillStyle = '#ffffff'
  g.font = `56px ${SANS}`
  g.textBaseline = 'middle'
  g.textAlign = 'left'
  g.fillText(mode === 'arrivals' ? 'ARRIVALS' : 'DEPARTURES', 24, 40)
  g.textAlign = 'right'
  g.fillStyle = '#ffd21f'
  g.fillText('18:10', W - 24, 40)
  // column headings
  const pitch = 40
  const x0 = 24
  const cols = { time: x0, dest: x0 + 6 * pitch, plat: x0 + 21 * pitch, exp: x0 + 24 * pitch }
  g.font = `bold 22px ${PLAIN}`
  g.fillStyle = '#c9c9c9'
  g.textAlign = 'left'
  g.fillText('TIME', cols.time, 96)
  g.fillText(mode === 'arrivals' ? 'FROM' : 'DESTINATION', cols.dest, 96)
  g.fillText('PLAT', cols.plat, 96)
  g.fillText('EXPECTED', cols.exp, 96)
  const flaps = (text: string, x: number, y: number, n: number) => {
    for (let k = 0; k < n; k++) {
      const cx = x + k * pitch
      g.fillStyle = '#26262a'
      g.fillRect(cx, y, pitch - 4, 50)
      g.fillStyle = '#000000'
      g.fillRect(cx, y + 24, pitch - 4, 2)
      const ch = text[k]
      if (!ch || ch === ' ') continue
      g.fillStyle = '#ffb81c'
      g.font = `bold 40px ${MONO}`
      g.textAlign = 'center'
      g.fillText(ch, cx + (pitch - 4) / 2, y + 27)
    }
  }
  DEPARTURES.forEach(([time, dest, plat, exp], i) => {
    const y = 114 + i * 58
    const d = mode === 'atlantis' && i === 0 ? 'ATLANTIS' : dest
    const e = mode === 'delayed' ? 'DELAYED' : exp
    flaps(time, cols.time, y, 5)
    flaps(d, cols.dest, y, 14)
    flaps(plat, cols.plat, y, 2)
    flaps(e, cols.exp, y, 9)
  })
  return finish(c)
})

/** The hanging clock's face: Arabic numerals, or the same running backwards. */
export const clockTexture = cached((mode: 'default' | 'backwards') => {
  const [c, g] = canvas(512)
  g.fillStyle = '#fbf8ee'
  g.beginPath()
  g.arc(256, 256, 252, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#ff3131'
  g.lineWidth = 14
  g.beginPath()
  g.arc(256, 256, 238, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = '#141414'
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2
    const long = k % 5 === 0
    g.save()
    g.translate(256, 256)
    g.rotate(a)
    g.fillRect(long ? -6 : -2, -222, long ? 12 : 4, long ? 30 : 12)
    g.restore()
  }
  g.font = `64px ${SANS}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  for (let k = 1; k <= 12; k++) {
    const a = ((mode === 'backwards' ? -k : k) / 12) * Math.PI * 2
    g.fillText(String(k), 256 + Math.sin(a) * 158, 256 - Math.cos(a) * 158)
  }
  g.font = `bold 20px ${PLAIN}`
  g.fillText('CENTRAL', 256, 330)
  return finish(c)
})

// ---------------------------------------------------------------------------
// Signs
// ---------------------------------------------------------------------------

/** A platform number: a big black number on a yellow plate. */
export const plateTexture = cached((text: string) => {
  const [c, g] = canvas(256)
  g.fillStyle = '#141414'
  roundRect(g, 0, 0, 256, 256, 30)
  g.fill()
  g.fillStyle = '#ffd21f'
  roundRect(g, 12, 12, 232, 232, 22)
  g.fill()
  g.fillStyle = '#141414'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `${text.length > 1 ? 150 : 190}px ${SANS}`
  fitText(g, text, 128, 140, 210)
  return finish(c)
})

/**
 * A lettered sign: one or more lines centred on a flat colour. Use `sign()`
 * to ask for one. `style` "rim" adds a white border inside the edge.
 */
const signTexture = cached((key: string) => {
  const [text, bg, fg, ws, hs, style] = key.split('|')
  const w = Number(ws)
  const h = Number(hs)
  const [c, g] = canvas(w, h)
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  if (style === 'rim') {
    g.strokeStyle = fg
    g.lineWidth = Math.max(4, h * 0.04)
    g.strokeRect(h * 0.07, h * 0.07, w - h * 0.14, h - h * 0.14)
  }
  const lines = text.split('\n')
  const size = Math.min((h * 0.62) / lines.length, (h * 0.8) / lines.length)
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `${Math.round(size)}px ${SANS}`
  lines.forEach((l, i) => fitText(g, l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.15 + size * 0.04, w * 0.9))
  return finish(c)
})

export function sign(text: string, bg: string, fg: string, w = 512, h = 128, style: '' | 'rim' = '') {
  return signTexture([text, bg, fg, w, h, style].join('|'))
}

/** A chalk A-board face: a heading and a few lines, 256 × 384. */
export const chalkTexture = cached((text: string) => {
  const [c, g] = canvas(256, 384)
  g.fillStyle = '#23272a'
  g.fillRect(0, 0, 256, 384)
  const rng = mulberry32(text.length * 7)
  for (let k = 0; k < 40; k++) {
    g.fillStyle = `rgba(255,255,255,${rng() * 0.05})`
    g.fillRect(rng() * 256, rng() * 384, 20 + rng() * 60, 3 + rng() * 8)
  }
  const [head, ...lines] = text.split('\n')
  g.textAlign = 'center'
  g.fillStyle = '#ffe36b'
  g.font = `bold 38px ${CHALK}`
  fitText(g, head, 128, 62, 236)
  g.font = `26px ${CHALK}`
  const colours = ['#ffffff', '#ff9fc4', '#9fe2ff', '#c8ff9f', '#ffffff']
  lines.forEach((l, i) => {
    g.fillStyle = colours[i % colours.length]
    fitText(g, l, 128, 124 + i * 50, 236)
  })
  return finish(c)
})

/** A yellow wet-floor sign's face: warning triangle with someone slipping. */
export const wetFloorTexture = once(() => {
  const [c, g] = canvas(256, 384)
  g.fillStyle = '#ffd21f'
  g.fillRect(0, 0, 256, 384)
  g.fillStyle = '#141414'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `40px ${SANS}`
  fitText(g, 'CAUTION', 128, 48, 220)
  g.beginPath()
  g.moveTo(128, 96)
  g.lineTo(226, 262)
  g.lineTo(30, 262)
  g.closePath()
  g.lineWidth = 14
  g.lineJoin = 'round'
  g.stroke()
  // a stick figure going over backwards
  g.lineWidth = 9
  g.lineCap = 'round'
  g.beginPath()
  g.arc(150, 150, 13, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.moveTo(140, 168)
  g.lineTo(112, 210)
  g.moveTo(112, 210)
  g.lineTo(82, 232)
  g.moveTo(112, 210)
  g.lineTo(150, 236)
  g.moveTo(132, 180)
  g.lineTo(168, 190)
  g.moveTo(130, 182)
  g.lineTo(98, 170)
  g.stroke()
  g.font = `34px ${SANS}`
  fitText(g, 'WET', 128, 304, 220)
  fitText(g, 'FLOOR', 128, 346, 220)
  return finish(c)
})

/** A roller shutter, ribbed grey, with something sprayed or taped on. */
export const shutterTexture = cached((text: string) => {
  const [c, g] = canvas(512, 256)
  g.fillStyle = '#b6b9bd'
  g.fillRect(0, 0, 512, 256)
  for (let y = 0; y < 256; y += 12) {
    g.fillStyle = 'rgba(0,0,0,0.18)'
    g.fillRect(0, y, 512, 3)
    g.fillStyle = 'rgba(255,255,255,0.25)'
    g.fillRect(0, y + 4, 512, 2)
  }
  if (text) {
    g.fillStyle = '#ffffff'
    g.fillRect(156, 90, 200, 76)
    g.strokeStyle = '#141414'
    g.lineWidth = 4
    g.strokeRect(156, 90, 200, 76)
    g.fillStyle = '#ff3131'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `40px ${SANS}`
    fitText(g, text, 256, 130, 180)
  }
  return finish(c)
})

/** Yellow and black hazard stripes. */
export const hazardTexture = once(() => {
  const [c, g] = canvas(256, 32)
  g.fillStyle = '#ffd21f'
  g.fillRect(0, 0, 256, 32)
  g.fillStyle = '#141414'
  for (let x = -32; x < 256; x += 32) {
    g.beginPath()
    g.moveTo(x, 32)
    g.lineTo(x + 16, 32)
    g.lineTo(x + 32, 0)
    g.lineTo(x + 16, 0)
    g.closePath()
    g.fill()
  }
  return finish(c, true)
})

// ---------------------------------------------------------------------------
// Posters, the map and print
// ---------------------------------------------------------------------------

/** A seaside holiday poster, 2.4 m × 1.6 m: sun, sea and sand; a shark's fin; or rain. */
export const posterTexture = cached((mode: 'default' | 'shark' | 'rain') => {
  const [c, g] = canvas(480, 320)
  g.fillStyle = mode === 'rain' ? '#7d8796' : '#16c6f0'
  g.fillRect(0, 0, 480, 190)
  if (mode === 'rain') {
    g.fillStyle = '#4a5260'
    for (const [x, y, r] of [
      [330, 70, 40],
      [380, 60, 50],
      [430, 78, 36],
      [360, 95, 40],
    ]) {
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
    }
    g.strokeStyle = '#dde6f5'
    g.lineWidth = 4
    for (let k = 0; k < 40; k++) {
      const x = 20 + ((k * 53) % 460)
      const y = 110 + ((k * 37) % 120)
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x - 8, y + 26)
      g.stroke()
    }
  } else {
    // a big smiling sun with rays
    g.fillStyle = '#ffd21f'
    g.strokeStyle = '#ff8a1f'
    g.lineWidth = 10
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      g.beginPath()
      g.moveTo(380 + Math.cos(a) * 58, 80 + Math.sin(a) * 58)
      g.lineTo(380 + Math.cos(a) * 82, 80 + Math.sin(a) * 82)
      g.stroke()
    }
    g.beginPath()
    g.arc(380, 80, 50, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#141414'
    g.fillRect(362, 68, 8, 8)
    g.fillRect(390, 68, 8, 8)
    g.lineWidth = 5
    g.strokeStyle = '#141414'
    g.beginPath()
    g.arc(380, 86, 20, 0.2 * Math.PI, 0.8 * Math.PI)
    g.stroke()
  }
  // the sea in stripes, then the sand
  const seas = mode === 'rain' ? ['#2c4f78', '#3b6590'] : ['#1f6bff', '#3f88ff']
  for (let k = 0; k < 4; k++) {
    g.fillStyle = seas[k % 2]
    g.fillRect(0, 190 + k * 16, 480, 16)
  }
  if (mode === 'shark') {
    g.fillStyle = '#5d6670'
    g.beginPath()
    g.moveTo(150, 214)
    g.quadraticCurveTo(178, 160, 196, 150)
    g.quadraticCurveTo(190, 190, 206, 214)
    g.closePath()
    g.fill()
  }
  g.fillStyle = '#ffd98a'
  g.fillRect(0, 254, 480, 66)
  // a beach umbrella
  g.fillStyle = '#ff3131'
  g.beginPath()
  g.moveTo(40, 254)
  g.arc(90, 254, 50, Math.PI, 0)
  g.fill()
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.moveTo(90, 254)
  g.arc(90, 254, 50, Math.PI * 1.3, Math.PI * 1.55)
  g.fill()
  g.fillRect(88, 254, 4, 40)
  // the words
  g.textAlign = 'left'
  g.textBaseline = 'alphabetic'
  g.font = `62px ${SANS}`
  g.lineWidth = 8
  g.strokeStyle = '#141414'
  g.strokeText('SEASIDE!', 20, 70)
  g.fillStyle = '#ff3fa4'
  g.fillText('SEASIDE!', 20, 70)
  g.font = `26px ${SANS}`
  g.fillStyle = '#141414'
  g.fillText('DAY RETURNS FROM £9', 150, 300)
  return finish(c)
})

/** Stations on the network map, as fractions of its width and height. */
const MAP_LINES: { colour: string; stops: [number, number][] }[] = [
  { colour: '#ff3131', stops: [[0.06, 0.3], [0.3, 0.3], [0.48, 0.52], [0.72, 0.52], [0.94, 0.4]] },
  { colour: '#1f6bff', stops: [[0.2, 0.86], [0.34, 0.66], [0.48, 0.52], [0.6, 0.3], [0.8, 0.2]] },
  { colour: '#22b56a', stops: [[0.1, 0.62], [0.34, 0.66], [0.62, 0.78], [0.9, 0.78]] },
  { colour: '#ffb81c', stops: [[0.48, 0.16], [0.48, 0.52], [0.5, 0.9]] },
  { colour: '#ff3fa4', stops: [[0.72, 0.52], [0.8, 0.2]] },
]

/** The network map, 2.2 m × 1.5 m, with a YOU ARE HERE dot: at Central, or somewhere else entirely. */
export const mapTexture = cached((mode: 'default' | 'moved') => {
  const W = 528
  const H = 360
  const [c, g] = canvas(W, H)
  g.fillStyle = '#fbfaf5'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#141414'
  g.fillRect(0, 0, W, 40)
  g.fillStyle = '#ffffff'
  g.font = `24px ${SANS}`
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  g.fillText('NETWORK MAP', 14, 21)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  for (const line of MAP_LINES) {
    g.strokeStyle = line.colour
    g.lineWidth = 10
    g.beginPath()
    line.stops.forEach(([x, y], i) => (i ? g.lineTo(x * W, 40 + y * (H - 50)) : g.moveTo(x * W, 40 + y * (H - 50))))
    g.stroke()
  }
  for (const line of MAP_LINES)
    for (const [x, y] of line.stops) {
      g.fillStyle = '#ffffff'
      g.strokeStyle = '#141414'
      g.lineWidth = 4
      g.beginPath()
      g.arc(x * W, 40 + y * (H - 50), 8, 0, Math.PI * 2)
      g.fill()
      g.stroke()
    }
  const [hx, hy] = mode === 'moved' ? [0.9, 0.78] : [0.48, 0.52]
  g.fillStyle = '#ff3131'
  g.beginPath()
  g.arc(hx * W, 40 + hy * (H - 50), 17, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#141414'
  g.font = `15px ${SANS}`
  g.textAlign = hx > 0.7 ? 'right' : 'left'
  g.fillText('YOU ARE HERE', hx * W + (hx > 0.7 ? -24 : 24), 40 + hy * (H - 50) - 20)
  return finish(c)
})

/** The front page of the evening paper. */
export const paperTexture = cached((mode: 'default' | 'missed') => {
  const [c, g] = canvas(256, 320)
  g.fillStyle = '#efeee6'
  g.fillRect(0, 0, 256, 320)
  g.fillStyle = '#141414'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `bold 30px ${SERIF}`
  fitText(g, 'Evening Post', 128, 28, 236)
  g.fillRect(10, 48, 236, 3)
  g.font = `44px ${SANS}`
  const lines = mode === 'missed' ? ['YOU', 'MISSED', 'YOUR TRAIN'] : ['TRAINS', 'ON TIME', 'SHOCK']
  lines.forEach((l, i) => fitText(g, l, 128, 88 + i * 46, 236))
  g.fillStyle = '#9aa3ad'
  g.fillRect(12, 222, 110, 86)
  g.fillStyle = 'rgba(0,0,0,0.35)'
  for (let y = 224; y < 306; y += 7) g.fillRect(134, y, 110, 3)
  return finish(c)
})

/** A wall of magazines, 4 × 2 covers; or every cover gone blank. */
export const coversTexture = cached((mode: 'default' | 'blank') => {
  const [c, g] = canvas(512, 320)
  g.fillStyle = '#e8e4da'
  g.fillRect(0, 0, 512, 320)
  const titles = ['STYLE', 'GOAL!', 'CARS', 'TV WEEK', 'GARDEN', 'PUZZLE', 'TECH', 'FOOD']
  const bgs = ['#ff3fa4', '#22b56a', '#ff3131', '#1f6bff', '#8fd14f', '#ffd21f', '#141414', '#ff8a1f']
  for (let k = 0; k < 8; k++) {
    const x = (k % 4) * 128 + 8
    const y = Math.floor(k / 4) * 160 + 8
    g.fillStyle = mode === 'blank' ? '#ffffff' : bgs[k]
    g.fillRect(x, y, 112, 144)
    if (mode === 'blank') {
      g.strokeStyle = '#d6d2c8'
      g.lineWidth = 2
      g.strokeRect(x, y, 112, 144)
      continue
    }
    g.fillStyle = k === 5 ? '#141414' : '#ffffff'
    g.font = `24px ${SANS}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    fitText(g, titles[k], x + 56, y + 22, 100)
    // a cover star: a round head and shoulders
    g.fillStyle = k % 2 ? '#ffd9b0' : '#c98a5a'
    g.beginPath()
    g.arc(x + 56, y + 78, 22, 0, Math.PI * 2)
    g.fill()
    g.fillRect(x + 26, y + 104, 60, 40)
  }
  return finish(c)
})

/** A ticket machine's screen. */
export const screenTexture = cached((mode: 'default' | 'face' | 'dark') => {
  const [c, g] = canvas(256, 192)
  if (mode === 'dark') {
    g.fillStyle = '#07080a'
    g.fillRect(0, 0, 256, 192)
    return finish(c)
  }
  g.fillStyle = '#1f6bff'
  g.fillRect(0, 0, 256, 192)
  if (mode === 'face') {
    // a face, filling the screen, looking straight out
    g.fillStyle = '#ffd9b0'
    g.beginPath()
    g.ellipse(128, 100, 74, 90, 0, 0, Math.PI * 2)
    g.fill()
    for (const ex of [98, 158]) {
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.ellipse(ex, 88, 17, 12, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#141414'
      g.beginPath()
      g.arc(ex, 90, 7, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#8a2a2a'
    g.fillRect(104, 140, 48, 6)
    return finish(c)
  }
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `30px ${SANS}`
  fitText(g, 'TICKETS', 128, 52, 230)
  g.fillStyle = '#ffd21f'
  roundRect(g, 38, 100, 180, 54, 12)
  g.fill()
  g.fillStyle = '#141414'
  g.font = `22px ${SANS}`
  fitText(g, 'TOUCH TO START', 128, 128, 160)
  return finish(c)
})

/** The train's destination display: orange LED letters. */
export const destTexture = cached((text: string) => {
  const [c, g] = canvas(512, 96)
  g.fillStyle = '#0b0b0b'
  g.fillRect(0, 0, 512, 96)
  g.fillStyle = '#ff9a1c'
  g.font = `bold 58px ${MONO}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  fitText(g, text, 256, 50, 480)
  // the dot matrix
  g.fillStyle = 'rgba(0,0,0,0.55)'
  for (let x = 0; x < 512; x += 6) g.fillRect(x, 0, 2, 96)
  for (let y = 0; y < 96; y += 6) g.fillRect(0, y, 512, 2)
  return finish(c)
})

/** The train's window band, 4 m per repeat: two lit windows; or faces pressed to every one of them. */
export const trainWindowsTexture = cached((faces: boolean) => {
  const [c, g] = canvas(512, 128)
  g.fillStyle = '#f3f1ea'
  g.fillRect(0, 0, 512, 128)
  for (const x0 of [28, 284]) {
    g.fillStyle = '#141414'
    roundRect(g, x0 - 4, 10, 208, 108, 18)
    g.fill()
    g.fillStyle = '#ffe9b0'
    roundRect(g, x0, 14, 200, 100, 14)
    g.fill()
    // seat backs
    g.fillStyle = '#1f6bff'
    for (let k = 0; k < 3; k++) g.fillRect(x0 + 12 + k * 66, 70, 44, 44)
    if (faces) {
      for (let k = 0; k < 3; k++) {
        const fx = x0 + 34 + k * 66
        g.fillStyle = '#f6d7b6'
        g.beginPath()
        g.ellipse(fx, 56, 24, 30, 0, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#141414'
        g.beginPath()
        g.arc(fx - 9, 50, 4.5, 0, Math.PI * 2)
        g.arc(fx + 9, 50, 4.5, 0, Math.PI * 2)
        g.fill()
        g.beginPath()
        g.ellipse(fx, 70, 6, 4, 0, 0, Math.PI * 2)
        g.fill()
      }
    }
    // glare
    g.fillStyle = 'rgba(255,255,255,0.25)'
    g.beginPath()
    g.moveTo(x0 + 120, 14)
    g.lineTo(x0 + 160, 14)
    g.lineTo(x0 + 110, 114)
    g.lineTo(x0 + 70, 114)
    g.closePath()
    g.fill()
  }
  return finish(c, true)
})

/** An upright piano's keyboard from above; or every key black. */
export const keysTexture = cached((black: boolean) => {
  const [c, g] = canvas(1024, 96)
  const n = 36
  const kw = 1024 / n
  g.fillStyle = black ? '#141414' : '#fbf9f2'
  g.fillRect(0, 0, 1024, 96)
  g.fillStyle = black ? '#3a3a3a' : '#8a8478'
  for (let k = 0; k <= n; k++) g.fillRect(k * kw - 1, 0, 2, 96)
  g.fillStyle = '#141414'
  // black keys in groups of two and three
  for (let k = 0; k < n - 1; k++) {
    const inOctave = k % 7
    if (inOctave === 2 || inOctave === 6) continue
    g.fillRect((k + 1) * kw - kw * 0.3, 0, kw * 0.6, 58)
  }
  return finish(c)
})

/** The front of a bank of left-luggage lockers, 4 × 5 doors in pop colours, numbered. */
export const lockerTexture = once(() => {
  const [c, g] = canvas(512, 540)
  const colours = ['#ff8a1f', '#1f6bff', '#ffd21f', '#ff3fa4', '#22b56a']
  g.fillStyle = '#2a2a2e'
  g.fillRect(0, 0, 512, 540)
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 4; col++) {
      const x = col * 128 + 5
      const y = row * 108 + 5
      g.fillStyle = colours[(row + col * 2) % colours.length]
      g.fillRect(x, y, 118, 98)
      g.fillStyle = 'rgba(0,0,0,0.25)'
      for (let k = 0; k < 4; k++) g.fillRect(x + 30, y + 14 + k * 8, 58, 3)
      g.fillStyle = '#141414'
      g.font = `26px ${SANS}`
      g.textAlign = 'left'
      g.textBaseline = 'middle'
      g.fillText(String(row * 4 + col + 1), x + 10, y + 74)
      g.fillStyle = '#d8d8d8'
      g.beginPath()
      g.arc(x + 96, y + 70, 9, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#141414'
      g.fillRect(x + 94, y + 66, 4, 9)
    }
  return finish(c)
})

/** Sample strips on the photo booth's side: four poses, a price. */
export const photoSamplesTexture = once(() => {
  const [c, g] = canvas(256, 512)
  g.fillStyle = '#ffd21f'
  g.fillRect(0, 0, 256, 512)
  g.fillStyle = '#141414'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `44px ${SANS}`
  fitText(g, 'PHOTOS', 128, 44, 230)
  const faces = ['#f6d7b6', '#c98a5a', '#8a5a3a', '#ffd9b0']
  for (let k = 0; k < 4; k++) {
    const y = 84 + k * 86
    g.fillStyle = '#ffffff'
    g.fillRect(64, y, 128, 80)
    g.fillStyle = ['#ff3fa4', '#16c6f0', '#22b56a', '#ff8a1f'][k]
    g.fillRect(70, y + 6, 116, 68)
    g.fillStyle = faces[k]
    g.beginPath()
    g.arc(128, y + 34, 18, 0, Math.PI * 2)
    g.fill()
    g.fillRect(100, y + 52, 56, 22)
  }
  g.fillStyle = '#141414'
  g.font = `34px ${SANS}`
  fitText(g, '4 POSES £6', 128, 470, 230)
  return finish(c)
})
