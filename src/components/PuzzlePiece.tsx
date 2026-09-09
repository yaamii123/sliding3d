import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { MOVE_DURATION_S } from '../game/constants.ts'
import type { Coord, PuzzleSize } from '../types/puzzle.ts'
import { worldPosition } from '../utils/coordinates.ts'
import { getNumberTexture, homeColor } from '../utils/pieceTexture.ts'

interface PuzzlePieceProps {
  piece: number
  coord: Coord
  size: PuzzleSize
  movable: boolean
  hinted: boolean
  inHome: boolean
  solved: boolean
  snapToken: number
  onMove: (piece: number) => void
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

const FACE_DECALS: Array<{ position: [number, number, number]; rotation: [number, number, number] }> = [
  { position: [0, 0, 0.465], rotation: [0, 0, 0] },
  { position: [0, 0, -0.465], rotation: [0, Math.PI, 0] },
  { position: [0, 0.465, 0], rotation: [-Math.PI / 2, 0, 0] },
  { position: [0, -0.465, 0], rotation: [Math.PI / 2, 0, 0] },
  { position: [0.465, 0, 0], rotation: [0, Math.PI / 2, 0] },
  { position: [-0.465, 0, 0], rotation: [0, -Math.PI / 2, 0] },
]

function skipRaycast() {}

export function PuzzlePiece({
  piece,
  coord,
  size,
  movable,
  hinted,
  inHome,
  solved,
  snapToken,
  onMove,
}: PuzzlePieceProps) {
  const start = worldPosition(coord, size)
  const group = useRef<THREE.Group>(null)
  const from = useRef(new THREE.Vector3(...start))
  const to = useRef(new THREE.Vector3(...start))
  const progress = useRef(1)
  const lastSnap = useRef(snapToken)
  const [hovered, setHovered] = useState(false)
  const texture = useMemo(() => getNumberTexture(piece), [piece])
  const accent = homeColor(piece, size)
  const cubeSize = 0.92
  const dense = size >= 4
  const radius = dense ? 0.08 : 0.1

  useLayoutEffect(() => {
    const next = new THREE.Vector3(...worldPosition(coord, size))
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
    if (node.position.distanceToSquared(next) < 1e-8) {
      to.current.copy(next)
      return
    }
    from.current.copy(node.position)
    to.current.copy(next)
    progress.current = 0
  }, [coord.x, coord.y, coord.z, size, snapToken])

  useFrame((state, delta) => {
    const node = group.current
    if (!node) return
    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta / MOVE_DURATION_S)
      node.position.lerpVectors(from.current, to.current, easeOutCubic(progress.current))
    } else if (solved) {
      node.position.y = to.current.y + Math.sin(state.clock.elapsedTime * 3.4 + piece * 0.45) * 0.05
    }

    const hoverScale = hovered && movable ? 1.045 : 1
    const pulse = hinted ? 1 + Math.sin(state.clock.elapsedTime * 8) * 0.03 : 1
    const target = hoverScale * pulse
    const current = node.scale.x
    node.scale.setScalar(current + (target - current) * Math.min(1, delta * 14))
  })

  return (
    <group ref={group} position={start}>
      <RoundedBox
        args={[cubeSize, cubeSize, cubeSize]}
        radius={radius}
        smoothness={dense ? 2 : 3}
        bevelSegments={dense ? 1 : 2}
        onClick={(event) => {
          event.stopPropagation()
          if (movable) onMove(piece)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          if (!movable) return
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <meshPhysicalMaterial
          color={accent}
          roughness={inHome ? 0.22 : 0.38}
          metalness={inHome ? 0.16 : 0.08}
          clearcoat={0.55}
          clearcoatRoughness={inHome ? 0.18 : 0.28}
          emissive={hinted ? accent : inHome ? '#d7b25c' : hovered && movable ? accent : '#000000'}
          emissiveIntensity={hinted ? 0.42 : inHome ? 0.2 : hovered && movable ? 0.18 : 0}
        />
      </RoundedBox>
      {FACE_DECALS.map((face) => (
        <mesh
          key={face.position.join(',')}
          position={face.position}
          rotation={face.rotation}
          raycast={skipRaycast}
        >
          <planeGeometry args={[0.72, 0.72]} />
          <meshBasicMaterial map={texture} transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
