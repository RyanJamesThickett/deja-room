import { RepeatWrapping } from 'three'
import { mulberry32 } from '../../rng'
import { canvas, ellipse, finish, poly, type G } from './textures'

/*
 * Canvas textures for the natural history gallery: the stone floor, the
 * information boards, the fossil fish slab and the rock of the meteorite.
 */

/** Big pale limestone flags, two by two per tile, with darker grout. */
export function floorTexture(repeatX: number, repeatY: number) {
  const [c, g] = canvas(512)
  const rng = mulberry32(14)
  const tones = ['#b9b2a4', '#c4bdaf', '#b1aa9b', '#bfb7a6']
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      g.fillStyle = tones[i * 2 + j]
      g.fillRect(i * 256, j * 256, 256, 256)
      for (let k = 0; k < 220; k++) {
        g.fillStyle = `rgba(${rng() < 0.5 ? '90,80,64' : '240,234,220'},${rng() * 0.12})`
        g.fillRect(i * 256 + rng() * 256, j * 256 + rng() * 256, 2 + rng() * 6, 2 + rng() * 6)
      }
    }
  g.fillStyle = '#7d7568'
  g.fillRect(0, 0, 512, 3)
  g.fillRect(0, 255, 512, 3)
  g.fillRect(0, 0, 3, 512)
  g.fillRect(255, 0, 3, 512)
  const t = finish(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(repeatX, repeatY)
  return t
}

/** A tyrannosaur in silhouette, facing right, standing on (x, y) and `h` tall. */
function rex(g: G, x: number, y: number, h: number, colour: string) {
  const pts: [number, number][] = [
    [-1.15, 0.62],
    [-0.6, 0.78],
    [-0.2, 0.88],
    [0.2, 0.86],
    [0.45, 0.82],
    [0.6, 0.88],
    [0.74, 0.99],
    [1.02, 0.95],
    [1.1, 0.87],
    [1.0, 0.82],
    [0.78, 0.8],
    [0.64, 0.72],
    [0.54, 0.6],
    [0.62, 0.54],
    [0.64, 0.5],
    [0.52, 0.52],
    [0.32, 0.5],
    [0.2, 0.46],
    [0.26, 0.28],
    [0.14, 0.1],
    [0.34, 0.0],
    [0.02, 0.0],
    [0.02, 0.12],
    [-0.06, 0.32],
    [-0.14, 0.42],
    [-0.2, 0.22],
    [-0.34, 0.06],
    [-0.22, 0.0],
    [-0.48, 0.0],
    [-0.44, 0.1],
    [-0.34, 0.3],
    [-0.36, 0.52],
    [-0.6, 0.6],
  ]
  poly(
    g,
    colour,
    pts.map(([px, py]) => [x + px * h, y - py * h]),
  )
  ellipse(g, x + 0.86 * h, y - 0.92 * h, 0.018 * h, 0.018 * h, '#1d3433')
}

/** A person in silhouette standing on (x, y), `h` tall. */
function person(g: G, x: number, y: number, h: number, colour: string) {
  g.fillStyle = colour
  ellipse(g, x, y - h * 0.92, h * 0.07, h * 0.08, colour)
  g.beginPath()
  g.roundRect(x - h * 0.11, y - h * 0.82, h * 0.22, h * 0.4, h * 0.06)
  g.fill()
  g.fillRect(x - h * 0.1, y - h * 0.45, h * 0.08, h * 0.45)
  g.fillRect(x + h * 0.02, y - h * 0.45, h * 0.08, h * 0.45)
  g.fillRect(x - h * 0.15, y - h * 0.8, h * 0.05, h * 0.36)
  g.fillRect(x + h * 0.1, y - h * 0.8, h * 0.05, h * 0.36)
}

export type BoardMode = 'normal' | 'swapped' | 'sighted'

const BOARD_BG = '#1d3433'
const BOARD_INK = '#efe6cf'

/**
 * The big panel facing the skeleton: name, dates and a to-scale comparison
 * with a person. `swapped` gets the sizes the wrong way round; `sighted` has
 * had its dates corrected in red marker.
 */
