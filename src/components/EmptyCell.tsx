import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MOVE_DURATION_S } from '../game/constants.ts'
import type { PuzzleSize, PuzzleState } from '../types/puzzle.ts'
import { indexToCoord, worldPosition } from '../utils/coordinates.ts'

function skipRaycast() {}

interface EmptyCellProps {
  state: PuzzleState
  snapToken: number
  gap: number
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function EmptyCell({ state, snapToken, gap }: EmptyCellProps) {
  const size = state.size as PuzzleSize
  const start = worldPosition(indexToCoord(state.emptyIndex, size), size, undefined, gap)
  const group = useRef<THREE.Group>(null)
  const from = useRef(new THREE.Vector3(...start))
  const to = useRef(new THREE.Vector3(...start))
  const progress = useRef(1)
  const lastSnap = useRef(snapToken)
  const box = useMemo(() => new THREE.BoxGeometry(0.9, 0.9, 0.9), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(box), [box])

  useLayoutEffect(() => {
    const next = new THREE.Vector3(...worldPosition(indexToCoord(state.emptyIndex, size), size, undefined, gap))
    const node = group.current
    if (!node) return
    if (snapToken !== lastSnap.current) {
      lastSnap.current = snapToken
      node.position.copy(next)
      from.current.copy(next)
      to.current.copy(next)
      progress.current = 1
      return
    }
    from.current.copy(node.position)
    to.current.copy(next)
    progress.current = 0
  }, [size, snapToken, state.emptyIndex, gap])

  useFrame((_, delta) => {
    const node = group.current
    if (!node) return
    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta / MOVE_DURATION_S)
      node.position.lerpVectors(from.current, to.current, easeOutCubic(progress.current))
    }
  })

  return (
    <group ref={group} position={start}>
      <mesh geometry={box} renderOrder={2} raycast={skipRaycast}>
        <meshBasicMaterial color="#d7e6ff" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={3} raycast={skipRaycast}>
        <lineBasicMaterial color="#f0d7a2" transparent opacity={0.85} />
      </lineSegments>
    </group>
  )
}
