import type { MutableRefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { PuzzleState } from '../types/puzzle.ts'
import type { ColorMode } from '../utils/pieceColor.ts'
import { cellGap, defaultCameraPosition } from '../utils/coordinates.ts'
import { CameraRig } from './CameraRig.tsx'
import { PuzzleBoard } from './PuzzleBoard.tsx'
import { SceneLights } from './SceneLights.tsx'

interface PuzzleSceneProps {
  state: PuzzleState
  movable: number[]
  hintPiece: number | null
  solved: boolean
  snapToken: number
  gameId: number
  spread: boolean
  colorMode: ColorMode
  onMove: (piece: number) => void
  cameraResetRef: MutableRefObject<(() => void) | null>
}

export function PuzzleScene({
  state,
  movable,
  hintPiece,
  solved,
  snapToken,
  gameId,
  spread,
  colorMode,
  onMove,
  cameraResetRef,
}: PuzzleSceneProps) {
  const gap = cellGap(spread)
  const [cx, cy, cz] = defaultCameraPosition(state.size, gap)
  const cameraDist = Math.hypot(cx, cy, cz)

  return (
    <Canvas
      className="puzzle-canvas"
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.12,
      }}
      camera={{ fov: 42, position: [cx, cy, cz], near: 0.1, far: Math.max(90, cameraDist * 8) }}
    >
      <color attach="background" args={['#0b0d12']} />
      <fog attach="fog" args={['#0b0d12', cameraDist * 0.72, cameraDist * 2.35]} />
      <SceneLights size={state.size} gap={gap} />
      <PuzzleBoard
        key={gameId}
        state={state}
        movable={movable}
        hintPiece={hintPiece}
        solved={solved}
        snapToken={snapToken}
        gap={gap}
        colorMode={colorMode}
        onMove={onMove}
      />
      <CameraRig size={state.size} gap={gap} resetRef={cameraResetRef} />
    </Canvas>
  )
}
