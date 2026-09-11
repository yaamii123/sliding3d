import { useId, useMemo, useState } from 'react'
import type { PuzzleSize, PuzzleState } from '../types/puzzle.ts'
import { solvedTiles, tilesAsLayers } from '../utils/layers.ts'
import type { ColorMode } from '../utils/pieceColor.ts'
import { COLOR_MODES, homeColor } from '../utils/pieceColor.ts'

type MapTab = 'board' | 'goal'

interface LayerMapsProps {
  state: PuzzleState
  colorMode: ColorMode
  movable: number[]
  hintPiece: number | null
  onMove: (piece: number) => void
}

export function LayerMaps({ state, colorMode, movable, hintPiece, onMove }: LayerMapsProps) {
  const [tab, setTab] = useState<MapTab>('board')
  const headingId = useId()
  const tabBoard = useId()
  const tabGoal = useId()
  const size = state.size as PuzzleSize
  const live = useMemo(() => new Set(movable), [movable])
  const layers = useMemo(
    () => tilesAsLayers(tab === 'board' ? state.tiles : solvedTiles(size), size),
    [tab, state.tiles, size],
  )
  const interactive = tab === 'board'
  const hint = COLOR_MODES.find((mode) => mode.id === colorMode)?.hint

  return (
    <section className="layer-maps" aria-labelledby={headingId}>
      <div className="layer-maps-head">
        <h2 id={headingId}>Layers</h2>
        <div className="layer-tabs" role="tablist" aria-label="Layer map">
          <button
            type="button"
            id={tabBoard}
            role="tab"
            aria-selected={tab === 'board'}
            className={tab === 'board' ? 'chip active' : 'chip'}
            onClick={() => setTab('board')}
          >
            Board
          </button>
          <button
            type="button"
            id={tabGoal}
            role="tab"
            aria-selected={tab === 'goal'}
            className={tab === 'goal' ? 'chip active' : 'chip'}
            onClick={() => setTab('goal')}
          >
            Goal
          </button>
        </div>
      </div>
      <p>
        {tab === 'board'
          ? 'Current slices, back to front. Gold outline can slide; tap a cell to move it.'
          : 'Solved slices, back to front. Numbers run right, then down, then toward you.'}{' '}
        {hint}.
      </p>
      <div className="goal-layers" role="tabpanel" aria-labelledby={tab === 'board' ? tabBoard : tabGoal}>
        {layers.map((layer) => (
          <div key={layer.z} className="goal-layer">
            <p>{layer.label}</p>
            <div
              className={size >= 5 ? 'goal-grid dense' : 'goal-grid'}
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {layer.cells.map((piece, index) => {
                const homeIndex = piece - 1
                const atHome = piece > 0 && state.tiles[homeIndex] === piece && tab === 'board'
                const canMove = interactive && live.has(piece)
                const className = [
                  piece === 0 ? 'gap' : undefined,
                  canMove ? 'live' : undefined,
                  atHome ? 'home' : undefined,
                  hintPiece === piece ? 'hinted' : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')

                if (piece === 0) {
                  return (
                    <span key={`${layer.z}-${index}`} className={className || undefined}>
                      □
                    </span>
                  )
                }

                if (!interactive || !canMove) {
                  return (
                    <span
                      key={`${layer.z}-${index}`}
                      className={className || undefined}
                      style={{ background: homeColor(piece, size, colorMode) }}
                    >
                      {piece}
                    </span>
                  )
                }

                return (
                  <button
                    key={`${layer.z}-${index}`}
                    type="button"
                    className={className}
                    style={{ background: homeColor(piece, size, colorMode) }}
                    aria-label={`Slide cube ${piece}`}
                    onClick={() => onMove(piece)}
                  >
                    {piece}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
