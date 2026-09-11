import { puzzleExtent } from '../utils/coordinates.ts'

interface SceneLightsProps {
  size: number
  gap: number
}

export function SceneLights({ size, gap }: SceneLightsProps) {
  const extent = puzzleExtent(size, undefined, gap)
  const floorY = -extent / 2 - 0.62

  return (
    <>
      <hemisphereLight args={['#f3efe6', '#1a1714', 0.62]} />
      <directionalLight position={[6.5, 10, 7]} intensity={1.55} color="#fff6e8" />
      <directionalLight position={[-7, 3.5, -6]} intensity={0.38} color="#9bb7e8" />
      <pointLight position={[0, extent, 0]} intensity={0.35} distance={Math.max(18, extent * 4)} color="#ffe6c2" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]}>
        <circleGeometry args={[extent * 1.55, 48]} />
        <meshStandardMaterial color="#12141a" roughness={1} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY + 0.015, 0]}>
        <circleGeometry args={[extent * 0.72, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} depthWrite={false} />
      </mesh>
    </>
  )
}
