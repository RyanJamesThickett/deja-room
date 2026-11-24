import {
  Box3,
  Color,
  PointLight,
  RectAreaLight,
  SpotLight,
  Vector3,
  type InstancedMesh,
  type Light,
  type Material,
  type Mesh,
  type Object3D,
  type ShaderMaterial,
} from 'three'
import { kindsFor, type Blocker, type ItemCatalog, type ItemId, type MutationKind } from './items'
import { hashString, mulberry32, pick, range } from './rng'

export type Vec3 = [number, number, number]

type MutationBase = { target: ItemId; description: string }

export type Mutation = MutationBase &
  (
    | { kind: 'move'; offset: Vec3 }
    | { kind: 'turn'; axis: 'y' | 'z'; angle: number }
    | { kind: 'scale'; factor: number }
    | { kind: 'recolor'; palette: number }
    | { kind: 'swap'; variant: string }
  )

export const PALETTE = [
  '#ff3131', // pop red
  '#1f6bff', // blue
  '#ffde21', // yellow
  '#2fbf71', // green
  '#ff3fa4', // pink
  '#8a4dff', // violet
  '#16d0ff', // cyan
  '#ff8a1f', // orange
]

type Change = { target: ItemId; kind: MutationKind; variant?: string }
type Pattern = { item: ItemId; kind?: MutationKind; variant?: string }

function fits(p: Pattern, c: Change) {
  return c.target === p.item && (!p.kind || c.kind === p.kind) && (!p.variant || (c.kind === 'swap' && c.variant === p.variant))
}

/**
 * Every pair of changes that can't both be seen, from the catalogue's
 * `blockedBy` and `clashes`. Pairs work both ways round: if closed curtains
 * hide a changed window, changing the window also rules out closing them.
 */
function conflictRules(items: ItemCatalog) {
  const rules: { a: Pattern; b: Pattern }[] = []
  const resolve = (b: Blocker, self: ItemId): Pattern => ({ item: b.item ?? self, kind: b.kind, variant: b.variant })
  for (const [id, def] of Object.entries(items)) {
    for (const b of def.blockedBy ?? []) rules.push({ a: { item: id }, b: resolve(b, id) })
    for (const s of def.swaps ?? []) for (const b of s.blockedBy ?? []) rules.push({ a: { item: id, kind: 'swap', variant: s.variant }, b: resolve(b, id) })
    for (const [x, y] of def.clashes ?? []) rules.push({ a: resolve(x, id), b: resolve(y, id) })
  }
  return rules
}

/** First few rounds only change big, easy-to-spot things. */
const EASY_ROUNDS = 3

/** Colour changes are the least interesting, so they come up least. */
const KIND_WEIGHT: Record<MutationKind, number> = { move: 3, swap: 3, turn: 3, scale: 2, recolor: 1 }

function weightedPick<T>(rng: () => number, items: readonly T[], weight: (t: T) => number): T {
  const total = items.reduce((sum, t) => sum + weight(t), 0)
  let r = rng() * total
  for (const t of items) {
    r -= weight(t)
    if (r < 0) return t
  }
  return items[items.length - 1]
}

/**
 * Picks the change for a round from a room's catalogue. Deterministic for a
 * given seed, round and history, so everyone on the same seed gets the same
 * changes.
 */
