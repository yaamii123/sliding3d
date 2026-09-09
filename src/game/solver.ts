import type { PuzzleState, SolveResult } from '../types/puzzle.ts'
import { indexToCoord } from '../utils/coordinates.ts'
import { applyMove, applyMoveAtIndex, getValidMoves, neighborIndices } from './puzzleMoves.ts'
import { createSolvedState, encodeTiles, isSolved, manhattanSum } from './puzzleState.ts'

const SIZE_3_NODE_BUDGET = 180_000
const SIZE_3_TIME_MS = 450
const NODES_PER_SLICE = 3_500

interface SearchNode {
  tiles: number[]
  empty: number
  g: number
  f: number
}

class MinHeap {
  private data: SearchNode[] = []

  get size(): number {
    return this.data.length
  }

  push(node: SearchNode): void {
    this.data.push(node)
    this.bubbleUp(this.data.length - 1)
  }

  pop(): SearchNode | undefined {
    if (this.data.length === 0) return undefined
    const top = this.data[0]
    const last = this.data.pop()!
    if (this.data.length > 0) {
      this.data[0] = last
      this.bubbleDown(0)
    }
    return top
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (this.data[parent]!.f <= this.data[index]!.f) break
      const tmp = this.data[parent]!
      this.data[parent] = this.data[index]!
      this.data[index] = tmp
      index = parent
    }
  }

  private bubbleDown(index: number): void {
    const n = this.data.length
    while (true) {
      let smallest = index
      const left = index * 2 + 1
      const right = left + 1
      if (left < n && this.data[left]!.f < this.data[smallest]!.f) smallest = left
      if (right < n && this.data[right]!.f < this.data[smallest]!.f) smallest = right
      if (smallest === index) break
      const tmp = this.data[index]!
      this.data[index] = this.data[smallest]!
      this.data[smallest] = tmp
      index = smallest
    }
  }
}

function heuristic(tiles: number[], size: number): number {
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

function reconstruct(
  cameFrom: Map<string, { prev: string; piece: number }>,
  startKey: string,
  goalKey: string,
): number[] {
  const pieces: number[] = []
  let key = goalKey
  while (key !== startKey) {
    const step = cameFrom.get(key)
    if (!step) break
    pieces.push(step.piece)
    key = step.prev
  }
  pieces.reverse()
  return pieces
}

function bfsSolve(state: PuzzleState): SolveResult {
  const startKey = encodeTiles(state.tiles)
  const goal = createSolvedState(state.size)
  const goalKey = encodeTiles(goal.tiles)
  if (startKey === goalKey) return { ok: true, pieces: [], method: 'bfs' }

  const queue: Array<{ tiles: number[]; empty: number }> = [
    { tiles: state.tiles.slice(), empty: state.emptyIndex },
  ]
  const seen = new Set<string>([startKey])
  const cameFrom = new Map<string, { prev: string; piece: number }>()

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentKey = encodeTiles(current.tiles)
    for (const fromIndex of neighborIndices(current.empty, state.size)) {
      const next = applyMoveAtIndex(current.tiles, current.empty, fromIndex)
      const nextKey = encodeTiles(next.tiles)
      if (seen.has(nextKey)) continue
      seen.add(nextKey)
      cameFrom.set(nextKey, { prev: currentKey, piece: next.piece })
      if (nextKey === goalKey) {
        return { ok: true, pieces: reconstruct(cameFrom, startKey, nextKey), method: 'bfs' }
      }
      queue.push({ tiles: next.tiles, empty: next.emptyIndex })
    }
  }

  return { ok: false, reason: 'No solution found. This should not happen for a legally scrambled 2×2×2.' }
}

function astarSolveSync(state: PuzzleState, maxNodes: number, timeMs: number): SolveResult {
  const started = Date.now()
  const size = state.size
  const startKey = encodeTiles(state.tiles)
  const goalKey = encodeTiles(createSolvedState(size).tiles)
  if (startKey === goalKey) return { ok: true, pieces: [], method: 'astar' }

  const heap = new MinHeap()
  heap.push({
    tiles: state.tiles.slice(),
    empty: state.emptyIndex,
    g: 0,
    f: heuristic(state.tiles, size),
  })
  const gScore = new Map<string, number>([[startKey, 0]])
  const cameFrom = new Map<string, { prev: string; piece: number }>()
  let expanded = 0

  while (heap.size > 0) {
    if (expanded >= maxNodes || Date.now() - started > timeMs) {
      return {
        ok: false,
        reason: 'This 3×3×3 position is too deep for the in-browser solver. Try Hint, Undo, or a shorter scramble.',
      }
    }
    const current = heap.pop()!
    const currentKey = encodeTiles(current.tiles)
    const knownG = gScore.get(currentKey)
    if (knownG !== undefined && current.g > knownG) continue
    expanded += 1
    if (currentKey === goalKey) {
      return { ok: true, pieces: reconstruct(cameFrom, startKey, currentKey), method: 'astar' }
    }
    for (const fromIndex of neighborIndices(current.empty, size)) {
      const next = applyMoveAtIndex(current.tiles, current.empty, fromIndex)
      const nextKey = encodeTiles(next.tiles)
      const tentativeG = current.g + 1
      const previous = gScore.get(nextKey)
      if (previous !== undefined && tentativeG >= previous) continue
      gScore.set(nextKey, tentativeG)
      cameFrom.set(nextKey, { prev: currentKey, piece: next.piece })
      heap.push({
        tiles: next.tiles,
        empty: next.emptyIndex,
        g: tentativeG,
        f: tentativeG + heuristic(next.tiles, size),
      })
    }
  }

  return { ok: false, reason: 'No solution found within the search budget.' }
}

