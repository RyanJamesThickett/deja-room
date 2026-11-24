import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three'
import { layerTexture, once, type OutsideLayer } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { WORKSHOP as B } from './bounds'
import { FLOOR_BAY, LIFT_BAY } from './layout'

/*
 * Everything printed or painted in the garage is drawn on a canvas at load
 * time: the oil-stained floor, the breeze-block walls, the pegboard, the
 * roller door slats, the wall of old posters, the calendar, number plates
 * and the office's blinds.
 */

export function canvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

export function finish(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(...repeat)
  } else {
    t.wrapS = t.wrapT = ClampToEdgeWrapping
  }
  return t
}

export type G = CanvasRenderingContext2D

export function speckle(g: G, w: number, h: number, n: number, seed: number, alpha = 0.08) {
  const rng = mulberry32(seed)
  for (let k = 0; k < n; k++) {
    g.fillStyle = rng() < 0.5 ? `rgba(0,0,0,${rng() * alpha})` : `rgba(255,255,255,${rng() * alpha})`
    g.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2)
  }
}

function stain(g: G, x: number, y: number, r: number, alpha: number, squash = 0.7) {
  g.save()
  g.translate(x, y)
  g.scale(1, squash)
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, r)
  grad.addColorStop(0, `rgba(28,22,14,${alpha})`)
  grad.addColorStop(0.6, `rgba(28,22,14,${alpha * 0.6})`)
  grad.addColorStop(1, 'rgba(28,22,14,0)')
  g.fillStyle = grad
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.fill()
  g.restore()
}

/** The whole concrete floor in one go: slab joints, oil stains under each engine, yellow bay lines. */
export function floorTexture() {
  const W = B.halfX * 2
  const D = B.halfZ * 2
  const ppm = 180
  const [c, g] = canvas(Math.round(W * ppm), Math.round(D * ppm))
  const px = (x: number) => (x + B.halfX) * ppm
  const pz = (z: number) => (z + B.halfZ) * ppm
  g.fillStyle = '#8e8f8a'
  g.fillRect(0, 0, c.width, c.height)
  // power-floated concrete: cloudy patches and grit
  const rng = mulberry32(31)
  for (let k = 0; k < 140; k++) {
    g.fillStyle = `rgba(${rng() < 0.5 ? '255,255,255' : '40,40,36'},${rng() * 0.05})`
    g.beginPath()
    g.ellipse(rng() * c.width, rng() * c.height, 40 + rng() * 160, 30 + rng() * 120, rng() * 3, 0, Math.PI * 2)
    g.fill()
  }
  speckle(g, c.width, c.height, 30000, 32, 0.12)
  // saw-cut slab joints
  g.strokeStyle = 'rgba(30,30,28,0.55)'
  g.lineWidth = 3
  for (const x of [-1.85 + 0.6, 3.6]) {
    g.beginPath()
    g.moveTo(px(x), 0)
    g.lineTo(px(x), c.height)
    g.stroke()
  }
  g.beginPath()
  g.moveTo(0, pz(-1.9))
  g.lineTo(c.width, pz(-1.9))
  g.stroke()
  // oil: a big old stain under each engine, drips everywhere else
  stain(g, px(LIFT_BAY.x), pz(LIFT_BAY.z - 1.3), 140, 0.55)
  stain(g, px(FLOOR_BAY.x), pz(FLOOR_BAY.z - 1.3), 120, 0.5)
  stain(g, px(FLOOR_BAY.x + 0.4), pz(FLOOR_BAY.z + 1.8), 60, 0.35)
  for (let k = 0; k < 26; k++) stain(g, rng() * c.width, rng() * c.height, 10 + rng() * 45, 0.15 + rng() * 0.3, 0.5 + rng() * 0.5)
  // tyre marks running in from the doors
  g.strokeStyle = 'rgba(20,20,20,0.12)'
  g.lineWidth = 30
  for (const bay of [LIFT_BAY, FLOOR_BAY]) {
    for (const s of [-1, 1]) {
      g.beginPath()
      g.moveTo(px(bay.x + s * 0.78), c.height)
      g.lineTo(px(bay.x + s * 0.78), pz(bay.z - 1.2))
      g.stroke()
    }
  }
  // worn yellow lines marking out each bay
  g.strokeStyle = 'rgba(232,190,40,0.85)'
  g.lineWidth = 18
  for (const bay of [LIFT_BAY, FLOOR_BAY]) {
    g.strokeRect(px(bay.x - 1.75), pz(-2.35), 3.5 * ppm, (B.halfZ + 2.35) * ppm + 20)
  }
  // and scuffed back to concrete in places
  for (let k = 0; k < 900; k++) {
    g.fillStyle = 'rgba(142,143,138,0.8)'
    g.fillRect(rng() * c.width, rng() * c.height, 3 + rng() * 10, 2 + rng() * 6)
  }
  return finish(c)
}

