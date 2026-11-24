import { Environment } from '@react-three/drei'
import { memo, useMemo } from 'react'
import { Object3D } from 'three'
import { useSurface } from '../../assets'
import { Block, Decoy, Item, PanelLight, PI, Variant, Wallpaper } from '../../kit'
import { Model } from '../../Model'
import type { Vec3 } from '../../mutations'
import { Hover } from '../living/oddities'
import { NaturalHistory } from './NaturalHistory'
import {
  Barrier,
  Bench,
  ClimbingSitter,
  Colossus,
  DomeCamera,
  DoorRope,
  DonationBox,
  Drip,
  ExitSign,
  GallerySign,
  GuardCap,
  GuardChair,
  LoanPlinth,
  Notice,
  Painting,
  PictureLight,
  Plaque,
  Plinth,
  Skylight,
  SkylightCoffer,
  TableCase,
  Vitrine,
  WatchingEyes,
  YawToYou,
} from './parts'
import { BENCH, CANVAS, COLOSSUS, DOOR, FRAME, FRAME_DEPTH, HALL as B, HALL_X, NH_X, PLINTH } from './plan'
import { flowersTexture, miniLandscapeTexture, pastureTexture, SITTERS } from './salon'
import {
  abstractTexture,
  ADMIRAL,
  botanicalTexture,
  DUCHESS,
  GENTLEMAN,
  LADY,
  landscapeTexture,
  plaqueTexture,
  portraitTexture,
  riverTexture,
  seascapeTexture,
  stillLifeTexture,
} from './textures'

/*
 * Gallery 6 of a perfectly ordinary city museum.
 *
 * You come in by the right-hand door, past the guard's chair and the
 * donations box. The long back wall is papered in deep red damask and hung
 * with the star painting, a pastoral landscape, between a portrait and a
 * still life; the bench in the middle of the floor faces it. The front wall
 * has smaller works with sculpture on plinths between them, and a glass case
 * in the corner. A colossal marble head stands roped off in the left half,
 * the table case of Roman finds in the right half, and the far doorway leads
 * on to the natural history gallery under its exit sign (NaturalHistory.tsx).
 * The doorway you came in by is roped off. Overhead, a frosted laylight.
 * Round the big pictures, smaller ones are hung salon-style.
 */

const H = B.height
const WALL = '#d9d3c5'
const SKY = { w: 6, d: 2.8 }

/** Wall-hung things: where on which wall, as an item/decoy position and rotation. */
function onWall(wall: 'back' | 'front' | 'left' | 'right', along: number, y: number): { position: Vec3; rotation: Vec3 } {
  switch (wall) {
    case 'back':
      return { position: [along, y, -B.halfZ], rotation: [0, 0, 0] }
    case 'front':
      return { position: [along, y, B.halfZ], rotation: [0, PI, 0] }
    case 'left':
      return { position: [-B.halfX, y, along], rotation: [0, PI / 2, 0] }
    case 'right':
      return { position: [B.halfX, y, along], rotation: [0, -PI / 2, 0] }
  }
}

/** Labels beside each painting: which wall, how far along, and what it says. */
const PLAQUES: { wall: 'back' | 'front' | 'left'; along: number; y: number; text: [string, string, string] }[] = [
  { wall: 'back', along: -1.73, y: 1.35, text: ['Man in Black', 'Unknown', 'Oil on canvas, 1630'] },
  { wall: 'back', along: 1.24, y: 1.3, text: ['Arcadia, Evening', 'J. Constable-ish', 'Oil on canvas, 1821'] },
  { wall: 'back', along: 3.12, y: 1.35, text: ['Still Life, Apples', 'Dutch School', 'Oil on panel, 1660'] },
  { wall: 'front', along: -3.3, y: 1.4, text: ['Squall off the Point', 'W. Turner-ish', 'Oil on canvas, 1840'] },
  { wall: 'front', along: -0.42, y: 1.4, text: ['Composition No. 9', 'P. Mondriaan-ish', 'Oil on canvas, 1929'] },
  { wall: 'front', along: 2.5, y: 1.4, text: ['Rosa improbabilis', 'Botanical plate', 'Watercolour, 1790'] },
  { wall: 'front', along: -4.65, y: 1.4, text: ['The River at Dusk', 'Anonymous', 'Oil on canvas, 1802'] },
  { wall: 'left', along: -3.04, y: 1.4, text: ['Lady in Blue', 'Studio of Vermeer', 'Oil on canvas, 1665'] },
]

