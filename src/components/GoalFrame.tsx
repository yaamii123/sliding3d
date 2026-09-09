import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { PuzzleSize } from '../types/puzzle.ts'
import { puzzleExtent, worldPosition } from '../utils/coordinates.ts'

interface GoalFrameProps {
  size: PuzzleSize
}

export function GoalFrame({ size }: GoalFrameProps) {
  const extent = puzzleExtent(size)
  const home1 = worldPosition({ x: 0, y: 0, z: 0 }, size)
  const homeEmpty = worldPosition({ x: size - 1, y: size - 1, z: size - 1 }, size)
  const box = useMemo(() => new THREE.BoxGeometry(extent + 0.08, extent + 0.08, extent + 0.08), [extent])
  const edges = useMemo(() => new THREE.EdgesGeometry(box), [box])
  const slot = useMemo(() => new THREE.BoxGeometry(0.98, 0.98, 0.98), [])
  const slotEdges = useMemo(() => new THREE.EdgesGeometry(slot), [slot])
  const axis = 0.72

  return (
    <group>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#6f7c90" transparent opacity={0.28} />
      </lineSegments>

      <group position={homeEmpty}>
        <lineSegments geometry={slotEdges}>
          <lineBasicMaterial color="#e4c07a" />
        </lineSegments>
        <Html sprite center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <span className="corner-tag empty">gap</span>
        </Html>
      </group>

      <group position={home1}>
        <Html sprite center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <span className="corner-tag start">1</span>
        </Html>
      </group>

      <group position={home1}>
        <Arrow color="#e8a07a" direction={[1, 0, 0]} length={axis} />
        <Arrow color="#9ed4a8" direction={[0, 1, 0]} length={axis} />
        <Arrow color="#8ecae6" direction={[0, 0, 1]} length={axis} />
      </group>
    </group>
  )
}

function Arrow({
  color,
  direction,
  length,
}: {
  color: string
  direction: [number, number, number]
  length: number
}) {
  const quat = useMemo(() => {
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...direction))
    return quaternion
  }, [direction[0], direction[1], direction[2]])

  return (
    <group quaternion={quat}>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[0.018, 0.018, length, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, length, 0]}>
        <coneGeometry args={[0.045, 0.12, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}
