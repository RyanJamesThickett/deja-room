import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import { type Group, type Mesh } from 'three'
import { Block, PanelLight, PI } from '../../kit'
import type { Vec3 } from '../../mutations'
import { Outside } from '../../outside'
import { wallGeometry } from '../../outsideLayers'
import { OFFICE } from './bounds'
import { OFFICE_DOOR_Z, OFFICE_DOORWAY, OFFICE_SPLIT, OFFICE_WINDOW, STREET_WINDOW, STREET_WINDOW_ALONG } from './layout'
import { keyParts, MUG_COLOURS, OFFICE_WALLS, visitorParts } from './officeParts'
import { carPosterTexture, carpetTexture, ceilingTileTexture, clockFaceTexture, crtTexture } from './officeTextures'
import { garageOutside, signTexture } from './textures'

/*
 * The office through the workshop's right-hand wall: reception counter under
 * the hatch, the boss's desk with its old computer, a filing cabinet, the
 * kettle corner and a window onto the forecourt. Furniture is built facing
 * +z (towards whoever uses it), standing on y = 0; wall-hung things have
 * their back on the wall at z = 0.
 */

const PAINT = '#e6dfcc'
const BEIGE = { color: '#d9d1bd', roughness: 0.55 }
const GREY_STEEL = { color: '#8e959a', metalness: 0.45, roughness: 0.45 }
const SKIRTING = 0.1

// ---------------------------------------------------------------------------
// The room itself
// ---------------------------------------------------------------------------

/** The solid wall blocks (see OFFICE_WALLS), painted on their edges where the openings show them. */
export function OfficeWalls() {
  return (
    <>
      {OFFICE_WALLS.map(({ at, size }, i) => (
        <group key={i} userData={{ solid: true }}>
          <mesh position={at} castShadow receiveShadow>
            <boxGeometry args={size} />
            <meshStandardMaterial color={PAINT} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** Floor, suspended ceiling, painted walls (with holes for the doorway, the hatch and the street window) and the light. */
export function OfficeShell() {
  const { x0, x1, z0, z1, ceiling: h } = OFFICE
  const w = x1 - x0
  const d = z1 - z0
  const carpet = useMemo(() => carpetTexture(w / 0.5, d / 0.5), [w, d])
  const tiles = useMemo(() => ceilingTileTexture(w / 0.6, d / 0.6), [w, d])
  const walls = useMemo(() => {
    // the partition's office face is turned to face +x, so its own x runs along -z
    const partition = wallGeometry(d, h, [
      { x0: -(OFFICE_DOOR_Z + OFFICE_DOORWAY.half) + (z0 + z1) / 2, x1: -(OFFICE_DOOR_Z - OFFICE_DOORWAY.half) + (z0 + z1) / 2, y0: -h / 2, y1: OFFICE_DOORWAY.height - h / 2 },
      {
        x0: -(OFFICE_WINDOW.z + OFFICE_WINDOW.width / 2) + (z0 + z1) / 2,
        x1: -(OFFICE_WINDOW.z - OFFICE_WINDOW.width / 2) + (z0 + z1) / 2,
        y0: OFFICE_WINDOW.y - OFFICE_WINDOW.height / 2 - h / 2,
        y1: OFFICE_WINDOW.y + OFFICE_WINDOW.height / 2 - h / 2,
      },
    ])
    // the front wall is turned round, so its x runs along -x
    const front = wallGeometry(w, h, [
      {
        x0: -(STREET_WINDOW.x + STREET_WINDOW.width / 2) + (x0 + x1) / 2,
        x1: -(STREET_WINDOW.x - STREET_WINDOW.width / 2) + (x0 + x1) / 2,
        y0: STREET_WINDOW.y - STREET_WINDOW.height / 2 - h / 2,
        y1: STREET_WINDOW.y + STREET_WINDOW.height / 2 - h / 2,
      },
    ])
    return { partition, front }
  }, [w, d, h, x0, x1, z0, z1])
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const paint = <meshStandardMaterial color={PAINT} roughness={0.85} />
  return (
    <>
      <mesh position={[cx, 0.001, cz]} rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={carpet} roughness={0.95} />
      </mesh>
      <mesh position={[cx, h, cz]} rotation={[PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={tiles} roughness={0.9} />
      </mesh>
      <mesh position={[x0, h / 2, cz]} rotation={[0, PI / 2, 0]} geometry={walls.partition} receiveShadow>
        {paint}
      </mesh>
      <mesh position={[x1, h / 2, cz]} rotation={[0, -PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
        {paint}
      </mesh>
      <mesh position={[cx, h / 2, z0]} receiveShadow>
        <planeGeometry args={[w, h]} />
        {paint}
      </mesh>
      <mesh position={[cx, h / 2, z1]} rotation={[0, PI, 0]} geometry={walls.front} receiveShadow>
        {paint}
      </mesh>
      {/* skirting round the room (broken by the doorway) */}
      <Block size={[0.015, SKIRTING, d]} position={[x1 - 0.0075, SKIRTING / 2, cz]} color="#f2efe6" roughness={0.5} radius={0.003} />
      <Block size={[w, SKIRTING, 0.015]} position={[cx, SKIRTING / 2, z0 + 0.0075]} color="#f2efe6" roughness={0.5} radius={0.003} />
      <Block size={[w, SKIRTING, 0.015]} position={[cx, SKIRTING / 2, z1 - 0.0075]} color="#f2efe6" roughness={0.5} radius={0.003} />
      <Block size={[0.015, SKIRTING, z1 - OFFICE_DOOR_Z - OFFICE_DOORWAY.half]} position={[x0 + 0.0075, SKIRTING / 2, (z1 + OFFICE_DOOR_Z + OFFICE_DOORWAY.half) / 2]} color="#f2efe6" roughness={0.5} radius={0.003} />
      {/* a twin-tube panel in the ceiling grid */}
      <Block size={[1.2, 0.02, 0.6]} position={[cx, h - 0.01, 0.5]} color="#ffffff" emissive="#f4f8ff" emissiveIntensity={1.6} radius={0.004} />
      <PanelLight position={[cx, h - 0.03, 0.5]} size={[1.2, 0.6]} facing={[cx, 0, 0.5]} color="#f4f6ff" intensity={4} />
    </>
  )
}

/** The window in the office's front wall, onto the forecourt: origin at its centre, facing into the office. */
export function StreetWindow() {
  const { width: w, height: h, y } = STREET_WINDOW
  const frame = { color: '#f2f0ea', roughness: 0.4 }
  return (
    <>
      <Outside layers={garageOutside()} y={y} along={STREET_WINDOW_ALONG} to={OFFICE_SPLIT} />
      <mesh position={[0, 0, 0.01]} renderOrder={2}>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      {/* white uPVC frame with a mullion, and a sill */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[w + 0.12, 0.06, 0.07]} position={[0, s * (h / 2 + 0.03), 0.035]} {...frame} />
          <Block size={[0.06, h, 0.07]} position={[s * (w / 2 + 0.03), 0, 0.035]} {...frame} />
        </group>
      ))}
      <Block size={[0.05, h, 0.06]} position={[0, 0, 0.03]} {...frame} />
      <Block size={[w + 0.2, 0.025, 0.16]} position={[0, -h / 2 - 0.07, 0.08]} {...frame} />
    </>
  )
}

/** Door frame round the doorway on the office side, origin at the bottom middle of the opening. */
export function OfficeArchitrave() {
  const { half, height } = OFFICE_DOORWAY
  const trim = { color: '#e8e6df', roughness: 0.5 }
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, height + 0.06, 0.02]} position={[s * (half + 0.03), (height + 0.06) / 2, 0.01]} {...trim} />
      ))}
      <Block size={[half * 2 + 0.12, 0.06, 0.02]} position={[0, height + 0.03, 0.01]} {...trim} />
    </>
  )
}

