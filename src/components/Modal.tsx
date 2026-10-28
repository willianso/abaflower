import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

const EXIT_MS = 220

/**
 * Bottom-sheet style dialog: closes on backdrop click or Escape and locks page scroll while open.
 * Children get a `close` that plays the exit animation before calling `onClose`.
 */
export function Modal(props: { label: string; onClose: () => void; children: (close: () => void) => ReactNode }) {
  const { label, onClose, children } = props
  const sheet = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)

  const close = useCallback(() => setClosing(true), [])

  useEffect(() => {
    if (!closing) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(onClose, reduced ? 0 : EXIT_MS)
    return () => clearTimeout(t)
  }, [closing, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    // Keep focus on a child that asked for it (e.g. a search box); otherwise focus the sheet itself.
    if (!sheet.current?.contains(document.activeElement)) sheet.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [close])

  return (
    <div className={`modal ${closing ? 'modal--closing' : ''}`} onClick={close}>
      <div
        ref={sheet}
        className="modal__sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children(close)}
      </div>
    </div>
  )
}
