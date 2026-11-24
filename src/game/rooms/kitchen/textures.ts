import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three'
import { mulberry32 } from '../../rng'

/*
 * Everything printed or tiled in the kitchen is drawn on a canvas at load
 * time: the wall and floor tiles, order tickets, signs, the frosted walk-in
 * window and the frost inside it, the fryer baskets' wire and the glow
 * round the dining room's lights.
 */

/** One tile texture covers this many metres of wall or floor. */
export const TILE_SPAN = 0.6

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

/** White brick-bond wall tiles, 150 × 75 mm, with grey grout. */
export function subwayTiles(repeatX: number, repeatY: number) {
  const [c, g] = canvas(512)
  g.fillStyle = '#9ea3a3'
  g.fillRect(0, 0, 512, 512)
  const rng = mulberry32(3)
  const w = 128
  const h = 64
  for (let row = 0; row < 8; row++) {
    const off = row % 2 ? w / 2 : 0
    for (let col = -1; col < 5; col++) {
      const shade = 238 + Math.floor(rng() * 12)
      g.fillStyle = `rgb(${shade},${shade},${shade - 4})`
      g.fillRect(col * w + off + 3, row * h + 3, w - 6, h - 6)
      // a soft highlight along the top edge of each glazed tile
      g.fillStyle = 'rgba(255,255,255,0.5)'
      g.fillRect(col * w + off + 6, row * h + 6, w - 12, 4)
    }
  }
  return finish(c, [repeatX, repeatY])
}

/**
 * Loud encaustic-style tiles for the feature wall: 200 mm squares with a
 * star-and-petal motif in teal, mustard and terracotta, every other one
 * turned. Busy enough to hide a knife or two against.
 */
export function busyTiles(repeatX: number, repeatY: number) {
  const [c, g] = canvas(768)
  const s = 256
  const colours = [
    ['#1f6f78', '#e3a72f', '#c4522c', '#f3ead6'],
    ['#c4522c', '#1f6f78', '#e3a72f', '#f3ead6'],
  ]
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const [a, b, d, light] = colours[(i + j) % 2]
      g.save()
      g.beginPath()
      g.rect(i * s, j * s, s, s)
      g.clip()
      g.fillStyle = light
      g.fillRect(i * s, j * s, s, s)
      // corner quarter-circles that join into rings across tiles
      for (const [cx, cy] of [
        [0, 0],
        [s, 0],
        [0, s],
        [s, s],
      ]) {
        g.fillStyle = a
        g.beginPath()
        g.arc(i * s + cx, j * s + cy, 80, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = light
        g.beginPath()
        g.arc(i * s + cx, j * s + cy, 56, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = d
        g.beginPath()
        g.arc(i * s + cx, j * s + cy, 34, 0, Math.PI * 2)
        g.fill()
      }
      // eight-point star in the middle
      g.translate(i * s + s / 2, j * s + s / 2)
      g.fillStyle = b
      g.beginPath()
      for (let k = 0; k < 16; k++) {
        const r = k % 2 ? 40 : 92
        const ang = (k / 16) * Math.PI * 2 + ((i + j) % 2) * (Math.PI / 8)
        g.lineTo(Math.cos(ang) * r, Math.sin(ang) * r)
      }
      g.closePath()
      g.fill()
      g.fillStyle = a
      for (let k = 0; k < 4; k++) {
        g.rotate(Math.PI / 2)
        g.beginPath()
        g.ellipse(0, -112, 9, 18, 0, 0, Math.PI * 2)
        g.fill()
      }
      g.fillStyle = light
      g.beginPath()
      g.arc(0, 0, 22, 0, Math.PI * 2)
      g.fill()
      g.restore()
      g.strokeStyle = '#6d6a62'
      g.lineWidth = 4
      g.strokeRect(i * s, j * s, s, s)
    }
  return finish(c, [repeatX, repeatY])
}

/** Red quarry floor tiles, 150 mm, dark grout and a bit of wear. */
export function quarryTiles(repeatX: number, repeatY: number) {
  const [c, g] = canvas(512)
  g.fillStyle = '#3a2a24'
  g.fillRect(0, 0, 512, 512)
  const rng = mulberry32(11)
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const r = 128 + Math.floor(rng() * 26)
      g.fillStyle = `rgb(${r},${Math.floor(r * 0.45)},${Math.floor(r * 0.34)})`
      g.fillRect(i * 128 + 4, j * 128 + 4, 120, 120)
    }
  for (let k = 0; k < 2500; k++) {
    g.fillStyle = `rgba(${rng() < 0.5 ? '0,0,0' : '255,220,200'},${rng() * 0.08})`
    g.fillRect(rng() * 512, rng() * 512, 3, 3)
  }
  return finish(c, [repeatX, repeatY])
}

