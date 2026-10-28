import { useCallback, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Plant } from '../components/Plant'
import { Welcome } from '../components/Welcome'
import { childRepo, useChild } from '../data/children'
import { formatAge } from '../domain/age'
import { advance, cycleVisits, dayNoteKey, getPhase, getStep, type Step, nextStep, PHASES, positionLabel, STEPS, stepIndex, visitedMax } from '../domain/journey'
import { COMMUNICATION, type Child, type JourneyPosition } from '../domain/types'

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </svg>
  )
}

/** Comment for the current day/session: the user first picks audio or text. */
function DayNote(props: { child: Child; step: Step; noteKey: string; count: number }) {
  const { child, step, noteKey, count } = props
  const unit = step.unit!
  const saved = child.dayNotes[noteKey] ?? ''
  const [mode, setMode] = useState<'text' | 'audio' | null>(saved ? 'text' : null)

  return (
    <div className="day-note">
      <div className="mode-pick" role="group" aria-label="Como registrar">
        <button type="button" className="btn btn--soft" aria-pressed={mode === 'text'} onClick={() => setMode('text')}>
          <PenIcon /> Escrever
        </button>
        <button type="button" className="btn btn--soft" aria-pressed={mode === 'audio'} onClick={() => setMode('audio')}>
          <MicIcon /> Gravar áudio
        </button>
      </div>
      {mode === 'audio' && <p className="muted small">Gravação de áudio em breve.</p>}
      {mode === 'text' && (
        <textarea
          className="input"
          rows={3}
          autoFocus
          defaultValue={saved}
          aria-label={`Comentários do ${unit.singular.toLowerCase()} ${count}`}
          onChange={(e) => childRepo.setDayNote(child.id, noteKey, e.target.value)}
          placeholder={`Como foi? Observações para o fim d${unit.singular === 'Dia' ? 'o dia' : 'a sessão'}`}
        />
      )}
    </div>
  )
}

function PenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function previousLabel(child: Child) {
  const prev = child.history[child.history.length - 1]
  const label = positionLabel(prev)
  return label.detail ? `${label.title} · ${label.detail}` : label.title
}

/** "← Dia 3" while past day 1 of a step, otherwise a plain "← Voltar" (to the previous step or where the user was). */
function backLabel(child: Child) {
  const pos = child.journey
  return pos.count > 1 ? `← ${getStep(pos.stepId).unit!.singular} ${pos.count - 1}` : '← Voltar'
}

/** Reviewing an earlier step in a modal: same card, but moving between days never changes the child's journey. */
interface Review {
  pos: JourneyPosition
  /** Highest day/session reached in the step. */
  max: number
  onMove: (count: number) => void
  onClose: () => void
}