/** The office door, swung right open into the office. Origin at the hinge, the door running along +x; the workshop face is +z. */
export function OpenDoor() {
  const plaque = useMemo(() => signTexture('OFFICE', '#f4f1e8', '#1f4fa0'), [])
  const w = OFFICE_DOORWAY.half * 2 - 0.01
  return (
    <>
      <Block size={[w, 2.02, 0.045]} position={[w / 2, 1.015, 0]} color="#5c7184" roughness={0.5} radius={0.008} />
      {/* wired glass panel in the top half, both faces */}
      <Block size={[0.54, 0.64, 0.05]} position={[w / 2, 1.5, 0]} color="#3a3d40" roughness={0.6} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[w / 2, 1.5, s * 0.026]} rotation={[0, s > 0 ? 0 : PI, 0]}>
          <planeGeometry args={[0.48, 0.58]} />
          <meshStandardMaterial color="#b9c6cc" metalness={0.3} roughness={0.15} />
        </mesh>
      ))}
      <mesh position={[w / 2, 1.08, 0.024]}>
        <planeGeometry args={[0.3, 0.11]} />
        <meshStandardMaterial map={plaque} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.12, 0.03, 0.03]} position={[w - 0.1, 1.0, s * 0.04]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.01} />
      ))}
    </>
  )
}

/** The store room's door in the office's back wall, kept shut, with a hi-vis jacket on its hook. Origin at the bottom middle. */
export function StoreDoor() {
  const sign = useMemo(() => signTexture('STORE', '#f4f1e8', '#d8342c'), [])
  return (
    <>
      <Block size={[0.84, 2.0, 0.04]} position={[0, 1.0, 0.02]} color="#b9a07a" roughness={0.6} radius={0.006} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, 2.06, 0.03]} position={[s * 0.45, 1.03, 0.015]} color="#e8e6df" roughness={0.5} />
      ))}
      <Block size={[0.96, 0.06, 0.03]} position={[0, 2.06, 0.015]} color="#e8e6df" roughness={0.5} />
      <mesh position={[-0.17, 1.62, 0.041]}>
        <planeGeometry args={[0.24, 0.09]} />
        <meshStandardMaterial map={sign} roughness={0.5} />
      </mesh>
      <Block size={[0.03, 0.06, 0.06]} position={[-0.32, 1.0, 0.07]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.008} />
      {/* hi-vis on the hook */}
      <group position={[0.18, 1.82, 0.05]}>
        <Block size={[0.03, 0.03, 0.04]} color="#3a3d40" metalness={0.6} roughness={0.4} />
        <Block size={[0.4, 0.62, 0.05]} position={[0, -0.33, 0.02]} color="#d8f03a" roughness={0.8} radius={0.03} />
        {[-0.38, -0.5].map((y) => (
          <Block key={y} size={[0.405, 0.035, 0.052]} position={[0, y, 0.02]} color="#d9dde2" metalness={0.4} roughness={0.3} radius={0.005} />
        ))}
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Desk, computer, chair
// ---------------------------------------------------------------------------

