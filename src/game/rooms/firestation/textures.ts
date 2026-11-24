import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { layerTexture, once, type OutsideLayer } from '../../outsideLayers'
import { mulberry32 } from '../../rng'
import { BAY_BOX, ENGINE_X, KEEP_CLEAR, MAT_SIZE, POLE, ROOM } from './layout'

/*
 * Everything painted or printed in the fire station is drawn on a canvas at
 * load time: the floor and its yellow lines, the painted brick, the engine's
 * chequers and shutters, the boards on the wall and the view out of the doors.
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

/** A copy of a tiling texture with its own repeat (copies share the image). */
export function tiled(t: Texture, x: number, y: number) {
  const c = t.clone()
  c.wrapS = c.wrapT = RepeatWrapping
  c.repeat.set(x, y)
  c.needsUpdate = true
  return c
}

const SCRIPT = '"Segoe Print", "Comic Sans MS", cursive'

// ---------------------------------------------------------------------------
// Floor: sealed grey concrete with yellow lines
// ---------------------------------------------------------------------------

/** The whole bay floor in one texture, so the lines land exactly where the layout says. */
export function floorTexture() {
  const { halfX, halfZ } = ROOM
  const S = 160 // pixels per metre
  const [c, g] = canvas(halfX * 2 * S, halfZ * 2 * S)
  const px = (x: number) => (x + halfX) * S
  const pz = (z: number) => (z + halfZ) * S
  const rng = mulberry32(31)
  g.fillStyle = '#7d8183'
  g.fillRect(0, 0, c.width, c.height)
  // trowel mottling and grit
  for (let k = 0; k < 900; k++) {
    g.fillStyle = `rgba(${rng() < 0.5 ? '0,0,0' : '255,255,255'},${rng() * 0.04})`
    g.beginPath()
    g.arc(rng() * c.width, rng() * c.height, 20 + rng() * 90, 0, Math.PI * 2)
    g.fill()
  }
  for (let k = 0; k < 14000; k++) {
    g.fillStyle = `rgba(0,0,0,${rng() * 0.12})`
    g.fillRect(rng() * c.width, rng() * c.height, 2, 2)
  }
  // tyre tracks out of the doors and oil under the engine
  g.fillStyle = 'rgba(20,20,22,0.13)'
  const back = ENGINE_X - 3.85
  for (const z of [-1.0, 1.0]) g.fillRect(px(back), pz(z) - 0.2 * S, (halfX - back) * S, 0.4 * S)
  for (const [x, z, r] of [
    [ENGINE_X + 2.0, 0.2, 0.5],
    [ENGINE_X + 2.9, -0.4, 0.3],
    [ENGINE_X - 1.6, 0.5, 0.4],
  ]) {
    const oil = g.createRadialGradient(px(x), pz(z), 2, px(x), pz(z), r * S)
    oil.addColorStop(0, 'rgba(15,12,10,0.4)')
    oil.addColorStop(1, 'rgba(15,12,10,0)')
    g.fillStyle = oil
    g.fillRect(px(x - r), pz(z - r), r * 2 * S, r * 2 * S)
  }
  // saw-cut joints every 3m
  g.strokeStyle = 'rgba(30,30,30,0.5)'
  g.lineWidth = 2
  for (let x = -halfX + 3; x < halfX; x += 3) {
    g.beginPath()
    g.moveTo(px(x), 0)
    g.lineTo(px(x), c.height)
    g.stroke()
  }
  g.beginPath()
  g.moveTo(0, pz(0))
  g.lineTo(c.width, pz(0))
  g.stroke()

  const yellow = '#f1c40f'
  g.strokeStyle = yellow
  g.lineWidth = 0.1 * S
  // the engine's parking box
  g.strokeRect(px(BAY_BOX.x0), pz(BAY_BOX.z0), (BAY_BOX.x1 - BAY_BOX.x0) * S, (BAY_BOX.z1 - BAY_BOX.z0) * S)
  // stop bar for the driver, just ahead of the front bumper
  g.fillStyle = yellow
  g.fillRect(px(ENGINE_X + 4.1), pz(-0.6), 0.12 * S, 1.2 * S)
  // walkway line in front of the kit
  g.fillRect(px(-3.7), pz(-2.75), 6.4 * S, 0.08 * S)
  // hatched keep-clear zone inside the doors
  g.save()
  g.beginPath()
  g.rect(px(KEEP_CLEAR.x0), pz(KEEP_CLEAR.z0), (halfX - KEEP_CLEAR.x0) * S, (KEEP_CLEAR.z1 - KEEP_CLEAR.z0) * S)
  g.clip()
  g.lineWidth = 0.09 * S
  for (let d = -6; d < 8; d += 0.45) {
    g.beginPath()
    g.moveTo(px(KEEP_CLEAR.x0 + d), pz(KEEP_CLEAR.z0))
    g.lineTo(px(KEEP_CLEAR.x0 + d + 5), pz(KEEP_CLEAR.z0 + 5))
    g.stroke()
  }
  g.restore()
  g.lineWidth = 0.1 * S
  g.strokeRect(px(KEEP_CLEAR.x0), pz(KEEP_CLEAR.z0), (halfX - KEEP_CLEAR.x0) * S, (KEEP_CLEAR.z1 - KEEP_CLEAR.z0) * S)
  // black and yellow border round the pole's landing
  const m = MAT_SIZE / 2 + 0.12
  for (let i = 0; i < 4; i++) {
    g.save()
    g.translate(px(POLE.x), pz(POLE.z))
    g.rotate((i * Math.PI) / 2)
    for (let s = -m; s < m; s += 0.16) {
      g.fillStyle = Math.round((s + m) / 0.16) % 2 ? '#141414' : yellow
      g.fillRect(s * S, -m * S, 0.16 * S, 0.1 * S)
    }
    g.restore()
  }
  // KEEP CLEAR, reading the right way up as you face the doors
  g.save()
  g.translate(px(KEEP_CLEAR.x0 - 0.45), pz(0))
  g.rotate(Math.PI / 2)
  g.fillStyle = yellow
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `bold ${0.42 * S}px Impact, sans-serif`
  g.fillText('KEEP CLEAR', 0, 0)
  g.restore()
  return finish(c)
}

