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
  compact?: boolean
  layersOpen?: boolean
  onLayers?: () => void
  moreOpen?: boolean
  onMore?: () => void
}

function SizeChips({
  size,
  onSize,
}: {
  size: PuzzleSize
  onSize: (size: PuzzleSize) => void
}) {
  return (
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
  )
}

function ColorChips({
  colorMode,
  onColorMode,
}: {
  colorMode: ColorMode
  onColorMode: (mode: ColorMode) => void
}) {
  return (
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
  )
}

function ExtraActions({
  isSolving,
  solverSupported,
  spread,
  onReset,
  onHint,
  onSolve,
  onResetCamera,
  onSpread,
}: Pick<
  ControlsProps,
  'isSolving' | 'solverSupported' | 'spread' | 'onReset' | 'onHint' | 'onSolve' | 'onResetCamera' | 'onSpread'
>) {
  return (
    <>
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
    </>
  )
}

export function ControlSettings(props: ControlsProps) {
  return (
    <div className="control-settings">
      <p>Size</p>
      <SizeChips size={props.size} onSize={props.onSize} />
      <p>Colors</p>
      <ColorChips colorMode={props.colorMode} onColorMode={props.onColorMode} />
      <p>Play</p>
      <div className="control-group" role="group" aria-label="More game actions">
        <ExtraActions
          isSolving={props.isSolving}
          solverSupported={props.solverSupported}
          spread={props.spread}
          onReset={props.onReset}
          onHint={props.onHint}
          onSolve={props.onSolve}
          onResetCamera={props.onResetCamera}
          onSpread={props.onSpread}
        />
      </div>
    </div>
  )
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
  compact = false,
  layersOpen = false,
  onLayers,
  moreOpen = false,
  onMore,
}: ControlsProps) {
  return (
    <div className="controls">
      {!compact && (
        <>
          <SizeChips size={size} onSize={onSize} />
          <ColorChips colorMode={colorMode} onColorMode={onColorMode} />
        </>
      )}
      <div className="control-group actions" role="group" aria-label="Game actions">
        <button type="button" className="action primary" onClick={onNewGame}>
          New Game
        </button>
        {!compact ? (
          <button type="button" className="action hide-narrow" onClick={onScramble}>
            Scramble
          </button>
        ) : null}
        <button type="button" className="action" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        {!compact && (
          <ExtraActions
            isSolving={isSolving}
            solverSupported={solverSupported}
            spread={spread}
            onReset={onReset}
            onHint={onHint}
            onSolve={onSolve}
            onResetCamera={onResetCamera}
            onSpread={onSpread}
          />
        )}
        {onLayers ? (
          <button
            type="button"
            className={layersOpen ? 'action active' : 'action'}
            onClick={onLayers}
            aria-pressed={layersOpen}
            aria-label={layersOpen ? 'Hide layer maps' : 'Show layer maps'}
          >
            Layers
          </button>
        ) : null}
        {onMore ? (
          <button
            type="button"
            className={moreOpen ? 'action active' : 'action'}
            onClick={onMore}
            aria-pressed={moreOpen}
            aria-label={moreOpen ? 'Hide more' : 'Show more'}
          >
            More
          </button>
        ) : null}
      </div>
    </div>
  )
}
