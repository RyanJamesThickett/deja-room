import { useMemo } from 'react'
import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three'
import { mulberry32 } from '../../rng'
import { GYM_BOUNDS as B } from './bounds'
import { FLOOR_PLAN } from './layout'

/*
 * Everything printed in the gym is drawn on a canvas at load time: the rubber
 * floor, the treadmill belt, screens, posters, the sign, the clock and the
 * street in daylight.
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

/** Speckled rubber gym tiles, one metre square. One tile of the texture is one floor tile. */
export function useRubberFloor(repeatX: number, repeatY: number) {
  return useMemo(() => {
    const [c, g] = canvas(512)
    g.fillStyle = '#2b2d31'
    g.fillRect(0, 0, 512, 512)
    const rng = mulberry32(31)
    const flecks = ['#4a4e55', '#5b6069', '#3b6fb0', '#1f2124', '#6b7078']
    for (let k = 0; k < 9000; k++) {
      g.fillStyle = flecks[Math.floor(rng() * flecks.length)]
      g.fillRect(rng() * 512, rng() * 512, 1 + rng() * 2, 1 + rng() * 2)
    }
    // the joins between tiles
    g.strokeStyle = 'rgba(0,0,0,0.6)'
    g.lineWidth = 3
    g.strokeRect(1.5, 1.5, 509, 509)
    return finish(c, [repeatX, repeatY])
  }, [repeatX, repeatY])
}

/** Treadmill belt: dark rubber with faint cross grooves. Repeats along the belt. */
export function beltTexture() {
  const [c, g] = canvas(64, 256)
  g.fillStyle = '#1b1c1f'
  g.fillRect(0, 0, 64, 256)
  g.fillStyle = '#2c2e33'
  for (let y = 0; y < 256; y += 16) g.fillRect(0, y, 64, 3)
  // a scuffed patch, so a moving belt is easy to see
  g.fillStyle = '#55585e'
  g.fillRect(18, 120, 28, 10)
  return finish(c, [1, 3])
}

/** Small LCD panel: a few lines of text. */
export function lcdTexture(lines: string[], lit: boolean) {
  const [c, g] = canvas(256, 128)
  g.fillStyle = lit ? '#0e3b52' : '#0b0c0e'
  g.fillRect(0, 0, 256, 128)
  if (lit) {
    g.fillStyle = '#7ff3ff'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    lines.forEach((line, i) => {
      g.font = i === 0 ? 'bold 46px monospace' : 'bold 22px monospace'
      g.fillText(line, 128, i === 0 ? 50 : 98)
    })
  }
  return finish(c)
}

