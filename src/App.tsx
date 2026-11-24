import { useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { type MouseEvent, Suspense, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ItemDef } from './game/items'
import { generateMutation, PALETTE, type Mutation, type Vec3 } from './game/mutations'
import { requestLock } from './game/pointerLock'
import { readSeed } from './game/rng'
import { ROOMS } from './game/rooms'
import type { RoomDef } from './game/rooms/types'
import { duckMusic, hushMusic, loadSoundSettings, muffleMusic, saveSoundSettings, sfx, type SoundSettings, unlockAudio } from './audio'
import { loadProgress, saveProgress, withRoomDone } from './progress'
import { CameraRig, type Guess, GuessPicker, House, InspectorBoxes, MissMarker, RevealMarker, ShowMe, type Snapshot, SnapshotProbe, WalkView } from './game/scene'
import './App.css'

/** Changes per room before you move on to the next room. */
/** Time to find each change (the clock starts when the splash ends). */
const HUNT_SECONDS = 35
/** First look at a room: about 4.3s per changeable thing, 1 to 3 minutes. */
const SECONDS_PER_ITEM = 4.3

function firstLookSeconds(room: RoomDef) {
  const raw = Object.keys(room.items).length * SECONDS_PER_ITEM
  return Math.min(180, Math.max(60, Math.round(raw / 10) * 10))
}
const SHIFT_MS = 1800
/** The splash takes this long to fade fully in; the change happens only after. */
const SHIFT_COVER_MS = 350
const ATTEMPTS = 3

/** `inspect` is the secret mode: walk a room, click anything, try its changes. */
type Phase = 'title' | 'study' | 'shift' | 'hunt' | 'reveal' | 'end' | 'inspect'
interface RoundResult {
  found: boolean
  points: number
}
interface RoomScore {
  label: string
  score: number
}

const EMPTY: Mutation[] = []
const SHIFT_WORDS = ['Huh?!', 'Wait…', 'Uh-oh!', 'Hold on!', 'Hmm?!', 'Eek!', 'What?!', 'Oh no…']

function canvasEl() {
  return document.querySelector<HTMLCanvasElement>('#viewport canvas')
}

/** Grab the mouse. Must run inside a click/keypress so the browser allows it. */
function lockPointer(onFail: () => void) {
  const el = canvasEl()
  if (!el) return onFail()
  requestLock(el).catch(onFail)
}

function exitLock() {
  if (document.pointerLockElement) document.exitPointerLock()
}

function formatTime(ms: number) {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Set when the game itself navigates away, so the leave-page guard stays quiet. */
let leavingOnPurpose = false

function newHouse() {
  leavingOnPurpose = true
  window.location.search = `?seed=${Math.random().toString(36).slice(2, 8)}`
}

function restartHouse() {
  leavingOnPurpose = true
  window.location.reload()
}

export default function App() {
  const [seed] = useState(readSeed)
  const [phase, setPhase] = useState<Phase>('title')
  const [roomIndex, setRoomIndex] = useState(0)
  const [round, setRound] = useState(0)
  // Every change made to this room so far. They pile up: nothing gets put back.
  const [history, setHistory] = useState<Mutation[]>([])
  const [results, setResults] = useState<RoundResult[]>([])
  // Scores from rooms already finished.
  const [banked, setBanked] = useState<RoomScore[]>([])
  const [attemptsLeft, setAttemptsLeft] = useState(ATTEMPTS)
  const [misses, setMisses] = useState<Vec3[]>([])
  // what's already been guessed wrong this round, so the same mistake never costs twice
  const [tried, setTried] = useState<string[]>([])
  const [deadline, setDeadline] = useState(0)
  const [now, setNow] = useState(0)
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [showBefore, setShowBefore] = useState(false)
  /** This room's best before the run just finished, to tell a new best from an old one. */
  const [bestBefore, setBestBefore] = useState<number | undefined>(undefined)
  const [resetToken, setResetToken] = useState(0)
  const [locked, setLocked] = useState(false)
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null)
  // true once the "something is different" splash fully covers the screen
  const [covered, setCovered] = useState(false)
  // secret mode
  const brandClicks = useRef<number[]>([])
  /** No mouse at all (a phone, or a tablet without one): the game can't be played, so say so up front. */
  const [noMouse, setNoMouse] = useState(() => !window.matchMedia('(any-pointer: fine)').matches)
  /** The window is too small for the game's panels (a computer with a shrunk window): ask for a bigger one. */
  const [tooSmall, setTooSmall] = useState(() => window.matchMedia(TOO_SMALL).matches)
  const [peekSmall, setPeekSmall] = useState(false)
  useEffect(() => {
    const query = window.matchMedia(TOO_SMALL)
    const onChange = () => setTooSmall(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  /** Music and sound effects on or off, kept in this browser. */
  const [sound, setSound] = useState(loadSoundSettings)
  /** The last whole second the clock ticked for, so each of the final five ticks once. */
  const lastTick = useRef(0)
  const [secretMenu, setSecretMenu] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Record<string, Mutation>>({})
  // id of the room whose textures and shaders are on the GPU and drawing
  const [readyRoom, setReadyRoom] = useState<string | null>(null)
  // bug notes (hold P): a snapshot of where the player is, and the note being written
  const [noteToken, setNoteToken] = useState(0)
  const [note, setNote] = useState<{ snap: Snapshot; text: string } | null>(null)
  // bumped by "Show me" to walk the player over to the change they missed
  const [showMe, setShowMe] = useState(0)
  const { progress: loadPct } = useProgress()
  const loaded = loadPct >= 100
  // which rooms are open, and best scores, kept in this browser
  const [saved, setSaved] = useState(loadProgress)
  /** The room whose preview card is open on the menu, if any. */
  const [previewing, setPreview] = useState<number | null>(null)

  const room = ROOMS[roomIndex]
  // the first look faces into the room; after each change you're put back facing a wall
  const firstLook = phase === 'title' || phase === 'study' || phase === 'inspect' || phase === 'end'
  const roomReady = loaded && readyRoom === room.id
  const nextRoomDef = ROOMS[roomIndex + 1] as (typeof ROOMS)[number] | undefined
  const label = (id: string) => room.items[id]?.label ?? id
  const current: Mutation | undefined = history[round]
  const roomScore = results.reduce((sum, r) => sum + r.points, 0)
  const score = banked.reduce((sum, r) => sum + r.score, 0) + roomScore
  const paused = pausedAt !== null
  const playing = phase === 'study' || phase === 'hunt'

  /** Which changes are applied to the house right now. */
  const visible = useMemo(() => {
    switch (phase) {
      case 'title':
        return EMPTY
      case 'study':
        return history.slice(0, round)
      case 'shift':
        // keep the room exactly as it was until the splash hides it
        return history.slice(0, covered ? round + 1 : round)
      case 'hunt':
        return history.slice(0, round + 1)
      case 'reveal':
        return history.slice(0, showBefore ? round : round + 1)
      case 'end':
        return showBefore ? EMPTY : history
      case 'inspect':
        return Object.values(previews)
    }
  }, [phase, history, round, showBefore, previews, covered])

  function toggleSound(which: 'music' | 'sfx') {
    const next = { ...sound, [which]: !sound[which] }
    setSound(next)
    saveSoundSettings(next)
    flash(`${which === 'music' ? 'Music' : 'Sound effects'} ${next[which] ? 'on' : 'off'}`)
  }

  function flash(msg: string) {
    setToast({ msg, id: Date.now() })
  }

  function pause() {
    setPausedAt((p) => p ?? Date.now())
  }

  function resume() {
    if (pausedAt !== null && (phase === 'study' || phase === 'hunt')) setDeadline((d) => d + (Date.now() - pausedAt))
    setPausedAt(null)
    lockPointer(pause)
  }

  /** Back to the level menu. Unmounting the room frees it until it's picked again. */
  function toMenu() {
    exitLock()
    setPreview(null)
    setPhase('title')
    setPausedAt(null)
    setShowBefore(false)
  }

  /** Pick a room from the menu: a fresh run starts there. */
  function chooseRoom(index: number) {
    if (index >= saved.unlocked) return
    setPreview(null)
    setBanked([])
    startRoom(index)
  }

  /** Walk into a room: one long first look, then straight into the changes. */
  function startRoom(index: number) {
    const t = Date.now()
    // the room remounts and loads again, even if it's the same one
    setReadyRoom(null)
    setRoomIndex(index)
    setHistory([])
    setResults([])
    setRound(0)
    setPhase('study')
    setDeadline(t + firstLookSeconds(ROOMS[index]) * 1000)
    setNow(t)
    setPausedAt(null)
    setShowBefore(false)
    setMisses([])
    setTried([])
    setAttemptsLeft(ATTEMPTS)
    setResetToken((k) => k + 1)
    lockPointer(pause)
  }

  /** Make change number `r` and play the "something is different" splash. */
  function makeChange(r: number) {
    sfx.whoosh()
    duckMusic(1.4)
    const past = history.slice(0, r)
    setHistory([...past, generateMutation(`${seed}:${room.id}`, r, past, room.items)])
    setRound(r)
    setMisses([])
    setTried([])
    setAttemptsLeft(ATTEMPTS)
    setShowBefore(false)
    setPausedAt(null)
    // The mouse stays captured through the splash, so the hunt starts with
    // control already in the player's hands.
    setCovered(false)
    setPhase('shift')
  }

  function endStudy() {
    makeChange(0)
  }

  function timeUp() {
    sfx.fail()
    flash('Time’s up!')
    finishRound(false, 0)
  }

  function finishRound(found: boolean, points: number) {
    setResults((r) => [...r.slice(0, round), { found, points }])
    setPhase('reveal')
    setShowBefore(false)
    // the mouse stays captured: walk over and have a proper look at what changed
  }

  function next() {
    if (round + 1 >= room.changes) {
      setBestBefore(saved.best[room.id])
      sfx.fanfare(roomScore > 0 && roomScore > (saved.best[room.id] ?? -1))
      duckMusic(2)
      const done = withRoomDone(saved, roomIndex, room.id, roomScore, ROOMS.length)
      setSaved(done)
      saveProgress(done)
      // back to where the room was first seen, free to walk about and flip between then and now
      setPhase('end')
      setShowBefore(false)
      setResetToken((k) => k + 1)
    } else {
      makeChange(round + 1)
      lockPointer(pause)
    }
  }

  /** Bank this room's score and walk into the next, completely different room. */
  function nextRoom() {
    if (!nextRoomDef) return
    setBanked((b) => [...b, { label: room.label, score: roomScore }])
    startRoom(roomIndex + 1)
  }

  // --- secret mode -------------------------------------------------------

  /** Ten clicks on the logo within five seconds opens the secret menu. */
  function onBrandClick() {
    const now = Date.now()
    brandClicks.current = [...brandClicks.current.filter((t) => now - t < 5000), now]
    if (brandClicks.current.length >= 10) {
      brandClicks.current = []
      exitLock()
      setSecretMenu(true)
    }
  }

  function enterInspector(index: number) {
    setSecretMenu(false)
    setRoomIndex(index)
    setHistory([])
    setResults([])
    setPreviews({})
    setSelected(null)
    setPausedAt(null)
    setPhase('inspect')
    setResetToken((k) => k + 1)
    lockPointer(() => {})
  }

  function preview(id: string, m: Mutation | null) {
    setPreviews((p) => {
      const next = { ...p }
      if (m) next[id] = m
      else delete next[id]
      return next
    })
  }

  function handleGuess({ item, decoy, point }: Guess) {
    if (phase === 'inspect') {
      if (item) {
        setSelected(item)
        exitLock()
      }
      return
    }
    if (phase !== 'hunt' || !current) return
    // walls and floor don't count; red herrings cost a try like any wrong object
    if (!item && !decoy) {
      sfx.nope()
      flash('That’s just the room. Aim at an object.')
      return
    }
    if (item === current.target) {
      sfx.found()
      finishRound(true, attemptsLeft)
      return
    }
    const name = item ? label(item) : decoy
    const key = item ?? `decoy:${decoy}`
    if (tried.includes(key)) {
      sfx.nope()
      flash(`You already tried the ${name}.`)
      return
    }
    setTried((t) => [...t, key])
    const left = attemptsLeft - 1
    setAttemptsLeft(left)
    setMisses((m) => [...m, point])
    if (left <= 0) {
      sfx.fail()
      finishRound(false, 0)
    } else {
      sfx.wrong()
      flash(`Not the ${name}!`)
    }
  }

  function onLockChange(isLocked: boolean) {
    setLocked(isLocked)
    if (isLocked) setPausedAt(null)
    else if (phase === 'study' || phase === 'shift' || phase === 'hunt') pause()
  }

  /** The room is on screen: if this is its first look, the clock starts now rather than when it began loading. */
  function onRoomReady(id: string) {
    setReadyRoom(id)
    if (phase === 'study' && round === 0) {
      const t = Date.now()
      setDeadline(t + firstLookSeconds(room) * 1000)
      setNow(t)
    }
  }

  // Countdown for the first look and for each hunt (frozen while paused or loading).
  const tick = useEffectEvent(() => {
    if (paused || !roomReady) return
    const t = Date.now()
    setNow(t)
    const left = Math.ceil((deadline - t) / 1000)
    if (phase === 'hunt' && left >= 1 && left <= 5 && left !== lastTick.current) {
      lastTick.current = left
      sfx.tick(left === 1)
    }
    if (t < deadline) return
    if (phase === 'study') endStudy()
    else if (phase === 'hunt') timeUp()
  })
  // Browsers keep quiet until the first click or key press, so start the sound on one.
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio, true)
    window.addEventListener('keydown', unlockAudio, true)
    return () => {
      window.removeEventListener('pointerdown', unlockAudio, true)
      window.removeEventListener('keydown', unlockAudio, true)
    }
  }, [])
  // Fade the music out while a room loads (the browser's too busy to keep time) and muffle it while paused.
  useEffect(() => hushMusic(phase !== 'title' && !roomReady), [phase, roomReady])
  useEffect(() => muffleMusic(paused), [paused])

  useEffect(() => {
    if (phase !== 'study' && phase !== 'hunt') return
    const id = setInterval(() => tick(), 250)
    return () => clearInterval(id)
  }, [phase])

  // The splash between "before" and "after", then the hunt clock starts.
  useEffect(() => {
    if (phase !== 'shift') return
    // once the splash is opaque: make the change and walk back in through the door
    const cover = setTimeout(() => {
      setCovered(true)
      setResetToken((k) => k + 1)
    }, SHIFT_COVER_MS)
    const done = setTimeout(() => {
      const t = Date.now()
      setPhase('hunt')
      setDeadline(t + HUNT_SECONDS * 1000)
      setNow(t)
    }, SHIFT_MS)
    return () => {
      clearTimeout(cover)
      clearTimeout(done)
    }
  }, [phase])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(id)
  }, [toast])

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.repeat || note) return
    if (e.code === 'KeyB' && (phase === 'reveal' || phase === 'end')) setShowBefore((b) => !b)
    if (e.code === 'KeyM') toggleSound('music')
    if (e.code === 'KeyT' && phase === 'reveal' && !results[round]?.found) setShowMe((k) => k + 1)
    if (phase === 'title' && previewing !== null) {
      if (e.code === 'Escape') setPreview(null)
      // flick between the rooms that are open
      if (e.code === 'ArrowRight') setPreview((saved.unlocked + previewing + 1) % saved.unlocked)
      if (e.code === 'ArrowLeft') setPreview((saved.unlocked + previewing - 1) % saved.unlocked)
    }
    if (e.code === 'Enter') {
      if (paused) resume()
      else if (phase === 'title') {
        // first Enter shows the newest room's card, a second goes in; a focused
        // button mustn't also take the Enter as a click and go in twice
        e.preventDefault()
        if (previewing === null) setPreview(saved.unlocked - 1)
        else chooseRoom(previewing)
      } else if (phase === 'study') endStudy()
      else if (phase === 'reveal') next()
      else if (phase === 'end') nextRoom()
    }
  })
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Secret: hold P for half a second to write a bug note about what you're looking at.
  const startNote = useEffectEvent(() => {
    if (phase === 'title' || note) return
    exitLock()
    setNoteToken((k) => k + 1)
  })
  useEffect(() => {
    let timer: number | undefined
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'KeyP' || e.repeat || (e.target as HTMLElement | null)?.tagName === 'TEXTAREA') return
      timer = window.setTimeout(() => startNote(), 450)
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') window.clearTimeout(timer)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  function saveNote() {
    if (!note) return
    const describe = (m: Mutation) => {
      switch (m.kind) {
        case 'swap':
          return `swap → ${m.variant}`
        case 'turn':
          return `turned ${Math.round((m.angle * 180) / Math.PI)}°`
        case 'scale':
          return `resized ×${m.factor.toFixed(2)}`
        case 'recolor':
          return `recoloured (${PALETTE[m.palette]})`
        case 'move':
          return 'moved'
      }
    }
    const entry = {
      time: new Date().toISOString(),
      note: note.text.trim(),
      room: room.id,
      seed,
      phase,
      change: phase === 'title' ? null : round + 1,
      position: note.snap.position,
      yaw: note.snap.yaw,
      pitch: note.snap.pitch,
      aiming: {
        ...note.snap.aiming,
        label: note.snap.aiming.item ? label(note.snap.aiming.item) : note.snap.aiming.decoy,
        state: note.snap.aiming.item ? visible.filter((m) => m.target === note.snap.aiming.item).map(describe) : [],
      },
      inView: note.snap.inView.map(({ id, distance }) => ({
        id,
        label: label(id),
        distance,
        state: visible.filter((m) => m.target === id).map(describe),
      })),
      changesSoFar: visible.map((m) => `${m.target}: ${describe(m)} (${m.description})`),
      url: window.location.href,
    }
    try {
      const all = JSON.parse(localStorage.getItem('deja-room:notes') ?? '[]') as unknown[]
      localStorage.setItem('deja-room:notes', JSON.stringify([...all, entry]))
    } catch {
      // storage blocked: the dev server copy below still works
    }
    // while running `pnpm dev` this lands in notes/notes.jsonl
    void fetch('/__notes', { method: 'POST', body: JSON.stringify(entry) }).catch(() => {})
    setNote(null)
    flash('Note saved')
  }

  function copyNotes() {
    try {
      void navigator.clipboard.writeText(localStorage.getItem('deja-room:notes') ?? '[]')
      flash('All notes copied')
    } catch {
      flash('Couldn’t read the saved notes')
    }
  }

  // A stray Ctrl+W (or a mis-click on the tab's close button) mid-room would
  // lose the run, and browsers won't let a page block it. Ask first.
  const midGame = phase !== 'title' && !(phase === 'end' && !nextRoomDef)
  useEffect(() => {
    if (!midGame) return
    const guard = (e: BeforeUnloadEvent) => {
      if (!leavingOnPurpose) e.preventDefault()
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [midGame])

  const remaining = Math.max(0, deadline - (pausedAt ?? now))

  return (
    <div className="app">
      <div id="viewport" className="viewport">
        <Canvas shadows camera={{ fov: 72, near: 0.03, far: 200, position: ROOMS[0].start.position }} dpr={[1, 2]}>
          <color attach="background" args={['#111111']} />
          {/* the menu shows no room, so nothing loads until one is picked */}
          {phase !== 'title' && (
            <Suspense fallback={null}>
              <House key={room.id} room={room} mutations={visible} onReady={onRoomReady} />
            </Suspense>
          )}
          <CameraRig token={resetToken} idle={false} room={room} scatterSeed={firstLook ? undefined : `${seed}:${room.id}:${round}`} />
          <WalkView
            enabled={phase !== 'title' && !paused}
            frozen={phase === 'shift' || !roomReady}
            bounds={room.bounds}
            layoutKey={`${room.id}:${phase}:${visible.length}`}
            onLockChange={onLockChange}
          />
          <GuessPicker enabled={phase === 'hunt' || phase === 'inspect'} onPick={handleGuess} />
          {phase === 'inspect' && (
            <InspectorBoxes key={room.id} ids={Object.keys(room.items)} selected={selected} onHover={setHovered} />
          )}
          {phase === 'reveal' && current && <RevealMarker target={current.target} />}
          <SnapshotProbe token={noteToken} onSnapshot={(snap) => setNote({ snap, text: '' })} />
          {phase === 'reveal' && current && <ShowMe target={current.target} token={showMe} bounds={room.bounds} />}
          {(phase === 'hunt' || phase === 'reveal') && misses.map((p, i) => <MissMarker key={i} point={p} />)}
        </Canvas>
      </div>

      <div className="comic-frame" aria-hidden="true" />
      <RoomLoading show={phase !== 'title' && !roomReady} name={room.name} progress={loadPct} />
      {noMouse ? (
        <NoMouseNotice kind="device" onDismiss={() => setNoMouse(false)} />
      ) : (
        tooSmall && !peekSmall && <NoMouseNotice kind="window" onDismiss={() => setPeekSmall(true)} />
      )}
      {note && (
        <div className="note-panel" role="dialog" aria-label="Bug note">
          <div className="note-head">
            <strong>Bug note</strong>
            <span>
              {room.label} · change {round + 1} · looking at{' '}
              {note.snap.aiming.item ? label(note.snap.aiming.item) : (note.snap.aiming.decoy ?? 'nothing in particular')}
            </span>
          </div>
          <textarea
            autoFocus
            value={note.text}
            placeholder="What's wrong here?"
            onChange={(e) => setNote({ ...note, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                saveNote()
              } else if (e.key === 'Escape') setNote(null)
            }}
          />
          <div className="row">
            <button type="button" className="pop" onClick={saveNote}>
              Save <kbd>Enter</kbd>
            </button>
            <button type="button" className="pop ghost" onClick={() => setNote(null)}>
              Cancel <kbd>Esc</kbd>
            </button>
            <button type="button" className="pop ghost" onClick={copyNotes}>
              Copy all notes
            </button>
          </div>
        </div>
      )}

      <div className="hud">
        <header className="topbar">
          {/* also the secret-mode switch: click it ten times in five seconds */}
          <span className="sticker brand" onClick={onBrandClick}>
            Déjà <em>Room</em>
          </span>
          {phase === 'inspect' && (
            <>
              <span className="sticker where">{room.label}</span>
              <span className="sticker secret">Secret mode</span>
            </>
          )}
          {phase !== 'title' && phase !== 'inspect' && (
            <>
              <span className="sticker where">{room.label}</span>
              <span className="sticker room">
                Change {Math.min(round + 1, room.changes)}
                <small>/{room.changes}</small>
              </span>
              <span className="sticker score">
                {score}
                <small> pts</small>
              </span>
              {phase !== 'end' && saved.best[room.id] !== undefined && (
                <span className="sticker best" title={`Your best in the ${room.label.toLowerCase()}`}>
                  <small>best </small>
                  {saved.best[room.id]}
                </span>
              )}
            </>
          )}
          <span className="tag seed" title="Share this URL and others get the same changes">
            house #{seed}
          </span>
          <SoundToggles sound={sound} onToggle={toggleSound} />
        </header>

        {phase === 'title' && (
          <div className="title-layout">
            <section className="panel title-panel">
              <div className="logo-sticker">
                <div className="presents">Ryan Thickett presents…</div>
                <h1 className="misprint">
                  <span>Déjà</span> <span className="room-word">Room!</span>
                </h1>
              </div>
              <div className="title-intro">
                <p>
                  Take a good look round each room before something changes <em>forever</em>. With every change adding
                  to the chaos, how long can you keep spotting what’s different? Finish a room to unlock the next.
                </p>
              </div>
              <ol className="level-grid">
                {ROOMS.map((r, i) => {
                  const open = i < saved.unlocked
                  const best = saved.best[r.id]
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        className={`level-card${open ? '' : ' locked'}${i === saved.unlocked - 1 ? ' latest' : ''}`}
                        // not `disabled`, so a locked card still shows its hint on hover
                        aria-disabled={!open}
                        data-hint={open ? undefined : `Finish ${ROOMS[i - 1].name} to unlock`}
                        onClick={() => {
                          if (!open) return
                          sfx.click()
                          setPreview(i)
                        }}
                      >
                        <span className="level-number">{i + 1}</span>
                        <span className="level-name">{r.label}</span>
                        {open && best !== undefined ? (
                          <span className="level-meter" aria-hidden="true">
                            <i style={{ width: `${(100 * best) / (r.changes * ATTEMPTS)}%` }} />
                          </span>
                        ) : (
                          <span className="level-best">{open ? 'Not played yet' : 'Locked'}</span>
                        )}
                        {open && best !== undefined && (
                          <span className="level-score" aria-label={`Best ${best} out of ${r.changes * ATTEMPTS}`}>
                            {best}
                            <small>/{r.changes * ATTEMPTS}</small>
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ol>
              {Object.keys(saved.best).length > 0 && (
                <p className="level-total">
                  <span className="sticker best">
                    <small>your best total </small>
                    {ROOMS.reduce((sum, r) => sum + (saved.best[r.id] ?? 0), 0)}
                    <small>/{ROOMS.reduce((sum, r) => sum + r.changes * ATTEMPTS, 0)}</small>
                  </span>
                  <span>
                    {ROOMS.filter((r) => saved.best[r.id] !== undefined).length} of {ROOMS.length} rooms done
                  </span>
                </p>
              )}
              <p className="level-hint">
                Click a room for a look, or press <kbd>Enter</kbd> for the newest one.
              </p>
            </section>
            <ControlsCard />
            {previewing !== null && (
              <RoomPreview
                room={ROOMS[previewing]}
                number={previewing + 1}
                best={saved.best[ROOMS[previewing].id]}
                max={ROOMS[previewing].changes * ATTEMPTS}
                onEnter={() => chooseRoom(previewing)}
                onClose={() => setPreview(null)}
              />
            )}
          </div>
        )}

        {phase === 'study' && (
          <section className="study">
            <Burst tone="yellow" className="timer">
              {formatTime(remaining)}
            </Burst>
            <div className="caption">
              {roomIndex === 0 ? 'Take it all in…' : `Welcome to ${room.name}…`}
            </div>
            <button type="button" className="ready-cta" onClick={endStudy}>
              <span className="ready-label">Seen enough?</span>
              <span className="keycap">Enter ↵</span>
            </button>
          </section>
        )}

        {phase === 'shift' && (
          <div className="shift">
            <div className="rays" />
            <div className="shift-word misprint">{SHIFT_WORDS[round % SHIFT_WORDS.length]}</div>
            <div className="caption">Something is different…</div>
          </div>
        )}

        {phase === 'hunt' && (
          <section className="study">
            <Burst tone={remaining < 10_000 ? 'red' : 'yellow'} className={remaining < 10_000 ? 'timer urgent' : 'timer'}>
              {formatTime(remaining)}
            </Burst>
          </section>
        )}

        {phase === 'hunt' && (
          <section className="hunt">
            <div className="caption">Something is different. Find it!</div>
            <div className="lives" aria-label={`${attemptsLeft} tries left`}>
              {Array.from({ length: ATTEMPTS }, (_, i) => (
                <span key={i} className={i < attemptsLeft ? 'life' : 'life lost'} />
              ))}
            </div>
          </section>
        )}

        {phase === 'reveal' && current && (
          <section className={`panel reveal-panel${locked ? ' walking' : ''}`}>
            <Burst tone={results[round]?.found ? 'yellow' : 'blue'} className="verdict">
              {results[round]?.found ? 'Found it!' : 'Nope!'}
            </Burst>
            {results[round]?.found && <div className="points">+{results[round].points}</div>}
            <p className="reveal-line">{current.description}.</p>
            <div className="row">
              <button type="button" className="pop ghost" onClick={() => setShowBefore((b) => !b)}>
                {showBefore ? 'Before' : 'After'} <kbd>B</kbd>
              </button>
              {!results[round]?.found && (
                <button type="button" className="pop ghost" onClick={() => setShowMe((k) => k + 1)}>
                  Show me <kbd>T</kbd>
                </button>
              )}
              <button type="button" className="pop" onClick={next}>
                {round + 1 >= room.changes ? 'Room done!' : 'Next change!'} <kbd>Enter</kbd>
              </button>
            </div>
          </section>
        )}

        {phase === 'end' && (
          <section className={`panel end-panel${locked ? ' walking' : ''}`}>
            <div className="caption">{nextRoomDef ? `${room.label} done!` : 'The end…?'}</div>
            <Burst tone="red" className="final">
              {roomScore}
              <small>/{room.changes * ATTEMPTS}</small>
            </Burst>
            {(bestBefore === undefined || roomScore > bestBefore) && roomScore > 0 ? (
              <span className="points new-best">New best!</span>
            ) : (
              bestBefore !== undefined && <span className="best-to-beat">Your best: {bestBefore}</span>
            )}
            <p className="reveal-line">
              {showBefore ? 'This is the room when you walked in.' : 'This is the room now. Feel at home?'}
              {!nextRoomDef && banked.length > 0 && ` Total: ${score} points.`}
            </p>
            <ol className="results">
              {history.map((m, i) => (
                <li key={i} className={results[i]?.found ? 'found' : 'missed'}>
                  {m.description}
                </li>
              ))}
            </ol>
            <div className="row">
              <button type="button" className="pop ghost" onClick={() => setShowBefore((b) => !b)}>
                {showBefore ? 'Show now' : 'Show then'} <kbd>B</kbd>
              </button>
              <button
                type="button"
                className="pop ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href)
                  flash('Link copied! Same house, same changes.')
                }}
              >
                Copy link
              </button>
              <button type="button" className="pop ghost" onClick={toMenu}>
                Menu
              </button>
              {nextRoomDef ? (
                <button type="button" className="pop" onClick={nextRoom}>
                  Next room! <kbd>Enter</kbd>
                </button>
              ) : (
                <button type="button" className="pop" onClick={newHouse}>
                  New house!
                </button>
              )}
            </div>
          </section>
        )}

        {phase !== 'title' && phase !== 'shift' && !paused && (
          <div className="footer">
            <span className="caption small">
              {phase === 'inspect'
                ? locked
                  ? 'Aim at a box and click to inspect it · Esc to free the mouse'
                  : 'Click the room to walk around'
                : locked
                  ? phase === 'reveal' || phase === 'end'
                    ? `Walk about and have a look · B ${phase === 'end' ? 'then / now' : 'before / after'}${phase === 'reveal' && !results[round]?.found ? ' · T show me' : ''} · Enter ${phase === 'end' ? 'next room' : 'next'} · Esc free the mouse`
                    : `WASD walk · Space jump · C crouch${phase === 'hunt' ? ' · click what changed' : ''} · Esc pause`
                  : 'Click the room to look around'}
            </span>
          </div>
        )}

        {locked && <div className="crosshair" />}
        {phase === 'inspect' && locked && hovered && (
          <div className="aim-label">
            {room.items[hovered]?.label ?? hovered} <kbd>Click</kbd>
          </div>
        )}

        {phase === 'inspect' && (
          <aside className="inspector">
            <div className="caption">{selected ? 'Inspecting' : 'Secret mode'}</div>
            {selected && room.items[selected] ? (
              <>
                <h3>{room.items[selected].label}</h3>
                <InspectorOptions
                  id={selected}
                  def={room.items[selected]}
                  active={previews[selected]}
                  onPick={(m) => preview(selected, m)}
                />
              </>
            ) : (
              <p>Walk around and click any boxed object to see every way it can change.</p>
            )}
            <div className="inspector-actions">
              <button type="button" className="pop ghost small" onClick={() => setPreviews({})}>
                Clear all changes
              </button>
              <button type="button" className="pop ghost small" onClick={() => setSecretMenu(true)}>
                Other room
              </button>
              <button type="button" className="pop small" onClick={restartHouse}>
                Leave secret mode
              </button>
            </div>
          </aside>
        )}
        {toast && (
          <div className="bubble toast" key={toast.id}>
            {toast.msg}
          </div>
        )}
      </div>

      {secretMenu && (
        <div className="secret-menu" role="dialog" aria-modal="true" aria-labelledby="secret-title">
          <div className="pause-rays" />
          <div className="pause-body">
            <h2 id="secret-title" className="misprint">
              Secret mode!
            </h2>
            <div className="caption">Pick a room to poke around in</div>
            <div className="pause-actions">
              {ROOMS.map((r, i) => (
                <button key={r.id} type="button" className="pop big" onClick={() => enterInspector(i)}>
                  {r.label}
                </button>
              ))}
              <button type="button" className="pop ghost" onClick={() => setSecretMenu(false)}>
                Never mind
              </button>
            </div>
          </div>
        </div>
      )}

      {paused && playing && (
        <div className="pause" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <div className="pause-rays" />
          <div className="pause-body">
            <h2 id="pause-title" className="misprint">
              Paused!
            </h2>
            <div className="caption">
              {room.label} · change {round + 1} of {room.changes} ·{' '}
              {phase === 'study'
                ? `${formatTime(remaining)} left to look`
                : `${formatTime(remaining)} and ${attemptsLeft} tries left`}
            </div>
            <div className="pause-columns">
              <div className="pause-actions">
                <button type="button" className="pop big" onClick={resume} autoFocus>
                  Back in! <kbd>Enter</kbd>
                </button>
                <button type="button" className="pop ghost" onClick={restartHouse}>
                  Restart this house
                </button>
                <button type="button" className="pop ghost" onClick={newHouse}>
                  New house
                </button>
                <SoundToggles sound={sound} onToggle={toggleSound} big />
              </div>
              <ControlsCard />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Music and sound-effect switches: in the top corner, and in the pause menu
 * (in a level the mouse is captured, so the corner ones can't be clicked).
 */
function SoundToggles({
  sound,
  onToggle,
  big = false,
}: {
  sound: SoundSettings
  onToggle: (which: 'music' | 'sfx') => void
  big?: boolean
}) {
  const toggle = (which: 'music' | 'sfx') => (e: MouseEvent<HTMLButtonElement>) => {
    onToggle(which)
    // or Space (jump) would press it again
    e.currentTarget.blur()
  }
  return (
    <span className={`sound-toggles${big ? ' big' : ''}`}>
      <button
        type="button"
        className={`sound-toggle${sound.music ? '' : ' off'}`}
        aria-pressed={sound.music}
        title="Music on or off (M)"
        onClick={toggle('music')}
      >
        ♪ Music{big && (sound.music ? ' on' : ' off')}
      </button>
      <button
        type="button"
        className={`sound-toggle${sound.sfx ? '' : ' off'}`}
        aria-pressed={sound.sfx}
        title="Sound effects on or off"
        onClick={toggle('sfx')}
      >
        Sounds{big && (sound.sfx ? ' on' : ' off')}
      </button>
    </span>
  )
}

/** Every change an item can have, as buttons that preview it in the room. */
function InspectorOptions({
  id,
  def,
  active,
  onPick,
}: {
  id: string
  def: ItemDef
  active: Mutation | undefined
  onPick: (m: Mutation | null) => void
}) {
  const options: { key: string; label: string; m: Mutation }[] = []
  for (const s of def.swaps ?? []) {
    options.push({ key: `swap:${s.variant}`, label: s.text, m: { target: id, kind: 'swap', variant: s.variant, description: s.text } })
  }
  for (const t of def.turns ?? []) {
    options.push({
      key: `turn:${t.angle}`,
      label: t.text,
      m: { target: id, kind: 'turn', axis: def.wall ? 'z' : 'y', angle: t.angle, description: t.text },
    })
  }
  for (const [i, move] of (def.moves ?? []).entries()) {
    options.push({ key: `move:${i}`, label: move.text, m: { target: id, kind: 'move', offset: [...move.offset], description: move.text } })
  }
  if (def.scale === 'up' || def.scale === 'both') {
    options.push({ key: 'scale:up', label: '65% bigger', m: { target: id, kind: 'scale', factor: 1.65, description: '65% bigger' } })
  }
  if (def.scale === 'down' || def.scale === 'both') {
    options.push({ key: 'scale:down', label: 'Half size', m: { target: id, kind: 'scale', factor: 0.48, description: 'Half size' } })
  }
  const activeKey = !active
    ? 'default'
    : active.kind === 'swap'
      ? `swap:${active.variant}`
      : active.kind === 'turn'
        ? `turn:${active.angle}`
        : active.kind === 'scale'
          ? `scale:${active.factor > 1 ? 'up' : 'down'}`
          : active.kind === 'recolor'
            ? `recolor:${active.palette}`
            : options.find((o) => o.m.kind === 'move' && o.m.offset.join() === (active as { offset: number[] }).offset.join())?.key

  return (
    <div className="inspector-options">
      <button type="button" className={activeKey === 'default' ? 'opt on' : 'opt'} onClick={() => onPick(null)}>
        As normal
      </button>
      {options.map((o) => (
        <button key={o.key} type="button" className={activeKey === o.key ? 'opt on' : 'opt'} onClick={() => onPick(o.m)}>
          {o.label}
        </button>
      ))}
      {def.recolor && (
        <div className="swatches" aria-label="Recolour">
          {PALETTE.map((c, i) => (
            <button
              key={c}
              type="button"
              className={activeKey === `recolor:${i}` ? 'swatch on' : 'swatch'}
              style={{ background: c }}
              aria-label={`Recolour ${c}`}
              onClick={() => onPick({ target: id, kind: 'recolor', palette: i, description: 'Recolour' })}
            />
          ))}
        </div>
      )}
      {options.length === 0 && !def.recolor && <p>This one never changes.</p>}
    </div>
  )
}

/** The three you need all the time. Everything else is shown on screen when it's useful. */
const CONTROLS: [key: string, action: string][] = [
  ['Mouse', 'Look around'],
  ['WASD', 'Walk'],
  ['Click', 'Guess'],
]
/** The rest, small print under the main three. */
const MORE_CONTROLS: [key: string, action: string][] = [
  ['Shift', 'run'],
  ['Space', 'jump'],
  ['C', 'crouch'],
  ['M', 'music'],
]

/**
 * Covers the screen while a room loads. Everything here animates with
 * transforms and opacity only, which the browser can keep running smoothly
 * even while the page itself is busy.
 */
/** Narrower or shorter than this, the HUD's panels don't fit. */
const TOO_SMALL = '(max-width: 819px), (max-height: 519px)'

/**
 * Shown on phones and tablets (walking about needs a mouse to look and a
 * keyboard to move), or on a computer whose window is too small to play in.
 * The window one goes away by itself once the window is big enough.
 */
function NoMouseNotice({ kind, onDismiss }: { kind: 'device' | 'window'; onDismiss: () => void }) {
  if (kind === 'window')
    return (
      <div className="no-mouse" role="dialog" aria-modal="true" aria-labelledby="no-mouse-title">
        <section className="no-mouse-card">
          <div className="no-mouse-burst" aria-hidden="true">
            Squish!
          </div>
          <h2 id="no-mouse-title">Bigger window, please!</h2>
          <p>Déjà Room needs a bit more room than this. Make the window bigger, or go full screen with F11.</p>
          <button type="button" className="pop ghost" onClick={onDismiss}>
            Have a peek anyway
          </button>
        </section>
      </div>
    )
  return (
    <div className="no-mouse" role="dialog" aria-modal="true" aria-labelledby="no-mouse-title">
      <section className="no-mouse-card">
        <div className="no-mouse-burst" aria-hidden="true">
          Uh-oh!
        </div>
        <h2 id="no-mouse-title">Bring a keyboard!</h2>
        <p>
          Déjà Room doesn’t work on phones or tablets. You walk around with the keyboard and look with the mouse, so
          you’ll need a computer.
        </p>
        <p className="no-mouse-small">Come back on a laptop or desktop and see what’s changed.</p>
        <button type="button" className="pop ghost" onClick={onDismiss}>
          Have a peek anyway
        </button>
      </section>
    </div>
  )
}

function RoomLoading({ show, name, progress }: { show: boolean; name: string; progress: number }) {
  return (
    <div className={`room-loading${show ? '' : ' gone'}`} role="status" aria-hidden={!show}>
      <div className="room-loading-rays" />
      <div className="room-loading-card">
        <span className="room-loading-kicker">Coming up</span>
        <strong className="misprint">{name}</strong>
        <span className="room-loading-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <small>{progress < 100 ? `Fetching the furniture… ${Math.round(progress)}%` : 'Switching the lights on…'}</small>
      </div>
    </div>
  )
}

/**
 * The card that pops up when a room is picked on the menu: a snapshot of the
 * room from where you'll first stand, what it's like, your best, and a way in.
 * The picture is a plain image, so the menu still loads nothing 3D.
 */
function RoomPreview({
  room,
  number,
  best,
  max,
  onEnter,
  onClose,
}: {
  room: (typeof ROOMS)[number]
  number: number
  best: number | undefined
  max: number
  onEnter: () => void
  onClose: () => void
}) {
  return (
    <div className="preview-backdrop" onClick={onClose}>
      <section
        key={room.id}
        className="panel preview-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-name"
        onClick={(e) => e.stopPropagation()}
      >
        <figure className="preview-photo">
          <img src={`${import.meta.env.BASE_URL}previews/${room.id}.jpg`} alt={`A look inside ${room.name}`} />
        </figure>
        <div className="preview-body">
          <h2 id="preview-name">
            <span className="preview-number">{number}</span>
            {room.label}
          </h2>
          <p className="preview-blurb">{room.blurb}</p>
          <p className="preview-facts">
            <span className="sticker room">
              {room.changes}
              <small> changes</small>
            </span>
            <span className="sticker best">
              {best !== undefined ? (
                <>
                  <small>best </small>
                  {best}
                  <small>/{max}</small>
                </>
              ) : (
                <small>not played yet</small>
              )}
            </span>
          </p>
          <div className="row">
            <button type="button" className="pop ghost" onClick={onClose}>
              Back <kbd>Esc</kbd>
            </button>
            <button type="button" className="pop" onClick={onEnter} autoFocus>
              Go in! <kbd>Enter</kbd>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function ControlsCard() {
  return (
    <aside className="controls-card" aria-label="Controls">
      <div className="caption">Controls</div>
      <ul className="controls-list">
        {CONTROLS.map(([key, action]) => (
          <li key={key}>
            <kbd>{key}</kbd>
            <span>{action}</span>
          </li>
        ))}
      </ul>
      <p className="controls-more">
        {MORE_CONTROLS.map(([key, action]) => (
          <span key={key}>
            <kbd>{key}</kbd> {action}
          </span>
        ))}
      </p>
    </aside>
  )
}

function Burst({ tone, className, children }: { tone: 'yellow' | 'red' | 'blue'; className?: string; children: ReactNode }) {
  return (
    <div className={`burst ${tone} ${className ?? ''}`}>
      <div className="burst-shape">
        <span>{children}</span>
      </div>
    </div>
  )
}