export function boardTexture(mode: BoardMode) {
  const W = 1024
  const H = 640
  const [c, g] = canvas(W, H)
  g.fillStyle = BOARD_BG
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#c9a54a'
  g.fillRect(40, 132, 944, 4)
  g.fillStyle = BOARD_INK
  g.textBaseline = 'alphabetic'
  // as big as fits across the board (it was clipping the X)
  let size = 84
  do g.font = `bold ${size--}px Georgia, serif`
  while (g.measureText('TYRANNOSAURUS REX').width > W - 80 && size > 40)
  g.fillText('TYRANNOSAURUS REX', 40, 110)
  g.font = 'italic 38px Georgia, serif'
  g.fillText('Late Cretaceous, North America', 40, 190)
  g.font = '38px Georgia, serif'
  g.fillText('Extinct 66 million years ago', 40, 240)
  // the comparison, on a ground line
  g.fillStyle = '#c9a54a'
  g.fillRect(60, 590, 904, 3)
  g.font = '28px Georgia, serif'
  g.fillStyle = BOARD_INK
  g.fillText('How big?', 60, 300)
  if (mode === 'swapped') {
    person(g, 600, 588, 300, BOARD_INK)
    rex(g, 820, 588, 60, '#c9a54a')
  } else {
    rex(g, 560, 588, 270, '#c9a54a')
    person(g, 860, 588, 120, BOARD_INK)
  }
  if (mode === 'sighted') {
    g.strokeStyle = '#d8231c'
    g.lineWidth = 9
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(32, 228)
    g.lineTo(540, 222)
    g.stroke()
    g.save()
    g.translate(560, 236)
    g.rotate(-0.08)
    g.fillStyle = '#d8231c'
    g.font = 'bold 54px "Comic Sans MS", "Segoe Print", cursive'
    g.fillText('SEEN THIS MORNING!', 0, 0)
    g.restore()
  }
  return finish(c)
}

/** A smaller information panel: a heading, a few lines, and a sketch drawn by `draw`. */
export function panelTexture(title: string, lines: string[], draw?: (g: G) => void) {
  const W = 512
  const H = 640
  const [c, g] = canvas(W, H)
  g.fillStyle = BOARD_BG
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#c9a54a'
  g.fillRect(30, 86, 452, 3)
  g.fillStyle = BOARD_INK
  g.font = 'bold 48px Georgia, serif'
  g.fillText(title, 30, 70)
  g.font = '26px Georgia, serif'
  lines.forEach((l, i) => g.fillText(l, 30, 136 + i * 38))
  if (draw) {
    g.save()
    g.translate(256, 470)
    draw(g)
    g.restore()
  }
  return finish(c)
}

