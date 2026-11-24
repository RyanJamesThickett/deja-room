import type { ItemCatalog } from '../../items'

const QUARTER = Math.PI / 2
const FLIP = Math.PI

/** The mechanic's garage: two cars in for repair, and a workshop that's not quite right. */
export const GARAGE_ITEMS = {
  // --- bay one: the car up on the lift ---
  lift: {
    label: 'car lift',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'wobbly', text: 'One of the lift posts has gone wobbly' }],
  },
  'lift-car': {
    label: 'green car',
    big: true,
    solid: true,
    recolor: true,
    // the odd door is red: a red respray would hide it
    swaps: [{ variant: 'door', text: "The green car's front door is off a red car now", blockedBy: [{ kind: 'recolor' }] }],
  },
  'lift-wheels': {
    label: "green car's wheels",
    big: true,
    swaps: [
      { variant: 'square', text: 'One wheel of the green car is square' },
      { variant: 'missing', text: 'A wheel has been taken off the green car' },
    ],
  },
  'lift-lights': {
    label: 'headlights',
    swaps: [
      { variant: 'on', text: "The green car's headlights came on, and they follow you" },
      { variant: 'lashes', text: 'The green car has eyelashes on its headlights' },
    ],
  },
  'drain-pan': {
    label: 'drain pan',
    recolor: true,
    swaps: [{ variant: 'fish', text: 'A goldfish is swimming round the drain pan' }],
  },

  // --- bay two: the car on the floor, bonnet up ---
  'floor-car': {
    label: 'yellow car',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'ears', text: 'The yellow car has grown cat ears' }],
  },
  'floor-wheels': {
    label: "yellow car's wheels",
    swaps: [
      { variant: 'flat', text: "One of the yellow car's tyres has gone flat" },
      { variant: 'wooden', text: 'One wheel of the yellow car is a wooden cart wheel' },
    ],
  },
  bonnet: {
    label: 'bonnet',
    big: true,
    recolor: true,
    swaps: [{ variant: 'baguette', text: 'The bonnet is propped up with a baguette' }],
  },
  engine: {
    label: 'engine',
    big: true,
    swaps: [
      { variant: 'eyes', text: 'The engine has grown eyes' },
      { variant: 'hamster', text: 'The engine is a hamster in a wheel now' },
    ],
  },

  // --- along the walls ---
  pegboard: {
    label: 'tool board',
    big: true,
    wall: true,
    swaps: [
      { variant: 'fish', text: 'One of the spanners on the tool board is a fish' },
      { variant: 'gone', text: 'A hammer is missing from the tool board' },
    ],
  },
  vice: {
    label: 'vice',
    swaps: [
      { variant: 'duck', text: 'The vice is squeezing a rubber duck' },
      { variant: 'teeth', text: 'The vice has grown teeth and is biting the pipe' },
    ],
  },
  calendar: {
    label: 'calendar',
    wall: true,
    swaps: [
      { variant: 'octember', text: 'The calendar says OCTEMBER' },
      { variant: 'gone', text: 'The car has driven out of the calendar picture' },
    ],
  },
  'tool-chest': {
    label: 'tool chest',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'drawer', text: 'A drawer of the tool chest is open' },
      { variant: 'feet', text: 'The tool chest is standing on chicken feet' },
    ],
  },
  shelf: {
    label: 'parts shelf',
    big: true,
    solid: true,
    swaps: [
      { variant: 'gone', text: 'A shelf of boxes has gone from the parts shelf' },
      { variant: 'glow', text: 'Something is glowing in a box on the parts shelf' },
    ],
  },
  drums: {
    label: 'oil drums',
    big: true,
    solid: true,
    recolor: true,
    swaps: [{ variant: 'ooze', text: 'The red oil drum is leaking green goo' }],
  },
  compressor: {
    label: 'air compressor',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'snake', text: 'The end of the air hose is a snake' },
      { variant: 'balloon', text: 'A balloon is being blown up on the air hose' },
    ],
  },
  tyres: {
    label: 'tyre stack',
    big: true,
    solid: true,
    swaps: [
      { variant: 'lean', text: 'The tyre stack is leaning further than it could' },
      { variant: 'donut', text: 'The top tyre is a doughnut' },
    ],
  },
  poster: {
    label: 'oil poster',
    wall: true,
    turns: [{ angle: FLIP, text: 'The oil poster is upside down' }],
    swaps: [{ variant: 'frown', text: 'The oil can on the poster is crying' }],
  },
  'roller-door': {
    label: 'roller door',
    big: true,
    wall: true,
    swaps: [{ variant: 'raised', text: "The roller door is up a crack, and someone's standing outside" }],
  },
  'office-window': {
    label: 'office hatch',
    big: true,
    wall: true,
    swaps: [
      { variant: 'blinds', text: 'The office blinds are down' },
      { variant: 'watcher', text: 'Someone is standing in the office, watching you through the hatch' },
    ],
  },
  lights: {
    label: 'strip lights',
    big: true,
    swaps: [
      { variant: 'flicker', text: 'The light over the bench is flickering' },
      { variant: 'dangle', text: 'A strip light is hanging by one chain' },
    ],
  },

  // --- on the floor between the bays ---
  creeper: {
    label: 'creeper',
    solid: true,
    recolor: true,
    turns: [{ angle: QUARTER, text: 'The creeper has been turned sideways' }],
    swaps: [{ variant: 'boots', text: "Someone's left their boots on the creeper" }],
  },
  jack: {
    label: 'trolley jack',
    solid: true,
    turns: [{ angle: FLIP, text: 'The trolley jack is facing the other way' }],
    swaps: [{ variant: 'raised', text: 'The trolley jack has been pumped up' }],
  },

  // --- in the office ---
  computer: {
    label: 'office computer',
    recolor: true,
    swaps: [{ variant: 'message', text: "The office computer says DON'T TURN ROUND" }],
  },
  chair: {
    label: 'office chair',
    solid: true,
    round: true,
    turns: [{ angle: FLIP, text: 'The office chair has turned its back on the desk' }],
    // it spins on its own, which would undo a turn
    swaps: [{ variant: 'spin', text: 'The office chair is spinning round on its own', blockedBy: [{ kind: 'turn' }] }],
  },
  cabinet: {
    label: 'filing cabinet',
    big: true,
    solid: true,
    recolor: true,
    swaps: [
      { variant: 'cat', text: 'A cat is asleep in an open drawer of the filing cabinet' },
      { variant: 'stairs', text: 'Every drawer of the filing cabinet is pulled out, like a staircase' },
    ],
  },
  'car-poster': {
    label: 'rally poster',
    wall: true,
    swaps: [{ variant: 'you', text: 'The rally poster is a photo of someone standing in the workshop, from behind' }],
  },
  'office-clock': {
    label: 'office clock',
    wall: true,
    swaps: [{ variant: 'backwards', text: 'The office clock is running backwards, fast' }],
  },
  keys: {
    label: 'car keys',
    wall: true,
    swaps: [
      { variant: 'swing', text: 'A bunch of keys is swinging on its hook by itself' },
      { variant: 'gone', text: 'All but one of the car keys have gone from the board' },
    ],
  },
  kettle: {
    label: 'kettle',
    recolor: true,
    swaps: [{ variant: 'steam', text: "The kettle is boiling, but it isn't plugged in" }],
  },
  mugs: {
    label: 'mugs',
    swaps: [{ variant: 'tower', text: 'Every mug in the office is stacked up in one tower' }],
  },
} satisfies ItemCatalog