/** One order slip: table number, a few dishes, a time. */
export function ticketTexture(lines: string[], table: number, mode: 'normal' | 'help' = 'normal') {
  const [c, g] = canvas(128, 256)
  g.fillStyle = '#fbfaf3'
  g.fillRect(0, 0, 128, 256)
  g.fillStyle = '#222'
  g.textAlign = 'left'
  g.font = 'bold 20px monospace'
  g.fillText(`TABLE ${table}`, 10, 30)
  g.fillRect(10, 38, 108, 2)
  if (mode === 'help') {
    g.fillStyle = '#b3121b'
    g.textAlign = 'center'
    g.font = 'bold 46px Impact, sans-serif'
    ;['H', 'E', 'L', 'P'].forEach((ch, i) => g.fillText(ch, 64 + (i % 2 ? 4 : -4), 90 + i * 44))
    return finish(c)
  }
  g.font = '16px monospace'
  lines.forEach((l, i) => g.fillText(l, 10, 66 + i * 24))
  g.font = '14px monospace'
  g.fillText(`19:${String(10 + table * 3).padStart(2, '0')}`, 10, 236)
  return finish(c)
}

export const TICKETS = [
  { table: 4, lines: ['2 SOUP', '1 RISOTTO', '1 STEAK MR', ' -no chips'] },
  { table: 7, lines: ['3 FISH', '3 CHIPS', '1 PEAS'] },
  { table: 2, lines: ['1 DUCK', '1 BURGER', ' -no bun', '2 SALAD'] },
  { table: 11, lines: ['4 SOUP', '2 LAMB', '2 FISH'] },
  { table: 9, lines: ['1 STEAK WD', '1 CHIPS', '1 ???'] },
  { table: 5, lines: ['2 BURGER', '2 CHIPS', '1 KIDS'] },
  { table: 13, lines: ['1 EGGS', '1 MORE EGGS'] },
]

/** A long till roll for the ticket that keeps going: the same dish, over and over. */
export function longTicketTexture() {
  const [c, g] = canvas(128, 1024)
  g.fillStyle = '#fbfaf3'
  g.fillRect(0, 0, 128, 1024)
  g.fillStyle = '#222'
  g.font = 'bold 20px monospace'
  g.fillText('TABLE 0', 10, 30)
  g.fillRect(10, 38, 108, 2)
  g.font = '16px monospace'
  for (let i = 0; i < 38; i++) g.fillText('1 SOUP', 10, 64 + i * 25)
  return finish(c)
}

/** A printed sign: bold lines of text on a coloured board with a border. */
export function signTexture(lines: string[], bg: string, ink: string, w = 512, h = 256) {
  const [c, g] = canvas(w, h)
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.strokeStyle = ink
  g.lineWidth = 10
  g.strokeRect(10, 10, w - 20, h - 20)
  g.fillStyle = ink
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const size = Math.min(h / (lines.length + 0.8), (w * 1.6) / Math.max(...lines.map((l) => l.length)))
  g.font = `bold ${size}px Impact, sans-serif`
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05))
  return finish(c)
}

/** The kitchen's prep list on a whiteboard, in marker pen; `you`: someone has added you to it. */
export function whiteboardTexture(you = false) {
  const [c, g] = canvas(512, 340)
  g.fillStyle = '#f7f8f8'
  g.fillRect(0, 0, 512, 340)
  g.fillStyle = '#c0392b'
  g.font = 'bold 34px "Comic Sans MS", "Segoe Print", cursive'
  g.fillText('PREP - FRI', 24, 50)
  g.fillStyle = '#1d3f8f'
  g.font = '26px "Comic Sans MS", "Segoe Print", cursive'
  ;['onions x 10kg', 'stock (big pot)', 'peel spuds', 'fish - DO NOT LOOK', 'lemons', 'clean walk-in'].forEach((l, i) =>
    g.fillText(`- ${l}`, 30, 98 + i * 40),
  )
  g.strokeStyle = '#1d3f8f'
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(40, 172)
  g.lineTo(260, 166)
  g.stroke()
  if (you) {
    // scrawled big in red, with an arrow into the list
    g.save()
    g.translate(372, 250)
    g.rotate(-0.16)
    g.fillStyle = '#c0392b'
    g.font = 'bold 64px "Comic Sans MS", "Segoe Print", cursive'
    g.textAlign = 'center'
    g.fillText('+ YOU', 0, 0)
    g.strokeStyle = '#c0392b'
    g.lineWidth = 5
    g.beginPath()
    g.moveTo(-90, 16)
    g.lineTo(90, 12)
    g.moveTo(-80, 28)
    g.lineTo(84, 25)
    g.stroke()
    g.restore()
  }
  return finish(c)
}

