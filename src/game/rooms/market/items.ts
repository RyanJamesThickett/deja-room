import type { ItemCatalog } from '../../items'

const FLIP = Math.PI
const QUARTER = Math.PI / 2

/** The city market: a perfectly ordinary Sunday market, apart from everything. */
export const MARKET_ITEMS = {
  // --- the stalls, north side ---
  fish: {
    label: 'fish stall',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'catfish', text: 'One of the fish has grown whiskers and cat ears' },
      { variant: 'stare', text: 'A fish on the ice has sat up to stare at you' },
      { variant: 'bones', text: 'One of the fish is just bones now' },
    ],
  },
  cheese: {
    label: 'cheese stall',
    big: true,
    solid: true,
    swaps: [
      { variant: 'snail', text: 'A giant snail is crawling over the cheese' },
      { variant: 'tower', text: 'The cheese wheels are stacked in a tall tower' },
      { variant: 'stripes', text: "The cheese stall's awning stripes run the other way" },
    ],
  },
  bakery: {
    label: 'bakery stall',
    big: true,
    solid: true,
    swaps: [
      { variant: 'giant', text: 'A doughnut the size of a tyre appeared on the bakery stall' },
      { variant: 'halo', text: 'The chocolate doughnuts are floating in a ring' },
    ],
  },
  flowers: {
    label: 'flower stall',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'black', text: 'The red roses have all turned black' },
      { variant: 'watch', text: 'The sunflowers have turned to watch you' },
    ],
  },
  // --- the stalls, south side ---
  fruit: {
    label: 'fruit and veg stall',
    big: true,
    solid: true,
    swaps: [
      { variant: 'square', text: 'The watermelons are square' },
      { variant: 'blue', text: 'The bananas have turned blue' },
    ],
  },
  antiques: {
    label: 'antiques stall',
    big: true,
    solid: true,
    swaps: [
      { variant: 'watch', text: 'The marble bust has turned to look at you' },
      { variant: 'horn', text: "The gramophone's horn has grown enormous" },
    ],
  },
  records: {
    label: 'record stall',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'flying', text: 'Books are flapping round over the record stall' },
      { variant: 'melted', text: 'Some records have melted over the edge of the table' },
    ],
  },
  hats: {
    label: 'hat stall',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'floating', text: 'The hats are floating above their heads' },
      { variant: 'stacked', text: 'All the hats are piled up on one head' },
    ],
  },

  // --- the middle of the square ---
  fountain: {
    label: 'fountain',
    big: true,
    solid: true,
    round: true,
    swaps: [
      { variant: 'frozen', text: 'The fountain has frozen solid' },
      { variant: 'ducks', text: 'Rubber ducks are paddling round the fountain' },
    ],
  },
  statue: {
    label: 'statue',
    big: true,
    turns: [
      { angle: QUARTER, text: 'The statue has turned to face the other way' },
      { angle: FLIP, text: 'The statue is facing backwards' },
    ],
    swaps: [
      { variant: 'watch', text: 'The statue is turning to watch you', blockedBy: [{ kind: 'turn' }] },
      { variant: 'duck', text: 'The statue is a giant rubber duck now' },
      { variant: 'cat', text: 'The statue has become a cat' },
    ],
  },
  bunting: {
    label: 'bunting',
    big: true,
    swaps: [
      { variant: 'socks', text: 'The bunting is a line of socks now' },
      { variant: 'upside', text: 'The bunting flags are pointing up' },
    ],
  },
  letters: {
    label: 'lettered bunting',
    big: true,
    swaps: [
      { variant: 'backwards', text: 'The bunting is spelt backwards' },
      { variant: 'watching', text: 'The bunting says WE SEE YOU' },
    ],
  },
  'lamp-east': {
    label: 'lamppost',
    solid: true,
    round: true,
    swaps: [{ variant: 'bent', text: 'A lamppost has bent over to read the paper' }],
  },
  'lamp-west': {
    label: 'lamppost with flower baskets',
    solid: true,
    round: true,
    scale: 'up',
    swaps: [{ variant: 'lit', text: 'A lamppost has come on in broad daylight' }],
  },
  bench: {
    label: 'bench',
    solid: true,
    scale: 'both',
    turns: [{ angle: FLIP, text: 'A bench has turned its back on the fountain' }],
    swaps: [{ variant: 'melted', text: 'A bench has melted' }],
  },
  bin: {
    label: 'litter bin',
    solid: true,
    round: true,
    swaps: [
      { variant: 'overflow', text: 'The bin by the bench is overflowing' },
      { variant: 'eyes', text: 'Something is peering out of the bin' },
    ],
  },
  case: {
    label: "busker's guitar case",
    swaps: [
      { variant: 'buttons', text: "The coins in the busker's case have turned into buttons" },
      { variant: 'pigeon', text: "A pigeon is sitting in the busker's case" },
    ],
  },
  guitar: {
    label: "busker's guitar",
    scale: 'down',
    turns: [{ angle: FLIP, text: "The busker's guitar has turned round" }],
  },
  'busker-sign': {
    label: "busker's sign",
    swaps: [{ variant: 'stop', text: "The busker's sign says PLEASE STOP LISTENING" }],
  },
  pigeon: {
    label: 'pigeon',
    scale: 'up',
    swaps: [{ variant: 'hat', text: 'A pigeon is wearing a tiny top hat' }],
  },
  balloons: {
    label: 'balloon cart',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'sinking', text: 'The balloons have sunk to the ground' },
      { variant: 'huge', text: 'One of the balloons is enormous' },
    ],
  },
  'food-van': {
    label: 'hot dog van',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'queue', text: 'Shadowy figures are queueing at the hot dog van' },
      { variant: 'shut', text: 'The hot dog van has shut its hatch' },
    ],
  },
  menu: {
    label: "hot dog van's chalkboard",
    solid: true,
    swaps: [{ variant: 'tomorrow', text: "The hot dog menu is selling tomorrow" }],
  },
  coffee: {
    label: 'coffee cart',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'steam', text: 'The coffee cart is billowing steam' },
      { variant: 'cups', text: 'A tower of cups is rising out of the coffee cart' },
    ],
  },
  van: {
    label: 'delivery van',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'ajar', text: "The delivery van's back doors are open" }],
  },
  'phone-box': {
    label: 'phone box',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'figure', text: "Someone is standing in the phone box" }],
  },
  'post-box': {
    label: 'post box',
    solid: true,
    round: true,
    scale: 'down',
    swaps: [{ variant: 'letters', text: 'Letters are spilling out of the post box' }],
  },
  tree: {
    label: 'tree',
    big: true,
    solid: true,
    swaps: [
      { variant: 'autumn', text: 'The tree has gone autumn colours' },
      { variant: 'bare', text: 'The tree has lost all its leaves' },
    ],
  },
  bike: {
    label: 'bike',
    solid: true,
    swaps: [
      { variant: 'wheel', text: 'Someone stole the bike and left the front wheel' },
      { variant: 'penny', text: 'The bike is a penny-farthing now' },
    ],
  },
  'fruit-board': {
    label: "fruit stall's chalkboard",
    solid: true,
    swaps: [{ variant: 'yesterday', text: 'The fruit chalkboard says FRESH YESTERDAY' }],
  },
  'cheese-board': {
    label: "cheese stall's chalkboard",
    solid: true,
    swaps: [{ variant: 'moon', text: 'The cheese of the day is the moon' }],
  },
  crates: {
    label: 'stack of crates',
    solid: true,
    swaps: [{ variant: 'fallen', text: 'The stack of crates has toppled over' }],
  },
  'cafe-table': {
    label: 'café table',
    solid: true,
    swaps: [
      { variant: 'stacked', text: "A café table's chairs are stacked up on it" },
      { variant: 'cup', text: 'A giant teacup is sitting on a café table' },
    ],
  },
  rail: {
    label: 'clothes rail',
    solid: true,
    swaps: [
      { variant: 'empty', text: 'The clothes rail is empty, hangers swinging' },
      { variant: 'invisible', text: 'Someone invisible is wearing a coat by the clothes rail' },
    ],
  },
  mannequin: {
    label: 'mannequin',
    big: true,
    solid: true,
    round: true,
    swaps: [
      { variant: 'watch', text: 'The mannequin is turning to watch you' },
      { variant: 'wave', text: 'The mannequin is waving' },
    ],
  },

  // --- on the buildings ---
  clock: {
    label: 'clock',
    big: true,
    wall: true,
    turns: [{ angle: FLIP, text: 'The clock is upside down' }],
    swaps: [
      { variant: 'thirteen', text: 'The clock has thirteen hours' },
      { variant: 'backwards', text: 'The numbers on the clock run backwards' },
      { variant: 'melted', text: 'The clock has melted' },
    ],
  },
  billboard: {
    label: 'billboard',
    big: true,
    wall: true,
    swaps: [
      { variant: 'eyes', text: 'The face on the billboard has woken up' },
      { variant: 'text', text: "The billboard says YOU'VE BEEN HERE BEFORE" },
    ],
  },
  'fire-escape': {
    label: 'fire escape',
    big: true,
    wall: true,
    swaps: [
      { variant: 'ladder', text: "The fire escape's ladder has come down" },
      { variant: 'washing', text: 'Washing is hanging on the fire escape' },
    ],
  },
  window: {
    label: 'upstairs window',
    big: true,
    wall: true,
    swaps: [
      { variant: 'figure', text: 'Someone is watching from an upstairs window' },
      { variant: 'drawn', text: 'Red curtains are drawn in an upstairs window' },
    ],
  },
  shutter: {
    label: "pawnbroker's shutter",
    big: true,
    wall: true,
    swaps: [
      { variant: 'open', text: "The pawnbroker's shutter is half up" },
      { variant: 'eye', text: 'The graffiti on the shutter is a big eye now' },
    ],
  },
  'cafe-awning': {
    label: "café's awning",
    big: true,
    wall: true,
    recolor: true,
    swaps: [{ variant: 'rolled', text: "The café's awning is rolled up" }],
  },
  flag: {
    label: 'flag',
    big: true,
    wall: true,
    swaps: [
      { variant: 'pirate', text: 'The flag is a pirate flag' },
      { variant: 'halfmast', text: 'The flag is at half mast' },
    ],
  },
  dish: {
    label: 'satellite dish',
    wall: true,
    swaps: [{ variant: 'watch', text: 'The satellite dish is pointing at you' }],
  },
  'pub-sign': {
    label: 'pub sign',
    wall: true,
    swaps: [{ variant: 'headless', text: "The king on the pub sign has lost his head" }],
  },
  pharmacy: {
    label: 'pharmacy cross',
    wall: true,
    swaps: [{ variant: 'heart', text: "The pharmacy's cross is a beating heart" }],
  },
  'barber-pole': {
    label: "barber's pole",
    wall: true,
    scale: 'up',
    recolor: true,
  },
} satisfies ItemCatalog