/** Paintings that get a brass picture light: wall, x along it, top of the frame. */
const LIT: { wall: 'back' | 'front'; along: number; top: number; width: number }[] = [
  { wall: 'back', along: -2.4, top: 1.65 + CANVAS.portrait[1] / 2 + FRAME, width: 0.6 },
  { wall: 'back', along: 0, top: 1.8 + CANVAS.landscape[1] / 2 + FRAME, width: 1.2 },
  { wall: 'back', along: 2.4, top: 1.6 + CANVAS.stillLife[1] / 2 + FRAME, width: 0.6 },
  { wall: 'front', along: -2.4, top: 1.7 + CANVAS.seascape[1] / 2 + FRAME, width: 0.9 },
]

/** One end wall with its doorway, built from the panels either side and the lintel over it. */
function EndWall({ side, open }: { side: 1 | -1; open?: boolean }) {
  const x = side * B.halfX
  const panel = B.halfZ - DOOR.width / 2
  const plaster = useSurface('painted_plaster_wall', panel / 2, H / 2)
  const rot: Vec3 = [0, -side * (PI / 2), 0]
  const jamb = 0.3
  const trim = { color: '#efebe2', roughness: 0.6 }
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[x, H / 2, s * (DOOR.width / 2 + panel / 2)]} rotation={rot} receiveShadow>
          <planeGeometry args={[panel, H]} />
          <meshStandardMaterial color={WALL} {...plaster} />
        </mesh>
      ))}
      <mesh position={[x, (H + DOOR.height) / 2, 0]} rotation={rot}>
        <planeGeometry args={[DOOR.width, H - DOOR.height]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      {/* the depth of the wall through the doorway */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[jamb, DOOR.height, 0.02]} position={[x + side * (jamb / 2), DOOR.height / 2, s * (DOOR.width / 2 + 0.01)]} color={WALL} roughness={0.8} />
      ))}
      <Block size={[jamb, 0.02, DOOR.width]} position={[x + side * (jamb / 2), DOOR.height + 0.01, 0]} color={WALL} roughness={0.8} />
      {/* stone threshold */}
      <Block size={[jamb, 0.01, DOOR.width]} position={[x + side * (jamb / 2), 0.005, 0]} color="#b8b2a6" roughness={0.7} />
      {/* architrave */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.03, DOOR.height + 0.12, 0.12]} position={[x - side * 0.015, (DOOR.height + 0.12) / 2, s * (DOOR.width / 2 + 0.06)]} {...trim} />
      ))}
      <Block size={[0.03, 0.12, DOOR.width + 0.24]} position={[x - side * 0.015, DOOR.height + 0.06, 0]} {...trim} />
      {/* skirting either side of the doorway */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.02, 0.14, panel - 0.12]} position={[x - side * 0.01, 0.07, s * (DOOR.width / 2 + 0.12 + (panel - 0.12) / 2)]} color="#3a2e26" roughness={0.6} />
      ))}
      {!open && (
        <>
          <NextGallery side={side} />
          {/* roped off: this way is closed */}
          <group position={[x + side * (jamb / 2), 0, 0]}>
            <DoorRope width={DOOR.width - 0.36} />
          </group>
        </>
      )}
    </group>
  )
}

