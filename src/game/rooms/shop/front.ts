/*
 * The shop front: where the big window and the door's glass are in the front
 * wall (which has real holes there), and how the street outside is shared
 * between them. Street x 0 is the middle of the window, +x to your right
 * looking out, so the door is at negative x.
 */

export const SHOP_WINDOW = { x: -2.4, y: 1.55, width: 3.4, height: 1.3 }
export const SHOP_DOOR = { x: 1.6, glass: { width: 0.62, y0: 0.905, y1: 1.855 } }

/** Where the door is along the street. */
export const DOOR_ALONG = SHOP_WINDOW.x - SHOP_DOOR.x
/** The window draws the street from here rightwards, the door from here leftwards: halfway between them. */
export const STREET_SPLIT = (-SHOP_WINDOW.width / 2 + DOOR_ALONG + SHOP_DOOR.glass.width / 2) / 2
