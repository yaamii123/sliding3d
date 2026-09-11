import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { MOVE_DURATION_S } from '../game/constants.ts'
import type { Coord, PuzzleSize } from '../types/puzzle.ts'
import { worldPosition } from '../utils/coordinates.ts'
import type { ColorMode } from '../utils/pieceColor.ts'
import { getNumberTexture, homeColor } from '../utils/pieceTexture.ts'

interface PuzzlePieceProps {
  piece: number
  coord: Coord
  size: PuzzleSize
  movable: boolean
  live: boolean
  hinted: boolean
  inHome: boolean
  solved: boolean
  snapToken: number
  gap: number
  colorMode: ColorMode
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

const LIVE_EDGES = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.94, 0.94, 0.94))

function dimHex(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16)
  if (Number.isNaN(value)) return hex
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * amount)
  return `#${[channel(16), channel(8), channel(0)].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

export function PuzzlePiece({
  piece,
  coord,
  size,
  movable,
  live,
  hinted,
  inHome,
  solved,
  snapToken,
  gap,
  colorMode,
  onMove,
}: PuzzlePieceProps) {
  const start = worldPosition(coord, size, undefined, gap)
  const group = useRef<THREE.Group>(null)
  const from = useRef(new THREE.Vector3(...start))
  const to = useRef(new THREE.Vector3(...start))
  const progress = useRef(1)
  const lastSnap = useRef(snapToken)
  const [hovered, setHovered] = useState(false)
  const texture = useMemo(() => getNumberTexture(piece), [piece])
  const accent = homeColor(piece, size, colorMode)
  const cubeSize = 0.92
  const dense = size >= 4
  const radius = dense ? 0.08 : 0.1
  const ghost = !live && !solved
  const bodyColor = ghost ? dimHex(accent, 0.78) : accent

  useEffect(() => {
    if (movable) return
    setHovered(false)
    document.body.style.cursor = 'auto'
  }, [movable])

  useLayoutEffect(() => {
    const next = new THREE.Vector3(...worldPosition(coord, size, undefined, gap))
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
  }, [coord.x, coord.y, coord.z, size, snapToken, gap])

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
          color={bodyColor}
          roughness={ghost ? 0.52 : inHome ? 0.22 : 0.38}
          metalness={ghost ? 0.04 : inHome ? 0.16 : 0.08}
          clearcoat={ghost ? 0.2 : 0.55}
          clearcoatRoughness={ghost ? 0.45 : inHome ? 0.18 : 0.28}
          emissive={hinted ? accent : inHome ? '#d7b25c' : live ? '#c9a56a' : '#000000'}
          emissiveIntensity={hinted ? 0.42 : inHome ? 0.2 : hovered && movable ? 0.28 : live ? 0.12 : 0}
        />
      </RoundedBox>
      {live && !solved && (
        <lineSegments geometry={LIVE_EDGES} raycast={skipRaycast}>
          <lineBasicMaterial color={hovered ? '#f3e0b0' : '#e4c07a'} />
        </lineSegments>
      )}
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
