import { formatSize, formatTime } from '../utils/formatting.ts'
import type { BestRecord, PuzzleSize } from '../types/puzzle.ts'

interface BestTimesProps {
  size: PuzzleSize
  current?: BestRecord
  combinations: Array<{ size: PuzzleSize; record?: BestRecord }>
}

export function BestTimes({ size, current, combinations }: BestTimesProps) {
  return (
    <section className="best-times" aria-label="Best times">
      <h2>Best Times</h2>
      <p className="best-current">
        {current
          ? `${formatSize(size)} · ${formatTime(current.timeMs, true)} · ${current.moves} moves`
          : `${formatSize(size)} · no record yet`}
      </p>
      <ol>
        {combinations
          .filter((row) => row.record)
          .map((row) => (
            <li key={row.size}>
              <span>{row.size}³</span>
              <span>
                {formatTime(row.record!.timeMs)} · {row.record!.moves}m
              </span>
            </li>
          ))}
      </ol>
    </section>
  )
}
