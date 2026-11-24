import type { ItemCatalog } from '../../items'

const FLIP = Math.PI

/** The fire station's appliance bay and the mess behind it: ready for a shout, apart from everything. */
export const FIRESTATION_ITEMS = {
  // --- the engine and its parts ---
  engine: { label: 'fire engine', big: true, solid: true, recolor: true },
  beacons: {
    label: 'blue lights',
    big: true,
    recolor: true,
    swaps: [{ variant: 'flashing', text: "The engine's blue lights are flashing, without a sound" }],
  },
  ladder: {
    label: 'ladder',
    big: true,
    swaps: [
      { variant: 'extended', text: "The engine's ladder has slid out over the back" },
      { variant: 'wooden', text: "The engine's ladder is an old wooden one now" },
    ],
  },
  shutter: {
    label: 'engine locker',
    big: true,
    swaps: [
      { variant: 'ajar', text: "One of the engine's lockers is half open" },
      { variant: 'snake', text: "A hose is creeping out from under one of the engine's lockers" },
    ],
  },
  headlights: {
    label: 'headlights',
    swaps: [
      { variant: 'eyes', text: "The engine's headlights have turned into eyes, and they're watching you" },
      { variant: 'on', text: "The engine's headlights have come on" },
    ],
  },
  cab: {
    label: 'cab door',
    big: true,
    solid: true,
    swaps: [
      { variant: 'open', text: "The driver's door is open, and an empty set of fire kit is sitting at the wheel" },
      { variant: 'dog', text: "A fluffy dog is in the driver's seat with its head out of the window" },
    ],
  },
  board: {
    label: 'display board',
    swaps: [
      { variant: 'see', text: "The engine's display board says I CAN SEE YOU" },
      { variant: 'tea', text: "The engine's display board says GONE FOR TEA" },
    ],
  },
  plate: {
    label: 'number plate',
    swaps: [{ variant: 'neenaw', text: "The engine's number plate now reads NEE NAW" }],
  },
  siren: {
    label: 'siren speaker',
    swaps: [{ variant: 'gramophone', text: "The siren speaker on the bumper is a gramophone horn" }],
  },
  mirror: {
    label: 'wing mirror',
    swaps: [{ variant: 'watching', text: "The wing mirror has turned round to look at you" }],
  },
  reel: {
    label: 'hose reels',
    big: true,
    swaps: [
      { variant: 'unspooled', text: "The rear locker is open, and a hose reel has unwound itself across the floor" },
      { variant: 'sausages', text: "The rear locker is open, and one of the hose reels is wound with sausages" },
    ],
  },
  wheel: {
    label: 'wheel',
    swaps: [
      { variant: 'square', text: "One of the engine's wheels is square" },
      { variant: 'flat', text: "One of the engine's tyres has gone flat" },
    ],
  },

  // --- the pole and the kit wall ---
  pole: {
    label: 'fire pole',
    big: true,
    solid: true,
    swaps: [
      { variant: 'through', text: 'The fire pole now carries on down through a hole in the floor' },
      { variant: 'twist', text: 'The fire pole has gone corkscrew in the middle' },
    ],
  },
  mat: {
    label: 'crash mat',
    recolor: true,
    swaps: [{ variant: 'target', text: 'Someone has painted a target on the crash mat' }],
  },
  lockers: {
    label: 'kit lockers',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'shut', text: 'One of the open lockers has a door on it now' }],
  },
  helmets: {
    label: 'helmets',
    recolor: true,
    swaps: [
      { variant: 'watching', text: 'One of the helmets has turned to watch you' },
      { variant: 'cone', text: 'One of the helmets is a traffic cone' },
    ],
  },
  tunics: {
    label: 'tunics',
    recolor: true,
    swaps: [
      { variant: 'ghost', text: 'One of the tunics is standing up on its own, arms out' },
      { variant: 'tiny', text: 'One of the tunics is child-sized' },
    ],
  },
  boots: {
    label: 'boots',
    recolor: true,
    swaps: [
      { variant: 'goldfish', text: "One of the boots is full of water, and there's a goldfish in it" },
      { variant: 'backwards', text: 'One pair of boots is facing the wrong way' },
    ],
  },

  // --- the equipment wall ---
  hoses: {
    label: 'hose rack',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'bow', text: 'One of the hoses on the rack has been tied in a big red bow' },
      { variant: 'unrolled', text: 'One of the hoses has unrolled onto the floor' },
    ],
  },
  drying: {
    label: 'hoses hung up to dry',
    big: true,
    solid: true,
    swaps: [{ variant: 'knot', text: 'One of the hoses hung up to dry is tied in a big knot' }],
  },
  ba: {
    label: 'breathing apparatus',
    big: true,
    wall: true,
    swaps: [
      { variant: 'balloon', text: 'One of the air cylinders is a balloon' },
      { variant: 'snorkel', text: 'One of the breathing masks is a snorkel and goggles' },
    ],
  },
  shelf: {
    label: 'equipment shelf',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'cat', text: 'A stone cat is sitting on the equipment shelf' },
      { variant: 'empty', text: 'One shelf of the equipment shelf has been cleared' },
    ],
  },
  sink: {
    label: 'mop sink',
    solid: true,
    swaps: [
      { variant: 'running', text: 'The tap over the mop sink is running' },
      { variant: 'duck', text: 'A rubber duck is floating in the mop sink' },
    ],
  },
  extinguisher: {
    label: 'fire extinguishers',
    solid: true,
    scale: 'up',
    swaps: [{ variant: 'upside', text: 'One of the fire extinguishers is standing on its head' }],
  },

  // --- doors, boards and lights ---
  door: {
    label: 'mess door',
    big: true,
    wall: true,
    recolor: true,
    swaps: [
      { variant: 'flap', text: "The mess door has a cat flap in it now, and it's still swinging" },
      { variant: 'inwards', text: 'The mess door is open the other way, back against the wall inside the mess' },
    ],
  },
  baydoor: {
    label: 'bay doors',
    big: true,
    wall: true,
    recolor: true,
    swaps: [
      { variant: 'underwater', text: "It's underwater outside the bay doors" },
      { variant: 'bricked', text: 'One of the bay door windows has been bricked up' },
    ],
  },
  roster: {
    label: 'duty roster',
    big: true,
    wall: true,
    swaps: [
      { variant: 'you', text: "You're on the duty roster, riding BA tonight" },
      { variant: 'clean', text: 'The duty roster has been wiped clean' },
    ],
  },
  noticeboard: {
    label: 'notice board',
    wall: true,
    swaps: [
      { variant: 'missing', text: 'The poster on the notice board is a missing fire engine appeal' },
      { variant: 'upside', text: 'The poster on the notice board is upside down' },
    ],
  },
  clock: {
    label: 'clock',
    wall: true,
    turns: [{ angle: FLIP, text: 'The clock is upside down' }],
    swaps: [{ variant: 'melted', text: 'The clock has melted' }],
  },
  lamps: {
    label: 'ceiling lights',
    big: true,
    swaps: [
      { variant: 'swinging', text: 'One of the ceiling lights is swinging, though nobody touched it' },
      { variant: 'out', text: 'One of the ceiling lights has gone out' },
    ],
  },

  // --- the mess ---
  kettle: {
    label: 'kettle',
    scale: 'up',
    swaps: [{ variant: 'boiling', text: "The kettle is boiling, and there's nobody in the mess" }],
  },
  toaster: {
    label: 'toaster',
    swaps: [{ variant: 'floating', text: 'The toast is hanging in the air over the toaster' }],
  },
  fridge: {
    label: 'fridge',
    big: true,
    solid: true,
    swaps: [
      { variant: 'open', text: "The fridge door is open, and it's full of nothing but milk" },
      { variant: 'letters', text: 'The magnets on the fridge spell BEHIND YOU' },
    ],
  },
  table: {
    label: 'mess table',
    big: true,
    solid: true,
    swaps: [
      { variant: 'tower', text: 'Every mug on the table is stacked into one tall tower' },
      { variant: 'cake', text: 'A birthday cake has turned up on the table, candles lit' },
    ],
  },
  chair: {
    label: 'chair',
    solid: true,
    turns: [{ angle: FLIP, text: 'One of the chairs has turned its back on the table' }],
    swaps: [{ variant: 'ceiling', text: 'One of the chairs is standing upside down on the ceiling' }],
  },
  tv: {
    label: 'TV',
    big: true,
    swaps: [
      { variant: 'static', text: 'The TV has switched itself on to static' },
      { variant: 'tank', text: 'The TV is a fish tank now' },
    ],
  },
  sofa: {
    label: 'sofa',
    big: true,
    solid: true,
    scale: 'down',
    swaps: [{ variant: 'sleeper', text: "Somebody is asleep on the sofa under a blanket. You can see it breathing" }],
  },
  dartboard: {
    label: 'dartboard',
    wall: true,
    swaps: [{ variant: 'axe', text: 'There is a fire axe buried in the bullseye' }],
  },
} satisfies ItemCatalog
