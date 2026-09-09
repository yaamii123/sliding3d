import type { PuzzleController } from '../hooks/usePuzzle.ts'
import { useTimer } from '../hooks/useTimer.ts'
import { formatSize } from '../utils/formatting.ts'
import type { BestRecord, PuzzleSize } from '../types/puzzle.ts'
import { BestTimes } from './BestTimes.tsx'
import { Controls } from './Controls.tsx'
import { GoalLegend } from './GoalLegend.tsx'
import { HelpPanel } from './HelpPanel.tsx'
import { Timer } from './Timer.tsx'

interface GameUIProps {
  puzzle: PuzzleController
  records: Array<{ size: PuzzleSize; record?: BestRecord }>
  currentBest?: BestRecord
  onResetCamera: () => void
}

export function GameUI({ puzzle, records, currentBest, onResetCamera }: GameUIProps) {
  const elapsedMs = useTimer(puzzle.startedAt, puzzle.stoppedAt)
  const liveLabel =
    puzzle.status === 'solved'
      ? `Puzzle solved in ${puzzle.solvedMoves ?? puzzle.moveCount} moves`
      : `${formatSize(puzzle.size)}, ${puzzle.moveCount} moves`

  return (
    <div className="hud">
      <header className="hud-card hud-left">
        <p className="eyebrow">Cubic sliding toy</p>
        <h1>3D Sliding Puzzle</h1>
        <dl className="stats">
          <div>
            <dt>Size</dt>
            <dd>{formatSize(puzzle.size)}</dd>
          </div>
          <div>
            <dt>Moves</dt>
            <dd>{puzzle.moveCount}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              <Timer elapsedMs={puzzle.status === 'solved' ? (puzzle.solvedTimeMs ?? elapsedMs) : elapsedMs} />
            </dd>
          </div>
          <div>
            <dt>Scramble</dt>
            <dd>{puzzle.scrambleLength}</dd>
          </div>
        </dl>
        <p className="status-line">
          {puzzle.status === 'solved' ? 'Solved' : puzzle.status === 'playing' ? 'In motion' : 'Ready'}
        </p>
        <p className="orientation-line">
          1 lives in the tagged corner. The gold frame is where the gap belongs. Cubes glow when they are home.
        </p>
        <div className="sr-only" aria-live="polite">
          {liveLabel}
        </div>
        <HelpPanel />
      </header>

      <aside className="hud-card hud-right">
        <GoalLegend size={puzzle.size} />
        <BestTimes size={puzzle.size} current={currentBest} combinations={records} />
      </aside>

      <footer className="hud-bottom">
        <Controls
          size={puzzle.size}
          canUndo={puzzle.canUndo}
          isSolving={puzzle.isSolving}
          solverSupported={puzzle.solverSupported}
          onSize={puzzle.setSize}
          onNewGame={puzzle.newGame}
          onScramble={puzzle.scramble}
          onUndo={puzzle.undo}
          onReset={puzzle.reset}
          onHint={puzzle.hint}
          onSolve={puzzle.solve}
          onResetCamera={onResetCamera}
        />
      </footer>

      {puzzle.solverMessage && (
        <p className="toast" role="status">
          <span>{puzzle.solverMessage}</span>
          <button type="button" onClick={puzzle.dismissMessage} aria-label="Dismiss message">
            Close
          </button>
        </p>
      )}
    </div>
  )
}
