import { useMemo } from 'react'
import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three'
import { layerTexture, once, type OutsideLayer } from '../../outsideLayers'
import { mulberry32 } from '../../rng'

/*
 * Everything printed in the shop is drawn on a canvas at load time: floor
 * tiles, tin labels, cereal boxes, the neon sign, the doormat and the street
 * outside.
 */

function canvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function finish(c: HTMLCanvasElement, repeat?: [number, number]) {
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

/** Retro chequerboard lino. One tile of the texture holds 4 × 4 squares. */
export function useCheckerTexture(repeatX: number, repeatY: number) {
  return useMemo(() => {
    const [c, g] = canvas(512)
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        g.fillStyle = (i + j) % 2 ? '#1d6b63' : '#f1ead9'
        g.fillRect(i * 128, j * 128, 128, 128)
      }
    // scuffs
    const rng = mulberry32(17)
    for (let k = 0; k < 1800; k++) {
      g.fillStyle = `rgba(0,0,0,${rng() * 0.05})`
      g.fillRect(rng() * 512, rng() * 512, 2, 2)
    }
    g.strokeStyle = 'rgba(0,0,0,0.25)'
    g.lineWidth = 2
    for (let k = 0; k <= 4; k++) {
      g.beginPath()
      g.moveTo(k * 128, 0)
      g.lineTo(k * 128, 512)
      g.moveTo(0, k * 128)
      g.lineTo(512, k * 128)
      g.stroke()
    }
    return finish(c, [repeatX, repeatY])
  }, [repeatX, repeatY])
}

export interface CanDesign {
  name: string
  band: string
  ink: string
}

export const CAN_DESIGNS: CanDesign[] = [
  { name: 'BEANZ', band: '#1f6bff', ink: '#fff' },
  { name: 'SOUP?', band: '#ff3131', ink: '#fff' },
  { name: 'TINNED AIR', band: '#e9e4da', ink: '#111' },
  { name: 'MYSTERY MEAT', band: '#7a1e2b', ink: '#ffde21' },
  { name: 'HOOPS', band: '#ff8a1f', ink: '#111' },
]

/** Wrap-around tin label. */
export function canLabel(d: CanDesign) {
  const [c, g] = canvas(512, 256)
  g.fillStyle = d.band
  g.fillRect(0, 0, 512, 256)
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.fillRect(0, 30, 512, 8)
  g.fillRect(0, 218, 512, 8)
  g.fillStyle = d.ink
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `bold ${d.name.length > 8 ? 46 : 64}px Impact, sans-serif`
  g.fillText(d.name, 128, 128)
  g.fillText(d.name, 384, 128)
  g.font = 'bold 20px sans-serif'
  g.fillText('NET WT ???', 256, 190)
  return finish(c)
}

export interface BoxDesign {
  name: string
  bg: string
  ink: string
}

export const BOX_DESIGNS: BoxDesign[] = [
  { name: "EYE-O'S", bg: '#ffde21', ink: '#111' },
  { name: 'CRUNCH', bg: '#2fbf71', ink: '#fff' },
  { name: 'SUGAR', bg: '#ff3fa4', ink: '#fff' },
  { name: 'BRAN?', bg: '#8a6446', ink: '#ffde21' },
  { name: 'NOTHING', bg: '#16d0ff', ink: '#111' },
]

/** Cereal box front: name, a cartoon bowl, and a burst. */
export function boxCover(d: BoxDesign) {
  const [c, g] = canvas(256, 384)
  g.fillStyle = d.bg
  g.fillRect(0, 0, 256, 384)
  g.fillStyle = d.ink
  g.textAlign = 'center'
  g.font = 'bold 54px Impact, sans-serif'
  g.fillText(d.name, 128, 80)
  // bowl
  g.fillStyle = '#fff'
  g.beginPath()
  g.ellipse(128, 250, 90, 50, 0, 0, Math.PI)
  g.fill()
  g.fillStyle = d.ink
  for (let i = 0; i < 9; i++) {
    g.beginPath()
    g.arc(60 + i * 17, 245 - (i % 2) * 10, 9, 0, Math.PI * 2)
    g.fill()
  }
  // starburst
  g.fillStyle = '#ff3131'
  g.beginPath()
  for (let i = 0; i < 16; i++) {
    const r = i % 2 ? 22 : 38
    const a = (i / 16) * Math.PI * 2
    g.lineTo(205 + Math.cos(a) * r, 140 + Math.sin(a) * r)
  }
  g.fill()
  g.fillStyle = '#fff'
  g.font = 'bold 16px sans-serif'
  g.fillText('NEW!', 205, 146)
  return finish(c)
}

