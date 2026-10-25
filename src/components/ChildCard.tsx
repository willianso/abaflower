import { Link } from 'react-router-dom'
import { formatAge } from '../domain/age'
import { getStep, positionLabel, progress } from '../domain/journey'
import type { Child } from '../domain/types'
import { Plant } from './Plant'

export function ChildCard({ child }: { child: Child }) {
  const step = getStep(child.journey.stepId)
  const label = positionLabel(child.journey)
  return (
    <Link to={`/criancas/${child.id}`} className="child-card">
      <Plant stage={step.phase} color={child.color} size={56} />
      <div className="child-card__body">
        <div className="child-card__top">
          <strong>{child.nickname}</strong>
          <span className="muted small">{formatAge(child.birthMonth)}</span>
        </div>
        <span className="chip chip--soft">
          {label.title}
          {label.detail && ` · ${label.detail}`}
        </span>
        <div className="bar" aria-hidden="true">
          <span style={{ width: `${progress(child.journey) * 100}%` }} />
        </div>
      </div>
    </Link>
  )
}
