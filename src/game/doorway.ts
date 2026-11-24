import { CanvasTexture, SRGBColorSpace } from 'three'

/*
 * What you glimpse through a door left ajar: a dim corridor running away
 * from you, with a faint light at the far end. Pitch black gives the change
 * away at a glance; this reads as "a room beyond" until you look properly.
 */
export function dimCorridorTexture(tint = '#3a3530') {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')!
  const W = 256
  const H = 512
  // the far end of the corridor, a small lit rectangle
  const fx0 = W * 0.38
  const fx1 = W * 0.62
  const fy0 = H * 0.36
  const fy1 = H * 0.62
  const wall = (pts: [number, number][], fill: string) => {
    g.fillStyle = fill
    g.beginPath()
    g.moveTo(...pts[0])
    for (const p of pts.slice(1)) g.lineTo(...p)
    g.closePath()
    g.fill()
  }
  g.fillStyle = '#0c0b0a'
  g.fillRect(0, 0, W, H)
  // ceiling, floor and the two side walls, darker towards the door
  wall([[0, 0], [W, 0], [fx1, fy0], [fx0, fy0]], '#141210')
  wall([[0, H], [W, H], [fx1, fy1], [fx0, fy1]], '#1d1a17')
  wall([[0, 0], [fx0, fy0], [fx0, fy1], [0, H]], tint)
  wall([[W, 0], [fx1, fy0], [fx1, fy1], [W, H]], '#2a2622')
  const glow = g.createRadialGradient(W / 2, (fy0 + fy1) / 2, 4, W / 2, (fy0 + fy1) / 2, 90)
  glow.addColorStop(0, 'rgba(255,214,150,0.55)')
  glow.addColorStop(1, 'rgba(255,214,150,0)')
  g.fillStyle = glow
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#6b5a44'
  g.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0)
  // and darkness creeping in from the doorway
  const fade = g.createLinearGradient(0, 0, W, 0)
  fade.addColorStop(0, 'rgba(0,0,0,0.55)')
  fade.addColorStop(0.5, 'rgba(0,0,0,0)')
  fade.addColorStop(1, 'rgba(0,0,0,0.55)')
  g.fillStyle = fade
  g.fillRect(0, 0, W, H)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}
