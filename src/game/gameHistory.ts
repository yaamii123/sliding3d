import type { PuzzleState } from '../types/puzzle.ts'
import { cloneState } from './puzzleState.ts'

export interface HistoryEntry {
  state: PuzzleState
  movedPiece: number
}

export function createHistory(): HistoryEntry[] {
  return []
}

export function pushHistory(
  history: readonly HistoryEntry[],
  previous: PuzzleState,
  movedPiece: number,
): HistoryEntry[] {
  return [...history, { state: cloneState(previous), movedPiece }]
}

export function popHistory(
  history: readonly HistoryEntry[],
): { history: HistoryEntry[]; entry: HistoryEntry } | null {
  if (history.length === 0) return null
  const entry = history[history.length - 1]!
  return {
    history: history.slice(0, -1),
    entry: { state: cloneState(entry.state), movedPiece: entry.movedPiece },
  }
}

export function canUndo(history: readonly HistoryEntry[]): boolean {
  return history.length > 0
}
