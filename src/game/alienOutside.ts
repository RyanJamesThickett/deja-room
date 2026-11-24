import { layerTexture, once, type LayerPlace, type OutsideLayer } from './outsideLayers'
import { mulberry32 } from './rng'

/*
 * The living room's view of somewhere that isn't here, in depth layers (see
 * outsideLayers.ts): the shader sky with its two moons far off, a ridge of
 * hills, purple ground, and strange plants right outside the glass. Street x
 * 0 is the middle of the window, +x to your right looking out.
 */

/**
 * The animated sky, 45 m out. The window's old picture fills `x` by `v`, so
 * the moons sit low enough to be seen over the hills from across the room,
 * and the sky carries on round it.
 */
export const ALIEN_SKY: LayerPlace = { depth: 45, x: [-8.4, 8.4], y: [-15, 45], v: [-3.6, 9.6] }

const HILLS = 35
/** One repeat of the hills and the ground, along the window. */
const SPAN = 40

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

/** The far-off ridge, the old picture's purple: street x -20..20 (repeating), 0..4 m high. */
function hills() {
  const [c, g] = canvas(1024, 128)
  const Y = (y: number) => (4 - y) * 32
  // whole numbers of waves per repeat, so the ends meet
  const height = (u: number) => 1.6 + 0.7 * Math.sin(u * 2 * Math.PI * 3) + 0.4 * Math.sin(u * 2 * Math.PI * 7 + 1) + 0.2 * Math.sin(u * 2 * Math.PI * 17 + 2)
  g.fillStyle = '#6f3f81'
  g.beginPath()
  g.moveTo(0, 128)
  for (let x = 0; x <= 1024; x += 4) g.lineTo(x, Y(height(x / 1024)))
  g.lineTo(1024, 128)
  g.fill()
  return layerTexture(c, true)
}

/** Purple ground from the wall out to the hills, with glowing pebbles. Near edge at the bottom. */
function ground() {
  const [c, g] = canvas(1024, 512)
  const rng = mulberry32(61)
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#5e3471')
  grad.addColorStop(1, '#3a1d4a')
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 512)
  for (let k = 0; k < 900; k++) {
    g.fillStyle = `rgba(20,4,30,${rng() * 0.25})`
    g.fillRect(rng() * 1024, rng() * 512, 3 + rng() * 6, 2 + rng() * 3)
  }
  for (let k = 0; k < 160; k++) {
    g.fillStyle = rng() < 0.5 ? '#3dfcff' : '#ff4fd8'
    g.beginPath()
    g.arc(rng() * 1024, 40 + rng() * 472, 1 + rng() * 1.5, 0, Math.PI * 2)
    g.fill()
  }
  return layerTexture(c, true)
}

/** Plants right outside, 3 m out: dark stalks with glowing bulbs. Street x -8..8, 0..5 m high. */
function plants() {
  const [c, g] = canvas(1024, 320)
  const rng = mulberry32(62)
  const X = (x: number) => (x + 8) * 64
  const Y = (y: number) => (5 - y) * 64
  const bulb = (x: number, y: number, r: number, colour: string, glow: string) => {
    const halo = g.createRadialGradient(x, y, 0, x, y, r * 3.5)
    halo.addColorStop(0, glow)
    halo.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = halo
    g.fillRect(x - r * 3.5, y - r * 3.5, r * 7, r * 7)
    g.fillStyle = colour
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  const stalk = (x: number, high: number, lean: number, colour: string, glow: string) => {
    g.strokeStyle = '#2a1236'
    g.lineWidth = 6
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(X(x), Y(0))
    g.quadraticCurveTo(X(x), Y(high * 0.6), X(x + lean), Y(high))
    g.stroke()
    bulb(X(x + lean), Y(high), 11, colour, glow)
  }
  const PINK = ['#ff9be8', 'rgba(255,79,216,0.55)'] as const
  const CYAN = ['#b5feff', 'rgba(61,252,255,0.5)'] as const
  // a tall clump just left of the window, a low one to the right, more off to the sides
  stalk(-1.1, 2.3, 0.25, ...PINK)
  stalk(-1.3, 1.6, -0.2, ...CYAN)
  stalk(-0.9, 1.2, 0.15, ...PINK)
  stalk(1.2, 1.1, -0.1, ...CYAN)
  stalk(1.45, 0.8, 0.15, ...CYAN)
  stalk(-4.2, 2.8, 0.3, ...CYAN)
  stalk(4.4, 2.2, -0.3, ...PINK)
  stalk(5.1, 1.4, 0.1, ...CYAN)
  // tufts along the ground
  g.strokeStyle = '#2a1236'
  g.lineWidth = 2
  for (let k = 0; k < 90; k++) {
    const x = 16 + rng() * 992
    const h = (0.15 + rng() * 0.3) * 64
    g.beginPath()
    g.moveTo(x, Y(0))
    g.lineTo(x + (rng() - 0.5) * 10, Y(0) - h)
    g.stroke()
  }
  return layerTexture(c)
}

/** Everything but the shader sky, which AlienSky draws itself. */
export const alienLayers = once((): OutsideLayer[] => [
  { map: ground(), depth: HILLS, x: [-SPAN / 2, SPAN / 2], y: [0, 0], flat: true },
  { map: hills(), depth: HILLS, x: [-SPAN / 2, SPAN / 2], y: [0, 4] },
  { map: plants(), depth: 3, x: [-8, 8], y: [0, 5] },
])
