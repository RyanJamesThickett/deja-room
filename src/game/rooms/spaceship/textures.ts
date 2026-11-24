import { useMemo } from 'react'
import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three'
import { mulberry32 } from '../../rng'

/*
 * Sci-fi surfaces drawn on a canvas at load time, so the spaceship needs no
 * image downloads: riveted wall panels, floor grating and a poster.
 */

function texture(canvas: HTMLCanvasElement, repeatX: number, repeatY: number) {
  const t = new CanvasTexture(canvas)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(repeatX, repeatY)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

function canvas(size = 512) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')!] as const
}

/** Riveted metal panels: one 512px tile holds `cells` × `cells` panels. */
export function usePanelTexture(base: string, repeatX: number, repeatY: number, cells = 2) {
  return useMemo(() => {
    const [c, g] = canvas()
    const rng = mulberry32(cells * 31 + base.length)
    g.fillStyle = base
    g.fillRect(0, 0, 512, 512)
    // grime and scuffs
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = `rgba(0,0,0,${rng() * 0.06})`
      g.fillRect(rng() * 512, rng() * 512, 1 + rng() * 3, 1 + rng() * 3)
    }
    const step = 512 / cells
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const x = i * step
        const y = j * step
        // each panel slightly lighter or darker
        g.fillStyle = `rgba(255,255,255,${rng() * 0.06})`
        g.fillRect(x + 4, y + 4, step - 8, step - 8)
        // seams
        g.strokeStyle = 'rgba(0,0,0,0.55)'
        g.lineWidth = 4
        g.strokeRect(x + 2, y + 2, step - 4, step - 4)
        g.strokeStyle = 'rgba(255,255,255,0.18)'
        g.lineWidth = 1
        g.strokeRect(x + 5, y + 5, step - 10, step - 10)
        // rivets
        for (const [rx, ry] of [
          [14, 14],
          [step - 14, 14],
          [14, step - 14],
          [step - 14, step - 14],
        ]) {
          g.fillStyle = 'rgba(0,0,0,0.45)'
          g.beginPath()
          g.arc(x + rx + 1, y + ry + 1, 4, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = 'rgba(255,255,255,0.35)'
          g.beginPath()
          g.arc(x + rx, y + ry, 3, 0, Math.PI * 2)
          g.fill()
        }
      }
    }
    return texture(c, repeatX, repeatY)
  }, [base, repeatX, repeatY, cells])
}

/** Dark floor grating with a yellow-black hazard edge every few tiles. */
export function useGratingTexture(repeatX: number, repeatY: number) {
  return useMemo(() => {
    const [c, g] = canvas()
    g.fillStyle = '#2a2e35'
    g.fillRect(0, 0, 512, 512)
    for (let x = 0; x < 512; x += 32) {
      for (let y = 0; y < 512; y += 32) {
        g.fillStyle = '#0c0e12'
        g.fillRect(x + 6, y + 6, 20, 20)
        g.fillStyle = 'rgba(255,255,255,0.08)'
        g.fillRect(x + 2, y + 2, 28, 2)
      }
    }
    g.strokeStyle = 'rgba(0,0,0,0.7)'
    g.lineWidth = 6
    g.strokeRect(0, 0, 512, 512)
    return texture(c, repeatX, repeatY)
  }, [repeatX, repeatY])
}

