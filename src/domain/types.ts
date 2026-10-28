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

export const COMMUNICATION = [
  { value: 'vocal', label: 'Comunicação vocal' },
  { value: 'caa', label: 'Comunicação aumentativa alternativa (CAA)' },
  { value: 'pecs', label: 'Comunicação por PECS' },
  { value: 'gestual', label: 'Comunicação gestual' },
  { value: 'escrita', label: 'Comunicação escrita' },
] as const
export type Communication = (typeof COMMUNICATION)[number]['value']

/** Where the child is in the journey. `count` = days/sessions done in current step. */
export interface JourneyPosition {
  stepId: string
  count: number
  cycle: number
  stepStartedAt: string
  /** Highest `count` reached in this step; set when going back so later days show as faded. */
  reached?: number
}

/**
 * Child record. No sensitive data: first name or initials only, approximate birth month
 * (derived from age) instead of a birth date, no documents or guardian info.
 */
export interface Child {
  id: ID
  clinicId: ID
  name: string // first name or initials
  birthMonth: string // YYYY-MM, approximate
  communication: Communication
  interests: string[] // potential reinforcers
  sensory: string[] // sensory sensitivities
  interfering: string // interfering behaviors, free text
  notes: string
  /** Protocol chosen in the "protocolo" step (one at a time in the MVP). */
  protocol: string
  journey: JourneyPosition
  /** Previous positions, most recent last; lets the psychologist step back. */
  history: JourneyPosition[]
  /** Comment per day/session, keyed by `dayNoteKey`. */
  dayNotes: Record<string, string>
  createdBy: ID
  createdAt: string
  updatedAt: string
}

export type ChildInput = Pick<
  Child,
  'name' | 'birthMonth' | 'communication' | 'interests' | 'sensory' | 'interfering' | 'notes'
>
