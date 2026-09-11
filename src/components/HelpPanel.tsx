import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCompactHud } from '../hooks/useCompactHud.ts'
import { loadPrefs, savePrefs } from '../utils/storage.ts'

export function HelpPanel() {
  const compact = useCompactHud()
  const [open, setOpen] = useState(() => (compact ? false : loadPrefs().helpOpen))
  const headingId = useId()

  useEffect(() => {
    if (compact) setOpen(false)
  }, [compact])

  useEffect(() => {
    if (compact) return
    const prefs = loadPrefs()
    savePrefs({ ...prefs, helpOpen: open })
  }, [compact, open])

  const copy = (
    <>
      <p>Slide cubes into the empty space.</p>
      <p>Any cube on the same row, column, or depth as the empty space can move. Cubes between it and the gap slide together.</p>
      <p>The solved cube reads left to right, top to bottom, back to front. 1 belongs in the tagged corner; the gap belongs in the opposite gold frame. Cubes glow when they sit in their home cell.</p>
      <p>Rotate the view to explore all three dimensions. Cubes on the empty cell’s lines have a gold rim and can be clicked; other cubes stay visible but do not move. The layer maps show every slice from back to front — tap a gold-outlined cell to slide it. On 4×4×4 and 5×5×5, Spread pulls the 3D layers apart so inner cubes are reachable.</p>
      <p>Color chips change how home is shown: a 3D gradient, one tint per depth or floor, or a single stone color.</p>
      <ul>
        <li>Drag to orbit · pinch to zoom</li>
        <li>Tap a cube on the empty cell’s axis</li>
        <li>
          <kbd>N</kbd> new · <kbd>R</kbd> reset · <kbd>U</kbd> undo · <kbd>C</kbd> camera
        </li>
        <li>
          <kbd>Space</kbd> scramble · <kbd>X</kbd> spread · <kbd>H</kbd> hint · <kbd>S</kbd> solve
        </li>
      </ul>
    </>
  )

  const body = compact ? (
    <div id="help-body" className="sheet" role="dialog" aria-label="How to play">
      <div className="sheet-head">
        <h2>How to play</h2>
        <button type="button" className="sheet-close" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <div className="help-copy">{copy}</div>
    </div>
  ) : (
    <div id="help-body" className="help-body">
      {copy}
    </div>
  )

  return (
    <section className={`help-panel ${open ? 'open' : ''}`} aria-labelledby={headingId}>
      <button
        type="button"
        className="help-toggle"
        aria-expanded={open}
        aria-controls="help-body"
        onClick={() => setOpen((value) => !value)}
      >
        <span id={headingId}>How to play</span>
        <span aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      {open && compact
        ? createPortal(
            <>
              <button
                type="button"
                className="help-backdrop"
                aria-label="Close how to play"
                onClick={() => setOpen(false)}
              />
              {body}
            </>,
            document.body,
          )
        : open
          ? body
          : null}
    </section>
  )
}
