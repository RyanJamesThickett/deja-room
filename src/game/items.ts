/**
 * Shared types for the things in a room that can change (and be clicked as
 * a guess). Each room has its own catalogue in rooms/<room>/items.ts.
 *
 * An item's id is also its Three.js object name, which is how mutations find
 * their target. Instead of random amounts, each item lists the specific
 * changes that make sense for it and are obvious once you look: a move
 * that lands somewhere believable, a turn that changes its silhouette,
 * a swap to a different model.
 */

export type MutationKind = 'move' | 'turn' | 'scale' | 'recolor' | 'swap'

type Vec3 = [number, number, number]

/**
 * A change that can't be combined with this one because one would hide or
 * undo the other, e.g. closed curtains hide the window. Applies in both
 * orders. `item` defaults to the item itself; leave out `kind`/`variant` to
 * match any change to that item.
 */
export interface Blocker {
  item?: string
  kind?: MutationKind
  variant?: string
}

export interface Swap {
  /** Child group named `${itemId}:${variant}` that replaces `${itemId}:default`. */
  variant: string
  text: string
  /** Changes that would hide this swap, or that it would hide; never both. */
  blockedBy?: readonly Blocker[]
}

export interface ItemDef {
  label: string
  /** Large, easy-to-spot things. The first rounds only pick these. */
  big?: boolean
  /** Blocks the player in walk mode. */
  solid?: boolean
  /** Round in plan (a ball, a drum, a reactor): collides as the ellipse inside its box, not the box. */
  round?: boolean
  /** Hung on a wall: turns spin around the wall normal instead of the vertical. */
  wall?: boolean
  /**
   * Relocations: an offset in the item's own space to a completely different
   * spot (another surface, the floor, the other side of the room), with the
   * sentence the reveal shows.
   */
  moves?: readonly { offset: Vec3; text: string }[]
  /** Angles (radians) that clearly change how the thing looks. */
  turns?: readonly { angle: number; text: string }[]
  /** Allowed resize direction. Resizes are always at least 50%. */
  scale?: 'up' | 'down' | 'both'
  recolor?: boolean
  swaps?: readonly Swap[]
  /** Don't change this item at all once any of these changes has happened (and vice versa). */
  blockedBy?: readonly Blocker[]
  /**
   * Pairs of changes that can't both happen, e.g. a TV that's been made bigger
   * won't fit in the corner it moves to. Blockers default to this item.
   */
  clashes?: readonly (readonly [Blocker, Blocker])[]
}

export type ItemCatalog = Record<string, ItemDef>
export type ItemId = string

export function kindsFor(def: ItemDef): MutationKind[] {
  const kinds: MutationKind[] = []
  if (def.moves?.length) kinds.push('move')
  if (def.turns?.length) kinds.push('turn')
  if (def.scale) kinds.push('scale')
  if (def.recolor) kinds.push('recolor')
  if (def.swaps?.length) kinds.push('swap')
  return kinds
}