export function generateMutation(
  seed: string,
  round: number,
  history: readonly Mutation[],
  items: ItemCatalog,
): Mutation {
  const rng = mulberry32(hashString(`${seed}:${round}`))
  const ids = Object.keys(items)
  const itemDef = (id: ItemId) => items[id]
  const recent = new Set(history.slice(-4).map((m) => m.target))
  const done = new Set(history.map((m) => `${m.target}:${m.kind}`))
  // A swap shows one model and hides the rest, so a second swap on the same
  // item would quietly undo the first. One swap per item.
  const swappedItems = new Set(history.flatMap((m) => (m.kind === 'swap' ? [m.target] : [])))
  const rules = conflictRules(items)
  const clashes = (c: Change) => history.some((h) => rules.some((r) => (fits(r.a, c) && fits(r.b, h)) || (fits(r.a, h) && fits(r.b, c))))

  const openSwaps = (id: ItemId) =>
    swappedItems.has(id) ? [] : (itemDef(id).swaps?.filter((s) => !clashes({ target: id, kind: 'swap', variant: s.variant })) ?? [])

  const available = (id: ItemId, ignoreRecent: boolean): MutationKind[] => {
    if (!ignoreRecent && recent.has(id)) return []
    // Each kind of change happens to an item at most once, except colour.
    return kindsFor(itemDef(id)).filter((k) => {
      if (k === 'swap') return openSwaps(id).length > 0
      if (k !== 'recolor' && done.has(`${id}:${k}`)) return false
      return !clashes({ target: id, kind: k })
    })
  }

  const options = (ignoreRecent: boolean, easyOnly: boolean) =>
    ids.filter((id) => !easyOnly || itemDef(id).big).flatMap((id) => available(id, ignoreRecent).map((kind) => ({ id, kind })))
  const easy = round < EASY_ROUNDS
  let pool = options(false, easy)
  if (pool.length === 0) pool = options(true, easy)
  if (pool.length === 0) pool = options(true, false)
  // Last resort (a room that has run out of changes): a fresh colour, which never hides anything.
  if (pool.length === 0) pool = ids.filter((id) => itemDef(id).recolor).map((id) => ({ id, kind: 'recolor' as const }))

  const { id: target, kind } = weightedPick(rng, pool, (o) => KIND_WEIGHT[o.kind])
  const def = itemDef(target)
  const The = `The ${def.label}`

  switch (kind) {
    case 'move': {
      const move = pick(rng, def.moves!)
      return { target, kind, offset: [...move.offset] as Vec3, description: move.text }
    }
    case 'turn': {
      const turn = pick(rng, def.turns!)
      return { target, kind, axis: def.wall ? 'z' : 'y', angle: turn.angle, description: turn.text }
    }
    case 'scale': {
      const grow = def.scale === 'up' || (def.scale === 'both' && rng() < 0.5)
      const factor = grow ? range(rng, 1.5, 1.8) : range(rng, 0.45, 0.5)
      const description = grow ? `${The} got ${Math.round((factor - 1) * 100)}% bigger` : `${The} shrank to half its size`
      return { target, kind, factor, description }
    }
    case 'recolor':
      return { target, kind, palette: Math.floor(rng() * PALETTE.length), description: `${The} changed colour` }
    case 'swap': {
      const swap = pick(rng, openSwaps(target))
      return { target, kind, variant: swap.variant, description: swap.text }
    }
  }
}

// ---------------------------------------------------------------------------
// Applying mutations to the scene
// ---------------------------------------------------------------------------

interface BaseState {
  position: Vector3
  quaternion: Object3D['quaternion']
  scale: Vector3
  visible: boolean
  material?: Material | Material[]
}

const BASE = '__base'
const TOUCHED = '__touched'

/** Records an object's original state the first time a mutation changes it. */
function touch(o: Object3D, touched: Set<Object3D>) {
  if (!o.userData[BASE]) {
    const base: BaseState = {
      position: o.position.clone(),
      quaternion: o.quaternion.clone(),
      scale: o.scale.clone(),
      visible: o.visible,
      material: (o as Mesh).isMesh ? (o as Mesh).material : undefined,
    }
    o.userData[BASE] = base
  }
  touched.add(o)
}

function restore(o: Object3D) {
  const base = o.userData[BASE] as BaseState | undefined
  if (!base) return
  o.position.copy(base.position)
  o.quaternion.copy(base.quaternion)
  o.scale.copy(base.scale)
  o.visible = base.visible
  const mesh = o as Mesh
  if (mesh.isMesh && base.material && mesh.material !== base.material) {
    const current = mesh.material
    if (Array.isArray(current)) current.forEach((m) => m.dispose())
    else current.dispose()
    mesh.material = base.material
  }
}

function meshesToPaint(o: Object3D): Mesh[] {
  const all: Mesh[] = []
  o.traverse((c) => {
    if ((c as Mesh).isMesh) all.push(c as Mesh)
  })
  const painted = all.filter((m) => m.userData.paint)
  return painted.length > 0 ? painted : all
}

/** Shader-driven objects (jelly, lava, orb) expose their colour as a `uColor` uniform. */
function colourOf(material: Material): Color | undefined {
  const shader = material as ShaderMaterial
  if (shader.uniforms?.uColor) return shader.uniforms.uColor.value as Color
  return (material as Material & { color?: Color }).color
}

function distinctColor(original: Color | undefined, start: number): Color {
  for (let i = 0; i < PALETTE.length; i++) {
    const c = new Color(PALETTE[(start + i) % PALETTE.length])
    if (!original) return c
    if (Math.hypot(c.r - original.r, c.g - original.g, c.b - original.b) > 0.45) return c
  }
  return new Color(PALETTE[start % PALETTE.length])
}