/** Painted breeze blocks, running bond. One tile is 1.8 m × 0.9 m (4 blocks by 4 courses). */
export function blockWallTexture(repeatX: number, repeatY: number) {
  const [c, g] = canvas(512, 256)
  g.fillStyle = '#d9d6cc'
  g.fillRect(0, 0, 512, 256)
  const rng = mulberry32(7)
  for (let row = 0; row < 4; row++) {
    for (let col = -1; col < 4; col++) {
      const x = col * 128 + (row % 2) * 64
      const shade = 225 + Math.floor(rng() * 14)
      g.fillStyle = `rgb(${shade},${shade - 2},${shade - 8})`
      g.fillRect(x + 3, row * 64 + 3, 122, 58)
    }
  }
  speckle(g, 512, 256, 5000, 8, 0.1)
  return finish(c, [repeatX, repeatY])
}

/** Brown hardboard with a grid of holes. One tile is 0.5 m square. */
export function pegboardTexture(repeatX: number, repeatY: number) {
  const [c, g] = canvas(256)
  g.fillStyle = '#9c7650'
  g.fillRect(0, 0, 256, 256)
  speckle(g, 256, 256, 2500, 3, 0.12)
  g.fillStyle = '#2b1f14'
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++) {
      g.beginPath()
      g.arc(12.8 + i * 25.6, 12.8 + j * 25.6, 3.4, 0, Math.PI * 2)
      g.fill()
    }
  return finish(c, [repeatX, repeatY])
}

/** One slat of a steel roller door, repeated up the door. */
export function slatTexture(repeatX: number, repeatY: number) {
  const [c, g] = canvas(64)
  const grad = g.createLinearGradient(0, 0, 0, 64)
  grad.addColorStop(0, '#7c858c')
  grad.addColorStop(0.15, '#c9d0d5')
  grad.addColorStop(0.55, '#aab3b9')
  grad.addColorStop(0.85, '#8d969c')
  grad.addColorStop(1, '#5b6369')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return finish(c, [repeatX, repeatY])
}

// ---------------------------------------------------------------------------
// Outside the roller doors, in depth layers (see outsideLayers.ts). Street x 0
// is the middle of the lift bay's door, +x to your right looking out. The
// little windows are high up, so they mostly show sky over the units across
// the road; the forecourt only shows under a door that's been left up.
// ---------------------------------------------------------------------------

/** How far out the units across the road stand. */
const UNITS = 22
/** The ground and the units repeat every this many metres along the street. */
const ROW = 50

/** Pale daytime sky, drawn as if 60 m out over street x -60..60 and heights -10..50; hung at 45 m, scaled to match. */
function paleSky() {
  const [c, g] = canvas(1024, 512)
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#b9d6fb')
  grad.addColorStop(0.45, '#cfe4ff')
  grad.addColorStop(0.8, '#f4f8ff')
  grad.addColorStop(1, '#f4f8ff')
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 512)
  // a few thin clouds, clear of the edges, which smear out to the sides
  const rng = mulberry32(14)
  g.fillStyle = 'rgba(255,255,255,0.75)'
  for (let k = 0; k < 8; k++) {
    const x = 80 + rng() * 820
    const y = 250 + rng() * 120
    g.beginPath()
    g.ellipse(x, y, 30 + rng() * 40, 6 + rng() * 5, 0, 0, Math.PI * 2)
    g.fill()
  }
  return layerTexture(c)
}

