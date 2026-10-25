import type { PhaseId } from '../domain/journey'
import type { PetalColor } from '../domain/types'

export const PETAL_HEX: Record<PetalColor, string> = {
  rosa: '#F29BB8',
  coral: '#F5A27F',
  amarelo: '#F4C95D',
  lilas: '#B6A0E6',
  azul: '#87C3EA',
  verde: '#9DCB84',
}

interface Props {
  stage: PhaseId
  color: PetalColor
  size?: number
}

/** The child's plant: grows from seed to flower following the journey phase. */
export function Plant({ stage, color, size = 56 }: Props) {
  const petal = PETAL_HEX[color]
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="plant">
      <circle cx="32" cy="32" r="31" fill={petal} opacity="0.18" />
      {stage === 'semente' && (
        <g>
          <ellipse cx="32" cy="50" rx="16" ry="4" fill="#8A6B4E" opacity="0.35" />
          <ellipse cx="32" cy="42" rx="7" ry="9" fill="#B98B5E" />
          <path d="M32 33 q2 -5 6 -6" stroke="#5E9E6E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      )}
      {stage === 'broto' && (
        <g>
          <ellipse cx="32" cy="52" rx="16" ry="4" fill="#8A6B4E" opacity="0.35" />
          <path d="M32 52 V30" stroke="#5E9E6E" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 38 C22 38 18 30 18 24 C26 24 32 30 32 38Z" fill="#7DBB7F" />
          <path d="M32 33 C42 33 46 25 46 19 C38 19 32 25 32 33Z" fill="#5E9E6E" />
        </g>
      )}
      {stage === 'botao' && (
        <g>
          <ellipse cx="32" cy="54" rx="16" ry="4" fill="#8A6B4E" opacity="0.35" />
          <path d="M32 54 V26" stroke="#5E9E6E" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 44 C22 44 19 38 19 33 C26 33 32 38 32 44Z" fill="#7DBB7F" />
          <path d="M32 26 C24 22 25 12 32 8 C39 12 40 22 32 26Z" fill={petal} />
          <path d="M32 27 C27 25 26 20 28 17 L32 22 L36 17 C38 20 37 25 32 27Z" fill="#7DBB7F" />
        </g>
      )}
      {stage === 'flor' && (
        <g>
          <path d="M32 58 V34" stroke="#5E9E6E" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 48 C22 48 19 42 19 37 C26 37 32 42 32 48Z" fill="#7DBB7F" />
          <g transform="translate(32 24)">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse key={a} cx="0" cy="-10" rx="7" ry="11" fill={petal} transform={`rotate(${a})`} />
            ))}
            <circle r="6" fill="#F7D774" />
            <circle r="6" fill="none" stroke="#E5B94A" strokeWidth="1.5" />
          </g>
        </g>
      )}
    </svg>
  )
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g transform="translate(32 30)">
        {[0, 72, 144, 216, 288].map((a, i) => (
          <ellipse
            key={a}
            cx="0"
            cy="-13"
            rx="9"
            ry="14"
            fill={['#F29BB8', '#F5A27F', '#F4C95D', '#B6A0E6', '#87C3EA'][i]}
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="8" fill="#FFF6E0" />
        <circle r="8" fill="none" stroke="#4E8B6A" strokeWidth="2.5" />
      </g>
    </svg>
  )
}
