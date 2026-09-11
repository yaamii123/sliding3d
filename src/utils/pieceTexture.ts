import * as THREE from 'three'

export { homeColor, layerColor } from './pieceColor.ts'

const cache = new Map<string, THREE.CanvasTexture>()

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
