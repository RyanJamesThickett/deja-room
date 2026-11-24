import { type CSSProperties, useState } from 'react'
import type { RoomDef } from '../game/rooms/types'
import { CODE_LENGTH, CODE_LETTERS, isCode, MAX_PLAYERS, MIN_PLAYERS, type MatchMode, type MatchState, PLAYER_COLOURS } from './protocol'
import { inviteLink } from './results'
import type { MatchConnection } from './useMatch'

/*
 * The multiplayer screens: choosing VS or co-op, starting or joining a game
 * by its code, the lobby, and VS's side-by-side results.
 */

const MODES: Record<MatchMode, { title: string; blurb: string; players: string }> = {
  vs: {
    title: 'VS',
    blurb: 'Same room, same changes, at the same time. You both hunt on your own, then see who did better.',
    players: '2 players',
  },
  coop: {
    title: 'Co-op',
    blurb: 'Bigger levels made for a team. Split up, search, and vote on what changed. Pins down, majority wins.',
    players: '1 to 6 players',
  },
}

/** Before you're in a game: pick a mode, then start one or type in a friend's code. */
export function MultiplayerMenu({ mp, onBack, startMode }: { mp: MatchConnection; onBack: () => void; startMode?: MatchMode | null }) {
  const [mode, setMode] = useState<MatchMode | null>(startMode ?? null)
  const [code, setCode] = useState('')
  const busy = mp.status === 'connecting' || mp.status === 'reconnecting'
  return (
    <section className="panel mp-panel">
      <div className="caption">Multiplayer</div>
      {mode === null ? (
        <>
          <h2 className="mp-title">How do you want to play?</h2>
          <div className="mp-modes">
            {(Object.keys(MODES) as MatchMode[]).map((m) => (
              <button key={m} type="button" className={`mp-mode ${m}`} onClick={() => setMode(m)}>
                <span className="mp-mode-title">{MODES[m].title}</span>
                <span className="mp-mode-players">{MODES[m].players}</span>
                <span className="mp-mode-blurb">{MODES[m].blurb}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="mp-title">
            <span className={`mp-chip ${mode}`}>{MODES[mode].title}</span> Start a game, or join one
          </h2>
          <div className="mp-start">
            <button type="button" className="pop big" disabled={busy} onClick={() => mp.create(mode)}>
              {busy ? 'Connecting…' : 'Start a new game'}
            </button>
            <form
              className="mp-join"
              onSubmit={(e) => {
                e.preventDefault()
                if (isCode(code)) mp.join(code)
              }}
            >
              <label htmlFor="mp-code">or type a code</label>
              <input
                id="mp-code"
                className="mp-code-input"
                value={code}
                maxLength={CODE_LENGTH}
                autoComplete="off"
                spellCheck={false}
                placeholder="BKRT"
                // only the letters codes are made of, so nothing else can be typed
                onChange={(e) => setCode([...e.target.value.toUpperCase()].filter((c) => CODE_LETTERS.includes(c)).join(''))}
              />
              <button type="submit" className="pop" disabled={!isCode(code) || busy}>
                Join
              </button>
            </form>
          </div>
        </>
      )}
      {mp.error && <p className="mp-error">{mp.error}</p>}
      <NameTag mp={mp} />
      <div className="row mp-footer">
        <button type="button" className="pop ghost" onClick={() => (mode === null || startMode ? onBack() : setMode(null))}>
          Back <kbd>Esc</kbd>
        </button>
      </div>
    </section>
  )
}

function NameTag({ mp }: { mp: MatchConnection }) {
  return (
    <p className="mp-name">
      You’re <strong>{mp.me.name}</strong>
      <button type="button" className="pop ghost small" onClick={mp.rename}>
        New name
      </button>
    </p>
  )
}

/** Waiting to start: the code to share, who's here, and (for the host) which room. */
export function Lobby({
  mp,
  state,
  rooms,
  selectedRoom,
  onPickRoom,
  onLeave,
  note,
}: {
  mp: MatchConnection
  state: MatchState
  rooms: readonly RoomDef[]
  selectedRoom: string | undefined
  onPickRoom: (room: RoomDef) => void
  onLeave: () => void
  /** A line shown above the rooms, e.g. why they're not the usual ones. */
  note?: string
}) {
  const [copied, setCopied] = useState(false)
  const host = state.hostId === mp.me.id
  const here = state.players.filter((p) => p.connected)
  const enough = here.length >= MIN_PLAYERS[state.mode]
  const hostName = state.players.find((p) => p.id === state.hostId)?.name ?? 'the host'
  const picked = rooms.find((r) => r.id === selectedRoom)
  return (
    <section className="panel mp-panel lobby">
      <div className="caption">{MODES[state.mode].title} lobby</div>
      <div className="lobby-code">
        <span className="lobby-code-label">Room code</span>
        <span className="lobby-letters" aria-label={`Room code ${[...state.code].join(' ')}`}>
          {[...state.code].map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </span>
        <button
          type="button"
          className="pop ghost small"
          onClick={() => {
            void navigator.clipboard.writeText(inviteLink(state.code))
            setCopied(true)
          }}
        >
          {copied ? 'Link copied!' : 'Copy invite link'}
        </button>
      </div>

      <ul className="lobby-players">
        {state.players.map((p) => (
          <li key={p.id} style={{ '--player': PLAYER_COLOURS[p.colour] } as CSSProperties} className={p.connected ? '' : 'away'}>
            <span className="lobby-dot" />
            <span className="lobby-name">{p.name}</span>
            {p.id === mp.me.id && <span className="lobby-tag">you</span>}
            {p.id === state.hostId && <span className="lobby-tag host">host</span>}
            {!p.connected && <span className="lobby-tag">reconnecting…</span>}
          </li>
        ))}
        {Array.from({ length: Math.max(0, MIN_PLAYERS[state.mode] - state.players.length) }, (_, i) => (
          <li key={`empty${i}`} className="lobby-empty">
            Waiting for someone to join…
          </li>
        ))}
      </ul>
      <p className="lobby-count">
        {here.length} of {MAX_PLAYERS[state.mode]} players
      </p>

      <div className="lobby-rooms">
        <span className="lobby-rooms-label">{host ? 'Pick a room' : 'Room'}</span>
        {note && <span className="lobby-note">{note}</span>}
        {host ? (
          <div className="lobby-room-grid">
            {rooms.map((r) => (
              <button key={r.id} type="button" className={`lobby-room${r.id === selectedRoom ? ' picked' : ''}`} onClick={() => onPickRoom(r)}>
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="lobby-room picked">{picked?.label ?? 'Not picked yet'}</span>
        )}
      </div>

      <div className="row mp-footer">
        <button type="button" className="pop ghost" onClick={onLeave}>
          Leave
        </button>
        {host ? (
          <button type="button" className="pop big" disabled={!enough || !picked} onClick={() => mp.send({ t: 'start' })}>
            {!enough ? (state.mode === 'vs' ? 'Waiting for a second player…' : 'Waiting…') : picked ? 'Start!' : 'Pick a room first'}
          </button>
        ) : (
          <span className="lobby-wait">Waiting for {hostName} to start…</span>
        )}
      </div>
      <NameTag mp={mp} />
    </section>
  )
}

/** Co-op mid-hunt: whose pin is on what, who breaks ties, and the countdown once everyone has voted. */
export function CoopVoteBoard({
  state,
  me,
  keyLabel,
  settleIn,
}: {
  state: MatchState
  me: string
  /** Turns a vote's key into something readable ("the sofa"). */
  keyLabel: (key: string) => string
  /** Milliseconds until the team's guess locks in, or null if not everyone has voted. */
  settleIn: number | null
}) {
  const c = state.coop
  if (!c) return null
  const here = state.players.filter((p) => p.connected)
  const counts = new Map<string, number>()
  for (const v of Object.values(c.votes)) counts.set(v.key, (counts.get(v.key) ?? 0) + 1)
  // the same choice the server will make: most votes, ties to the tie-breaker's pick
  const top = Math.max(0, ...counts.values())
  const tied = [...counts.keys()].filter((k) => counts.get(k) === top)
  const breaker = c.votes[c.tieBreaker]?.key
  const leading = tied.length === 1 ? tied[0] : breaker && tied.includes(breaker) ? breaker : tied[0]
  return (
    <aside className="vote-board" aria-label="Team votes">
      <div className="vote-board-title">Team votes</div>
      <ul>
        {here.map((p) => {
          const vote = c.votes[p.id]
          return (
            <li key={p.id} style={{ '--player': PLAYER_COLOURS[p.colour] } as CSSProperties} className={vote ? 'voted' : ''}>
              <span className="lobby-dot" />
              <span className="vote-who">
                {p.id === me ? 'You' : p.name}
                {p.id === c.tieBreaker && here.length > 1 && (
                  <span className="vote-breaker" title="Breaks ties this change">
                    ★
                  </span>
                )}
              </span>
              <span className="vote-what">{vote ? keyLabel(vote.key) : 'looking…'}</span>
            </li>
          )
        })}
      </ul>
      {settleIn !== null && leading && (
        <div className="vote-settle">
          Going with the {keyLabel(leading)} in {Math.max(1, Math.ceil(settleIn / 1000))}…
        </div>
      )}
    </aside>
  )
}
