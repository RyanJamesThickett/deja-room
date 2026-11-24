import type { ItemCatalog } from '../../items'

const HALF = Math.PI / 2
const FLIP = Math.PI

export const SPACESHIP_ITEMS = {
  viewport: {
    label: 'viewport',
    big: true,
    wall: true,
    swaps: [
      { variant: 'blackhole', text: 'A black hole has turned up outside' },
      { variant: 'earth', text: 'The ship is orbiting a different planet' },
      { variant: 'whale', text: 'A whale is swimming past the viewport' },
    ],
  },
  lights: {
    label: 'ceiling lights',
    big: true,
    swaps: [{ variant: 'alert', text: 'The ship has gone to red alert' }],
  },
  chair: {
    label: "captain's chair",
    big: true,
    solid: true,
    turns: [{ angle: FLIP, text: "The captain's chair is facing the wrong way" }],
    recolor: true,
    // a spinning chair shows no sign of having been turned
    swaps: [{ variant: 'spin', text: "The captain's chair is spinning on its own", blockedBy: [{ kind: 'turn' }] }],
  },
  console: {
    label: 'control console',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'alarm', text: 'Every light on the console is flashing red' }],
  },
  'red-button': {
    label: 'big red button',
    scale: 'up',
    recolor: true,
  },
  hologram: {
    label: 'hologram',
    big: true,
    // a see-through glow in another colour is hard to read; the pedestal alone is solid (see the room)
    swaps: [
      { variant: 'cube', text: 'The hologram is projecting a cube' },
      { variant: 'knot', text: 'The hologram is projecting a knot' },
    ],
  },
  tank: {
    label: 'specimen tank',
    big: true,
    solid: true,
    round: true,
    // no recolour: it's all glass and glowing liquid, and a new tint barely shows
    swaps: [{ variant: 'awake', text: 'The thing in the specimen tank woke up' }],
  },
  crates: {
    label: 'cargo crates',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'fallen', text: 'The top crate fell off the stack' }],
  },
  airlock: {
    label: 'airlock',
    big: true,
    wall: true,
    recolor: true,
    swaps: [{ variant: 'open', text: 'The airlock is open… onto space' }],
  },
  drone: {
    label: 'robot drone',
    recolor: true,
    swaps: [
      { variant: 'asleep', text: 'The robot drone switched itself off and dropped to the floor' },
      { variant: 'pair', text: 'A second robot drone has turned up' },
    ],
  },
  duck: {
    label: 'rubber duck',
    scale: 'up',
    turns: [{ angle: FLIP, text: 'The rubber duck is facing the other way' }],
    swaps: [{ variant: 'helmet', text: 'The rubber duck is wearing a space helmet' }],
  },
  helmet: {
    label: 'space helmet',
    turns: [{ angle: FLIP, text: 'The space helmet turned to face the wall' }],
    recolor: true,
    // the eyes are behind the visor, so they'd be hidden if it faces the wall
    swaps: [{ variant: 'occupied', text: 'Something is looking out of the space helmet', blockedBy: [{ kind: 'turn' }] }],
  },
  mug: {
    label: 'floating mug',
    scale: 'both',
    recolor: true,
    swaps: [{ variant: 'blob', text: 'The floating coffee blob is huge now' }],
  },
  poster: {
    label: 'poster',
    wall: true,
    turns: [
      { angle: FLIP, text: 'The poster is upside down' },
      { angle: HALF, text: 'The poster is hanging sideways' },
    ],
    recolor: true,
    swaps: [{ variant: 'other', text: 'The poster is a different poster' }],
  },

  // the corridor
  sign: {
    label: 'deck sign',
    wall: true,
    turns: [{ angle: FLIP, text: 'The deck sign is upside down' }],
    // upside down, the arrows swap round too, which would muddle the wrong-way arrow
    swaps: [{ variant: 'lost', text: 'The sign says engineering is back the way you came', blockedBy: [{ kind: 'turn' }] }],
  },
  boots: {
    label: 'magnetic boots',
    solid: true,
    turns: [{ angle: FLIP, text: 'The boots turned to face the wall' }],
    swaps: [{ variant: 'ceiling', text: 'The magnetic boots are standing on the ceiling' }],
  },
  vent: {
    label: 'air vent',
    wall: true,
    recolor: true,
    swaps: [
      { variant: 'tentacle', text: 'A tentacle is poking out of the air vent' },
      { variant: 'sock', text: 'A sock got sucked into the air vent and stopped the fan' },
    ],
  },

  // the engine room
  reactor: {
    label: 'reactor',
    big: true,
    solid: true,
    round: true,
    recolor: true,
    swaps: [
      { variant: 'door', text: 'The door of the reactor cage is open' },
      { variant: 'heart', text: 'The reactor core is a beating heart' },
    ],
  },
  coolant: {
    label: 'coolant tank',
    big: true,
    solid: true,
    round: true,
    recolor: true,
    swaps: [
      { variant: 'low', text: 'The coolant level in the tank has dropped right down' },
      { variant: 'fish', text: 'There is a goldfish swimming in the coolant' },
    ],
  },
  desk: {
    label: 'engine control desk',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'lever', text: 'Someone pulled the big lever on the engine desk' },
      { variant: 'smile', text: 'The engine monitor is smiling at you' },
    ],
  },
  lockers: {
    label: 'lockers',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'ajar', text: 'The middle locker is open' },
      { variant: 'eyes', text: 'Something is peering out of a locker' },
    ],
  },
  gauges: {
    label: 'pressure gauges',
    wall: true,
    recolor: true,
    swaps: [
      { variant: 'redline', text: 'One of the pressure gauges is in the red' },
      { variant: 'eye', text: 'One of the pressure gauges is an eye, and it is watching you' },
    ],
  },
  valve: {
    label: 'valve wheel',
    wall: true,
    scale: 'up',
    recolor: true,
    // a bigger valve would put the fallen wheel through the floor
    swaps: [{ variant: 'dropped', text: 'The valve wheel came off and is lying on the floor', blockedBy: [{ kind: 'scale' }] }],
  },
  steam: {
    label: 'pipe joint',
    wall: true,
    swaps: [
      { variant: 'leak', text: 'A pipe joint is leaking steam' },
      { variant: 'plaster', text: 'Someone stuck a giant plaster on a pipe joint' },
    ],
  },
  tools: {
    label: 'tool board',
    wall: true,
    swaps: [
      { variant: 'missing', text: 'The spanner is missing from the tool board' },
      { variant: 'spoon', text: 'A spoon is hanging where the spanner was' },
    ],
  },
} satisfies ItemCatalog
