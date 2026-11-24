import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import { Vector3, type Group } from 'three'

/**
 * Turns about the vertical only, so its +z side faces wherever you are; for
 * things that stand upright (a statue, a mannequin) and mustn't tip over the
 * way FacesYou would tip them. It turns slowly, like a head following you.
 */
export function Watching({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  const at = useRef(new Vector3())
  useFrame(({ camera }, dt) => {
    const g = ref.current
    if (!g?.parent) return
    const p = at.current.copy(camera.position)
    g.parent.worldToLocal(p)
    const want = Math.atan2(p.x - g.position.x, p.z - g.position.z)
    let d = want - g.rotation.y
    d = Math.atan2(Math.sin(d), Math.cos(d))
    g.rotation.y += d * Math.min(1, dt * 2.5)
  })
  return <group ref={ref}>{children}</group>
}