/** Office desk along x with a drawer pedestal on the right; the user sits at +z. The computer's tower underneath. */
export function Desk({ length, depth, height }: { length: number; depth: number; height: number }) {
  const top = height - 0.015
  return (
    <>
      <Block size={[length, 0.03, depth]} position={[0, top, 0]} color="#a8845a" roughness={0.6} radius={0.006} />
      {/* drawer pedestal, a panel leg and the modesty panel */}
      <Block size={[0.42, top - 0.015, depth - 0.04]} position={[length / 2 - 0.23, (top - 0.015) / 2, 0]} {...GREY_STEEL} radius={0.006} />
      {[0.14, 0.38, 0.6].map((y) => (
        <Block key={y} size={[0.3, 0.02, 0.015]} position={[length / 2 - 0.23, y, depth / 2 - 0.01]} color="#3a3d40" roughness={0.5} radius={0.004} />
      ))}
      <Block size={[0.03, top - 0.015, depth - 0.04]} position={[-length / 2 + 0.03, (top - 0.015) / 2, 0]} {...GREY_STEEL} />
      <Block size={[length - 0.5, 0.4, 0.02]} position={[-0.2, top - 0.25, -depth / 2 + 0.05]} {...GREY_STEEL} />
      {/* the computer's tower under the desk */}
      <Block size={[0.19, 0.42, 0.44]} position={[-0.25, 0.21, -0.05]} {...BEIGE} radius={0.01} />
      <Block size={[0.12, 0.015, 0.01]} position={[-0.25, 0.36, 0.175]} color="#3a3d40" roughness={0.5} />
    </>
  )
}

/** On the desk, origin on its top at the middle (like the desk's): the phone and a pot of pens. */
export function DeskPhone() {
  return (
    <>
      <group position={[0.55, 0, -0.15]} rotation={[0, -0.3, 0]}>
        <Block size={[0.2, 0.05, 0.22]} position={[0, 0.025, 0]} {...BEIGE} radius={0.015} />
        <Block size={[0.22, 0.04, 0.06]} position={[0, 0.07, -0.05]} {...BEIGE} radius={0.018} />
      </group>
      <mesh position={[0.62, 0.05, 0.2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.1, 14]} />
        <meshStandardMaterial color="#1f4fa0" roughness={0.5} />
      </mesh>
      {[-0.01, 0.012].map((x, i) => (
        <mesh key={x} position={[0.62 + x, 0.13, 0.2 + x]} rotation={[0.15 * (i ? 1 : -1), 0, 0.1]}>
          <cylinderGeometry args={[0.004, 0.004, 0.13, 6]} />
          <meshStandardMaterial color={i ? '#d8342c' : '#111'} roughness={0.5} />
        </mesh>
      ))}
    </>
  )
}

/** A tray of job sheets on the desk, origin as for DeskPhone. */
export function JobTray() {
  return (
    <group position={[-0.55, 0, -0.12]}>
      <Block size={[0.26, 0.04, 0.34]} position={[0, 0.02, 0]} color="#2a2b2d" roughness={0.6} radius={0.004} />
      <Block size={[0.21, 0.025, 0.297]} position={[0, 0.045, 0]} color="#f4f2ea" roughness={0.9} radius={0.002} />
    </group>
  )
}

