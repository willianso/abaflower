import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plant } from '../components/Plant'
import { TagPicker } from '../components/TagPicker'
import { childRepo, useChild } from '../data/children'
import { ageFromBirthMonth, birthMonthFromAge } from '../domain/age'
import { COMMUNICATION, type ChildInput, type Communication } from '../domain/types'

const INTEREST_SUGGESTIONS = [
  'Bolhas de sabão',
  'Música',
  'Massinha',
  'Carrinhos',
  'Blocos',
  'Dinossauros',
  'Pintura',
  'Tablet',
  'Balanço',
  'Cócegas',
]

const SENSORY_SUGGESTIONS = [
  'Barulho alto',
  'Luzes fortes',
  'Texturas molhadas',
  'Toque inesperado',
  'Cheiros fortes',
]

function Stepper(props: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const { label, value, min, max, onChange } = props
  return (
    <div className="stepper">
      <button type="button" aria-label={`Diminuir ${label}`} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <div>
        <strong>{value}</strong>
        <span className="muted small">{label}</span>
      </div>
      <button type="button" aria-label={`Aumentar ${label}`} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  )
}

export function ChildForm() {
  const { id } = useParams()
  const existing = useChild(id)
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const initialAge = existing ? ageFromBirthMonth(existing.birthMonth) : { years: 4, months: 0 }
  const [name, setName] = useState(existing?.name ?? '')
  const [years, setYears] = useState(initialAge.years)
  const [months, setMonths] = useState(initialAge.months)
  const [communication, setCommunication] = useState<Communication>(existing?.communication ?? 'vocal')
  const [interests, setInterests] = useState<string[]>(existing?.interests ?? [])
  const [sensory, setSensory] = useState<string[]>(existing?.sensory ?? [])
  const [interfering, setInterfering] = useState(existing?.interfering ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [touched, setTouched] = useState(false)

  if (isEdit && !existing) {
    return (
      <div className="page empty">
        <p>Criança não encontrada.</p>
        <Link to="/" className="btn">Voltar</Link>
      </div>
    )
  }

  const nameError = name.trim().length === 0 ? 'Informe o nome ou as iniciais' : ''

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (nameError) return
    const input: ChildInput = {
      name: name.trim(),
      birthMonth: birthMonthFromAge(years, months),
      communication,
      interests,
      sensory,
      interfering: interfering.trim(),
      notes: notes.trim(),
    }
    const saved = existing ? childRepo.update(existing.id, input) : childRepo.create(input)
    navigate(`/criancas/${saved.id}`, { replace: true, state: existing ? undefined : { welcome: true } })
  }

  function remove() {
    if (!existing) return
    if (confirm(`Excluir ${existing.name}? Todo o histórico será perdido.`)) {
      childRepo.remove(existing.id)
      navigate('/', { replace: true })
    }
  }

  return (
    <form className="page page--form" onSubmit={submit} noValidate>
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          ←
        </button>
        <span className="topbar__title">{isEdit ? 'Editar criança' : 'Acolher criança'}</span>
        {existing ? (
          <button type="button" className="icon-btn icon-btn--danger" aria-label="Excluir criança" onClick={remove}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
            </svg>
          </button>
        ) : (
          <span className="icon-btn" />
        )}
      </header>

      <div className="form-hero">
        <span className="pop sway">
          <Plant stage="flor" size={96} />
        </span>
        <p className="muted small">{name.trim() || 'Sua nova flor'}</p>
      </div>

      <label className="field">
        <span className="field__label">Nome ou iniciais *</span>
        <input
          className={`input ${touched && nameError ? 'input--error' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Julia, J.M."
          autoComplete="off"
          maxLength={30}
          autoFocus={!isEdit}
        />
        {touched && nameError ? (
          <span className="field__error">{nameError}</span>
        ) : (
          <span className="field__hint">Primeiro nome ou iniciais. Não guardamos sobrenome nem documentos.</span>
        )}
      </label>

      <div className="field">
        <span className="field__label">Idade *</span>
        <div className="row">
          <Stepper label={years === 1 ? 'ano' : 'anos'} value={years} min={0} max={17} onChange={setYears} />
          <Stepper label={months === 1 ? 'mês' : 'meses'} value={months} min={0} max={11} onChange={setMonths} />
        </div>
      </div>

      <div className="field">
        <span className="field__label">Comunicação</span>
        <div className="chips" role="radiogroup">
          {COMMUNICATION.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={communication === o.value}
              className="chip chip--select"
              onClick={() => setCommunication(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">Interesses e reforçadores</span>
        <span className="field__hint">O que motiva a criança? Ajuda a montar as sessões.</span>
        <TagPicker noun="interesse" catalog={INTEREST_SUGGESTIONS} value={interests} onChange={setInterests} />
      </div>

      <div className="field">
        <span className="field__label">Sensibilidades sensoriais</span>
        <span className="field__hint">Busque as que se aplicam ou adicione outra.</span>
        <TagPicker noun="sensibilidade" catalog={SENSORY_SUGGESTIONS} value={sensory} onChange={setSensory} />
      </div>

      <label className="field">
        <span className="field__label">Comportamentos interferentes</span>
        <textarea
          className="input"
          rows={3}
          value={interfering}
          onChange={(e) => setInterfering(e.target.value)}
          placeholder="Ex.: fuga da tarefa, autoagressão, birras ao ouvir &quot;não&quot;"
        />
      </label>

      <label className="field">
        <span className="field__label">Observações</span>
        <textarea
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Algo importante para a equipe saber"
        />
      </label>

      <div className="sticky-actions">
        <button type="submit" className="btn btn--primary btn--lg btn--block">
          {isEdit ? 'Salvar alterações' : '🌸 Iniciar trilha'}
        </button>
      </div>
    </form>
  )
}
