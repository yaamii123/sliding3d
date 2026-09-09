import { useEffect, useId, useState } from 'react'
import { loadPrefs, savePrefs } from '../utils/storage.ts'

export function HelpPanel() {
  const [open, setOpen] = useState(() => loadPrefs().helpOpen)
  const headingId = useId()

  useEffect(() => {
    const prefs = loadPrefs()
    savePrefs({ ...prefs, helpOpen: open })
  }, [open])

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
      {open && (
        <div id="help-body" className="help-body">
          <p>Slide cubes into the empty space.</p>
          <p>Any cube on the same row, column, or depth as the empty space can move. Cubes between it and the gap slide together.</p>
          <p>The solved cube reads left to right, bottom to top, back to front. 1 belongs in the tagged corner; the gap belongs in the opposite gold frame. Cubes glow when they sit in their home cell.</p>
          <p>Rotate the view to explore all three dimensions.</p>
          <ul>
            <li>Drag to orbit · scroll or pinch to zoom</li>
            <li>Click or tap a cube on the empty cell’s axis</li>
            <li>
              <kbd>N</kbd> new · <kbd>R</kbd> reset · <kbd>U</kbd> undo · <kbd>C</kbd> camera
            </li>
            <li>
              <kbd>Space</kbd> scramble · <kbd>H</kbd> hint · <kbd>S</kbd> solve
            </li>
          </ul>
        </div>
      )}
    </section>
  )
}
