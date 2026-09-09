import type { PuzzleSize } from '../types/puzzle.ts'
import { coordToIndex } from '../utils/coordinates.ts'
import { homeColor } from '../utils/pieceTexture.ts'

interface GoalLegendProps {
  size: PuzzleSize
}

export function GoalLegend({ size }: GoalLegendProps) {
  const layers = Array.from({ length: size }, (_, z) => {
    const cells: Array<number | null> = []
    for (let y = size - 1; y >= 0; y--) {
      for (let x = 0; x < size; x++) {
        const index = coordToIndex(x, y, z, size)
        cells.push(index === size ** 3 - 1 ? null : index + 1)
      }
    }
    const label = z === 0 ? 'Back' : z === size - 1 ? 'Front' : `Layer ${z + 1}`
    return { z, cells, label }
  })

  return (
    <section className="goal-legend" aria-label="Solved layout">
      <h2>Goal</h2>
      <p>
        Numbers run <strong>right</strong>, then <strong>up</strong>, then <strong>toward you</strong>.
        Cube <strong>1</strong> belongs in the marked corner; the gap belongs in the gold frame.
      </p>
      <div className="goal-layers">
        {layers.map((layer) => (
          <div key={layer.z} className="goal-layer">
            <p>{layer.label}</p>
            <div
              className={size >= 5 ? 'goal-grid dense' : 'goal-grid'}
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {layer.cells.map((cell, index) => (
                <span
                  key={`${layer.z}-${index}`}
                  className={cell === null ? 'gap' : undefined}
                  style={cell === null ? undefined : { background: homeColor(cell, size) }}
                >
                  {cell === null ? '□' : cell}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
