import { describe, expect, it } from 'vitest'
import { createSolvedState } from '../game/puzzleState.ts'
import { layerLabel, solvedTiles, tilesAsLayers } from './layers.ts'

describe('layer maps', () => {
  it('reads a solved 3×3×3 back-to-front, top-to-bottom', () => {
    const layers = tilesAsLayers(createSolvedState(3).tiles, 3)
    expect(layers.map((layer) => layer.label)).toEqual(['Back', 'Layer 2', 'Front'])
    expect(layers[0]!.cells).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(layers[2]!.cells).toEqual([19, 20, 21, 22, 23, 24, 25, 26, 0])
  })

  it('matches solvedTiles to a fresh solved board', () => {
    expect(solvedTiles(4)).toEqual(createSolvedState(4).tiles)
  })

  it('names the first and last slices', () => {
    expect(layerLabel(0, 5)).toBe('Back')
    expect(layerLabel(4, 5)).toBe('Front')
    expect(layerLabel(2, 5)).toBe('Layer 3')
  })
})
