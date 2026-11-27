/*
 * Every sound in the game, made on the fly with the Web Audio API: no audio
 * files to load, nothing to licence.
 *
 * - Sound effects for a right guess, a wrong one, running out of tries, the
 *   "something changed" splash, the clock's last seconds and finishing a room.
 * - A slow, mellow lounge loop that sits quietly in the background. It has its own little
 *   spot-the-difference: each time round, one note of the tune changes, and
 *   the changes pile up until it resets eight loops later.
 *
 * Browsers only allow sound after the player has clicked or pressed a key, so
 * nothing is created until `unlockAudio()` is called from one of those.
 * Whether music and effects are on is kept in localStorage.
 */

const KEY = 'deja-room:sound'

export interface SoundSettings {
  music: boolean
  sfx: boolean
}

export function loadSoundSettings(): SoundSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<SoundSettings> | null
    if (saved) return { music: saved.music !== false, sfx: saved.sfx !== false }
  } catch {
    // blocked storage: everything on
  }
  return { music: true, sfx: true }
}

let settings = loadSoundSettings()

export function saveSoundSettings(next: SoundSettings) {
  settings = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // nowhere to keep it; it just won't survive a reload
  }
  if (!ctx) return
  sfxBus.gain.setTargetAtTime(next.sfx ? SFX_LEVEL : 0, ctx.currentTime, 0.02)
  if (next.music) startMusic()
  else stopMusic()
}

// --- the audio graph ------------------------------------------------------

const MUSIC_LEVEL = 0.1
const SFX_LEVEL = 0.5

let ctx: AudioContext | null = null
let master: GainNode
let sfxBus: GainNode
/** Music fades in and out here (on/off, loading, ducking under the splash). */
let musicBus: GainNode
/** Muffles the music while the game is paused. */
let musicFilter: BiquadFilterNode
let noise: AudioBuffer

/** Call from a click or key press: the browser won't play anything before one. */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.9
    // a gentle limiter so stacked sounds never clip
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -10
    comp.ratio.value = 6
    master.connect(comp).connect(ctx.destination)
    sfxBus = ctx.createGain()
    sfxBus.gain.value = settings.sfx ? SFX_LEVEL : 0
    sfxBus.connect(master)
    musicFilter = ctx.createBiquadFilter()
    musicFilter.type = 'lowpass'
    musicFilter.frequency.value = 18000
    musicBus = ctx.createGain()
    musicBus.gain.value = 0
    musicBus.connect(musicFilter).connect(master)
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    // a hidden tab gets throttled timers, which would make the music stutter: just stop the clock
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return
      if (document.hidden) void ctx.suspend()
      else void ctx.resume()
    })
  }
  if (ctx.state === 'suspended' && !document.hidden) void ctx.resume()
  if (settings.music) startMusic()
}

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12)

/** One enveloped oscillator note. */
function tone(
  out: AudioNode,
  at: number,
  freq: number,
  dur: number,
  {
    type = 'sine',
    gain = 0.3,
    attack = 0.005,
    glide,
    cutoff,
    vibrato,
    hold = false,
  }: {
    type?: OscillatorType
    gain?: number
    attack?: number
    glide?: number
    cutoff?: number
    vibrato?: number
    /** Sustain at full level for most of the note (brass), instead of dying away straight after the attack (bells, plucks). */
    hold?: boolean
  } = {},
) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, at + dur)
  if (vibrato) {
    const lfo = ctx.createOscillator()
    const depth = ctx.createGain()
    lfo.frequency.value = 6
    depth.gain.setValueAtTime(0, at)
    depth.gain.linearRampToValueAtTime(freq * vibrato, at + dur * 0.6)
    lfo.connect(depth).connect(osc.frequency)
    lfo.start(at)
    lfo.stop(at + dur + 0.05)
  }
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(gain, at + attack)
  if (hold) env.gain.setValueAtTime(gain, at + dur * 0.75)
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  let node: AudioNode = osc
  if (cutoff) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = cutoff
    node = node.connect(f)
  }
  node.connect(env).connect(out)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

