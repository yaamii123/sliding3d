import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GameStatus, PuzzleSize, PuzzleState } from '../types/puzzle.ts'
import { HINT_MS, MOVE_DURATION_MS, SOLVE_STEP_GAP_MS } from '../game/constants.ts'
import { canUndo as historyCanUndo, createHistory, popHistory, pushHistory, type HistoryEntry } from '../game/gameHistory.ts'
import { movablePieces, tryMovePiece } from '../game/puzzleMoves.ts'
import { cloneState, isSolved } from '../game/puzzleState.ts'
import { reverseScramblePieces, scramblePuzzle, type ScrambleStep } from '../game/scramble.ts'
import { greedyHintPiece, hintPiece as computeHint, solvePuzzleAsync, solverSupported } from '../game/solver.ts'
import { loadPrefs, recordBest, savePrefs } from '../utils/storage.ts'

export interface PuzzleController {
  state: PuzzleState
  size: PuzzleSize
  status: GameStatus
  moveCount: number
  scrambleLength: number
  isAnimating: boolean
  isSolving: boolean
  solverMessage: string | null
  hintPiece: number | null
  gameId: number
  snapToken: number
  usedSolver: boolean
  canUndo: boolean
  solverSupported: boolean
  movable: number[]
  startedAt: number | null
  stoppedAt: number | null
  solvedMoves: number | null
  solvedTimeMs: number | null
  newGame: () => void
  scramble: () => void
  reset: () => void
  undo: () => void
  tryMove: (piece: number) => boolean
  setSize: (size: PuzzleSize) => void
  hint: () => void
  solve: () => void
  dismissMessage: () => void
}

interface Session {
  state: PuzzleState
  startState: PuzzleState
  scrambleMoves: ScrambleStep[]
  scrambleLength: number
  history: HistoryEntry[]
  moveCount: number
  status: GameStatus
  usedSolver: boolean
  gameId: number
}

function persist(size: PuzzleSize): void {
  const prefs = loadPrefs()
  savePrefs({ ...prefs, size })
}

function createSession(size: PuzzleSize, gameId: number): Session {
  const scrambled = scramblePuzzle(size)
  return {
    state: scrambled.state,
    startState: cloneState(scrambled.state),
    scrambleMoves: scrambled.moves,
    scrambleLength: scrambled.steps,
    history: createHistory(),
    moveCount: 0,
    status: 'ready',
    usedSolver: false,
    gameId,
  }
}