export function solverSupported(size: number): boolean {
  return size === 2 || size === 3
}

export function solvePuzzle(state: PuzzleState): SolveResult {
  if (isSolved(state)) return { ok: true, pieces: [], method: 'bfs' }
  if (state.size >= 4) {
    return {
      ok: false,
      reason: 'Automatic solving is disabled for 4×4×4 and 5×5×5 — the search space would freeze the browser. Use Hint for a greedy nudge, or Undo.',
    }
  }
  if (state.size === 2) return bfsSolve(state)
  return astarSolveSync(state, SIZE_3_NODE_BUDGET, SIZE_3_TIME_MS)
}

export async function solvePuzzleAsync(
  state: PuzzleState,
  options?: { cancelled?: () => boolean },
): Promise<SolveResult> {
  if (isSolved(state)) return { ok: true, pieces: [], method: 'bfs' }
  if (state.size >= 4) return solvePuzzle(state)
  if (state.size === 2) return bfsSolve(state)

  const cancelled = options?.cancelled
  const size = state.size
  const startKey = encodeTiles(state.tiles)
  const goalKey = encodeTiles(createSolvedState(size).tiles)
  const started = Date.now()
  const heap = new MinHeap()
  heap.push({
    tiles: state.tiles.slice(),
    empty: state.emptyIndex,
    g: 0,
    f: heuristic(state.tiles, size),
  })
  const gScore = new Map<string, number>([[startKey, 0]])
  const cameFrom = new Map<string, { prev: string; piece: number }>()
  let expanded = 0

  while (heap.size > 0) {
    if (cancelled?.()) return { ok: false, reason: 'Solve cancelled.' }
    for (let i = 0; i < NODES_PER_SLICE && heap.size > 0; i++) {
      if (expanded >= SIZE_3_NODE_BUDGET || Date.now() - started > SIZE_3_TIME_MS) {
        return {
          ok: false,
          reason: 'This 3×3×3 position is too deep for the in-browser solver. Try Hint, Undo, or a shorter scramble.',
        }
      }
      const current = heap.pop()!
      const currentKey = encodeTiles(current.tiles)
      const knownG = gScore.get(currentKey)
      if (knownG !== undefined && current.g > knownG) continue
      expanded += 1
      if (currentKey === goalKey) {
        return { ok: true, pieces: reconstruct(cameFrom, startKey, currentKey), method: 'astar' }
      }
      for (const fromIndex of neighborIndices(current.empty, size)) {
        const next = applyMoveAtIndex(current.tiles, current.empty, fromIndex)
        const nextKey = encodeTiles(next.tiles)
        const tentativeG = current.g + 1
        const previous = gScore.get(nextKey)
        if (previous !== undefined && tentativeG >= previous) continue
        gScore.set(nextKey, tentativeG)
        cameFrom.set(nextKey, { prev: currentKey, piece: next.piece })
        heap.push({
          tiles: next.tiles,
          empty: next.emptyIndex,
          g: tentativeG,
          f: tentativeG + heuristic(next.tiles, size),
        })
      }
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
    })
  }

  return { ok: false, reason: 'No solution found within the search budget.' }
}

/**
 * Prefer a legal move that reduces 3D Manhattan distance. Used for hints on
 * 4×4×4 / 5×5×5 and as a fallback when A* cannot finish.
 */
export function greedyHintPiece(state: PuzzleState): number | null {
  const currentH = manhattanSum(state)
  let bestPiece: number | null = null
  let bestH = Number.POSITIVE_INFINITY
  const moves = getValidMoves(state)
  for (const move of moves) {
    const next = applyMove(state, move)
    const h = manhattanSum(next)
    if (h < bestH) {
      bestH = h
      bestPiece = move.piece
    }
  }
  if (bestPiece !== null && bestH <= currentH) return bestPiece
  return bestPiece ?? moves[0]?.piece ?? null
}

export function hintPiece(state: PuzzleState): number | null {
  if (isSolved(state)) return null
  if (state.size === 2) {
    const result = bfsSolve(state)
    if (result.ok) return result.pieces[0] ?? null
  }
  if (state.size === 3) {
    const result = astarSolveSync(state, 24_000, 80)
    if (result.ok) return result.pieces[0] ?? greedyHintPiece(state)
  }
  return greedyHintPiece(state)
}
