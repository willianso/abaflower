// Domain types. Every tenant-owned entity carries clinicId so the future
// backend can enforce isolation (row-level security / tenant scoping).

export type ID = string

export interface Clinic {
  id: ID
  name: string
}

export type UserRole = 'admin' | 'psicologo' | 'assistente'

export interface User {
  id: ID
  clinicId: ID
  name: string
  role: UserRole
}

export type Communication = 'verbal' | 'poucas_palavras' | 'nao_verbal' | 'caa'
export type SupportLevel = '1' | '2' | '3' | 'nao_informado'

export const PETAL_COLORS = ['rosa', 'coral', 'amarelo', 'lilas', 'azul', 'verde'] as const
export type PetalColor = (typeof PETAL_COLORS)[number]

/** Where the child is in the journey. `count` = days/sessions done in current step. */
export interface JourneyPosition {
  stepId: string
  count: number
  cycle: number
  stepStartedAt: string
}

/**
 * Child record. No sensitive data: nickname only, approximate birth month
 * (derived from age) instead of a birth date, no documents or guardian info.
 */
export interface Child {
  id: ID
  clinicId: ID
  nickname: string
  birthMonth: string // YYYY-MM, approximate
  supportLevel: SupportLevel
  communication: Communication
  interests: string[] // potential reinforcers
  sensory: string
  notes: string
  color: PetalColor
  journey: JourneyPosition
  createdBy: ID
  createdAt: string
  updatedAt: string
}

export type ChildInput = Pick<
  Child,
  'nickname' | 'birthMonth' | 'supportLevel' | 'communication' | 'interests' | 'sensory' | 'notes' | 'color'
>
