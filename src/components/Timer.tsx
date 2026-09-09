import { formatTime } from '../utils/formatting.ts'

interface TimerProps {
  elapsedMs: number
  withMs?: boolean
}

export function Timer({ elapsedMs, withMs = false }: TimerProps) {
  return (
    <span className="stat-value" aria-live="off">
      {formatTime(elapsedMs, withMs)}
    </span>
  )
}
