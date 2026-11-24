import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { figureParts } from './figureParts'

/**
 * A tall, dark, faceless figure standing quite still, feet at its origin and
 * facing +z, swaying very slightly with its head on one side. Put it outside,
 * a step back from a door's glass, behind a real hole in the wall: it's
 * see-through and soft-edged, so it only reads as someone standing there.
 */
export function ShadowFigure({ height = 1.85, phase = 0 }: { height?: number; phase?: number }) {
  const { body, head, arm, dark, blur, haloBlur, headDark, headBlur, headHalo, face, faceBlur } = figureParts()
  const sway = useRef<Group>(null)
  const tilt = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    if (sway.current) {
      sway.current.rotation.z = Math.sin(t * 0.47) * 0.018
      sway.current.rotation.x = Math.sin(t * 0.31) * 0.012
    }
    // the head lolls slowly over to one side and back
    if (tilt.current) tilt.current.rotation.z = 0.12 + Math.sin(t * 0.23) * 0.07
  })
  return (
    <group scale={height}>
      <group ref={sway}>
        <mesh geometry={body} material={dark} renderOrder={1.1} />
        <mesh geometry={body} material={blur} scale={[1.14, 1.01, 1.18]} renderOrder={1.05} />
        <mesh geometry={body} material={haloBlur} scale={[1.32, 1.03, 1.4]} renderOrder={1} />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.118, 0.58, 0.005]} rotation={[0, 0, s * 0.05]}>
            <mesh geometry={arm} material={headDark} renderOrder={1.1} />
          </group>
        ))}
        <group ref={tilt} position={[0, 0.86, 0]}>
          <group position={[0, 0.07, 0.008]}>
            <mesh geometry={head} material={headDark} scale={[0.056, 0.07, 0.06]} renderOrder={1.2} />
            <mesh geometry={head} material={headBlur} scale={[0.07, 0.085, 0.072]} renderOrder={1} />
            <mesh geometry={head} material={headHalo} scale={[0.088, 0.1, 0.085]} renderOrder={1} />
            {/* where a face should be: only a pale smear, no eyes, no mouth */}
            <group position={[0, -0.004, 0.038]}>
              <mesh geometry={head} material={faceBlur} scale={[0.046, 0.058, 0.026]} renderOrder={1.3} />
              <mesh geometry={head} material={face} scale={[0.036, 0.048, 0.022]} renderOrder={1.4} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
