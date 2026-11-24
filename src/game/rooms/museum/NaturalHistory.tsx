import { useMemo } from 'react'
import { ConeGeometry, DoubleSide, MeshStandardMaterial, Object3D } from 'three'
import { useSurface } from '../../assets'
import { Block, Decoy, Instanced, Item, PanelLight, PI, Variant, type Placement } from '../../kit'
import type { Vec3 } from '../../mutations'
import { mulberry32 } from '../../rng'
import { Ammonite, EggNest, FishCase, InfoPanel, Meteorite, OwlDome, Pteranodon, Tusk, Tyrannosaur, WallCase } from './fossils'
import { boardTexture, floorTexture, panelTexture, SKETCH, trilobiteTexture, vinylTexture } from './natural'
import { Bench, DoorRope, Plinth } from './parts'
import { DOOR, NH, PARTY } from './plan'

/*
 * Gallery 7: natural history, through the left-hand doorway of the painting
 * gallery. Laid out in its own coordinates: the doorway from the paintings
 * is in the +x wall, and a roped-off doorway in the far (-x) wall shows the
 * next gallery along. A tyrannosaur strides down the middle towards you as
 * you come in, a pteranodon glides overhead, and the walls have the ice age,
 * the sea and outer space.
 */

const H = NH.height
const WALL = '#3c524c'
const { halfX: HX, halfZ: HZ } = NH

type WallName = 'back' | 'front' | 'far' | 'party'

/** A wall-hung thing in this gallery: which wall, how far along it, and how high. */
function onWall(wall: WallName, along: number, y: number): { position: Vec3; rotation: Vec3 } {
  switch (wall) {
    case 'back':
      return { position: [along, y, -HZ], rotation: [0, 0, 0] }
    case 'front':
      return { position: [along, y, HZ], rotation: [0, PI, 0] }
    case 'far':
      return { position: [-HX, y, along], rotation: [0, PI / 2, 0] }
    case 'party':
      return { position: [HX, y, along], rotation: [0, -PI / 2, 0] }
  }
}

/** A wall with a doorway in the middle, facing into the room, at x = `x` (normal `n`). */
function DoorWall({ x, n, shadows }: { x: number; n: 1 | -1; shadows?: boolean }) {
  const panel = HZ - DOOR.width / 2
  const plaster = useSurface('painted_plaster_wall', panel / 2, H / 2)
  const rot: Vec3 = [0, n * (PI / 2), 0]
  const trim = { color: '#e6e1d4', roughness: 0.6 }
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[x, H / 2, s * (DOOR.width / 2 + panel / 2)]} rotation={rot} receiveShadow castShadow={shadows}>
          <planeGeometry args={[panel, H]} />
          <meshStandardMaterial color={WALL} {...plaster} />
        </mesh>
      ))}
      <mesh position={[x, (H + DOOR.height) / 2, 0]} rotation={rot} castShadow={shadows}>
        <planeGeometry args={[DOOR.width, H - DOOR.height]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      {/* architrave */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, DOOR.height + 0.12, 0.12]} position={[x + n * 0.015, (DOOR.height + 0.12) / 2, s * (DOOR.width / 2 + 0.06)]} {...trim} />
      ))}
      <Block size={[0.03, 0.12, DOOR.width + 0.24]} position={[x + n * 0.015, DOOR.height + 0.06, 0]} {...trim} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.02, 0.14, panel - 0.12]} position={[x + n * 0.01, 0.07, s * (DOOR.width / 2 + 0.12 + (panel - 0.12) / 2)]} color="#1f2a27" roughness={0.6} />
      ))}
    </group>
  )
}

