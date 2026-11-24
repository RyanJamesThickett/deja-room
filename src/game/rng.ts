/** Small seeded PRNG so a given house seed always produces the same changes. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof mulberry32>

/** FNV-1a, turns a seed string from the URL into a number. */
export function hashString(s: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

export function range(rng: Rng, min: number, max: number) {
  return min + rng() * (max - min)
}

export function sign(rng: Rng) {
  return rng() < 0.5 ? -1 : 1
}

/**
 * Reads `?seed=` from the URL, or makes one up and writes it back so the
 * current house can be shared by copying the address bar.
 */
export function readSeed(): string {
  const params = new URLSearchParams(window.location.search)
  let seed = params.get('seed')
  if (!seed) {
    seed = Math.random().toString(36).slice(2, 8)
    params.set('seed', seed)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }
  return seed
}
