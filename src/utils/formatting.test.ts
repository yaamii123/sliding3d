import { describe, expect, it } from 'vitest'
import { formatSize, formatTime, capitalize } from '../utils/formatting.ts'
import { indexToCoord, coordToIndex, isFaceAdjacent, sharedAxis, worldPosition } from '../utils/coordinates.ts'
import { createRng, pick } from '../utils/random.ts'

describe('formatting', () => {
  it('formats elapsed time as mm:ss and optional hundredths', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(1_240_000)).toBe('20:40')
    expect(formatTime(1_245_670, true)).toBe('20:45.67')
  })

  it('formats cube size and labels', () => {
    expect(formatSize(3)).toBe('3 × 3 × 3')
    expect(capitalize('medium')).toBe('Medium')
  })
})

describe('coordinates', () => {
  it('round-trips indices for a 4×4×4 cube', () => {
    for (let i = 0; i < 64; i++) {
      const coord = indexToCoord(i, 4)
      expect(coordToIndex(coord.x, coord.y, coord.z, 4)).toBe(i)
    }
  })

  it('round-trips indices for a 5×5×5 cube', () => {
    for (let i = 0; i < 125; i++) {
      const coord = indexToCoord(i, 5)
      expect(coordToIndex(coord.x, coord.y, coord.z, 5)).toBe(i)
    }
  })

  it('treats only single-axis steps as face-adjacent', () => {
    expect(isFaceAdjacent({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).toBe(true)
    expect(isFaceAdjacent({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBe(true)
    expect(isFaceAdjacent({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 })).toBe(true)
    expect(isFaceAdjacent({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 0 })).toBe(false)
    expect(isFaceAdjacent({ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 })).toBe(false)
  })

  it('detects cubes that share exactly one axis line', () => {
    expect(sharedAxis({ x: 0, y: 2, z: 2 }, { x: 2, y: 2, z: 2 })).toBe('x')
    expect(sharedAxis({ x: 2, y: 0, z: 2 }, { x: 2, y: 2, z: 2 })).toBe('y')
    expect(sharedAxis({ x: 2, y: 2, z: 0 }, { x: 2, y: 2, z: 2 })).toBe('z')
    expect(sharedAxis({ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 })).toBeNull()
    expect(sharedAxis({ x: 1, y: 1, z: 0 }, { x: 1, y: 2, z: 1 })).toBeNull()
  })

  it('centers the puzzle on the origin', () => {
    const pos = worldPosition({ x: 1, y: 1, z: 1 }, 3)
    expect(pos[0]).toBeCloseTo(0)
    expect(pos[1]).toBeCloseTo(0)
    expect(pos[2]).toBeCloseTo(0)
  })
})

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(123)
    const b = createRng(123)
    expect(pick([1, 2, 3, 4], a)).toBe(pick([1, 2, 3, 4], b))
    expect(a.next()).toBe(b.next())
  })
})