/** A burst of filtered noise: hats, snares, whooshes. */
function hiss(
  out: AudioNode,
  at: number,
  dur: number,
  { type = 'highpass', freq = 7000, to, q = 1, gain = 0.2 }: { type?: BiquadFilterType; freq?: number; to?: number; q?: number; gain?: number } = {},
) {
  if (!ctx) return
  const src = ctx.createBufferSource()
  src.buffer = noise
  const f = ctx.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(freq, at)
  if (to) f.frequency.exponentialRampToValueAtTime(to, at + dur)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(gain, at + Math.min(0.01, dur / 4))
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(f).connect(env).connect(out)
  src.start(at, Math.random() * 0.5)
  src.stop(at + dur + 0.05)
}

// --- sound effects ----------------------------------------------------------

function now() {
  return ctx && settings.sfx ? ctx.currentTime + 0.01 : null
}

export const sfx = {
  /** Spotted it: a bright rising arpeggio and a sparkle. */
  found() {
    const t = now()
    if (t === null) return
    ;[72, 76, 79, 84].forEach((n, i) => {
      tone(sfxBus, t + i * 0.07, midi(n), 0.35, { type: 'square', gain: 0.12, cutoff: 4200 })
      tone(sfxBus, t + i * 0.07, midi(n + 12), 0.4, { gain: 0.1 })
    })
    hiss(sfxBus, t + 0.28, 0.5, { freq: 9000, gain: 0.08 })
    tone(sfxBus, t + 0.3, midi(96), 0.6, { gain: 0.06 })
  },
  /** Wrong thing, tries left: a short buzzy "eh-eh". */
  wrong() {
    const t = now()
    if (t === null) return
    tone(sfxBus, t, 196, 0.13, { type: 'sawtooth', gain: 0.18, cutoff: 1400 })
    tone(sfxBus, t + 0.15, 147, 0.22, { type: 'sawtooth', gain: 0.18, cutoff: 1100 })
  },
  /** Out of tries or out of time: a sad trombone. */
  fail() {
    const t = now()
    if (t === null) return
    const notes = [55, 54, 53]
    notes.forEach((n, i) => tone(sfxBus, t + i * 0.32, midi(n), 0.3, { type: 'sawtooth', gain: 0.17, cutoff: 1300, attack: 0.03, hold: true }))
    tone(sfxBus, t + 0.96, midi(52), 1.1, { type: 'sawtooth', gain: 0.17, cutoff: 1100, attack: 0.03, vibrato: 0.025, hold: true })
  },
  /** Doesn't cost a try (same thing again, or just the wall): a soft blip. */
  nope() {
    const t = now()
    if (t === null) return
    tone(sfxBus, t, 330, 0.09, { type: 'triangle', gain: 0.15 })
  },
  /** The "something is different" splash: a swoosh with a wobbly rise. */
  whoosh() {
    const t = now()
    if (t === null) return
    hiss(sfxBus, t, 0.9, { type: 'bandpass', freq: 300, to: 3200, q: 2, gain: 0.32 })
    tone(sfxBus, t + 0.05, 180, 0.8, { type: 'triangle', glide: 720, gain: 0.12, vibrato: 0.03 })
  },
  /** Last few seconds on the clock. */
  tick(last = false) {
    const t = now()
    if (t === null) return
    tone(sfxBus, t, last ? 1320 : 990, 0.06, { type: 'square', gain: 0.07, cutoff: 3000 })
  },
  /** Room done: a little brass fanfare, with extra sparkle for a new best. */
  fanfare(newBest: boolean) {
    const t = now()
    if (t === null) return
    const brass = { type: 'sawtooth' as const, gain: 0.12, cutoff: 2400, attack: 0.02, hold: true }
    ;[67, 72, 76].forEach((n, i) => tone(sfxBus, t + i * 0.11, midi(n), 0.12, brass))
    ;[72, 76, 79, 84].forEach((n) => tone(sfxBus, t + 0.36, midi(n), 1.2, { ...brass, gain: 0.08, vibrato: 0.01 }))
    if (newBest) [84, 88, 91, 96, 100].forEach((n, i) => tone(sfxBus, t + 0.6 + i * 0.06, midi(n), 0.5, { gain: 0.07 }))
  },
  /**
   * Co-op: a pin going in. Yours is a bright "plink" and a thunk; a
   * teammate's is softer and pitched by their colour, so you can hear who
   * without looking.
   */
  pin(mine = true, voice = 0) {
    const t = now()
    if (t === null) return
    const base = mine ? 84 : [76, 79, 81, 74, 77, 83][voice % 6]
    tone(sfxBus, t, midi(base), 0.12, { type: 'triangle', gain: mine ? 0.16 : 0.1 })
    tone(sfxBus, t + 0.05, midi(base + 7), 0.16, { type: 'sine', gain: mine ? 0.12 : 0.07 })
    tone(sfxBus, t, 140, 0.08, { type: 'sine', glide: 70, gain: mine ? 0.22 : 0.12 })
    hiss(sfxBus, t, 0.04, { freq: 5000, gain: mine ? 0.06 : 0.035 })
  },
  /** Co-op: a pin pulled back out. */
  unpin() {
    const t = now()
    if (t === null) return
    tone(sfxBus, t, midi(79), 0.1, { type: 'triangle', glide: midi(67), gain: 0.1 })
  },
  /** Co-op: every pin's down and the team's guess goes in. A drum fill into a thud. */
  lockIn() {
    const t = now()
    if (t === null) return
    for (let i = 0; i < 4; i++) hiss(sfxBus, t + i * 0.055, 0.05, { type: 'bandpass', freq: 1800, q: 0.8, gain: 0.07 + i * 0.03 })
    tone(sfxBus, t + 0.23, 110, 0.3, { type: 'sine', glide: 50, gain: 0.35 })
    hiss(sfxBus, t + 0.23, 0.2, { type: 'lowpass', freq: 900, gain: 0.12 })
  },
  /** Menu taps. */
  click() {
    const t = now()
    if (t === null) return
    tone(sfxBus, t, 880, 0.05, { type: 'triangle', gain: 0.12 })
  },
}

