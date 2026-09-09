import type { PuzzleState, SlideMove } from '../types/puzzle.ts'
import { indexToCoord, isFaceAdjacent, volume } from '../utils/coordinates.ts'

export function isPermutationOfSolved(state: PuzzleState): boolean {
  const n = volume(state.size)
  if (state.tiles.length !== n) return false
  const seen = new Set<number>()
  for (const tile of state.tiles) {
    if (!Number.isInteger(tile) || tile < 0 || tile >= n) return false
    if (seen.has(tile)) return false
    seen.add(tile)
  }
  return seen.size === n
}

export function emptyMatchesTiles(state: PuzzleState): boolean {
  return state.tiles[state.emptyIndex] === 0 && state.tiles.filter((tile) => tile === 0).length === 1
}

export function isValidState(state: PuzzleState): boolean {
  return isPermutationOfSolved(state) && emptyMatchesTiles(state)
}

export function assertValidState(state: PuzzleState): void {
  if (!isValidState(state)) {
    throw new Error('Invalid puzzle state')
  }
}

export function isValidMoveOn(state: PuzzleState, move: SlideMove): boolean {
  if (move.toIndex !== state.emptyIndex) return false
  if (state.tiles[move.fromIndex] !== move.piece || move.piece === 0) return false
  const from = indexToCoord(move.fromIndex, state.size)
  const empty = indexToCoord(state.emptyIndex, state.size)
  return isFaceAdjacent(from, empty)
}

/**
 * Walk a recorded scramble backwards. Each reverse step must itself be a
 * legal slide, proving the scrambled state is reachable from solved.
 */
export function canReverseToSolved(
  scrambled: PuzzleState,
  scrambleMoves: readonly { reversePiece: number }[],
  isSolvedFn: (state: PuzzleState) => boolean,
  tryMove: (state: PuzzleState, piece: number) => PuzzleState | null,
): boolean {
  let state = scrambled
  for (let i = scrambleMoves.length - 1; i >= 0; i--) {
    const piece = scrambleMoves[i]!.reversePiece
    const next = tryMove(state, piece)
    if (!next) return false
    state = next
  }
  return isSolvedFn(state)
}