/**
 * Puts the house back to its original state, then applies `mutations` in
 * order. Safe to call repeatedly with different lists, which is how the
 * before/after toggle works and why StrictMode's double effects are harmless.
 */
export function applyMutations(root: Object3D, mutations: readonly Mutation[]) {
  const previous = root.userData[TOUCHED] as Set<Object3D> | undefined
  previous?.forEach(restore)

  const touched = new Set<Object3D>()
  for (const m of mutations) {
    const obj = root.getObjectByName(m.target)
    if (!obj) {
      console.warn(`Mutation target "${m.target}" not found in scene`)
      continue
    }
    switch (m.kind) {
      case 'move':
        touch(obj, touched)
        // relative to how the item originally stood, so an earlier turn can't send it through a wall
        obj.position.add(new Vector3(...m.offset).applyQuaternion((obj.userData[BASE] as BaseState).quaternion))
        break
      case 'turn':
        touch(obj, touched)
        obj.rotateOnAxis(m.axis === 'y' ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1), m.angle)
        break
      case 'scale':
        touch(obj, touched)
        obj.scale.multiplyScalar(m.factor)
        break
      case 'swap': {
        const prefix = `${m.target}:`
        const chosen = `${prefix}${m.variant}`
        obj.traverse((c) => {
          if (!c.name.startsWith(prefix)) return
          touch(c, touched)
          c.visible = c.name === chosen
        })
        break
      }
      case 'recolor': {
        const meshes = meshesToPaint(obj)
        const first = meshes[0] && ((meshes[0].userData[BASE] as BaseState | undefined)?.material ?? meshes[0].material)
        const colour = distinctColor(first && !Array.isArray(first) ? colourOf(first) : undefined, m.palette)
        for (const mesh of meshes) {
          touch(mesh, touched)
          const base = (mesh.userData[BASE] as BaseState).material
          if (!base || Array.isArray(base)) continue
          const material = base.clone()
          colourOf(material)?.copy(colour)
          mesh.material = material
        }
        break
      }
    }
  }
  root.userData[TOUCHED] = touched
}

/** Walks up from a hit object to the item it belongs to. */
export function itemIdOf(o: Object3D | null): ItemId | null {
  for (let cur = o; cur; cur = cur.parent) {
    if (cur.userData.itemId) return cur.userData.itemId as ItemId
  }
  return null
}

/** Walks up from a hit object to the red herring it belongs to, if any. */
export function decoyOf(o: Object3D | null): string | null {
  for (let cur = o; cur; cur = cur.parent) {
    if (cur.userData.itemId) return null
    if (cur.userData.decoy) return cur.userData.decoy as string
  }
  return null
}

/** Copies catalogue flags onto the scene's item groups (and flags mismatches while developing). */
export function tagItems(root: Object3D, items: ItemCatalog) {
  const seen = new Set<string>()
  root.traverse((o) => {
    const id = o.userData.itemId as string | undefined
    if (!id) return
    seen.add(id)
    if (!items[id]) console.warn(`Scene has an <Item id="${id}"> that isn't in the room's catalogue`)
    o.userData.solid = items[id]?.solid ?? false
    o.userData.round = items[id]?.round ?? false
  })
  if (import.meta.env.DEV) {
    for (const id of Object.keys(items)) if (!seen.has(id)) console.warn(`Catalogue item "${id}" has no <Item> in the scene`)
  }
}

const SPARE = 'spareLight'

function lightKind(l: Light) {
  return l.castShadow ? `${l.type}:shadow` : l.type
}

function spareLight(kind: string): Light | null {
  switch (kind) {
    case 'PointLight':
      return new PointLight(0xffffff, 0, 0.01)
    case 'RectAreaLight':
      return new RectAreaLight(0xffffff, 0, 0.01, 0.01)
    case 'SpotLight':
      return new SpotLight(0xffffff, 0, 0.01)
    default:
      return null
  }
}

/**
 * Gives every swap variant of an item the same number of each kind of light,
 * padding with unlit spares. Three.js recompiles every material in the scene
 * whenever the number of visible lights changes, which stalls the game for a
 * moment; with matching counts a swap never changes it. Run after mounting a room.
 */
