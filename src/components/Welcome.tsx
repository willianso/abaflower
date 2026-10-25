import { useEffect, useState } from 'react'
import type { PetalColor } from '../domain/types'
import { PETAL_HEX } from './Plant'

const FALLING = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: 1.6 + (i % 7) * 0.18,
  duration: 2.6 + (i % 4) * 0.5,
  drift: ((i % 5) - 2) * 18,
  hue: i % 3,
}))

/** Celebration shown after registering a child: a seed sprouts and blooms. */
export function Welcome({ name, color, onDone }: { name: string; color: PetalColor; onDone: () => void }) {
  const petal = PETAL_HEX[color]
  const [leaving, setLeaving] = useState(false)

  function close() {
    setLeaving(true)
  }

  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(onDone, 350)
    return () => clearTimeout(t)
  }, [leaving, onDone])

  return (
    <div className={`welcome ${leaving ? 'welcome--leaving' : ''}`} role="dialog" aria-label={`${name} chegou ao jardim`}>
      <div className="welcome__petals" aria-hidden="true">
        {FALLING.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              ['--drift' as string]: `${p.drift}px`,
              background: [petal, '#F4C95D', '#9DCB84'][p.hue],
            }}
          />
        ))}
      </div>

      <svg className="bloom" viewBox="0 0 200 220" width="220" height="242" aria-hidden="true">
        <circle className="bloom__halo" cx="100" cy="90" r="80" fill={petal} />
        <ellipse className="bloom__soil" cx="100" cy="196" rx="56" ry="10" fill="#8A6B4E" />
        <ellipse className="bloom__seed" cx="100" cy="186" rx="12" ry="15" fill="#B98B5E" />
        <path className="bloom__stem" d="M100 192 C100 160 96 130 100 92" stroke="#5E9E6E" strokeWidth="6" fill="none" strokeLinecap="round" pathLength={1} />
        <path className="bloom__leaf bloom__leaf--l" d="M99 156 C78 156 66 142 64 128 C82 128 98 140 99 156Z" fill="#7DBB7F" />
        <path className="bloom__leaf bloom__leaf--r" d="M100 136 C121 136 133 122 135 108 C117 108 101 120 100 136Z" fill="#5E9E6E" />
        <g transform="translate(100 78)">
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <g key={a} transform={`rotate(${a})`}>
              <ellipse className="bloom__petal" style={{ animationDelay: `${1.15 + i * 0.07}s` }} cx="0" cy="-22" rx="15" ry="24" fill={petal} />
            </g>
          ))}
          <circle className="bloom__center" r="13" fill="#F7D774" stroke="#E5B94A" strokeWidth="3" />
        </g>
      </svg>

      <div className="welcome__text">
        <h1>{name} chegou ao jardim</h1>
        <p className="muted">A trilha começa agora, com a adaptação.</p>
        <button className="btn btn--primary btn--lg" onClick={close} autoFocus>
          Ver trilha de {name}
        </button>
      </div>
    </div>
  )
}
