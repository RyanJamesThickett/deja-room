/*
 * Déjà Room's multiplayer server: a Cloudflare Worker that hands each room
 * code its own Durable Object, a tiny server instance holding that game's
 * WebSocket connections and state in memory.
 *
 *   wss://<worker>/mp/BKRT?create=1&mode=vs   start a game with that code
 *   wss://<worker>/mp/BKRT                    join it
 *
 * Nothing is written to storage: when everyone has gone, the game is gone.
 * The server never knows what changed in the room (every browser works that
 * out from the seed). It keeps the clock, collects results and votes, and
 * tells everyone what happens next.
 */
import { DurableObject } from 'cloudflare:workers'
import {
  ATTEMPTS,
  type ClientMsg,
  type Coop,
  type ErrorReason,
  GRACE_MS,
  isCode,
  isValidName,
  LOAD_MAX_MS,
  MAX_PLAYERS,
  type MatchMode,
  type MatchState,
  MIN_PLAYERS,
  type Outcome,
  type Player,
  PLAYER_COLOURS,
  randomName,
  REVEAL_MAX_MS,
  type ServerMsg,
  SHIFT_MS,
  VOTE_SETTLE_MS,
  type Vote,
} from '../../src/net/protocol'

interface Env {
  MATCH: DurableObjectNamespace<Match>
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === '/mp/health') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    const code = /^\/mp\/([A-Z]+)$/.exec(url.pathname)?.[1]
    if (!code || !isCode(code)) return new Response('Not found', { status: 404 })
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 })
    return env.MATCH.get(env.MATCH.idFromName(code)).fetch(req)
  },
} satisfies ExportedHandler<Env>

/** How long someone who drops out keeps their place in the lobby (and the host's role): long enough for a refresh. */
const LOBBY_GRACE_MS = 20_000

const clamp = (n: unknown, lo: number, hi: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo)

