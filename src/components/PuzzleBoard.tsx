import { useMemo } from 'react'
import type { PuzzleSize, PuzzleState } from '../types/puzzle.ts'
import { movablePieces } from '../game/puzzleMoves.ts'
import { indexToCoord } from '../utils/coordinates.ts'
import type { ColorMode } from '../utils/pieceColor.ts'
import { EmptyCell } from './EmptyCell.tsx'
import { GoalFrame } from './GoalFrame.tsx'
import { PuzzlePiece } from './PuzzlePiece.tsx'

interface PuzzleBoardProps {
  state: PuzzleState
  movable: number[]
  hintPiece: number | null
  solved: boolean
  snapToken: number
  gap: number
  colorMode: ColorMode
  onMove: (piece: number) => void
}

export function PuzzleBoard({
  state,
  movable,
  hintPiece,
  solved,
  snapToken,
  gap,
  colorMode,
  onMove,
}: PuzzleBoardProps) {
  const size = state.size as PuzzleSize
  const movableSet = useMemo(() => new Set(movable), [movable])
  const liveSet = useMemo(() => new Set(movablePieces(state)), [state])
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
          live={liveSet.has(piece)}
          hinted={hintPiece === piece}
          inHome={index === piece - 1}
          solved={solved}
          snapToken={snapToken}
          gap={gap}
          colorMode={colorMode}
          onMove={onMove}
        />
      ))}
      <EmptyCell state={state} snapToken={snapToken} gap={gap} />
      <GoalFrame size={size} gap={gap} />
    </group>
  )
}
