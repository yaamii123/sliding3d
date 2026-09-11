import type { BestRecord, PuzzleSize } from '../types/puzzle.ts'
import { PUZZLE_SIZES } from '../types/puzzle.ts'
import { DEFAULT_COLOR_MODE, isColorMode, type ColorMode } from './pieceColor.ts'

const KEY = '3d-sliding-puzzle-v2'

export interface PersistedPrefs {
  size: PuzzleSize
  helpOpen: boolean
  colorMode: ColorMode
}

interface PersistedStore {
  prefs: PersistedPrefs
  best: Partial<Record<string, BestRecord>>
}

const DEFAULT_PREFS: PersistedPrefs = {
  size: 3,
  helpOpen: true,
  colorMode: DEFAULT_COLOR_MODE,
}

function isSize(value: unknown): value is PuzzleSize {
  return PUZZLE_SIZES.includes(value as PuzzleSize)
}

function emptyStore(): PersistedStore {
  return { prefs: { ...DEFAULT_PREFS }, best: {} }
}

function readStore(): PersistedStore {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as Partial<PersistedStore>
    const size = isSize(parsed.prefs?.size) ? parsed.prefs.size : DEFAULT_PREFS.size
    const helpOpen = typeof parsed.prefs?.helpOpen === 'boolean'
      ? parsed.prefs.helpOpen
      : DEFAULT_PREFS.helpOpen
    const colorMode = isColorMode(parsed.prefs?.colorMode)
      ? parsed.prefs.colorMode
      : DEFAULT_PREFS.colorMode
    return {
      prefs: { size, helpOpen, colorMode },
      best: parsed.best && typeof parsed.best === 'object' ? parsed.best : {},
    }
  } catch {
    return emptyStore()
  }
}

function writeStore(store: PersistedStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // Private mode / quota — ignore; the game still runs.
  }
}

export function loadPrefs(): PersistedPrefs {
  return readStore().prefs
}

export function savePrefs(prefs: PersistedPrefs): void {
  const store = readStore()
  store.prefs = prefs
  writeStore(store)
}

export function bestKey(size: PuzzleSize): string {
  return String(size)
}

export function loadBestTimes(): Partial<Record<string, BestRecord>> {
  return readStore().best
}

export function recordBest(input: {
  size: PuzzleSize
  timeMs: number
  moves: number
  scrambleLength: number
}): BestRecord | null {
  const store = readStore()
  const key = bestKey(input.size)
  const previous = store.best[key]
  const next: BestRecord = {
    timeMs: input.timeMs,
    moves: input.moves,
    scrambleLength: input.scrambleLength,
    at: new Date().toISOString(),
  }
  const isBetter =
    !previous ||
    next.timeMs < previous.timeMs ||
    (next.timeMs === previous.timeMs && next.moves < previous.moves)
  if (!isBetter) return null
  store.best[key] = next
  writeStore(store)
  return next
}