export function balanceVariantLights(root: Object3D) {
  const old: Object3D[] = []
  root.traverse((o) => {
    if (o.userData[SPARE]) old.push(o)
  })
  for (const o of old) o.removeFromParent()

  root.traverse((item) => {
    const id = item.userData.itemId as string | undefined
    if (!id) return
    const prefix = `${id}:`
    const variants: Object3D[] = []
    item.traverse((c) => {
      if (c.name.startsWith(prefix)) variants.push(c)
    })
    if (variants.length < 2) return
    const counts = variants.map((v) => {
      const n = new Map<string, number>()
      v.traverse((c) => {
        if ((c as Light).isLight) n.set(lightKind(c as Light), (n.get(lightKind(c as Light)) ?? 0) + 1)
      })
      return n
    })
    const most = new Map<string, number>()
    for (const n of counts) for (const [k, v] of n) most.set(k, Math.max(most.get(k) ?? 0, v))
    variants.forEach((v, i) => {
      for (const [kind, max] of most) {
        for (let k = counts[i].get(kind) ?? 0; k < max; k++) {
          const spare = spareLight(kind)
          if (!spare) {
            if (import.meta.env.DEV) console.warn(`Can't pad "${v.name}" with a ${kind}; swapping it will stall while shaders recompile`)
            break
          }
          spare.userData[SPARE] = true
          v.add(spare)
        }
      }
    })
  })
}

export function isVisibleInScene(o: Object3D) {
  for (let cur: Object3D | null = o; cur; cur = cur.parent) {
    if (!cur.visible) return false
  }
  return true
}

const tmpBox = new Box3()

/** World-space bounds of only the visible meshes (hidden swap variants don't count). */
/** World bounds of one visible mesh (empty for ghosted ones with an empty bounding box). */
function meshBounds(c: Object3D, target: Box3) {
  const many = c as InstancedMesh
  if (many.isInstancedMesh) {
    if (!many.boundingBox) many.computeBoundingBox()
    return target.copy(many.boundingBox!).applyMatrix4(many.matrixWorld)
  }
  const mesh = c as Mesh
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  return target.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld)
}

export function visibleBounds(o: Object3D, target: Box3) {
  target.makeEmpty()
  if (!isVisibleInScene(o)) return target
  o.updateWorldMatrix(true, true)
  o.traverseVisible((c) => {
    if ((c as Mesh).isMesh) target.union(meshBounds(c, tmpBox))
  })
  return target
}

/** At most this many boxes per object. */
const MAX_PARTS = 8

/** How much empty space (m³) merging two boxes would add. */
function waste(a: Box3, b: Box3) {
  return volume(grown.copy(a).union(b)) - volume(a) - volume(b)
}
const grown = new Box3()

/**
 * The visible bounds of an object as a few tight boxes instead of one loose
 * one. Meshes are merged only where it costs little empty space, so compact
 * clusters become one box while a hose rack's thin rail, the hoses hanging
 * from it and a hose lying across the floor stay separate.
 */
export function visibleParts(o: Object3D): Box3[] {
  if (!isVisibleInScene(o)) return []
  o.updateWorldMatrix(true, true)
  const meshes: Box3[] = []
  o.traverseVisible((c) => {
    if (!(c as Mesh).isMesh) return
    const b = meshBounds(c, new Box3())
    if (!b.isEmpty()) meshes.push(b)
  })
  // first pass: fold each mesh into a part it barely enlarges
  let parts: Box3[] = []
  for (const b of meshes) {
    const into = parts.find((p) => waste(p, b) < 0.25 * (volume(p) + volume(b)) + 0.004)
    if (into) into.union(b)
    else parts.push(b)
  }
  // a box wholly inside another adds nothing
  parts = parts.filter((p, i) => !parts.some((q, j) => j !== i && q.containsBox(p) && !(p.containsBox(q) && j > i)))
  // then merge the cheapest pairs until few enough remain
  while (parts.length > MAX_PARTS) {
    let best = [0, 1]
    let cost = Infinity
    for (let i = 0; i < parts.length; i++)
      for (let j = i + 1; j < parts.length; j++) {
        const w = waste(parts[i], parts[j])
        if (w < cost) {
          cost = w
          best = [i, j]
        }
      }
    parts[best[0]].union(parts[best[1]])
    parts.splice(best[1], 1)
  }
  return parts
}

const sizeOf = new Vector3()
function volume(b: Box3) {
  b.getSize(sizeOf)
  return sizeOf.x * sizeOf.y * sizeOf.z
}
