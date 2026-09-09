/** Mulberry32 — deterministic when seeded, fine for scramble generation. */
export interface Rng {
  next: () => number
  int: (maxExclusive: number) => number
}

export function createRng(seed = Date.now() >>> 0): Rng {
  let t = seed >>> 0
  const next = (): number => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int(maxExclusive: number): number {
      if (maxExclusive <= 0) return 0
      return Math.floor(next() * maxExclusive)
    },
  }
}

export function pick<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty list')
  }
  return items[rng.int(items.length)] as T
}
