import type { PuzzleSize, PuzzleState } from '../types/puzzle.ts'
import { createRng, pick, type Rng } from '../utils/random.ts'
import { applyLineSlide, getLineMoveCandidates } from './puzzleMoves.ts'
import { createSolvedState, isSolved } from './puzzleState.ts'

/**
 * One scramble length per size. Larger cubes get a longer random walk so the
 * mix feels comparable without a separate difficulty setting.
 */
export const SCRAMBLE_STEPS: Record<PuzzleSize, number> = {
  2: 30,
  3: 180,
  4: 450,
  5: 1500,
}

export interface ScrambleStep {
  piece: number
  fromIndex: number
  toIndex: number
  reversePiece: number
}

export interface ScrambleResult {
  state: PuzzleState
  moves: ScrambleStep[]
  steps: number
}

function pickLineMove(
  state: PuzzleState,
  rng: Rng,
  lastToIndex: number,
  lastPiece: number,
): { piece: number; fromIndex: number } | null {
  const all = getLineMoveCandidates(state)
  if (all.length === 0) return null
  const noReverse = all.filter((move) => move.fromIndex !== lastToIndex)
  const noBounce = noReverse.filter((move) => move.piece !== lastPiece)
  const pool = noBounce.length > 0 ? noBounce : noReverse.length > 0 ? noReverse : all
  return pick(pool, rng)
}

/**
 * Generate a scramble by walking randomly from the solved state using the
 * same line-slide rule as the player: any cube on the empty cell's axis.
 * That mixes 3×3×3 and larger cubes much more than adjacent-only walks.
 * The inverse of the last slide is excluded so the walker does not immediately undo itself.
 */
export function scramblePuzzle(size: PuzzleSize, rng: Rng = createRng()): ScrambleResult {
  return scrambleSteps(size, SCRAMBLE_STEPS[size], rng)
}

export function scrambleSteps(size: PuzzleSize, steps: number, rng: Rng = createRng()): ScrambleResult {
  let state = createSolvedState(size)
  const moves: ScrambleStep[] = []
  let lastToIndex = -1
  let lastPiece = 0
  const target = Math.max(1, steps)
  let guard = 0

  while (moves.length < target && guard < target * 8) {
    guard += 1
    const chosen = pickLineMove(state, rng, lastToIndex, lastPiece)
    if (!chosen) break
    const emptyIndex = state.emptyIndex
    const next = applyLineSlide(state, chosen.fromIndex)
    if (!next) break
    moves.push({
      piece: chosen.piece,
      fromIndex: chosen.fromIndex,
      toIndex: emptyIndex,
      reversePiece: next.tiles[emptyIndex]!,
    })
    lastToIndex = emptyIndex
    lastPiece = chosen.piece
    state = next
  }

  let extra = 0
  while (isSolved(state) && extra < 32) {
    extra += 1
    const chosen = pickLineMove(state, rng, lastToIndex, lastPiece)
    if (!chosen) break
    const emptyIndex = state.emptyIndex
    const next = applyLineSlide(state, chosen.fromIndex)
    if (!next) break
    moves.push({
      piece: chosen.piece,
      fromIndex: chosen.fromIndex,
      toIndex: emptyIndex,
      reversePiece: next.tiles[emptyIndex]!,
    })
    lastToIndex = emptyIndex
    lastPiece = chosen.piece
    state = next
  }

  return { state, moves, steps: moves.length }
}

export function replayMoves(start: PuzzleState, moves: readonly ScrambleStep[]): PuzzleState {
  return moves.reduce((state, move) => applyLineSlide(state, move.fromIndex) ?? state, start)
}

/** Piece sequence that undoes a scramble when the board is still at scramble origin. */
export function reverseScramblePieces(moves: readonly ScrambleStep[]): number[] {
  const pieces: number[] = []
  for (let i = moves.length - 1; i >= 0; i--) {
    pieces.push(moves[i]!.reversePiece)
  }
  return pieces
}
