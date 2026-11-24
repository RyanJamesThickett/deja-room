import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { mulberry32 } from './rng'

/*
 * Busy wallpaper for feature walls, drawn on a canvas at load time. A loud
 * pattern behind a shelf of things makes a change much harder to spot.
 * One tile of each texture covers TILE metres of wall.
 */

export const TILE = 0.6

export type WallpaperKind = 'retro' | 'stripes' | 'leaves' | 'harlequin' | 'polka' | 'eyes' | 'damask'

function canvas() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  return [c, c.getContext('2d')!] as const
}

type Draw = (g: CanvasRenderingContext2D) => void

const DRAW: Record<WallpaperKind, Draw> = {
  // 1970s orange and brown rings
  retro: (g) => {
    g.fillStyle = '#f3e1b6'
    g.fillRect(0, 0, 512, 512)
    const rings = ['#c8551f', '#e89a2c', '#7a3b12', '#f3e1b6']
    for (const [cx, cy] of [
      [128, 128],
      [384, 384],
      [384, 128],
      [128, 384],
    ]) {
      const big = (cx + cy) % 512 === 256
      rings.forEach((c, i) => {
        g.fillStyle = c
        g.beginPath()
        g.arc(cx, cy, (big ? 120 : 92) - i * (big ? 28 : 22), 0, Math.PI * 2)
        g.fill()
      })
    }
  },
  // candy stripes with a thin pinstripe
  stripes: (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#f6efe2' : '#d9475b'
      g.fillRect(i * 64, 0, 64, 512)
      g.fillStyle = '#2f6b5c'
      g.fillRect(i * 64 + 30, 0, 4, 512)
    }
  },
  // big tropical leaves on deep green
  leaves: (g) => {
    g.fillStyle = '#123d2e'
    g.fillRect(0, 0, 512, 512)
    const rng = mulberry32(7)
    for (let k = 0; k < 14; k++) {
      const x = rng() * 512
      const y = rng() * 512
      const a = rng() * Math.PI * 2
      const len = 110 + rng() * 70
      for (const [ox, oy] of [
        [0, 0],
        [-512, 0],
        [512, 0],
        [0, -512],
        [0, 512],
      ]) {
        g.save()
        g.translate(x + ox, y + oy)
        g.rotate(a)
        g.fillStyle = k % 3 === 0 ? '#3f9b5a' : k % 3 === 1 ? '#2a7a49' : '#5cb86e'
        g.beginPath()
        g.ellipse(0, 0, len / 2, len / 5, 0, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = '#0e2e22'
        g.lineWidth = 3
        g.beginPath()
        g.moveTo(-len / 2, 0)
        g.lineTo(len / 2, 0)
        g.stroke()
        g.restore()
      }
    }
  },
  // harlequin diamonds
  harlequin: (g) => {
    g.fillStyle = '#1f3a5f'
    g.fillRect(0, 0, 512, 512)
    for (let i = -1; i < 5; i++)
      for (let j = -1; j < 5; j++) {
        g.fillStyle = (i + j) % 2 ? '#e8c45a' : '#1f3a5f'
        g.beginPath()
        const cx = i * 128 + 64
        const cy = j * 128 + 64
        g.moveTo(cx, cy - 64)
        g.lineTo(cx + 64, cy)
        g.lineTo(cx, cy + 64)
        g.lineTo(cx - 64, cy)
        g.fill()
      }
  },
  polka: (g) => {
    g.fillStyle = '#ffd3e2'
    g.fillRect(0, 0, 512, 512)
    g.fillStyle = '#ff3fa4'
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const off = j % 2 ? 64 : 0
        g.beginPath()
        g.arc(i * 128 + 64 + off, j * 128 + 64, 26, 0, Math.PI * 2)
        g.fill()
        if (off) {
          g.beginPath()
          g.arc(i * 128 + 64 + off - 512, j * 128 + 64, 26, 0, Math.PI * 2)
          g.fill()
        }
      }
  },
  // rows of little eyes; it's that sort of game
  eyes: (g) => {
    g.fillStyle = '#2c2147'
    g.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const x = i * 128 + 64 + (j % 2 ? 64 : 0)
        const y = j * 128 + 64
        for (const dx of [0, -512]) {
          g.fillStyle = '#f4f0dc'
          g.beginPath()
          g.ellipse(x + dx, y, 34, 20, 0, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = '#16d0ff'
          g.beginPath()
          g.arc(x + dx, y, 13, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = '#05050a'
          g.beginPath()
          g.arc(x + dx, y, 6, 0, Math.PI * 2)
          g.fill()
        }
      }
  },
  // a loose, curly damask
  damask: (g) => {
    g.fillStyle = '#5b1f2e'
    g.fillRect(0, 0, 512, 512)
    g.strokeStyle = '#c99a5b'
    g.fillStyle = '#c99a5b'
    g.lineWidth = 6
    for (const [cx, cy] of [
      [128, 128],
      [384, 384],
    ]) {
      for (const s of [-1, 1]) {
        g.beginPath()
        g.moveTo(cx, cy - 100)
        g.bezierCurveTo(cx + s * 90, cy - 80, cx + s * 70, cy + 20, cx, cy + 100)
        g.stroke()
        g.beginPath()
        g.arc(cx + s * 44, cy - 10, 16, 0, Math.PI * 2)
        g.stroke()
      }
      g.beginPath()
      g.ellipse(cx, cy, 14, 40, 0, 0, Math.PI * 2)
      g.fill()
      g.beginPath()
      g.arc(cx, cy - 110, 10, 0, Math.PI * 2)
      g.fill()
    }
  },
}

/** A repeating wallpaper texture sized for a `width` × `height` metre wall. */
export function wallpaperTexture(kind: WallpaperKind, width: number, height: number) {
  const [c, g] = canvas()
  DRAW[kind](g)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(width / TILE, height / TILE)
  return t
}