/** A beige CRT monitor and keyboard, the screen facing +z. `message`: it has something to tell you. */
export function OldComputer({ mode }: { mode: 'jobs' | 'message' }) {
  const screen = useMemo(() => crtTexture(mode), [mode])
  return (
    <>
      <Block size={[0.3, 0.035, 0.26]} position={[0, 0.0175, -0.05]} {...BEIGE} radius={0.01} paint />
      <Block size={[0.4, 0.35, 0.13]} position={[0, 0.215, 0.0]} {...BEIGE} radius={0.02} paint />
      <Block size={[0.32, 0.28, 0.24]} position={[0, 0.21, -0.17]} {...BEIGE} radius={0.03} paint />
      <mesh position={[0, 0.225, 0.066]}>
        <planeGeometry args={[0.3, 0.225]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <mesh position={[0.15, 0.06, 0.066]}>
        <circleGeometry args={[0.006, 10]} />
        <meshBasicMaterial color="#5dff7a" toneMapped={false} />
      </mesh>
      {/* keyboard, and a mouse on a mat */}
      <group position={[0, 0, 0.27]} rotation={[0.06, 0, 0]}>
        <Block size={[0.44, 0.03, 0.15]} position={[0, 0.015, 0]} {...BEIGE} radius={0.008} paint />
        <Block size={[0.4, 0.008, 0.11]} position={[0, 0.032, 0.005]} color="#bfb7a2" roughness={0.7} radius={0.002} />
      </group>
      <Block size={[0.2, 0.004, 0.17]} position={[0.34, 0.002, 0.26]} color="#1f4fa0" roughness={0.9} radius={0.001} />
      <Block size={[0.06, 0.03, 0.1]} position={[0.34, 0.019, 0.26]} {...BEIGE} radius={0.014} paint />
    </>
  )
}

/** Swivel office chair on a five-star base, the sitter facing +z. `spin`: it's turning on its own, round and round. */
export function SwivelChair({ spin = false }: { spin?: boolean }) {
  const top = useRef<Group>(null)
  useFrame((_, dt) => {
    if (spin && top.current) top.current.rotation.y += dt * 1.1
  })
  const black = { color: '#1d1e20', roughness: 0.6 }
  return (
    <>
      {Array.from({ length: 5 }, (_, k) => {
        const a = (k / 5) * PI * 2
        return (
          <group key={k} rotation={[0, a, 0]}>
            <Block size={[0.04, 0.035, 0.3]} position={[0, 0.085, 0.15]} {...black} radius={0.01} />
            <mesh position={[0, 0.03, 0.29]} rotation={[0, 0, PI / 2]}>
              <cylinderGeometry args={[0.028, 0.028, 0.03, 12]} />
              <meshStandardMaterial {...black} />
            </mesh>
          </group>
        )
      })}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.34, 12]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.8} roughness={0.3} />
      </mesh>
      <group ref={top}>
        <Block size={[0.48, 0.08, 0.46]} position={[0, 0.47, 0.02]} color="#2c3440" roughness={0.85} radius={0.035} />
        <Block size={[0.05, 0.36, 0.04]} position={[0, 0.6, -0.22]} rotation={[-0.15, 0, 0]} {...black} radius={0.01} />
        <Block size={[0.44, 0.5, 0.07]} position={[0, 0.85, -0.27]} rotation={[-0.1, 0, 0]} color="#2c3440" roughness={0.85} radius={0.035} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Block size={[0.03, 0.2, 0.03]} position={[s * 0.24, 0.58, 0.0]} {...black} radius={0.008} />
            <Block size={[0.06, 0.03, 0.26]} position={[s * 0.24, 0.69, 0.02]} {...black} radius={0.012} />
          </group>
        ))}
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Filing cabinet and the cat
// ---------------------------------------------------------------------------

const CAB = { width: 0.47, depth: 0.62, height: 1.32 }
const DRAWER_H = (CAB.height - 0.06) / 4

/** A ginger cat curled up asleep, nose to tail, breathing. Origin under its middle. */
function SleepingCat() {
  const body = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (body.current) body.current.scale.y = 0.085 * (1 + Math.sin(clock.elapsedTime * 2.2) * 0.06)
  })
  const fur = { color: '#d9822b', roughness: 0.95 }
  return (
    <group>
      <mesh ref={body} position={[0, 0.07, 0]} scale={[0.15, 0.085, 0.12]} castShadow>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial {...fur} />
      </mesh>
      {/* head tucked in at the front, ears up, eyes shut */}
      <group position={[0.07, 0.1, 0.09]} rotation={[0, 0.5, 0]}>
        <mesh scale={[0.065, 0.055, 0.06]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial {...fur} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.035, 0.05, -0.005]} rotation={[0, 0, -s * 0.3]}>
              <coneGeometry args={[0.02, 0.04, 4]} />
              <meshStandardMaterial {...fur} />
            </mesh>
            <mesh position={[s * 0.022, 0.012, 0.054]} rotation={[0, 0, s * 0.25]}>
              <boxGeometry args={[0.018, 0.003, 0.003]} />
              <meshBasicMaterial color="#2a1a0e" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.005, 0.06]}>
          <sphereGeometry args={[0.007, 8, 6]} />
          <meshStandardMaterial color="#e08a8a" roughness={0.6} />
        </mesh>
      </group>
      {/* the tail wrapped round the front */}
      <mesh position={[0, 0.03, 0.02]} rotation={[PI / 2, 0, 0.4]}>
        <torusGeometry args={[0.13, 0.022, 8, 24, PI * 0.9]} />
        <meshStandardMaterial {...fur} />
      </mesh>
      {/* tabby stripes over its back */}
      {[-0.08, -0.03, 0.02].map((x) => (
        <mesh key={x} position={[x, 0.145, -0.01]} rotation={[0, 0, x * 3]}>
          <boxGeometry args={[0.018, 0.012, 0.16]} />
          <meshStandardMaterial color="#9a5418" roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/** One drawer front with its handle and label holder, pulled `out` metres, and its insides (hanging files) if it is out. */
function CabinetDrawer({ y, out, children }: { y: number; out: number; children?: ReactNode }) {
  const { width: w, depth: d } = CAB
  return (
    <group position={[0, y, d / 2 + out]}>
      <Block size={[w - 0.02, DRAWER_H - 0.012, 0.02]} {...GREY_STEEL} radius={0.004} paint />
      <Block size={[0.16, 0.025, 0.03]} position={[0, -0.03, 0.02]} color="#c9ced6" metalness={0.9} roughness={0.25} radius={0.008} />
      <Block size={[0.08, 0.035, 0.005]} position={[0, 0.06, 0.012]} color="#f4f1e8" roughness={0.7} />
      {out > 0 && (
        <>
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.01, DRAWER_H - 0.06, out]} position={[s * (w / 2 - 0.03), -0.02, -out / 2 - 0.01]} {...GREY_STEEL} />
          ))}
          <Block size={[w - 0.06, 0.01, out]} position={[0, -DRAWER_H / 2 + 0.03, -out / 2 - 0.01]} {...GREY_STEEL} />
          {children ??
            Array.from({ length: Math.floor(out / 0.04) }, (_, k) => (
              <Block
                key={k}
                size={[w - 0.08, DRAWER_H - 0.1, 0.006]}
                position={[0, -0.03, -0.04 - k * 0.04]}
                color={['#3f7a4a', '#c99a3a', '#3f6aa8'][k % 3]}
                roughness={0.8}
                radius={0.001}
              />
            ))}
        </>
      )}
    </group>
  )
}

