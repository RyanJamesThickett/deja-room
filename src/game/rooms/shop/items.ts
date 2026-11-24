import type { ItemCatalog } from '../../items'

const FLIP = Math.PI

/** The corner shop: a perfectly normal little shop, apart from everything. */
export const SHOP_ITEMS = {
  counter: { label: 'counter', big: true, solid: true, recolor: true },
  register: {
    label: 'till',
    turns: [{ angle: FLIP, text: 'The till is facing the wrong way' }],
    scale: 'up',
    swaps: [{ variant: 'open', text: 'The till drawer is hanging open' }],
  },
  cat: {
    label: 'lucky cat',
    recolor: true,
    swaps: [
      { variant: 'other', text: 'The lucky cat is waving its other paw' },
      { variant: 'stare', text: 'The lucky cat has turned to watch you' },
      { variant: 'pair', text: 'There are two lucky cats now' },
    ],
  },
  jars: {
    label: 'jars of pickles',
    recolor: true,
    swaps: [
      { variant: 'eyes', text: 'The pickles in the jars are eyeballs now' },
      { variant: 'glow', text: 'The jars have started glowing' },
    ],
  },
  'shelf-tins': {
    label: 'shelf of tins',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'ducks', text: 'A shelf of tins has turned into rubber ducks' },
      { variant: 'empty', text: 'A whole shelf of tins has gone' },
    ],
  },
  'shelf-cereal': {
    label: 'shelf of cereal',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'upside', text: 'A shelf of cereal boxes is upside down' },
      { variant: 'tiny', text: 'A shelf of cereal boxes has shrunk' },
    ],
  },
  fridge: {
    label: 'drinks fridge',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'empty', text: 'One of the drinks fridges is empty' },
      { variant: 'eye', text: 'Something is staring out of the drinks fridge' },
    ],
  },
  neon: {
    label: 'neon sign',
    big: true,
    wall: true,
    recolor: true,
    swaps: [
      { variant: 'never', text: 'The neon sign now says OPEN NEVER' },
      { variant: 'closed', text: 'The neon sign says CLOSED' },
    ],
  },
  cctv: {
    label: 'security camera',
    big: true,
    recolor: true,
    swaps: [
      { variant: 'away', text: 'The security camera is pointing at the wall' },
      { variant: 'pair', text: 'A second security camera is watching you' },
    ],
  },
  gumball: {
    label: 'gumball machine',
    solid: true,
    scale: 'up',
    recolor: true,
    swaps: [
      { variant: 'eyes', text: 'The gumballs are eyeballs' },
      { variant: 'empty', text: 'The gumball machine is empty' },
    ],
  },
  boxes: {
    label: 'cardboard boxes',
    solid: true,
    recolor: true,
    swaps: [{ variant: 'fallen', text: 'The top box fell off the pile' }],
  },
  mat: {
    label: 'doormat',
    turns: [{ angle: FLIP, text: 'The doormat is upside down' }],
    recolor: true,
    swaps: [{ variant: 'goaway', text: 'The doormat says GO AWAY now' }],
  },
  clock: {
    label: 'clock',
    wall: true,
    turns: [{ angle: FLIP, text: 'The clock is upside down' }],
    swaps: [
      { variant: 'telephone', text: 'The clock is a different clock' },
      { variant: 'melted', text: 'The clock has melted' },
    ],
  },
  door: {
    label: 'shop door',
    big: true,
    wall: true,
    recolor: true,
    swaps: [{ variant: 'watcher', text: 'Someone is looking in through the shop door' }],
  },
  lights: {
    label: 'strip lights',
    big: true,
    swaps: [
      { variant: 'flicker', text: 'One of the strip lights is flickering' },
      { variant: 'green', text: 'One of the strip lights has turned green' },
    ],
  },
  'shelf-crisps': {
    label: 'shelf of crisps',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'puffed', text: 'The top shelf of crisps has puffed up' },
      { variant: 'float', text: 'A shelf of crisp packets is floating' },
    ],
  },
  loo: {
    label: 'shelf of loo roll',
    big: true,
    solid: true,
    recolor: true,
  },
  freezer: {
    label: 'ice cream freezer',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'fish', text: "There's a huge fish in the ice cream freezer" },
      { variant: 'snowman', text: 'A snowman is sitting in the ice cream freezer' },
    ],
  },
  veg: {
    label: 'fruit and veg',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'faces', text: 'The lemons have grown faces' },
      { variant: 'cubes', text: 'The oranges have gone cube-shaped' },
    ],
  },
  papers: {
    label: 'newspaper stand',
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'weird', text: 'The newspaper headlines are about you now' },
      { variant: 'blank', text: 'Every newspaper is blank' },
    ],
  },
  mags: {
    label: 'magazine rack',
    big: true,
    solid: true,
    wall: true,
    recolor: true,
    swaps: [
      { variant: 'eyes', text: 'Some of the magazine covers are staring eyes' },
      { variant: 'sideways', text: 'A row of magazines is on its side' },
    ],
  },
  'wet-sign': {
    label: 'wet floor sign',
    solid: true,
    scale: 'up',
    recolor: true,
    swaps: [{ variant: 'ceiling', text: 'The sign says WET CEILING now' }],
  },
  staffdoor: {
    label: 'staff door',
    big: true,
    wall: true,
    recolor: true,
    swaps: [{ variant: 'ajar', text: 'The staff door is open, and something is watching' }],
  },
} satisfies ItemCatalog
