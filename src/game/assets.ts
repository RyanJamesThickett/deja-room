import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

/** Poly Haven models in public/models (fetched by scripts/fetch-assets.mjs). */
export const MODEL_IDS = [
  'sofa_02',
  'ArmChair_01',
  'modern_coffee_table_01',
  'side_table_01',
  'modern_wooden_cabinet',
  'Television_01',
  'throw_pillows_01',
  'modern_ceiling_lamp_01',
  'potted_plant_01',
  'potted_plant_02',
  'ceramic_vase_01',
  'brass_vase_02',
  'hanging_picture_frame_02',
  'fancy_picture_frame_01',
  'standing_picture_frame_01',
  'standing_picture_frame_02',
  'wall_clock',
  'vintage_telephone_wall_clock',
  'horse_statue_01',
  'concrete_cat_statue',
  'rubber_duck_toy',
  'marble_bust_01',
  'antique_ceramic_vase_01',
  'modern_arm_chair_01',
  'Sofa_01',
  'modern_coffee_table_02',
  'potted_plant_04',
  'CashRegister_01',
  'cardboard_box_01',
  // red herrings: clutter that never changes
  'Ottoman_01',
  'ornate_mirror_01',
  'boombox',
  'metal_tool_chest',
  'propane_tank',
  'medical_box',
  'old_gas_mask',
  'metal_stool_01',
  'korean_fire_extinguisher_01',
] as const
export type ModelId = (typeof MODEL_IDS)[number]

// Models load when a room that uses them is opened (behind the loading
// screen), not all at once when the page opens.
export const modelUrl = (id: ModelId) => `/models/${id}/${id}.gltf`

// ---------------------------------------------------------------------------
// Tiling PBR surfaces
// ---------------------------------------------------------------------------

export type SurfaceId =
  | 'herringbone_parquet'
  | 'painted_plaster_wall'
  | 'fabric_pattern_07'
  | 'velour_velvet'
  | 'oak_veneer_01'
  | 'quatrefoil_jacquard_fabric'

const surfaceUrls = (id: SurfaceId) => ['diffuse', 'nor_gl', 'rough'].map((m) => `/textures/${id}/${m}.jpg`)

export interface Surface {
  map: Texture
  normalMap: Texture
  roughnessMap: Texture
}

/** Loads a texture set and returns copies tiled repeatX × repeatY (copies share the image). */
export function useSurface(id: SurfaceId, repeatX: number, repeatY: number, rotation = 0): Surface {
  const [map, normal, rough] = useTexture(surfaceUrls(id))
  return useMemo(() => {
    const set = (t: Texture, colour: boolean) => {
      const c = t.clone()
      c.wrapS = c.wrapT = RepeatWrapping
      c.repeat.set(repeatX, repeatY)
      c.rotation = rotation
      if (colour) c.colorSpace = SRGBColorSpace
      c.needsUpdate = true
      return c
    }
    return { map: set(map, true), normalMap: set(normal, false), roughnessMap: set(rough, false) }
  }, [map, normal, rough, repeatX, repeatY, rotation])
}