/** A glimpse of the neighbouring gallery through a doorway. */
function NextGallery({ side }: { side: 1 | -1 }) {
  const depth = 3.2
  const half = 2.2
  const x0 = side * (B.halfX + 0.3)
  const cx = x0 + side * (depth / 2)
  const far = x0 + side * depth
  const map = useMemo(() => portraitTexture(ADMIRAL, 'normal', 352, 448), [])
  return (
    <group>
      <mesh position={[cx, 0, 0]} rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[depth, half * 2]} />
        <meshStandardMaterial color="#5e432c" roughness={0.6} />
      </mesh>
      <mesh position={[cx, H, 0]} rotation={[PI / 2, 0, 0]}>
        <planeGeometry args={[depth, half * 2]} />
        <meshStandardMaterial color="#e9e6e0" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[cx, H / 2, s * half]} rotation={[0, s === 1 ? PI : 0, 0]}>
          <planeGeometry args={[depth, H]} />
          <meshStandardMaterial color="#b9c1bd" />
        </mesh>
      ))}
      <mesh position={[far, H / 2, 0]} rotation={[0, -side * (PI / 2), 0]}>
        <planeGeometry args={[half * 2, H]} />
        <meshStandardMaterial color="#b9c1bd" />
      </mesh>
      <group position={[far, 1.6, 0.6]} rotation={[0, -side * (PI / 2), 0]}>
        <Painting w={0.55} h={0.7} map={map} />
      </group>
    </group>
  )
}

function Shell() {
  const { halfX, halfZ } = B
  const w = halfX * 2
  const d = halfZ * 2
  const floor = useSurface('herringbone_parquet', w / 2, d / 2)
  const plaster = useSurface('painted_plaster_wall', w / 2, H / 2)
  const plaques = useMemo(() => PLAQUES.map((p) => ({ ...p, map: plaqueTexture(...p.text) })), [])
  return (
    <group>
      <mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial {...floor} roughness={0.75} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[w, d]} />
        {/* faintly self-lit: stands in for light bounced up off the floor */}
        <meshStandardMaterial color="#f1efea" roughness={0.9} emissive="#f1efea" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, H / 2, -halfZ]} receiveShadow>
        <planeGeometry args={[w, H]} />
        <meshStandardMaterial color="#5b1f2e" />
      </mesh>
      <mesh position={[0, H / 2, halfZ]} rotation={[0, PI, 0]} receiveShadow>
        <planeGeometry args={[w, H]} />
        <meshStandardMaterial color={WALL} {...plaster} />
      </mesh>
      {/* the left-hand doorway opens into the natural history gallery */}
      <EndWall side={-1} open />
      <EndWall side={1} />

      {/* the long back wall is papered in damask, between the skirting and the cornice */}
      <Wallpaper kind="damask" width={w} height={H - 0.3} position={[0, 0.15 + (H - 0.3) / 2, -halfZ]} />

      {/* skirting and cornice round the long walls */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[w, 0.15, 0.02]} position={[0, 0.075, s * (halfZ - 0.01)]} color="#3a2e26" roughness={0.6} />
          <Block size={[w, 0.14, 0.06]} position={[0, H - 0.07, s * (halfZ - 0.03)]} color="#f1efea" roughness={0.8} />
        </group>
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, 0.14, d]} position={[s * (halfX - 0.03), H - 0.07, 0]} color="#f1efea" roughness={0.8} />
      ))}

      {/* the laylight's coffer, and a lighting track along each long wall */}
      <group position={[0, H, 0]}>
        <SkylightCoffer w={SKY.w} d={SKY.d} />
      </group>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, H - 0.02, s * 2.7]}>
          <Block size={[8.6, 0.03, 0.05]} color="#1c1c1c" roughness={0.5} />
          {[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].map((x) => (
            <mesh key={x} position={[x, -0.08, s * 0.05]} rotation={[s * 0.6, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.03, 0.13, 16]} />
              <meshStandardMaterial color="#1c1c1c" roughness={0.4} emissive="#fff1d0" emissiveIntensity={0.05} />
            </mesh>
          ))}
        </group>
      ))}

      {plaques.map((p, i) => (
        <group key={i} {...onWall(p.wall, p.along, p.y)}>
          <Plaque map={p.map} />
        </group>
      ))}
      {LIT.map((l, i) => (
        <group key={i} {...onWall(l.wall, l.along, l.top)}>
          <PictureLight width={l.width} />
        </group>
      ))}
    </group>
  )
}

