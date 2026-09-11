import type { PuzzleSize } from '../types/puzzle.ts'
import { PUZZLE_SIZES } from '../types/puzzle.ts'
import { formatSize } from '../utils/formatting.ts'
import { COLOR_MODES, type ColorMode } from '../utils/pieceColor.ts'

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
  spread: boolean
  onSpread: () => void
  colorMode: ColorMode
  onColorMode: (mode: ColorMode) => void
  layersOpen?: boolean
  onLayers?: () => void
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
  spread,
  onSpread,
  colorMode,
  onColorMode,
  layersOpen = false,
  onLayers,
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
      <div className="control-group" role="group" aria-label="Cube colors">
        {COLOR_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={mode.id === colorMode ? 'chip active' : 'chip'}
            aria-pressed={mode.id === colorMode}
            aria-label={mode.hint}
            title={mode.hint}
            onClick={() => onColorMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div className="control-group actions" role="group" aria-label="Game actions">
        <button type="button" className="action primary" onClick={onNewGame}>
          New Game
        </button>
        <button type="button" className="action hide-narrow" onClick={onScramble}>
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
        <button
          type="button"
          className={spread ? 'action active' : 'action'}
          onClick={onSpread}
          aria-pressed={spread}
          aria-label={spread ? 'Pack cubes together' : 'Spread cubes apart to reach inner layers'}
          title="Pull cubes apart so inner layers can be seen and clicked (X)"
        >
          Spread
        </button>
        {onLayers ? (
          <button
            type="button"
            className={layersOpen ? 'action active show-narrow' : 'action show-narrow'}
            onClick={onLayers}
            aria-pressed={layersOpen}
            aria-label={layersOpen ? 'Hide layer maps' : 'Show layer maps'}
          >
            Layers
          </button>
        ) : null}
      </div>
    </div>
  )
}
