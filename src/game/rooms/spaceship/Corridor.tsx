import { Block, Decoy, Item, PI, Variant } from '../../kit'
import { Model } from '../../Model'
import { BULKHEAD, CORRIDOR, SPACESHIP_BOUNDS } from './bounds'
import { Boots, DeckSign, Intercom, Pipe, VentFan, VentFrame, VentSock, VentTentacle } from './engine'
import { useGratingTexture, useHazardTexture, useHullWallTexture, usePanelTexture, type KeepClear } from './textures'

/*
 * The short corridor between the bridge and the engine room, and the two
 * bulkheads it runs through. Either side of the corridor is solid ship (store
 * rooms nobody can get into), so the player can only go through the doors.
 */

const H = SPACESHIP_BOUNDS.height
/** Half the length of the corridor plus its bulkheads: where each room's wall is. */
const OUTER = CORRIDOR.halfX + BULKHEAD
const SIDE = SPACESHIP_BOUNDS.halfZ - CORRIDOR.halfZ
const FRAME_DEPTH = BULKHEAD + 0.12
const POST = CORRIDOR.halfZ - CORRIDOR.door
/**
 * Patches of each side wall kept plain (metres from its left end, seen from
 * inside): behind the extinguisher and the vent on the -z side, the deck sign
 * and intercom on the +z side.
 */
const KEEP: Record<number, KeepClear[]> = {
  [-1]: [
    [0.05, 0.1, 0.65, 0.85],
    [1.35, 0.1, 1.95, 0.75],
  ],
  [1]: [
    [1.5, 1.55, 2.3, 2.05],
    [0.45, 1.2, 0.85, 1.7],
  ],
}

/**
 * The solid parts: a block of ship either side of the corridor (its faces are
 * the rooms' end walls and the corridor's side walls, drawn by each room) and
 * the door posts. Each is its own solid group so collision boxes stay tight.
 */
export function Bulkheads() {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} userData={{ solid: true }}>
          <mesh position={[0, H / 2, s * (CORRIDOR.halfZ + SIDE / 2)]}>
            <boxGeometry args={[OUTER * 2, H, SIDE]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((end) => (
        <DoorFrame key={end} x={end * (CORRIDOR.halfX + BULKHEAD / 2)} />
      ))}
    </>
  )
}

/** A sliding-door frame: posts, lintel, hazard stripes and the door track. */
function DoorFrame({ x }: { x: number }) {
  const stripes = useHazardTexture(1, 8)
  const height = CORRIDOR.doorHeight
  const frame = { color: '#6b747e', metalness: 0.8, roughness: 0.35 }
  return (
    <group position={[x, 0, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} userData={{ solid: true }}>
          <Block size={[FRAME_DEPTH, height, POST]} position={[0, height / 2, s * (CORRIDOR.door + POST / 2)]} {...frame} radius={0.02} />
          {/* stripes on the face either side of the opening */}
          <mesh position={[0, height / 2, s * (CORRIDOR.door - 0.002)]} rotation={[0, s > 0 ? PI : 0, 0]}>
            <planeGeometry args={[FRAME_DEPTH - 0.02, height - 0.02]} />
            <meshStandardMaterial map={stripes} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <Block size={[FRAME_DEPTH, H - height, CORRIDOR.halfZ * 2]} position={[0, (H + height) / 2, 0]} {...frame} radius={0.02} />
      {/* status lamps over the door, one each side */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (FRAME_DEPTH / 2 + 0.001), height + 0.2, 0]} rotation={[0, (s * PI) / 2, 0]}>
          <planeGeometry args={[0.3, 0.06]} />
          <meshBasicMaterial color="#5dff9a" toneMapped={false} />
        </mesh>
      ))}
      <Block size={[FRAME_DEPTH, 0.008, CORRIDOR.door * 2]} position={[0, 0.004, 0]} color="#16181c" metalness={0.8} roughness={0.4} radius={0.002} />
    </group>
  )
}

