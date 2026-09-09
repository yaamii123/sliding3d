export function formatTime(ms: number, withMs = false): string {
  const clamped = Math.max(0, Math.floor(ms))
  const totalSeconds = Math.floor(clamped / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  if (!withMs) return `${mm}:${ss}`
  const hundredths = Math.floor((clamped % 1000) / 10)
  return `${mm}:${ss}.${String(hundredths).padStart(2, '0')}`
}

export function formatSize(size: number): string {
  return `${size} × ${size} × ${size}`
}

export function capitalize(value: string): string {
  if (value.length === 0) return value
  return value[0]!.toUpperCase() + value.slice(1)
}