// ---------------------------------------------------------------------------
// Walls
// ---------------------------------------------------------------------------

/** One brick course pattern; `w`×`h` pixels covers 0.9 × 0.9 m (4 bricks by 12 courses). */
function drawBricks(g: CanvasRenderingContext2D, w: number, h: number, seed: number, base = 236) {
  const rng = mulberry32(seed)
  const bw = w / 4
  const ch = h / 12
  g.fillStyle = `rgb(${base - 30},${base - 33},${base - 40})`
  g.fillRect(0, 0, w, h)
  for (let row = 0; row < 12; row++) {
    const off = row % 2 ? bw / 2 : 0
    for (let i = -1; i < 5; i++) {
      const v = base - 6 + Math.floor(rng() * 12)
      g.fillStyle = `rgb(${v},${v - 3},${v - 9})`
      g.fillRect(i * bw + off + 2, row * ch + 2, bw - 4, ch - 4)
    }
  }
  // paint lying thick in the mortar, and the odd scuff
  for (let k = 0; k < 1600; k++) {
    g.fillStyle = `rgba(0,0,0,${rng() * 0.05})`
    g.fillRect(rng() * w, rng() * h, 2, 2)
  }
}

let brick: CanvasTexture | null = null
/** Painted brick, nearly white so the wall colour tints it. One tile is 0.9 m square. */
export function brickTexture() {
  if (brick) return brick
  const [c, g] = canvas(512)
  drawBricks(g, 512, 512, 4)
  brick = finish(c, [1, 1])
  return brick
}

/** Bare red brick, for the bricked-up door pane. */
export function rawBrickTexture() {
  const [c, g] = canvas(256)
  const rng = mulberry32(12)
  g.fillStyle = '#b9b2a4'
  g.fillRect(0, 0, 256, 256)
  const bw = 256 / 2
  const ch = 256 / 6
  for (let row = 0; row < 6; row++) {
    const off = row % 2 ? bw / 2 : 0
    for (let i = -1; i < 3; i++) {
      const r = 140 + Math.floor(rng() * 40)
      g.fillStyle = `rgb(${r},${Math.floor(r * 0.42)},${Math.floor(r * 0.32)})`
      g.fillRect(i * bw + off + 3, row * ch + 3, bw - 6, ch - 6)
    }
  }
  return finish(c)
}

/** A brick wall plastered with safety signs and notices: the busy feature wall. */
export function signWallTexture(width: number, height: number) {
  const PPM = 220
  const [c, g] = canvas(Math.round(width * PPM), Math.round(height * PPM))
  const tile = 0.9 * PPM
  // painted brick underneath
  const [bc, bg] = canvas(Math.round(tile))
  drawBricks(bg, bc.width, bc.height, 9)
  g.fillStyle = g.createPattern(bc, 'repeat')!
  g.fillRect(0, 0, c.width, c.height)
  // a red dado to match the rest of the bay
  g.fillStyle = 'rgba(150,30,26,0.82)'
  g.fillRect(0, c.height - 1.2 * PPM, c.width, 1.2 * PPM)
  const rng = mulberry32(77)
  const kinds = ['blue', 'yellow', 'green', 'red', 'notice', 'blue', 'yellow', 'hazard'] as const
  const cols = Math.floor(width / 0.42)
  const rows = Math.floor(height / 0.42)
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      if (rng() < 0.22) continue
      const kind = kinds[Math.floor(rng() * kinds.length)]
      const cx = (i + 0.5) * (c.width / cols) + (rng() - 0.5) * 30
      const cy = (j + 0.5) * (c.height / rows) + (rng() - 0.5) * 30
      const s = (0.2 + rng() * 0.1) * PPM
      drawSign(g, kind, cx, cy, s, rng)
    }
  return finish(c)
}

