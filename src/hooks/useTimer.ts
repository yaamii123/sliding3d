import { useEffect, useState } from 'react'

/**
 * Display clock driven by performance.now(). The interval only updates the HUD;
 * it is not the source of truth for elapsed time.
 */
export function useTimer(startedAt: number | null, stoppedAt: number | null): number {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    if (startedAt === null) {
      setElapsedMs(0)
      return
    }

    const read = (): number => (stoppedAt ?? performance.now()) - startedAt
    setElapsedMs(read())
    if (stoppedAt !== null) return

    const id = window.setInterval(() => {
      setElapsedMs(read())
    }, 80)
    return () => window.clearInterval(id)
  }, [startedAt, stoppedAt])

  return elapsedMs
}
