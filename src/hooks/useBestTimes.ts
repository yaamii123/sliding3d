import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BestRecord, PuzzleSize } from '../types/puzzle.ts'
import { PUZZLE_SIZES } from '../types/puzzle.ts'
import { bestKey, loadBestTimes } from '../utils/storage.ts'

export function useBestTimes(revision: number): {
  records: Partial<Record<string, BestRecord>>
  lookup: (size: PuzzleSize) => BestRecord | undefined
  combinations: Array<{ size: PuzzleSize; record?: BestRecord }>
} {
  const [records, setRecords] = useState(() => loadBestTimes())

  useEffect(() => {
    setRecords(loadBestTimes())
  }, [revision])

  const lookup = useCallback(
    (size: PuzzleSize) => records[bestKey(size)],
    [records],
  )

  const combinations = useMemo(() => {
    return PUZZLE_SIZES.map((size) => ({
      size,
      record: records[bestKey(size)],
    }))
  }, [records])

  return { records, lookup, combinations }
}
