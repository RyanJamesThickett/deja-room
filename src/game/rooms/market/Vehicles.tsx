import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { CylinderGeometry, MeshStandardMaterial, type BufferGeometry, type Group } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Instanced, PI, type Placement } from '../../kit'
import { ShadowFigure } from '../../figure'
import { once } from '../../outsideLayers'
import type { Vec3 } from './build'
import { STALL_SIGNS } from './cityPlan'
import { MAT } from './materials'
import { BALL, DISC, glossMaterial, lathe, matteMaterial, UNIT_BOX } from './stallParts'
import { SignBoard } from './StallFrame'

/*
 * The vehicles: a corrugated hot dog van at the west end with its hatch
 * to the square, a three-wheeler coffee cart at the east end, and a
 * delivery van parked across the mouth of the street.
 */

function Box({ size, at, material, rot, paint = false }: { size: Vec3; at: Vec3; material: MeshStandardMaterial; rot?: Vec3; paint?: boolean }) {
  return <mesh geometry={UNIT_BOX} material={material} position={at} rotation={rot} scale={size} castShadow receiveShadow userData={{ paint }} />
}

/** A panel with its edges and corners rounded off, made to size (rounding doesn't survive scaling). */
function Shell({ geometry, at, material, rot, paint = false }: { geometry: BufferGeometry; at: Vec3; material: MeshStandardMaterial; rot?: Vec3; paint?: boolean }) {
  return <mesh geometry={geometry} material={material} position={at} rotation={rot} castShadow receiveShadow userData={{ paint }} />
}
const rounded = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 4, r)

/** The dark of a wheel arch: a thin half disc over the wheel, flat to a body side facing ±z (`turn` it for one facing ±x). */
const ARCH = new CylinderGeometry(1, 1, 1, 28, 1, false, PI / 2, PI).rotateX(PI / 2)
function Arch({ at, r, turn = 0 }: { at: Vec3; r: number; turn?: number }) {
  return <mesh geometry={ARCH} material={ARCH_MAT} position={at} rotation={[0, turn, 0]} scale={[r, r, 0.02]} />
}
const ARCH_MAT = matteMaterial('#161616')

/** A wing mirror on a stalk, sticking out sideways along `s` (±1) of whichever axis the group puts it on. */
function Mirror({ s }: { s: number }) {
  return (
    <group>
      <mesh geometry={UNIT_BOX} material={MAT.black} position={[0, 0, s * 0.08]} scale={[0.03, 0.03, 0.16]} />
      <mesh geometry={MIRROR} material={MAT.black} position={[0, 0, s * 0.18]} />
    </group>
  )
}
const MIRROR = rounded(0.06, 0.18, 0.12, 0.025)

function Wheel({ at, r = 0.35, w = 0.22 }: { at: Vec3; r?: number; w?: number }) {
  return (
    <group position={at} rotation={[0, 0, PI / 2]}>
      <mesh geometry={DISC} material={MAT.rubber} scale={[r, w, r]} castShadow />
      <mesh geometry={DISC} material={MAT.steel} scale={[r * 0.55, w + 0.01, r * 0.55]} />
    </group>
  )
}