/** Glowing neon lettering on a transparent background (drawn twice for the halo). */
export function neonText(text: string, colour: string) {
  const [c, g] = canvas(1024, 256)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 150px "Brush Script MT", "Segoe Script", cursive'
  g.shadowColor = colour
  g.shadowBlur = 40
  g.strokeStyle = colour
  g.lineWidth = 10
  g.strokeText(text, 512, 128)
  g.shadowBlur = 12
  g.strokeStyle = '#ffffff'
  g.lineWidth = 3
  g.strokeText(text, 512, 128)
  return finish(c)
}

/** Coir doormat with a printed message. */
export function matTexture(text: string) {
  const [c, g] = canvas(512, 320)
  g.fillStyle = '#9a7240'
  g.fillRect(0, 0, 512, 320)
  for (let k = 0; k < 6000; k++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,230,180'},${Math.random() * 0.15})`
    g.fillRect(Math.random() * 512, Math.random() * 320, 1, 3)
  }
  g.strokeStyle = '#2b1d10'
  g.lineWidth = 10
  g.strokeRect(18, 18, 476, 284)
  g.fillStyle = '#2b1d10'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 96px Impact, sans-serif'
  g.fillText(text, 256, 165)
  return finish(c)
}

// ---------------------------------------------------------------------------
// The street outside the shop (and the gym, which is on the same kind of
// street), in depth layers: see outsideLayers.ts. Street x 0 is the middle of
// the big window, looking out; +x is to your right.
// ---------------------------------------------------------------------------

/** The ground and the terrace across the road repeat every this many metres along the street. */
const STREET = 50
/** How far out the terrace stands: a wide road, then front gardens. */
const TERRACE = 28
/** The lamp post, bin and bollards on the kerb right outside. */
const KERB = 2.6
/** Just left of the middle of the window, where the old picture had its lamp post. */
const NEAR_LAMP = -1
const FAR_LAMPS = [-18.75, -6.25, 6.25, 18.75]
const GLOW = 'rgba(255,214,140,'

const STREET_LOOK = {
  night: {
    sky: ['#070a22', '#2b1a4d', '#120d1a'],
    houses: ['#0d0a14'],
    roof: '#0d0a14',
    /** Lit and unlit windows. */
    panes: ['#ffcf7a', '#1b1726'],
    frame: null,
    pole: '#050407',
    lantern: '#ffe2a8',
    pavement: '#2a2730',
    kerb: '#3a3640',
    road: '#16141b',
    lines: ['#5a4a22', '#3b3842'],
    garden: '#0f1310',
    bin: ['#0b0a10', '#1e1b26'],
  },
  day: {
    sky: ['#5fb6f2', '#cfeaff', '#cfeaff'],
    houses: ['#b55a3c', '#c9b48f', '#8f4a36', '#d8cfc0'],
    roof: '#4b3a36',
    panes: ['#7d9bb8', '#7d9bb8'],
    frame: '#e9f4ff',
    pole: '#3a3a3e',
    lantern: '#56565c',
    pavement: '#a7a3a0',
    kerb: '#c9c6c2',
    road: '#4a4a4f',
    lines: ['#e8c33a', '#e4e4e4'],
    garden: '#5f8a3e',
    bin: ['#2f4f3a', '#3f6a4e'],
  },
}
type Time = keyof typeof STREET_LOOK

function radialGlow(g: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, squash = 1) {
  g.save()
  g.translate(x, y)
  g.scale(1, squash)
  const glow = g.createRadialGradient(0, 0, 0, 0, 0, r)
  glow.addColorStop(0, `${GLOW}${alpha})`)
  glow.addColorStop(1, `${GLOW}0)`)
  g.fillStyle = glow
  g.fillRect(-r, -r, r * 2, r * 2)
  g.restore()
}

/**
 * The sky, drawn as if 70 m out over street x -70..70 and heights -10..60, but
 * hung 45 m out (scaled to look the same) so it stays inside the camera's reach
 * when you look steeply sideways through the glass.
 */
