import { useCallback, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Plant } from '../components/Plant'
import { useChild } from '../data/children'
import { cycleVisits, getStep, PHASES, STEPS, stepIndex, visitedMax } from '../domain/journey'
import { COMMUNICATION, type Child, type JourneyPosition } from '../domain/types'
import { HereCard } from './ChildDetail'

function Trail({ child, onReview }: { child: Child; onReview: (stepId: string) => void }) {
  const current = stepIndex(child.journey.stepId)
  const visited = new Set(cycleVisits(child.journey, child.history).map((p) => p.stepId))

  return (
    <section className="trail">
      <div className="trail__head">
        <h3>Trilha</h3>
        <span className="muted small">
          Etapa {current + 1} de {STEPS.length}
        </span>
      </div>

      <div className="trail__body">
        {PHASES.map((phase) => {
          const steps = STEPS.map((s, idx) => ({ s, idx })).filter(({ s }) => s.phase === phase.id)
          return (
            <div key={phase.id} className="trail__phase">
              <div className="trail__phase-head">
                <Plant stage={phase.id} size={36} />
                <div>
                  <strong>{phase.name}</strong>
                  <span className="muted small"> · {phase.subtitle}</span>
                </div>
              </div>
              <ol>
                {steps.map(({ s, idx }) => {
                  const state = idx === current ? 'now' : idx < current || visited.has(s.id) ? 'done' : 'next'
                  const editable = state === 'done' && visited.has(s.id)
                  return (
                    <li
                      key={s.id}
                      style={{ ['--i' as string]: idx }}
                      className={`trail__step trail__step--${state} ${editable ? 'trail__step--editable' : ''}`}
                      {...(editable && {
                        role: 'button',
                        tabIndex: 0,
                        'aria-label': `Editar etapa ${idx + 1}: ${s.title}`,
                        onClick: (e: MouseEvent<HTMLLIElement>) => {
                          e.stopPropagation()
                          onReview(s.id)
                        },
                        onKeyDown: (e: KeyboardEvent<HTMLLIElement>) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onReview(s.id)
                          }
                        },
                      })}
                    >
                      <span className="trail__node" aria-hidden="true">
                        {state === 'done' ? '✓' : idx + 1}
                      </span>
                      <div>
                        <span className="trail__title">{s.title}</span>
                        {state === 'now' && <span className="pill">você está aqui</span>}
                        <span className="muted small trail__desc">{s.description}</span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ReviewModal({ child, stepId, onClose }: { child: Child; stepId: string; onClose: () => void }) {
  const max = visitedMax(child.journey, child.history, stepId)
  const [count, setCount] = useState(max)
  const pos: JourneyPosition = { stepId, count, cycle: child.journey.cycle, stepStartedAt: '' }
  return (
    <Modal label={`Editar ${getStep(stepId).title}`} onClose={onClose}>
      {(close) => <HereCard child={child} review={{ pos, max, onMove: setCount, onClose: close }} />}
    </Modal>
  )
}

export function ChildTrail() {
  const { id } = useParams()
  const child = useChild(id)
  const [reviewing, setReviewing] = useState<string | null>(null)
  const closeReview = useCallback(() => setReviewing(null), [])

  if (!child) {
    return (
      <div className="page empty">
        <p>Criança não encontrada.</p>
        <Link to="/" className="btn">Voltar ao jardim</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link to={`/criancas/${child.id}`} className="icon-btn" aria-label="Voltar">
          ←
        </Link>
        <span className="topbar__title">{child.name}</span>
        <span />
      </header>

      <Trail child={child} onReview={setReviewing} />

      <section className="card info">
        <h3>Sobre {child.name}</h3>
        <dl>
          <dt>Comunicação</dt>
          <dd>{COMMUNICATION.find((c) => c.value === child.communication)?.label}</dd>
          {child.interests.length > 0 && (
            <>
              <dt>Interesses</dt>
              <dd className="chips">
                {child.interests.map((i) => (
                  <span key={i} className="chip chip--soft">
                    {i}
                  </span>
                ))}
              </dd>
            </>
          )}
          {child.sensory.length > 0 && (
            <>
              <dt>Sensorial</dt>
              <dd className="chips">
                {child.sensory.map((i) => (
                  <span key={i} className="chip chip--soft">
                    {i}
                  </span>
                ))}
              </dd>
            </>
          )}
          {child.interfering && (
            <>
              <dt>Comportamentos interferentes</dt>
              <dd>{child.interfering}</dd>
            </>
          )}
          {child.protocol && (
            <>
              <dt>Protocolo</dt>
              <dd>{child.protocol}</dd>
            </>
          )}
        </dl>
      </section>

      {reviewing && <ReviewModal child={child} stepId={reviewing} onClose={closeReview} />}
    </div>
  )
}
