import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'

/*
 * Signs for the item check world, drawn on canvases. Kept small (no
 * mipmaps, modest sizes): there are hundreds of them.
 */

const INK = '#111111'
const PAPER = '#fff6dc'

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function finish(c: HTMLCanvasElement) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.generateMipmaps = false
  t.minFilter = LinearFilter
  return t
}

/** Shrinks the font until `text` fits in `max` pixels. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: string, size: number, max: number) {
  let s = size
  do ctx.font = `${weight} ${s}px "Bricolage Grotesque", "Trebuchet MS", sans-serif`
  while (ctx.measureText(text).width > max && --s > 10)
}

/** The big sign at the front of an item's column: what it is, which room, and its other kinds of change. */
export function itemSign(label: string, id: string, room: string, extras: string) {
  const c = canvas(512, 160)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, 512, 160)
  ctx.lineWidth = 8
  ctx.strokeStyle = INK
  ctx.strokeRect(4, 4, 504, 152)
  ctx.fillStyle = INK
  ctx.textBaseline = 'top'
  fit(ctx, label, '800', 48, 470)
  ctx.fillText(label, 20, 16)
  fit(ctx, `${room} · ${id}`, '600', 26, 470)
  ctx.fillStyle = '#555'
  ctx.fillText(`${room} · ${id}`, 20, 74)
  if (extras) {
    fit(ctx, extras, '700', 24, 470)
    ctx.fillStyle = '#1f6bff'
    ctx.fillText(extras, 20, 112)
  }
  return finish(c)
}

/** A small sign in front of each variant: its name, and what the game says when it happens. */
export function variantSign(variant: string, text: string) {
  const c = canvas(384, 96)
  const ctx = c.getContext('2d')!
  const isDefault = variant === 'default'
  ctx.fillStyle = isDefault ? '#ffde21' : '#ffffff'
  ctx.fillRect(0, 0, 384, 96)
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  ctx.strokeRect(3, 3, 378, 90)
  ctx.fillStyle = INK
  ctx.textBaseline = 'top'
  fit(ctx, variant, '800', 34, 350)
  ctx.fillText(variant, 16, 10)
  if (text) {
    fit(ctx, text, '600', 20, 350)
    ctx.fillStyle = '#444'
    ctx.fillText(text, 16, 56)
  }
  return finish(c)
}

/** The room's name painted big on the floor at the start of its rows. */
export function roomBanner(name: string, count: string) {
  const c = canvas(1024, 256)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ff3fa4'
  ctx.fillRect(0, 0, 1024, 256)
  ctx.lineWidth = 14
  ctx.strokeStyle = INK
  ctx.strokeRect(7, 7, 1010, 242)
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#ffffff'
  fit(ctx, name.toUpperCase(), '800', 120, 960)
  ctx.fillText(name.toUpperCase(), 32, 30)
  ctx.fillStyle = INK
  fit(ctx, count, '700', 44, 960)
  ctx.fillText(count, 36, 180)
  return finish(c)
}

/** A faint grid for the floor, so distances read. */
export function gridTexture() {
  const c = canvas(256, 256)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#d8d3c4'
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = '#bdb6a3'
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, 256, 256)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(128, 0)
  ctx.lineTo(128, 256)
  ctx.moveTo(0, 128)
  ctx.lineTo(256, 128)
  ctx.stroke()
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}