/** Wheel turned to roll along x (for vans built along x). */
function WheelX({ at, r = 0.36 }: { at: Vec3; r?: number }) {
  return (
    <group position={at} rotation={[PI / 2, 0, 0]}>
      <mesh geometry={DISC} material={MAT.rubber} scale={[r, 0.24, r]} castShadow />
      <mesh geometry={DISC} material={MAT.steel} scale={[r * 0.55, 0.25, r * 0.55]} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Hot dog van: built along z, cab to +z, hatch on the +x side
// ---------------------------------------------------------------------------

const CREAM = glossMaterial('#efe3c4')
const VAN_RED = glossMaterial('#c8242c')
const INSIDE = matteMaterial('#6d6a64')
const HATCH = { z0: -2.0, z1: 0.6, y0: 1.12, y1: 2.0 }

/** Vertical ribs pressed into the van's sides, like the old Citroën vans. */
const ribs = once(() => {
  const out: Placement[] = []
  for (let z = -2.4; z <= 1.0; z += 0.14) {
    // over the back wheel the ribs stop short at its arch
    const dz = Math.abs(z - VAN_ARCH.z)
    const y0 = dz < VAN_ARCH.r + 0.03 ? 0.35 + Math.sqrt(Math.max(0, (VAN_ARCH.r + 0.03) ** 2 - dz * dz)) : 0.49
    for (const x of [-1.005, 1.005]) out.push({ at: [x, (y0 + 1.11) / 2, z], scale: [0.03, 1.11 - y0, 0.05] })
  }
  return out
})
const VAN_ARCH = { z: -1.6, r: 0.44 }
const VAN_ROOF = rounded(2.04, 0.12, 3.58, 0.05)
const VAN_CAB = rounded(2.0, 1.5, 1.0, 0.14)
const VAN_NOSE = rounded(1.8, 0.75, 0.55, 0.16)
const VAN_BUMPER = rounded(1.9, 0.12, 0.12, 0.05)

const GAS_BOTTLE = lathe([[0.15, 0], [0.16, 0.05], [0.16, 0.7], [0.1, 0.8], [0.04, 0.84], [0, 0.84]], 18)
const SAUSAGE = lathe([[0, 0], [0.018, 0.01], [0.02, 0.05], [0.02, 0.13], [0.018, 0.17], [0, 0.18]], 10)

export function FoodVan({ mode = 'default' }: { mode?: 'default' | 'queue' | 'shut' }) {
  const { z0, z1, y0, y1 } = HATCH
  const hz = (z0 + z1) / 2
  const hl = z1 - z0
  return (
    <group>
      {/* the box body, built round a hatch in its +x side */}
      <Box size={[2.0, 0.7, 3.5]} at={[0, 0.8, -0.75]} material={CREAM} paint />
      <Box size={[0.04, 1.08, 3.5]} at={[-0.98, 1.69, -0.75]} material={CREAM} paint />
      <Box size={[0.04, 0.22, hl]} at={[0.98, 2.11, hz]} material={CREAM} paint />
      <Box size={[0.04, 1.08, 0.5]} at={[0.98, 1.69, -2.25]} material={CREAM} paint />
      <Box size={[0.04, 1.08, 0.4]} at={[0.98, 1.69, 0.8]} material={CREAM} paint />
      <Box size={[2.0, 1.08, 0.04]} at={[0, 1.69, -2.48]} material={CREAM} paint />
      <Shell geometry={VAN_ROOF} at={[0, 2.25, -0.75]} material={CREAM} paint />
      <Box size={[2.03, 0.16, 3.52]} at={[0, 0.98, -0.75]} material={VAN_RED} />
      <Instanced geometry={UNIT_BOX} material={CREAM} items={ribs()} castShadow />
      {/* inside: dim walls, a steel counter, a hotplate of sausages, rolls in a box */}
      <Box size={[0.02, 1.0, 3.3]} at={[-0.94, 1.6, -0.75]} material={INSIDE} />
      <Box size={[1.9, 0.02, 3.4]} at={[0, 2.18, -0.75]} material={INSIDE} />
      <Box size={[0.7, 0.06, hl - 0.2]} at={[0.55, y0 - 0.02, hz]} material={MAT.steel} />
      <Box size={[0.5, 0.05, 0.8]} at={[0.45, y0 + 0.02, hz - 0.5]} material={MAT.black} />
      {Array.from({ length: 6 }, (_, k) => (
        <mesh key={k} geometry={SAUSAGE} material={glossMaterial('#9a3f22')} position={[0.3 + (k % 2) * 0.15, y0 + 0.07, hz - 0.8 + Math.floor(k / 2) * 0.22]} rotation={[0, 0, PI / 2]} />
      ))}
      <Box size={[0.3, 0.18, 0.4]} at={[0.45, y0 + 0.08, hz + 0.5]} material={MAT.cardboard} />
      <SignBoard row={STALL_SIGNS.hotdogs} width={1.6} height={0.5} position={[-0.92, 1.72, hz]} rotation={[0, PI / 2, 0]} />
      {/* the serving shelf outside the hatch */}
      <Box size={[0.3, 0.04, hl]} at={[1.14, y0 - 0.02, hz]} material={MAT.steel} />
      {mode === 'shut' ? (
        <Box size={[0.04, y1 - y0, hl]} at={[1.0, (y0 + y1) / 2, hz]} material={CREAM} paint />
      ) : (
        // the flap, hinged at the top and propped up as an awning
        <group position={[1.0, y1, hz]} rotation={[0, 0, -1.2]}>
          <Box size={[0.04, y1 - y0, hl]} at={[0, -(y1 - y0) / 2, 0]} material={CREAM} paint />
        </group>
      )}
      {/* the cab: a short nose with round headlamps, the windscreen above */}
      <Shell geometry={VAN_CAB} at={[0, 1.2, 1.5]} material={CREAM} paint />
      <Box size={[1.66, 0.56, 0.2]} at={[0, 1.6, 1.98]} material={MAT.darkGlass} rot={[-0.12, 0, 0]} />
      <Shell geometry={VAN_NOSE} at={[0, 0.82, 2.2]} material={CREAM} paint />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={DISC} material={MAT.chrome} position={[s * 0.62, 0.95, 2.48]} rotation={[PI / 2, 0, 0]} scale={[0.12, 0.04, 0.12]} />
          <mesh geometry={DISC} material={matteMaterial('#fffbe0')} position={[s * 0.62, 0.95, 2.5]} rotation={[PI / 2, 0, 0]} scale={[0.09, 0.01, 0.09]} />
          <Box size={[0.03, 0.5, 0.7]} at={[s * 1.0, 1.56, 1.5]} material={MAT.darkGlass} />
          {/* the cab door: its seams and handle */}
          {[1.16, 1.84].map((z) => (
            <Box key={z} size={[0.012, 0.5, 0.015]} at={[s * 1.002, 1.05, z]} material={MAT.black} />
          ))}
          <Box size={[0.03, 0.04, 0.14]} at={[s * 1.012, 1.2, 1.3]} material={MAT.chrome} />
          <group position={[s * 0.98, 1.42, 1.9]} rotation={[0, PI / 2, 0]}>
            <Mirror s={s} />
          </group>
          {[-1.6, 1.6].map((z) => (
            <Arch key={z} at={[s * 1.022, 0.35, z]} r={VAN_ARCH.r} turn={PI / 2} />
          ))}
        </group>
      ))}
      {Array.from({ length: 7 }, (_, k) => (
        <Box key={k} size={[0.05, 0.4, 0.03]} at={[-0.3 + k * 0.1, 0.82, 2.48]} material={MAT.chrome} />
      ))}
      <Shell geometry={VAN_BUMPER} at={[0, 0.48, 2.5]} material={MAT.chrome} />
      <Box size={[1.9, 0.1, 0.08]} at={[0, 0.5, -2.53]} material={MAT.chrome} />
      {/* rear lights and a number plate */}
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.14, 0.2, 0.03]} at={[s * 0.8, 0.78, -2.51]} material={glossMaterial('#d0202a')} />
      ))}
      <Box size={[0.52, 0.12, 0.02]} at={[0, 0.66, -2.51]} material={glossMaterial('#f2d23a')} />
      {[-1.6, 1.6].flatMap((z) => [-1, 1].map((s) => <Wheel key={`${z}${s}`} at={[s * 0.9, 0.35, z]} />))}
      {/* the name on a frame on the roof, to the square */}
      <SignBoard row={STALL_SIGNS.hotdogs} width={2.6} height={0.42} position={[0.4, 2.62, -0.6]} rotation={[0, PI / 2, 0]} />
      <Box size={[0.04, 0.3, 0.04]} at={[0.38, 2.4, -1.6]} material={MAT.black} />
      <Box size={[0.04, 0.3, 0.04]} at={[0.38, 2.4, 0.4]} material={MAT.black} />
      {/* a gas bottle by the back wheel */}
      <mesh geometry={GAS_BOTTLE} material={glossMaterial('#e8a020')} position={[0.6, 0, -2.75]} castShadow />
      {mode === 'queue' &&
        // nobody was there a minute ago
        [1.7, 2.45, 3.2, 3.95].map((x, k) => (
          <group key={x} position={[x, 0, hz + 0.2 - (k % 2) * 0.15]} rotation={[0, -PI / 2, 0]}>
            <ShadowFigure height={1.72 + (k % 3) * 0.08} phase={k * 1.7} />
          </group>
        ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Coffee cart: a three-wheeler built along z, cab to +z, serving side +x
// ---------------------------------------------------------------------------

const TEAL = glossMaterial('#2f7a6a')
const GRINDER = lathe([[0.07, 0], [0.07, 0.2], [0.1, 0.32], [0.0, 0.34]], 16)
const CUP_STACK = lathe([[0, 0], [0.035, 0], [0.045, 0.1], [0, 0.1]], 12)

function Steam() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    g.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.25 + i / g.children.length) % 1
      c.position.y = t * 2.2
      c.position.x = Math.sin(i * 2.1 + t * 3) * 0.2 * t
      c.scale.setScalar(0.2 + t * 0.4)
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} geometry={BALL} material={STEAM} raycast={() => null} />
      ))}
    </group>
  )
}
const STEAM = new MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.45, depthWrite: false })