// --- music -----------------------------------------------------------------

const BPM = 84
/** One eighth note, in seconds. */
const EIGHTH = 60 / BPM / 2
/** How late the off-beat eighths land, as a share of an eighth: a lazy swing. */
const SWING = 0.18

/** Eight bars: root (for the bass) and chord (for the pad). */
const BARS: { root: number; chord: number[] }[] = [
  { root: 36, chord: [60, 64, 67] }, // C
  { root: 33, chord: [57, 60, 64] }, // Am
  { root: 38, chord: [57, 62, 65] }, // Dm
  { root: 31, chord: [55, 59, 65] }, // G7
  { root: 36, chord: [60, 64, 67] }, // C
  { root: 40, chord: [56, 62, 64] }, // E7
  { root: 41, chord: [57, 60, 65] }, // F
  { root: 41, chord: [56, 60, 65] }, // Fm
]

/** The vibraphone tune, one slot per eighth note; null is a rest. */
const TUNE: (number | null)[] = [
  72, null, 76, null, 79, null, 76, null,
  76, null, 72, null, 69, null, null, null,
  74, null, 77, null, 81, null, 77, null,
  79, null, 77, null, 74, null, 71, null,
  72, 76, 79, 84, null, null, 79, null,
  80, null, 76, null, 74, null, 71, null,
  77, null, 81, null, 84, null, 81, null,
  80, null, 77, null, 72, null, null, null,
]

let tune = [...TUNE]
let loops = 0
let step = 0
let nextAt = 0
let timer: number | undefined