function drawSign(g: CanvasRenderingContext2D, kind: string, x: number, y: number, s: number, rng: () => number) {
  g.save()
  g.translate(x, y)
  g.rotate((rng() - 0.5) * 0.06)
  const words = ['HELMETS', 'BA ONLY', 'KEEP CLEAR', 'NO SMOKING', 'EAR DEFENDERS', 'HI-VIS', 'WASH HANDS', 'HOT HOSE']
  const word = words[Math.floor(rng() * words.length)]
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  // white sign board with the symbol at the top and words underneath
  g.fillStyle = '#f7f5ee'
  g.fillRect(-s / 2, -s * 0.65, s, s * 1.3)
  g.strokeStyle = 'rgba(0,0,0,0.3)'
  g.lineWidth = 2
  g.strokeRect(-s / 2, -s * 0.65, s, s * 1.3)
  const r = s * 0.36
  if (kind === 'blue') {
    g.fillStyle = '#1f5fbf'
    g.beginPath()
    g.arc(0, -s * 0.15, r, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(0, -s * 0.18, r * 0.45, Math.PI, 0)
    g.fill()
    g.fillRect(-r * 0.55, -s * 0.18, r * 1.1, r * 0.12)
  } else if (kind === 'yellow') {
    g.fillStyle = '#111'
    g.beginPath()
    g.moveTo(0, -s * 0.55)
    g.lineTo(r * 1.1, s * 0.15)
    g.lineTo(-r * 1.1, s * 0.15)
    g.closePath()
    g.fill()
    g.fillStyle = '#f5c400'
    g.beginPath()
    g.moveTo(0, -s * 0.45)
    g.lineTo(r * 0.92, s * 0.09)
    g.lineTo(-r * 0.92, s * 0.09)
    g.closePath()
    g.fill()
    g.fillStyle = '#111'
    g.font = `bold ${s * 0.4}px Impact, sans-serif`
    g.fillText('!', 0, -s * 0.12)
  } else if (kind === 'green') {
    g.fillStyle = '#138a3e'
    g.fillRect(-r, -s * 0.15 - r, r * 2, r * 2)
    g.fillStyle = '#fff'
    g.fillRect(-r * 0.2, -s * 0.15 - r * 0.7, r * 0.4, r * 1.4)
    g.fillRect(-r * 0.7, -s * 0.15 - r * 0.2, r * 1.4, r * 0.4)
  } else if (kind === 'red') {
    g.fillStyle = '#c8211b'
    g.fillRect(-s / 2, -s * 0.65, s, s * 1.3)
    g.fillStyle = '#fff'
    g.font = `bold ${s * 0.22}px Impact, sans-serif`
    g.fillText('FIRE', 0, -s * 0.3)
    g.fillText('POINT', 0, -s * 0.05)
  } else if (kind === 'hazard') {
    for (let k = -4; k < 6; k++) {
      g.fillStyle = k % 2 ? '#111' : '#f5c400'
      g.beginPath()
      g.moveTo(-s / 2 + k * s * 0.2, -s * 0.65)
      g.lineTo(-s / 2 + (k + 1) * s * 0.2, -s * 0.65)
      g.lineTo(-s / 2 + (k + 1) * s * 0.2 - s * 0.3, -s * 0.2)
      g.lineTo(-s / 2 + k * s * 0.2 - s * 0.3, -s * 0.2)
      g.fill()
    }
  } else {
    g.fillStyle = '#c8211b'
    g.fillRect(-s / 2, -s * 0.65, s, s * 0.25)
    g.fillStyle = '#bbb'
    for (let k = 0; k < 6; k++) g.fillRect(-s * 0.4, -s * 0.28 + k * s * 0.1, s * (0.5 + rng() * 0.3), s * 0.04)
  }
  g.fillStyle = kind === 'red' ? '#fff' : '#111'
  g.font = `bold ${s * 0.13}px Arial, sans-serif`
  g.fillText(word, 0, s * 0.42)
  g.restore()
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

/** Red and yellow Battenburg chequers. One tile is two squares tall, eight long. */
export function chequerTexture() {
  const [c, g] = canvas(512, 128)
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? '#f6d313' : '#e3261d'
      g.fillRect(i * 64, j * 64, 64, 64)
    }
  return finish(c, [1, 1])
}

/** Red and yellow chevrons across the back of the engine. */
export function chevronTexture() {
  const [c, g] = canvas(256)
  g.fillStyle = '#f6d313'
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = '#e3261d'
  for (let k = -2; k < 4; k++) {
    // an upside-down V, pointing up the middle
    g.beginPath()
    g.moveTo(0, k * 128 + 128)
    g.lineTo(128, k * 128)
    g.lineTo(256, k * 128 + 128)
    g.lineTo(256, k * 128 + 192)
    g.lineTo(128, k * 128 + 64)
    g.lineTo(0, k * 128 + 192)
    g.closePath()
    g.fill()
  }
  return finish(c, [1, 1])
}

/** Ribbed aluminium roller shutter. One tile is 0.25 m tall (five slats). */
export function shutterTexture() {
  const [c, g] = canvas(64, 160)
  for (let i = 0; i < 5; i++) {
    const y = i * 32
    const grad = g.createLinearGradient(0, y, 0, y + 32)
    grad.addColorStop(0, '#f2f4f6')
    grad.addColorStop(0.45, '#c9ced3')
    grad.addColorStop(0.85, '#9aa1a8')
    grad.addColorStop(1, '#5f666d')
    g.fillStyle = grad
    g.fillRect(0, y, 64, 32)
  }
  return finish(c, [1, 1])
}

/** Lettering on a clear background. */
export function letteringTexture(text: string, colour = '#ffffff', outline = '#0d2a6b') {
  const [c, g] = canvas(1024, 128)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 92px Arial, sans-serif'
  g.lineWidth = 10
  g.strokeStyle = outline
  g.strokeText(text, 512, 66)
  g.fillStyle = colour
  g.fillText(text, 512, 66)
  return finish(c)
}

/** A number plate. */
export function plateTexture(text: string, bg: string) {
  const [c, g] = canvas(256, 56)
  g.fillStyle = bg
  g.fillRect(0, 0, 256, 56)
  g.fillStyle = '#111'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 40px "Arial Narrow", Arial, sans-serif'
  g.fillText(text, 128, 30)
  return finish(c)
}

// ---------------------------------------------------------------------------
// Kit, hoses and the crash mat
// ---------------------------------------------------------------------------

/** Rolled hose seen end on: a tight spiral. */
export function hoseEndTexture(colour: string) {
  const [c, g] = canvas(128)
  g.fillStyle = colour
  g.fillRect(0, 0, 128, 128)
  g.strokeStyle = 'rgba(0,0,0,0.35)'
  g.lineWidth = 2
  g.beginPath()
  for (let a = 0; a < Math.PI * 2 * 9; a += 0.1) {
    const r = 10 + (a / (Math.PI * 2)) * 6
    g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r)
  }
  g.stroke()
  g.fillStyle = '#222'
  g.beginPath()
  g.arc(64, 64, 8, 0, Math.PI * 2)
  g.fill()
  return finish(c)
}

/** Name strip along the top of the kit lockers, one name per bay. */
export function nameStripTexture(names: string[]) {
  const [c, g] = canvas(256 * names.length, 48)
  g.fillStyle = '#1b1b1b'
  g.fillRect(0, 0, c.width, 48)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 30px Arial, sans-serif'
  names.forEach((n, i) => {
    g.fillStyle = '#f2efe6'
    g.fillRect(i * 256 + 50, 6, 156, 36)
    g.fillStyle = '#111'
    g.fillText(n, i * 256 + 128, 25)
  })
  return finish(c)
}

