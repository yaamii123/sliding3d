import { coordToIndex } from './coordinates.ts'

export interface LayerSlice {
  z: number
  label: string
  cells: number[]
}

export function layerLabel(z: number, size: number): string {
  if (z === 0) return 'Back'
  if (z === size - 1) return 'Front'
  return `Layer ${z + 1}`
}

/** Each slice is a top-to-bottom, left-to-right grid. 0 is the empty cell. */
export function tilesAsLayers(tiles: number[], size: number): LayerSlice[] {
  return Array.from({ length: size }, (_, z) => {
    const cells: number[] = []
    for (let y = size - 1; y >= 0; y--) {
      for (let x = 0; x < size; x++) {
        cells.push(tiles[coordToIndex(x, y, z, size)] ?? 0)
      }
    }
    return { z, label: layerLabel(z, size), cells }
  })
}

export function solvedTiles(size: number): number[] {
  const n = size ** 3
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? 0 : i + 1))
}