/** A crew-quarters poster: the space one, or a warning about the tank. */
export function usePosterTexture(design: 'space' | 'tank' = 'space') {
  return useMemo(() => {
    if (design === 'tank') return tankPoster()
    const [c, g] = canvas(512)
    const t = texture(c, 1, 1)
    t.wrapS = t.wrapT = ClampToEdgeWrapping
    g.fillStyle = '#ffde21'
    g.fillRect(0, 0, 512, 512)
    // halftone dots
    g.fillStyle = 'rgba(255,49,49,0.35)'
    for (let x = 0; x < 512; x += 14) for (let y = 0; y < 512; y += 14) {
      g.beginPath()
      g.arc(x + ((y / 14) % 2) * 7, y, 3, 0, Math.PI * 2)
      g.fill()
    }
    // planet with a ring
    g.fillStyle = '#1f6bff'
    g.beginPath()
    g.arc(256, 250, 120, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#111'
    g.lineWidth = 10
    g.stroke()
    g.save()
    g.translate(256, 250)
    g.rotate(-0.35)
    g.scale(1, 0.3)
    g.beginPath()
    g.arc(0, 0, 190, 0, Math.PI * 2)
    g.lineWidth = 26
    g.strokeStyle = '#ff3fa4'
    g.stroke()
    g.restore()
    g.fillStyle = '#111'
    g.textAlign = 'center'
    g.font = 'bold 54px Impact, sans-serif'
    g.fillText('BE NICE TO', 256, 440)
    g.fillText('THE SHIP', 256, 492)
    g.font = 'bold 40px Impact, sans-serif'
    g.fillText('SPACE IS BIG!', 256, 70)
    t.needsUpdate = true
    return t
  }, [design])
}

/** Yellow and black diagonal hazard stripes. */
export function useHazardTexture(repeatX: number, repeatY: number) {
  return useMemo(() => {
    const [c, g] = canvas(128)
    g.fillStyle = '#ffcc1a'
    g.fillRect(0, 0, 128, 128)
    g.fillStyle = '#16181c'
    for (let i = -128; i < 256; i += 64) {
      g.beginPath()
      g.moveTo(i, 0)
      g.lineTo(i + 32, 0)
      g.lineTo(i + 32 + 128, 128)
      g.lineTo(i + 128, 128)
      g.fill()
    }
    // worn by boots
    const rng = mulberry32(5)
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(80,80,80,${rng() * 0.25})`
      g.fillRect(rng() * 128, rng() * 128, 1 + rng() * 3, 1 + rng() * 2)
    }
    return texture(c, repeatX, repeatY)
  }, [repeatX, repeatY])
}

function clamped(c: HTMLCanvasElement) {
  const t = texture(c, 1, 1)
  t.wrapS = t.wrapT = ClampToEdgeWrapping
  return t
}

/**
 * The deck sign in the corridor. Seen from the corridor, the engine room is
 * to the left; when `lost`, both arrows point back to the bridge.
 */
export function useDeckSignTexture(lost: boolean) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 256
    const g = c.getContext('2d')!
    g.fillStyle = '#1d4fb8'
    g.fillRect(0, 0, 512, 256)
    g.strokeStyle = '#f2f4f7'
    g.lineWidth = 8
    g.strokeRect(10, 10, 492, 236)
    g.fillRect(20, 126, 472, 4)
    g.fillStyle = '#f2f4f7'
    g.font = 'bold 50px Impact, sans-serif'
    g.textBaseline = 'middle'
    const arrow = (x: number, y: number, left: boolean) => {
      const d = left ? -1 : 1
      g.beginPath()
      g.moveTo(x + d * 34, y)
      g.lineTo(x - d * 10, y - 30)
      g.lineTo(x - d * 10, y - 12)
      g.lineTo(x - d * 40, y - 12)
      g.lineTo(x - d * 40, y + 12)
      g.lineTo(x - d * 10, y + 12)
      g.lineTo(x - d * 10, y + 30)
      g.fill()
    }
    g.textAlign = 'left'
    g.fillText('ENGINEERING', 120, 70)
    if (lost) arrow(445, 70, false)
    else arrow(66, 70, true)
    g.fillText('BRIDGE', 66, 190)
    arrow(445, 190, false)
    const t = clamped(c)
    t.needsUpdate = true
    return t
  }, [lost])
}

/** A pressure gauge's dial: ticks round the bottom three quarters, red at the top end. */
export function useGaugeTexture() {
  return useMemo(() => {
    const [c, g] = canvas(256)
    g.fillStyle = '#f4f1e6'
    g.beginPath()
    g.arc(128, 128, 124, 0, Math.PI * 2)
    g.fill()
    const from = Math.PI * 0.75
    const to = Math.PI * 2.25
    g.strokeStyle = '#e0261b'
    g.lineWidth = 22
    g.beginPath()
    g.arc(128, 128, 92, to - 0.9, to)
    g.stroke()
    g.strokeStyle = '#111'
    for (let i = 0; i <= 20; i++) {
      const a = from + ((to - from) * i) / 20
      const long = i % 5 === 0
      g.lineWidth = long ? 5 : 2
      g.beginPath()
      g.moveTo(128 + Math.cos(a) * (long ? 78 : 88), 128 + Math.sin(a) * (long ? 78 : 88))
      g.lineTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104)
      g.stroke()
    }
    g.fillStyle = '#111'
    g.font = 'bold 26px sans-serif'
    g.textAlign = 'center'
    g.fillText('PSI', 128, 190)
    const t = clamped(c)
    t.needsUpdate = true
    return t
  }, [])
}

/** The engine monitor: a reactor output trace, or the ship smiling at you. */
export function useMonitorTexture(kind: 'trace' | 'smile') {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 384
    c.height = 256
    const g = c.getContext('2d')!
    g.fillStyle = '#04140c'
    g.fillRect(0, 0, 384, 256)
    g.strokeStyle = 'rgba(80,255,150,0.15)'
    g.lineWidth = 1
    for (let x = 0; x < 384; x += 32) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, 256)
      g.stroke()
    }
    for (let y = 0; y < 256; y += 32) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(384, y)
      g.stroke()
    }
    g.strokeStyle = '#5dff9a'
    g.fillStyle = '#5dff9a'
    g.lineWidth = 6
    g.lineCap = 'round'
    if (kind === 'trace') {
      g.beginPath()
      for (let x = 20; x <= 364; x += 4) {
        const y = 140 - Math.sin(x * 0.05) * 40 - Math.sin(x * 0.17) * 12
        if (x === 20) g.moveTo(x, y)
        else g.lineTo(x, y)
      }
      g.stroke()
      g.font = 'bold 26px monospace'
      g.fillText('CORE OUTPUT 98%', 24, 40)
    } else {
      g.lineWidth = 12
      g.beginPath()
      g.arc(192, 128, 100, 0, Math.PI * 2)
      g.stroke()
      g.beginPath()
      g.arc(192, 138, 58, 0.2, Math.PI - 0.2)
      g.stroke()
      for (const x of [155, 229]) {
        g.beginPath()
        g.arc(x, 100, 13, 0, Math.PI * 2)
        g.fill()
      }
    }
    const t = clamped(c)
    t.needsUpdate = true
    return t
  }, [kind])
}

/** Pegboard: a grey board full of holes. */
export function usePegboardTexture(repeatX: number, repeatY: number) {
  return useMemo(() => {
    const [c, g] = canvas(64)
    g.fillStyle = '#7b7f78'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = '#2a2c2a'
    for (const [x, y] of [
      [16, 16],
      [48, 16],
      [16, 48],
      [48, 48],
    ]) {
      g.beginPath()
      g.arc(x, y, 4, 0, Math.PI * 2)
      g.fill()
    }
    return texture(c, repeatX, repeatY)
  }, [repeatX, repeatY])
}

function tankPoster() {
  const [c, g] = canvas(512)
  const t = texture(c, 1, 1)
  t.wrapS = t.wrapT = ClampToEdgeWrapping
  g.fillStyle = '#2fbf71'
  g.fillRect(0, 0, 512, 512)
  g.fillStyle = 'rgba(17,17,17,0.18)'
  for (let x = 0; x < 512; x += 14) for (let y = 0; y < 512; y += 14) {
    g.beginPath()
    g.arc(x + ((y / 14) % 2) * 7, y, 3, 0, Math.PI * 2)
    g.fill()
  }
  // the blob, with three eyes
  g.fillStyle = '#ff5a5f'
  g.strokeStyle = '#111'
  g.lineWidth = 10
  g.beginPath()
  g.ellipse(256, 260, 130, 115, 0, 0, Math.PI * 2)
  g.fill()
  g.stroke()
  for (const [x, y] of [
    [206, 230],
    [306, 230],
    [256, 190],
  ]) {
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(x, y, 26, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    g.fillStyle = '#111'
    g.beginPath()
    g.arc(x + 6, y + 4, 10, 0, Math.PI * 2)
    g.fill()
  }
  // a big red "no" slash
  g.strokeStyle = '#ff3131'
  g.lineWidth = 28
  g.beginPath()
  g.arc(256, 260, 175, 0, Math.PI * 2)
  g.stroke()
  g.beginPath()
  g.moveTo(132, 136)
  g.lineTo(380, 384)
  g.stroke()
  g.fillStyle = '#111'
  g.textAlign = 'center'
  g.font = 'bold 50px Impact, sans-serif'
  g.fillText('DO NOT FEED', 256, 470)
  g.font = 'bold 36px Impact, sans-serif'
  g.fillText('THE THING IN THE TANK', 256, 60)
  t.needsUpdate = true
  return t
}

/** The white plate on the emergency oxygen locker. */
export function useEmergencyLabelTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 384
    c.height = 256
    const g = c.getContext('2d')!
    g.fillStyle = '#f4f4f0'
    g.fillRect(0, 0, 384, 256)
    g.fillStyle = '#c8261d'
    g.fillRect(0, 0, 384, 70)
    g.fillStyle = '#fff'
    g.font = 'bold 50px Impact, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('EMERGENCY', 192, 38)
    g.fillStyle = '#16181c'
    g.font = 'bold 96px Impact, sans-serif'
    g.fillText('O₂', 120, 150)
    g.font = 'bold 30px Arial, sans-serif'
    g.textAlign = 'left'
    g.fillText('MASKS', 200, 128)
    g.fillText('× 4', 200, 168)
    g.font = '22px Arial, sans-serif'
    g.textAlign = 'center'
    g.fillText('PULL HANDLE TO OPEN', 192, 226)
    const t = clamped(c)
    t.needsUpdate = true
    return t
  }, [])
}

/** A humpback whale side on, swimming right, on a clear background: something is drifting past the ship. */
export function useWhaleTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 448
    const g = c.getContext('2d')!
    const body = new Path2D()
    body.moveTo(990, 222)
    body.bezierCurveTo(975, 170, 900, 140, 800, 132)
    body.bezierCurveTo(640, 118, 470, 130, 330, 172)
    body.bezierCurveTo(250, 196, 190, 208, 128, 214)
    // flukes
    body.bezierCurveTo(100, 180, 70, 140, 22, 118)
    body.bezierCurveTo(40, 170, 60, 205, 92, 224)
    body.bezierCurveTo(60, 245, 40, 280, 22, 330)
    body.bezierCurveTo(70, 306, 100, 266, 128, 234)
    body.bezierCurveTo(200, 244, 300, 282, 440, 312)
    body.bezierCurveTo(600, 340, 790, 330, 900, 290)
    body.bezierCurveTo(955, 270, 985, 250, 990, 222)
    body.closePath()
    const fin = new Path2D()
    fin.moveTo(720, 300)
    fin.bezierCurveTo(660, 350, 590, 400, 500, 430)
    fin.bezierCurveTo(560, 380, 620, 330, 650, 300)
    fin.closePath()

    // a faint glow so it reads against black space
    g.save()
    g.shadowColor = 'rgba(120,170,255,0.55)'
    g.shadowBlur = 30
    g.fillStyle = '#2b3b57'
    g.fill(body)
    g.restore()
    const skin = g.createLinearGradient(0, 120, 0, 340)
    skin.addColorStop(0, '#22304a')
    skin.addColorStop(0.55, '#3d5274')
    skin.addColorStop(1, '#8fa3bf')
    g.fillStyle = skin
    g.fill(body)
    g.fillStyle = '#556a8c'
    g.fill(fin)
    g.strokeStyle = 'rgba(150,190,255,0.6)'
    g.lineWidth = 3
    g.stroke(fin)
    // throat grooves
    g.save()
    g.clip(body)
    g.strokeStyle = 'rgba(20,30,45,0.45)'
    g.lineWidth = 3
    for (let i = 0; i < 7; i++) {
      g.beginPath()
      g.moveTo(960 - i * 4, 248 + i * 7)
      g.bezierCurveTo(850, 290 + i * 6, 720, 312 + i * 4, 600, 318 + i * 3)
      g.stroke()
    }
    // sunlit back
    const rim = g.createLinearGradient(0, 120, 0, 175)
    rim.addColorStop(0, 'rgba(200,225,255,0.55)')
    rim.addColorStop(1, 'rgba(200,225,255,0)')
    g.fillStyle = rim
    g.fillRect(0, 100, 1024, 80)
    g.restore()
    g.strokeStyle = 'rgba(170,205,255,0.7)'
    g.lineWidth = 3
    g.stroke(body)
    // the eye, and glowing spots along the flank
    g.fillStyle = '#0a0d14'
    g.beginPath()
    g.ellipse(870, 238, 11, 8, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#dff6ff'
    g.beginPath()
    g.arc(873, 235, 3, 0, Math.PI * 2)
    g.fill()
    const rng = mulberry32(42)
    for (let i = 0; i < 26; i++) {
      const x = 250 + rng() * 600
      const y = 205 + (x > 600 ? 10 : 0) + (rng() - 0.5) * 40
      const r = 2 + rng() * 3
      const glow = g.createRadialGradient(x, y, 0, x, y, r * 4)
      glow.addColorStop(0, 'rgba(160,255,250,0.95)')
      glow.addColorStop(1, 'rgba(160,255,250,0)')
      g.fillStyle = glow
      g.beginPath()
      g.arc(x, y, r * 4, 0, Math.PI * 2)
      g.fill()
    }
    const t = clamped(c)
    t.needsUpdate = true
    return t
  }, [])
}

/** Metres: the vent slats on a locker door, bottom of the first and the gap between each. */
export const LOCKER_SLATS = { y: 1.611, h: 0.018, step: 0.04, n: 4, w: 0.24 }

/**
 * Two yellow eyes with slit pupils, only where they show between a locker's
 * vent slats: something standing inside, looking out through them. Covers
 * the slats' width and from the bottom of the first to the top of the last.
 */
export function useSlatEyesTexture() {
  return useMemo(() => {
    const { y, h, step, n, w } = LOCKER_SLATS
    const span = step * (n - 1) + h
    const k = 1200 // px per metre
    const c = document.createElement('canvas')
    c.width = Math.round(w * k)
    c.height = Math.round(span * k)
    const g = c.getContext('2d')!
    const cy = (1.68 - y) * k
    for (const ex of [-0.055, 0.055]) {
      const x = (w / 2 + ex) * k
      const iris = g.createRadialGradient(x, c.height - cy, 0, x, c.height - cy, 0.036 * k)
      iris.addColorStop(0, '#fff7a0')
      iris.addColorStop(0.7, '#ffd000')
      iris.addColorStop(1, 'rgba(255,170,0,0)')
      g.fillStyle = iris
      g.beginPath()
      g.ellipse(x, c.height - cy, 0.036 * k, 0.032 * k, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#050505'
      g.beginPath()
      g.ellipse(x, c.height - cy, 0.006 * k, 0.026 * k, 0, 0, Math.PI * 2)
      g.fill()
    }
    // only what lines up with the gaps between the slats shows
    g.globalCompositeOperation = 'destination-in'
    g.fillStyle = '#fff'
    // one path, filled once: each separate fill would wipe out the stripes before it
    g.beginPath()
    for (let i = 0; i < n; i++) g.rect(0, c.height - (i * step + h) * k, c.width, h * k)
    g.fill()
    const t = clamped(c)
    t.needsUpdate = true
    return t
  }, [])
}

/** A patch of wall (metres from its left end and up from the floor) the busy wall keeps plain, for things hung there. */
export type KeepClear = readonly [x0: number, y0: number, x1: number, y1: number]

const PPM = 320

/**
 * A whole wall of ship's interior, floor to ceiling, drawn once at its real
 * size: riveted panels, pilasters, vent grilles, access hatches, cable runs
 * under the deckhead, accent lines and warning stencils. `keep` patches stay
 * plain panel so nothing painted competes with what hangs there. Pass a
 * module-level `keep` array so the texture is only drawn once.
 */
export function useHullWallTexture(base: string, width: number, height: number, seed: number, keep: readonly KeepClear[] = NONE) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = Math.round(width * PPM)
    c.height = Math.round(height * PPM)
    drawHullWall(c.getContext('2d')!, base, width, height, mulberry32(seed), keep)
    const t = clamped(c)
    t.needsUpdate = true
    return t
  }, [base, width, height, seed, keep])
}

const NONE: readonly KeepClear[] = []

function drawHullWall(g: CanvasRenderingContext2D, base: string, W: number, H: number, rng: () => number, keep: readonly KeepClear[]) {
  // metres to canvas: x from the left, y up from the floor
  const X = (x: number) => x * PPM
  const Y = (y: number) => (H - y) * PPM
  const rect = (x0: number, y0: number, x1: number, y1: number) => [X(x0), Y(y1), X(x1) - X(x0), Y(y0) - Y(y1)] as const
  const clear = (x0: number, y0: number, x1: number, y1: number) => keep.every(([a, b, c, d]) => x1 < a || x0 > c || y1 < b || y0 > d)
  const rivet = (x: number, y: number, r = 4) => {
    g.fillStyle = 'rgba(0,0,0,0.45)'
    g.beginPath()
    g.arc(X(x) + 1, Y(y) + 1, r, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.45)'
    g.beginPath()
    g.arc(X(x), Y(y), r - 1, 0, Math.PI * 2)
    g.fill()
  }
  const panel = (x0: number, y0: number, x1: number, y1: number, shade: number) => {
    const [px, py, pw, ph] = rect(x0, y0, x1, y1)
    g.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`
    g.fillRect(px, py, pw, ph)
    g.strokeStyle = 'rgba(0,0,0,0.6)'
    g.lineWidth = 5
    g.strokeRect(px + 2, py + 2, pw - 4, ph - 4)
    g.strokeStyle = 'rgba(255,255,255,0.22)'
    g.lineWidth = 2
    g.strokeRect(px + 7, py + 7, pw - 14, ph - 14)
    const m = 0.045
    for (const [rx, ry] of [
      [x0 + m, y0 + m],
      [x1 - m, y0 + m],
      [x0 + m, y1 - m],
      [x1 - m, y1 - m],
    ])
      rivet(rx, ry)
  }
  const stencil = (text: string, x: number, y: number, size: number, colour = 'rgba(20,22,26,0.8)') => {
    g.fillStyle = colour
    g.font = `bold ${Math.round(size * PPM)}px "Arial Narrow", Arial, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, X(x), Y(y))
  }
  const hazard = (x0: number, y0: number, x1: number, y1: number) => {
    const [px, py, pw, ph] = rect(x0, y0, x1, y1)
    g.save()
    g.beginPath()
    g.rect(px, py, pw, ph)
    g.clip()
    g.fillStyle = '#e8b818'
    g.fillRect(px, py, pw, ph)
    g.fillStyle = '#16181c'
    for (let i = -ph; i < pw + ph; i += 28) {
      g.beginPath()
      g.moveTo(px + i, py + ph)
      g.lineTo(px + i + 14, py + ph)
      g.lineTo(px + i + 14 + ph, py)
      g.lineTo(px + i + ph, py)
      g.fill()
    }
    g.restore()
  }
  const leds = ['#5dff9a', '#5dff9a', '#ffb81a', '#3dfcff']
  const signs = ['CAUTION', 'PRESSURISED LINE', 'NO STEP', 'HIGH VOLTAGE', 'O₂ FEED', 'CREW ONLY']

  // bare metal and grime
  g.fillStyle = base
  g.fillRect(0, 0, X(W), Y(0))
  for (let i = 0; i < W * H * 900; i++) {
    g.fillStyle = `rgba(0,0,0,${rng() * 0.07})`
    g.fillRect(rng() * X(W), rng() * Y(0), 1 + rng() * 3, 1 + rng() * 3)
  }

  // bands: lower panels, a dark dado, main panels, the cable run under the deckhead
  const DADO = [0.92, 1.06]
  const TOP = 2.2

  // columns of panels, some split off by a narrow pilaster
  const cols: [number, number][] = []
  for (let x = 0; x < W - 0.01; ) {
    const w = 0.55 + rng() * 0.45
    const end = W - (x + w) < 0.35 ? W : x + w
    cols.push([x, end])
    x = end
  }
  const pilasters: number[] = []
  cols.forEach(([x0, x1], i) => {
    const pil = i > 0 && rng() < 0.55
    const a = pil ? x0 + 0.06 : x0
    if (pil) pilasters.push(x0)
    const bands: (readonly [number, number])[] = [[0.15, DADO[0]]]
    // the tall band sometimes splits in two
    if (rng() < 0.4) {
      const split = DADO[1] + (TOP - DADO[1]) * (0.35 + rng() * 0.3)
      bands.push([DADO[1], split], [split, TOP])
    } else bands.push([DADO[1], TOP])
    for (const [b0, b1] of bands) {
      panel(a, b0, x1, b1, (rng() - 0.5) * 0.12)
      const cx = (a + x1) / 2
      const cy = (b0 + b1) / 2
      const pw = x1 - a
      const ph = b1 - b0
      const r = rng()
      if (!clear(a, b0, x1, b1)) continue
      if (b1 <= DADO[0] && r < 0.4) {
        // vent grille
        const vw = Math.min(pw - 0.16, 0.5)
        const [vx, vy, vww, vh] = rect(cx - vw / 2, cy - 0.17, cx + vw / 2, cy + 0.17)
        g.fillStyle = '#2a2e35'
        g.fillRect(vx, vy, vww, vh)
        for (let s = vy + 10; s < vy + vh - 8; s += 16) {
          g.fillStyle = '#07090b'
          g.fillRect(vx + 10, s, vww - 20, 8)
          g.fillStyle = 'rgba(255,255,255,0.18)'
          g.fillRect(vx + 10, s + 8, vww - 20, 2)
        }
        g.strokeStyle = 'rgba(0,0,0,0.7)'
        g.lineWidth = 4
        g.strokeRect(vx, vy, vww, vh)
        stencil('AIR RETURN', cx, cy + 0.24, 0.045)
      } else if (b1 <= DADO[0] && r < 0.65) {
        // access hatch with a recessed handle
        const [hx, hy, hw, hh] = rect(cx - 0.17, b0 + 0.1, cx + 0.17, b1 - 0.1)
        g.strokeStyle = 'rgba(0,0,0,0.55)'
        g.lineWidth = 4
        g.beginPath()
        g.roundRect(hx, hy, hw, hh, 14)
        g.stroke()
        g.fillStyle = '#1c1f24'
        g.fillRect(X(cx) - 30, Y(cy) - 8, 60, 16)
        stencil(`ACCESS ${Math.floor(rng() * 9) + 1}${'ABCD'[Math.floor(rng() * 4)]}`, cx, b1 - 0.16, 0.05)
      } else if (ph > 0.6 && r < 0.3) {
        // a chamfered inlay, the sort of geometry sci-fi ships are made of
        const ix = 0.09
        const iy = 0.1
        const k = 0.07
        g.strokeStyle = 'rgba(0,0,0,0.35)'
        g.lineWidth = 4
        g.beginPath()
        g.moveTo(X(a + ix + k), Y(b1 - iy))
        g.lineTo(X(x1 - ix), Y(b1 - iy))
        g.lineTo(X(x1 - ix), Y(b0 + iy + k))
        g.lineTo(X(x1 - ix - k), Y(b0 + iy))
        g.lineTo(X(a + ix), Y(b0 + iy))
        g.lineTo(X(a + ix), Y(b1 - iy - k))
        g.closePath()
        g.stroke()
        g.strokeStyle = 'rgba(255,255,255,0.2)'
        g.lineWidth = 2
        g.stroke()
      } else if (ph > 0.4 && r < 0.5) {
        // warning stencil between hazard bars
        hazard(cx - 0.2, cy + 0.06, cx + 0.2, cy + 0.1)
        stencil(signs[Math.floor(rng() * signs.length)], cx, cy - 0.02, 0.055)
        hazard(cx - 0.2, cy - 0.14, cx + 0.2, cy - 0.1)
      } else if (r < 0.64) {
        // frame number
        stencil(`${['FR', 'DK', 'SEC'][Math.floor(rng() * 3)]}-${Math.floor(rng() * 90) + 10}`, cx, cy, 0.11, 'rgba(20,22,26,0.5)')
      } else if (r < 0.78) {
        // a little status cluster
        const [sx, sy, sw, sh] = rect(cx - 0.09, cy - 0.06, cx + 0.09, cy + 0.06)
        g.fillStyle = '#1c1f24'
        g.fillRect(sx, sy, sw, sh)
        leds.forEach((col, i) => {
          g.fillStyle = col
          g.beginPath()
          g.arc(sx + 14 + i * 14, sy + 14, 4, 0, Math.PI * 2)
          g.fill()
        })
        g.fillStyle = 'rgba(93,255,154,0.6)'
        g.fillRect(sx + 8, sy + 26, sw - 16, 4)
      }
    }
  })

  // pilasters: narrow riveted strips, floor to deckhead
  for (const x of pilasters) {
    const [px, py, pw, ph] = rect(x, 0, x + 0.06, H)
    g.fillStyle = 'rgba(0,0,0,0.22)'
    g.fillRect(px, py, pw, ph)
    g.fillStyle = 'rgba(255,255,255,0.18)'
    g.fillRect(px + 2, py, 3, ph)
    for (let y = 0.25; y < H - 0.1; y += 0.2) rivet(x + 0.03, y, 3)
  }

  // the dado: a dark band with a hazard line and a teal accent that jogs at 45 degrees
  {
    const [dx, dy, dw, dh] = rect(0, DADO[0], W, DADO[1])
    g.fillStyle = '#3a4048'
    g.fillRect(dx, dy, dw, dh)
    g.fillStyle = 'rgba(255,255,255,0.15)'
    g.fillRect(dx, dy, dw, 3)
    hazard(0, DADO[0] + 0.015, W, DADO[0] + 0.035)
    g.strokeStyle = '#2fd6d0'
    g.lineWidth = 5
    g.beginPath()
    let y = DADO[1] - 0.04
    g.moveTo(0, Y(y))
    for (let x = 0.3; x < W; x += 0.6 + rng() * 0.8) {
      const ny = y > DADO[1] - 0.05 ? DADO[1] - 0.075 : DADO[1] - 0.04
      g.lineTo(X(x), Y(y))
      g.lineTo(X(x + Math.abs(ny - y)), Y(ny))
      x += Math.abs(ny - y)
      y = ny
    }
    g.lineTo(X(W), Y(y))
    g.stroke()
  }

  // the cable run under the deckhead
  {
    const [tx, ty, tw, th] = rect(0, TOP, W, H)
    g.fillStyle = '#353b43'
    g.fillRect(tx, ty, tw, th)
    g.fillStyle = 'rgba(255,255,255,0.12)'
    g.fillRect(tx, ty + th - 4, tw, 3)
    const cable = (y: number, r: number, colour: string) => {
      g.lineCap = 'butt'
      g.strokeStyle = 'rgba(0,0,0,0.6)'
      g.lineWidth = r * PPM * 2 + 4
      g.beginPath()
      g.moveTo(0, Y(y))
      g.lineTo(X(W), Y(y))
      g.stroke()
      g.strokeStyle = colour
      g.lineWidth = r * PPM * 2
      g.stroke()
      g.strokeStyle = 'rgba(255,255,255,0.35)'
      g.lineWidth = Math.max(2, r * PPM * 0.5)
      g.beginPath()
      g.moveTo(0, Y(y + r * 0.4))
      g.lineTo(X(W), Y(y + r * 0.4))
      g.stroke()
    }
    // a ribbed conduit, then bundled cables
    cable(2.5, 0.035, '#8d969f')
    for (let x = 0.05; x < W; x += 0.05) {
      g.fillStyle = 'rgba(0,0,0,0.3)'
      g.fillRect(X(x), Y(2.535), 3, 0.07 * PPM)
    }
    cable(2.4, 0.016, '#c23b2e')
    cable(2.36, 0.014, '#1d4fb8')
    cable(2.32, 0.018, '#2b2f36')
    cable(2.27, 0.012, '#e8b818')
    // brackets holding it all up
    for (let x = 0.2; x < W; x += 0.45) {
      const [bx, by, bw, bh] = rect(x, 2.24, x + 0.035, 2.56)
      g.fillStyle = '#5a636d'
      g.fillRect(bx, by, bw, bh)
      g.fillStyle = 'rgba(0,0,0,0.4)'
      g.fillRect(bx + bw - 3, by, 3, bh)
      rivet(x + 0.0175, 2.26, 3)
    }
    // now and then a cable drops down a pilaster into the panels below
    for (const x of pilasters) {
      if (rng() < 0.5) continue
      g.strokeStyle = 'rgba(0,0,0,0.6)'
      g.lineWidth = 12
      g.beginPath()
      g.moveTo(X(x + 0.03), Y(2.32))
      g.lineTo(X(x + 0.03), Y(1.6 + rng() * 0.4))
      g.stroke()
      g.strokeStyle = '#2b2f36'
      g.lineWidth = 8
      g.stroke()
    }
  }
}
