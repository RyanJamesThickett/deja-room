import type { ItemCatalog } from '../../items'

const FLIP = Math.PI

/** The gym: a 24-hour high-street gym, open all night, a bit too open. */
export const GYM_ITEMS = {
  treadmills: {
    label: 'treadmills',
    big: true,
    solid: true,
    swaps: [
      { variant: 'running', text: 'The middle treadmill is running on its own' },
      { variant: 'incline', text: 'The middle treadmill is tilted right up' },
    ],
  },
  bike: {
    label: 'exercise bike',
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'pedalling', text: 'Someone invisible is pedalling the exercise bike' },
      { variant: 'basket', text: 'The exercise bike has a wicker basket on the front' },
    ],
  },
  rower: {
    label: 'rowing machine',
    big: true,
    solid: true,
    swaps: [
      { variant: 'oars', text: 'The rowing machine has grown oars' },
      { variant: 'seat', text: 'The rowing machine seat has slid to the far end' },
    ],
  },
  tv: {
    label: 'TV',
    big: true,
    swaps: [
      { variant: 'plan', text: 'The TV is showing the gym from above, with you in it' },
      { variant: 'off', text: 'The TV has been switched off' },
    ],
  },
  window: {
    label: 'window',
    big: true,
    wall: true,
    swaps: [{ variant: 'day', text: "It's daytime through the window, but still night through the door" }],
  },
  door: {
    label: 'front door',
    big: true,
    wall: true,
    swaps: [{ variant: 'ajar', text: 'The front door is standing ajar' }],
  },
  mirror: {
    label: 'mirror',
    big: true,
    wall: true,
    swaps: [
      { variant: 'figure', text: 'Someone is standing behind you in the mirror' },
      { variant: 'missing', text: 'The exercise ball has no reflection' },
    ],
  },
  dumbbells: {
    label: 'dumbbell rack',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'cheese', text: 'One of the dumbbells is a wheel of cheese' },
      { variant: 'gap', text: 'A pair of dumbbells has gone from the rack' },
    ],
  },
  bench: {
    label: 'bench',
    solid: true,
    recolor: true,
    swaps: [{ variant: 'flat', text: "The bench's backrest has been put down flat" }],
  },
  kettlebells: {
    label: 'kettlebells',
    // not solid as a whole row: each bell is its own round solid (see Kettlebell)
    swaps: [
      { variant: 'face', text: 'One of the kettlebells has a face, and it watches you' },
      { variant: 'float', text: 'One of the kettlebells is floating' },
    ],
  },
  'squat-rack': {
    label: 'squat rack',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'lopsided', text: 'All the plates have gone from one end of the barbell' },
      { variant: 'bent', text: 'The barbell is bent in the middle' },
    ],
  },
  plates: {
    label: 'weight plates',
    solid: true,
    round: true,
    recolor: true,
    swaps: [{ variant: 'donut', text: 'One of the weight plates is a doughnut' }],
  },
  cable: {
    label: 'cable machine',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'stack', text: 'The cable machine weights are lifted, with nobody pulling' }],
  },
  desk: {
    label: 'reception desk',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'stare', text: 'The reception computer has turned to watch you' }],
  },
  sign: {
    label: 'gym sign',
    big: true,
    wall: true,
    recolor: true,
    swaps: [{ variant: 'worms', text: 'The sign says IRONWORMS now' }],
  },
  timer: {
    label: 'wall clock',
    wall: true,
    swaps: [{ variant: 'wrong', text: 'The clock over the mirror says 66:66' }],
  },
  poster: {
    label: 'slogan poster',
    wall: true,
    swaps: [{ variant: 'sinister', text: 'The poster says WE SAW WHAT YOU DID YESTERDAY' }],
  },
  poster2: {
    label: 'sweat poster',
    wall: true,
    recolor: true,
    turns: [{ angle: FLIP, text: 'The SWEAT poster is upside down' }],
  },
  cooler: {
    label: 'water cooler',
    solid: true,
    swaps: [
      { variant: 'fish', text: 'There are goldfish in the water cooler' },
      { variant: 'empty', text: 'The water cooler bottle is empty' },
    ],
  },
  towels: {
    label: 'towels',
    wall: true,
    swaps: [{ variant: 'upward', text: 'One of the towels is hanging upwards' }],
  },
  ball: {
    label: 'exercise ball',
    solid: true,
    round: true,
    scale: 'up',
    recolor: true,
    swaps: [{ variant: 'deflated', text: 'The exercise ball has gone flat' }],
  },
} satisfies ItemCatalog