function Lights() {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      <Environment files="/hdri/lythwood_lounge.hdr" environmentIntensity={0.3} />
      <hemisphereLight args={['#fffaf0', '#5a4a3a', 0.45]} />
      <primitive object={target} position={[0, 0, 0]} />
      {/* daylight through the laylight: the one shadow caster */}
      <spotLight
        position={[0, H - 0.05, 0]}
        target={target}
        angle={1.25}
        penumbra={1}
        intensity={7}
        decay={1.3}
        color="#f5f8ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
      />
      {[-1, 1].map((s) => (
        <PanelLight key={s} position={[s * (SKY.w / 4), H - 0.05, 0]} size={[SKY.w / 2, SKY.d]} facing={[s * (SKY.w / 4), 0, 0]} color="#f2f5ff" intensity={3} />
      ))}
      {/* the wall-washers on the tracks */}
      {[-1, 1].map((s) => (
        <PanelLight key={s} position={[0, H - 0.12, s * 2.6]} size={[8.4, 0.2]} facing={[0, 1.4, s * B.halfZ]} color="#fff0d6" intensity={5} />
      ))}
    </>
  )
}

/** The pictures. Each swap redraws one detail of its canvas. */
function Pictures() {
  const t = useMemo(
    () => ({
      landscape: { default: landscapeTexture('normal'), sitter: landscapeTexture('sitter'), monster: landscapeTexture('monster') },
      portrait: { default: portraitTexture(GENTLEMAN, 'normal'), watching: portraitTexture(GENTLEMAN, 'blank'), grin: portraitTexture(GENTLEMAN, 'grin') },
      stilllife: { default: stillLifeTexture('normal'), core: stillLifeTexture('core'), eyeball: stillLifeTexture('eyeball') },
      seascape: { default: seascapeTexture('normal'), tentacle: seascapeTexture('tentacle'), sunk: seascapeTexture('sunk') },
      abstract: abstractTexture(),
      duchess: { default: portraitTexture(DUCHESS, 'normal'), empty: portraitTexture(DUCHESS, 'empty'), cutout: portraitTexture(DUCHESS, 'cutout') },
      pasture: { default: pastureTexture('normal'), ufo: pastureTexture('ufo') },
    }),
    [],
  )
  const [lw, lh] = CANVAS.landscape
  const [pw, ph] = CANVAS.portrait
  const [sw, sh] = CANVAS.stillLife
  const [cw, ch] = CANVAS.seascape
  const [aw, ah] = CANVAS.abstract
  const [dw, dh] = CANVAS.lady
  return (
    <>
      <Item id="landscape" {...onWall('back', 0, 1.8)}>
        {(['default', 'sitter', 'monster'] as const).map((v) => (
          <Variant key={v} of="landscape" name={v}>
            <Painting w={lw} h={lh} map={t.landscape[v]} border={0.12} />
          </Variant>
        ))}
      </Item>

      <Item id="portrait" {...onWall('back', -2.4, 1.65)}>
        {(['default', 'watching', 'grin'] as const).map((v) => (
          <Variant key={v} of="portrait" name={v}>
            <Painting w={pw} h={ph} map={t.portrait[v]} />
            {v === 'watching' && <WatchingEyes w={pw} h={ph} z={FRAME_DEPTH - 0.02} />}
          </Variant>
        ))}
      </Item>

      <Item id="stilllife" {...onWall('back', 2.4, 1.6)}>
        {(['default', 'core', 'eyeball'] as const).map((v) => (
          <Variant key={v} of="stilllife" name={v}>
            <Painting w={sw} h={sh} map={t.stilllife[v]} />
          </Variant>
        ))}
      </Item>

      <Item id="seascape" {...onWall('front', -2.4, 1.7)}>
        {(['default', 'tentacle', 'sunk'] as const).map((v) => (
          <Variant key={v} of="seascape" name={v}>
            <Painting w={cw} h={ch} map={t.seascape[v]} />
          </Variant>
        ))}
      </Item>

      {/* hung high over the loan plinth */}
      <Item id="duchess" {...onWall('front', 1.75, 2.2)}>
        <Variant of="duchess" name="default">
          <Painting w={dw} h={dh} map={t.duchess.default} />
        </Variant>
        <Variant of="duchess" name="climbing">
          <Painting w={dw} h={dh} map={t.duchess.empty} />
          <ClimbingSitter w={dw} h={dh} map={t.duchess.cutout} coat={DUCHESS.coat} skin={DUCHESS.skin} />
        </Variant>
      </Item>

      {/* by the way in, so you see it as you turn round */}
      <Item id="pasture" {...onWall('right', 2.4, 1.75)}>
        {(['default', 'ufo'] as const).map((v) => (
          <Variant key={v} of="pasture" name={v}>
            <Painting w={CANVAS.pasture[0]} h={CANVAS.pasture[1]} map={t.pasture[v]} frame="oak" border={0.07} />
          </Variant>
        ))}
      </Item>

      <Item id="abstract" {...onWall('front', 0.45, 1.65)}>
        <Painting w={aw} h={ah} map={t.abstract} frame="black" border={0.04} />
        <Variant of="abstract" name="default">
          <group />
        </Variant>
        <Variant of="abstract" name="drip">
          {/* from under the blue block, bottom right as you look at it */}
          <Drip x={0.35} y={-ah / 2 - 0.04} />
        </Variant>
      </Item>
    </>
  )
}