function HereCard({ child, review }: { child: Child; review?: Review }) {
  const pos = review ? review.pos : child.journey
  const step = getStep(pos.stepId)
  const phase = getPhase(step.phase)
  const label = positionLabel(pos)
  const unit = step.unit
  const limit = unit ? (unit.max ?? unit.target) : 0
  const flexible = Boolean(unit?.flexible)
  const canSkipAhead = unit && (flexible || (pos.count >= unit.target && pos.count < limit))
  const needsChoice = Boolean(step.options) && !child.protocol

  const primaryLabel =
    unit && pos.count < limit ? `Concluir ${unit.singular.toLowerCase()} ${pos.count}` : 'Concluir etapa'
  const reached = review ? review.max : (pos.reached ?? 0)
  const dots = flexible ? Math.max(unit!.target, pos.count, reached) : limit
  const noteKey = dayNoteKey(pos)

  return (
    <section className="here">
      <div className="here__top">
        <span className="here__tag">{review ? 'Editando etapa' : 'Você está aqui'}</span>
        {review && (
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={review.onClose}>
            ✕
          </button>
        )}
      </div>
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

      {unit && (
        <div className="dots" aria-label={`${pos.count} de ${dots}`}>
          {Array.from({ length: dots }, (_, i) => (
            <span
              key={i}
              className={`dot ${i < pos.count - 1 ? 'dot--done' : ''} ${i === pos.count - 1 ? 'dot--now' : ''} ${
                i >= pos.count && i < reached ? 'dot--reached' : ''
              } ${i >= unit.target ? 'dot--optional' : ''}`}
            />
          ))}
        </div>
      )}

      {step.options && (
        <fieldset className="checklist">
          <legend className="field__label">Protocolo</legend>
          {step.options.map((o) => (
            <label key={o} className="check check--radio">
              <input
                type="radio"
                name="protocolo"
                checked={child.protocol === o}
                onChange={() => childRepo.setProtocol(child.id, o)}
              />
              <span className="check__box" aria-hidden="true">✓</span>
              {o}
            </label>
          ))}
        </fieldset>
      )}

      {unit && <DayNote key={noteKey} child={child} step={step} noteKey={noteKey} count={pos.count} />}

      {review ? (
        <div className="here__actions">
          {unit && (
            <div className="day-nav">
              <button className="btn btn--soft" disabled={pos.count === 1} onClick={() => review.onMove(pos.count - 1)}>
                ← {unit.singular} {pos.count - 1}
              </button>
              <button
                className="btn btn--soft"
                disabled={pos.count >= review.max}
                onClick={() => review.onMove(pos.count + 1)}
              >
                {unit.singular} {pos.count + 1} →
              </button>
            </div>
          )}
          <button className="btn btn--primary btn--block here__end" onClick={review.onClose}>
            ✓ Concluir edição
          </button>
        </div>
      ) : unit ? (
        <div className="here__actions">
          <div className="day-nav">
            <button
              className="btn btn--soft"
              disabled={pos.count === 1 && child.history.length === 0}
              onClick={() => childRepo.goBack(child.id)}
            >
              {backLabel(child)}
            </button>
            <button className="btn btn--primary" onClick={() => childRepo.advanceTo(child.id, advance(pos))}>
              {flexible ? `Novo ${unit.singular.toLowerCase()} →` : `✓ ${primaryLabel}`}
            </button>
          </div>
          {canSkipAhead && (
            <button className="btn btn--accent btn--block here__end" onClick={() => childRepo.advanceTo(child.id, nextStep(pos))}>
              {flexible ? `✔ Encerrar ${step.title.toLowerCase()}` : `Encerrar ${unit.plural} e seguir`}
            </button>
          )}
        </div>
      ) : (
        <div className="here__actions">
          <button
            className="btn btn--primary btn--block"
            disabled={needsChoice}
            onClick={() => childRepo.advanceTo(child.id, advance(pos))}
          >
            ✓ {primaryLabel}
          </button>
          {needsChoice && <p className="muted small">Escolha um protocolo para concluir.</p>}
          {child.history.length > 0 && (
            <button className="btn btn--ghost btn--block here__back" onClick={() => childRepo.goBack(child.id)}>
              ← Voltar para {previousLabel(child)}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

/** Steps shown around the current one when collapsed (current ± 1, shifted at the edges). */
const WINDOW = 1

function Trail({ child, onReview }: { child: Child; onReview: (stepId: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const current = stepIndex(child.journey.stepId)
  const size = WINDOW * 2 + 1
  const start = expanded ? 0 : Math.max(0, Math.min(current - WINDOW, STEPS.length - size))
  const end = expanded ? STEPS.length - 1 : start + size - 1
  const hiddenBefore = start
  const hiddenAfter = STEPS.length - 1 - end
  const visited = new Set(cycleVisits(child.journey, child.history).map((p) => p.stepId))

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
                      style={{ ['--i' as string]: idx - start }}
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

export function ChildDetail() {
  const { id } = useParams()
  const child = useChild(id)
  const navigate = useNavigate()
  const location = useLocation()
  const showWelcome = Boolean((location.state as { welcome?: boolean } | null)?.welcome)
  const [reviewing, setReviewing] = useState<string | null>(null)
  const closeReview = useCallback(() => setReviewing(null), [])
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
    if (confirm(`Excluir ${child.name}? Todo o histórico será perdido.`)) {
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
          <Plant stage={step.phase} size={88} />
        </span>
        <div>
          <h1>{child.name}</h1>
          <p className="muted">{formatAge(child.birthMonth)}</p>
        </div>
      </section>

      {showWelcome && <Welcome name={child.name} onDone={closeWelcome} />}

      <HereCard key={`${child.journey.cycle}-${child.journey.stepId}`} child={child} />
      <Trail child={child} onReview={setReviewing} />
      {reviewing && <ReviewModal child={child} stepId={reviewing} onClose={closeReview} />}

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

      <button className="btn btn--danger-ghost btn--block" onClick={remove}>
        Excluir criança
      </button>
    </div>
  )
}
