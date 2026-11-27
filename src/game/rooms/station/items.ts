import type { ItemCatalog } from '../../items'

const FLIP = Math.PI
const QUARTER = Math.PI / 2

/** Central station at teatime: a perfectly ordinary concourse, apart from everything. */
export const STATION_ITEMS = {
  // --- the north end: the barriers and what hangs over them ---
  departures: {
    label: 'departures board',
    big: true,
    wall: true,
    swaps: [
      { variant: 'atlantis', text: 'The 18:12 to Brighton is going to Atlantis now' },
      { variant: 'delayed', text: 'Every train on the departures board is delayed' },
      { variant: 'arrivals', text: 'The departures board says ARRIVALS' },
    ],
  },
  clock: {
    label: 'station clock',
    big: true,
    turns: [{ angle: QUARTER, text: 'The station clock has turned side-on' }],
    swaps: [
      { variant: 'late', text: 'The station clock says twenty-five past nine', blockedBy: [{ kind: 'turn' }] },
      { variant: 'backwards', text: 'The numbers on the station clock run backwards', blockedBy: [{ kind: 'turn' }] },
      { variant: 'melted', text: 'The station clock has melted' },
    ],
  },
  gates: {
    label: 'ticket barriers',
    big: true,
    solid: true,
    swaps: [
      { variant: 'open', text: 'The ticket barriers are all standing open' },
      { variant: 'red', text: 'Every ticket barrier has a red light' },
      { variant: 'tape', text: 'One of the ticket gates is taped off OUT OF ORDER' },
    ],
  },
  train: {
    label: 'train at platform 2',
    big: true,
    swaps: [
      { variant: 'gone', text: 'The train at platform 2 has left' },
      { variant: 'faces', text: 'Faces are pressed against every window of the train' },
      { variant: 'steam', text: 'The train at platform 2 is a steam engine now' },
    ],
  },
  'platform-signs': {
    label: 'platform numbers',
    big: true,
    swaps: [
      { variant: 'swapped', text: 'Platforms 2 and 3 have swapped numbers' },
      { variant: 'thirteen', text: 'Platform 4 is platform 13 now' },
    ],
  },

  // --- the west side: shops and machines ---
  coffee: {
    label: 'coffee kiosk',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'cup', text: 'A giant coffee cup is sitting on the coffee kiosk' },
      { variant: 'queue', text: 'Shadowy figures are queueing at the coffee kiosk' },
      { variant: 'shut', text: 'The coffee kiosk has pulled its shutter down' },
    ],
  },
  'coffee-board': {
    label: "coffee kiosk's chalkboard",
    solid: true,
    swaps: [{ variant: 'price', text: 'A flat white costs £30 now' }],
  },
  newsagent: {
    label: 'newsagent',
    big: true,
    solid: true,
    swaps: [
      { variant: 'headline', text: "The evening paper's headline says YOU MISSED YOUR TRAIN" },
      { variant: 'blank', text: "All the newsagent's magazine covers have gone blank" },
      { variant: 'sweets', text: "The newsagent's jars of sweets have spilled across the counter" },
    ],
  },
  'photo-booth': {
    label: 'photo booth',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'feet', text: "Someone's feet are showing under the photo booth's curtain" },
      { variant: 'flash', text: "The photo booth's flash keeps going off" },
      { variant: 'broken', text: 'The photo booth has an OUT OF ORDER sign on it' },
    ],
  },
  vending: {
    label: 'snack machine',
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'empty', text: 'The snack machine is empty' },
      { variant: 'stuck', text: 'A bag of crisps is stuck in the snack machine' },
    ],
  },
  lockers: {
    label: 'left-luggage lockers',
    big: true,
    solid: true,
    swaps: [
      { variant: 'open', text: 'One of the luggage lockers is standing open' },
      { variant: 'glow', text: 'Light is glowing out of one of the lockers' },
    ],
  },
  'toilet-sign': {
    label: 'toilets sign',
    wall: true,
    swaps: [{ variant: 'arrow', text: 'The toilets sign is pointing the other way' }],
  },
  flowers: {
    label: 'flower buckets',
    solid: true,
    swaps: [{ variant: 'dead', text: 'The flowers by the doors have all wilted' }],
  },

  // --- the east side: tickets and lost things ---
  'ticket-office': {
    label: 'ticket office',
    big: true,
    wall: true,
    swaps: [
      { variant: 'closed', text: 'A ticket window has its blind down' },
      { variant: 'figure', text: 'Someone is waiting at the ticket office' },
    ],
  },
  machines: {
    label: 'ticket machines',
    big: true,
    solid: true,
    swaps: [
      { variant: 'face', text: 'A face is looking out of a ticket machine' },
      { variant: 'ticket', text: 'A ticket machine is spewing out a very long ticket' },
      { variant: 'dark', text: 'All the ticket machines have gone dark' },
    ],
  },
  'lost-property': {
    label: 'lost property window',
    big: true,
    wall: true,
    swaps: [
      { variant: 'umbrellas', text: 'The lost property window is stuffed with umbrellas' },
      { variant: 'teddy', text: 'A giant teddy bear is sitting in the lost property window' },
      { variant: 'helmet', text: 'Someone has lost a diving helmet' },
    ],
  },
  atm: {
    label: 'cash machine',
    wall: true,
    swaps: [{ variant: 'money', text: 'Banknotes are sticking out of the cash machine' }],
  },
  map: {
    label: 'network map',
    wall: true,
    swaps: [{ variant: 'moved', text: 'The YOU ARE HERE dot on the map has moved' }],
  },
  cleaner: {
    label: "cleaner's trolley",
    solid: true,
    swaps: [
      { variant: 'mop', text: "The cleaner's mop is standing up on its own" },
      { variant: 'spill', text: "The cleaner's bucket has tipped over" },
    ],
  },

  // --- the south end: the doors and the big window ---
  entrance: {
    label: 'main doors',
    big: true,
    swaps: [
      { variant: 'bus', text: 'A red bus has pulled up outside the main doors' },
      { variant: 'rain', text: "It's pouring with rain outside" },
    ],
  },
  window: {
    label: 'fan window',
    big: true,
    wall: true,
    swaps: [
      { variant: 'moon', text: 'A huge moon is peering in through the fan window' },
      { variant: 'night', text: 'Night has fallen outside the fan window' },
    ],
  },
  banner: {
    label: 'banner over the doors',
    big: true,
    wall: true,
    swaps: [
      { variant: 'stay', text: "The banner over the doors says PLEASE DON'T GO" },
      { variant: 'backwards', text: 'The banner over the doors is spelt backwards' },
    ],
  },
  'exit-sign': {
    label: 'WAY OUT sign',
    swaps: [{ variant: 'noway', text: 'The WAY OUT sign says NO WAY OUT' }],
  },
  poster: {
    label: 'seaside poster',
    wall: true,
    swaps: [
      { variant: 'shark', text: 'A shark fin has appeared on the seaside poster' },
      { variant: 'rain', text: "It's raining on the seaside poster" },
    ],
  },
  scooter: {
    label: 'scooter',
    solid: true,
    recolor: true,
    moves: [{ offset: [-23.0, 0, -0.9], text: 'The scooter has moved to the other side of the doors' }],
  },

  // --- the middle of the concourse ---
  info: {
    label: 'information desk',
    big: true,
    solid: true,
    round: true,
    swaps: [
      { variant: 'question', text: 'The information sign is a question mark now' },
      { variant: 'bell', text: 'A giant bell is sitting on the information desk' },
    ],
  },
  cup: {
    label: 'coffee cup',
    scale: 'up',
    moves: [{ offset: [0.65, -0.6, -7.15], text: 'The coffee cup has moved from the information desk to a bench' }],
    clashes: [[{ kind: 'move' }, { item: 'bench', kind: 'scale' }]],
  },
  tree: {
    label: 'Christmas tree',
    big: true,
    solid: true,
    round: true,
    recolor: true,
    swaps: [
      { variant: 'upside', text: 'The Christmas tree is hanging upside down from the roof' },
      { variant: 'bare', text: 'The Christmas tree has lost all its decorations' },
      { variant: 'present', text: 'A giant present has appeared under the Christmas tree' },
    ],
  },
  piano: {
    label: 'piano',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'open', text: "The piano's lid is standing open" },
      { variant: 'keys', text: "The piano's keys have all turned black" },
      { variant: 'music', text: 'Sheet music has appeared on the piano' },
    ],
  },
  'piano-stool': {
    label: 'piano stool',
    solid: true,
    moves: [{ offset: [1.3, 0, 0.5], text: 'The piano stool has been pulled away from the piano' }],
    turns: [{ angle: QUARTER, text: 'The piano stool has been turned sideways' }],
  },
  bench: {
    label: 'bench',
    solid: true,
    scale: 'both',
    turns: [{ angle: FLIP, text: 'A bench has turned its back on the departures board' }],
    swaps: [{ variant: 'paper', text: 'Someone has left a newspaper on the bench' }],
  },
  cat: {
    label: 'cat',
    moves: [
      { offset: [-0.4, 0.88, 9.9], text: 'The cat has moved onto the piano' },
      { offset: [5.7, 0.6, 6.4], text: 'The cat has moved onto the information desk' },
    ],
    swaps: [{ variant: 'awake', text: 'The sleeping cat has woken up and is staring at you' }],
    clashes: [
      [{ kind: 'move' }, { item: 'piano', variant: 'open' }],
      [{ kind: 'move' }, { item: 'info', variant: 'bell' }],
    ],
  },
  trolley: {
    label: 'luggage trolley',
    solid: true,
    moves: [{ offset: [4.0, 0, 12.2], text: 'The luggage trolley has been wheeled over to lost property' }],
    swaps: [
      { variant: 'tower', text: 'The suitcases on the trolley are piled up to the roof' },
      { variant: 'empty', text: 'The luggage trolley is empty' },
    ],
  },
  'trolley-2': {
    label: 'empty trolley',
    solid: true,
    moves: [{ offset: [5.0, 0, 2.0], text: 'The empty trolley has rolled towards the doors' }],
    turns: [{ angle: QUARTER, text: 'The empty trolley has been turned sideways' }],
  },
  suitcase: {
    label: 'red suitcase',
    solid: true,
    recolor: true,
    moves: [
      { offset: [7.0, 0, 11.0], text: 'The red suitcase has moved over by the information desk' },
      { offset: [-7.2, 0, 10.2], text: 'The red suitcase has moved over by the newsagent' },
    ],
    swaps: [{ variant: 'open', text: 'The red suitcase has burst open' }],
  },
  rucksack: {
    label: 'rucksack',
    recolor: true,
    moves: [{ offset: [-4.0, 0, 1.9], text: 'The rucksack has moved next to the Christmas tree' }],
  },
  umbrella: {
    label: 'umbrella',
    recolor: true,
    moves: [
      { offset: [10.83, 0, -4.3], text: 'The umbrella is leaning on the information desk now' },
      { offset: [15.6, 0, -8.3], text: 'The umbrella is leaning on the statue now' },
    ],
    swaps: [{ variant: 'open', text: 'The umbrella has opened by itself' }],
  },
  bin: {
    label: 'litter bin',
    solid: true,
    round: true,
    swaps: [
      { variant: 'overflow', text: 'The bin by the barriers is overflowing' },
      { variant: 'eyes', text: 'Something is peering out of the bin' },
    ],
  },
  pigeon: {
    label: 'pigeon',
    scale: 'up',
    swaps: [
      { variant: 'ticket', text: 'A pigeon has a ticket in its beak' },
      { variant: 'suitcase', text: 'A pigeon is pulling a tiny suitcase' },
    ],
  },
  'wet-floor': {
    label: 'wet floor sign',
    solid: true,
    moves: [{ offset: [-4.0, 0, 6.0], text: 'The wet floor sign has moved' }],
    swaps: [{ variant: 'fallen', text: 'The wet floor sign has slipped over' }],
  },
  statue: {
    label: 'statue',
    big: true,
    solid: true,
    turns: [{ angle: FLIP, text: 'The statue has turned its back on the concourse' }],
    swaps: [
      { variant: 'watch', text: 'The statue is turning to watch you', blockedBy: [{ kind: 'turn' }] },
      { variant: 'umbrella', text: 'The statue is holding up a real umbrella' },
      { variant: 'pigeon', text: "A pigeon is sitting on the statue's hat" },
    ],
  },
  balloon: {
    label: 'balloon',
    recolor: true,
    scale: 'up',
    moves: [
      { offset: [7, 0, 4], text: 'The balloon has drifted across the roof' },
      { offset: [-8, -3.7, 2], text: 'The balloon has drifted down the side of the roof' },
    ],
  },
  cctv: {
    label: 'security camera',
    swaps: [{ variant: 'watch', text: 'A security camera is following you' }],
  },
  speaker: {
    label: 'loudspeaker',
    swaps: [{ variant: 'nest', text: 'Birds are nesting on a loudspeaker' }],
  },
  'help-point': {
    label: 'help point',
    swaps: [{ variant: 'phone', text: "The help point's phone is hanging off the hook" }],
  },
} satisfies ItemCatalog