type Wall = 'back' | 'front' | 'left' | 'right'

/** The salon hang: small pictures round the big ones, all red herrings. Wall, along, height, size and subject. */
const SALON: { wall: Wall; along: number; y: number; w: number; h: number; kind: 'land' | 'flowers' | 'face'; seed: number }[] = [
  { wall: 'back', along: -4.05, y: 2.45, w: 0.6, h: 0.43, kind: 'land', seed: 1 },
  { wall: 'back', along: 4.05, y: 2.4, w: 0.42, h: 0.54, kind: 'flowers', seed: 2 },
  { wall: 'back', along: -1.45, y: 2.3, w: 0.4, h: 0.5, kind: 'face', seed: 0 },
  { wall: 'back', along: 1.45, y: 2.3, w: 0.45, h: 0.32, kind: 'land', seed: 3 },
  { wall: 'back', along: -3.33, y: 1.6, w: 0.36, h: 0.46, kind: 'flowers', seed: 4 },
  { wall: 'back', along: 3.4, y: 2.0, w: 0.34, h: 0.42, kind: 'face', seed: 1 },
  { wall: 'front', along: -4.1, y: 2.5, w: 0.4, h: 0.5, kind: 'face', seed: 2 },
  { wall: 'front', along: -1.05, y: 2.35, w: 0.55, h: 0.4, kind: 'land', seed: 5 },
  { wall: 'front', along: 2.95, y: 2.45, w: 0.32, h: 0.42, kind: 'flowers', seed: 6 },
  { wall: 'front', along: 4.2, y: 2.15, w: 0.5, h: 0.36, kind: 'land', seed: 7 },
  { wall: 'left', along: -2.55, y: 2.45, w: 0.5, h: 0.36, kind: 'land', seed: 8 },
  { wall: 'left', along: 2.2, y: 2.7, w: 0.36, h: 0.45, kind: 'face', seed: 3 },
  { wall: 'left', along: -1.45, y: 2.05, w: 0.32, h: 0.42, kind: 'flowers', seed: 9 },
  { wall: 'right', along: -2.25, y: 1.8, w: 0.6, h: 0.43, kind: 'land', seed: 10 },
]

const FRAMES = ['gilt', 'oak', 'gilt', 'black'] as const

function Salon() {
  const maps = useMemo(
    () =>
      SALON.map((p) =>
        p.kind === 'land' ? miniLandscapeTexture(p.seed) : p.kind === 'flowers' ? flowersTexture(p.seed) : portraitTexture(SITTERS[p.seed % SITTERS.length], 'normal', 352, 448),
      ),
    [],
  )
  return (
    <>
      {SALON.map((p, i) => (
        <Decoy key={i} label="painting" {...onWall(p.wall, p.along, p.y)}>
          <Painting w={p.w} h={p.h} map={maps[i]} frame={FRAMES[i % FRAMES.length]} border={0.06} />
        </Decoy>
      ))}
    </>
  )
}

