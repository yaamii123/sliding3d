import { describe, expect, it } from 'vitest'
import { homeColor } from './pieceColor.ts'

describe('piece colors', () => {
  it('uses one stone color for every cube', () => {
    expect(homeColor(1, 3, 'stone')).toBe(homeColor(26, 3, 'stone'))
    expect(homeColor(1, 5, 'stone')).toBe(homeColor(124, 5, 'stone'))
  })

  it('tints depth by home Z, not by number', () => {
    // 3×3×3: pieces 1–9 are z=0, 19–26 are z=2
    expect(homeColor(1, 3, 'depth')).toBe(homeColor(9, 3, 'depth'))
    expect(homeColor(1, 3, 'depth')).not.toBe(homeColor(19, 3, 'depth'))
  })

  it('tints height by home Y', () => {
    expect(homeColor(1, 3, 'height')).toBe(homeColor(2, 3, 'height'))
    expect(homeColor(1, 3, 'height')).not.toBe(homeColor(7, 3, 'height'))
  })

  it('encodes all three axes in the gradient', () => {
    expect(homeColor(1, 3, 'gradient')).not.toBe(homeColor(3, 3, 'gradient'))
    expect(homeColor(1, 3, 'gradient')).not.toBe(homeColor(7, 3, 'gradient'))
    expect(homeColor(1, 3, 'gradient')).not.toBe(homeColor(19, 3, 'gradient'))
  })
})
