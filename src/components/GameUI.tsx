import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PuzzleController } from '../hooks/usePuzzle.ts'
import { useCompactHud } from '../hooks/useCompactHud.ts'
import { useTimer } from '../hooks/useTimer.ts'
import { formatSize } from '../utils/formatting.ts'
import type { BestRecord, PuzzleSize } from '../types/puzzle.ts'
import { BestTimes } from './BestTimes.tsx'
import { ControlSettings, Controls } from './Controls.tsx'
import { LayerMaps } from './LayerMaps.tsx'
import type { ColorMode } from '../utils/pieceColor.ts'
import { HelpPanel } from './HelpPanel.tsx'
import { Timer } from './Timer.tsx'

interface GameUIProps {
  puzzle: PuzzleController
  records: Array<{ size: PuzzleSize; record?: BestRecord }>
  currentBest?: BestRecord
  onResetCamera: () => void
  spread: boolean
  onSpread: () => void
  colorMode: ColorMode
  onColorMode: (mode: ColorMode) => void
}

export function GameUI({
  puzzle,
  records,
  currentBest,
  onResetCamera,
  spread,
  onSpread,
  colorMode,
  onColorMode,
}: GameUIProps) {
  const compact = useCompactHud()
  const [layersOpen, setLayersOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const elapsedMs = useTimer(puzzle.startedAt, puzzle.stoppedAt)
  const liveLabel =
    puzzle.status === 'solved'
      ? `Puzzle solved in ${puzzle.solvedMoves ?? puzzle.moveCount} moves`
      : `${formatSize(puzzle.size)}, ${puzzle.moveCount} moves`

  useEffect(() => {
    if (!compact) {
      setLayersOpen(false)
      setMoreOpen(false)
    }
  }, [compact])

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
          Gold-rimmed cubes share an axis with the gap and can be clicked. Use the layer maps to see every slice, or orbit
          and spread in 3D.
        </p>
        <div className="sr-only" aria-live="polite">
          {liveLabel}
        </div>
        <HelpPanel />
      </header>

      {!compact && (
        <aside className="hud-card hud-right">
          <LayerMaps
            state={puzzle.state}
            colorMode={colorMode}
            movable={puzzle.movable}
            hintPiece={puzzle.hintPiece}
            onMove={puzzle.tryMove}
          />
          <BestTimes size={puzzle.size} current={currentBest} combinations={records} />
        </aside>
      )}

      {compact &&
        layersOpen &&
        createPortal(
          <>
            <button
              type="button"
              className="help-backdrop"
              aria-label="Close layer maps"
              onClick={() => setLayersOpen(false)}
            />
            <div className="sheet" role="dialog" aria-label="Layer maps">
              <div className="sheet-head">
                <h2>Layers</h2>
                <button type="button" className="sheet-close" onClick={() => setLayersOpen(false)}>
                  Close
                </button>
              </div>
              <LayerMaps
                state={puzzle.state}
                colorMode={colorMode}
                movable={puzzle.movable}
                hintPiece={puzzle.hintPiece}
                onMove={puzzle.tryMove}
              />
            </div>
          </>,
          document.body,
        )}

      {compact &&
        moreOpen &&
        createPortal(
          <>
            <button
              type="button"
              className="help-backdrop"
              aria-label="Close settings"
              onClick={() => setMoreOpen(false)}
            />
            <div className="sheet" role="dialog" aria-label="Settings">
              <div className="sheet-head">
                <h2>More</h2>
                <button type="button" className="sheet-close" onClick={() => setMoreOpen(false)}>
                  Close
                </button>
              </div>
              <ControlSettings
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
                spread={spread}
                onSpread={onSpread}
                colorMode={colorMode}
                onColorMode={onColorMode}
              />
            </div>
          </>,
          document.body,
        )}

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
          spread={spread}
          onSpread={onSpread}
          colorMode={colorMode}
          onColorMode={onColorMode}
          compact={compact}
          layersOpen={layersOpen}
          onLayers={
            compact
              ? () => {
                  setMoreOpen(false)
                  setLayersOpen((open) => !open)
                }
              : undefined
          }
          moreOpen={moreOpen}
          onMore={
            compact
              ? () => {
                  setLayersOpen(false)
                  setMoreOpen((open) => !open)
                }
              : undefined
          }
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