/** Sketches for the small panels, centred on the origin. */
export const SKETCH = {
  ammonite: (g: G) => {
    g.strokeStyle = '#c9a54a'
    g.lineWidth = 6
    g.beginPath()
    for (let a = 0; a < Math.PI * 7; a += 0.05) {
      const r = 6 * Math.exp(a * 0.15)
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      if (a === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  },
  mammoth: (g: G) => {
    const col = '#c9a54a'
    ellipse(g, 0, -10, 110, 70, col)
    ellipse(g, 100, -40, 50, 50, col)
    for (const x of [-80, -40, 30, 70]) g.fillRect(x - 14, 30, 28, 80)
    g.fillRect(126, -30, 20, 110)
    g.strokeStyle = '#efe6cf'
    g.lineWidth = 9
    g.beginPath()
    g.moveTo(120, -10)
    g.quadraticCurveTo(190, 40, 160, -40)
    g.stroke()
  },
  meteor: (g: G) => {
    const grad = g.createLinearGradient(-160, -120, 60, 60)
    grad.addColorStop(0, 'rgba(201,165,74,0)')
    grad.addColorStop(1, 'rgba(201,165,74,0.9)')
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(-170, -130)
    g.lineTo(40, 30)
    g.lineTo(70, 0)
    g.fill()
    ellipse(g, 60, 20, 34, 30, '#c9a54a')
  },
  egg: (g: G) => {
    for (const [x, y] of [
      [-60, 0],
      [0, -14],
      [60, 0],
      [-30, 40],
      [30, 40],
    ])
      ellipse(g, x, y, 30, 40, '#c9a54a')
  },
  owl: (g: G) => {
    ellipse(g, 0, 20, 70, 100, '#c9a54a')
    ellipse(g, 0, -80, 60, 52, '#c9a54a')
    ellipse(g, -24, -82, 18, 18, BOARD_BG)
    ellipse(g, 24, -82, 18, 18, BOARD_BG)
    poly(g, '#c9a54a', [[-50, -120], [-40, -160], [-24, -126]])
    poly(g, '#c9a54a', [[50, -120], [40, -160], [24, -126]])
  },
}

/** Vinyl lettering for the dark gallery walls: pale, on transparency. */
export function vinylTexture(title: string, subtitle: string) {
  const [c, g] = canvas(1024, 320)
  g.fillStyle = '#ece4d0'
  g.font = '120px Georgia, serif'
  g.fillText(title, 20, 140)
  g.font = 'italic 50px Georgia, serif'
  g.fillStyle = '#cfc5ae'
  g.fillText(subtitle, 24, 240)
  return finish(c)
}

/** A herring-like fossil fish in brown on transparency, head to the right. */
function fossilFish(g: G, x: number, y: number, len: number) {
  g.save()
  g.translate(x, y)
  const h = len * 0.32
  // body outline, a little darker than the stone
  g.fillStyle = 'rgba(120,80,40,0.55)'
  g.beginPath()
  g.moveTo(-len / 2, 0)
  g.bezierCurveTo(-len * 0.2, -h, len * 0.3, -h, len / 2, 0)
  g.bezierCurveTo(len * 0.3, h * 0.9, -len * 0.2, h * 0.9, -len / 2, 0)
  g.fill()
  // tail fin
  poly(g, 'rgba(100,60,30,0.7)', [[-len / 2 + 4, 0], [-len * 0.68, -h * 0.75], [-len * 0.62, 0], [-len * 0.68, h * 0.75]])
  // skull
  ellipse(g, len * 0.36, 0, len * 0.14, h * 0.52, 'rgba(80,45,20,0.75)')
  ellipse(g, len * 0.4, -h * 0.12, len * 0.03, len * 0.03, 'rgba(240,220,180,0.7)')
  // spine and ribs
  g.strokeStyle = 'rgba(70,40,15,0.9)'
  g.lineWidth = len * 0.012
  g.beginPath()
  g.moveTo(-len / 2, 0)
  g.lineTo(len * 0.24, -h * 0.05)
  g.stroke()
  g.lineWidth = len * 0.006
  for (let i = 0; i < 18; i++) {
    const px = -len * 0.4 + i * len * 0.036
    const reach = h * 0.75 * Math.sin(((i + 2) / 21) * Math.PI)
    g.beginPath()
    g.moveTo(px, 0)
    g.lineTo(px - len * 0.03, -reach)
    g.moveTo(px, 0)
    g.lineTo(px - len * 0.03, reach * 0.9)
    g.stroke()
  }
  // dorsal and pelvic fins
  poly(g, 'rgba(100,60,30,0.6)', [[-len * 0.02, -h * 0.75], [-len * 0.16, -h * 1.1], [-len * 0.18, -h * 0.68]])
  poly(g, 'rgba(100,60,30,0.6)', [[len * 0.02, h * 0.68], [-len * 0.08, h * 1.0], [-len * 0.12, h * 0.62]])
  g.restore()
}

export type SlabMode = 'normal' | 'empty'

/**
 * A split slab of pale limestone with a fossil fish in it. `empty` is the
 * same slab with just the fish's hollow left in the stone.
 */
export function slabTexture(mode: SlabMode) {
  const W = 512
  const H = 352
  const [c, g] = canvas(W, H)
  const rng = mulberry32(42)
  g.fillStyle = '#d8c9a4'
  g.fillRect(0, 0, W, H)
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${rng() < 0.5 ? '150,120,80' : '250,240,215'},${rng() * 0.18})`
    g.fillRect(rng() * W, rng() * H, 2 + rng() * 10, 1 + rng() * 4)
  }
  // bedding lines in the stone
  g.strokeStyle = 'rgba(140,110,70,0.25)'
  g.lineWidth = 2
  for (let y = 30; y < H; y += 40 + rng() * 30) {
    g.beginPath()
    g.moveTo(0, y)
    g.bezierCurveTo(W * 0.3, y + 10, W * 0.6, y - 10, W, y + 4)
    g.stroke()
  }
  if (mode === 'empty') {
    // the hollow where the fish was: a smooth, slightly shadowed dent
    g.save()
    g.translate(256, 176)
    g.fillStyle = 'rgba(120,95,60,0.35)'
    g.beginPath()
    g.moveTo(-170, 0)
    g.bezierCurveTo(-70, -118, 100, -118, 170, 0)
    g.bezierCurveTo(100, 104, -70, 104, -170, 0)
    g.fill()
    poly(g, 'rgba(120,95,60,0.35)', [[-166, 0], [-230, -82], [-210, 0], [-230, 82]])
    g.strokeStyle = 'rgba(255,248,230,0.5)'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(-170, 2)
    g.bezierCurveTo(-70, 100, 100, 100, 170, 2)
    g.stroke()
    g.restore()
  } else fossilFish(g, 256, 176, 340)
  return finish(c)
}

/** The fish alone, for the one that has come out of the stone and is swimming. */
export function fishTexture() {
  const [c, g] = canvas(512, 256)
  // a little of the stone still stuck to it
  g.fillStyle = 'rgba(216,201,164,0.95)'
  g.save()
  g.translate(256, 128)
  g.beginPath()
  g.moveTo(-180, 0)
  g.bezierCurveTo(-70, -124, 104, -124, 178, 0)
  g.bezierCurveTo(104, 112, -70, 112, -180, 0)
  g.fill()
  poly(g, 'rgba(216,201,164,0.95)', [[-170, 0], [-240, -90], [-216, 0], [-240, 90]])
  g.restore()
  fossilFish(g, 256, 128, 340)
  return finish(c)
}

/** A slab crowded with trilobites, for the wall case. */
export function trilobiteTexture() {
  const W = 512
  const H = 320
  const [c, g] = canvas(W, H)
  const rng = mulberry32(77)
  g.fillStyle = '#4a4540'
  g.fillRect(0, 0, W, H)
  for (let i = 0; i < 600; i++) {
    g.fillStyle = `rgba(${rng() < 0.5 ? '20,18,16' : '120,112,100'},${rng() * 0.25})`
    g.fillRect(rng() * W, rng() * H, 2 + rng() * 6, 1 + rng() * 4)
  }
  for (let i = 0; i < 9; i++) {
    const x = 50 + (i % 3) * 160 + rng() * 40
    const y = 60 + Math.floor(i / 3) * 95 + rng() * 20
    g.save()
    g.translate(x, y)
    g.rotate((rng() - 0.5) * 1.6)
    ellipse(g, 0, 0, 26, 40, '#2a2420')
    ellipse(g, 0, -28, 24, 14, '#352c26')
    g.strokeStyle = '#6a5c4e'
    g.lineWidth = 2
    for (let k = -18; k < 36; k += 7) {
      g.beginPath()
      g.moveTo(-22, k)
      g.lineTo(22, k)
      g.stroke()
    }
    g.fillStyle = '#5a4c40'
    g.fillRect(-5, -36, 10, 72)
    g.restore()
  }
  return finish(c)
}

/** Dark, fused rock with thumb-print hollows, for the meteorite. */
export function meteoriteTexture() {
  const [c, g] = canvas(512, 256)
  const rng = mulberry32(5)
  g.fillStyle = '#2b2622'
  g.fillRect(0, 0, 512, 256)
  for (let i = 0; i < 140; i++) {
    const x = rng() * 512
    const y = rng() * 256
    const r = 6 + rng() * 22
    const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r)
    grad.addColorStop(0, 'rgba(10,8,6,0.55)')
    grad.addColorStop(0.8, 'rgba(60,52,44,0.25)')
    grad.addColorStop(1, 'rgba(90,80,70,0)')
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  // flecks of iron catching the light
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(190,180,165,${rng() * 0.5})`
    g.fillRect(rng() * 512, rng() * 256, 1 + rng() * 2, 1 + rng() * 2)
  }
  return finish(c)
}

/** Bright cracks on black, for the meteorite lit up from inside. */
export function veinTexture() {
  const [c, g] = canvas(512, 256)
  const rng = mulberry32(8)
  g.fillStyle = '#000'
  g.fillRect(0, 0, 512, 256)
  g.strokeStyle = '#ffffff'
  g.lineCap = 'round'
  for (let i = 0; i < 26; i++) {
    let x = rng() * 512
    let y = rng() * 256
    g.lineWidth = 1.5 + rng() * 3.5
    g.beginPath()
    g.moveTo(x, y)
    for (let k = 0; k < 6; k++) {
      x += (rng() - 0.5) * 70
      y += (rng() - 0.5) * 40
      g.lineTo(x, y)
    }
    g.stroke()
  }
  // a soft inner glow under the cracks
  g.fillStyle = 'rgba(255,255,255,0.12)'
  g.fillRect(0, 0, 512, 256)
  return finish(c)
}
