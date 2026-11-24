import { mulberry32 } from '../../rng'
import { canvas, finish, speckle, type G } from './textures'

/*
 * The office's printed and painted surfaces: carpet tiles, the suspended
 * ceiling, the old computer's screen, the rally poster and the clock face.
 */

/** Hard-wearing carpet tiles, laid in alternate directions. One tile is 0.5 m. */
export function carpetTexture(repeatX: number, repeatY: number) {
  const [c, g] = canvas(256)
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? '#4b5562' : '#535d6a'
      g.fillRect(i * 128, j * 128, 128, 128)
      // the pile runs one way on each tile
      g.strokeStyle = 'rgba(0,0,0,0.08)'
      g.lineWidth = 2
      for (let k = 4; k < 128; k += 6) {
        g.beginPath()
        if ((i + j) % 2) {
          g.moveTo(i * 128 + k, j * 128)
          g.lineTo(i * 128 + k, j * 128 + 128)
        } else {
          g.moveTo(i * 128, j * 128 + k)
          g.lineTo(i * 128 + 128, j * 128 + k)
        }
        g.stroke()
      }
    }
  speckle(g, 256, 256, 4000, 41, 0.15)
  g.fillStyle = 'rgba(0,0,0,0.25)'
  g.fillRect(0, 127, 256, 2)
  g.fillRect(127, 0, 2, 256)
  return finish(c, [repeatX, repeatY])
}

/** Suspended ceiling: 600 mm mineral fibre tiles in a white grid. One tile per repeat. */
export function ceilingTileTexture(repeatX: number, repeatY: number) {
  const [c, g] = canvas(128)
  g.fillStyle = '#ece9e1'
  g.fillRect(0, 0, 128, 128)
  speckle(g, 128, 128, 900, 43, 0.12)
  g.fillStyle = '#c8c5bd'
  g.fillRect(0, 0, 128, 4)
  g.fillRect(0, 0, 4, 128)
  return finish(c, [repeatX, repeatY])
}

/** The old computer's screen: the job list in a blue text-mode program, or a message just for you. */
export function crtTexture(mode: 'jobs' | 'message') {
  const [c, g] = canvas(320, 240)
  g.textBaseline = 'top'
  if (mode === 'jobs') {
    g.fillStyle = '#1d2fa8'
    g.fillRect(0, 0, 320, 240)
    g.fillStyle = '#b8b8b8'
    g.fillRect(0, 0, 320, 18)
    g.fillStyle = '#111'
    g.font = 'bold 14px "Courier New", monospace'
    g.fillText(' JOBS   CUSTOMERS   PARTS', 4, 2)
    g.fillStyle = '#f2f2f2'
    g.font = '13px "Courier New", monospace'
    const rows = ['GA12 RGE  BRAKES F+R  LIFT', 'DE14 JAV  CAM BELT    BAY2', 'KV09 OPL  MOT         WED', 'R482 TTW  EXHAUST     WAIT', 'YX61 BNM  TYRES x2    THU']
    rows.forEach((r, i) => g.fillText(r, 8, 30 + i * 20))
    g.fillStyle = '#ffde21'
    g.fillText('F1 HELP  F2 NEW  F10 QUIT', 8, 214)
  } else {
    g.fillStyle = '#050805'
    g.fillRect(0, 0, 320, 240)
    g.fillStyle = '#4dff6a'
    g.font = 'bold 30px "Courier New", monospace'
    g.textAlign = 'center'
    g.fillText("DON'T", 160, 70)
    g.fillText('TURN ROUND', 160, 110)
    g.fillRect(232, 150, 14, 24)
  }
  // scan lines and the glass's curve darkening the corners
  g.fillStyle = 'rgba(0,0,0,0.18)'
  for (let y = 0; y < 240; y += 3) g.fillRect(0, y, 320, 1)
  const v = g.createRadialGradient(160, 120, 90, 160, 120, 210)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.55)')
  g.fillStyle = v
  g.fillRect(0, 0, 320, 240)
  return finish(c)
}