/** Sculpture, cases and the centrepiece. */
function Exhibits() {
  const { halfX, halfZ } = B
  const [cx, , cz] = COLOSSUS.at
  return (
    <>
      <Item id="colossus" position={COLOSSUS.at}>
        {(['default', 'facing', 'glasses'] as const).map((v) => (
          <Variant key={v} of="colossus" name={v}>
            <Colossus mode={v === 'default' ? 'normal' : v} />
          </Variant>
        ))}
      </Item>

      <Item id="ropes" position={COLOSSUS.at}>
        <Variant of="ropes" name="default">
          <Barrier loose={false} />
        </Variant>
        <Variant of="ropes" name="loose">
          <Barrier loose />
        </Variant>
      </Item>

      {/* on the rope line facing the entrance */}
      <Item id="notice" position={[cx + COLOSSUS.ropeHalf + 0.36, 0, cz]} rotation={[0, PI / 2, 0]}>
        <Variant of="notice" name="default">
          <Notice touch={false} />
        </Variant>
        <Variant of="notice" name="touch">
          <Notice touch />
        </Variant>
      </Item>

      <Item id="case" position={[2.3, 0, 0.9]}>
        {(['default', 'phone', 'missing'] as const).map((v) => (
          <Variant key={v} of="case" name={v}>
            <TableCase mode={v === 'default' ? 'normal' : v} />
          </Variant>
        ))}
      </Item>

      <Item id="vitrine" position={[halfX - 0.85, 0, halfZ - 0.65]}>
        {(['default', 'escaped', 'fallen'] as const).map((v) => (
          <Variant key={v} of="vitrine" name={v}>
            <Vitrine horse={v === 'default' ? 'inside' : v} />
          </Variant>
        ))}
      </Item>

      {/* back corners: a bust and a vase, each on its plinth, turned towards the room */}
      <Decoy label="plinth" position={[-4.0, 0, -3.0]} solid>
        <Plinth />
      </Decoy>
      <Item id="bust" position={[-4.0, PLINTH.height, -3.0]} rotation={[0, PI / 4, 0]}>
        <Variant of="bust" name="default">
          <Model id="marble_bust_01" />
        </Variant>
        <Variant of="bust" name="facing">
          <YawToYou>
            <Model id="marble_bust_01" />
          </YawToYou>
        </Variant>
        <Variant of="bust" name="cap">
          <Model id="marble_bust_01" />
          {/* at a jaunty angle, peak to the front of the face */}
          <group position={[-0.015, 0.425, 0.0]} rotation={[-0.18, -0.2, 0.08]}>
            <GuardCap />
          </group>
        </Variant>
      </Item>

      <Decoy label="plinth" position={[4.0, 0, -3.0]} solid>
        <Plinth />
      </Decoy>
      <Item id="vase" position={[4.0, PLINTH.height, -3.0]}>
        <Variant of="vase" name="default">
          <Model id="antique_ceramic_vase_01" />
        </Variant>
        <Variant of="vase" name="floating">
          <Hover height={0.05}>
            <group position={[0, 0.44, 0]} rotation={[PI, 0, 0]}>
              <Model id="antique_ceramic_vase_01" />
            </group>
          </Hover>
        </Variant>
      </Item>

      {/* front wall, between the paintings */}
      <Decoy label="plinth" position={[-1.05, 0, halfZ - 0.45]} solid>
        <Plinth />
      </Decoy>
      <Item id="cat" position={[-1.05, PLINTH.height, halfZ - 0.45]} rotation={[0, PI, 0]}>
        <Variant of="cat" name="default">
          <Model id="concrete_cat_statue" />
        </Variant>
        <Variant of="cat" name="kitten">
          <Model id="concrete_cat_statue" position={[-0.07, 0, 0]} />
          <Model id="concrete_cat_statue" position={[0.12, 0, 0.04]} rotation={[0, -0.4, 0]} scale={0.5} />
        </Variant>
      </Item>

      <Item id="loan" position={[1.75, 0, halfZ - 0.45]} rotation={[0, PI, 0]}>
        <Variant of="loan" name="default">
          <LoanPlinth returned={false} />
        </Variant>
        <Variant of="loan" name="returned">
          <LoanPlinth returned />
        </Variant>
      </Item>

      {/* in the middle of the floor, facing the star painting */}
      <Item id="bench" position={BENCH.at}>
        <Bench length={BENCH.length} depth={BENCH.depth} />
      </Item>
    </>
  )
}