/**
 * Four-drawer steel filing cabinet, drawers to +z. `cat`: a drawer is open
 * and the cat's asleep in it. `stairs`: every drawer is pulled out, each
 * further than the one above, like a staircase.
 */
export function FilingCabinet({ mode }: { mode: 'normal' | 'cat' | 'stairs' }) {
  const { width: w, depth: d, height: h } = CAB
  const out = (i: number) => (mode === 'stairs' ? 0.1 + i * 0.1 : mode === 'cat' && i === 1 ? 0.42 : 0)
  return (
    <>
      <Block size={[w, h, d]} position={[0, h / 2, 0]} {...GREY_STEEL} radius={0.008} paint />
      {[0, 1, 2, 3].map((i) => (
        <CabinetDrawer key={i} y={h - 0.03 - DRAWER_H * (i + 0.5)} out={out(i)}>
          {mode === 'cat' && i === 1 ? (
            // piled up on the files, so it shows over the drawer's sides
            <group position={[0, -DRAWER_H / 2 + 0.1, -0.22]} scale={1.2}>
              <SleepingCat />
            </group>
          ) : undefined}
        </CabinetDrawer>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// On the walls: key board, clock, rally poster
// ---------------------------------------------------------------------------

const KEY_COLS = 5
const KEY_ROWS = 3
const KEY_HOOKS = Array.from({ length: KEY_COLS * KEY_ROWS }, (_, i) => ({
  i,
  x: -0.2 + (i % KEY_COLS) * 0.1,
  y: 0.08 - Math.floor(i / KEY_COLS) * 0.13,
}))
/** Hooks with keys on them (the rest are empty), the bunch that swings, and the one left when the rest have gone. */
const KEYED = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14]
const SWINGER = 7
const LAST = 12

/** A bunch of car keys on a hook: ring, key and fob, hanging straight down. */
function KeyBunch({ i, swing = false }: { i: number; swing?: boolean }) {
  const p = keyParts()
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (swing && ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 3.4) * 0.55
  })
  return (
    <group ref={ref}>
      <mesh geometry={p.ring} material={p.chrome} position={[0, -0.012, 0.03]} />
      <mesh geometry={p.blade} material={p.chrome} position={[0.004, -0.05, 0.03]} rotation={[0, 0, 0.12]} />
      <mesh geometry={p.fob} material={p.fobs[i % p.fobs.length]} position={[-0.008, -0.045, 0.034]} rotation={[0, 0, -0.1]} />
    </group>
  )
}

/** The board of customers' car keys, hooks in rows. `swing`: one bunch swings on its own. `gone`: all but one bunch have gone. */
export function KeyBoard({ mode }: { mode: 'normal' | 'swing' | 'gone' }) {
  const p = keyParts()
  const head = useMemo(() => signTexture('KEYS', '#1f4fa0', '#ffffff'), [])
  return (
    <>
      <Block size={[0.6, 0.5, 0.02]} position={[0, 0, 0.01]} color="#c9a46c" roughness={0.7} radius={0.006} />
      <mesh position={[0, 0.2, 0.021]}>
        <planeGeometry args={[0.24, 0.07]} />
        <meshStandardMaterial map={head} roughness={0.6} />
      </mesh>
      {KEY_HOOKS.map(({ i, x, y }) => {
        const keyed = mode === 'gone' ? i === LAST : KEYED.includes(i)
        return (
          <group key={i} position={[x, y, 0]}>
            <mesh geometry={p.hook} material={p.brass} position={[0, 0, 0.04]} rotation={[PI / 2, 0, 0]} />
            {keyed && <KeyBunch i={i} swing={mode === 'swing' && i === SWINGER} />}
          </group>
        )
      })}
    </>
  )
}

/**
 * Round office clock, origin at the back of its middle. It ticks normally, or
 * `backwards`: every hand running the wrong way round, fast.
 */
export function OfficeClock({ backwards }: { backwards: boolean }) {
  const face = useMemo(() => clockFaceTexture(), [])
  const hour = useRef<Group>(null)
  const minute = useRef<Group>(null)
  const second = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // ten past ten to start with; backwards, an hour goes by every six seconds
    const minutes = backwards ? 10 * 60 + 10 - t * 10 : 10 * 60 + 10 + t / 60
    const secs = backwards ? -t * 40 : Math.floor(t)
    if (hour.current) hour.current.rotation.z = -((minutes / 60) % 12) * (PI / 6)
    if (minute.current) minute.current.rotation.z = -(minutes % 60) * (PI / 30)
    if (second.current) second.current.rotation.z = -(secs % 60) * (PI / 30)
  })
  const hand = (len: number, width: number, z: number, color = '#111') => (
    <mesh position={[0, len / 2 - 0.015, z]}>
      <boxGeometry args={[width, len, 0.003]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
  return (
    <>
      <mesh position={[0, 0, 0.02]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 40]} />
        <meshStandardMaterial color="#1b1c1e" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.041]}>
        <circleGeometry args={[0.145, 40]} />
        <meshStandardMaterial map={face} roughness={0.5} />
      </mesh>
      <group ref={hour}>{hand(0.08, 0.012, 0.044)}</group>
      <group ref={minute}>{hand(0.12, 0.008, 0.047)}</group>
      <group ref={second}>{hand(0.13, 0.003, 0.05, '#d8342c')}</group>
      <mesh position={[0, 0, 0.052]}>
        <circleGeometry args={[0.008, 12]} />
        <meshBasicMaterial color="#d8342c" />
      </mesh>
    </>
  )
}

