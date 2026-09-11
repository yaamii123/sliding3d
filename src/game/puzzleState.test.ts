import { describe, expect, it } from 'vitest'
import { createSolvedState, isSolved, manhattanSum, statesEqual } from './puzzleState.ts'
import { applyMove, canMovePiece, getValidMoves, movablePieces, tryMovePiece } from './puzzleMoves.ts'
import { coordToIndex, indexToCoord } from '../utils/coordinates.ts'

describe('solved-state detection', () => {
  it('marks a fresh 2×2×2, 3×3×3, 4×4×4, and 5×5×5 as solved', () => {
    for (const size of [2, 3, 4, 5] as const) {
      const state = createSolvedState(size)
      expect(isSolved(state)).toBe(true)
      expect(state.tiles[state.tiles.length - 1]).toBe(0)
      expect(state.emptyIndex).toBe(size ** 3 - 1)
      expect(state.tiles[0]).toBe(1)
    }
  })

  it('uses logical tiles, not visual positions', () => {
    const state = createSolvedState(3)
    const scrambled = tryMovePiece(state, state.tiles[state.emptyIndex - 1]!)
    expect(scrambled).not.toBeNull()
    expect(isSolved(scrambled!)).toBe(false)
  })

  it('is not solved if the empty cell is in the right place but a pair is swapped', () => {
    const state = createSolvedState(3)
    const tiles = state.tiles.slice()
    const a = tiles[0]!
    tiles[0] = tiles[1]!
    tiles[1] = a
    expect(isSolved({ ...state, tiles })).toBe(false)
  })
})

describe('3D movement', () => {
  it('allows moves along X, Y, and Z from the solved empty corner', () => {
    const state = createSolvedState(3)
    const empty = indexToCoord(state.emptyIndex, 3)
    expect(empty).toEqual({ x: 2, y: 0, z: 2 })
    const axes = new Set(getValidMoves(state).map((move) => move.axis))
    expect(axes).toEqual(new Set(['x', 'y', 'z']))
    expect(getValidMoves(state)).toHaveLength(3)
  })

  it('rejects diagonal and off-axis cubes', () => {
    const state = createSolvedState(3)
    expect(canMovePiece(state, 1)).toBe(false)
    expect(tryMovePiece(state, 1)).toBeNull()
    expect(tryMovePiece(state, 13)).toBeNull()
  })

  it('rejects moving the empty space or a missing piece', () => {
    const state = createSolvedState(3)
    expect(tryMovePiece(state, 0)).toBeNull()
    expect(tryMovePiece(state, 99)).toBeNull()
  })

  it('applies a legal X/Y/Z slide and updates the empty index', () => {
    let state = createSolvedState(3)
    for (const axis of ['x', 'y', 'z'] as const) {
      const move = getValidMoves(state).find((item) => item.axis === axis)
      expect(move).toBeDefined()
      const next = applyMove(state, move!)
      expect(next.emptyIndex).toBe(move!.fromIndex)
      expect(next.tiles[move!.toIndex]).toBe(move!.piece)
      expect(next.tiles[move!.fromIndex]).toBe(0)
      expect(isSolved(next)).toBe(false)
      state = createSolvedState(3)
    }
  })

  it('slides every cube on the same axis toward the empty cell', () => {
    const start = createSolvedState(3)
    // Empty is (2,0,2). Piece 25 sits at (0,0,2) — two cells away on X.
    const farX = tryMovePiece(start, 25)
    expect(farX).not.toBeNull()
    expect(farX!.emptyIndex).toBe(coordToIndex(0, 0, 2, 3))
    expect(farX!.tiles[coordToIndex(1, 0, 2, 3)]).toBe(25)
    expect(farX!.tiles[coordToIndex(2, 0, 2, 3)]).toBe(26)
    expect(farX!.tiles[coordToIndex(0, 0, 2, 3)]).toBe(0)

    const farY = tryMovePiece(start, 21)
    expect(farY).not.toBeNull()
    expect(farY!.emptyIndex).toBe(coordToIndex(2, 2, 2, 3))

    const farZ = tryMovePiece(start, 9)
    expect(farZ).not.toBeNull()
    expect(farZ!.emptyIndex).toBe(coordToIndex(2, 0, 0, 3))
  })

  it('is equivalent to several adjacent slides along that axis', () => {
    const start = createSolvedState(4)
    const line = tryMovePiece(start, 61)
    expect(line).not.toBeNull()

    const unitA = tryMovePiece(start, 63)
    expect(unitA).not.toBeNull()
    const unitB = tryMovePiece(unitA!, 62)
    expect(unitB).not.toBeNull()
    const unitC = tryMovePiece(unitB!, 61)
    expect(unitC).not.toBeNull()
    expect(unitC!.tiles).toEqual(line!.tiles)
    expect(unitC!.emptyIndex).toBe(line!.emptyIndex)
    expect(movablePieces(line!).length).toBeGreaterThan(0)
  })

  it('rejects cubes that do not share an axis with the empty cell', () => {
    const state = createSolvedState(4)
    const empty = indexToCoord(state.emptyIndex, 4)
    for (let i = 0; i < state.tiles.length; i++) {
      if (i === state.emptyIndex) continue
      const coord = indexToCoord(i, 4)
      const sameAxis =
        (coord.x !== empty.x && coord.y === empty.y && coord.z === empty.z) ||
        (coord.y !== empty.y && coord.x === empty.x && coord.z === empty.z) ||
        (coord.z !== empty.z && coord.x === empty.x && coord.y === empty.y)
      if (sameAxis) {
        expect(tryMovePiece(state, state.tiles[i]!)).not.toBeNull()
      } else {
        expect(tryMovePiece(state, state.tiles[i]!)).toBeNull()
      }
    }
  })
})

describe('reverse moves', () => {
  it('moving a piece then moving it again restores the previous state', () => {
    const start = createSolvedState(3)
    const first = getValidMoves(start)[0]!
    const mid = applyMove(start, first)
    const back = tryMovePiece(mid, first.piece)
    expect(back).not.toBeNull()
    expect(statesEqual(start, back!)).toBe(true)
  })
})

describe('manhattan heuristic', () => {
  it('is zero only for the solved configuration', () => {
    expect(manhattanSum(createSolvedState(3))).toBe(0)
    const moved = tryMovePiece(createSolvedState(3), getValidMoves(createSolvedState(3))[0]!.piece)!
    expect(manhattanSum(moved)).toBeGreaterThan(0)
  })
})
