import type { ComponentType } from 'react'
import type { ItemCatalog } from '../items'
import type { Vec3 } from '../mutations'

export interface Bounds {
  /** Distance from the centre to the inner face of the side walls, in metres. */
  halfX: number
  /** Distance from the centre to the inner face of the front/back walls. */
  halfZ: number
  height: number
}

/** One self-contained room: its own layout, objects and changes. */
export interface RoomDef {
  id: string
  /** "the living room", used in sentences. */
  name: string
  /** Short label for stickers, e.g. "Living room". */
  label: string
  /** A line or two for the level menu's preview card. */
  blurb: string
  items: ItemCatalog
  /** How many changes to spot before moving on; bigger, busier rooms get more. */
  changes: number
  /** Seconds to find each change, if not the usual. Big co-op levels get longer, to split up and argue. */
  huntSeconds?: number
  /** Seconds for the first look, if not worked out from how many things the room has. */
  studySeconds?: number
  bounds: Bounds
  /** Where the player stands (and looks) for the first look. After each change they're dropped somewhere random. */
  start: { position: Vec3; target: Vec3 }
  /** The room's 3D content. Memoised with no props so re-renders never undo changes. */
  Scene: ComponentType
  /** Starts downloading the scene's code early (see lazyScene), so entering the room doesn't wait for it. */
  preload?: () => void
}