const CART_CAB = rounded(1.24, 1.0, 0.85, 0.2)
const CART_ROOF = rounded(1.28, 0.1, 0.92, 0.045)
const CART_TOP = rounded(1.44, 0.07, 1.68, 0.03)

export function CoffeeCart({ mode = 'default' }: { mode?: 'default' | 'steam' | 'cups' }) {
  return (
    <group>
      {/* the rear box with its hatch to +x */}
      <Box size={[1.36, 0.6, 1.6]} at={[0, 0.72, -0.45]} material={TEAL} paint />
      <Box size={[0.04, 0.7, 1.6]} at={[-0.66, 1.37, -0.45]} material={TEAL} paint />
      <Box size={[1.36, 0.7, 0.04]} at={[0, 1.37, -1.23]} material={TEAL} paint />
      <Shell geometry={CART_TOP} at={[0, 1.75, -0.45]} material={MAT.white} />
      <Box size={[1.3, 0.04, 1.5]} at={[0, 1.03, -0.45]} material={MAT.paleWood} />
      <Box size={[0.25, 0.04, 1.5]} at={[0.78, 1.03, -0.45]} material={MAT.paleWood} />
      {/* the hatch flap propped up over the counter */}
      <group position={[0.68, 1.72, -0.45]} rotation={[0, 0, -1.25]}>
        <Box size={[0.03, 0.65, 1.55]} at={[0, -0.33, 0]} material={TEAL} paint />
      </group>
      {/* espresso machine, grinder, cups */}
      <Box size={[0.45, 0.36, 0.5]} at={[-0.15, 1.23, -0.55]} material={MAT.chrome} />
      {[-0.12, 0.12].map((z) => (
        <mesh key={z} geometry={DISC} material={MAT.black} position={[0.12, 1.15, -0.55 + z]} rotation={[0, 0, PI / 2]} scale={[0.04, 0.1, 0.04]} />
      ))}
      <mesh geometry={GRINDER} material={MAT.black} position={[-0.1, 1.05, -0.0]} />
      {[0, 1, 2].map((k) => (
        <mesh key={k} geometry={CUP_STACK} material={MAT.white} position={[0.3, 1.05 + k * 0.04, -1.0 + k * 0.001]} scale={[1, 1, 1]} />
      ))}
      <SignBoard row={STALL_SIGNS.coffee} width={1.2} height={0.24} position={[0.0, 1.95, -0.45]} rotation={[0, PI / 2, 0]} />
      {/* the cab: a rounded nose, windscreen, single front wheel */}
      <Shell geometry={CART_CAB} at={[0, 1.0, 0.75]} material={TEAL} paint />
      <Box size={[0.96, 0.4, 0.05]} at={[0, 1.27, 1.17]} material={MAT.darkGlass} rot={[-0.15, 0, 0]} />
      <Shell geometry={CART_ROOF} at={[0, 1.55, 0.75]} material={MAT.white} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.03, 0.34, 0.5]} at={[s * 0.62, 1.22, 0.75]} material={MAT.darkGlass} />
          <group position={[s * 0.6, 1.2, 1.08]} rotation={[0, PI / 2, 0]}>
            <Mirror s={s} />
          </group>
          <Arch at={[s * 0.69, 0.22, -0.7]} r={0.28} turn={PI / 2} />
        </group>
      ))}
      <mesh geometry={DISC} material={MAT.chrome} position={[0, 0.85, 1.19]} rotation={[PI / 2, 0, 0]} scale={[0.1, 0.03, 0.1]} />
      <Wheel at={[0, 0.22, 0.8]} r={0.22} w={0.12} />
      {[-1, 1].map((s) => (
        <Wheel key={s} at={[s * 0.62, 0.22, -0.7]} r={0.22} w={0.12} />
      ))}
      {mode === 'steam' && (
        <group position={[0.2, 1.45, -0.65]}>
          <Steam />
        </group>
      )}
      {mode === 'cups' &&
        // a teetering tower of paper cups, far higher than the cart
        Array.from({ length: 26 }, (_, k) => (
          <mesh key={k} geometry={CUP_STACK} material={MAT.white} position={[0.3 + Math.sin(k * 0.4) * 0.02, 1.05 + k * 0.095, -0.7]} castShadow />
        ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Delivery van: built along x, cab to +x, back doors at -x
// ---------------------------------------------------------------------------

const VAN_WHITE = glossMaterial('#f2f2ef')
const BACK = { x: -2.6 }

const DV_CAB = rounded(1.2, 1.45, 1.96, 0.14)
const DV_BONNET = rounded(0.7, 0.62, 1.9, 0.15)
const DV_BUMPER = rounded(0.1, 0.25, 1.96, 0.04)

export function DeliveryVan({ ajar = false }: { ajar?: boolean }) {
  return (
    <group>
      {/* the load box: walls round a dim inside, so the back doors open onto something */}
      <Box size={[3.6, 0.08, 1.96]} at={[-0.8, 0.5, 0]} material={VAN_WHITE} paint />
      <Box size={[3.6, 2.0, 0.04]} at={[-0.8, 1.5, 0.98]} material={VAN_WHITE} paint />
      <Box size={[3.6, 2.0, 0.04]} at={[-0.8, 1.5, -0.98]} material={VAN_WHITE} paint />
      <Box size={[3.62, 0.08, 2.0]} at={[-0.8, 2.5, 0]} material={VAN_WHITE} paint />
      <Box size={[0.04, 2.0, 1.96]} at={[1.0, 1.5, 0]} material={VAN_WHITE} paint />
      <Box size={[3.5, 0.02, 1.88]} at={[-0.8, 2.44, 0]} material={matteMaterial('#5c5a56')} />
      <Box size={[3.5, 0.02, 1.88]} at={[-0.8, 0.55, 0]} material={matteMaterial('#4a4641')} />
      {/* parcels inside */}
      {[
        [-2.0, 0.3, 0.5],
        [-1.6, 0.25, -0.4],
        [-0.9, 0.35, 0.3],
        [-1.8, 0.62, 0.45],
      ].map(([x, h, z], i) => (
        <Box key={i} size={[0.5, h * 2, 0.5]} at={[x, 0.56 + h, z]} material={MAT.cardboard} rot={[0, i * 0.3, 0]} />
      ))}
      {/* the cab and bonnet */}
      <Shell geometry={DV_CAB} at={[1.6, 1.22, 0]} material={VAN_WHITE} paint />
      <Shell geometry={DV_BONNET} at={[2.45, 0.8, 0]} material={VAN_WHITE} paint />
      <Box size={[0.06, 0.74, 1.66]} at={[2.12, 1.58, 0]} material={MAT.darkGlass} rot={[0, 0, 0.45]} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.72, 0.48, 0.03]} at={[1.55, 1.56, s * 0.985]} material={MAT.darkGlass} />
          <Box size={[0.05, 0.12, 0.28]} at={[2.8, 0.88, s * 0.62]} material={matteMaterial('#fffbe0')} />
          <group position={[2.12, 1.42, s * 0.96]}>
            <Mirror s={s} />
          </group>
          {[-1.6, 1.9].map((x) => (
            <Arch key={x} at={[x, 0.36, s * 1.005]} r={0.45} />
          ))}
          <SignBoard row={STALL_SIGNS.parcels} width={2.8} height={0.44} position={[-0.8, 1.7, s * 1.0]} rotation={[0, s > 0 ? 0 : PI, 0]} />
        </group>
      ))}
      <Shell geometry={DV_BUMPER} at={[2.8, 0.6, 0]} material={MAT.black} />
      <Box size={[0.1, 0.2, 2.0]} at={[BACK.x - 0.02, 0.5, 0]} material={MAT.black} />
      {[-1.6, 1.9].flatMap((x) => [-1, 1].map((s) => <WheelX key={`${x}${s}`} at={[x, 0.36, s * 0.9]} />))}
      {/* the back doors, hinged at the corners */}
      {[-1, 1].map((s) => (
        <group key={s} position={[BACK.x, 0, s * 0.98]} rotation={[0, ajar ? s * 0.22 : 0, 0]}>
          <Box size={[0.04, 1.95, 0.96]} at={[0, 1.5, -s * 0.49]} material={VAN_WHITE} paint />
          <Box size={[0.05, 0.03, 0.12]} at={[-0.03, 1.4, -s * 0.85]} material={MAT.black} />
        </group>
      ))}
    </group>
  )
}
