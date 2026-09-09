import type { PuzzleSize, PuzzleState } from '../types/puzzle.ts'
import { indexToCoord, volume } from '../utils/coordinates.ts'

/**
 * Solved configuration: tiles 1..N³-1 in index order, empty (0) at the last cell.
 * Example 3×3×3: 1,2,3,...,26, EMPTY at (2,2,2).
 */
export function createSolvedState(size: PuzzleSize): PuzzleState {
  const n = volume(size)
  const tiles = Array.from({ length: n }, (_, i) => (i === n - 1 ? 0 : i + 1))
  return { size, tiles, emptyIndex: n - 1 }
}

export function cloneState(state: PuzzleState): PuzzleState {
  return {
    size: state.size,
    tiles: state.tiles.slice(),
    emptyIndex: state.emptyIndex,
  }
}

export function isSolved(state: PuzzleState): boolean {
  const n = state.tiles.length
  for (let i = 0; i < n - 1; i++) {
    if (state.tiles[i] !== i + 1) return false
  }
  return state.tiles[n - 1] === 0 && state.emptyIndex === n - 1
}

export function statesEqual(a: PuzzleState, b: PuzzleState): boolean {
  if (a.size !== b.size || a.emptyIndex !== b.emptyIndex) return false
  if (a.tiles.length !== b.tiles.length) return false
  for (let i = 0; i < a.tiles.length; i++) {
    if (a.tiles[i] !== b.tiles[i]) return false
  }
  return true
}

export function findPieceIndex(state: PuzzleState, piece: number): number {
  return state.tiles.indexOf(piece)
}

export function encodeTiles(tiles: readonly number[]): string {
  return String.fromCharCode(...tiles)
}

export function manhattanSum(state: PuzzleState): number {
  const { size, tiles } = state
  let sum = 0
  for (let i = 0; i < tiles.length; i++) {
    const piece = tiles[i]!
    if (piece === 0) continue
    const current = indexToCoord(i, size)
    const solved = indexToCoord(piece - 1, size)
    sum += Math.abs(current.x - solved.x) + Math.abs(current.y - solved.y) + Math.abs(current.z - solved.z)
  }
  return sum
}

export function pieceAt(state: PuzzleState, index: number): number {
  return state.tiles[index] ?? 0
}
