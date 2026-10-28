import { useLayoutEffect, useRef, useState } from 'react'
import { Modal } from './Modal'

/** Max catalog items listed before the user types anything. */
const SUGGESTED = 8

const SLIDE_MS = 220

/** Case and accent insensitive form, so "Musica" and "música" count as the same item. */
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

interface Props {
  /** Field name used in labels, e.g. "interesse". */
  noun: string
  catalog: string[]
  value: string[]
  onChange: (value: string[]) => void
}

/**
 * Multi-select for a catalog that can grow large: selected items show as removable chips,
 * and a search sheet lists matches (several can be ticked) with an option to create a new item.
 */
export function TagPicker({ noun, catalog, value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {value.length > 0 && (
        <div className="chips">
          {value.map((v) => (
            <button
              key={v}
              type="button"
              className="chip chip--soft chip--removable"
              aria-label={`Remover ${v}`}
              onClick={() => onChange(value.filter((i) => i !== v))}
            >
              {v} <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="btn btn--soft picker-open" onClick={() => setOpen(true)}>
        <SearchIcon /> Buscar ou adicionar {noun}
      </button>
      {open && <PickerSheet noun={noun} catalog={catalog} value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  )
}

function PickerSheet({ noun, catalog, value, onChange, onClose }: Props & { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const q = normalize(query)

  // Everything selectable: the catalog plus anything already selected that is not in it.
  const all = [...new Set([...catalog, ...value])]
  const results = q
    ? all.filter((i) => normalize(i).includes(q))
    : [...new Set([...value, ...catalog.slice(0, SUGGESTED)])]
  const canCreate = q.length > 0 && !all.some((i) => normalize(i) === q)

  const toggle = (item: string) =>
    onChange(value.includes(item) ? value.filter((i) => i !== item) : [...value, item])

  // FLIP: when a ticked item jumps to the top (or back), slide rows from their old position so the move is visible.
  const rows = useRef(new Map<string, HTMLElement>())
  const tops = useRef(new Map<string, number>())
  const lastQuery = useRef(q)
  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sameList = lastQuery.current === q
    lastQuery.current = q
    const next = new Map<string, number>()
    rows.current.forEach((el, key) => {
      const top = el.offsetTop
      next.set(key, top)
      const before = tops.current.get(key)
      if (sameList && !reduced && before !== undefined && before !== top) {
        el.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'none' }], {
          duration: SLIDE_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        })
      }
    })
    tops.current = next
  })

  function create() {
    onChange([...value, query.trim()])
    setQuery('')
  }

  function onEnter() {
    if (canCreate && results.length === 0) create()
    else if (results.length > 0) toggle(results[0])
  }

  return (
    <Modal label={`Buscar ${noun}`} onClose={onClose}>
      {(close) => (
        <div className="picker">
          <input
            className="input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onEnter()
              }
            }}
            placeholder={`Buscar ${noun}`}
            aria-label={`Buscar ${noun}`}
            enterKeyHint="search"
            maxLength={40}
            autoFocus
          />

          <div className="picker__list">
            {!q && <span className="muted small">Sugestões</span>}
            {q && results.length === 0 && !canCreate && <span className="muted small">Nada encontrado.</span>}
            {results.map((item) => (
              <label
                key={item}
                className="check"
                ref={(el) => {
                  if (el) rows.current.set(item, el)
                  else rows.current.delete(item)
                }}
              >
                <input type="checkbox" checked={value.includes(item)} onChange={() => toggle(item)} />
                <span className="check__box" aria-hidden="true">✓</span>
                {item}
              </label>
            ))}
            {canCreate && (
              <button type="button" className="check check--create" onClick={create}>
                <span className="check__box check__box--plus" aria-hidden="true">+</span>
                Criar “{query.trim()}”
              </button>
            )}
          </div>

          <button type="button" className="btn btn--primary btn--block" onClick={close}>
            Pronto{value.length > 0 && ` (${value.length} ${value.length === 1 ? 'selecionado' : 'selecionados'})`}
          </button>
        </div>
      )}
    </Modal>
  )
}
