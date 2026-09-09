import { useMemo } from 'react'
import type { PuzzleSize, PuzzleState } from '../types/puzzle.ts'
import { indexToCoord } from '../utils/coordinates.ts'
import { EmptyCell } from './EmptyCell.tsx'
import { GoalFrame } from './GoalFrame.tsx'
import { PuzzlePiece } from './PuzzlePiece.tsx'

interface PuzzleBoardProps {
  state: PuzzleState
  movable: number[]
  hintPiece: number | null
  solved: boolean
  snapToken: number
  onMove: (piece: number) => void
}

export function PuzzleBoard({
  state,
  movable,
  hintPiece,
  solved,
  snapToken,
  onMove,
}: PuzzleBoardProps) {
  const size = state.size as PuzzleSize
  const movableSet = useMemo(() => new Set(movable), [movable])
  const pieces = useMemo(() => {
    const result: Array<{ piece: number; index: number }> = []
    for (let index = 0; index < state.tiles.length; index++) {
      const piece = state.tiles[index]!
      if (piece === 0) continue
      result.push({ piece, index })
    }
    return result
  }, [state.tiles])

  return (
    <group>
      {pieces.map(({ piece, index }) => (
        <PuzzlePiece
          key={piece}
          piece={piece}
          coord={indexToCoord(index, size)}
          size={size}
          movable={movableSet.has(piece)}
          hinted={hintPiece === piece}
          inHome={index === piece - 1}
          solved={solved}
          snapToken={snapToken}
          onMove={onMove}
        />
      ))}
      <EmptyCell state={state} snapToken={snapToken} />
      <GoalFrame size={size} />
    </group>
  )
}
