import { useEffect, useRef } from 'react'

interface GameControlHandlers {
  reset: () => void
  newGame: () => void
  undo: () => void
  scramble: () => void
  resetCamera: () => void
  hint: () => void
  solve: () => void
  toggleSpread: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

export function useGameControls(handlers: GameControlHandlers): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      const actions = handlersRef.current
      const key = event.key

      if (key === ' ' || key === 'Spacebar') {
        if (event.target instanceof HTMLButtonElement) return
        event.preventDefault()
        actions.scramble()
        return
      }

      switch (key) {
        case 'r':
        case 'R':
          actions.reset()
          break
        case 'n':
        case 'N':
          actions.newGame()
          break
        case 'u':
        case 'U':
          actions.undo()
          break
        case 'c':
        case 'C':
          actions.resetCamera()
          break
        case 'h':
        case 'H':
          actions.hint()
          break
        case 's':
        case 'S':
          actions.solve()
          break
        case 'x':
        case 'X':
          actions.toggleSpread()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
