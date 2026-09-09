import type { Axis, Coord, PuzzleState, SlideMove } from '../types/puzzle.ts'
import { coordToIndex, inBounds, indexToCoord, sharedAxis } from '../utils/coordinates.ts'
import { cloneState } from './puzzleState.ts'

interface Neighbor {
  axis: Axis
  delta: -1 | 1
  dx: number
  dy: number
  dz: number
}

const NEIGHBORS: Neighbor[] = [
  { axis: 'x', delta: -1, dx: -1, dy: 0, dz: 0 },
  { axis: 'x', delta: 1, dx: 1, dy: 0, dz: 0 },
  { axis: 'y', delta: -1, dx: 0, dy: -1, dz: 0 },
  { axis: 'y', delta: 1, dx: 0, dy: 1, dz: 0 },
  { axis: 'z', delta: -1, dx: 0, dy: 0, dz: -1 },
  { axis: 'z', delta: 1, dx: 0, dy: 0, dz: 1 },
]

/**
 * Unit slides into the empty cell. Used by scramble and the solver so each
 * recorded step is a single face-adjacent swap.
 */
export function getValidMoves(state: PuzzleState): SlideMove[] {
  const empty = indexToCoord(state.emptyIndex, state.size)
  const moves: SlideMove[] = []
  for (const neighbor of NEIGHBORS) {
    const x = empty.x + neighbor.dx
    const y = empty.y + neighbor.dy
    const z = empty.z + neighbor.dz
    if (!inBounds(x, y, z, state.size)) continue
    const fromIndex = coordToIndex(x, y, z, state.size)
    const piece = state.tiles[fromIndex]
    if (piece === undefined || piece === 0) continue
    moves.push({
      piece,
      fromIndex,
      toIndex: state.emptyIndex,
      axis: neighbor.axis,
      delta: neighbor.delta,
    })
  }
  return moves
}

export function getMoveForPiece(state: PuzzleState, piece: number): SlideMove | null {
  if (piece <= 0) return null
  return getValidMoves(state).find((move) => move.piece === piece) ?? null
}

export function canMovePiece(state: PuzzleState, piece: number): boolean {
  return findPieceLineIndex(state, piece) !== null
}

export function isLegalSlide(from: Coord, empty: Coord): boolean {
  return sharedAxis(from, empty) !== null
}

export function applyMove(state: PuzzleState, move: SlideMove): PuzzleState {
  const next = cloneState(state)
  next.tiles[move.toIndex] = move.piece
  next.tiles[move.fromIndex] = 0
  next.emptyIndex = move.fromIndex
  return next
}

/**
 * Click-to-slide: any cube on the same X, Y, or Z line as the empty cell may
 * move. Every cube between it and the gap shifts one step toward the empty
 * cell, which is equivalent to several adjacent slides in one action.
 */
export function tryMovePiece(state: PuzzleState, piece: number): PuzzleState | null {
  const fromIndex = findPieceLineIndex(state, piece)
  if (fromIndex === null) return null
  return applyLineSlide(state, fromIndex)
}

export function applyLineSlide(state: PuzzleState, fromIndex: number): PuzzleState | null {
  if (fromIndex === state.emptyIndex) return null
  const size = state.size
  const from = indexToCoord(fromIndex, size)
  const empty = indexToCoord(state.emptyIndex, size)
  const axis = sharedAxis(from, empty)
  if (!axis) return null

  const step = Math.sign(empty[axis] - from[axis]) as -1 | 1
  const next = cloneState(state)
  let destIndex = state.emptyIndex
  const cursor = { ...empty }
  cursor[axis] -= step

  while (true) {
    const srcIndex = coordToIndex(cursor.x, cursor.y, cursor.z, size)
    next.tiles[destIndex] = state.tiles[srcIndex]!
    destIndex = srcIndex
    if (srcIndex === fromIndex) break
    cursor[axis] -= step
  }

  next.tiles[fromIndex] = 0
  next.emptyIndex = fromIndex
  return next
}

export function applyMoveAtIndex(tiles: number[], emptyIndex: number, fromIndex: number): {
  tiles: number[]
  emptyIndex: number
  piece: number
} {
  const piece = tiles[fromIndex]!
  const next = tiles.slice()
  next[emptyIndex] = piece
  next[fromIndex] = 0
  return { tiles: next, emptyIndex: fromIndex, piece }
}

export function neighborIndices(emptyIndex: number, size: number): number[] {
  const empty = indexToCoord(emptyIndex, size)
  const indices: number[] = []
  for (const neighbor of NEIGHBORS) {
    const x = empty.x + neighbor.dx
    const y = empty.y + neighbor.dy
    const z = empty.z + neighbor.dz
    if (!inBounds(x, y, z, size)) continue
    indices.push(coordToIndex(x, y, z, size))
  }
  return indices
}

export function displacement(from: Coord, to: Coord): { axis: Axis | null; legal: boolean } {
  const axis = sharedAxis(from, to)
  return { axis, legal: axis !== null }
}

export function movablePieces(state: PuzzleState): number[] {
  return getLineMoveCandidates(state).map((move) => move.piece)
}

/** Every cube on the empty cell's X, Y, or Z line — the same set a player may click. */
export function getLineMoveCandidates(state: PuzzleState): Array<{ piece: number; fromIndex: number }> {
  const empty = indexToCoord(state.emptyIndex, state.size)
  const candidates: Array<{ piece: number; fromIndex: number }> = []
  for (let i = 0; i < state.tiles.length; i++) {
    const piece = state.tiles[i]!
    if (piece === 0) continue
    if (sharedAxis(indexToCoord(i, state.size), empty)) {
      candidates.push({ piece, fromIndex: i })
    }
  }
  return candidates
}

function findPieceLineIndex(state: PuzzleState, piece: number): number | null {
  if (piece <= 0) return null
  const fromIndex = state.tiles.indexOf(piece)
  if (fromIndex < 0) return null
  const from = indexToCoord(fromIndex, state.size)
  const empty = indexToCoord(state.emptyIndex, state.size)
  if (!sharedAxis(from, empty)) return null
  return fromIndex
}