/** A hatchback, side on, facing right, for the rally poster. `x`, `y`: where its wheels touch the ground. */
function rallyCar(g: G, x: number, y: number) {
  g.fillStyle = '#d8342c'
  g.beginPath()
  g.moveTo(x - 150, y - 30)
  g.lineTo(x - 150, y - 80)
  g.lineTo(x - 100, y - 130)
  g.lineTo(x + 30, y - 132)
  g.lineTo(x + 90, y - 82)
  g.lineTo(x + 160, y - 70)
  g.lineTo(x + 165, y - 30)
  g.closePath()
  g.fill()
  g.fillStyle = '#1b2730'
  g.beginPath()
  g.moveTo(x - 90, y - 85)
  g.lineTo(x - 80, y - 122)
  g.lineTo(x + 25, y - 124)
  g.lineTo(x + 70, y - 85)
  g.closePath()
  g.fill()
  g.fillStyle = '#f4f1e8'
  g.fillRect(x - 60, y - 70, 70, 26)
  g.fillStyle = '#111'
  g.font = 'bold 24px Impact, sans-serif'
  g.textAlign = 'center'
  g.fillText('27', x - 25, y - 48)
  for (const wx of [x - 95, x + 110]) {
    g.fillStyle = '#111'
    g.beginPath()
    g.arc(wx, y - 22, 30, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#c9ced4'
    g.beginPath()
    g.arc(wx, y - 22, 14, 0, Math.PI * 2)
    g.fill()
  }
}

/**
 * The rally poster over the desk, landscape. `you`: the picture has become a
 * grainy photo of this workshop, taken from just behind someone standing in
 * it, who can only be you.
 */
export function carPosterTexture(mode: 'car' | 'you') {
  const [c, g] = canvas(540, 360)
  if (mode === 'car') {
    const sky = g.createLinearGradient(0, 0, 0, 220)
    sky.addColorStop(0, '#5f9fd8')
    sky.addColorStop(1, '#cfe3f2')
    g.fillStyle = sky
    g.fillRect(0, 0, 540, 220)
    g.fillStyle = '#6f8a4a'
    g.beginPath()
    g.moveTo(0, 220)
    g.quadraticCurveTo(160, 150, 300, 200)
    g.quadraticCurveTo(420, 170, 540, 190)
    g.lineTo(540, 360)
    g.lineTo(0, 360)
    g.fill()
    g.fillStyle = '#b79c74'
    g.fillRect(0, 250, 540, 110)
    // the dust it's kicking up behind it
    const rng = mulberry32(77)
    for (let k = 0; k < 40; k++) {
      g.fillStyle = `rgba(214,196,160,${0.15 + rng() * 0.3})`
      g.beginPath()
      g.arc(40 + rng() * 180, 220 + rng() * 70, 14 + rng() * 30, 0, Math.PI * 2)
      g.fill()
    }
    rallyCar(g, 300, 300)
  } else {
    // the workshop, from behind someone's shoulder: grey and grainy, like a still from a camera
    g.fillStyle = '#7d7e7a'
    g.fillRect(0, 0, 540, 360)
    g.fillStyle = '#b9b7ae'
    g.fillRect(0, 0, 540, 200)
    g.fillStyle = '#5e5f5b'
    g.fillRect(0, 200, 540, 160)
    g.fillStyle = '#3f5f86'
    g.fillRect(70, 40, 26, 200)
    g.fillRect(250, 40, 26, 200)
    g.fillRect(70, 34, 206, 14)
    g.fillStyle = '#41584c'
    g.fillRect(100, 130, 150, 50)
    g.fillStyle = '#c4a43a'
    g.fillRect(350, 170, 150, 60)
    // the back of a head and shoulders, close up and out of focus
    g.filter = 'blur(3px)'
    g.fillStyle = '#16171a'
    g.beginPath()
    g.ellipse(300, 400, 190, 130, 0, Math.PI, 0)
    g.fill()
    g.fillStyle = '#2a2420'
    g.beginPath()
    g.ellipse(300, 238, 62, 78, 0, 0, Math.PI * 2)
    g.fill()
    g.filter = 'none'
    speckle(g, 540, 360, 9000, 78, 0.25)
    g.fillStyle = '#f4f1e8'
    g.font = 'bold 18px "Courier New", monospace'
    g.textAlign = 'left'
    g.fillText('CAM 2  REC', 16, 30)
  }
  // the title strip is the same either way
  g.fillStyle = '#111'
  g.fillRect(0, 0, 540, 44)
  g.fillStyle = '#ffde21'
  g.font = 'bold 34px Impact, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText("RALLY '89", 270, 24)
  return finish(c)
}

/** Plain office clock face: numbers round the edge. */
export function clockFaceTexture() {
  const [c, g] = canvas(256)
  g.fillStyle = '#fbfaf5'
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = '#111'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 30px Arial, sans-serif'
  for (let h = 1; h <= 12; h++) {
    const a = (h / 12) * Math.PI * 2
    g.fillText(String(h), 128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96)
  }
  for (let m = 0; m < 60; m++) {
    const a = (m / 60) * Math.PI * 2
    g.fillRect(128 + Math.sin(a) * 118 - 1, 128 - Math.cos(a) * 118 - 1, 3, 3)
  }
  return finish(c)
}
