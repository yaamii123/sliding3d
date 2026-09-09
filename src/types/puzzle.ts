export type PuzzleSize = 2 | 3 | 4 | 5

export type Axis = 'x' | 'y' | 'z'

export interface Coord {
  x: number
  y: number
  z: number
}

/**
 * Logical puzzle state. Independent from Three.js rendering.
 * `tiles[index] === 0` is the empty space. Other values are 1-based piece ids.
 * Index mapping: x + y * size + z * size * size
 */
export interface PuzzleState {
  size: PuzzleSize
  tiles: number[]
  emptyIndex: number
}

export interface SlideMove {
  piece: number
  fromIndex: number
  toIndex: number
  axis: Axis
  delta: -1 | 1
}

export type GameStatus = 'ready' | 'playing' | 'solved'

export interface BestRecord {
  timeMs: number
  moves: number
  scrambleLength: number
  at: string
}

export type SolveResult =
  | {
      ok: true
      pieces: number[]
      method: 'bfs' | 'astar' | 'reverse-scramble'
    }
  | {
      ok: false
      reason: string
    }

export const PUZZLE_SIZES: PuzzleSize[] = [2, 3, 4, 5]