/** The walk-in's window: dark and cold, or frosted over with a handprint from the inside. */
export function walkInWindowTexture(frosted: boolean) {
  const [c, g] = canvas(256, 320)
  const dark = g.createLinearGradient(0, 0, 0, 320)
  dark.addColorStop(0, '#22303d')
  dark.addColorStop(1, '#0d141b')
  g.fillStyle = dark
  g.fillRect(0, 0, 256, 320)
  if (!frosted) {
    // a shelf or two of tubs in the gloom
    g.fillStyle = '#3d4d5b'
    g.fillRect(0, 120, 256, 6)
    g.fillRect(0, 230, 256, 6)
    g.fillStyle = '#56687a'
    for (let i = 0; i < 5; i++) g.fillRect(14 + i * 50, 84, 34, 36)
    return finish(c)
  }
  const rng = mulberry32(31)
  g.fillStyle = 'rgba(230,240,248,0.92)'
  g.fillRect(0, 0, 256, 320)
  for (let k = 0; k < 900; k++) {
    g.fillStyle = `rgba(255,255,255,${rng() * 0.6})`
    g.beginPath()
    g.arc(rng() * 256, rng() * 320, rng() * 3, 0, Math.PI * 2)
    g.fill()
  }
  // a hand pressed against the glass from inside: the frost is wiped where it touched
  g.save()
  g.translate(128, 190)
  g.rotate(-0.12)
  g.globalCompositeOperation = 'destination-out'
  g.fillStyle = 'rgba(0,0,0,0.82)'
  g.beginPath()
  g.ellipse(0, 0, 40, 46, 0, 0, Math.PI * 2)
  g.fill()
  const fingers: [number, number, number, number][] = [
    [-34, -52, 9, 30],
    [-13, -78, 10, 36],
    [10, -80, 10, 38],
    [31, -64, 9, 32],
    [-56, 4, 9, 26],
  ]
  fingers.forEach(([x, y, rx, ry], i) => {
    g.beginPath()
    g.ellipse(x, y, rx, ry, i === 4 ? -0.9 : (i - 1.5) * 0.15, 0, Math.PI * 2)
    g.fill()
  })
  g.restore()
  // and a drip or two running down from it
  g.fillStyle = 'rgba(20,30,40,0.6)'
  for (const x of [112, 140]) g.fillRect(x, 236, 3, 40 + (x % 7) * 4)
  return finish(c)
}

/** A soft round glow, white in the middle and fading to nothing, for the lights in the dining room. */
export function glowTexture() {
  const [c, g] = canvas(64)
  const glow = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  glow.addColorStop(0, 'rgba(255,255,255,1)')
  glow.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = glow
  g.fillRect(0, 0, 64, 64)
  return finish(c)
}

/** Red fire blanket case, with its label. */
export function fireBlanketTexture() {
  const [c, g] = canvas(256, 320)
  g.fillStyle = '#c4161c'
  g.fillRect(0, 0, 256, 320)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.font = 'bold 44px Impact, sans-serif'
  g.fillText('FIRE', 128, 70)
  g.fillText('BLANKET', 128, 118)
  g.fillRect(40, 140, 176, 4)
  // pull-tabs diagram
  g.strokeStyle = '#fff'
  g.lineWidth = 6
  g.strokeRect(70, 170, 116, 90)
  g.beginPath()
  g.moveTo(100, 260)
  g.lineTo(100, 300)
  g.moveTo(156, 260)
  g.lineTo(156, 300)
  g.stroke()
  g.font = 'bold 20px sans-serif'
  g.fillText('PULL DOWN', 128, 225)
  return finish(c)
}

/** Woven wire for the fryer baskets: see-through between the wires (use with alphaTest). */
export function wireMeshTexture() {
  const [c, g] = canvas(128)
  g.clearRect(0, 0, 128, 128)
  g.fillStyle = '#ffffff'
  for (let i = 0; i < 128; i += 11) {
    g.fillRect(i, 0, 2, 128)
    g.fillRect(0, i, 128, 2)
  }
  return finish(c, [2, 2])
}

/** The walk-in's insulated wall panels: white, with seams, and furred with frost towards the corners. */
export function coldPanelTexture() {
  const [c, g] = canvas(512)
  g.fillStyle = '#e3ecf2'
  g.fillRect(0, 0, 512, 512)
  // panel seams
  g.fillStyle = '#b9c6cf'
  for (const x of [0, 256]) g.fillRect(x, 0, 3, 512)
  g.fillStyle = '#f4f8fb'
  for (const x of [4, 260]) g.fillRect(x, 0, 2, 512)
  // frost: soft white patches, thickest at the top and bottom, and crystals
  const rng = mulberry32(57)
  for (let k = 0; k < 140; k++) {
    const y = rng() < 0.5 ? rng() * 120 : 512 - rng() * 140
    const x = rng() * 512
    const r = 8 + rng() * 40
    const blob = g.createRadialGradient(x, y, 0, x, y, r)
    blob.addColorStop(0, 'rgba(255,255,255,0.55)')
    blob.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = blob
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  g.strokeStyle = 'rgba(255,255,255,0.8)'
  g.lineWidth = 1
  for (let k = 0; k < 260; k++) {
    const x = rng() * 512
    const y = rng() < 0.6 ? rng() * 140 : 512 - rng() * 160
    const r = 2 + rng() * 5
    for (let a = 0; a < 3; a++) {
      const t = (a * Math.PI) / 3 + rng()
      g.beginPath()
      g.moveTo(x - Math.cos(t) * r, y - Math.sin(t) * r)
      g.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r)
      g.stroke()
    }
  }
  return finish(c, [1, 1])
}
