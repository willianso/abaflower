import type { JourneyPosition } from './types'

// The ABA journey, kept as data so steps can be reordered/edited later
// (and eventually configured per clinic).

export type PhaseId = 'semente' | 'broto' | 'botao' | 'flor'

export interface Phase {
  id: PhaseId
  name: string
  subtitle: string
}

export interface Step {
  id: string
  phase: PhaseId
  title: string
  description: string
  /** Unit counted inside the step, e.g. "Dia" for adaptation. */
  unit?: { singular: string; plural: string; target: number; max?: number; flexible?: boolean }
  /** When set, one of these must be chosen before the step can be concluded. */
  options?: string[]
}

export const PHASES: Phase[] = [
  { id: 'semente', name: 'Semente', subtitle: 'Avaliação' },
  { id: 'broto', name: 'Broto', subtitle: 'Intervenção' },
  { id: 'botao', name: 'Botão', subtitle: 'Manutenção' },
  { id: 'flor', name: 'Flor', subtitle: 'Reavaliação' },
]

export const STEPS: Step[] = [
  {
    id: 'adaptacao',
    phase: 'semente',
    title: 'Adaptação',
    description: 'Primeiros encontros para criar vínculo e observar a criança.',
    unit: { singular: 'Dia', plural: 'dias', target: 3, flexible: true },
  },
  {
    id: 'protocolo',
    phase: 'semente',
    title: 'Escolha do protocolo',
    description: 'Definir o protocolo de avaliação com base na adaptação.',
    options: ['Protocolo A', 'Protocolo B', 'Protocolo C', 'Protocolo D'],
  },
  {
    id: 'coleta',
    phase: 'semente',
    title: 'Coleta de informações',
    description: 'Sessões de aplicação e registro do protocolo.',
    unit: { singular: 'Sessão', plural: 'sessões', target: 10, max: 20 },
  },
  {
    id: 'relatorio',
    phase: 'semente',
    title: 'Relatório',
    description: 'Relatório com gráfico do protocolo a partir das coletas.',
  },
  {
    id: 'objetivos',
    phase: 'broto',
    title: 'Objetivos (programas)',
    description: 'Criar os programas para cada habilidade escolhida.',
  },
  {
    id: 'plano_ensino',
    phase: 'broto',
    title: 'Plano de ensino',
    description: 'Definir como cada habilidade será ensinada.',
  },
  {
    id: 'aplicacao',
    phase: 'broto',
    title: 'Coleta Programa de Ensino',
    description: 'Assistente aplica o plano e coleta dados (~10h semanais).',
    unit: { singular: 'Sessão', plural: 'sessões', target: 10 },
  },
  {
    id: 'manutencao',
    phase: 'botao',
    title: 'Manutenção',
    description: 'Verificar se as habilidades aprendidas se mantêm.',
    unit: { singular: 'Sessão', plural: 'sessões', target: 5 },
  },
  {
    id: 'reavaliacao',
    phase: 'flor',
    title: 'Reavaliação',
    description: 'Com 80% das habilidades mantidas, reavaliar e iniciar novo ciclo.',
  },
]

export const firstPosition = (): JourneyPosition => ({
  stepId: STEPS[0].id,
  count: 1,
  cycle: 1,
  stepStartedAt: new Date().toISOString(),
})

export const stepIndex = (stepId: string) => STEPS.findIndex((s) => s.id === stepId)
export const getStep = (stepId: string) => STEPS[stepIndex(stepId)] ?? STEPS[0]
export const getPhase = (id: PhaseId) => PHASES.find((p) => p.id === id)!

/** "Adaptação · Dia 1" / "Coleta de informações · Sessão 4 de 10–20" */
export function positionLabel(pos: JourneyPosition) {
  const step = getStep(pos.stepId)
  if (!step.unit) return { title: step.title, detail: '' }
  const { singular, target, max, flexible } = step.unit
  if (flexible) return { title: step.title, detail: `${singular} ${pos.count}` }
  const range = max ? `${target}–${max}` : `${target}`
  return { title: step.title, detail: `${singular} ${pos.count} de ${range}` }
}

/** Advances one unit (day/session) or moves to the next step. Wraps to a new cycle after reavaliação. */
export function advance(pos: JourneyPosition): JourneyPosition {
  const step = getStep(pos.stepId)
  if (step.unit?.flexible) return { ...pos, count: pos.count + 1 }
  const limit = step.unit?.max ?? step.unit?.target ?? 0
  if (step.unit && pos.count < limit) return { ...pos, count: pos.count + 1 }
  return nextStep(pos)
}

export function nextStep(pos: JourneyPosition): JourneyPosition {
  const idx = stepIndex(pos.stepId)
  const now = new Date().toISOString()
  if (idx >= STEPS.length - 1) {
    // Reavaliação feeds a new cycle starting at the intervention phase.
    return { stepId: 'objetivos', count: 1, cycle: pos.cycle + 1, stepStartedAt: now }
  }
  return { ...pos, stepId: STEPS[idx + 1].id, count: 1, stepStartedAt: now, reached: undefined }
}

/** Key of the comment for the day/session the position points at. */
export const dayNoteKey = (pos: JourneyPosition) => `${pos.cycle}:${pos.stepId}:${pos.count}`

/** Overall progress through the current cycle, 0..1. */
export function progress(pos: JourneyPosition) {
  return (stepIndex(pos.stepId) + 0.5) / STEPS.length
}

/** Positions visited in the current cycle (current one plus history), used to know which steps can be reviewed. */
export const cycleVisits = (journey: JourneyPosition, history: JourneyPosition[]) =>
  [journey, ...history].filter((p) => p.cycle === journey.cycle)

/** Highest day/session reached in a step during the current cycle, or 0 if the step was not visited. */
export const visitedMax = (journey: JourneyPosition, history: JourneyPosition[], stepId: string) =>
  Math.max(0, ...cycleVisits(journey, history).filter((p) => p.stepId === stepId).map((p) => p.count))