/** Light-industrial units across the road, a tree and a telegraph pole: street x -25..25 (repeating), 0..9 m. */
function units() {
  const [c, g] = canvas(1024, 184)
  const rng = mulberry32(15)
  const px = 1024 / ROW
  const X = (x: number) => x * px
  const Y = (y: number) => (9 - y) * px
  // trees in the gaps, drawn first so the units stand in front
  for (const t of [11.2, 35.5]) {
    g.fillStyle = '#5b4636'
    g.fillRect(X(t) - 3, Y(3), 6, Y(0) - Y(3))
    for (let k = 0; k < 10; k++) {
      g.fillStyle = ['#6f9a4a', '#5f8a3e', '#7faa55'][k % 3]
      g.beginPath()
      g.arc(X(t + (rng() - 0.5) * 2.6), Y(4.8 + (rng() - 0.5) * 2.4), (0.9 + rng() * 0.6) * px, 0, Math.PI * 2)
      g.fill()
    }
  }
  let x = 0.8
  for (const w of [9.6, 11.3, 9.8, 10.9]) {
    const high = 4.2 + rng()
    const cladding = ['#9aa7b0', '#b8c2c8', '#8b98a0', '#c9c2b0'][Math.floor(rng() * 4)]
    g.fillStyle = cladding
    g.fillRect(X(x), Y(high), X(w), Y(0) - Y(high))
    // ribbed cladding
    g.fillStyle = 'rgba(0,0,0,0.08)'
    for (let r = x + 0.15; r < x + w; r += 0.3) g.fillRect(X(r), Y(high), 1, Y(0) - Y(high))
    g.fillStyle = '#5d666e'
    g.fillRect(X(x) - 2, Y(high + 0.25), X(w) + 4, Y(high) - Y(high + 0.25))
    // a sign along the top and two shutters
    g.fillStyle = ['#2f4f7a', '#a8322a', '#2e6b4a'][Math.floor(rng() * 3)]
    g.fillRect(X(x + 0.6), Y(high - 0.2), X(w - 1.2), Y(high - 0.8) - Y(high - 0.2))
    for (const sx of [x + 1, x + w - 4.6]) {
      g.fillStyle = '#6f7a82'
      g.fillRect(X(sx), Y(3.2), X(3.6), Y(0) - Y(3.2))
      g.fillStyle = 'rgba(0,0,0,0.15)'
      for (let y = 0.2; y < 3.2; y += 0.2) g.fillRect(X(sx), Y(y), X(3.6), 1)
    }
    x += w + 1.6
  }
  // a telegraph pole, its wires running on to the next one along
  const pole = X(24.1)
  g.fillStyle = '#6b5038'
  g.fillRect(pole - 3, Y(8.6), 6, Y(0) - Y(8.6))
  g.fillRect(pole - 14, Y(8.2), 28, 3)
  g.strokeStyle = '#3a3a3a'
  g.lineWidth = 1.2
  for (const wrap of [-1024, 0]) {
    for (const dx of [-12, 12]) {
      g.beginPath()
      g.moveTo(pole + dx + wrap, Y(8.2))
      g.quadraticCurveTo(pole + dx + wrap + 512, Y(7.4), pole + dx + wrap + 1024, Y(8.2))
      g.stroke()
    }
  }
  return layerTexture(c, true)
}

/** The ground from the door out to the units: forecourt, road, pavement, their yard. Near edge at the bottom. */
function forecourt() {
  const [c, g] = canvas(1024, 512)
  const pz = 512 / UNITS
  const band = (d0: number, d1: number, colour: string) => {
    g.fillStyle = colour
    g.fillRect(0, 512 - d1 * pz, 1024, (d1 - d0) * pz)
  }
  const concrete = g.createLinearGradient(0, 512 - 7 * pz, 0, 512)
  concrete.addColorStop(0, '#a4a8aa')
  concrete.addColorStop(1, '#bfc2c4')
  g.fillStyle = concrete
  g.fillRect(0, 512 - 7 * pz, 1024, 7 * pz)
  band(7, 7.25, '#b9bbb8')
  band(7.25, 14, '#5a5c60')
  band(14, 16, '#a9aaa8')
  band(16, UNITS, '#8d9093')
  g.fillStyle = '#e8e8e8'
  for (let k = 0; k < 1024; k += 1024 / 10) g.fillRect(k, 512 - 10.7 * pz, 40, 3)
  speckle(g, 1024, 512, 6000, 16, 0.12)
  const rng = mulberry32(17)
  for (let k = 0; k < 6; k++) stain(g, 40 + rng() * 944, 512 - (1 + rng() * 5) * pz, 20 + rng() * 30, 0.25)
  return layerTexture(c, true)
}

