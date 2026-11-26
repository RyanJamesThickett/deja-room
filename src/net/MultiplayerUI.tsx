import { type CSSProperties, useEffect, useState } from 'react'
import type { RoomDef } from '../game/rooms/types'
import { CODE_LENGTH, CODE_LETTERS, isCode, MAX_PLAYERS, MIN_PLAYERS, type MatchMode, type MatchState, type Player, PLAYER_COLOURS } from './protocol'
import { inviteLink } from './results'
import type { MatchConnection } from './useMatch'

/*
 * The multiplayer screens: choosing VS or co-op, starting or joining a game
 * by its code, the lobby, the host's controls over who's in, and co-op's
 * vote board.
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
  if (mp.kickedFrom) return <KickedOut code={mp.kickedFrom} onOk={mp.dismissKicked} onBack={onBack} />
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

/** The host took you out of a game (or you tried to get back into one they'd taken you out of). */
function KickedOut({ code, onOk, onBack }: { code: string; onOk: () => void; onBack: () => void }) {
  return (
    <section className="panel mp-panel kicked-panel" role="alertdialog" aria-labelledby="kicked-title" aria-describedby="kicked-text">
      <div className="kicked-burst" aria-hidden="true">
        <div className="burst-shape">
          <span>Out!</span>
        </div>
      </div>
      <div className="caption">Multiplayer</div>
      <h2 id="kicked-title" className="mp-title">You’ve been kicked out</h2>
      <p id="kicked-text" className="kicked-text">
        The host took you out of game <strong className="kicked-code">{code}</strong>, so you can’t go back into that one. You can
        start a game of your own, or join a different one.
      </p>
      <div className="row mp-footer">
        <button type="button" className="pop big" autoFocus onClick={onOk}>
          OK
        </button>
        <button type="button" className="pop ghost" onClick={onBack}>
          Back to the title <kbd>Esc</kbd>
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

/** A room's picture for the lobby (the same snapshots as the level menu's preview cards). */
function previewOf(room: RoomDef) {
  return `${import.meta.env.BASE_URL}previews/${room.id}.jpg`
}

/**
 * Waiting to start. Left: the room you're about to play, big, with its
 * blurb, and (for the host) the others to pick from. Right: the code to
 * share, who's here, and the way in.
 */
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
  /** A line shown under the rooms, e.g. why they're not the usual ones. */
  note?: string
}) {
  const [copied, setCopied] = useState(false)
  const host = state.hostId === mp.me.id
  const here = state.players.filter((p) => p.connected)
  const enough = here.length >= MIN_PLAYERS[state.mode]
  const hostName = state.players.find((p) => p.id === state.hostId)?.name ?? 'the host'
  const picked = rooms.find((r) => r.id === selectedRoom)
  // the timings the host's game sent with the pick
  const setup = state.setup?.roomId === picked?.id ? state.setup : null
  const empty = Math.max(0, MIN_PLAYERS[state.mode] - state.players.length)
  return (
    <section className="panel mp-panel lobby">
      <div className="caption">{MODES[state.mode].title} lobby</div>

      <div className="lobby-stage">
        {picked ? (
          <>
            <figure className="lobby-photo" key={picked.id}>
              <img src={previewOf(picked)} alt={`A look inside ${picked.name}`} />
              <figcaption className="lobby-room-name">{picked.label}</figcaption>
            </figure>
            <p className="lobby-blurb">{picked.blurb}</p>
            <p className="lobby-facts">
              <span>{picked.changes} changes</span>
              {setup && <span>{Math.round(setup.huntMs / 1000)}s to find each</span>}
              {setup && <span>{Math.round(setup.studyMs / 1000)}s first look</span>}
            </p>
          </>
        ) : (
          <div className="lobby-photo empty">{host ? 'Pick a room below' : `Waiting for ${hostName} to pick a room…`}</div>
        )}
        {host && rooms.length > 1 && (
          <div className="lobby-thumbs" role="radiogroup" aria-label="Pick a room">
            {rooms.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={r.id === selectedRoom}
                className={`lobby-thumb${r.id === selectedRoom ? ' picked' : ''}`}
                onClick={() => onPickRoom(r)}
              >
                <img src={previewOf(r)} alt="" loading="lazy" />
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        )}
        {note && <p className="lobby-note">{note}</p>}
      </div>

      <div className="lobby-side">
        <div className="lobby-code">
          <span className="lobby-label">Room code</span>
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

        <div className="lobby-who">
          <span className="lobby-label">
            Players <small>{here.length} of {MAX_PLAYERS[state.mode]}</small>
          </span>
          <ul className="lobby-players">
            {state.players.map((p) => (
              <li key={p.id} style={{ '--player': PLAYER_COLOURS[p.colour] } as CSSProperties} className={p.connected ? '' : 'away'}>
                <span className="lobby-dot" />
                <span className="lobby-name">{p.name}</span>
                {p.id === mp.me.id && <span className="lobby-tag">you</span>}
                {p.id === state.hostId && <span className="lobby-tag host">host</span>}
                {!p.connected && <span className="lobby-tag">back soon…</span>}
                {host && p.id !== mp.me.id && <PlayerActions mp={mp} player={p} />}
              </li>
            ))}
            {Array.from({ length: empty }, (_, i) => (
              <li key={`empty${i}`} className="lobby-empty">
                {state.locked ? 'Locked: nobody new can join' : 'Waiting for someone to join…'}
              </li>
            ))}
          </ul>
          <LockToggle mp={mp} state={state} />
        </div>

        <div className="lobby-go">
          {host ? (
            <button type="button" className="pop big" disabled={!enough || !picked} onClick={() => mp.send({ t: 'start' })}>
              {!enough ? (state.mode === 'vs' ? 'Need a second player' : 'Waiting…') : picked ? 'Start!' : 'Pick a room first'}
            </button>
          ) : (
            <span className="lobby-wait">Waiting for {hostName} to start…</span>
          )}
          <button type="button" className="pop ghost small" onClick={onLeave}>
            Leave
          </button>
        </div>
        <NameTag mp={mp} />
      </div>
    </section>
  )
}

/**
 * The host's buttons on someone's row: hand them the host's role, or take
 * them out of the game (which keeps them out). Taking someone out asks first:
 * the first click says "Sure?", a second does it.
 */
export function PlayerActions({ mp, player }: { mp: MatchConnection; player: Player }) {
  const [asking, setAsking] = useState(false)
  useEffect(() => {
    if (!asking) return
    // changed your mind: it goes back by itself
    const id = setTimeout(() => setAsking(false), 3000)
    return () => clearTimeout(id)
  }, [asking])
  return (
    <span className="player-actions">
      {player.connected && (
        <button type="button" className="pop ghost tiny" title={`Make ${player.name} the host`} onClick={() => mp.send({ t: 'host', playerId: player.id })}>
          Make host
        </button>
      )}
      <button
        type="button"
        className={`pop tiny remove${asking ? ' asking' : ''}`}
        title={`Take ${player.name} out of the game`}
        onClick={(e) => {
          // or Space (jump) would press it again mid-game
          e.currentTarget.blur()
          if (asking) mp.send({ t: 'kick', playerId: player.id })
          else setAsking(true)
        }}
      >
        {asking ? 'Sure?' : 'Remove'}
      </button>
    </span>
  )
}

/** Host: stop anyone new joining with the code (everyone already in can still rejoin). Others just see whether it's locked. */
function LockToggle({ mp, state }: { mp: MatchConnection; state: MatchState }) {
  if (state.hostId !== mp.me.id) return state.locked ? <p className="lobby-locked">Locked by the host: nobody new can join.</p> : null
  return (
    <button
      type="button"
      className={`pop ghost small lock-toggle${state.locked ? ' locked' : ''}`}
      aria-pressed={state.locked}
      onClick={(e) => {
        e.currentTarget.blur()
        mp.send({ t: 'lock', locked: !state.locked })
      }}
    >
      {state.locked ? 'Locked · let people join' : 'Lock the room'}
    </button>
  )
}

/** Who's in the game, for the pause menu mid-game. The host can hand over or take people out from here too. */
export function PlayersPanel({ mp, state }: { mp: MatchConnection; state: MatchState }) {
  const host = state.hostId === mp.me.id
  return (
    <div className="pause-players">
      <span className="lobby-label">
        Players{host && <small>you’re the host</small>}
      </span>
      <ul className="lobby-players">
        {state.players.map((p) => (
          <li key={p.id} style={{ '--player': PLAYER_COLOURS[p.colour] } as CSSProperties} className={p.connected ? '' : 'away'}>
            <span className="lobby-name">{p.id === mp.me.id ? 'You' : p.name}</span>
            {p.id === state.hostId && <span className="lobby-tag host">host</span>}
            {!p.connected && <span className="lobby-tag">away</span>}
            {host && p.id !== mp.me.id && <PlayerActions mp={mp} player={p} />}
          </li>
        ))}
      </ul>
      <LockToggle mp={mp} state={state} />
    </div>
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
