/*
 * Everything the game and the multiplayer server say to each other. Shared by
 * both sides (the server imports this file too), so they can't drift apart.
 *
 * The server never sends anything 3D. Every browser works out the changes
 * itself from the seed; the server just keeps everyone in step: which room,
 * when each phase starts and ends, and who guessed or voted for what.
 */

/** `vs`: two players race through the same changes. `coop`: up to six vote together. */
export type MatchMode = 'vs' | 'coop'

export const MAX_PLAYERS: Record<MatchMode, number> = { vs: 2, coop: 6 }
/** VS needs an opponent; co-op can be started alone (handy for testing, and still a game). */
export const MIN_PLAYERS: Record<MatchMode, number> = { vs: 2, coop: 1 }

/** Room codes: four of these. No vowels (or Y), so a code can never spell anything rude. */
export const CODE_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ'
export const CODE_LENGTH = 4

export function isCode(s: string) {
  return s.length === CODE_LENGTH && [...s].every((c) => CODE_LETTERS.includes(c))
}

// --- timing, the same on both sides -----------------------------------------

/** The "something is different" splash, before each hunt's clock starts. */
export const SHIFT_MS = 1800
/** The splash takes this long to fade fully in; the change happens only after. */
export const SHIFT_COVER_MS = 350
export const ATTEMPTS = 3
/** Extra time the server waits after a hunt's deadline for late results to arrive. */
export const GRACE_MS = 4000
/** A reveal moves on by itself after this long, so one idle player can't stall everyone. */
export const REVEAL_MAX_MS = 45_000
/** Loading stops being waited for after this long; latecomers join the first look in progress. */
export const LOAD_MAX_MS = 120_000
/** Co-op: once everyone has a pin down, the team guess goes in after this countdown (time to change your mind). */
export const VOTE_SETTLE_MS = 3000

// --- state --------------------------------------------------------------------

/** How one player did on one change (VS), or how the team did (co-op). */
export interface Outcome {
  found: boolean
  points: number
  /** Wrong guesses before finding it (or all of them, if not found). */
  misses: number
  /** From the hunt's start to finding it, or the whole hunt if not found. */
  ms: number
}

export interface Player {
  id: string
  name: string
  /** Index into the player colours. */
  colour: number
  connected: boolean
  /** Their room has finished loading. */
  loaded: boolean
  /** Pressed "ready" (seen enough, or done looking at a reveal). At the end: up for a rematch. */
  ready: boolean
  /** VS: has finished the current hunt. */
  done: boolean
  /** VS: one per change so far. */
  outcomes: (Outcome | null)[]
}

/** What the host picked in the lobby. Worked out by the host's game from the room's definition. */
export interface Setup {
  roomId: string
  changes: number
  studyMs: number
  huntMs: number
}

export type Stage = 'lobby' | 'loading' | 'study' | 'hunt' | 'reveal' | 'end'

/** A co-op vote: which thing (an item id, or `decoy:<label>` for a red herring) and where the pin went. */
export interface Vote {
  key: string
  point: [number, number, number]
  /** Worked out by the voter's game, which knows what changed. */
  correct: boolean
}

export interface Coop {
  /** Pins down this guess, by player id. */
  votes: Record<string, Vote>
  /** When the team's guess locks in (everyone has voted), server time; 0 when not counting down. */
  settleAt: number
  /** Team guesses still allowed this change. */
  attemptsLeft: number
  /** Wrong team guesses this change, so they show for everyone. */
  misses: Vote[]
  /** Who breaks a tie this change. Rotates round the players, one change at a time. */
  tieBreaker: string
  /** One per change so far. */
  outcomes: (Outcome | null)[]
  /** The last guess the team made, for a moment's flash. */
  lastGuess: { key: string; correct: boolean; at: number } | null
}

export interface MatchState {
  code: string
  mode: MatchMode
  hostId: string
  seed: string
  setup: Setup | null
  stage: Stage
  /** The change being hunted or revealed (0-based). */
  round: number
  /** When the current stage ends, in server time (0 if it doesn't). */
  deadline: number
  /** When the current hunt started, in server time. */
  huntStart: number
  players: Player[]
  coop: Coop | null
  /** The host has stopped anyone new joining (people already in can still rejoin). */
  locked: boolean
}

// --- messages -------------------------------------------------------------------

export type ClientMsg =
  | { t: 'hello'; playerId: string; name: string }
  | { t: 'name'; name: string }
  | { t: 'setup'; setup: Setup }
  | { t: 'start' }
  | { t: 'loaded' }
  | { t: 'ready' }
  | { t: 'result'; round: number; outcome: Outcome }
  | { t: 'vote'; round: number; vote: Vote | null }
  | { t: 'pose'; p: [number, number, number]; yaw: number }
  | { t: 'lobby' }
  /** Host, at the end: the same room again with new changes, same players. */
  | { t: 'rematch' }
  /** Host: take someone out of the game. They can't come back into it. */
  | { t: 'kick'; playerId: string }
  /** Host: hand the host's role to someone else. */
  | { t: 'host'; playerId: string }
  /** Host: stop (or let) anyone new join. */
  | { t: 'lock'; locked: boolean }
  | { t: 'ping'; c: number }

export type ServerMsg =
  | { t: 'state'; state: MatchState; now: number }
  | { t: 'error'; reason: ErrorReason }
  | { t: 'pose'; id: string; p: [number, number, number]; yaw: number }
  | { t: 'pong'; c: number; s: number }

export type ErrorReason = 'no-such-game' | 'full' | 'started' | 'code-taken' | 'bad-request' | 'kicked' | 'locked'

export const ERROR_TEXT: Record<ErrorReason, string> = {
  'no-such-game': 'There’s no game with that code. Check the letters?',
  full: 'That game is full.',
  started: 'That game has already started.',
  'code-taken': 'That code is in use. Try again.',
  'bad-request': 'Something went wrong talking to the server.',
  kicked: 'The host took you out of that game.',
  locked: 'That game isn’t letting anyone else in.',
}

// --- names ------------------------------------------------------------------------

const ADJECTIVES = [
  'Wobbly', 'Suspicious', 'Sleepy', 'Fancy', 'Grumpy', 'Sneaky', 'Jolly', 'Dizzy', 'Polite', 'Shifty',
  'Cosmic', 'Squeaky', 'Nervous', 'Dapper', 'Soggy', 'Curious', 'Bouncy', 'Stealthy', 'Puzzled', 'Peckish',
]
const NOUNS = [
  'Lamp', 'Toaster', 'Teapot', 'Armchair', 'Cactus', 'Kettle', 'Goldfish', 'Lava Lamp', 'Footstool', 'Mop',
  'Doormat', 'Clock', 'Trombone', 'Sofa', 'Spatula', 'Hatstand', 'Pigeon', 'Biscuit', 'Wardrobe', 'Rubber Duck',
]

/** "Wobbly Lamp": no typed names, so nothing anyone writes ever needs moderating. */
export function randomName(rand: () => number = Math.random) {
  return `${ADJECTIVES[Math.floor(rand() * ADJECTIVES.length)]} ${NOUNS[Math.floor(rand() * NOUNS.length)]}`
}

/** The server only accepts names built from the lists above. */
export function isValidName(name: string) {
  const adjective = ADJECTIVES.find((a) => name.startsWith(`${a} `))
  return adjective !== undefined && NOUNS.includes(name.slice(adjective.length + 1))
}

export const PLAYER_COLOURS = ['#ff3fa4', '#1f6bff', '#ffde21', '#16d0ff', '#ff8a1f', '#7bdc3a']
