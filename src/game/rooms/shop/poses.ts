import type { Object3D } from 'three'

const DRAWER = 'CashRegister_011_drawer'

/** The model ships with the cash drawer slightly out; push it shut. */
export function closeTillDrawer(root: Object3D) {
  const drawer = root.getObjectByName(DRAWER)
  if (drawer) drawer.position.z -= 0.09
}

/** Slide the cash drawer right out. */
export function openTillDrawer(root: Object3D) {
  const drawer = root.getObjectByName(DRAWER)
  if (drawer) drawer.position.z += 0.2
}