/** A bullseye with a hole in the middle for the pole. */
export function targetTexture() {
  const [c, g] = canvas(512)
  // the inner edge lines up with the hole in the mat
  const step = 22.5
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? '#ffffff' : '#d8241c'
    g.beginPath()
    g.arc(256, 256, 250 - i * step, 0, Math.PI * 2)
    g.fill()
  }
  g.globalCompositeOperation = 'destination-out'
  g.beginPath()
  g.arc(256, 256, 250 - 6 * step, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.rect(0, 0, 512, 512)
  g.arc(256, 256, 250, 0, Math.PI * 2, true)
  g.fill()
  return finish(c)
}

/** Wire mesh in fire-door glass. */
export function wiredGlassTexture() {
  const [c, g] = canvas(64)
  g.strokeStyle = 'rgba(40,40,40,0.55)'
  g.lineWidth = 1.5
  g.beginPath()
  g.moveTo(32, 0)
  g.lineTo(32, 64)
  g.moveTo(0, 32)
  g.lineTo(64, 32)
  g.stroke()
  return finish(c, [1, 1])
}

/** A sign: coloured board with words. */
export function signTexture(text: string, bg: string, ink: string, w = 256, h = 96) {
  const [c, g] = canvas(w, h)
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.strokeStyle = ink
  g.lineWidth = 5
  g.strokeRect(6, 6, w - 12, h - 12)
  g.fillStyle = ink
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `bold ${Math.round(h * 0.46)}px Arial, sans-serif`
  g.fillText(text, w / 2, h / 2 + 2)
  return finish(c)
}

/** Green running-man exit sign. */
export function exitSignTexture() {
  const [c, g] = canvas(256, 96)
  g.fillStyle = '#12924a'
  g.fillRect(0, 0, 256, 96)
  g.fillStyle = '#fff'
  // door and running figure, roughly
  g.fillRect(14, 14, 44, 68)
  g.fillStyle = '#12924a'
  g.fillRect(20, 20, 32, 62)
  g.fillStyle = '#fff'
  g.beginPath()
  g.arc(82, 26, 8, 0, Math.PI * 2)
  g.fill()
  g.lineWidth = 8
  g.strokeStyle = '#fff'
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(80, 36)
  g.lineTo(74, 58)
  g.lineTo(88, 80)
  g.moveTo(74, 58)
  g.lineTo(60, 76)
  g.moveTo(78, 42)
  g.lineTo(94, 50)
  g.moveTo(78, 42)
  g.lineTo(64, 46)
  g.stroke()
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 46px Arial, sans-serif'
  g.fillText('EXIT', 172, 50)
  return finish(c)
}

// ---------------------------------------------------------------------------
// Boards on the back wall
// ---------------------------------------------------------------------------

const RIDERS = [
  ['OIC', 'WM HARDY', 'CM OKAFOR'],
  ['DRIVER', 'FF BLAKE', 'FF NOVAK'],
  ['BA 1', 'FF PATEL', 'FF WALSH'],
  ['BA 2', 'FF KHAN', 'FF EVANS'],
  ['BA ECO', "FF O'BRIEN", 'FF JONES'],
  ['STANDBY', 'FF SMITH', 'FF LEWIS'],
]