const outside = (): OutsideLayer[] => [
  { map: paleSky(), depth: 45, x: [-45, 45], y: [-7.1, 37.9] },
  { map: forecourt(), depth: UNITS, x: [-ROW / 2, ROW / 2], y: [0, 0], flat: true },
  { map: units(), depth: UNITS, x: [-ROW / 2, ROW / 2], y: [0, 9] },
]

/** The view out of the roller doors. */
export const garageOutside = once(outside)

const POSTER_WORDS = [
  ['GRIPMAX', 'TYRES'],
  ['VELO', 'MOTOR OIL'],
  ['SPARKO', 'PLUGS'],
  ['MOT', 'WHILE U WAIT'],
  ['NO', 'SMOKING'],
  ['TORQ', 'TOOLS'],
  ['CASH', 'ONLY'],
  ['LOST', '10mm SOCKET'],
  ['BRAKE', 'PADS 2 FOR 1'],
  ['EXHAUSTS', 'FITTED'],
  ['HI-VIS', 'IN THE BAY'],
  ['FAST', 'FITS'],
]
const POSTER_COLOURS = ['#d8342c', '#f2c230', '#1f6bff', '#f4f1e8', '#2fbf71', '#111111', '#ff8a1f', '#7a1e2b']

/**
 * A whole wall of curling posters, stickers and tape, built up over years.
 * Leaves a bare patch at `gapX` (0–1 across) for the one poster that can change.
 */
export function posterWallTexture(width: number, height: number, gapX: number) {
  const ppm = 300
  const [c, g] = canvas(Math.round(width * ppm), Math.round(height * ppm))
  const rng = mulberry32(44)
  g.clearRect(0, 0, c.width, c.height)
  const gap = { x: gapX * c.width - 0.42 * ppm, w: 0.84 * ppm }
  const drawPoster = (x: number, y: number, w: number, h: number, i: number) => {
    if (x + w > gap.x && x < gap.x + gap.w) return
    const bg = POSTER_COLOURS[i % POSTER_COLOURS.length]
    const ink = bg === '#f4f1e8' || bg === '#f2c230' ? '#111' : '#fff'
    g.save()
    g.translate(x + w / 2, y + h / 2)
    g.rotate((rng() - 0.5) * 0.12)
    g.fillStyle = 'rgba(0,0,0,0.25)'
    g.fillRect(-w / 2 + 4, -h / 2 + 5, w, h)
    g.fillStyle = bg
    g.fillRect(-w / 2, -h / 2, w, h)
    // sun-faded, oily
    g.fillStyle = `rgba(120,100,60,${0.1 + rng() * 0.2})`
    g.fillRect(-w / 2, -h / 2, w, h)
    const [a, b] = POSTER_WORDS[i % POSTER_WORDS.length]
    g.fillStyle = ink
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `bold ${Math.round(Math.min(w / 4, h / 3))}px Impact, sans-serif`
    g.fillText(a, 0, -h * 0.18)
    g.font = `bold ${Math.round(Math.min(w / 7, h / 6))}px Impact, sans-serif`
    g.fillText(b, 0, h * 0.2)
    if (rng() < 0.5) {
      // a rough car silhouette
      g.fillStyle = ink
      g.globalAlpha = 0.35
      g.fillRect(-w * 0.3, h * 0.32, w * 0.6, h * 0.06)
      g.fillRect(-w * 0.15, h * 0.28, w * 0.3, h * 0.05)
      g.globalAlpha = 1
    }
    // masking tape at the corners
    g.fillStyle = 'rgba(235,225,190,0.9)'
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (rng() < 0.3) continue
      g.save()
      g.translate((sx * w) / 2, (sy * h) / 2)
      g.rotate(sx * sy * 0.7)
      g.fillRect(-22, -7, 44, 14)
      g.restore()
    }
    g.restore()
  }
  // layer on layer, the newest on top, until hardly any wall shows
  let i = 0
  for (let pass = 0; pass < 6; pass++) {
    let x = -60 + rng() * 80
    while (x < c.width) {
      const w = (0.3 + rng() * 0.4) * ppm
      const h = w * (1.15 + rng() * 0.35)
      const y = rng() * (c.height - h * 0.8) - h * 0.1
      drawPoster(x, y, w, h, i++)
      x += w * (0.55 + rng() * 0.5)
    }
  }
  // stickers and smudges on top
  for (let k = 0; k < 160; k++) {
    const x = rng() * c.width
    const y = rng() * c.height
    if (x > gap.x - 20 && x < gap.x + gap.w + 20) continue
    g.fillStyle = POSTER_COLOURS[Math.floor(rng() * POSTER_COLOURS.length)]
    g.beginPath()
    if (rng() < 0.5) g.arc(x, y, 18 + rng() * 26, 0, Math.PI * 2)
    else g.rect(x, y, 50 + rng() * 60, 22 + rng() * 18)
    g.fill()
  }
  for (let k = 0; k < 30; k++) {
    const x = rng() * c.width
    const y = c.height * (0.4 + rng() * 0.6)
    g.fillStyle = `rgba(20,16,10,${0.08 + rng() * 0.12})`
    g.beginPath()
    g.ellipse(x, y, 20 + rng() * 40, 8 + rng() * 14, 0, 0, Math.PI * 2)
    g.fill()
  }
  return finish(c)
}

