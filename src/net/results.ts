import { ATTEMPTS, type MatchState, type Outcome } from './protocol'

/* Small helpers for showing multiplayer results. */

export function inviteLink(code: string) {
  return `${location.origin}${location.pathname}?join=${code}`
}

export function formatSeconds(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`
}

/** A one-line summary of how someone did on one change. */
export function outcomeLine(o: Outcome | null | undefined) {
  if (!o) return 'Still looking…'
  if (!o.found) return o.misses < ATTEMPTS ? 'Ran out of time' : 'Out of tries'
  const tries = ['first try', 'second try', 'last try'][o.misses] ?? `${o.misses + 1} tries`
  return `Found it, ${tries}, ${formatSeconds(o.ms)}`
}

/** Points first; equal points go to whoever was quicker overall. */
export function standings(state: MatchState) {
  return state.players
    .map((p) => ({
      player: p,
      points: p.outcomes.reduce((t, o) => t + (o?.points ?? 0), 0),
      ms: p.outcomes.reduce((t, o) => t + (o?.ms ?? 0), 0),
    }))
    .sort((a, b) => b.points - a.points || a.ms - b.ms)
}
