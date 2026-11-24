import type { ReactNode } from 'react'
import { PI } from '../../kit'
import type { Vec3 } from './build'
import { signPanel } from './cityPlan'
import { cityMaterials, MAT } from './materials'
import { MeshStandardMaterial } from 'three'
import { once } from '../../outsideLayers'
import { Builder } from './build'
import { rod } from './squareParts'
import { awningMaterials, clothMaterial, COUNTER, CRATE_MAT, crateGeometry, PLANE, STALL, UNIT_BOX } from './stallParts'

/*
 * The bones of a market stall: four steel poles, a striped awning sloping
 * down to the front with a scalloped valance, a trestle counter under a
 * cloth, the stall's name on a board above the back of the awning, and
 * a couple of spare crates behind for the stallholder.
 */

const { poleX, frontZ, backZ, frontH, backH, overhang } = STALL
const SLOPE = Math.atan2(backH - frontH, frontZ - backZ)
const LENGTH = Math.hypot(backH - frontH, frontZ - backZ) + overhang / Math.cos(SLOPE)

/** A board showing one row of the sign atlas, facing +z. */
export function SignBoard({ row, width, height, position, rotation }: { row: number; width: number; height: number; position: Vec3; rotation?: Vec3 }) {
  const { signs } = cityMaterials()
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={signPanel(row)} material={signs} scale={[width, height, 1]} position={[0, 0, 0.011]} />
      <mesh geometry={UNIT_BOX} material={MAT.darkWood} scale={[width + 0.04, height + 0.04, 0.02]} castShadow />
    </group>
  )
}

/** The steel frame: four poles (the back pair carry the name board), the bars joining their tops. One mesh. */
const steel = once(() => {
  const b = new Builder()
  const grey = '#a9adb2'
  for (const s of [-1, 1]) {
    rod(b, [s * poleX, 0, frontZ], [s * poleX, frontH, frontZ], 0.025, grey)
    rod(b, [s * poleX, 0, backZ], [s * poleX, backH + 0.48, backZ], 0.025, grey)
    rod(b, [s * poleX, frontH, frontZ], [s * poleX, backH, backZ], 0.022, grey)
  }
  rod(b, [-poleX, frontH, frontZ], [poleX, frontH, frontZ], 0.022, grey)
  rod(b, [-poleX, backH, backZ], [poleX, backH, backZ], 0.022, grey)
  return b.merge()
})
const STEEL = new MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.8 })

/** The awning and its valance. `across`: stripes run side to side instead of front to back. `paint`: a recolour tints it. */
export function Awning({ colour, across = false, paint = false }: { colour: string; across?: boolean; paint?: boolean }) {
  const m = awningMaterials(`${colour}|${across ? 'across' : 'along'}`)
  // the canvas's centre, part way between the back bar and the overhanging front edge
  const cz = (backZ + frontZ + overhang) / 2
  const cy = backH - ((cz - backZ) * (backH - frontH)) / (frontZ - backZ)
  const edgeZ = frontZ + overhang
  const edgeY = frontH - overhang * Math.tan(SLOPE)
  return (
    <>
      <mesh geometry={PLANE} material={m.canvas} position={[0, cy + 0.03, cz]} rotation={[-PI / 2 + SLOPE, 0, 0]} scale={[poleX * 2 + 0.24, LENGTH, 1]} castShadow userData={{ paint }} />
      <mesh geometry={PLANE} material={m.valance} position={[0, edgeY - 0.11, edgeZ]} scale={[poleX * 2 + 0.24, 0.24, 1]} castShadow userData={{ paint }} />
      {/* shorter valances down each side, following the slope */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (poleX + 0.12), cy - 0.06, cz]} rotation={[SLOPE, 0, 0]}>
          <mesh geometry={PLANE} material={m.valance} rotation={[0, (s * PI) / 2, 0]} scale={[LENGTH, 0.16, 1]} castShadow userData={{ paint }} />
        </group>
      ))}
    </>
  )
}

/**
 * Poles, bars, the counter and name board. `cloth`: the counter's cloth colour
 * (no counter if left out); `sheet`: a canvas back wall in that colour.
 */
export function StallFrame({ cloth, sheet, sign, children }: { cloth?: string; sheet?: string; sign: number; children?: ReactNode }) {
  return (
    <>
      <mesh geometry={steel()} material={STEEL} castShadow />
      <SignBoard row={sign} width={2.4} height={0.36} position={[0, backH + 0.25, backZ + 0.02]} />
      {sheet && (
        <mesh geometry={PLANE} material={awningMaterials(`${sheet}|along`).sheet} position={[0, (backH + 0.9) / 2, backZ - 0.03]} scale={[poleX * 2, backH - 0.9, 1]} receiveShadow />
      )}
      {cloth && (
        <>
          <mesh geometry={UNIT_BOX} material={clothMaterial(cloth)} position={[0, (COUNTER.top - 0.03) / 2 + 0.03, COUNTER.z]} scale={[COUNTER.width, COUNTER.top - 0.06, COUNTER.depth]} castShadow receiveShadow />
          <mesh geometry={UNIT_BOX} material={MAT.paleWood} position={[0, COUNTER.top - 0.015, COUNTER.z]} scale={[COUNTER.width + 0.04, 0.03, COUNTER.depth + 0.04]} castShadow receiveShadow />
        </>
      )}
      {/* spare stock behind the counter */}
      <mesh geometry={crateGeometry('0.5,0.36,0.26')} material={CRATE_MAT} position={[-0.8, 0, -0.65]} rotation={[0, 0.1, 0]} castShadow />
      <mesh geometry={crateGeometry('0.5,0.36,0.26')} material={CRATE_MAT} position={[-0.78, 0.26, -0.65]} rotation={[0, -0.05, 0]} castShadow />
      {children}
    </>
  )
}