function CorridorShell() {
  const length = CORRIDOR.halfX * 2
  const width = CORRIDOR.halfZ * 2
  const floor = useGratingTexture((OUTER * 2) / 1.2, width / 1.2)
  const left = useHullWallTexture('#b3bdc8', length, H, 5, KEEP[-1])
  const right = useHullWallTexture('#b3bdc8', length, H, 9, KEEP[1])
  const ceiling = usePanelTexture('#8e98a4', (OUTER * 2) / 1.5, width / 1.5, 3)
  return (
    <>
      <mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[OUTER * 2, width]} />
        <meshStandardMaterial map={floor} metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[OUTER * 2, width]} />
        <meshStandardMaterial map={ceiling} metalness={0.5} roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, H / 2, s * CORRIDOR.halfZ]} rotation={[0, s > 0 ? PI : 0, 0]} receiveShadow>
          <planeGeometry args={[length, H]} />
          <meshStandardMaterial map={s > 0 ? right : left} metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} size={[length, 0.14, 0.03]} position={[0, 0.07, s * (CORRIDOR.halfZ - 0.015)]} color="#ffcc1a" roughness={0.6} radius={0.005} />
      ))}

      {/* cable trays and pipes running along the top, through both bulkheads */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[length, 0.06, 0.18]} position={[0, H - 0.16, s * (CORRIDOR.halfZ - 0.09)]} color="#59626c" metalness={0.7} roughness={0.4} radius={0.005} />
      ))}
      <Pipe from={[-OUTER, H - 0.08, -0.45]} to={[OUTER, H - 0.08, -0.45]} radius={0.04} />
      <Pipe from={[-OUTER, H - 0.08, 0.45]} to={[OUTER, H - 0.08, 0.45]} radius={0.04} />

      {/* ceiling light, which only needs to reach the walls */}
      <Block size={[0.98, 0.02, 0.3]} position={[0, H - 0.01, 0]} color="#59626c" metalness={0.7} roughness={0.4} radius={0.006} />
      <Block size={[0.9, 0.03, 0.22]} position={[0, H - 0.015, 0]} color="#e6f0ff" emissive="#e6f0ff" emissiveIntensity={2} radius={0.005} />
      <pointLight position={[0, H - 0.3, 0]} intensity={2.2} distance={3.2} decay={1.6} color="#e6f0ff" />
    </>
  )
}

export function Corridor() {
  return (
    <>
      <Bulkheads />
      <CorridorShell />

      <Item id="sign" position={[-0.7, 1.8, CORRIDOR.halfZ]} rotation={[0, PI, 0]}>
        <Block size={[0.64, 0.34, 0.02]} position={[0, 0, 0.01]} color="#16181c" metalness={0.6} roughness={0.4} radius={0.01} />
        <Variant of="sign" name="default">
          <DeckSign lost={false} />
        </Variant>
        <Variant of="sign" name="lost">
          <DeckSign lost />
        </Variant>
      </Item>

      <Item id="boots" position={[-0.3, 0, -0.55]}>
        <Variant of="boots" name="default">
          <Boots />
        </Variant>
        <Variant of="boots" name="ceiling">
          {/* stood upside down on the ceiling, magnets on */}
          {/* shifted into the clear patch between the pipe and the light, so nothing runs through them */}
          <group position={[-0.35, H, 0.3]} rotation={[0, 0, PI]}>
            <Boots />
          </group>
        </Variant>
      </Item>

      <Item id="vent" position={[0.45, 0.42, -CORRIDOR.halfZ]}>
        <VentFrame />
        <Variant of="vent" name="default">
          <VentFan spinning />
        </Variant>
        <Variant of="vent" name="tentacle">
          <VentFan spinning={false} />
          <VentTentacle />
        </Variant>
        <Variant of="vent" name="sock">
          <VentFan spinning={false} />
          <VentSock />
        </Variant>
      </Item>

      <Decoy label="fire extinguisher" position={[-0.85, 0, -0.66]} rotation={[0, PI / 2, 0]} solid round>
        <Model id="korean_fire_extinguisher_01" />
      </Decoy>
      <Decoy label="intercom" position={[0.55, 1.45, CORRIDOR.halfZ]} rotation={[0, PI, 0]}>
        <Intercom />
      </Decoy>
    </>
  )
}
