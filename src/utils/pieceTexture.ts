import * as THREE from 'three'
import type { PuzzleSize } from '../types/puzzle.ts'
import { solvedCoordForPiece } from './coordinates.ts'

const cache = new Map<string, THREE.CanvasTexture>()

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)))
}

function hexColor(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((channel) => clampByte(channel).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Pastel RGB cube: X warms the color, Y lightens it, Z cools it toward sky.
 * That makes home position readable as a 3D gradient, not only a layer tint.
 */
export function homeColor(piece: number, size: PuzzleSize): string {
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

export const layerColor = homeColor

export function getNumberTexture(piece: number): THREE.CanvasTexture {
  const key = `n:${piece}`
  const cached = cache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas for piece texture')

  ctx.clearRect(0, 0, 256, 256)
  ctx.font = piece >= 100
    ? '700 96px "Trebuchet MS", "Segoe UI", system-ui, sans-serif'
    : piece >= 10
      ? '700 118px "Trebuchet MS", "Segoe UI", system-ui, sans-serif'
      : '700 136px "Trebuchet MS", "Segoe UI", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'rgba(255, 248, 236, 0.88)'
  ctx.lineWidth = 14
  ctx.strokeText(String(piece), 128, 136)
  ctx.fillStyle = '#1a2230'
  ctx.fillText(String(piece), 128, 136)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  cache.set(key, texture)
  return texture
}