/** The duty roster whiteboard: who rides which seat on the day and night shifts. */
export function rosterTexture(mode: 'normal' | 'you' | 'clean') {
  const [c, g] = canvas(768, 528)
  g.fillStyle = '#fbfcfd'
  g.fillRect(0, 0, 768, 528)
  // ghosts of old writing
  const rng = mulberry32(5)
  g.fillStyle = 'rgba(120,130,150,0.08)'
  for (let k = 0; k < 40; k++) g.fillRect(rng() * 700, rng() * 500, 60 + rng() * 120, 10)
  g.fillStyle = '#c8211b'
  g.font = `bold 46px ${SCRIPT}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('RED WATCH ROSTER', 384, 46)
  // the printed grid tape stays even when the board is wiped
  g.strokeStyle = '#222'
  g.lineWidth = 3
  const top = 100
  const rowH = 66
  g.strokeRect(24, top, 720, rowH * 7)
  for (let r = 1; r < 7; r++) {
    g.beginPath()
    g.moveTo(24, top + r * rowH)
    g.lineTo(744, top + r * rowH)
    g.stroke()
  }
  for (const x of [190, 467]) {
    g.beginPath()
    g.moveTo(x, top)
    g.lineTo(x, top + rowH * 7)
    g.stroke()
  }
  g.fillStyle = '#222'
  g.font = 'bold 26px Arial, sans-serif'
  g.fillText('DAYS', 328, top + rowH / 2)
  g.fillText('NIGHTS', 605, top + rowH / 2)
  RIDERS.forEach(([seat], r) => g.fillText(seat, 107, top + (r + 1.5) * rowH))
  if (mode === 'clean') {
    // wiped with a dry cloth: grey smears where the names were
    g.fillStyle = 'rgba(90,100,130,0.12)'
    for (let k = 0; k < 18; k++) g.fillRect(200 + rng() * 480, top + rowH + rng() * rowH * 5.5, 80 + rng() * 120, 14)
    return finish(c)
  }
  g.font = `bold 30px ${SCRIPT}`
  RIDERS.forEach(([, day, night], r) => {
    const y = top + (r + 1.5) * rowH
    g.fillStyle = '#1d3fb8'
    g.fillText(day, 328, y)
    if (mode === 'you' && r === 2) {
      g.fillStyle = '#c8211b'
      g.fillText('YOU', 605, y)
      g.lineWidth = 4
      g.strokeStyle = '#c8211b'
      g.beginPath()
      g.ellipse(605, y, 70, 28, 0, 0, Math.PI * 2)
      g.stroke()
    } else {
      g.fillStyle = '#111'
      g.fillText(night, 605, y)
    }
  })
  return finish(c)
}

/** Cork board covered in curling notices (the big poster is a separate piece). */
export function corkTexture() {
  const [c, g] = canvas(600, 400)
  const rng = mulberry32(19)
  g.fillStyle = '#b98a57'
  g.fillRect(0, 0, 600, 400)
  for (let k = 0; k < 9000; k++) {
    g.fillStyle = `rgba(${rng() < 0.5 ? '60,35,15' : '230,190,140'},${rng() * 0.25})`
    g.fillRect(rng() * 600, rng() * 400, 2, 2)
  }
  const notes = [
    [30, 30, 120, 150, '#ffffff', 'TRAINING'],
    [170, 220, 110, 140, '#fff4a8', 'BBQ SAT'],
    [36, 210, 120, 160, '#ffffff', 'ROTA'],
    [180, 40, 100, 120, '#ffd1e0', 'LOST'],
    [300, 260, 120, 120, '#d8f0ff', 'GYM'],
    [440, 250, 130, 130, '#ffffff', 'HOSE TEST'],
  ] as const
  for (const [x, y, w, h, col, title] of notes) {
    g.save()
    g.translate(x + w / 2, y + h / 2)
    g.rotate((rng() - 0.5) * 0.12)
    g.fillStyle = 'rgba(0,0,0,0.2)'
    g.fillRect(-w / 2 + 4, -h / 2 + 4, w, h)
    g.fillStyle = col
    g.fillRect(-w / 2, -h / 2, w, h)
    g.fillStyle = '#222'
    g.font = 'bold 18px Arial, sans-serif'
    g.textAlign = 'center'
    g.fillText(title, 0, -h / 2 + 24)
    g.fillStyle = '#9a9a9a'
    for (let k = 0; k < 6; k++) g.fillRect(-w / 2 + 12, -h / 2 + 40 + k * 15, w - 24 - rng() * 30, 5)
    g.fillStyle = ['#d8241c', '#1d3fb8', '#2a9d3a'][Math.floor(rng() * 3)]
    g.beginPath()
    g.arc(0, -h / 2 + 8, 6, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  return finish(c)
}

/** The big poster: a fire safety campaign, or a missing-engine appeal. */
export function posterTexture(kind: 'smoke' | 'missing') {
  const [c, g] = canvas(256, 344)
  g.fillStyle = '#fbfaf5'
  g.fillRect(0, 0, 256, 344)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  if (kind === 'smoke') {
    g.fillStyle = '#c8211b'
    g.fillRect(0, 0, 256, 92)
    g.fillStyle = '#fff'
    g.font = 'bold 38px Impact, sans-serif'
    g.fillText('SMOKE ALARMS', 128, 34)
    g.fillText('SAVE LIVES', 128, 72)
    // a smoke alarm
    g.fillStyle = '#e9e9e4'
    g.beginPath()
    g.arc(128, 190, 62, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#999'
    g.lineWidth = 4
    g.stroke()
    g.fillStyle = '#c8211b'
    g.beginPath()
    g.arc(150, 172, 7, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#222'
    g.font = 'bold 22px Arial, sans-serif'
    g.fillText('TEST IT MONTHLY', 128, 290)
    g.fillText('PRESS THE BUTTON', 128, 318)
  } else {
    g.fillStyle = '#111'
    g.font = 'bold 66px Impact, sans-serif'
    g.fillText('MISSING', 128, 50)
    // a fire engine, drawn by somebody in a hurry
    g.fillStyle = '#d8241c'
    g.fillRect(40, 140, 150, 60)
    g.fillRect(190, 120, 40, 80)
    g.fillStyle = '#9fc6e8'
    g.fillRect(198, 128, 26, 24)
    g.fillStyle = '#c9ced3'
    g.fillRect(44, 128, 140, 8)
    g.fillStyle = '#111'
    for (const x of [75, 200]) {
      g.beginPath()
      g.arc(x, 204, 16, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#1f6bff'
    g.fillRect(205, 112, 14, 8)
    g.fillStyle = '#222'
    g.font = 'bold 21px Arial, sans-serif'
    g.fillText('HAVE YOU SEEN', 128, 258)
    g.fillText('THIS ENGINE?', 128, 284)
    g.fillStyle = '#c8211b'
    g.fillText('REWARD', 128, 318)
  }
  return finish(c)
}

// ---------------------------------------------------------------------------
// Outside the bay doors, in depth layers (see outsideLayers.ts). Street x 0 is
// the middle of the doors, +x to your right looking out. The windows are high
// up, so from the floor you see sky, the upper floors of the houses opposite
// and whatever is up a lamp post or a tree, never the ground.
// ---------------------------------------------------------------------------

/** A sky (or sea) drawn as if 60 m out over street x -60..60 and heights -10..50; hung at 45 m, scaled to match. */
function farSky(top: string, horizon: string, bottom: string) {
  const [c, g] = canvas(1024, 512)
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, top)
  grad.addColorStop(0.8, horizon)
  grad.addColorStop(1, bottom)
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 512)
  return [c, g] as const
}

function daySky() {
  const [c, g] = farSky('#6fa8e6', '#cfe3f5', '#cfe3f5')
  const rng = mulberry32(3)
  g.fillStyle = 'rgba(255,255,255,0.85)'
  // nothing near the edges, which smear out to the sides
  for (let k = 0; k < 12; k++) {
    const x = 60 + rng() * 860
    const y = 130 + rng() * 210
    for (let b = 0; b < 4; b++) {
      g.beginPath()
      g.arc(x + b * 16, y + (b % 2) * 5, 13 + rng() * 9, 0, Math.PI * 2)
      g.fill()
    }
  }
  return layerTexture(c)
}

/** Three-storey terraced houses across the road, 20 m out: street x -20..20 (repeating), 0..13 m high. */
function houses() {
  const [c, g] = canvas(1024, 333)
  const rng = mulberry32(3)
  const px = 1024 / 40
  const X = (x: number) => x * px
  const Y = (y: number) => (13 - y) * px
  const widths: number[] = []
  let total = 0
  while (40 - total > 8) {
    const w = 5 + rng() * 1.5
    widths.push(w)
    total += w
  }
  widths.push(40 - total)
  let x = 0
  for (const w of widths) {
    const brick = ['#9b4a32', '#a7563b', '#8a3f2d', '#d9cbb1'][Math.floor(rng() * 4)]
    const eaves = 8 + rng() * 0.8
    const body = x + 0.05
    const width = w - 0.1
    g.fillStyle = brick
    g.fillRect(X(body), Y(eaves), X(width), Y(0) - Y(eaves))
    // chimney stack on the party wall, then the roof
    g.fillRect(X(body + width - 0.4), Y(eaves + 2.4), X(0.8), Y(eaves) - Y(eaves + 2.4))
    g.fillStyle = '#5a3a30'
    for (const p of [-0.2, 0.15]) g.fillRect(X(body + width + p - 0.06), Y(eaves + 2.75), X(0.12), Y(eaves + 2.4) - Y(eaves + 2.75))
    g.fillStyle = '#4a4f57'
    g.beginPath()
    g.moveTo(X(body - 0.1), Y(eaves))
    g.lineTo(X(body + width / 2), Y(eaves + 1.6))
    g.lineTo(X(body + width + 0.1), Y(eaves))
    g.fill()
    for (const [y0, y1] of [
      [1, 2.4],
      [3.8, 5.2],
      [6.3, 7.5],
    ]) {
      for (const wx of [body + 0.9, body + width - 1.9]) {
        g.fillStyle = '#f4f1ea'
        g.fillRect(X(wx) - 3, Y(y1) - 3, X(1) + 6, Y(y0) - Y(y1) + 6)
        g.fillStyle = '#5c7a99'
        g.fillRect(X(wx), Y(y1), X(1), Y(y0) - Y(y1))
      }
    }
    x += w
  }
  return layerTexture(c, true)
}

/** Right outside the doors, 3 m out: a lamp post, a street tree and a telephone wire. Street x -10..10, 0..8 m. */
function streetTop() {
  const [c, g] = canvas(1024, 410)
  const rng = mulberry32(5)
  const X = (x: number) => (x + 10) * 51.2
  const Y = (y: number) => (8 - y) * 51.2
  // the wire runs off both edges, which smear it on along the street
  g.strokeStyle = '#2b2b2b'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(0, Y(6.6))
  g.quadraticCurveTo(512, Y(5.6), 1024, Y(6.6))
  g.stroke()
  // lamp post with a swan-neck arm reaching out over the road
  g.fillStyle = '#4a4f57'
  g.fillRect(X(1.6) - 4, Y(5.6), 8, Y(0) - Y(5.6))
  g.strokeStyle = '#4a4f57'
  g.lineWidth = 6
  g.beginPath()
  g.moveTo(X(1.6), Y(5.55))
  g.quadraticCurveTo(X(1.6), Y(6.1), X(0.9), Y(6))
  g.stroke()
  g.fillStyle = '#cfd3d6'
  g.fillRect(X(0.9) - 14, Y(6), 28, 9)
  // a plane tree
  g.fillStyle = '#5b4636'
  g.fillRect(X(-2.6) - 7, Y(3.6), 14, Y(0) - Y(3.6))
  for (let k = 0; k < 16; k++) {
    const a = rng() * Math.PI * 2
    const r = rng() * 1.2
    g.fillStyle = ['#4f8a3a', '#5f9a45', '#3f7a32'][k % 3]
    g.beginPath()
    g.arc(X(-2.6 + Math.cos(a) * r), Y(5 + Math.sin(a) * r * 0.8), (0.6 + rng() * 0.5) * 51.2, 0, Math.PI * 2)
    g.fill()
  }
  return layerTexture(c)
}

function seaFar() {
  const [c, g] = farSky('#2bb3c9', '#0b5878', '#073a5a')
  const rng = mulberry32(8)
  // light shafts from the surface
  g.fillStyle = 'rgba(255,255,255,0.08)'
  for (let k = 0; k < 12; k++) {
    const x = 60 + rng() * 860
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x + 30, 0)
    g.lineTo(x + 90, 512)
    g.lineTo(x + 50, 512)
    g.fill()
  }
  // a shoal, a long way off
  g.fillStyle = 'rgba(8,60,84,0.55)'
  for (let k = 0; k < 30; k++) {
    g.beginPath()
    g.ellipse(400 + rng() * 200, 300 + rng() * 60, 4, 2, 0, 0, Math.PI * 2)
    g.fill()
  }
  return layerTexture(c)
}

/** Seaweed and rocks on the sand, 12 m out: street x -15..15 (repeating), 0..12 m high. */
function kelp() {
  const [c, g] = canvas(1024, 410)
  const rng = mulberry32(8)
  const px = 1024 / 30
  const Y = (y: number) => (12 - y) * px
  g.fillStyle = '#c9b58a'
  g.fillRect(0, Y(0.6), 1024, Y(0) - Y(0.6))
  g.lineCap = 'round'
  for (let k = 0; k < 34; k++) {
    const x = rng() * 1024
    const top = 4 + rng() * 7
    g.strokeStyle = k % 2 ? '#1f7a3a' : '#2a8a45'
    g.lineWidth = 5 + rng() * 4
    // drawn a repeat either side too, so strands over the edge carry on round
    for (const wrap of [-1024, 0, 1024]) {
      g.beginPath()
      g.moveTo(x + wrap, Y(0.3))
      for (let y = 0.3; y < top; y += 0.3) g.lineTo(x + wrap + Math.sin(y * 0.8 + k) * 0.4 * px, Y(y))
      g.stroke()
    }
  }
  g.fillStyle = '#4a6b70'
  for (let k = 0; k < 10; k++) {
    const x = 40 + rng() * 944
    g.beginPath()
    g.ellipse(x, Y(0.4), (0.5 + rng()) * px, (0.4 + rng() * 0.5) * px, 0, Math.PI, 0)
    g.fill()
  }
  return layerTexture(c, true)
}

/** Fish and bubbles right outside the glass, 2 m out: street x -8..8, 0..8 m high. */
function fish() {
  const [c, g] = canvas(1024, 512)
  const rng = mulberry32(9)
  const Y = (y: number) => (8 - y) * 64
  for (let k = 0; k < 18; k++) {
    const x = 40 + rng() * 944
    const y = Y(2.7 + rng() * 2.6)
    const s = 6 + rng() * 10
    const d = rng() < 0.7 ? 1 : -1
    g.fillStyle = ['#ff8a1f', '#ffde21', '#e8eef2'][Math.floor(rng() * 3)]
    g.beginPath()
    g.ellipse(x, y, s * 1.6, s, 0, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.moveTo(x - d * s * 1.4, y)
    g.lineTo(x - d * s * 2.6, y - s)
    g.lineTo(x - d * s * 2.6, y + s)
    g.fill()
  }
  g.fillStyle = 'rgba(255,255,255,0.6)'
  for (let k = 0; k < 50; k++) {
    g.beginPath()
    g.arc(20 + rng() * 984, Y(2.4 + rng() * 4.5), 1 + rng() * 3, 0, Math.PI * 2)
    g.fill()
  }
  return layerTexture(c)
}

/** The street opposite the station on a bright day. */
export const bayStreet = once((): OutsideLayer[] => [
  { map: daySky(), depth: 45, x: [-45, 45], y: [-7.1, 37.9] },
  { map: houses(), depth: 20, x: [-20, 20], y: [0, 13] },
  { map: streetTop(), depth: 3, x: [-10, 10], y: [0, 8] },
])

/** Underwater. */
export const baySea = once((): OutsideLayer[] => [
  { map: seaFar(), depth: 45, x: [-45, 45], y: [-7.1, 37.9] },
  { map: kelp(), depth: 12, x: [-15, 15], y: [0, 12] },
  { map: fish(), depth: 2, x: [-8, 8], y: [0, 8] },
])

// ---------------------------------------------------------------------------
// The engine's extras
// ---------------------------------------------------------------------------

/** The lit dot-matrix board in the top of the windscreen. */
export function boardTexture(text: string) {
  const [c, g] = canvas(512, 64)
  g.fillStyle = '#0b0b0c'
  g.fillRect(0, 0, 512, 64)
  g.fillStyle = '#ffb21f'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 44px "Courier New", monospace'
  g.fillText(text, 256, 34)
  // cut it into LED dots
  g.fillStyle = '#0b0b0c'
  for (let x = 0; x < 512; x += 4) g.fillRect(x, 0, 1, 64)
  for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 512, 1)
  return finish(c)
}

// ---------------------------------------------------------------------------
// The mess
// ---------------------------------------------------------------------------

/** Speckled vinyl floor tiles, 30 cm square. */
export function linoTexture() {
  const [c, g] = canvas(256)
  const rng = mulberry32(31)
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? '#b9ad94' : '#a79a80'
      g.fillRect(i * 128, j * 128, 128, 128)
    }
  for (let k = 0; k < 2600; k++) {
    g.fillStyle = `rgba(${rng() < 0.5 ? '70,60,45' : '235,228,210'},${0.15 + rng() * 0.3})`
    g.fillRect(rng() * 256, rng() * 256, 2, 2)
  }
  g.strokeStyle = 'rgba(60,50,40,0.35)'
  g.lineWidth = 2
  g.strokeRect(0, 0, 128, 128)
  g.strokeRect(128, 128, 128, 128)
  return finish(c, [1, 1])
}

/** Plastic magnet letters on the fridge door, one word per line. */
export function magnetTexture(lines: string[]) {
  const [c, g] = canvas(256, 256)
  const rng = mulberry32(lines.join('').length * 7 + 3)
  const colours = ['#e8302a', '#1f6fe0', '#f2c500', '#2fa84a', '#ff7a1a', '#8a3fd1']
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 40px "Arial Rounded MT Bold", Arial, sans-serif'
  lines.forEach((line, row) => {
    const step = Math.min(34, 230 / line.length)
    const x0 = 128 - ((line.length - 1) * step) / 2
    ;[...line].forEach((ch, i) => {
      if (ch === ' ') return
      g.save()
      g.translate(x0 + i * step, 50 + row * 56 + (rng() - 0.5) * 8)
      g.rotate((rng() - 0.5) * 0.35)
      g.fillStyle = 'rgba(0,0,0,0.25)'
      g.fillText(ch, 2, 3)
      g.fillStyle = colours[Math.floor(rng() * colours.length)]
      g.fillText(ch, 0, 0)
      g.restore()
    })
  })
  return finish(c)
}

/** A bristle dartboard: black and cream segments, red and green doubles and trebles, the number ring. */
export function dartboardTexture() {
  const [c, g] = canvas(512)
  const cx = 256
  const R = 250
  const order = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
  g.fillStyle = '#141414'
  g.fillRect(0, 0, 512, 512)
  const ring = (r0: number, r1: number, colour: (i: number) => string) => {
    for (let i = 0; i < 20; i++) {
      const a0 = -Math.PI / 2 + (i - 0.5) * (Math.PI / 10)
      const a1 = a0 + Math.PI / 10
      g.fillStyle = colour(i)
      g.beginPath()
      g.arc(cx, cx, r1, a0, a1)
      g.arc(cx, cx, r0, a1, a0, true)
      g.closePath()
      g.fill()
    }
  }
  const play = R * 0.76
  ring(0, play, (i) => (i % 2 ? '#efe2c0' : '#161616'))
  ring(play * 0.582, play * 0.629, (i) => (i % 2 ? '#2a8a3a' : '#c8211b'))
  ring(play * 0.953, play, (i) => (i % 2 ? '#2a8a3a' : '#c8211b'))
  g.fillStyle = '#2a8a3a'
  g.beginPath()
  g.arc(cx, cx, play * 0.094, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#c8211b'
  g.beginPath()
  g.arc(cx, cx, play * 0.037, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#e8e8e8'
  g.font = 'bold 30px Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  order.forEach((n, i) => {
    const a = -Math.PI / 2 + i * (Math.PI / 10)
    g.fillText(String(n), cx + Math.cos(a) * R * 0.88, cx + Math.sin(a) * R * 0.88)
  })
  return finish(c)
}

/** The drill yard behind the station, seen from the mess window: the drill tower, a hose drying from its top floor. Yard x -10..10, 0..16 m high. */
function drillTower() {
  const [c, g] = canvas(640, 512)
  const px = 640 / 20
  const X = (x: number) => (x + 10) * px
  const Y = (y: number) => (16 - y) * px
  const rng = mulberry32(41)
  // the yard's boundary wall, then the tower standing in front of it
  g.fillStyle = '#8f4a36'
  g.fillRect(0, Y(2.2), 640, Y(0) - Y(2.2))
  g.fillStyle = '#c7bfae'
  g.fillRect(0, Y(2.3), 640, Y(2.2) - Y(2.3))
  g.fillStyle = 'rgba(40,20,10,0.25)'
  for (let y = 0.1; y < 2.2; y += 0.25) g.fillRect(0, Y(y), 640, 1)
  // off to one side of the window, so the yard and the sky show too
  const t0 = 2.2
  const t1 = 6.4
  g.fillStyle = '#a8553b'
  g.fillRect(X(t0), Y(14.2), X(t1) - X(t0), Y(0) - Y(14.2))
  for (let k = 0; k < 500; k++) {
    g.fillStyle = `rgba(${rng() < 0.5 ? '70,30,20' : '200,120,90'},0.25)`
    g.fillRect(X(t0) + rng() * (X(t1) - X(t0)), Y(14) + rng() * (Y(0) - Y(14)), 6, 2)
  }
  // a parapet and the rail round the roof
  g.fillStyle = '#c7bfae'
  g.fillRect(X(t0) - 4, Y(14.4), X(t1) - X(t0) + 8, 8)
  g.strokeStyle = '#d8241c'
  g.lineWidth = 3
  g.strokeRect(X(t0) + 2, Y(15.3), X(t1) - X(t0) - 4, Y(14.4) - Y(15.3))
  // open window bays on every floor, a door at the bottom
  g.fillStyle = '#231a16'
  for (let f = 0; f < 5; f++) {
    const y = 2.3 + f * 2.6
    g.fillRect(X(t0 + 0.5), Y(y + 1.5), X(1.1) - X(0), Y(y) - Y(y + 1.5))
    g.fillRect(X(t1 - 1.6), Y(y + 1.5), X(1.1) - X(0), Y(y) - Y(y + 1.5))
  }
  g.fillRect(X((t0 + t1) / 2 - 0.6), Y(2.2), X(1.2) - X(0), Y(0) - Y(2.2))
  // a hose hung from the top window to dry
  g.fillStyle = '#efe6cf'
  g.fillRect(X(t1 - 1.2), Y(12.7), 5, Y(1.2) - Y(12.7))
  g.fillStyle = '#d4a94a'
  g.fillRect(X(t1 - 1.2) - 2, Y(1.2), 9, 10)
  // a red-and-white drill ladder pitched against it
  g.strokeStyle = '#e9e9e4'
  g.lineWidth = 3
  for (const dx of [0, 0.45]) {
    g.beginPath()
    g.moveTo(X(t0 - 2.2 + dx), Y(0))
    g.lineTo(X(t0 - 0.1 + dx), Y(8))
    g.stroke()
  }
  for (let k = 0.3; k < 8; k += 0.4) {
    const f = k / 8
    g.beginPath()
    g.moveTo(X(t0 - 2.2 + 2.1 * f), Y(k))
    g.lineTo(X(t0 - 1.75 + 2.1 * f), Y(k))
    g.stroke()
  }
  return layerTexture(c)
}

/** Concrete drill yard with painted bays, lying flat from the wall out to 14 m. */
function yardGround() {
  const [c, g] = canvas(512)
  const rng = mulberry32(43)
  g.fillStyle = '#8e8c87'
  g.fillRect(0, 0, 512, 512)
  for (let k = 0; k < 4000; k++) {
    g.fillStyle = `rgba(${rng() < 0.5 ? '60,60,60' : '200,200,195'},0.2)`
    g.fillRect(rng() * 512, rng() * 512, 2, 2)
  }
  g.strokeStyle = '#e8c21e'
  g.lineWidth = 5
  for (const x of [90, 250, 410]) {
    g.beginPath()
    g.moveTo(x, 180)
    g.lineTo(x, 512)
    g.stroke()
  }
  // a hydrant cover
  g.fillStyle = '#e8c21e'
  g.fillRect(320, 380, 30, 16)
  return layerTexture(c, true)
}

/** The view out of the mess window. */
export const drillYard = once((): OutsideLayer[] => [
  { map: daySky(), depth: 45, x: [-45, 45], y: [-7.1, 37.9] },
  { map: houses(), depth: 30, x: [-20, 20], y: [0, 13] },
  { map: drillTower(), depth: 14, x: [-10, 10], y: [0, 16] },
  { map: yardGround(), depth: 14, x: [-10, 10], y: [0, 0], flat: true },
])

/** A copy of a texture showing only the stretch from `x0` to `x1` of something laid out from `from` to `to` (in metres), so a door can carry its own slice of the livery. */
export function slice(t: Texture, x0: number, x1: number, from: number, to: number, tile?: number) {
  const c = t.clone()
  if (tile) {
    c.wrapS = c.wrapT = RepeatWrapping
    c.repeat.set((x1 - x0) / tile, 1)
    c.offset.set((x0 - from) / tile, 0)
  } else {
    c.repeat.set((x1 - x0) / (to - from), 1)
    c.offset.set((x0 - from) / (to - from), 0)
  }
  c.needsUpdate = true
  return c
}