function streetSky(time: Time) {
  const look = STREET_LOOK[time]
  const [c, g] = canvas(1024, 512)
  const px = 1024 / 140
  const rng = mulberry32(99)
  const sky = g.createLinearGradient(0, 0, 0, 512)
  sky.addColorStop(0, look.sky[0])
  sky.addColorStop(0.21, look.sky[0])
  sky.addColorStop(0.83, look.sky[1])
  sky.addColorStop(1, look.sky[2])
  g.fillStyle = sky
  g.fillRect(0, 0, 1024, 512)
  // nothing on the edge columns, which smear out to the sides
  if (time === 'night') {
    for (let i = 0; i < 700; i++) {
      g.fillStyle = `rgba(255,255,255,${rng() * 0.8})`
      const s = rng() < 0.2 ? 2 : 1.2
      g.fillRect(4 + rng() * 1016, rng() * 400, s, s)
    }
    // a very large, slightly wrong moon, up and to the right
    const [mx, my] = [(23 + 70) * px, (60 - 12.5) * px]
    g.fillStyle = '#ffe9a8'
    g.beginPath()
    g.arc(mx, my, 24, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#2b1a4d'
    g.beginPath()
    g.arc(mx + 10, my - 4.4, 22, 0, Math.PI * 2)
    g.fill()
  } else {
    g.fillStyle = 'rgba(255,255,255,0.9)'
    for (let k = 0; k < 11; k++) {
      const x = 60 + rng() * 880
      // low enough to be seen over the roofs
      const y = 255 + rng() * 95
      for (let b = 0; b < 4; b++) {
        g.beginPath()
        g.arc(x + b * 16, y + (b % 2) * 5, 14 + rng() * 6, 0, Math.PI * 2)
        g.fill()
      }
    }
  }
  return layerTexture(c)
}

/** The terrace across the road, its lamp posts in front: one repeat of the street, 0..8 m high. */
function terrace(time: Time) {
  const look = STREET_LOOK[time]
  const [c, g] = canvas(1024, 160)
  const px = 1024 / STREET
  const rng = mulberry32(99)
  const X = (x: number) => x * px
  const Y = (y: number) => (8 - y) * 20
  // house widths that add up to exactly one repeat, so it joins up seamlessly
  const widths: number[] = []
  let total = 0
  while (STREET - total > 7) {
    const w = 4.6 + rng() * 1.4
    widths.push(w)
    total += w
  }
  widths.push(STREET - total)
  let x = 0
  for (const w of widths) {
    const eaves = 3.5 + rng() * 0.8
    const body = x + 0.15
    const width = w - 0.3
    g.fillStyle = look.houses[Math.floor(rng() * look.houses.length)]
    g.fillRect(X(body), Y(eaves), X(width), Y(0) - Y(eaves))
    g.fillStyle = look.roof
    g.beginPath()
    g.moveTo(X(body - 0.12), Y(eaves))
    g.lineTo(X(body + width / 2), Y(eaves + 1.1))
    g.lineTo(X(body + width + 0.12), Y(eaves))
    g.fill()
    if (rng() < 0.6) g.fillRect(X(body + width * 0.7), Y(eaves + 1.2), X(0.35), Y(eaves + 0.3) - Y(eaves + 1.2))
    for (const [y0, y1] of [
      [0.9, 1.9],
      [2.4, Math.min(3.3, eaves - 0.3)],
    ]) {
      for (const wx of [body + 0.7, body + width - 1.5]) {
        if (look.frame) {
          g.fillStyle = look.frame
          g.fillRect(X(wx) - 2, Y(y1) - 2, X(0.8) + 4, Y(y0) - Y(y1) + 4)
        }
        g.fillStyle = look.panes[rng() < 0.55 ? 0 : 1]
        g.fillRect(X(wx), Y(y1), X(0.8), Y(y0) - Y(y1))
      }
    }
    x += w
  }
  for (const s of FAR_LAMPS) {
    const lx = X(s + STREET / 2)
    if (time === 'night') radialGlow(g, lx, Y(4.3), 45, 0.9)
    g.fillStyle = look.pole
    g.fillRect(lx - 1.5, Y(4.2), 3, Y(0) - Y(4.2))
    g.fillStyle = look.lantern
    g.fillRect(lx - 3.5, Y(4.5), 7, 6)
  }
  return layerTexture(c, true)
}

/** The road from the shop front out to the terrace: one repeat of the street, near edge at the bottom. */
function road(time: Time) {
  const look = STREET_LOOK[time]
  const [c, g] = canvas(1024, 512)
  const px = 1024 / STREET
  const pz = 512 / TERRACE
  const band = (d0: number, d1: number, colour: string) => {
    g.fillStyle = colour
    g.fillRect(0, 512 - d1 * pz, 1024, (d1 - d0) * pz)
  }
  band(0, 3, look.pavement)
  band(3, 3.2, look.kerb)
  band(3.2, 14, look.road)
  band(14, 14.2, look.kerb)
  band(14.2, 16.5, look.pavement)
  band(16.5, 16.8, look.roof)
  band(16.8, TERRACE, look.garden)
  // paving slab joints
  g.fillStyle = 'rgba(0,0,0,0.18)'
  for (let k = 0; k < STREET; k += 0.9) {
    g.fillRect(k * px, 512 - 3 * pz, 1, 3 * pz)
    g.fillRect(k * px, 512 - 16.5 * pz, 1, 2.3 * pz)
  }
  for (const d of [0.9, 1.8, 2.7, 15.1, 16]) g.fillRect(0, 512 - d * pz, 1024, 1)
  // double yellow lines along the near kerb, dashes down the middle
  band(3.4, 3.5, look.lines[0])
  band(3.6, 3.7, look.lines[0])
  g.fillStyle = look.lines[1]
  for (let k = 0; k < STREET; k += 5) g.fillRect(k * px, 512 - 8.7 * pz, 2 * px, 0.12 * pz)
  // grime, so the big flat areas aren't flat
  const rng = mulberry32(7)
  for (let k = 0; k < 5000; k++) {
    g.fillStyle = rng() < 0.5 ? `rgba(0,0,0,${rng() * 0.12})` : `rgba(255,255,255,${rng() * 0.05})`
    g.fillRect(rng() * 1024, rng() * 512, 2, 2)
  }
  if (time === 'night') {
    // pools of lamplight
    radialGlow(g, (NEAR_LAMP + STREET / 2) * px, 512 - KERB * pz, 70, 0.5, 0.9)
    for (const s of FAR_LAMPS) radialGlow(g, (s + STREET / 2) * px, 512 - (TERRACE - 0.5) * pz, 50, 0.25, 0.8)
  }
  return layerTexture(c, true)
}

/** Street furniture on the kerb right outside: a lamp post, a bin and two bollards. Street x -8..8, 0..6.4 m high. */
function kerbside(time: Time) {
  const look = STREET_LOOK[time]
  const [c, g] = canvas(1024, 410)
  const X = (x: number) => (x + 8) * 64
  const Y = (y: number) => (6.4 - y) * 64
  const lamp = X(NEAR_LAMP)
  if (time === 'night') radialGlow(g, lamp, Y(4.35), 210, 0.95)
  g.fillStyle = look.pole
  g.fillRect(lamp - 4, Y(4.2), 8, Y(0) - Y(4.2))
  g.fillRect(lamp - 9, Y(0.5), 18, Y(0) - Y(0.5))
  g.fillStyle = look.lantern
  g.beginPath()
  g.moveTo(lamp - 14, Y(4.2))
  g.lineTo(lamp - 10, Y(4.6))
  g.lineTo(lamp + 10, Y(4.6))
  g.lineTo(lamp + 14, Y(4.2))
  g.fill()
  g.fillStyle = look.pole
  g.fillRect(lamp - 15, Y(4.72), 30, Y(4.6) - Y(4.72))
  // a litter bin and two bollards
  g.fillStyle = look.bin[0]
  g.fillRect(X(1.6) - 14, Y(0.95), 28, Y(0) - Y(0.95))
  g.fillStyle = look.bin[1]
  g.fillRect(X(1.6) - 15, Y(0.95), 30, 5)
  g.fillStyle = look.pole
  for (const b of [-5, -6.2]) g.fillRect(X(b) - 5, Y(0.9), 10, Y(0) - Y(0.9))
  return layerTexture(c)
}

function streetLayers(time: Time): OutsideLayer[] {
  return [
    { map: streetSky(time), depth: 45, x: [-45, 45], y: [-5.9, 39.1] },
    { map: road(time), depth: TERRACE, x: [-STREET / 2, STREET / 2], y: [0, 0], flat: true },
    { map: terrace(time), depth: TERRACE, x: [-STREET / 2, STREET / 2], y: [0, 8] },
    { map: kerbside(time), depth: KERB, x: [-8, 8], y: [0, 6.4] },
  ]
}

/** The street at night, as seen out of the shop and the gym. */
export const nightStreet = once(() => streetLayers('night'))
/** The same street by day. */
export const dayStreet = once(() => streetLayers('day'))

/** Tabloid front page: masthead, a shouty headline, and a grey photo block. */
export function newspaperTexture(masthead: string, headline: string, colour: string, blank = false) {
  const [c, g] = canvas(256, 340)
  g.fillStyle = '#f3efe4'
  g.fillRect(0, 0, 256, 340)
  if (blank) return finish(c)
  g.fillStyle = colour
  g.fillRect(0, 0, 256, 62)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.font = 'bold 44px Impact, sans-serif'
  g.fillText(masthead, 128, 48)
  g.fillStyle = '#111'
  g.font = 'bold 40px Impact, sans-serif'
  headline.split('\n').forEach((line, i) => g.fillText(line, 128, 112 + i * 42))
  g.fillStyle = '#9a9a9a'
  g.fillRect(18, 214, 220, 110)
  return finish(c)
}

export const PAPERS = [
  { masthead: 'THE DAILY', colour: '#d81e1e', normal: 'PIER SHUT\nAGAIN', weird: 'ROOM\nCHANGED' },
  { masthead: 'POMPEY POST', colour: '#1f6bff', normal: 'GULL STEALS\nCHIPS', weird: 'IT SAW\nYOU' },
  { masthead: 'THE STAR', colour: '#111111', normal: 'RAIN DUE\nTUESDAY', weird: 'LOOK\nBEHIND' },
]

/** Glossy magazine cover: title band and a big face-ish circle, or one staring eye. */
export function magazineCover(i: number, eye: boolean) {
  const [c, g] = canvas(200, 270)
  const bgs = ['#ff3fa4', '#16d0ff', '#ffde21', '#2fbf71', '#ff8a1f', '#8a4dff']
  const titles = ['GLOSS', 'HOMES', 'WOW!', 'TRUE', 'GARDEN', 'CHAT']
  g.fillStyle = bgs[i % bgs.length]
  g.fillRect(0, 0, 200, 270)
  if (eye) {
    g.fillStyle = '#fffbe6'
    g.beginPath()
    g.ellipse(100, 140, 90, 60, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#1f6bff'
    g.beginPath()
    g.arc(100, 140, 40, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#050505'
    g.beginPath()
    g.arc(100, 140, 18, 0, Math.PI * 2)
    g.fill()
    return finish(c)
  }
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.font = 'bold 46px Impact, sans-serif'
  g.fillText(titles[i % titles.length], 100, 52)
  g.fillStyle = 'rgba(255,255,255,0.75)'
  g.beginPath()
  g.arc(100, 170, 62, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#111'
  g.font = 'bold 18px sans-serif'
  g.fillText('SPECIAL ISSUE', 100, 255)
  return finish(c)
}

/** Yellow A-frame warning sign. */
export function warningSignTexture(lines: string[]) {
  const [c, g] = canvas(256, 384)
  g.fillStyle = '#ffd21f'
  g.fillRect(0, 0, 256, 384)
  // warning triangle with a slipping figure, roughly
  g.fillStyle = '#111'
  g.beginPath()
  g.moveTo(128, 40)
  g.lineTo(220, 190)
  g.lineTo(36, 190)
  g.closePath()
  g.fill()
  g.fillStyle = '#ffd21f'
  g.beginPath()
  g.moveTo(128, 70)
  g.lineTo(198, 176)
  g.lineTo(58, 176)
  g.closePath()
  g.fill()
  g.fillStyle = '#111'
  g.beginPath()
  g.arc(120, 112, 9, 0, Math.PI * 2)
  g.fill()
  g.lineWidth = 8
  g.strokeStyle = '#111'
  g.beginPath()
  g.moveTo(120, 122)
  g.lineTo(135, 150)
  g.lineTo(110, 168)
  g.moveTo(135, 150)
  g.lineTo(158, 160)
  g.moveTo(124, 132)
  g.lineTo(100, 140)
  g.stroke()
  g.textAlign = 'center'
  g.font = 'bold 50px Impact, sans-serif'
  lines.forEach((line, i) => g.fillText(line, 128, 255 + i * 56))
  return finish(c)
}

/**
 * A crisp packet's whole front, top seal to bottom seal: crimped seals, the
 * brand on a banner, the flavour on a ribbon, and a heap of crisps. Drawn to
 * the packet's proportions (see packet.ts).
 */
export function crispTexture(i: number) {
  const designs = [
    { bg: '#d8262b', light: '#ff5a4f', flavour: 'READY SALTED' },
    { bg: '#1c5fe0', light: '#4f8dff', flavour: 'CHEESE & ONION' },
    { bg: '#1f9e58', light: '#43c97a', flavour: 'SALT & VINEGAR' },
    { bg: '#e0397f', light: '#ff6fa6', flavour: 'PRAWN COCKTAIL' },
    { bg: '#7a3c1c', light: '#b4622f', flavour: 'SMOKY BACON' },
  ]
  const d = designs[i % designs.length]
  const W = 260
  const H = 380
  const SEAL = 28 // matches PACKET.seal / PACKET.height
  const [c, g] = canvas(W, H)
  // foil: lighter down the middle where the bag bulges towards the light
  const foil = g.createLinearGradient(0, 0, W, 0)
  foil.addColorStop(0, d.bg)
  foil.addColorStop(0.5, d.light)
  foil.addColorStop(1, d.bg)
  g.fillStyle = foil
  g.fillRect(0, 0, W, H)
  // crimped seals: darker bands with fine ridges
  for (const y0 of [0, H - SEAL]) {
    g.fillStyle = 'rgba(0,0,0,0.22)'
    g.fillRect(0, y0, W, SEAL)
    g.strokeStyle = 'rgba(255,255,255,0.35)'
    g.lineWidth = 2
    for (let x = 3; x < W; x += 6) {
      g.beginPath()
      g.moveTo(x, y0 + 3)
      g.lineTo(x, y0 + SEAL - 3)
      g.stroke()
    }
  }
  // brand banner, slanted
  g.save()
  g.translate(W / 2, 92)
  g.rotate(-0.12)
  g.fillStyle = '#ffde21'
  g.strokeStyle = '#111'
  g.lineWidth = 5
  g.beginPath()
  g.roundRect(-112, -38, 224, 70, 16)
  g.fill()
  g.stroke()
  g.fillStyle = '#d8262b'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 50px Impact, sans-serif'
  g.lineWidth = 6
  g.strokeStyle = '#fff'
  g.strokeText('CRISPO', 0, 0)
  g.fillText('CRISPO', 0, 0)
  g.restore()
  // flavour ribbon
  g.fillStyle = '#fff'
  g.fillRect(0, 150, W, 40)
  g.fillStyle = d.bg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `bold ${d.flavour.length > 12 ? 24 : 30}px Impact, sans-serif`
  g.fillText(d.flavour, W / 2, 171)
  // a heap of crisps
  const rng = mulberry32(40 + i)
  for (let k = 0; k < 16; k++) {
    const x = W / 2 + (rng() - 0.5) * 170
    const y = 285 - Math.abs(x - W / 2) * 0.35 + (rng() - 0.5) * 40
    g.save()
    g.translate(x, y)
    g.rotate(rng() * Math.PI)
    g.fillStyle = rng() < 0.5 ? '#f2c45a' : '#e8b03f'
    g.strokeStyle = '#a8741c'
    g.lineWidth = 2
    g.beginPath()
    g.ellipse(0, 0, 26 + rng() * 10, 17 + rng() * 6, 0, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    g.restore()
  }
  // small print
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.font = 'bold 15px sans-serif'
  g.fillText('NOW WITH MORE AIR', W / 2, H - SEAL - 14)
  return finish(c)
}
export const CRISP_DESIGNS = 5

/** Small printed door plaque. */
export function plaqueTexture(text: string, bg = '#f2efe8', ink = '#c0392b') {
  const [c, g] = canvas(256, 96)
  g.fillStyle = bg
  g.fillRect(0, 0, 256, 96)
  g.strokeStyle = ink
  g.lineWidth = 6
  g.strokeRect(6, 6, 244, 84)
  g.fillStyle = ink
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 44px Impact, sans-serif'
  g.fillText(text, 128, 50)
  return finish(c)
}

// ---------------------------------------------------------------------------
// Household stock, bread and the freezer
// ---------------------------------------------------------------------------

/** Printed band across the front of a 9-pack of loo roll. */
export function looBandTexture() {
  const [c, g] = canvas(256, 64)
  g.fillStyle = '#7ec8f2'
  g.fillRect(0, 0, 256, 64)
  g.fillStyle = 'rgba(255,255,255,0.75)'
  for (const [x, y, r] of [
    [30, 40, 16],
    [48, 30, 18],
    [214, 42, 15],
    [230, 30, 17],
  ]) {
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#1b3f8f'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 30px Impact, sans-serif'
  g.fillText('SOFTY', 128, 26)
  g.font = 'bold 15px sans-serif'
  g.fillText('9 ROLLS · 3-PLY', 128, 50)
  return finish(c)
}

/** Wrap-around bottle label; the cylinder segment it's on only covers the front. */
export function bottleLabel(kind: 'bleach' | 'sudz' | 'spray') {
  const [c, g] = canvas(256, 160)
  const look = {
    bleach: { bg: '#ffffff', band: '#1f5fd8', text: 'BLEACH', sub: 'THICK · KILLS 99.9%' },
    sudz: { bg: '#d8f5c6', band: '#2f9e3a', text: 'SUDZ', sub: 'WASHING-UP LIQUID' },
    spray: { bg: '#fff2c9', band: '#f08a1c', text: 'SHINE', sub: 'MULTI-SURFACE SPRAY' },
  }[kind]
  g.fillStyle = look.bg
  g.fillRect(0, 0, 256, 160)
  g.fillStyle = look.band
  g.fillRect(0, 18, 256, 70)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 50px Impact, sans-serif'
  g.fillText(look.text, 128, 55)
  g.fillStyle = '#222'
  g.font = 'bold 17px sans-serif'
  g.fillText(look.sub, 128, 112)
  if (kind === 'bleach') {
    // hazard diamond
    g.save()
    g.translate(128, 140)
    g.rotate(Math.PI / 4)
    g.fillStyle = '#fff'
    g.strokeStyle = '#d81e1e'
    g.lineWidth = 3
    g.fillRect(-9, -9, 18, 18)
    g.strokeRect(-9, -9, 18, 18)
    g.restore()
  }
  return finish(c)
}

/** Front of a box of washing powder. */
export function powderBoxTexture() {
  const [c, g] = canvas(192, 256)
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, '#1fa3e0')
  grad.addColorStop(1, '#0d5fae')
  g.fillStyle = grad
  g.fillRect(0, 0, 192, 256)
  g.fillStyle = '#ff3131'
  g.beginPath()
  g.arc(96, 110, 62, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 46px Impact, sans-serif'
  g.fillText('WASHO', 96, 110)
  g.font = 'bold 18px sans-serif'
  g.fillText('BIO POWDER', 96, 200)
  g.fillText('40 WASHES', 96, 226)
  return finish(c)
}

/** A printed bread bag, all-over (every face of the loaf gets the same print). */
export function breadBagTexture(kind: 'white' | 'brown' | 'seeded') {
  const look = { white: { band: '#1f5fd8', name: 'WHITE' }, brown: { band: '#8a5a2b', name: 'WHOLEMEAL' }, seeded: { band: '#3f8f3a', name: 'SEEDED' } }[kind]
  const [c, g] = canvas(256, 128)
  g.fillStyle = '#f7f2e6'
  g.fillRect(0, 0, 256, 128)
  g.fillStyle = look.band
  g.fillRect(0, 38, 256, 52)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 30px Impact, sans-serif'
  g.fillText('LOAFLY', 128, 56)
  g.font = 'bold 13px sans-serif'
  g.fillText(`MEDIUM SLICED ${look.name}`, 128, 80)
  // wheat ears
  g.strokeStyle = '#d6a440'
  g.lineWidth = 3
  for (const x of [22, 234]) {
    g.beginPath()
    g.moveTo(x, 118)
    g.lineTo(x, 96)
    g.stroke()
    for (let k = 0; k < 4; k++) {
      g.beginPath()
      g.ellipse(x - 4, 100 - k * 6, 3, 5, -0.5, 0, Math.PI * 2)
      g.ellipse(x + 4, 100 - k * 6, 3, 5, 0.5, 0, Math.PI * 2)
      g.stroke()
    }
  }
  return finish(c)
}

/** Ice lolly wrapper, drawn to the packet shape's proportions. */
export function lollyWrapTexture(i: number) {
  const looks = [
    { bg: '#e0262a', light: '#ff6a5a', name: 'ROCKET' },
    { bg: '#7a3cc7', light: '#a86cf0', name: 'ZOOM' },
    { bg: '#ff8a1f', light: '#ffb45a', name: 'FAB' },
  ]
  const d = looks[i % looks.length]
  const [c, g] = canvas(128, 190)
  const foil = g.createLinearGradient(0, 0, 128, 0)
  foil.addColorStop(0, d.bg)
  foil.addColorStop(0.5, d.light)
  foil.addColorStop(1, d.bg)
  g.fillStyle = foil
  g.fillRect(0, 0, 128, 190)
  g.fillStyle = 'rgba(0,0,0,0.2)'
  g.fillRect(0, 0, 128, 14)
  g.fillRect(0, 176, 128, 14)
  g.save()
  g.translate(64, 95)
  g.rotate(-Math.PI / 2)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 40px Impact, sans-serif'
  g.fillText(d.name, 0, 0)
  g.restore()
  return finish(c)
}

/** Wrap-around label for an ice cream tub. */
export function tubLabelTexture(i: number) {
  const looks = [
    { bg: '#f7ecc8', text: '#8a5a2b', name: 'VANILLA' },
    { bg: '#6b3b22', text: '#f7ecc8', name: 'CHOCOLATE' },
    { bg: '#ffc2d6', text: '#c2185b', name: 'STRAWBERRY' },
  ]
  const d = looks[i % looks.length]
  const [c, g] = canvas(256, 96)
  g.fillStyle = d.bg
  g.fillRect(0, 0, 256, 96)
  g.fillStyle = d.text
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 34px Impact, sans-serif'
  g.fillText('SCOOP', 128, 34)
  g.font = 'bold 18px sans-serif'
  g.fillText(d.name, 128, 70)
  return finish(c)
}

/** A multipack box of lollies (front). */
export function lollyBoxTexture() {
  const [c, g] = canvas(256, 128)
  g.fillStyle = '#16d0ff'
  g.fillRect(0, 0, 256, 128)
  g.fillStyle = '#ffde21'
  g.beginPath()
  g.arc(60, 64, 44, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#111'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 22px Impact, sans-serif'
  g.fillText('6 PACK', 60, 64)
  g.fillStyle = '#fff'
  g.font = 'bold 38px Impact, sans-serif'
  g.fillText('ZOOM', 170, 52)
  g.font = 'bold 14px sans-serif'
  g.fillText('ICE LOLLIES', 170, 88)
  return finish(c)
}

// ---------------------------------------------------------------------------
// Drinks fridge stock
// ---------------------------------------------------------------------------

export const DRINK_CANS = [
  { bg: '#d81e1e', ink: '#fff', name: 'FIZZ' },
  { bg: '#111111', ink: '#7dff5a', name: 'ZING' },
  { bg: '#ffd21f', ink: '#1f6b2a', name: 'LEMONY' },
  { bg: '#f2f2f2', ink: '#d81e1e', name: 'FIZZ ZERO' },
]

/** Can label. The name sits a quarter of the way round, so cans are turned to face it out. */
export function drinkCanTexture(i: number) {
  const d = DRINK_CANS[i % DRINK_CANS.length]
  const [c, g] = canvas(512, 256)
  g.fillStyle = d.bg
  g.fillRect(0, 0, 512, 256)
  g.fillStyle = d.ink
  g.globalAlpha = 0.25
  for (let k = 0; k < 6; k++) g.fillRect(0, 40 + k * 36, 512, 10)
  g.globalAlpha = 1
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `bold ${d.name.length > 6 ? 56 : 74}px Impact, sans-serif`
  for (const x of [128, 384]) {
    g.save()
    g.translate(x, 128)
    g.rotate(-Math.PI / 2)
    g.fillText(d.name, 0, 0)
    g.restore()
  }
  return finish(c)
}

/** Front label strip for a 500ml bottle of pop. */
export function popLabelTexture(i: number) {
  const looks = [
    { bg: '#d81e1e', name: 'FIZZ' },
    { bg: '#ff8a1f', name: 'ORANJ' },
    { bg: '#2fbf71', name: 'LIMEY' },
  ]
  const d = looks[i % looks.length]
  const [c, g] = canvas(256, 96)
  g.fillStyle = d.bg
  g.fillRect(0, 0, 256, 96)
  g.fillStyle = '#fff'
  g.fillRect(0, 10, 256, 6)
  g.fillRect(0, 80, 256, 6)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 48px Impact, sans-serif'
  g.fillText(d.name, 128, 50)
  return finish(c)
}

/** Front of a juice carton. */
export function cartonTexture(kind: 'orange' | 'apple') {
  const [c, g] = canvas(128, 256)
  const d = kind === 'orange' ? { bg: '#ff9a1f', fruit: '#ff7a00', name: 'ORANGE' } : { bg: '#9ed04a', fruit: '#d8242a', name: 'APPLE' }
  g.fillStyle = d.bg
  g.fillRect(0, 0, 128, 256)
  g.fillStyle = '#fff'
  g.fillRect(0, 150, 128, 60)
  g.fillStyle = d.fruit
  g.beginPath()
  g.arc(64, 90, 34, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#222'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 22px Impact, sans-serif'
  g.fillText(d.name, 64, 170)
  g.font = 'bold 15px sans-serif'
  g.fillText('JUICE · 1L', 64, 194)
  return finish(c)
}

/** Label band round a plastic milk bottle; the cap colour says which milk it is. */
export function milkLabelTexture(cap: string, name: string) {
  const [c, g] = canvas(256, 64)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 256, 64)
  g.fillStyle = cap
  g.fillRect(0, 0, 256, 14)
  g.fillStyle = '#1b3f8f'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 22px Impact, sans-serif'
  g.fillText(`${name} MILK`, 128, 40)
  return finish(c)
}

/** Cardboard sleeve round an eight-pack of cans. */
export function multipackTexture() {
  const [c, g] = canvas(256, 128)
  g.fillStyle = '#d81e1e'
  g.fillRect(0, 0, 256, 128)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 44px Impact, sans-serif'
  g.fillText('FIZZ', 100, 60)
  g.fillStyle = '#ffde21'
  g.beginPath()
  g.arc(205, 64, 36, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#111'
  g.font = 'bold 22px Impact, sans-serif'
  g.fillText('8 PACK', 205, 64)
  return finish(c)
}
