import { describe, expect, it } from 'vitest'
import { createSolvedState, isSolved } from './puzzleState.ts'
import { applyMove, getValidMoves, tryMovePiece } from './puzzleMoves.ts'
import { greedyHintPiece, hintPiece, solvePuzzle, solverSupported } from './solver.ts'
import { scrambleSteps, reverseScramblePieces } from './scramble.ts'
import { createRng } from '../utils/random.ts'
import { isValidMoveOn, isValidState } from './validation.ts'

describe('solver', () => {
  it('supports 2×2×2 and 3×3×3 but not 4×4×4 or 5×5×5 brute force', () => {
    expect(solverSupported(2)).toBe(true)
    expect(solverSupported(3)).toBe(true)
    expect(solverSupported(4)).toBe(false)
    expect(solverSupported(5)).toBe(false)
    const four = scrambleSteps(4, 8, createRng(4))
    expect(solvePuzzle(four.state).ok).toBe(false)
    const five = scrambleSteps(5, 8, createRng(5))
    expect(solvePuzzle(five.state).ok).toBe(false)
  })

  it('solves a 2×2×2 scramble completely', () => {
    const scrambled = scrambleSteps(2, 16, createRng(7))
    const result = solvePuzzle(scrambled.state)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let state = scrambled.state
    for (const piece of result.pieces) {
      const next = tryMovePiece(state, piece)
      expect(next).not.toBeNull()
      state = next!
    }
    expect(isSolved(state)).toBe(true)
  })

  it('solves short 3×3×3 scrambles with A*', () => {
    const scrambled = scrambleSteps(3, 8, createRng(21))
    const result = solvePuzzle(scrambled.state)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let state = scrambled.state
    for (const piece of result.pieces) {
      const next = tryMovePiece(state, piece)
      expect(next).not.toBeNull()
      state = next!
    }
    expect(isSolved(state)).toBe(true)
  })

  it('returns an empty path for an already solved board', () => {
    const result = solvePuzzle(createSolvedState(3))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.pieces).toEqual([])
  })

  it('greedy hints only recommend a currently legal move', () => {
    const scrambled = scrambleSteps(3, 10, createRng(3))
    const piece = greedyHintPiece(scrambled.state)
    expect(piece).not.toBeNull()
    expect(tryMovePiece(scrambled.state, piece!)).not.toBeNull()
    const hinted = hintPiece(scrambled.state)
    expect(hinted).not.toBeNull()
    expect(tryMovePiece(scrambled.state, hinted!)).not.toBeNull()
  })

  it('reverse scramble sequence solves from the scramble origin', () => {
    const scrambled = scrambleSteps(3, 14, createRng(99))
    let state = scrambled.state
    for (const piece of reverseScramblePieces(scrambled.moves)) {
      state = tryMovePiece(state, piece)!
    }
    expect(isSolved(state)).toBe(true)
  })
})

describe('validation of arbitrary legal states', () => {
  it('accepts every state along a random walk as a valid configuration', () => {
    let state = createSolvedState(3)
    for (let i = 0; i < 30; i++) {
      const moves = getValidMoves(state)
      expect(moves.length).toBeGreaterThan(0)
      for (const move of moves) {
        expect(isValidMoveOn(state, move)).toBe(true)
      }
      state = applyMove(state, moves[i % moves.length]!)
      expect(isValidState(state)).toBe(true)
    }
  })
})