/** The doors, the guard, the signs and the red herrings. */
function Fittings() {
  const { halfX, halfZ } = B
  const decoys = useMemo(() => ({ river: riverTexture(), lady: portraitTexture(LADY, 'normal', 352, 448), botanical: botanicalTexture() }), [])
  return (
    <>
      <Item id="exit" {...onWall('left', 0, DOOR.height + 0.3)}>
        {(['default', 'entrance', 'mirror'] as const).map((v) => (
          <Variant key={v} of="exit" name={v}>
            <ExitSign mode={v === 'default' ? 'normal' : v} />
          </Variant>
        ))}
      </Item>

      <Item id="sign" {...onWall('left', 2.2, 1.85)}>
        <Variant of="sign" name="default">
          <GallerySign title="Gallery 6" subtitle="Painting and Sculpture, 1600-1930" />
        </Variant>
        <Variant of="sign" name="thisroom">
          <GallerySign title="This Room" subtitle="Painting and Sculpture, 1600-1930" />
        </Variant>
      </Item>

      {/* the guard sits beside the entrance, watching the room */}
      <Item id="chair" position={[halfX - 0.45, 0, -1.5]} rotation={[0, -PI / 2, 0]}>
        <Variant of="chair" name="default">
          <GuardChair cap={false} />
        </Variant>
        <Variant of="chair" name="cap">
          <GuardChair cap />
        </Variant>
      </Item>

      <Item id="donations" position={[halfX - 0.4, 0, 1.5]} rotation={[0, -PI / 2, 0]}>
        {(['coins', 'teeth', 'empty'] as const).map((c) => (
          <Variant key={c} of="donations" name={c === 'coins' ? 'default' : c}>
            <DonationBox contents={c} />
          </Variant>
        ))}
      </Item>

      <Item id="skylight" position={[0, H, 0]}>
        {(['default', 'hand', 'eye'] as const).map((v) => (
          <Variant key={v} of="skylight" name={v}>
            <Skylight w={SKY.w} d={SKY.d} mode={v === 'default' ? 'normal' : v} />
          </Variant>
        ))}
      </Item>

      {/* --- red herrings --- */}
      <Decoy label="painting" {...onWall('front', -4.1, 1.6)}>
        <Painting w={CANVAS.river[0]} h={CANVAS.river[1]} map={decoys.river} frame="oak" border={0.06} />
      </Decoy>
      <Decoy label="painting" {...onWall('left', -2.55, 1.6)}>
        <Painting w={CANVAS.lady[0]} h={CANVAS.lady[1]} map={decoys.lady} />
      </Decoy>
      <Decoy label="botanical print" {...onWall('front', 2.95, 1.6)}>
        <Painting w={CANVAS.botanical[0]} h={CANVAS.botanical[1]} map={decoys.botanical} frame="black" border={0.03} />
      </Decoy>
      {/* beside the far doorway */}
      <Decoy label="brass vase" position={[-halfX + 0.4, 0, -1.4]} solid>
        <Plinth size={0.4} height={0.9} />
        <Model id="brass_vase_02" position={[0, 0.9, 0]} />
      </Decoy>
      <Decoy label="fire extinguisher" position={[halfX - 0.22, 0, -2.5]} rotation={[0, -PI / 2, 0]} solid>
        <Model id="korean_fire_extinguisher_01" />
      </Decoy>
      <Decoy label="security camera" position={[halfX - 0.3, H, -halfZ + 0.3]}>
        <DomeCamera />
      </Decoy>
    </>
  )
}

export const MuseumRoom = memo(function MuseumRoom() {
  return (
    <>
      <group position={[HALL_X, 0, 0]}>
        <Lights />
        <Shell />
        <Pictures />
        <Salon />
        <Exhibits />
        <Fittings />
      </group>
      <group position={[NH_X, 0, 0]}>
        <NaturalHistory />
      </group>
    </>
  )
})
