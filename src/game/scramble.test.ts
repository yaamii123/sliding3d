import { describe, expect, it } from 'vitest'
import { createSolvedState, isSolved } from './puzzleState.ts'
import { applyMove, getValidMoves, tryMovePiece } from './puzzleMoves.ts'
import { createHistory, pushHistory, popHistory, canUndo } from './gameHistory.ts'
import { scramblePuzzle, scrambleSteps, reverseScramblePieces, replayMoves, SCRAMBLE_STEPS } from './scramble.ts'
import { createRng } from '../utils/random.ts'
import { canReverseToSolved, isValidState } from './validation.ts'
import { indexToCoord, manhattan } from '../utils/coordinates.ts'
import type { PuzzleSize } from '../types/puzzle.ts'

describe('undo history', () => {
  it('does nothing on the first-move undo of an empty history', () => {
    const history = createHistory()
    expect(canUndo(history)).toBe(false)
    expect(popHistory(history)).toBeNull()
  })

  it('restores the exact previous logical state', () => {
    const start = createSolvedState(3)
    const move = getValidMoves(start)[1]!
    const next = applyMove(start, move)
    const history = pushHistory(createHistory(), start, move.piece)
    const popped = popHistory(history)
    expect(popped).not.toBeNull()
    expect(popped!.entry.movedPiece).toBe(move.piece)
    expect(popped!.entry.state.tiles).toEqual(start.tiles)
    expect(popped!.history).toHaveLength(0)
    const undone = popped!.entry.state
    expect(undone.tiles).not.toBe(next.tiles)
  })

  it('can undo several moves without corrupting earlier snapshots', () => {
    let state = createSolvedState(2)
    let history = createHistory()
    const snapshots = [state]
    for (let i = 0; i < 6; i++) {
      const move = getValidMoves(state)[i % getValidMoves(state).length]!
      history = pushHistory(history, state, move.piece)
      state = applyMove(state, move)
      snapshots.push(state)
    }
    for (let i = snapshots.length - 2; i >= 0; i--) {
      const popped = popHistory(history)
      expect(popped).not.toBeNull()
      history = popped!.history
      expect(popped!.entry.state.tiles).toEqual(snapshots[i]!.tiles)
    }
  })
})

describe('scramble generation', () => {
  const sizes: PuzzleSize[] = [2, 3, 4, 5]

  it('uses a fixed scramble length for each size', () => {
    expect(SCRAMBLE_STEPS[2]).toBe(30)
    expect(SCRAMBLE_STEPS[3]).toBe(180)
    expect(SCRAMBLE_STEPS[4]).toBe(450)
    expect(SCRAMBLE_STEPS[5]).toBe(1500)
    for (const size of sizes) {
      const result = scramblePuzzle(size, createRng(size * 100))
      expect(result.steps).toBeGreaterThanOrEqual(SCRAMBLE_STEPS[size])
      expect(isSolved(result.state)).toBe(false)
      expect(isValidState(result.state)).toBe(true)
    }
  })

  it('only uses legal slides, so every scramble is reachable from solved', () => {
    for (const size of sizes) {
      const result = scrambleSteps(size, 25, createRng(900 + size))
      const replayed = replayMoves(createSolvedState(size), result.moves)
      expect(replayed.tiles).toEqual(result.state.tiles)
      expect(
        canReverseToSolved(result.state, result.moves, isSolved, tryMovePiece),
      ).toBe(true)
    }
  })

  it('proves 40 random scrambles per size are reversible to solved', () => {
    for (const size of sizes) {
      for (let i = 0; i < 40; i++) {
        const result = scrambleSteps(size, 12 + (i % 8), createRng(size * 1000 + i * 17))
        expect(isValidState(result.state)).toBe(true)
        expect(canReverseToSolved(result.state, result.moves, isSolved, tryMovePiece)).toBe(true)
        let cursor = result.state
        for (const piece of reverseScramblePieces(result.moves)) {
          const next = tryMovePiece(cursor, piece)
          expect(next).not.toBeNull()
          cursor = next!
        }
        expect(isSolved(cursor)).toBe(true)
      }
    }
  })

  it('does not immediately undo the previous scramble step when alternatives exist', () => {
    const result = scrambleSteps(3, 20, createRng(42))
    for (let i = 1; i < result.moves.length; i++) {
      expect(result.moves[i]!.fromIndex).not.toBe(result.moves[i - 1]!.toIndex)
    }
  })

  it('uses long axis slides on 3×3×3 and larger cubes, not only adjacent swaps', () => {
    for (const size of [3, 4, 5] as const) {
      const result = scrambleSteps(size, 40, createRng(size * 77))
      const usedLongSlide = result.moves.some((move) => {
        const from = indexToCoord(move.fromIndex, size)
        const empty = indexToCoord(move.toIndex, size)
        return manhattan(from, empty) > 1
      })
      expect(usedLongSlide).toBe(true)
    }
  })
})
