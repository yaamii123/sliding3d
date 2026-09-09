import type { PuzzleSize } from '../types/puzzle.ts'
import { PUZZLE_SIZES } from '../types/puzzle.ts'
import { formatSize } from '../utils/formatting.ts'

interface ControlsProps {
  size: PuzzleSize
  canUndo: boolean
  isSolving: boolean
  solverSupported: boolean
  onSize: (size: PuzzleSize) => void
  onNewGame: () => void
  onScramble: () => void
  onUndo: () => void
  onReset: () => void
  onHint: () => void
  onSolve: () => void
  onResetCamera: () => void
}

export function Controls({
  size,
  canUndo,
  isSolving,
  solverSupported,
  onSize,
  onNewGame,
  onScramble,
  onUndo,
  onReset,
  onHint,
  onSolve,
  onResetCamera,
}: ControlsProps) {
  return (
    <div className="controls">
      <div className="control-group" role="group" aria-label="Puzzle size">
        {PUZZLE_SIZES.map((value) => (
          <button
            key={value}
            type="button"
            className={value === size ? 'chip active' : 'chip'}
            aria-pressed={value === size}
            aria-label={`Set size to ${formatSize(value)}`}
            onClick={() => onSize(value)}
          >
            {value}³
          </button>
        ))}
      </div>
      <div className="control-group actions" role="group" aria-label="Game actions">
        <button type="button" className="action primary" onClick={onNewGame}>
          New Game
        </button>
        <button type="button" className="action" onClick={onScramble}>
          Scramble
        </button>
        <button type="button" className="action" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" className="action" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="action" onClick={onHint} disabled={isSolving}>
          Hint
        </button>
        <button
          type="button"
          className="action"
          onClick={onSolve}
          disabled={isSolving}
          aria-label={solverSupported ? 'Solve puzzle' : 'Solve is limited on 4 by 4 by 4 and 5 by 5 by 5'}
          title={
            solverSupported
              ? 'Find a solution from the current position'
              : 'Disabled for 4×4×4 and 5×5×5 after moving'
          }
        >
          {isSolving ? 'Solving…' : 'Solve'}
        </button>
        <button type="button" className="action" onClick={onResetCamera} aria-label="Reset camera">
          Camera
        </button>
      </div>
    </div>
  )
}
