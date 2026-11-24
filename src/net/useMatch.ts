import { type RefObject, useEffect, useRef, useState } from 'react'
import {
  type ClientMsg,
  CODE_LENGTH,
  CODE_LETTERS,
  ERROR_TEXT,
  type ErrorReason,
  type MatchMode,
  type MatchState,
  randomName,
  type ServerMsg,
} from './protocol'

/*
 * The game's side of multiplayer: one WebSocket to the match server, the
 * latest state it sent, and a clock lined up with the server's.
 *
 * No accounts: a random id and a generated name are who you are. Both, and
 * the game you're in, are kept per tab (sessionStorage): a refresh drops you
 * straight back in as the same player, and two tabs or windows side by side
 * are two different players (handy for trying it out on your own).
 */

const PLAYER_KEY = 'deja-room:player'
const GAME_KEY = 'deja-room:game'

export interface Me {
  id: string
  name: string
}

function loadMe(): Me {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PLAYER_KEY) ?? 'null') as Me | null
    if (saved?.id && saved.name) return saved
  } catch {
    // blocked storage: a new identity each visit is fine
  }
  const me = { id: crypto.randomUUID(), name: randomName() }
  saveMe(me)
  return me
}

function saveMe(me: Me) {
  try {
    sessionStorage.setItem(PLAYER_KEY, JSON.stringify(me))
  } catch {
    // nowhere to keep it
  }
}

function rememberGame(code: string | null) {
  try {
    if (code) sessionStorage.setItem(GAME_KEY, code)
    else sessionStorage.removeItem(GAME_KEY)
  } catch {
    // nowhere to keep it; a refresh just won't rejoin
  }
}

/** The game this tab was in before a refresh, if any. */
export function rememberedGame(): string | null {
  try {
    return sessionStorage.getItem(GAME_KEY)
  } catch {
    return null
  }
}

function randomCode() {
  return Array.from({ length: CODE_LENGTH }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]).join('')
}

/** Where the match server lives: set at build time for the live site, proxied by Vite (`/mp`) in development. */
function serverUrl(code: string, query = '') {
  const base = (import.meta.env.VITE_MP_URL as string | undefined) ?? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
  return `${base.replace(/^http/, 'ws').replace(/\/$/, '')}/mp/${code}${query}`
}

export type Status = 'off' | 'connecting' | 'open' | 'reconnecting'

export interface MatchConnection {
  status: Status
  state: MatchState | null
  error: string | null
  me: Me
  /** Server time now, from this browser's clock. */
  serverNow: () => number
  /** A server time as this browser's `Date.now()` time. */
  toLocal: (serverTime: number) => number
  create: (mode: MatchMode) => void
  join: (code: string) => void
  leave: () => void
  send: (msg: ClientMsg) => void
  rename: () => void
  /** Co-op: other players' positions, by player id (updated in place, many times a second). */
  poses: RefObject<Map<string, { p: [number, number, number]; yaw: number; at: number }>>
}

/** `onState` runs with every state the server sends, as it arrives. */
export function useMatch(onState?: (state: MatchState) => void): MatchConnection {
  const [status, setStatus] = useState<Status>('off')
  const [state, setState] = useState<MatchState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [me, setMe] = useState(loadMe)
  const ws = useRef<WebSocket | null>(null)
  // server clock minus ours, measured with pings (half the round trip either way)
  const offset = useRef(0)
  const bestRtt = useRef(Infinity)
  const poses = useRef(new Map<string, { p: [number, number, number]; yaw: number; at: number }>())
  /** The code we mean to be in (null after leaving), so a dropped connection knows to come back. */
  const wanted = useRef<string | null>(null)
  const retries = useRef(0)
  // the latest callback, without reconnecting when it changes
  const onStateRef = useRef(onState)
  useEffect(() => {
    onStateRef.current = onState
  })

  function open(code: string, query: string, attempt: (reason: ErrorReason) => boolean) {
    ws.current?.close()
    const socket = new WebSocket(serverUrl(code, query))
    ws.current = socket
    setStatus((s) => (s === 'open' || s === 'reconnecting' ? 'reconnecting' : 'connecting'))
    let ping: number | undefined
    socket.onopen = () => {
      retries.current = 0
      socket.send(JSON.stringify({ t: 'hello', playerId: me.id, name: me.name } satisfies ClientMsg))
      const sendPing = () => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ t: 'ping', c: Date.now() } satisfies ClientMsg))
      sendPing()
      ping = window.setInterval(sendPing, 5000)
    }
    socket.onmessage = (e) => {
      if (ws.current !== socket) return
      const msg = JSON.parse(String(e.data)) as ServerMsg
      switch (msg.t) {
        case 'state':
          setState(msg.state)
          setStatus('open')
          setError(null)
          wanted.current = msg.state.code
          rememberGame(msg.state.code)
          onStateRef.current?.(msg.state)
          break
        case 'pong': {
          const rtt = Date.now() - msg.c
          // trust the quickest round trip seen most: it has the least queuing in it
          if (rtt <= bestRtt.current * 1.5) {
            bestRtt.current = Math.min(bestRtt.current, rtt)
            offset.current = msg.s - (msg.c + rtt / 2)
          }
          break
        }
        case 'pose':
          poses.current.set(msg.id, { p: msg.p, yaw: msg.yaw, at: performance.now() })
          break
        case 'error':
          if (attempt(msg.reason)) return
          wanted.current = null
          rememberGame(null)
          setError(ERROR_TEXT[msg.reason])
          setState(null)
          setStatus('off')
          break
      }
    }
    socket.onclose = () => {
      window.clearInterval(ping)
      if (ws.current !== socket) return
      ws.current = null
      // dropped while in a game: keep trying to get back in
      if (wanted.current && retries.current < 8) {
        const code = wanted.current
        retries.current += 1
        setStatus('reconnecting')
        window.setTimeout(() => {
          if (wanted.current === code) open(code, '', () => false)
        }, Math.min(8000, 500 * 2 ** retries.current))
      } else if (!wanted.current) setStatus('off')
      else {
        setError('Lost touch with the server.')
        setStatus('off')
        setState(null)
        wanted.current = null
        rememberGame(null)
      }
    }
  }

  function create(mode: MatchMode) {
    setError(null)
    let tries = 0
    const go = () => {
      const code = randomCode()
      wanted.current = code
      open(code, `?create=1&mode=${mode}`, (reason) => {
        // that code's in use: pick another
        if (reason === 'code-taken' && ++tries < 5) {
          go()
          return true
        }
        return false
      })
    }
    go()
  }

  function join(code: string) {
    setError(null)
    wanted.current = code
    open(code, '', () => false)
  }

  function leave() {
    wanted.current = null
    rememberGame(null)
    ws.current?.close()
    ws.current = null
    poses.current.clear()
    setState(null)
    setStatus('off')
  }

  function send(msg: ClientMsg) {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg))
  }

  function rename() {
    const next = { ...me, name: randomName() }
    setMe(next)
    saveMe(next)
    send({ t: 'name', name: next.name })
  }

  useEffect(() => () => ws.current?.close(), [])

  return {
    status,
    state,
    error,
    me,
    serverNow: () => Date.now() + offset.current,
    toLocal: (serverTime: number) => serverTime - offset.current,
    create,
    join,
    leave,
    send,
    rename,
    poses,
  }
}