/** The motor oil advert: a cartoon oil can that's pleased to see you, or isn't. */
export function oilPosterTexture(mood: 'smile' | 'frown') {
  const [c, g] = canvas(256, 384)
  g.fillStyle = '#f2c230'
  g.fillRect(0, 0, 256, 384)
  g.fillStyle = '#111'
  g.textAlign = 'center'
  g.font = 'bold 50px Impact, sans-serif'
  g.fillText('VELO', 128, 58)
  g.font = 'bold 22px Impact, sans-serif'
  g.fillText('MOTOR OIL', 128, 86)
  // the can
  g.fillStyle = '#1f8f4e'
  g.fillRect(58, 120, 140, 170)
  g.fillRect(150, 100, 30, 26)
  g.fillStyle = '#e8e2d0'
  g.fillRect(70, 150, 116, 36)
  g.fillStyle = '#111'
  g.font = 'bold 22px Impact, sans-serif'
  g.fillText('15W-40', 128, 177)
  // its face
  for (const x of [100, 156]) {
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(x, 220, 14, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#111'
    g.beginPath()
    g.arc(x, mood === 'smile' ? 222 : 226, 6, 0, Math.PI * 2)
    g.fill()
  }
  g.strokeStyle = '#111'
  g.lineWidth = 6
  g.beginPath()
  if (mood === 'smile') g.arc(128, 248, 26, 0.15 * Math.PI, 0.85 * Math.PI)
  else g.arc(128, 286, 26, 1.15 * Math.PI, 1.85 * Math.PI)
  g.stroke()
  if (mood === 'frown') {
    g.fillStyle = '#4fb6ff'
    g.beginPath()
    g.ellipse(160, 246, 5, 9, 0, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#111'
  g.font = 'bold 22px Impact, sans-serif'
  g.fillText(mood === 'smile' ? 'KEEPS YOUR ENGINE' : 'KEEPS YOUR ENGINE', 128, 326)
  g.fillText(mood === 'smile' ? 'HAPPY!' : 'ALIVE', 128, 354)
  return finish(c)
}

/** A garage's free calendar: a car at sunset, then the month. */
export function calendarTexture(mode: 'normal' | 'octember' | 'gone') {
  const [c, g] = canvas(256, 384)
  g.fillStyle = '#f7f5ef'
  g.fillRect(0, 0, 256, 384)
  g.fillStyle = '#c0392b'
  g.fillRect(0, 0, 256, 26)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.font = 'bold 16px sans-serif'
  g.fillText('BLOGGS MOTORS · MOT · SERVICING', 128, 18)
  // the picture
  const sky = g.createLinearGradient(0, 30, 0, 170)
  sky.addColorStop(0, '#ff7a3d')
  sky.addColorStop(1, '#ffd36b')
  g.fillStyle = sky
  g.fillRect(10, 32, 236, 140)
  g.fillStyle = '#fff3c4'
  g.beginPath()
  g.arc(170, 120, 26, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#3b2a3a'
  g.fillRect(10, 140, 236, 32)
  g.fillStyle = '#e9d8a6'
  g.fillRect(10, 154, 236, 3)
  if (mode !== 'gone') {
    // a red sports car on the coast road
    g.fillStyle = '#c4161c'
    g.beginPath()
    g.moveTo(52, 150)
    g.lineTo(60, 136)
    g.lineTo(96, 132)
    g.lineTo(112, 120)
    g.lineTo(150, 120)
    g.lineTo(166, 132)
    g.lineTo(196, 136)
    g.lineTo(200, 150)
    g.closePath()
    g.fill()
    g.fillStyle = '#20222a'
    for (const x of [82, 172]) {
      g.beginPath()
      g.arc(x, 150, 10, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#9fd0ff'
    g.fillRect(116, 123, 30, 9)
  }
  // the month
  g.fillStyle = '#111'
  g.font = 'bold 28px Impact, sans-serif'
  g.fillText(mode === 'octember' ? 'OCTEMBER 2026' : 'NOVEMBER 2026', 128, 206)
  g.font = 'bold 12px sans-serif'
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  days.forEach((d, i) => g.fillText(d, 26 + i * 34, 226))
  g.font = '14px sans-serif'
  // November 2026 starts on a Sunday; Octember has a few extra days
  const count = mode === 'octember' ? 34 : 30
  for (let n = 1; n <= count; n++) {
    const slot = n + 5
    const col = slot % 7
    const row = Math.floor(slot / 7)
    g.fillStyle = n === 22 ? '#c0392b' : '#333'
    g.fillText(String(n), 26 + col * 34, 248 + row * 24)
  }
  g.strokeStyle = 'rgba(0,0,0,0.15)'
  g.lineWidth = 1
  for (let r = 0; r <= 6; r++) {
    g.beginPath()
    g.moveTo(10, 233 + r * 24)
    g.lineTo(246, 233 + r * 24)
    g.stroke()
  }
  return finish(c)
}

/** UK number plate: white at the front, yellow at the back. */
export function plateTexture(text: string, rear: boolean) {
  const [c, g] = canvas(256, 56)
  g.fillStyle = rear ? '#f5c518' : '#f4f4f0'
  g.fillRect(0, 0, 256, 56)
  g.fillStyle = '#1f4fbf'
  g.fillRect(0, 0, 22, 56)
  g.fillStyle = '#111'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 40px "Arial Narrow", Arial, sans-serif'
  g.fillText(text, 140, 30)
  return finish(c)
}

/** Venetian blinds, let right down with the slats shut. */
export function blindsTexture() {
  const [c, g] = canvas(256, 340)
  for (let y = 0; y < 340; y += 17) {
    const grad = g.createLinearGradient(0, y, 0, y + 17)
    grad.addColorStop(0, '#f3f1ea')
    grad.addColorStop(0.8, '#d8d4c8')
    grad.addColorStop(1, '#9d998e')
    g.fillStyle = grad
    g.fillRect(0, y, 256, 17)
  }
  g.fillStyle = 'rgba(60,60,60,0.5)'
  for (const x of [40, 216]) g.fillRect(x, 0, 2, 340)
  return finish(c)
}

/** Small printed sign: white on a colour, or the reverse. */
export function signTexture(text: string, bg: string, ink: string) {
  const [c, g] = canvas(256, 96)
  g.fillStyle = bg
  g.fillRect(0, 0, 256, 96)
  g.fillStyle = ink
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `bold ${text.length > 9 ? 34 : 46}px Impact, sans-serif`
  g.fillText(text, 128, 50)
  return finish(c)
}

/** Ribbed insulated roof panels. One tile is 1 m across. */
export function ceilingTexture(repeatX: number, repeatY: number) {
  const [c, g] = canvas(128)
  g.fillStyle = '#e4e6e6'
  g.fillRect(0, 0, 128, 128)
  for (const x of [0, 32, 64, 96]) {
    g.fillStyle = 'rgba(0,0,0,0.12)'
    g.fillRect(x, 0, 6, 128)
    g.fillStyle = 'rgba(255,255,255,0.4)'
    g.fillRect(x + 6, 0, 3, 128)
  }
  return finish(c, [repeatX, repeatY])
}
