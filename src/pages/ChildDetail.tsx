import { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Plant } from '../components/Plant'
import { Welcome } from '../components/Welcome'
import { childRepo, useChild } from '../data/children'
import { formatAge } from '../domain/age'
import { advance, getPhase, getStep, nextStep, PHASES, positionLabel, STEPS, stepIndex } from '../domain/journey'
import type { Child } from '../domain/types'

const COMMUNICATION_LABEL: Record<Child['communication'], string> = {
  verbal: 'Verbal',
  poucas_palavras: 'Poucas palavras',
  nao_verbal: 'Não verbal',
  caa: 'Usa CAA',
}

function HereCard({ child }: { child: Child }) {
  const pos = child.journey
  const step = getStep(pos.stepId)
  const phase = getPhase(step.phase)
  const label = positionLabel(pos)
  const unit = step.unit
  const limit = unit ? (unit.max ?? unit.target) : 0
  const canSkipAhead = unit && pos.count >= unit.target && pos.count < limit

  const primaryLabel = unit
    ? pos.count < limit
      ? `Concluir ${unit.singular.toLowerCase()} ${pos.count}`
      : `Concluir ${step.title.toLowerCase()}`
    : 'Concluir etapa'

  return (
    <section className="here">
      <span className="here__tag">Você está aqui</span>
      <h2>
        {label.title}
        {label.detail && (
          <>
            {' '}
            <span key={pos.count} className="here__detail pop">
              · {label.detail}
            </span>
          </>
        )}
      </h2>
      <p className="muted small">
        {phase.name} · {phase.subtitle} · Ciclo {pos.cycle}
      </p>
      <p>{step.description}</p>

      {unit && (
        <div className="dots" aria-label={`${pos.count} de ${limit}`}>
          {Array.from({ length: limit }, (_, i) => (
            <span
              key={i}
              className={`dot ${i < pos.count - 1 ? 'dot--done' : ''} ${i === pos.count - 1 ? 'dot--now' : ''} ${
                i >= unit.target ? 'dot--optional' : ''
              }`}
            />
          ))}
        </div>
      )}

      <div className="here__actions">
        <button className="btn btn--primary btn--block" onClick={() => childRepo.setJourney(child.id, advance(pos))}>
          ✓ {primaryLabel}
        </button>
        {canSkipAhead && (
          <button className="btn btn--ghost btn--block" onClick={() => childRepo.setJourney(child.id, nextStep(pos))}>
            Encerrar {unit.plural} e seguir
          </button>
        )}
      </div>
    </section>
  )
}

/** Steps shown around the current one when collapsed (current ± 1, shifted at the edges). */
const WINDOW = 1

function Trail({ child }: { child: Child }) {
  const [expanded, setExpanded] = useState(false)
  const current = stepIndex(child.journey.stepId)
  const size = WINDOW * 2 + 1
  const start = expanded ? 0 : Math.max(0, Math.min(current - WINDOW, STEPS.length - size))
  const end = expanded ? STEPS.length - 1 : start + size - 1
  const hiddenBefore = start
  const hiddenAfter = STEPS.length - 1 - end

  return (
    <section className={`trail ${expanded ? '' : 'trail--collapsed'}`}>
      <div className="trail__head">
        <h3>Trilha</h3>
        <span className="muted small">
          Etapa {current + 1} de {STEPS.length}
        </span>
      </div>

      <div
        className="trail__body"
        onClick={expanded ? undefined : () => setExpanded(true)}
      >
        {hiddenBefore > 0 && (
          <div className="trail__hint trail__hint--before">
            <span className="trail__hint-node" aria-hidden="true">✓</span>
            {hiddenBefore} {hiddenBefore === 1 ? 'etapa concluída' : 'etapas concluídas'}
          </div>
        )}

        {PHASES.map((phase) => {
          const steps = STEPS.map((s, idx) => ({ s, idx })).filter(
            ({ s, idx }) => s.phase === phase.id && idx >= start && idx <= end,
          )
          if (steps.length === 0) return null
          return (
            <div key={phase.id} className="trail__phase">
              <div className="trail__phase-head">
                <Plant stage={phase.id} color={child.color} size={36} />
                <div>
                  <strong>{phase.name}</strong>
                  <span className="muted small"> · {phase.subtitle}</span>
                </div>
              </div>
              <ol>
                {steps.map(({ s, idx }) => {
                  const state = idx < current ? 'done' : idx === current ? 'now' : 'next'
                  return (
                    <li
                      key={s.id}
                      style={{ ['--i' as string]: idx - start }}
                      className={`trail__step trail__step--${state}`}
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

        {hiddenAfter > 0 && (
          <div className="trail__hint trail__hint--after">
            <span className="trail__hint-node" aria-hidden="true">+</span>
            mais {hiddenAfter} {hiddenAfter === 1 ? 'etapa' : 'etapas'} pela frente
          </div>
        )}
      </div>

      <button
        type="button"
        className="trail__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Recolher trilha' : 'Ver trilha completa'}
        <span className="trail__chevron" aria-hidden="true">⌄</span>
      </button>
    </section>
  )
}

export function ChildDetail() {
  const { id } = useParams()
  const child = useChild(id)
  const navigate = useNavigate()
  const location = useLocation()
  const showWelcome = Boolean((location.state as { welcome?: boolean } | null)?.welcome)
  const closeWelcome = useCallback(
    () => navigate(location.pathname, { replace: true, state: null }),
    [navigate, location.pathname],
  )

  if (!child) {
    return (
      <div className="page empty">
        <p>Criança não encontrada.</p>
        <Link to="/" className="btn">Voltar ao jardim</Link>
      </div>
    )
  }

  const step = getStep(child.journey.stepId)

  function remove() {
    if (!child) return
    if (confirm(`Excluir ${child.nickname}? Todo o histórico será perdido.`)) {
      childRepo.remove(child.id)
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link to="/" className="icon-btn" aria-label="Voltar">
          ←
        </Link>
        <span className="topbar__title" />
        <Link to={`/criancas/${child.id}/editar`} className="btn btn--ghost btn--sm">
          Editar
        </Link>
      </header>

      <section className="profile">
        <span key={step.phase} className="grow sway">
          <Plant stage={step.phase} color={child.color} size={88} />
        </span>
        <div>
          <h1>{child.nickname}</h1>
          <p className="muted">{formatAge(child.birthMonth)}</p>
        </div>
      </section>

      {showWelcome && <Welcome name={child.nickname} color={child.color} onDone={closeWelcome} />}

      <HereCard key={`${child.journey.cycle}-${child.journey.stepId}`} child={child} />
      <Trail child={child} />

      <section className="card info">
        <h3>Sobre {child.nickname}</h3>
        <dl>
          <dt>Comunicação</dt>
          <dd>{COMMUNICATION_LABEL[child.communication]}</dd>
          <dt>Nível de suporte</dt>
          <dd>{child.supportLevel === 'nao_informado' ? 'Não informado' : `Nível ${child.supportLevel}`}</dd>
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
          {child.sensory && (
            <>
              <dt>Sensorial</dt>
              <dd>{child.sensory}</dd>
            </>
          )}
          {child.notes && (
            <>
              <dt>Observações</dt>
              <dd>{child.notes}</dd>
            </>
          )}
        </dl>
      </section>

      <button className="btn btn--danger-ghost btn--block" onClick={remove}>
        Excluir criança
      </button>
    </div>
  )
}
