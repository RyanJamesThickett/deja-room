/*
 * Which rooms the player has unlocked, and their best score in each. Kept in
 * this browser's localStorage, so it's per player and per device, and the
 * game still works (everything but the first room locked) if storage is
 * blocked.
 */

const KEY = 'deja-room:progress'

export interface Progress {
  /** How many rooms are open, counting from the first. */
  unlocked: number
  /** Best score per room id. */
  best: Record<string, number>
}

export function loadProgress(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Progress> | null
    if (saved && typeof saved.unlocked === 'number') return { unlocked: Math.max(1, saved.unlocked), best: saved.best ?? {} }
  } catch {
    // private window, blocked storage or a garbled entry: start fresh
  }
  return { unlocked: 1, best: {} }
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // nowhere to keep it; progress just won't survive a reload
  }
}

/** Progress after finishing room `index` with `score`: the next room opens and the best score is kept. */
export function withRoomDone(progress: Progress, index: number, roomId: string, score: number, roomCount: number): Progress {
  return {
    unlocked: Math.min(roomCount, Math.max(progress.unlocked, index + 2)),
    best: { ...progress.best, [roomId]: Math.max(progress.best[roomId] ?? 0, score) },
  }
}