/** The wall shared with the painting gallery: solid either side of the doorway, so nobody walks through it. */
function PartyWall() {
  const side = HZ - DOOR.width / 2
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} userData={{ solid: true }}>
          <mesh position={[HX + PARTY / 2, H / 2, s * (DOOR.width / 2 + side / 2)]}>
            <boxGeometry args={[PARTY, H, side]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** A glimpse of the next gallery along through the far doorway: dim, with a mineral cabinet. */
function Glimpse() {
  const depth = 3
  const half = 2.2
  const x0 = -HX - PARTY
  const cx = x0 - depth / 2
  const far = x0 - depth
  const map = useMemo(() => panelTexture('MINERALS', ['Gallery 8', 'Rocks, gems and', 'crystals from', 'around the world']), [])
  return (
    <group>
      {/* the depth of the wall through the doorway, and its threshold */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[PARTY, DOOR.height, 0.02]} position={[-HX - PARTY / 2, DOOR.height / 2, s * (DOOR.width / 2 + 0.01)]} color={WALL} roughness={0.8} />
      ))}
      <Block size={[PARTY, 0.02, DOOR.width]} position={[-HX - PARTY / 2, DOOR.height + 0.01, 0]} color={WALL} roughness={0.8} />
      <Block size={[PARTY, 0.01, DOOR.width]} position={[-HX - PARTY / 2, 0.005, 0]} color="#8f887b" roughness={0.7} />
      <mesh position={[cx, 0, 0]} rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[depth, half * 2]} />
        <meshStandardMaterial color="#8d867a" roughness={0.6} />
      </mesh>
      <mesh position={[cx, H, 0]} rotation={[PI / 2, 0, 0]}>
        <planeGeometry args={[depth, half * 2]} />
        <meshStandardMaterial color="#dcd8cf" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[cx, H / 2, s * half]} rotation={[0, s === 1 ? PI : 0, 0]}>
          <planeGeometry args={[depth, H]} />
          <meshStandardMaterial color="#5a4a5e" />
        </mesh>
      ))}
      <mesh position={[far, H / 2, 0]} rotation={[0, PI / 2, 0]}>
        <planeGeometry args={[half * 2, H]} />
        <meshStandardMaterial color="#5a4a5e" />
      </mesh>
      <group position={[far, 1.55, -0.7]} rotation={[0, PI / 2, 0]}>
        <InfoPanel map={map} w={0.5} h={0.62} />
      </group>
      {/* a tall cabinet of drawers against the far wall */}
      <Block size={[0.5, 1.6, 1.2]} position={[far + 0.25, 0.8, 0.9]} color="#4a3322" roughness={0.55} />
      <Block size={[0.02, 0.5, 1.1]} position={[far + 0.51, 1.3, 0.9]} color="#a8b4b8" roughness={0.1} />
      {/* the rope across, just inside our side of the doorway */}
      <group position={[-HX - PARTY / 2, 0, 0]}>
        <DoorRope width={DOOR.width - 0.36} />
      </group>
    </group>
  )
}

function Shell() {
  const w = HX * 2
  const d = HZ * 2
  const floor = useMemo(() => floorTexture(w / 1.6, d / 1.6), [w, d])
  const plaster = useSurface('painted_plaster_wall', w / 2, H / 2)
  const sign = useMemo(() => vinylTexture('Gallery 7', 'Natural History'), [])
  return (
    <group>
      <mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floor} roughness={0.55} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#e9e6df" roughness={0.9} emissive="#e9e6df" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, H / 2, -HZ]} receiveShadow>
        <planeGeometry args={[w, H]} />
        <meshStandardMaterial color={WALL} {...plaster} />
      </mesh>
      <mesh position={[0, H / 2, HZ]} rotation={[0, PI, 0]} receiveShadow>
        <planeGeometry args={[w, H]} />
        <meshStandardMaterial color={WALL} {...plaster} />
      </mesh>
      <DoorWall x={-HX} n={1} />
      {/* the painting gallery's daylight would come straight through this wall: it casts shadow instead */}
      <DoorWall x={HX} n={-1} shadows />
      <PartyWall />
      <Glimpse />

      {/* skirting, a dado rail and the cornice round the long walls */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[w, 0.15, 0.02]} position={[0, 0.075, s * (HZ - 0.01)]} color="#1f2a27" roughness={0.6} />
          <Block size={[w, 0.04, 0.025]} position={[0, 0.95, s * (HZ - 0.0125)]} color="#d6cfbd" roughness={0.6} />
          <Block size={[w, 0.14, 0.06]} position={[0, H - 0.07, s * (HZ - 0.03)]} color="#ece8de" roughness={0.8} />
        </group>
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, 0.14, d]} position={[s * (HX - 0.03), H - 0.07, 0]} color="#ece8de" roughness={0.8} />
      ))}

      {/* hanging globe lamps down the middle */}
      {[-1.6, 1.6].map((x) => (
        <group key={x} position={[x, H, -1.6]}>
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.8, 4]} />
            <meshStandardMaterial color="#1c1c1c" />
          </mesh>
          <mesh position={[0, -0.92, 0]}>
            <sphereGeometry args={[0.16, 24, 16]} />
            <meshStandardMaterial color="#fff6e0" emissive="#ffe9c0" emissiveIntensity={1.4} />
          </mesh>
        </group>
      ))}

      <mesh {...onWall('party', 2.15, 2.0)}>
        <planeGeometry args={[1.28, 0.4]} />
        <meshStandardMaterial map={sign} transparent roughness={0.6} />
      </mesh>
    </group>
  )
}

