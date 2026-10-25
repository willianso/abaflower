import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PETAL_HEX, Plant } from '../components/Plant'
import { childRepo, useChild } from '../data/children'
import { ageFromBirthMonth, birthMonthFromAge } from '../domain/age'
import { PETAL_COLORS, type ChildInput, type Communication, type SupportLevel } from '../domain/types'

const COMMUNICATION: { value: Communication; label: string }[] = [
  { value: 'verbal', label: 'Verbal' },
  { value: 'poucas_palavras', label: 'Poucas palavras' },
  { value: 'nao_verbal', label: 'Não verbal' },
  { value: 'caa', label: 'Usa CAA' },
]

const SUPPORT: { value: SupportLevel; label: string }[] = [
  { value: '1', label: 'Nível 1' },
  { value: '2', label: 'Nível 2' },
  { value: '3', label: 'Nível 3' },
  { value: 'nao_informado', label: 'Não informado' },
]

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
  const [nickname, setNickname] = useState(existing?.nickname ?? '')
  const [years, setYears] = useState(initialAge.years)
  const [months, setMonths] = useState(initialAge.months)
  const [color, setColor] = useState(existing?.color ?? 'rosa')
  const [communication, setCommunication] = useState<Communication>(existing?.communication ?? 'verbal')
  const [supportLevel, setSupportLevel] = useState<SupportLevel>(existing?.supportLevel ?? 'nao_informado')
  const [interests, setInterests] = useState<string[]>(existing?.interests ?? [])
  const [interestDraft, setInterestDraft] = useState('')
  const [sensory, setSensory] = useState(existing?.sensory ?? '')
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

  const nicknameError = nickname.trim().length === 0 ? 'Informe um apelido' : ''

  function toggleInterest(value: string) {
    const v = value.trim()
    if (!v) return
    setInterests((list) => (list.includes(v) ? list.filter((i) => i !== v) : [...list, v]))
  }

  function addDraft() {
    if (interestDraft.trim() && !interests.includes(interestDraft.trim())) toggleInterest(interestDraft)
    setInterestDraft('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (nicknameError) return
    const input: ChildInput = {
      nickname: nickname.trim(),
      birthMonth: birthMonthFromAge(years, months),
      color,
      communication,
      supportLevel,
      interests,
      sensory: sensory.trim(),
      notes: notes.trim(),
    }
    const saved = existing ? childRepo.update(existing.id, input) : childRepo.create(input)
    navigate(`/criancas/${saved.id}`, { replace: true, state: existing ? undefined : { welcome: true } })
  }

  return (
    <form className="page page--form" onSubmit={submit} noValidate>
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          ←
        </button>
        <span className="topbar__title">{isEdit ? 'Editar criança' : 'Acolher criança'}</span>
        <span className="icon-btn" />
      </header>

      <div className="form-hero">
        <span key={color} className="pop sway">
          <Plant stage="flor" color={color} size={96} />
        </span>
        <p className="muted small">{nickname.trim() || 'Sua nova flor'}</p>
      </div>

      <label className="field">
        <span className="field__label">Apelido *</span>
        <input
          className={`input ${touched && nicknameError ? 'input--error' : ''}`}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Ex.: Juju, Pedrinho"
          autoComplete="off"
          maxLength={30}
          autoFocus={!isEdit}
        />
        {touched && nicknameError ? (
          <span className="field__error">{nicknameError}</span>
        ) : (
          <span className="field__hint">Use só o apelido. Não guardamos nome completo nem documentos.</span>
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
        <span className="field__label">Cor da flor</span>
        <div className="swatches" role="radiogroup" aria-label="Cor da flor">
          {PETAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              className="swatch"
              style={{ background: PETAL_HEX[c] }}
              onClick={() => setColor(c)}
            />
          ))}
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
        <span className="field__label">Nível de suporte (TEA)</span>
        <div className="chips" role="radiogroup">
          {SUPPORT.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={supportLevel === o.value}
              className="chip chip--select"
              onClick={() => setSupportLevel(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">Interesses e reforçadores</span>
        <span className="field__hint">O que motiva a criança? Ajuda a montar as sessões.</span>
        <div className="chips">
          {[...new Set([...INTEREST_SUGGESTIONS, ...interests])].map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={interests.includes(i)}
              className="chip chip--select"
              onClick={() => toggleInterest(i)}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="row">
          <input
            className="input"
            value={interestDraft}
            onChange={(e) => setInterestDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addDraft()
              }
            }}
            placeholder="Outro interesse"
          />
          <button type="button" className="btn" onClick={addDraft} disabled={!interestDraft.trim()}>
            Adicionar
          </button>
        </div>
      </div>

      <label className="field">
        <span className="field__label">Sensibilidades sensoriais</span>
        <textarea
          className="input"
          rows={2}
          value={sensory}
          onChange={(e) => setSensory(e.target.value)}
          placeholder="Ex.: incomoda com barulho alto, evita texturas molhadas"
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
          {isEdit ? 'Salvar alterações' : 'Plantar e iniciar trilha'}
        </button>
      </div>
    </form>
  )
}
