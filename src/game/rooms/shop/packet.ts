import { BufferGeometry, Float32BufferAttribute } from 'three'

/*
 * A crisp packet's shape: a flat pillow of foil. The front and back bulge
 * out in the middle and pinch to nothing at the edges, the top and bottom
 * are flat crimped seals, and the foil has a few soft creases. The front's
 * UVs cover the whole face, so the label prints edge to edge. Built standing
 * up, centred on the origin, front facing +z.
 */

export const PACKET = { width: 0.13, height: 0.19, depth: 0.045, seal: 0.014 }

export function packetGeometry() {
  const { width: w, height: h, depth: d, seal } = PACKET
  const nx = 16
  const ny = 24
  const inner = h / 2 - seal
  const positions: number[] = []
  const uvs: number[] = []
  const index: number[] = []
  for (const side of [1, -1]) {
    const base = positions.length / 3
    for (let j = 0; j <= ny; j++) {
      for (let i = 0; i <= nx; i++) {
        const u = i / nx
        const v = j / ny
        const x = (u - 0.5) * w
        const y = (v - 0.5) * h
        // full thickness in the middle, easing to nothing at the sides and in the seals
        const across = 1 - Math.abs(2 * x / w) ** 4
        const along = Math.abs(y) >= inner ? 0 : 1 - (Math.abs(y) / inner) ** 6
        const puff = Math.sqrt(Math.max(0, across * along))
        // soft creases in the foil, strongest where the bag is fattest
        const crease = (Math.sin(x * 70 + y * 23) * Math.sin(y * 55 - x * 17)) * 0.0022 * puff
        // a puffed bag draws its sides in a little
        positions.push(x * (1 - 0.05 * puff), y, side * (puff * d / 2 + crease))
        uvs.push(side === 1 ? u : 1 - u, v)
      }
    }
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = base + j * (nx + 1) + i
        const b = a + 1
        const c = a + nx + 1
        const e = c + 1
        if (side === 1) index.push(a, b, e, a, e, c)
        else index.push(a, e, b, a, c, e)
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}
