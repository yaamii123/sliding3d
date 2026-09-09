import { useEffect, useId, useRef } from 'react'
import { formatSize, formatTime } from '../utils/formatting.ts'
import type { PuzzleSize } from '../types/puzzle.ts'

interface CompletionModalProps {
  size: PuzzleSize
  moves: number
  timeMs: number
  usedSolver: boolean
  onNewGame: () => void
  onClose: () => void
}

export function CompletionModal({
  size,
  moves,
  timeMs,
  usedSolver,
  onNewGame,
  onClose,
}: CompletionModalProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="modal-kicker">Solved</p>
        <h2 id={titleId}>The cube is whole again</h2>
        <p className="modal-copy">
          {formatSize(size)}
          {usedSolver ? ' · solved with assistance' : ''}
        </p>
        <dl className="modal-stats">
          <div>
            <dt>Moves</dt>
            <dd>{moves}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatTime(timeMs, true)}</dd>
          </div>
        </dl>
        <div className="modal-actions">
          <button ref={closeRef} type="button" className="action primary" onClick={onNewGame}>
            New puzzle
          </button>
          <button type="button" className="action" onClick={onClose}>
            Keep viewing
          </button>
        </div>
      </div>
    </div>
  )
}
