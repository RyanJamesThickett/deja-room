/**
 * Capture the mouse on `el`. Asks for raw ("unadjusted") movement first:
 * besides skipping OS acceleration, it avoids Chrome's habit of reporting a
 * huge bogus jump now and then. Falls back to a normal lock where raw input
 * isn't supported. Must be called from a click or key press.
 */
export async function requestLock(el: HTMLElement): Promise<void> {
  try {
    await el.requestPointerLock({ unadjustedMovement: true })
  } catch {
    await el.requestPointerLock()
  }
}
