import type { Axis, Coord, PuzzleSize } from '../types/puzzle.ts'

export const CELL_SIZE = 1
export const CELL_GAP = 0.14

export function volume(size: PuzzleSize): number {
  return size * size * size
}

export function indexToCoord(index: number, size: number): Coord {
  const x = index % size
  const y = Math.floor(index / size) % size
  const z = Math.floor(index / (size * size))
  return { x, y, z }
}

export function coordToIndex(x: number, y: number, z: number, size: number): number {
  return x + y * size + z * size * size
}

export function inBounds(x: number, y: number, z: number, size: number): boolean {
  return x >= 0 && x < size && y >= 0 && y < size && z >= 0 && z < size
}

export function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)
}

export function coordsEqual(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z
}

/** Axis-aligned adjacency: exactly one axis differs by 1. */
export function isFaceAdjacent(a: Coord, b: Coord): boolean {
  return manhattan(a, b) === 1
}

/**
 * If two cells lie on a straight grid line (exactly one coordinate differs),
 * return that axis. Diagonals and identical cells return null.
 */
export function sharedAxis(a: Coord, b: Coord): Axis | null {
  const sameX = a.x === b.x
  const sameY = a.y === b.y
  const sameZ = a.z === b.z
  const matched = Number(sameX) + Number(sameY) + Number(sameZ)
  if (matched !== 2) return null
  if (!sameX) return 'x'
  if (!sameY) return 'y'
  return 'z'
}

export function solvedIndexForPiece(piece: number): number {
  return piece - 1
}

export function solvedCoordForPiece(piece: number, size: number): Coord {
  return indexToCoord(solvedIndexForPiece(piece), size)
}

export function worldPosition(
  coord: Coord,
  size: number,
  cellSize = CELL_SIZE,
  gap = CELL_GAP,
): [number, number, number] {
  const offset = (size - 1) / 2
  const stride = cellSize + gap
  return [
    (coord.x - offset) * stride,
    (coord.y - offset) * stride,
    (coord.z - offset) * stride,
  ]
}

export function puzzleExtent(size: number, cellSize = CELL_SIZE, gap = CELL_GAP): number {
  return size * cellSize + (size - 1) * gap
}

export function defaultCameraPosition(size: number): [number, number, number] {
  const dist = puzzleExtent(size) * 1.85 + 1.8
  return [dist * 0.86, dist * 0.68, dist * 1.02]
}

export function cameraLimits(size: number): { minDistance: number; maxDistance: number } {
  const extent = puzzleExtent(size)
  return {
    minDistance: Math.max(2.4, extent * 1.15),
    maxDistance: Math.max(14, extent * 6.2),
  }
}
