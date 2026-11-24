import type { ItemCatalog } from '../../items'

/** The restaurant kitchen: a busy service, and the kitchen is starting to notice you. */
export const KITCHEN_ITEMS = {
  // --- the cooking line ---
  range: {
    label: 'range',
    big: true,
    solid: true,
    swaps: [
      { variant: 'roar', text: 'One of the burners is roaring away with a flame most of a metre tall' },
      { variant: 'oven', text: 'The oven door has dropped open' },
    ],
  },
  stockpot: {
    label: 'stockpot',
    swaps: [
      { variant: 'purple', text: 'The stockpot is boiling over with something purple' },
      { variant: 'tentacle', text: 'A tentacle is curling out of the stockpot' },
    ],
  },
  griddle: {
    label: 'griddle',
    big: true,
    solid: true,
    swaps: [
      { variant: 'face', text: 'The food on the griddle has arranged itself into a face' },
      { variant: 'square', text: 'The fried eggs on the griddle are square' },
    ],
  },
  fryer: {
    label: 'deep fryer',
    big: true,
    solid: true,
    swaps: [
      { variant: 'basket', text: 'One of the fryer baskets is hanging up out of the oil' },
      { variant: 'duck', text: 'A rubber duck is bobbing in the fryer' },
    ],
  },
  salamander: {
    label: 'salamander grill',
    big: true,
    swaps: [
      { variant: 'glow', text: 'The salamander grill is glowing red hot' },
      { variant: 'drip', text: 'Melted cheese is pouring out of the salamander grill in long strings' },
    ],
  },
  hood: {
    label: 'extraction hood',
    big: true,
    swaps: [
      { variant: 'filter', text: 'One of the filters in the extraction hood is missing' },
      { variant: 'dark', text: 'The lights in the extraction hood have gone out' },
    ],
  },

  // --- the pass ---
  pass: {
    label: 'pass',
    big: true,
    solid: true,
    swaps: [
      { variant: 'cloche', text: 'One of the plates on the pass is under a cloche now' },
      { variant: 'jelly', text: 'A green jelly is wobbling on the pass' },
    ],
  },
  heatlamps: {
    label: 'heat lamps',
    big: true,
    swaps: [
      { variant: 'blue', text: 'One of the heat lamps is glowing blue' },
      { variant: 'low', text: 'One of the heat lamps has dropped down on its cord' },
    ],
  },
  tickets: {
    label: 'order tickets',
    swaps: [
      { variant: 'help', text: 'One of the order tickets says HELP' },
      { variant: 'long', text: 'One order ticket is nearly a metre long' },
    ],
  },

  // --- prep ---
  fish: {
    label: 'fish',
    scale: 'up',
    swaps: [
      { variant: 'staring', text: 'The fish on the prep table has turned to watch you' },
      { variant: 'bones', text: 'The fish on the chopping board is just a skeleton now' },
    ],
  },
  knives: {
    label: 'knife rack',
    swaps: [
      { variant: 'spoon', text: 'There is a spoon in the knife rack' },
      { variant: 'cleaver', text: 'The cleaver has gone from the knife rack' },
    ],
  },
  boards: {
    label: 'chopping boards',
    swaps: [{ variant: 'cheese', text: 'One of the chopping boards is a slab of cheese' }],
  },
  utensils: {
    label: 'utensil rack',
    big: true,
    swaps: [
      { variant: 'swing', text: 'One of the ladles is swinging on its own' },
      { variant: 'whisk', text: 'One of the hanging whisks is enormous' },
    ],
  },

  // --- storage ---
  walkin: {
    label: 'walk-in fridge door',
    big: true,
    solid: true,
    wall: true,
    swaps: [
      { variant: 'frost', text: 'The walk-in fridge window is frosted, with a handprint from the inside' },
      { variant: 'ajar', text: 'The walk-in fridge door is open a crack' },
    ],
  },
  whiteboard: {
    label: 'whiteboard',
    wall: true,
    swaps: [{ variant: 'you', text: 'Someone has added YOU to the prep list on the whiteboard' }],
  },
  shelving: {
    label: 'pot shelves',
    big: true,
    solid: true,
    swaps: [
      { variant: 'missing', text: 'A stockpot has gone from the shelves' },
      { variant: 'tower', text: 'The pans on the top shelf are stacked up to the ceiling' },
    ],
  },

  // --- the dish corner ---
  sink: {
    label: 'pot-wash sink',
    big: true,
    solid: true,
    swaps: [
      { variant: 'thrash', text: 'The spray arm over the sink is thrashing about on its own, spraying water everywhere' },
      { variant: 'bubbles', text: 'The sink is overflowing with bubbles' },
    ],
  },
  dishwasher: {
    label: 'dishwasher',
    big: true,
    solid: true,
    swaps: [{ variant: 'open', text: 'The dishwasher hood has been lifted up' }],
  },
  plates: {
    label: 'stack of plates',
    scale: 'up',
    swaps: [{ variant: 'lean', text: 'The stack of dirty plates is leaning over impossibly far' }],
    // a taller stack leaning over would reach the shelf above
    clashes: [[{ kind: 'scale' }, { kind: 'swap', variant: 'lean' }]],
  },
  mop: {
    label: 'mop bucket',
    solid: true,
    recolor: true,
    swaps: [{ variant: 'standing', text: 'The mop is standing up on its own' }],
  },

  // --- by the door ---
  door: {
    label: 'swing door',
    big: true,
    wall: true,
    recolor: true,
    swaps: [{ variant: 'face', text: 'Someone is peering in through the swing door window' }],
  },
  handsink: {
    label: 'hand-wash sink',
    swaps: [
      { variant: 'running', text: 'The tap on the hand-wash sink is running' },
      { variant: 'sign', text: 'The sign over the hand-wash sink says NOW WASH MY HANDS' },
    ],
  },
  hat: {
    label: "chef's hat",
    recolor: true,
    swaps: [{ variant: 'float', text: "The chef's hat is floating above its hook" }],
  },
  blanket: {
    label: 'fire blanket',
    wall: true,
    recolor: true,
    turns: [{ angle: Math.PI, text: 'The fire blanket is upside down' }],
    // pulled out and then turned over, the blanket would hang upwards
    swaps: [{ variant: 'pulled', text: 'Someone has pulled the fire blanket half out', blockedBy: [{ kind: 'turn' }] }],
  },
} satisfies ItemCatalog