/** The rally poster, landscape, pinned up without a frame. `you`: see carPosterTexture. */
export function CarPoster({ mode }: { mode: 'car' | 'you' }) {
  const map = useMemo(() => carPosterTexture(mode), [mode])
  return (
    <>
      <mesh position={[0, 0, 0.005]} receiveShadow>
        <planeGeometry args={[0.9, 0.6]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <mesh key={`${sx}${sy}`} position={[sx * 0.43, sy * 0.28, 0.008]}>
            <circleGeometry args={[0.008, 10]} />
            <meshStandardMaterial color={sx * sy > 0 ? '#d8342c' : '#1f6bff'} roughness={0.4} />
          </mesh>
        )),
      )}
    </>
  )
}

/** A framed certificate, origin at the back of its middle. */
export function Certificate() {
  const map = useMemo(() => signTexture('MOT CENTRE', '#f4f1e8', '#1f4fa0'), [])
  return (
    <>
      <Block size={[0.44, 0.2, 0.02]} position={[0, 0, 0.01]} color="#2a2b2d" roughness={0.5} radius={0.004} />
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[0.38, 0.143]} />
        <meshStandardMaterial map={map} roughness={0.6} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// Kettle corner
// ---------------------------------------------------------------------------

/** Base units with a laminate worktop, along x, doors to +z. */
export function Worktop({ length, depth, height }: { length: number; depth: number; height: number }) {
  const doors = Math.round(length / 0.5)
  const dw = length / doors
  return (
    <>
      <Block size={[length, 0.08, depth - 0.06]} position={[0, 0.04, -0.03]} color="#2a2b2d" roughness={0.8} />
      <Block size={[length, height - 0.11, depth - 0.02]} position={[0, 0.08 + (height - 0.11) / 2, -0.01]} color="#f2f0ea" roughness={0.5} radius={0.004} />
      {Array.from({ length: doors }, (_, k) => (
        <group key={k} position={[-length / 2 + dw * (k + 0.5), 0, depth / 2 - 0.01]}>
          <Block size={[dw - 0.008, height - 0.13, 0.02]} position={[0, 0.08 + (height - 0.11) / 2, 0]} color="#f7f6f1" roughness={0.45} radius={0.004} />
          <Block size={[0.012, 0.12, 0.02]} position={[(k % 2 ? -1 : 1) * (dw / 2 - 0.05), height - 0.15, 0.015]} color="#9aa0a6" metalness={0.8} roughness={0.3} radius={0.004} />
        </group>
      ))}
      <Block size={[length + 0.02, 0.03, depth + 0.02]} position={[0, height - 0.015, 0]} color="#7a6f62" roughness={0.45} radius={0.006} />
    </>
  )
}

/** A jar of instant coffee, a bag of sugar and a pint of milk, origin on the worktop. */
export function TeaThings() {
  return (
    <>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.15, 18]} />
        <meshStandardMaterial color="#3a2010" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.047, 0.047, 0.025, 18]} />
        <meshStandardMaterial color="#d8342c" roughness={0.5} />
      </mesh>
      <Block size={[0.1, 0.14, 0.07]} position={[0.14, 0.07, 0.0]} color="#f4f1e8" roughness={0.9} radius={0.01} />
      <Block size={[0.08, 0.16, 0.08]} position={[-0.13, 0.08, 0.02]} color="#f6f8fa" roughness={0.4} radius={0.015} />
      <Block size={[0.03, 0.025, 0.03]} position={[-0.13, 0.17, 0.02]} color="#2fbf71" roughness={0.4} radius={0.008} />
    </>
  )
}

