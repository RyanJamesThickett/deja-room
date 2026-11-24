import type { Camera, Material, Mesh, Object3D, Scene, ShaderMaterial, Texture, WebGLRenderer } from 'three'

/*
 * Getting a freshly mounted room onto the GPU without freezing the page.
 *
 * Left alone, the first frame of a new room uploads every texture and compiles
 * every shader in one go. Chrome does both on its GPU thread, which also draws
 * the page's CSS animations, so everything (including the loading screen)
 * stutters. Instead: stop rendering, upload textures a few at a time, compile
 * shaders in parallel (KHR_parallel_shader_compile), then start rendering again.
 */

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Upload budget per frame, in milliseconds. */
const SLICE_MS = 8

function texturesOf(root: Object3D) {
  const found = new Set<Texture>()
  const take = (value: unknown) => {
    if ((value as Texture | null)?.isTexture) found.add(value as Texture)
  }
  root.traverse((o) => {
    const material = (o as Mesh).material as Material | Material[] | undefined
    if (!material) return
    for (const m of Array.isArray(material) ? material : [material]) {
      Object.values(m).forEach(take)
      const uniforms = (m as ShaderMaterial).uniforms
      if (uniforms) Object.values(uniforms).forEach((u) => take(u?.value))
    }
  })
  return [...found]
}

/** Resolves once `root` can be drawn without stalling. Pass `isCancelled` to bail out early. */
export async function warmUp(gl: WebGLRenderer, scene: Scene, camera: Camera, root: Object3D, isCancelled: () => boolean) {
  const pending = texturesOf(root)
  while (pending.length > 0) {
    if (isCancelled()) return
    const start = performance.now()
    // always at least one per frame, then as many as fit in the slice
    do gl.initTexture(pending.pop()!)
    while (pending.length > 0 && performance.now() - start < SLICE_MS)
    await nextFrame()
  }
  if (isCancelled()) return
  // every material in the scene, hidden swap variants included, so later swaps don't stall either
  await gl.compileAsync(scene, camera)
}