/** Déjà vu for the ears: nudge one note of the tune to another note of its chord. */
function changeOneNote() {
  loops++
  if (loops % 8 === 0) {
    tune = [...TUNE]
    return
  }
  const slots = tune.map((n, i) => (n === null ? -1 : i)).filter((i) => i >= 0)
  const i = slots[Math.floor(Math.random() * slots.length)]
  const options = BARS[Math.floor(i / 8)].chord.map((n) => n + 12).filter((n) => n !== tune[i])
  tune[i] = options[Math.floor(Math.random() * options.length)]
}

function playStep(s: number, at: number) {
  const bar = BARS[Math.floor(s / 8)]
  const beat = s % 8
  const out = musicBus
  // the lightest brush on 2 and 4, and nothing else for drums
  if (beat === 2 || beat === 6) hiss(out, at, 0.09, { type: 'bandpass', freq: 5000, q: 0.7, gain: 0.03 })
  // soft bass: root, then the fifth halfway through the bar
  if (beat === 0) tone(out, at, midi(bar.root), 1.2, { type: 'triangle', gain: 0.3, attack: 0.02 })
  if (beat === 4) tone(out, at, midi(bar.root + 7), 1.0, { type: 'triangle', gain: 0.22, attack: 0.02 })
  // a warm pad that swells in under each bar
  if (beat === 0)
    for (const n of bar.chord) tone(out, at, midi(n), EIGHTH * 8.4, { type: 'triangle', gain: 0.03, attack: 0.5, cutoff: 900, hold: true })
  // vibraphone: a gentle sine that rings on, with just a hint of bell
  const n = tune[s]
  if (n !== null) {
    tone(out, at, midi(n), 1.8, { gain: 0.08, attack: 0.01 })
    tone(out, at, midi(n) * 4, 0.2, { gain: 0.006, attack: 0.004 })
  }
}

function schedule() {
  if (!ctx) return
  // keep about a third of a second queued, so a busy frame never leaves a gap
  while (nextAt < ctx.currentTime + 0.35) {
    playStep(step, nextAt + (step % 2 ? SWING * EIGHTH : 0))
    nextAt += EIGHTH
    step = (step + 1) % TUNE.length
    if (step === 0) changeOneNote()
  }
}

function startMusic() {
  // already playing: leave its level alone (it may be ducked under a sound effect)
  if (!ctx || !settings.music || timer !== undefined) return
  musicBus.gain.cancelScheduledValues(ctx.currentTime)
  musicBus.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.3)
  nextAt = ctx.currentTime + 0.1
  step = 0
  timer = window.setInterval(schedule, 50)
}

function stopMusic() {
  if (!ctx) return
  musicBus.gain.cancelScheduledValues(ctx.currentTime)
  musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.15)
  window.clearInterval(timer)
  timer = undefined
}

let hushed = false

function musicLevel() {
  return hushed || !settings.music ? 0 : MUSIC_LEVEL
}

/** Fade the music out (e.g. while a room loads, when the main thread is too busy to keep time) or back in. */
export function hushMusic(on: boolean) {
  hushed = on
  if (!ctx || timer === undefined) return
  musicBus.gain.cancelScheduledValues(ctx.currentTime)
  musicBus.gain.setTargetAtTime(musicLevel(), ctx.currentTime, on ? 0.12 : 0.6)
}

/** Paused: the music goes muffled, as if from the next room. */
export function muffleMusic(on: boolean) {
  if (!ctx) return
  musicFilter.frequency.setTargetAtTime(on ? 500 : 18000, ctx.currentTime, 0.1)
}

/** Dip the music for a moment so a big sound effect cuts through. */
export function duckMusic(seconds: number) {
  if (!ctx || timer === undefined || hushed) return
  const t = ctx.currentTime
  musicBus.gain.cancelScheduledValues(t)
  musicBus.gain.setTargetAtTime(MUSIC_LEVEL * 0.25, t, 0.05)
  musicBus.gain.setTargetAtTime(musicLevel(), t + seconds, 0.4)
}
