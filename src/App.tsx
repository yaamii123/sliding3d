import { useCallback, useEffect, useRef, useState } from 'react'
import { CompletionModal } from './components/CompletionModal.tsx'
import { GameUI } from './components/GameUI.tsx'
import { PuzzleScene } from './components/PuzzleScene.tsx'
import { useBestTimes } from './hooks/useBestTimes.ts'
import { useGameControls } from './hooks/useGameControls.ts'
import { usePuzzle } from './hooks/usePuzzle.ts'
import { DEFAULT_COLOR_MODE, type ColorMode } from './utils/pieceColor.ts'
import { loadPrefs, savePrefs } from './utils/storage.ts'

export default function App() {
  const puzzle = usePuzzle()
  const { combinations, lookup } = useBestTimes(puzzle.status === 'solved' ? puzzle.gameId + 1 : puzzle.gameId)
  const cameraResetRef = useRef<(() => void) | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const [spread, setSpread] = useState(() => puzzle.size >= 4)
  const [spreadSize, setSpreadSize] = useState(puzzle.size)
  if (puzzle.size !== spreadSize) {
    setSpreadSize(puzzle.size)
    setSpread(puzzle.size >= 4)
  }

  const [colorMode, setColorMode] = useState<ColorMode>(
    () => loadPrefs().colorMode ?? DEFAULT_COLOR_MODE,
  )

  const resetCamera = useCallback(() => {
    cameraResetRef.current?.()
  }, [])

  const toggleSpread = useCallback(() => {
    setSpread((value) => !value)
  }, [])

  const changeColorMode = useCallback((mode: ColorMode) => {
    setColorMode(mode)
    savePrefs({ ...loadPrefs(), colorMode: mode })
  }, [])

  useGameControls({
    reset: puzzle.reset,
    newGame: puzzle.newGame,
    undo: puzzle.undo,
    scramble: puzzle.scramble,
    resetCamera,
    hint: puzzle.hint,
    solve: puzzle.solve,
    toggleSpread,
  })

  useEffect(() => {
    setShowComplete(puzzle.status === 'solved')
  }, [puzzle.status, puzzle.gameId])

  useEffect(() => () => {
    document.body.style.cursor = 'auto'
  }, [])

  return (
    <div className="app">
      <div className="stage" aria-hidden="false">
        <PuzzleScene
          state={puzzle.state}
          movable={puzzle.movable}
          hintPiece={puzzle.hintPiece}
          solved={puzzle.status === 'solved'}
          snapToken={puzzle.snapToken}
          gameId={puzzle.gameId}
          spread={spread}
          colorMode={colorMode}
          onMove={puzzle.tryMove}
          cameraResetRef={cameraResetRef}
        />
      </div>
      <GameUI
        puzzle={puzzle}
        records={combinations}
        currentBest={lookup(puzzle.size)}
        onResetCamera={resetCamera}
        spread={spread}
        onSpread={toggleSpread}
        colorMode={colorMode}
        onColorMode={changeColorMode}
      />
      {showComplete && puzzle.solvedMoves !== null && puzzle.solvedTimeMs !== null && (
        <CompletionModal
          size={puzzle.size}
          moves={puzzle.solvedMoves}
          timeMs={puzzle.solvedTimeMs}
          usedSolver={puzzle.usedSolver}
          onNewGame={puzzle.newGame}
          onClose={() => setShowComplete(false)}
        />
      )}
    </div>
  )
}