/** The reception computer: a member check-in screen. */
export function checkInTexture() {
  const [c, g] = canvas(320, 200)
  g.fillStyle = '#eef1f4'
  g.fillRect(0, 0, 320, 200)
  g.fillStyle = '#ff6a1a'
  g.fillRect(0, 0, 320, 34)
  g.fillStyle = '#fff'
  g.font = 'bold 20px sans-serif'
  g.fillText('IRONWORKS  CHECK-IN', 12, 24)
  // a member photo that is just an eye
  g.fillStyle = '#c9ced6'
  g.fillRect(16, 50, 96, 120)
  g.fillStyle = '#fffbe6'
  g.beginPath()
  g.ellipse(64, 110, 38, 22, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#1f6bff'
  g.beginPath()
  g.arc(64, 110, 13, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#111'
  g.beginPath()
  g.arc(64, 110, 6, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#222'
  g.font = 'bold 18px sans-serif'
  g.fillText('MEMBER: YOU', 128, 76)
  g.font = '15px sans-serif'
  g.fillText('Visits: 4,812', 128, 104)
  g.fillText('Last seen: just now', 128, 128)
  g.fillStyle = '#2fbf71'
  g.fillRect(128, 146, 120, 28)
  g.fillStyle = '#fff'
  g.font = 'bold 15px sans-serif'
  g.fillText('WELCOME BACK', 136, 166)
  return finish(c)
}

/** The fitness channel on the TV: a class advert and a heart-rate trace. */
export function tvShowTexture() {
  const [c, g] = canvas(512, 300)
  const bg = g.createLinearGradient(0, 0, 512, 300)
  bg.addColorStop(0, '#ff3fa4')
  bg.addColorStop(1, '#8a4dff')
  g.fillStyle = bg
  g.fillRect(0, 0, 512, 300)
  g.fillStyle = '#fff'
  g.textAlign = 'left'
  g.font = 'bold 64px Impact, sans-serif'
  g.fillText('HIIT', 34, 96)
  g.fillText('CLASS', 34, 160)
  g.font = 'bold 30px Impact, sans-serif'
  g.fillText('TONIGHT 3AM', 34, 204)
  // heart-rate trace
  g.strokeStyle = '#ffde21'
  g.lineWidth = 6
  g.beginPath()
  const ys = [0, 0, -10, 40, -70, 10, 0, 0, 0, -10, 40, -70, 10, 0]
  ys.forEach((y, i) => g.lineTo(270 + i * 17, 140 + y))
  g.stroke()
  g.fillStyle = 'rgba(0,0,0,0.45)'
  g.fillRect(0, 252, 512, 48)
  g.fillStyle = '#fff'
  g.font = 'bold 24px sans-serif'
  g.fillText('IRONWORKS TV  ·  HYDRATE  ·  WIPE DOWN YOUR BENCH', 16, 284)
  return finish(c)
}

/** World x/z to the TV plan's canvas. Seen from the treadmills, so +z is up and +x is to the left. */
export const PLAN = { w: 512, h: 400, pad: 24 }

function planPoint(x: number, z: number): [number, number] {
  const sx = (PLAN.w - PLAN.pad * 2) / (B.halfX * 2)
  const sz = (PLAN.h - PLAN.pad * 2) / (B.halfZ * 2)
  return [PLAN.w / 2 - x * sx, PLAN.h / 2 - z * sz]
}

/** Where world x/z falls on the TV plan, as offsets from the screen centre in screen widths/heights. */
export function planOffset(x: number, z: number): [number, number] {
  const [cx, cy] = planPoint(x, z)
  return [cx / PLAN.w - 0.5, 0.5 - cy / PLAN.h]
}

/** Grainy green CCTV bird's-eye view of the gym floor (the dot that is you is drawn separately). */
export function tvPlanTexture() {
  const [c, g] = canvas(PLAN.w, PLAN.h)
  g.fillStyle = '#0d1f14'
  g.fillRect(0, 0, PLAN.w, PLAN.h)
  const rng = mulberry32(5)
  for (let k = 0; k < 5000; k++) {
    g.fillStyle = `rgba(160,255,190,${rng() * 0.12})`
    g.fillRect(rng() * PLAN.w, rng() * PLAN.h, 2, 2)
  }
  g.strokeStyle = '#8affb0'
  g.lineWidth = 4
  const [x0, y0] = planPoint(B.halfX, B.halfZ)
  const [x1, y1] = planPoint(-B.halfX, -B.halfZ)
  g.strokeRect(x0, y0, x1 - x0, y1 - y0)
  g.fillStyle = 'rgba(138,255,176,0.35)'
  g.lineWidth = 2
  for (const [x, z, w, d] of FLOOR_PLAN) {
    const [ax, ay] = planPoint(x + w / 2, z + d / 2)
    const [bx, by] = planPoint(x - w / 2, z - d / 2)
    g.fillRect(ax, ay, bx - ax, by - ay)
    g.strokeRect(ax, ay, bx - ax, by - ay)
  }
  for (let y = 0; y < PLAN.h; y += 4) {
    g.fillStyle = 'rgba(0,0,0,0.18)'
    g.fillRect(0, y, PLAN.w, 1)
  }
  g.fillStyle = '#8affb0'
  g.font = 'bold 22px monospace'
  g.fillText('CAM 4  GYM FLOOR', 30, 22)
  g.fillText('● REC', PLAN.w - 110, 22)
  return finish(c)
}

/** Backlit sign behind reception. */
export function signTexture(name: string) {
  const [c, g] = canvas(768, 230)
  g.fillStyle = '#111214'
  g.fillRect(0, 0, 768, 230)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 128px Impact, sans-serif'
  g.fillStyle = '#ff6a1a'
  g.shadowColor = '#ff6a1a'
  g.shadowBlur = 18
  g.fillText(name, 384, 96)
  g.shadowBlur = 0
  g.fillStyle = '#f2f2f2'
  g.font = 'bold 38px sans-serif'
  g.fillText('24 HOUR GYM', 384, 190)
  return finish(c)
}

/** Red seven-segment clock face. */
export function clockTexture(text: string) {
  const [c, g] = canvas(256, 80)
  g.fillStyle = '#070707'
  g.fillRect(0, 0, 256, 80)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 66px "Courier New", monospace'
  g.fillStyle = '#2a0606'
  g.fillText('88:88', 128, 42)
  g.fillStyle = '#ff2a1a'
  g.shadowColor = '#ff2a1a'
  g.shadowBlur = 12
  g.fillText(text, 128, 42)
  return finish(c)
}

export type PosterKind = 'push' | 'sinister' | 'sweat'

/** Motivational posters, and the one that isn't. */
export function posterTexture(kind: PosterKind) {
  const [c, g] = canvas(300, 420)
  g.textAlign = 'center'
  if (kind === 'sweat') {
    g.fillStyle = '#ffde21'
    g.fillRect(0, 0, 300, 420)
    // a big drop of sweat
    g.fillStyle = '#1f6bff'
    g.beginPath()
    g.moveTo(150, 40)
    g.bezierCurveTo(205, 120, 215, 150, 215, 175)
    g.arc(150, 175, 65, 0, Math.PI)
    g.bezierCurveTo(85, 150, 95, 120, 150, 40)
    g.fill()
    g.fillStyle = '#111'
    g.font = 'bold 54px Impact, sans-serif'
    g.fillText('SWEAT IS', 150, 305)
    g.fillText('FAT CRYING', 150, 365)
    return finish(c)
  }
  g.fillStyle = '#111214'
  g.fillRect(0, 0, 300, 420)
  g.fillStyle = '#ff6a1a'
  g.beginPath()
  g.moveTo(0, 300)
  g.lineTo(300, 230)
  g.lineTo(300, 262)
  g.lineTo(0, 332)
  g.fill()
  g.fillStyle = '#ffffff'
  const lines = kind === 'push' ? ['PUSH', 'HARDER', 'THAN'] : ['WE SAW', 'WHAT', 'YOU DID']
  g.font = 'bold 66px Impact, sans-serif'
  lines.forEach((l, i) => g.fillText(l, 150, 90 + i * 66))
  g.font = 'bold 50px Impact, sans-serif'
  g.fillStyle = '#ff6a1a'
  g.fillText('YESTERDAY', 150, 390)
  return finish(c)
}

/** Window lettering, seen from inside so it reads backwards. Transparent background. */
export function vinylTexture() {
  const [c, g] = canvas(1024, 160)
  g.translate(1024, 0)
  g.scale(-1, 1)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.font = 'bold 92px Impact, sans-serif'
  g.fillText('IRONWORKS  24/7', 512, 70)
  g.font = 'bold 34px sans-serif'
  g.fillText('NO JOINING FEE  ·  NO WAY OUT', 512, 138)
  return finish(c)
}

/** Woven wicker for the bike basket. */
export function wickerTexture() {
  const [c, g] = canvas(128)
  g.fillStyle = '#8a5a2b'
  g.fillRect(0, 0, 128, 128)
  for (let y = 0; y < 128; y += 16)
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = (x + y) % 32 ? '#c48a4a' : '#a8703a'
      g.fillRect(x + 1, y + 2, 14, 12)
    }
  return finish(c, [3, 2])
}

/** "PUSH" sticker on the glass door. */
export function pushTexture() {
  const [c, g] = canvas(256, 96)
  g.fillStyle = '#ff6a1a'
  g.fillRect(0, 0, 256, 96)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 60px Impact, sans-serif'
  g.fillText('PULL', 128, 50)
  return finish(c)
}