export class Match extends DurableObject<Env> {
  private game: MatchState | null = null
  /** Every open socket, and the player it belongs to once they've said hello. */
  private sockets = new Map<WebSocket, string | null>()
  private timer: ReturnType<typeof setTimeout> | null = null

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const code = url.pathname.slice(-4)
    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]
    server.accept()
    const refuse = (reason: ErrorReason) => {
      this.send(server, { t: 'error', reason })
      server.close(1000, reason)
      return new Response(null, { status: 101, webSocket: client })
    }
    if (url.searchParams.get('create') === '1') {
      const mode = url.searchParams.get('mode')
      if (mode !== 'vs' && mode !== 'coop') return refuse('bad-request')
      // a code still in use belongs to someone else's game
      if (this.game && this.game.players.some((p) => p.connected)) return refuse('code-taken')
      this.game = this.fresh(code, mode)
    } else if (!this.game) return refuse('no-such-game')

    this.sockets.set(server, null)
    server.addEventListener('message', (e) => {
      try {
        this.onMessage(server, JSON.parse(String(e.data)) as ClientMsg)
      } catch {
        this.send(server, { t: 'error', reason: 'bad-request' })
      }
    })
    const gone = () => this.onClose(server)
    server.addEventListener('close', gone)
    server.addEventListener('error', gone)
    return new Response(null, { status: 101, webSocket: client })
  }

  private fresh(code: string, mode: MatchMode): MatchState {
    return {
      code,
      mode,
      hostId: '',
      seed: '',
      setup: null,
      stage: 'lobby',
      round: 0,
      deadline: 0,
      huntStart: 0,
      players: [],
      coop: null,
    }
  }

  // --- messages ---------------------------------------------------------------

  private onMessage(ws: WebSocket, msg: ClientMsg) {
    const g = this.game
    if (!g) return
    if (msg.t === 'ping') return this.send(ws, { t: 'pong', c: msg.c, s: Date.now() })
    if (msg.t === 'hello') return this.hello(ws, msg.playerId, msg.name)

    const id = this.sockets.get(ws)
    const me = g.players.find((p) => p.id === id)
    if (!me) return
    const isHost = g.hostId === me.id

    switch (msg.t) {
      case 'name':
        if (isValidName(msg.name)) me.name = msg.name
        break
      case 'setup': {
        if (!isHost || g.stage !== 'lobby') return
        const s = msg.setup
        if (typeof s?.roomId !== 'string' || s.roomId.length > 40) return
        g.setup = {
          roomId: s.roomId,
          changes: Math.round(clamp(s.changes, 1, 30)),
          studyMs: clamp(s.studyMs, 10_000, 300_000),
          huntMs: clamp(s.huntMs, 10_000, 240_000),
        }
        break
      }
      case 'start':
        if (!isHost || g.stage !== 'lobby' || !g.setup) return
        if (g.players.filter((p) => p.connected).length < MIN_PLAYERS[g.mode]) return
        this.start()
        break
      case 'loaded':
        me.loaded = true
        break
      case 'ready':
        if (g.stage === 'study' || g.stage === 'reveal') me.ready = true
        break
      case 'result':
        if (g.mode !== 'vs' || g.stage !== 'hunt' || msg.round !== g.round || me.done) return
        me.outcomes[g.round] = this.cleanOutcome(msg.outcome)
        me.done = true
        break
      case 'vote':
        if (g.mode !== 'coop' || g.stage !== 'hunt' || msg.round !== g.round || !g.coop) return
        this.vote(me, msg.vote)
        break
      case 'pose':
        // co-op only: everyone sees everyone else wandering about. Not stored, just passed on.
        if (g.mode !== 'coop' || !Array.isArray(msg.p) || msg.p.length !== 3) return
        for (const [other, otherId] of this.sockets)
          if (other !== ws && otherId) this.send(other, { t: 'pose', id: me.id, p: msg.p, yaw: Number(msg.yaw) || 0 })
        return
      case 'lobby':
        if (!isHost || g.stage !== 'end') return
        g.stage = 'lobby'
        g.deadline = 0
        for (const p of g.players) Object.assign(p, { loaded: false, ready: false, done: false, outcomes: [] })
        g.players = g.players.filter((p) => p.connected)
        g.coop = null
        break
      default:
        return
    }
    this.advance()
  }

  private hello(ws: WebSocket, playerId: unknown, name: unknown) {
    const g = this.game!
    if (typeof playerId !== 'string' || playerId.length < 8 || playerId.length > 64) return this.send(ws, { t: 'error', reason: 'bad-request' })
    const back = g.players.find((p) => p.id === playerId)
    if (back) {
      // back after a refresh or a dropped connection: drop any older socket of theirs
      for (const [other, otherId] of this.sockets) if (otherId === playerId && other !== ws) this.sockets.delete(other)
      back.connected = true
    } else {
      if (g.stage !== 'lobby') return this.refuseLate(ws, 'started')
      if (g.players.length >= MAX_PLAYERS[g.mode]) return this.refuseLate(ws, 'full')
      const used = new Set(g.players.map((p) => p.colour))
      g.players.push({
        id: playerId,
        name: typeof name === 'string' && isValidName(name) ? name : randomName(),
        colour: PLAYER_COLOURS.findIndex((_, i) => !used.has(i)),
        connected: true,
        loaded: false,
        ready: false,
        done: false,
        outcomes: [],
      })
    }
    this.sockets.set(ws, playerId)
    // the first in is the host; a host who's only refreshing keeps it (see forgetIfGone)
    if (!g.players.some((p) => p.id === g.hostId)) g.hostId = playerId
    this.advance()
  }

  private refuseLate(ws: WebSocket, reason: ErrorReason) {
    this.send(ws, { t: 'error', reason })
    this.sockets.delete(ws)
    ws.close(1000, reason)
  }

  private onClose(ws: WebSocket) {
    const id = this.sockets.get(ws)
    if (!this.sockets.delete(ws) || !id || !this.game) return
    // still connected on another socket (a refresh that beat the old one's close)
    if ([...this.sockets.values()].includes(id)) return
    const g = this.game
    const p = g.players.find((q) => q.id === id)
    if (!p) return
    p.connected = false
    // A refresh is a disconnect followed by a quick rejoin, so hold their place
    // (and the host's role) for a moment rather than dropping them straight away.
    setTimeout(() => this.forgetIfGone(id), LOBBY_GRACE_MS)
    this.advance()
  }

  /** Someone who left and hasn't come back: out of the lobby, and the host's role passed on. */
  private forgetIfGone(id: string) {
    const g = this.game
    const p = g?.players.find((q) => q.id === id)
    if (!g || !p || p.connected) return
    if (g.stage === 'lobby') g.players = g.players.filter((q) => q !== p)
    if (g.hostId === id) g.hostId = g.players.find((q) => q.connected)?.id ?? g.hostId
    this.advance()
  }

  private cleanOutcome(o: Outcome): Outcome {
    const found = o?.found === true
    // finding it on a later try can't be worth more than the tries it had left
    const misses = Math.round(clamp(o?.misses, 0, found ? ATTEMPTS - 1 : ATTEMPTS))
    return {
      found,
      points: found ? ATTEMPTS - misses : 0,
      misses,
      ms: Math.round(clamp(o?.ms, 0, 600_000)),
    }
  }

  // --- the game -----------------------------------------------------------------

  private start() {
    const g = this.game!
    const now = Date.now()
    g.players = g.players.filter((p) => p.connected)
    for (const p of g.players) Object.assign(p, { loaded: false, ready: false, done: false, outcomes: [] })
    g.seed = Math.random().toString(36).slice(2, 8)
    g.round = 0
    g.stage = 'loading'
    g.deadline = now + LOAD_MAX_MS
    g.coop =
      g.mode === 'coop'
        ? { votes: {}, settleAt: 0, attemptsLeft: ATTEMPTS, misses: [], tieBreaker: g.players[0].id, outcomes: [], lastGuess: null }
        : null
  }

  private startHunt(round: number) {
    const g = this.game!
    const now = Date.now()
    g.stage = 'hunt'
    g.round = round
    g.huntStart = now
    g.deadline = now + SHIFT_MS + g.setup!.huntMs
    for (const p of g.players) Object.assign(p, { ready: false, done: false })
    if (g.coop) {
      const here = g.players.filter((p) => p.connected)
      Object.assign(g.coop, {
        votes: {},
        settleAt: 0,
        attemptsLeft: ATTEMPTS,
        misses: [],
        lastGuess: null,
        // ties go to a different player each change
        tieBreaker: (here[round % Math.max(1, here.length)] ?? g.players[0]).id,
      } satisfies Partial<Coop>)
    }
  }

  private toReveal() {
    const g = this.game!
    g.stage = 'reveal'
    g.deadline = Date.now() + REVEAL_MAX_MS
    for (const p of g.players) p.ready = false
  }

  /** Move on from the current stage if everyone's ready for it, or its time is up. */
  private advance() {
    const g = this.game
    if (!g) return
    const now = Date.now()
    const here = g.players.filter((p) => p.connected)
    const all = (f: (p: Player) => boolean) => here.length > 0 && here.every(f)
    switch (g.stage) {
      case 'loading':
        if (all((p) => p.loaded) || now >= g.deadline) {
          g.stage = 'study'
          g.deadline = now + g.setup!.studyMs
          for (const p of g.players) p.ready = false
        }
        break
      case 'study':
        if (all((p) => p.ready) || now >= g.deadline) this.startHunt(0)
        break
      case 'hunt':
        if (g.mode === 'vs') {
          if (all((p) => p.done) || now >= g.deadline + GRACE_MS) {
            // anyone who never reported (left, or lost connection) didn't find it
            for (const p of g.players) p.outcomes[g.round] ??= { found: false, points: 0, misses: ATTEMPTS, ms: g.setup!.huntMs }
            this.toReveal()
          }
        } else {
          const c = g.coop!
          if (c.settleAt && now >= c.settleAt) this.settleVotes()
          else if (now >= g.deadline + 500) this.settleVotes(true)
        }
        break
      case 'reveal':
        if (all((p) => p.ready) || now >= g.deadline) {
          if (g.round + 1 < g.setup!.changes) this.startHunt(g.round + 1)
          else {
            g.stage = 'end'
            g.deadline = 0
          }
        }
        break
    }
    this.broadcast()
    this.schedule()
  }

  /** Co-op: a player puts down, moves or picks up their pin. */
  private vote(me: Player, vote: Vote | null) {
    const c = this.game!.coop!
    if (vote === null) delete c.votes[me.id]
    else {
      if (typeof vote.key !== 'string' || vote.key.length > 80 || !Array.isArray(vote.point)) return
      c.votes[me.id] = { key: vote.key, point: vote.point.map(Number).slice(0, 3) as Vote['point'], correct: vote.correct === true }
    }
    const here = this.game!.players.filter((p) => p.connected)
    // everyone's pin is down: the team guess goes in after a short countdown (any change restarts it)
    c.settleAt = here.length > 0 && here.every((p) => c.votes[p.id]) ? Date.now() + VOTE_SETTLE_MS : 0
  }

  /** Co-op: count the pins and make the team's guess. Ties go to this change's tie-breaker. */
  private settleVotes(timeUp = false) {
    const g = this.game!
    const c = g.coop!
    const now = Date.now()
    const ballots = Object.entries(c.votes)
    c.settleAt = 0
    if (ballots.length === 0) {
      if (timeUp) this.coopDone(false)
      return
    }
    const counts = new Map<string, number>()
    for (const [, v] of ballots) counts.set(v.key, (counts.get(v.key) ?? 0) + 1)
    const top = Math.max(...counts.values())
    const tied = [...counts.keys()].filter((k) => counts.get(k) === top)
    const breaker = c.votes[c.tieBreaker]
    const key = tied.length === 1 ? tied[0] : breaker && tied.includes(breaker.key) ? breaker.key : tied[0]
    const chosen = (breaker?.key === key ? breaker : ballots.find(([, v]) => v.key === key)![1])!
    c.lastGuess = { key, correct: chosen.correct, at: now }
    c.votes = {}
    if (chosen.correct) return this.coopDone(true)
    c.misses.push(chosen)
    c.attemptsLeft -= 1
    if (c.attemptsLeft <= 0 || timeUp) this.coopDone(false)
  }

  private coopDone(found: boolean) {
    const g = this.game!
    const c = g.coop!
    c.outcomes[g.round] = {
      found,
      points: found ? c.attemptsLeft : 0,
      misses: ATTEMPTS - c.attemptsLeft,
      ms: Math.max(0, Date.now() - g.huntStart - SHIFT_MS),
    }
    this.toReveal()
  }

  /** Wake up when the next deadline or vote countdown comes due. */
  private schedule() {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
    const g = this.game
    if (!g || !g.deadline) return
    let at = g.deadline
    if (g.stage === 'hunt' && g.mode === 'vs') at += GRACE_MS
    if (g.stage === 'hunt' && g.mode === 'coop') at = g.coop!.settleAt || g.deadline + 500
    this.timer = setTimeout(() => this.advance(), Math.max(0, at - Date.now()) + 20)
  }

  private broadcast() {
    const g = this.game
    if (!g) return
    const now = Date.now()
    // During a VS hunt nobody sees anyone else's result: both are revealed together.
    // Whether they've finished (`done`) is still shared, for a bit of pressure.
    const hiding = g.mode === 'vs' && g.stage === 'hunt'
    for (const [ws, id] of this.sockets) {
      if (!id) continue
      const state: MatchState = hiding
        ? {
            ...g,
            players: g.players.map((p) =>
              p.id === id ? p : { ...p, outcomes: p.outcomes.map((o, i) => (i === g.round ? null : o)) },
            ),
          }
        : g
      this.send(ws, { t: 'state', state, now })
    }
  }

  private send(ws: WebSocket, msg: ServerMsg) {
    try {
      ws.send(JSON.stringify(msg))
    } catch {
      // socket already closing; its close handler tidies up
    }
  }
}
