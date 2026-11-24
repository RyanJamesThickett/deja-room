import type { ItemCatalog } from '../../items'

const QUARTER = Math.PI / 2
const FLIP = Math.PI

/** The museum: a gallery of old masters and antiquities and a natural history gallery, keeping an eye on their visitors. */
export const MUSEUM_ITEMS = {
  landscape: {
    label: 'big painting',
    big: true,
    wall: true,
    swaps: [
      { variant: 'sitter', text: 'Someone is sitting on a bench inside the big painting' },
      { variant: 'monster', text: 'Something with a long neck is swimming in the lake in the big painting' },
    ],
  },
  portrait: {
    label: 'portrait',
    big: true,
    wall: true,
    swaps: [
      { variant: 'watching', text: "The portrait's eyes are following you" },
      { variant: 'grin', text: 'The man in the portrait is grinning' },
    ],
  },
  stilllife: {
    label: 'still life',
    wall: true,
    swaps: [
      { variant: 'core', text: 'Someone has eaten the apple in the still life' },
      { variant: 'eyeball', text: 'The apple in the still life is an eyeball now' },
    ],
  },
  seascape: {
    label: 'seascape',
    big: true,
    wall: true,
    swaps: [
      { variant: 'tentacle', text: 'A giant tentacle is rising out of the sea in the seascape' },
      { variant: 'sunk', text: 'The ship in the seascape has sunk' },
    ],
  },
  abstract: {
    label: 'abstract painting',
    big: true,
    wall: true,
    turns: [
      { angle: QUARTER, text: 'The abstract painting is hanging on its side' },
      { angle: FLIP, text: 'The abstract painting is upside down' },
    ],
    // the drip runs down the wall, so it would point sideways on a turned painting
    swaps: [{ variant: 'drip', text: 'Blue paint is dripping out of the abstract painting', blockedBy: [{ kind: 'turn' }] }],
  },
  colossus: {
    label: 'colossal head',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'facing', text: 'The colossal head has turned to watch you' },
      { variant: 'glasses', text: 'The colossal head is wearing sunglasses' },
    ],
  },
  ropes: {
    label: 'rope barrier',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'loose', text: 'One of the ropes round the head has come unhooked' }],
  },
  bench: {
    label: 'bench',
    big: true,
    solid: true,
    recolor: true,
    turns: [{ angle: QUARTER, text: 'The bench has been turned sideways' }],
  },
  skylight: {
    label: 'skylight',
    big: true,
    swaps: [
      { variant: 'hand', text: 'A giant hand is pressed against the skylight' },
      { variant: 'eye', text: 'Something is looking down through the skylight' },
    ],
  },
  case: {
    label: 'display case',
    big: true,
    solid: true,
    swaps: [
      { variant: 'phone', text: 'A mobile phone is on display with the Roman finds' },
      { variant: 'missing', text: 'The little pot has gone from the display case' },
    ],
  },
  vitrine: {
    label: 'glass case',
    big: true,
    solid: true,
    swaps: [
      { variant: 'escaped', text: 'The bronze horse has got out of its glass case' },
      { variant: 'fallen', text: 'The bronze horse has fallen over in its case' },
    ],
  },
  bust: {
    label: 'marble bust',
    turns: [{ angle: FLIP, text: 'The marble bust is facing the wall' }],
    swaps: [
      { variant: 'facing', text: 'The marble bust has turned to watch you', blockedBy: [{ kind: 'turn' }] },
      // one guard, one cap: it can't be on the chair as well
      { variant: 'cap', text: "The marble bust is wearing the guard's cap", blockedBy: [{ item: 'chair', kind: 'swap', variant: 'cap' }] },
    ],
  },
  duchess: {
    label: 'portrait of a lady',
    big: true,
    wall: true,
    swaps: [{ variant: 'climbing', text: 'The lady in the portrait is climbing out of the frame' }],
  },
  pasture: {
    label: 'painting of cows',
    wall: true,
    turns: [{ angle: 0.3, text: 'The painting of cows is hanging crooked' }],
    swaps: [{ variant: 'ufo', text: 'A flying saucer is beaming a cow up in the painting of cows' }],
  },

  // --- the natural history gallery ---
  dino: {
    label: 'dinosaur skeleton',
    big: true,
    solid: true,
    swaps: [
      { variant: 'watching', text: 'The dinosaur skeleton has turned its head to look at you' },
      { variant: 'wagging', text: 'The dinosaur skeleton is wagging its tail' },
    ],
  },
  ptero: {
    label: 'pteranodon',
    big: true,
    turns: [{ angle: FLIP, text: 'The pteranodon is flying the other way' }],
    swaps: [{ variant: 'flapping', text: 'The pteranodon is flapping its wings', blockedBy: [{ kind: 'turn' }] }],
  },
  tusk: {
    label: 'mammoth tusk',
    big: true,
    wall: true,
    turns: [{ angle: FLIP, text: 'The mammoth tusk has been hung upside down' }],
  },
  fossil: {
    label: 'fossil fish',
    big: true,
    solid: true,
    swaps: [{ variant: 'swimming', text: 'The fossil fish has come out of its stone and is swimming round the case' }],
  },
  owl: {
    label: 'stuffed owl',
    swaps: [
      { variant: 'watching', text: 'The stuffed owl is turning its head to follow you' },
      { variant: 'hanging', text: 'The stuffed owl is hanging upside down like a bat' },
    ],
  },
  board: {
    label: 'information board',
    big: true,
    wall: true,
    swaps: [
      { variant: 'swapped', text: 'On the information board, the person is now bigger than the dinosaur' },
      { variant: 'sighted', text: 'Someone has written SEEN THIS MORNING! on the dinosaur board' },
    ],
  },
  ammonite: {
    label: 'ammonite',
    scale: 'up',
    swaps: [{ variant: 'alive', text: 'Something with tentacles is living in the ammonite shell' }],
  },
  eggs: {
    label: 'dinosaur eggs',
    solid: true,
    swaps: [{ variant: 'hatched', text: 'One of the dinosaur eggs has hatched' }],
  },
  meteorite: {
    label: 'meteorite',
    big: true,
    solid: true,
    round: true,
    swaps: [{ variant: 'glowing', text: 'The meteorite is glowing, humming and floating off its plinth' }],
  },
  vase: {
    label: 'vase',
    scale: 'up',
    recolor: true,
    swaps: [{ variant: 'floating', text: 'The vase is upside down, floating above its plinth' }],
  },
  cat: {
    label: 'cat statue',
    turns: [{ angle: FLIP, text: 'The cat statue has turned its back on you' }],
    scale: 'up',
    swaps: [{ variant: 'kitten', text: 'The cat statue has had a kitten' }],
    // a bigger cat and its kitten won't both fit on the plinth
    clashes: [[{ kind: 'scale' }, { kind: 'swap', variant: 'kitten' }]],
  },
  loan: {
    label: 'empty plinth',
    solid: true,
    swaps: [{ variant: 'returned', text: 'The sculpture that was on loan is back' }],
  },
  exit: {
    label: 'exit sign',
    wall: true,
    swaps: [
      { variant: 'entrance', text: 'The exit sign says ENTRANCE' },
      { variant: 'mirror', text: 'The man on the exit sign is running the other way' },
    ],
  },
  chair: {
    label: "guard's chair",
    solid: true,
    turns: [{ angle: FLIP, text: "The guard's chair is facing the wall" }],
    swaps: [{ variant: 'cap', text: "The guard's cap has been left on the chair" }],
  },
  donations: {
    label: 'donations box',
    solid: true,
    swaps: [
      { variant: 'teeth', text: 'The donations box is full of teeth' },
      { variant: 'empty', text: 'Someone has emptied the donations box' },
    ],
  },
  sign: {
    label: 'gallery sign',
    wall: true,
    swaps: [{ variant: 'thisroom', text: 'The gallery sign just says THIS ROOM' }],
  },
  notice: {
    label: 'do not touch sign',
    solid: true,
    swaps: [{ variant: 'touch', text: 'The sign says PLEASE TOUCH now' }],
  },
} satisfies ItemCatalog
