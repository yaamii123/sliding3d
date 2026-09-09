import { useEffect, useRef, type MutableRefObject } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { cameraLimits, defaultCameraPosition } from '../utils/coordinates.ts'

interface CameraRigProps {
  size: number
  resetRef: MutableRefObject<(() => void) | null>
}

export function CameraRig({ size, resetRef }: CameraRigProps) {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((state) => state.camera)
  const limits = cameraLimits(size)

  useEffect(() => {
    const reset = () => {
      const [x, y, z] = defaultCameraPosition(size)
      camera.position.set(x, y, z)
      controls.current?.target.set(0, 0.05, 0)
      controls.current?.update()
    }
    resetRef.current = reset
    reset()
    return () => {
      if (resetRef.current === reset) resetRef.current = null
    }
  }, [camera, resetRef, size])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.target instanceof HTMLElement) || event.target.closest('button, input, select, textarea')) {
        if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLSelectElement) return
      }
      const orbit = controls.current
      if (!orbit) return
      const step = 0.09
      let handled = false
      if (event.key === 'ArrowLeft') {
        orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + step)
        handled = true
      } else if (event.key === 'ArrowRight') {
        orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() - step)
        handled = true
      } else if (event.key === 'ArrowUp') {
        orbit.setPolarAngle(Math.max(0.18, orbit.getPolarAngle() - step))
        handled = true
      } else if (event.key === 'ArrowDown') {
        orbit.setPolarAngle(Math.min(Math.PI - 0.18, orbit.getPolarAngle() + step))
        handled = true
      }
      if (handled) {
        event.preventDefault()
        orbit.update()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
      minPolarAngle={0.16}
      maxPolarAngle={Math.PI - 0.18}
      target={[0, 0.05, 0]}
      enablePan
    />
  )
}
