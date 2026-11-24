import type { ItemCatalog } from '../../items'

const HALF = Math.PI / 2
const FLIP = Math.PI

/*
 * Everything in the living room that can change. Moves are kept only where
 * the thing ends up somewhere completely different; everything else gets a
 * stranger change instead.
 */
export const LIVING_ITEMS = {
  // --- the big stuff -------------------------------------------------------
  sofa: {
    label: 'sofa',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      // after the other-sofa swap there are no "default" cushions left to vanish
      { variant: 'bare', text: 'The cushions vanished from the sofa', blockedBy: [{ variant: 'other' }] },
      { variant: 'other', text: 'The sofa is a completely different sofa' },
    ],
  },
  rug: {
    label: 'rug',
    big: true,
    turns: [{ angle: HALF, text: 'The rug turned sideways' }],
    swaps: [
      { variant: 'pattern', text: 'The rug has a completely different pattern' },
      // a turned rug would push the tail under the sofa
      { variant: 'tiger', text: "A tiger's tail is poking out from under the rug", blockedBy: [{ kind: 'turn' }] },
    ],
  },
  'coffee-table': {
    label: 'coffee table',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'square', text: 'The coffee table is a different table' }],
  },
  armchair: {
    label: 'armchair',
    big: true,
    solid: true,
    turns: [{ angle: FLIP, text: 'The armchair is facing the wall' }],
    recolor: true,
    swaps: [
      { variant: 'modern', text: 'The armchair is a completely different chair' },
      { variant: 'float', text: 'The armchair is floating off the floor', blockedBy: [{ variant: 'modern' }] },
    ],
  },
  'tv-cabinet': {
    label: 'TV cabinet',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'open', text: 'One of the TV cabinet doors is ajar, and something is glowing inside' }],
  },
  bookshelf: { label: 'bookshelf', big: true, solid: true, recolor: true },
  plant: {
    label: 'plant',
    big: true,
    solid: true,
    scale: 'both',
    swaps: [
      { variant: 'bush', text: 'The plant is a completely different plant' },
      { variant: 'succulent', text: 'The plant turned into a giant succulent' },
      {
        variant: 'bloom',
        text: 'The plant has grown glowing flowers',
        blockedBy: [{ variant: 'bush' }, { variant: 'succulent' }],
      },
    ],
  },
  painting: {
    label: 'painting',
    big: true,
    wall: true,
    turns: [
      { angle: HALF, text: 'The painting is hanging sideways' },
      { angle: FLIP, text: 'The painting is hanging upside down' },
    ],
    scale: 'both',
    swaps: [{ variant: 'fancy', text: 'The painting is a different painting' }],
  },
  curtains: {
    label: 'curtains',
    big: true,
    wall: true,
    recolor: true,
    // closing them would hide whatever the window has turned into
    swaps: [{ variant: 'closed', text: 'The curtains are closed', blockedBy: [{ item: 'window' }] }],
  },
  'jelly-tube': {
    label: 'jelly tube',
    big: true,
    wall: true,
    recolor: true,
    swaps: [
      { variant: 'reverse', text: 'The jelly is flowing the other way, and faster' },
      { variant: 'loop', text: 'The jelly tube grew a loop-de-loop' },
      { variant: 'floor', text: 'The jelly tube now corkscrews up out of the floor' },
    ],
  },
  window: {
    label: 'window',
    big: true,
    wall: true,
    // you can't see out once the curtains are shut
    blockedBy: [{ item: 'curtains', variant: 'closed' }],
    swaps: [{ variant: 'outside', text: 'The view out of the window is suddenly real' }],
  },
  'wall-eye': {
    label: 'eye in the wall',
    big: true,
    wall: true,
    recolor: true,
    swaps: [
      { variant: 'closed', text: 'The eye in the wall fell asleep' },
      { variant: 'pair', text: 'The eye in the wall brought a friend' },
    ],
  },
  stairs: {
    label: 'impossible staircase',
    big: true,
    solid: true,
    swaps: [
      { variant: 'sloped', text: 'The impossible staircase has smoothed into a ramp' },
      { variant: 'reverse', text: 'The impossible staircase now climbs the other way' },
      { variant: 'more', text: 'The impossible staircase grew another flight' },
      { variant: 'walker', text: 'Someone tiny is climbing the impossible staircase' },
    ],
  },

  // --- smaller things ------------------------------------------------------
  mug: {
    label: 'mug',
    scale: 'both',
    recolor: true,
    swaps: [
      { variant: 'glass', text: 'The mug turned into a wine glass' },
      { variant: 'spilled', text: 'The mug got knocked over', blockedBy: [{ variant: 'glass' }] },
    ],
  },
  'table-book': {
    label: 'book on the table',
    recolor: true,
    swaps: [
      { variant: 'stack', text: 'The book became a pile of books' },
      { variant: 'open', text: 'The book on the table is open, and its pages are turning by themselves' },
    ],
  },
  'side-table': { label: 'side table', solid: true, recolor: true },
  vase: {
    label: 'vase',
    scale: 'both',
    recolor: true,
    swaps: [
      { variant: 'brass', text: 'The vase became a tall brass vase' },
      { variant: 'antique', text: 'The vase became an antique painted vase' },
    ],
  },
  lamp: {
    label: 'floor lamp',
    solid: true,
    scale: 'both',
    recolor: true,
    swaps: [
      { variant: 'green', text: 'The floor lamp is glowing green', blockedBy: [{ variant: 'watching' }] },
      { variant: 'watching', text: 'The floor lamp has bent over and is watching you', blockedBy: [{ variant: 'green' }] },
    ],
  },
  tv: {
    label: 'TV',
    moves: [{ offset: [-1.4, -0.68, 0.06], text: 'The TV is on the floor in the corner' }],
    turns: [{ angle: FLIP, text: 'The TV is facing the wall' }],
    scale: 'both',
    // a resized TV doesn't fit the corner it moves to
    clashes: [[{ kind: 'move' }, { kind: 'scale' }]],
    // no point switching it on if the screen is facing the wall
    swaps: [{ variant: 'on', text: 'The TV switched itself on', blockedBy: [{ kind: 'turn' }] }],
  },
  photo: {
    label: 'photo frame',
    turns: [{ angle: FLIP, text: 'The photo frame turned its back on you' }],
    swaps: [{ variant: 'other', text: 'The photo frame has a different photo in it', blockedBy: [{ kind: 'turn' }] }],
  },
  'lava-lamp': {
    label: 'lava lamp',
    moves: [{ offset: [0.35, -0.29, 3.43], text: 'The lava lamp moved onto the coffee table' }],
    scale: 'up',
    recolor: true,
    swaps: [
      { variant: 'globe', text: 'The lava lamp turned into a round globe' },
      { variant: 'rocket', text: 'The lava lamp turned into a rocket' },
    ],
  },
  books: {
    label: 'books',
    recolor: true,
    swaps: [
      { variant: 'fewer', text: 'Most of the books are gone' },
      { variant: 'more', text: 'There are a lot more books' },
    ],
  },
  ornament: {
    label: 'shelf ornament',
    moves: [{ offset: [0, 0.58, 0], text: 'The shelf ornament moved up onto the top of the bookshelf' }],
    swaps: [
      { variant: 'cat', text: 'The shelf ornament turned into a concrete cat' },
      { variant: 'duck', text: 'The shelf ornament turned into a rubber duck' },
      { variant: 'bust', text: 'The shelf ornament turned into a marble bust' },
    ],
  },
  'living-picture': {
    label: 'living picture',
    wall: true,
    scale: 'up',
    swaps: [
      { variant: 'checker', text: 'The living picture changed pattern' },
      { variant: 'eye', text: 'The living picture is staring at you' },
    ],
  },
  clock: {
    label: 'clock',
    wall: true,
    turns: [{ angle: FLIP, text: 'The clock is upside down' }],
    scale: 'up',
    swaps: [
      { variant: 'telephone', text: 'The clock is a different clock' },
      { variant: 'melted', text: 'The clock has melted' },
    ],
  },
  orb: {
    label: 'floating orb',
    scale: 'both',
    recolor: true,
    swaps: [
      { variant: 'cube', text: 'The floating orb is a cube now' },
      { variant: 'split', text: 'The floating orb split into three' },
    ],
  },
  door: {
    label: 'door',
    wall: true,
    recolor: true,
    swaps: [{ variant: 'open', text: 'The door is ajar… onto nothing' }],
  },
  cloud: {
    label: 'rain cloud',
    moves: [{ offset: [-1.1, 0, 0], text: 'The rain cloud drifted over to rain by the window' }],
    recolor: true,
    swaps: [{ variant: 'storm', text: 'The rain cloud turned into a thunderstorm' }],
  },
  fish: {
    label: 'flying fish',
    recolor: true,
    swaps: [
      { variant: 'school', text: 'A lot more fish joined in' },
      { variant: 'shark', text: 'A shark has joined the fish' },
    ],
  },
} satisfies ItemCatalog