function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      {/* one big soft panel: area lights are dear, and the hall's already reach in here */}
      <PanelLight position={[0, H - 0.05, 0]} size={[HX * 2 - 0.8, HZ * 2 - 1]} facing={[0, 0, 0]} color="#f3f0ea" intensity={2.6} />
      {/* a spot on the skeleton (no shadows: the hall has the one shadow caster) */}
      <primitive object={target} position={[-0.3, 1.4, 0]} />
      <spotLight position={[2.4, H - 0.1, 2.2]} target={target} angle={0.6} penumbra={0.8} intensity={9} decay={1.2} color="#fff3dc" />
    </>
  )
}

const PLINTH_TOP = 1.0

const CRYSTAL_GEO = new ConeGeometry(0.018, 0.07, 6)
const AMETHYST = new MeshStandardMaterial({ color: '#7a4aa8', roughness: 0.15, metalness: 0.1 })

/** Half a geode on a plinth, sawn face forward (+z), lined with amethyst. */
function Geode() {
  const crystals = useMemo(() => {
    const rng = mulberry32(23)
    const out: Placement[] = []
    for (let i = 0; i < 70; i++) {
      const a = rng() * PI * 2
      const r = Math.sqrt(rng()) * 0.12
      out.push({ at: [Math.cos(a) * r, 0.17 + Math.sin(a) * r * 0.85, 0.03 + (0.12 - r) * 0.4], rot: [PI / 2 - 0.4 * (rng() - 0.5), 0, (rng() - 0.5) * 0.8] })
    }
    return out
  }, [])
  return (
    <group position={[0, PLINTH_TOP, 0]}>
      <mesh position={[0, 0.17, 0]} scale={[1, 0.85, 0.7]} castShadow>
        <sphereGeometry args={[0.17, 24, 16, 0, PI]} />
        <meshStandardMaterial color="#6b625a" roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.17, 0.002]} scale={[1, 0.85, 1]}>
        <circleGeometry args={[0.165, 32]} />
        <meshStandardMaterial color="#cfc6b8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.17, 0.004]} scale={[1, 0.85, 1]}>
        <circleGeometry args={[0.135, 32]} />
        <meshStandardMaterial color="#3a2450" roughness={0.6} />
      </mesh>
      <Instanced geometry={CRYSTAL_GEO} material={AMETHYST} items={crystals} />
    </group>
  )
}

