import type { PuzzleSize } from '../types/puzzle.ts'
import { solvedCoordForPiece } from './coordinates.ts'

export type ColorMode = 'gradient' | 'depth' | 'height' | 'stone'

export const COLOR_MODES: Array<{ id: ColorMode; label: string; hint: string }> = [
  { id: 'gradient', label: 'Gradient', hint: 'Home position as a 3D tint (right, down, toward you)' },
  { id: 'depth', label: 'Depth', hint: 'One color per layer from back to front' },
  { id: 'height', label: 'Height', hint: 'One color per floor from top to bottom' },
  { id: 'stone', label: 'Stone', hint: 'One color — read the numbers' },
]

export const DEFAULT_COLOR_MODE: ColorMode = 'gradient'

export function isColorMode(value: unknown): value is ColorMode {
  return COLOR_MODES.some((mode) => mode.id === value)
}

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)))
}

function hexColor(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((channel) => clampByte(channel).toString(16).padStart(2, '0')).join('')}`
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const lig = l / 100
  const chroma = sat * Math.min(lig, 1 - lig)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    return lig - chroma * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return hexColor(255 * channel(0), 255 * channel(8), 255 * channel(4))
}

function axisTint(index: number, size: number, hueFrom: number, hueTo: number): string {
  const max = Math.max(1, size - 1)
  const t = index / max
  return hslToHex(hueFrom + (hueTo - hueFrom) * t, 38, 70)
}

function gradientColor(piece: number, size: PuzzleSize): string {
  const { x, y, z } = solvedCoordForPiece(piece, size)
  const max = Math.max(1, size - 1)
  const tx = x / max
  const ty = y / max
  const tz = z / max
  const r = 236 - 28 * tz + 18 * tx
  const g = 168 + 58 * ty - 22 * tz
  const b = 128 + 92 * tz - 16 * tx
  return hexColor(r, g, b)
}

export function homeColor(
  piece: number,
  size: PuzzleSize,
  mode: ColorMode = DEFAULT_COLOR_MODE,
): string {
  if (mode === 'stone') return '#d2c4a8'
  const home = solvedCoordForPiece(piece, size)
  if (mode === 'depth') return axisTint(home.z, size, 28, 198)
  if (mode === 'height') return axisTint(home.y, size, 18, 155)
  return gradientColor(piece, size)
}

export const layerColor = homeColor