/** A wall socket's face plate, origin at its back. */
function Socket() {
  return (
    <>
      <Block size={[0.15, 0.09, 0.012]} position={[0, 0, 0.006]} color="#f4f4f0" roughness={0.4} radius={0.004} />
      {[-0.035, 0.035].map((x) => (
        <Block key={x} size={[0.012, 0.008, 0.004]} position={[x, 0.025, 0.013]} color="#9aa0a6" roughness={0.4} />
      ))}
    </>
  )
}

/** A rising puff of steam that loops: grows and fades as it climbs. */
function Puff({ delay }: { delay: number }) {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const t = ((clock.elapsedTime + delay) % 2) / 2
    m.position.set(Math.sin(t * 7 + delay) * 0.02, t * 0.35, 0)
    m.scale.setScalar(0.025 + t * 0.06)
    const mat = m.material as { opacity: number }
    mat.opacity = 0.5 * (1 - t)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} roughness={1} />
    </mesh>
  )
}

/**
 * Jug kettle on its base, the flex running back to the socket on the wall
 * behind (the wall is `toWall` metres behind its middle). `steam`: boiling
 * away, though its plug is lying on the worktop.
 */
export function Kettle({ steam, toWall }: { steam: boolean; toWall: number }) {
  const white = { color: '#f4f4f0', roughness: 0.35 }
  const plug: Vec3 = steam ? [0.16, 0.012, -0.12] : [0.12, 0.2, -toWall + 0.025]
  return (
    <>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.1, 0.105, 0.024, 24]} />
        <meshStandardMaterial color="#2a2b2d" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.135, 0]} castShadow userData={{ paint: true }}>
        <cylinderGeometry args={[0.075, 0.09, 0.22, 24]} />
        <meshStandardMaterial {...white} />
      </mesh>
      <mesh position={[0, 0.252, 0]} userData={{ paint: true }}>
        <cylinderGeometry args={[0.06, 0.076, 0.018, 24]} />
        <meshStandardMaterial {...white} />
      </mesh>
      {/* spout at the front, handle at the back */}
      <mesh position={[0, 0.22, 0.085]} rotation={[0.5, 0, 0]} userData={{ paint: true }}>
        <cylinderGeometry args={[0.012, 0.03, 0.06, 4]} />
        <meshStandardMaterial {...white} />
      </mesh>
      <Block size={[0.035, 0.2, 0.03]} position={[0, 0.15, -0.115]} {...white} radius={0.012} paint />
      <Block size={[0.035, 0.03, 0.05]} position={[0, 0.245, -0.09]} {...white} radius={0.012} paint />
      <Block size={[0.04, 0.08, 0.012]} position={[0, 0.12, 0.08]} rotation={[-0.1, 0, 0]} color="#8fc8e8" roughness={0.2} radius={0.004} />
      {/* flex from the base to the plug */}
      <Block size={[0.008, 0.008, Math.hypot(plug[0], plug[2] + 0.1)]} position={[plug[0] / 2, 0.008, (plug[2] - 0.1) / 2]} rotation={[0, Math.atan2(plug[0], plug[2] + 0.1), 0]} color="#f4f4f0" roughness={0.5} radius={0.003} />
      {!steam && <Block size={[0.008, plug[1], 0.008]} position={[plug[0], plug[1] / 2, plug[2]]} color="#f4f4f0" roughness={0.5} radius={0.003} />}
      <group position={[0.12, 0.2, -toWall]}>
        <Socket />
      </group>
      <Block size={[0.05, 0.045, 0.03]} position={plug} color="#f4f4f0" roughness={0.4} radius={0.006} />
      {steam && (
        <group position={[0, 0.27, 0.1]}>
          {[0, 0.5, 1, 1.5].map((d) => (
            <Puff key={d} delay={d} />
          ))}
        </group>
      )}
    </>
  )
}

/** One mug, handle to +x. */
function Mug({ colour }: { colour: string }) {
  return (
    <>
      <mesh position={[0, 0.048, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.04, 0.096, 20, 1, true]} />
        <meshStandardMaterial color={colour} roughness={0.35} side={2} />
      </mesh>
      <mesh position={[0, 0.004, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.008, 20]} />
        <meshStandardMaterial color={colour} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-PI / 2, 0, 0]}>
        <circleGeometry args={[0.039, 20]} />
        <meshStandardMaterial color="#3b2412" roughness={0.3} />
      </mesh>
      <mesh position={[0.05, 0.05, 0]}>
        <torusGeometry args={[0.024, 0.007, 8, 16, PI]} />
        <meshStandardMaterial color={colour} roughness={0.35} />
      </mesh>
    </>
  )
}