export function usePuzzle(): PuzzleController {
  const initial = useMemo(() => {
    const prefs = loadPrefs()
    return { prefs, session: createSession(prefs.size, 1) }
  }, [])

  const [size, setSizeState] = useState<PuzzleSize>(initial.prefs.size)
  const [session, setSession] = useState<Session>(initial.session)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isSolving, setIsSolving] = useState(false)
  const [solverMessage, setSolverMessage] = useState<string | null>(null)
  const [hintId, setHintId] = useState<number | null>(null)
  const [snapToken, setSnapToken] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [stoppedAt, setStoppedAt] = useState<number | null>(null)
  const [solvedMoves, setSolvedMoves] = useState<number | null>(null)
  const [solvedTimeMs, setSolvedTimeMs] = useState<number | null>(null)

  const sessionRef = useRef(session)
  sessionRef.current = session
  const sizeRef = useRef(size)
  sizeRef.current = size
  const startedAtRef = useRef<number | null>(null)
  const animatingRef = useRef(false)
  const solvingRef = useRef(false)
  const solveGen = useRef(0)
  const queueRef = useRef<number[]>([])
  const animTimer = useRef<number | null>(null)
  const hintTimer = useRef<number | null>(null)
  const queueTimer = useRef<number | null>(null)
  const applyMoveRef = useRef<(piece: number, options?: { fromSolver?: boolean }) => boolean>(() => false)

  const clearAnimTimers = useCallback(() => {
    if (animTimer.current !== null) {
      window.clearTimeout(animTimer.current)
      animTimer.current = null
    }
    if (queueTimer.current !== null) {
      window.clearTimeout(queueTimer.current)
      queueTimer.current = null
    }
  }, [])

  const cancelSolve = useCallback(() => {
    solveGen.current += 1
    queueRef.current = []
    solvingRef.current = false
    setIsSolving(false)
  }, [])

  const finishAnimation = useCallback(() => {
    animatingRef.current = false
    setIsAnimating(false)
    const nextPiece = queueRef.current.shift()
    if (nextPiece === undefined) {
      solvingRef.current = false
      setIsSolving(false)
      return
    }
    queueTimer.current = window.setTimeout(() => {
      applyMoveRef.current(nextPiece, { fromSolver: true })
    }, SOLVE_STEP_GAP_MS)
  }, [])

  const beginAnimation = useCallback(() => {
    animatingRef.current = true
    setIsAnimating(true)
    if (animTimer.current !== null) window.clearTimeout(animTimer.current)
    animTimer.current = window.setTimeout(finishAnimation, MOVE_DURATION_MS + 16)
  }, [finishAnimation])

  const applyPlayerMove = useCallback((piece: number, options?: { fromSolver?: boolean }): boolean => {
    const current = sessionRef.current
    if (current.status === 'solved') return false
    if (animatingRef.current && !options?.fromSolver) return false
    const next = tryMovePiece(current.state, piece)
    if (!next) return false

    const now = performance.now()
    if (startedAtRef.current === null) {
      startedAtRef.current = now
      setStartedAt(now)
    }

    const moveCount = current.moveCount + 1
    const solved = isSolved(next)
    const nextSession: Session = {
      ...current,
      state: next,
      history: pushHistory(current.history, current.state, piece),
      moveCount,
      status: solved ? 'solved' : 'playing',
      usedSolver: current.usedSolver || Boolean(options?.fromSolver),
    }
    sessionRef.current = nextSession
    setSession(nextSession)

    if (solved) {
      const elapsed = now - (startedAtRef.current ?? now)
      setStoppedAt(now)
      setSolvedMoves(moveCount)
      setSolvedTimeMs(elapsed)
      queueRef.current = []
      solvingRef.current = false
      setIsSolving(false)
      if (!nextSession.usedSolver) {
        recordBest({
          size: current.state.size,
          timeMs: elapsed,
          moves: moveCount,
          scrambleLength: current.scrambleLength,
        })
      }
    }

    beginAnimation()
    return true
  }, [beginAnimation])

  applyMoveRef.current = applyPlayerMove

  const newGame = useCallback((nextSize = sizeRef.current) => {
    cancelSolve()
    clearAnimTimers()
    animatingRef.current = false
    setIsAnimating(false)
    setHintId(null)
    setSolverMessage(null)
    startedAtRef.current = null
    setStartedAt(null)
    setStoppedAt(null)
    setSolvedMoves(null)
    setSolvedTimeMs(null)
    const next = createSession(nextSize, sessionRef.current.gameId + 1)
    sessionRef.current = next
    setSession(next)
    setSnapToken((token) => token + 1)
    persist(nextSize)
  }, [cancelSolve, clearAnimTimers])

  const scramble = useCallback(() => {
    newGame(sizeRef.current)
  }, [newGame])

  const reset = useCallback(() => {
    cancelSolve()
    clearAnimTimers()
    animatingRef.current = false
    setIsAnimating(false)
    const current = sessionRef.current
    const next: Session = {
      ...current,
      state: cloneState(current.startState),
      history: createHistory(),
      moveCount: 0,
      status: 'ready',
      usedSolver: false,
    }
    sessionRef.current = next
    setSession(next)
    startedAtRef.current = null
    setStartedAt(null)
    setStoppedAt(null)
    setSolvedMoves(null)
    setSolvedTimeMs(null)
    setHintId(null)
    setSnapToken((token) => token + 1)
  }, [cancelSolve, clearAnimTimers])

  const undo = useCallback(() => {
    if (animatingRef.current || solvingRef.current) return
    const current = sessionRef.current
    if (current.status === 'solved') return
    const popped = popHistory(current.history)
    if (!popped) return
    const moveCount = Math.max(0, current.moveCount - 1)
    const next: Session = {
      ...current,
      state: popped.entry.state,
      history: popped.history,
      moveCount,
      status: moveCount === 0 ? 'ready' : 'playing',
    }
    sessionRef.current = next
    setSession(next)
    if (moveCount === 0) {
      startedAtRef.current = null
      setStartedAt(null)
      setStoppedAt(null)
    }
    beginAnimation()
  }, [beginAnimation])

  const tryMove = useCallback((piece: number): boolean => {
    if (solvingRef.current) return false
    return applyPlayerMove(piece)
  }, [applyPlayerMove])

  const changeSize = useCallback((next: PuzzleSize) => {
    setSizeState(next)
    newGame(next)
  }, [newGame])

  const hint = useCallback(() => {
    const current = sessionRef.current
    if (current.status === 'solved' || animatingRef.current) return
    const piece = computeHint(current.state) ?? greedyHintPiece(current.state)
    if (piece === null) {
      setSolverMessage('No hint available.')
      return
    }
    setHintId(piece)
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => setHintId(null), HINT_MS)
  }, [])

  const solve = useCallback(() => {
    const current = sessionRef.current
    if (current.status === 'solved' || animatingRef.current || solvingRef.current) return

    if (current.moveCount === 0) {
      const pieces = reverseScramblePieces(current.scrambleMoves)
      if (pieces.length === 0) return
      solvingRef.current = true
      setIsSolving(true)
      const flagged = { ...current, usedSolver: true }
      sessionRef.current = flagged
      setSession(flagged)
      queueRef.current = pieces.slice(1)
      applyMoveRef.current(pieces[0]!, { fromSolver: true })
      return
    }

    if (!solverSupported(current.state.size)) {
      setSolverMessage(
        'Automatic solving is disabled for 4×4×4 and 5×5×5 after you have moved — a brute-force search would freeze the browser. Undo back to the scramble start to reverse it, or use Hint.',
      )
      return
    }

    const gen = ++solveGen.current
    solvingRef.current = true
    setIsSolving(true)
    setSolverMessage('Searching for a solution…')

    void solvePuzzleAsync(current.state, { cancelled: () => solveGen.current !== gen }).then((result) => {
      if (solveGen.current !== gen) return
      if (!result.ok) {
        solvingRef.current = false
        setIsSolving(false)
        setSolverMessage(result.reason)
        return
      }
      if (result.pieces.length === 0) {
        solvingRef.current = false
        setIsSolving(false)
        setSolverMessage(null)
        return
      }
      setSolverMessage(null)
      const latest = sessionRef.current
      const flagged = { ...latest, usedSolver: true }
      sessionRef.current = flagged
      setSession(flagged)
      queueRef.current = result.pieces.slice(1)
      applyMoveRef.current(result.pieces[0]!, { fromSolver: true })
    })
  }, [])

  const dismissMessage = useCallback(() => setSolverMessage(null), [])

  useEffect(() => () => {
    clearAnimTimers()
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current)
  }, [clearAnimTimers])

  const movable = useMemo(
    () => (session.status === 'solved' || isAnimating ? [] : movablePieces(session.state)),
    [isAnimating, session.state, session.status],
  )

  return {
    state: session.state,
    size,
    status: session.status,
    moveCount: session.moveCount,
    scrambleLength: session.scrambleLength,
    isAnimating,
    isSolving,
    solverMessage,
    hintPiece: hintId,
    gameId: session.gameId,
    snapToken,
    usedSolver: session.usedSolver,
    canUndo: session.status !== 'solved' && !isAnimating && !isSolving && historyCanUndo(session.history),
    solverSupported: solverSupported(size) || session.moveCount === 0,
    movable,
    startedAt,
    stoppedAt,
    solvedMoves,
    solvedTimeMs,
    newGame: scramble,
    scramble,
    reset,
    undo,
    tryMove,
    setSize: changeSize,
    hint,
    solve,
    dismissMessage,
  }
}
