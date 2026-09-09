import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MOVE_DURATION_S } from '../game/constants.ts'
import type { PuzzleSize, PuzzleState } from '../types/puzzle.ts'
import { indexToCoord, worldPosition } from '../utils/coordinates.ts'

interface EmptyCellProps {
  state: PuzzleState
  snapToken: number
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function EmptyCell({ state, snapToken }: EmptyCellProps) {
  const size = state.size as PuzzleSize
  const start = worldPosition(indexToCoord(state.emptyIndex, size), size)
  const group = useRef<THREE.Group>(null)
  const from = useRef(new THREE.Vector3(...start))
  const to = useRef(new THREE.Vector3(...start))
  const progress = useRef(1)
  const lastSnap = useRef(snapToken)
  const box = useMemo(() => new THREE.BoxGeometry(0.9, 0.9, 0.9), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(box), [box])

  useLayoutEffect(() => {
    const next = new THREE.Vector3(...worldPosition(indexToCoord(state.emptyIndex, size), size))
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
  }, [size, snapToken, state.emptyIndex])

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
      <mesh geometry={box}>
        <meshBasicMaterial color="#8ea3c4" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#9cb3d1" transparent opacity={0.4} />
      </lineSegments>
    </group>
  )
}