/** Everything in the natural history gallery, in its own coordinates. */
export function NaturalHistory() {
  const t = useMemo(
    () => ({
      board: { default: boardTexture('normal'), swapped: boardTexture('swapped'), sighted: boardTexture('sighted') },
      ice: panelTexture('ICE AGE GIANTS', ['Woolly mammoths roamed', 'Britain until about', '14,000 years ago. This', 'tusk was dredged from', 'the North Sea.'], SKETCH.mammoth),
      sea: panelTexture('AMMONITES', ['Relatives of the octopus', 'and squid, they lived in', 'coiled shells and swam', "the world's seas for 340", 'million years.'], SKETCH.ammonite),
      space: panelTexture('VISITORS FROM SPACE', ['This iron meteorite fell', 'in 1879. It is older', 'than the Earth itself.', 'Please do not touch.'], SKETCH.meteor),
      eggs: panelTexture('DINOSAUR EGGS', ['A clutch of eggs found', 'in the Gobi Desert,', 'laid 75 million years', 'ago and never hatched.'], SKETCH.egg),
      owl: panelTexture('BIRDS OF PREY', ['A long-eared owl,', 'stuffed in 1902. Owls', 'can turn their heads', 'three-quarters of the', 'way round.'], SKETCH.owl),
      trilobites: trilobiteTexture(),
    }),
    [],
  )
  return (
    <>
      <Lights />
      <Shell />

      {/* down the middle, striding off towards the far doorway */}
      <Item id="dino" position={[-0.3, 0, 0]} rotation={[0, PI, 0]}>
        {(['default', 'watching', 'wagging'] as const).map((v) => (
          <Variant key={v} of="dino" name={v}>
            <Tyrannosaur mode={v === 'default' ? 'normal' : v} />
          </Variant>
        ))}
      </Item>

      <Item id="ptero" position={[-0.8, 2.85, 2.2]}>
        {(['default', 'flapping'] as const).map((v) => (
          <Variant key={v} of="ptero" name={v}>
            <Pteranodon flapping={v === 'flapping'} wire={H - 2.85} />
          </Variant>
        ))}
      </Item>

      {/* back wall: the ice age, the fossil fish, trilobites and the owl */}
      <Item id="tusk" {...onWall('back', -1.2, 2.15)}>
        <Tusk />
      </Item>
      <Item id="fossil" position={[-1.2, 0, -HZ + 0.4]}>
        {(['default', 'swimming'] as const).map((v) => (
          <Variant key={v} of="fossil" name={v}>
            <FishCase mode={v === 'default' ? 'normal' : v} />
          </Variant>
        ))}
      </Item>
      <Decoy label="information panel" {...onWall('back', 0.45, 1.55)}>
        <InfoPanel map={t.ice} w={0.48} h={0.6} />
      </Decoy>
      <Decoy label="trilobite case" {...onWall('back', 1.5, 1.45)}>
        <WallCase map={t.trilobites} w={0.7} h={0.44} />
      </Decoy>
      <Decoy label="plinth" position={[2.7, 0, -HZ + 0.55]} solid>
        <Plinth />
      </Decoy>
      <Item id="owl" position={[2.7, PLINTH_TOP, -HZ + 0.55]} rotation={[0, -0.5, 0]}>
        {(['default', 'watching', 'hanging'] as const).map((v) => (
          <Variant key={v} of="owl" name={v}>
            <OwlDome mode={v === 'default' ? 'normal' : v} />
          </Variant>
        ))}
      </Item>
      <Decoy label="information panel" {...onWall('party', -2.2, 1.55)}>
        <InfoPanel map={t.owl} w={0.4} h={0.5} />
      </Decoy>
      <Decoy label="bench" position={[0.6, 0, -1.85]} solid>
        <Bench length={1.6} depth={0.5} />
      </Decoy>

      {/* front wall: the big board, the ammonite and the eggs */}
      <Item id="board" {...onWall('front', 0, 1.5)}>
        {(['default', 'swapped', 'sighted'] as const).map((v) => (
          <Variant key={v} of="board" name={v}>
            <InfoPanel map={t.board[v]} w={1.5} h={0.94} />
          </Variant>
        ))}
      </Item>
      <Decoy label="plinth" position={[-1.75, 0, HZ - 0.5]} solid>
        <Plinth />
      </Decoy>
      <Item id="ammonite" position={[-1.75, PLINTH_TOP, HZ - 0.5]} rotation={[0, PI - 0.5, 0]}>
        <Variant of="ammonite" name="default">
          <Ammonite alive={false} />
        </Variant>
        <Variant of="ammonite" name="alive">
          <Ammonite alive />
        </Variant>
      </Item>
      <Decoy label="information panel" {...onWall('front', -2.7, 1.5)}>
        <InfoPanel map={t.sea} w={0.4} h={0.5} />
      </Decoy>
      <Item id="eggs" position={[1.75, 0, HZ - 0.5]}>
        <Variant of="eggs" name="default">
          <EggNest mode="normal" />
        </Variant>
        <Variant of="eggs" name="hatched">
          <EggNest mode="hatched" />
        </Variant>
      </Item>
      <Decoy label="information panel" {...onWall('front', 2.7, 1.5)}>
        <InfoPanel map={t.eggs} w={0.4} h={0.5} />
      </Decoy>

      {/* far end: the meteorite one side of the doorway, a geode the other */}
      <Item id="meteorite" position={[-HX + 0.75, 0, 2.5]}>
        <Variant of="meteorite" name="default">
          <Meteorite glowing={false} />
        </Variant>
        <Variant of="meteorite" name="glowing">
          <Meteorite glowing />
        </Variant>
      </Item>
      <Decoy label="information panel" {...onWall('far', 1.6, 1.5)}>
        <InfoPanel map={t.space} w={0.4} h={0.5} />
      </Decoy>
      <Decoy label="geode" position={[-HX + 0.5, 0, -2.3]} rotation={[0, PI / 2, 0]} solid>
        <Plinth />
        <Geode />
      </Decoy>
    </>
  )
}