/** Mugs by the kettle, origin on the worktop. `tower`: every mug in the office stacked up in one wobbly tower. */
export function Mugs({ tower }: { tower: boolean }) {
  const spots: { at: Vec3; turn: number }[] = tower
    ? MUG_COLOURS.map((_, i) => ({ at: [0.02 * Math.sin(i * 2.1), i * 0.1, 0.02 * Math.cos(i * 1.7)], turn: i * 1.3 }))
    : [
        { at: [0, 0, 0], turn: 0.3 },
        { at: [0.12, 0, 0.04], turn: -0.6 },
        { at: [0.05, 0, 0.14], turn: 2.2 },
      ]
  return (
    <>
      {spots.map(({ at, turn }, i) => (
        <group key={i} position={at} rotation={[0, turn, 0]}>
          <Mug colour={MUG_COLOURS[i]} />
        </group>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Reception counter, waiting seats, bin
// ---------------------------------------------------------------------------

/** The reception counter under the hatch, along x, the staff side at +z: card machine, receipts on a spike. */
export function Counter({ length, depth, height }: { length: number; depth: number; height: number }) {
  return (
    <>
      <Block size={[length, height - 0.03, depth - 0.03]} position={[0, (height - 0.03) / 2, -0.015]} color="#3f5f86" roughness={0.55} radius={0.006} />
      <Block size={[length + 0.02, 0.03, depth]} position={[0, height - 0.015, 0]} color="#d9d4c6" roughness={0.45} radius={0.006} />
      <Block size={[length - 0.1, 0.03, 0.3]} position={[0, 0.4, 0.0]} color="#2f4a6a" roughness={0.6} />
      <group position={[0.45, height, 0.05]} rotation={[0, -0.4, 0]}>
        <Block size={[0.08, 0.03, 0.16]} position={[0, 0.015, 0]} color="#1b1c1e" roughness={0.5} radius={0.01} />
        <Block size={[0.06, 0.003, 0.05]} position={[0, 0.031, -0.03]} color="#2fbf71" roughness={0.3} />
      </group>
      <group position={[-0.5, height, 0.08]}>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 14]} />
          <meshStandardMaterial color="#1b1c1e" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.002, 0.002, 0.16, 6]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
        </mesh>
        {[0.03, 0.045, 0.06, 0.075].map((y, i) => (
          <mesh key={y} position={[0, y, 0]} rotation={[-PI / 2, 0, i * 0.6]}>
            <planeGeometry args={[0.07, 0.11]} />
            <meshStandardMaterial color="#f4f2ea" roughness={0.9} side={2} />
          </mesh>
        ))}
      </group>
    </>
  )
}

/** Two moulded plastic seats on a steel beam, facing +z. */
export function WaitingSeats() {
  const shell = { color: '#2f6fb0', roughness: 0.4 }
  return (
    <>
      <Block size={[1.0, 0.05, 0.05]} position={[0, 0.38, -0.05]} color="#3a3d40" metalness={0.6} roughness={0.4} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[0.05, 0.38, 0.05]} position={[s * 0.4, 0.19, -0.05]} color="#3a3d40" metalness={0.6} roughness={0.4} />
          <Block size={[0.05, 0.02, 0.42]} position={[s * 0.4, 0.01, -0.05]} color="#3a3d40" metalness={0.6} roughness={0.4} />
          <Block size={[0.44, 0.04, 0.42]} position={[s * 0.24, 0.43, 0.0]} {...shell} radius={0.018} />
          <Block size={[0.42, 0.4, 0.04]} position={[s * 0.24, 0.66, -0.2]} rotation={[-0.12, 0, 0]} {...shell} radius={0.018} />
        </group>
      ))}
    </>
  )
}

/** A wire-mesh office bin with crumpled paper in it. */
export function OfficeBin() {
  return (
    <>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.11, 0.3, 20, 1, true]} />
        <meshStandardMaterial color="#2a2b2d" metalness={0.5} roughness={0.5} side={2} wireframe />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.01, 20]} />
        <meshStandardMaterial color="#2a2b2d" roughness={0.5} />
      </mesh>
      {[
        [0.03, 0.06, 0.02],
        [-0.04, 0.09, -0.03],
        [0.0, 0.14, -0.01],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[0.05, 0]} />
          <meshStandardMaterial color="#f4f2ea" roughness={0.9} flatShading />
        </mesh>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Outside the roller door
// ---------------------------------------------------------------------------

/**
 * Someone standing right outside, facing the door, only their legs showing
 * under it: work trousers and boots, quite still. Feet at the origin, facing
 * +z; it stands beyond the wall, so it takes up no room in the layout.
 */
export function Visitor() {
  const p = visitorParts()
  return (
    <>
      <mesh geometry={p.shadow} material={p.shade} position={[0, 0.003, 0.02]} rotation={[-PI / 2, 0, 0]} scale={[0.3, 0.22, 1]} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.11, 0, 0]} rotation={[0, s * 0.12, 0]}>
          <mesh geometry={p.leg} material={p.trousers} position={[0, 0.56, 0]} castShadow />
          <mesh geometry={p.ankle} material={p.leather} position={[0, 0.11, -0.02]} />
          <mesh geometry={p.boot} material={p.leather} position={[0, 0.065, 0.05]} scale={[0.058, 0.055, 0.135]} />
          <mesh geometry={p.sole} material={p.rubber} position={[0, 0.015, 0.03]} />
        </group>
      ))}
    </>
  )
}
