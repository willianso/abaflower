import { useSyncExternalStore } from 'react'
import { firstPosition } from '../domain/journey'
import { COMMUNICATION, type Child, type ChildInput, type ID, type JourneyPosition } from '../domain/types'
import { currentClinic, currentUser } from './session'

// Repository boundary: pages only talk to this interface, so the localStorage
// implementation can be swapped for an HTTP API without touching the UI.
export interface ChildRepository {
  list(): Child[]
  get(id: ID): Child | undefined
  create(input: ChildInput): Child
  update(id: ID, input: Partial<ChildInput>): Child
  setJourney(id: ID, journey: JourneyPosition): Child
  /** Moves to `journey`, remembering the current position so it can be undone. */
  advanceTo(id: ID, journey: JourneyPosition): Child
  /** Returns to the previous position, if any. */
  goBack(id: ID): Child
  setDayNote(id: ID, key: string, note: string): Child
  setProtocol(id: ID, protocol: string): Child
  remove(id: ID): void
  subscribe(listener: () => void): () => void
}

// Steps removed from the journey, mapped to the step that now follows them.
const REMOVED_STEPS: Record<string, string> = { planejamento: 'coleta', habilidades: 'objetivos' }
const moveRemoved = (p: JourneyPosition): JourneyPosition =>
  REMOVED_STEPS[p.stepId] ? { ...p, stepId: REMOVED_STEPS[p.stepId], count: 1 } : p

function createLocalRepository(clinicId: ID, userId: ID): ChildRepository {
  const key = `abaflower:v1:${clinicId}:children`
  const listeners = new Set<() => void>()
  let cache: Child[] = load()

  function load(): Child[] {
    try {
      const raw: Record<string, unknown>[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      return raw.map(migrate)
    } catch {
      return []
    }
  }

  // Records saved before nickname → name, sensory as text, color/support level removed,
  // and the old communication values (verbal, poucas_palavras, nao_verbal) replaced.
  function migrate(r: Record<string, unknown>): Child {
    const { nickname, color: _color, supportLevel: _level, protocols, ...rest } = r
    const sensory = rest.sensory
    return {
      interfering: '',
      dayNotes: {},
      ...rest,
      name: (rest.name ?? nickname ?? '') as string,
      protocol: rest.protocol ?? (Array.isArray(protocols) ? (protocols[0] ?? '') : ''),
      communication: COMMUNICATION.some((c) => c.value === rest.communication) ? rest.communication : 'vocal',
      sensory: Array.isArray(sensory) ? sensory : sensory ? [String(sensory)] : [],
      journey: moveRemoved(rest.journey as JourneyPosition),
      history: ((rest.history ?? []) as JourneyPosition[]).filter((p) => !REMOVED_STEPS[p.stepId]),
    } as unknown as Child
  }

  function save(next: Child[]) {
    cache = next
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Storage unavailable (private mode): keep in memory.
    }
    listeners.forEach((l) => l())
  }

  function patch(id: ID, fn: (c: Child) => Child) {
    const found = cache.find((c) => c.id === id)
    if (!found) throw new Error(`Criança ${id} não encontrada`)
    const updated = { ...fn(found), updatedAt: new Date().toISOString() }
    save(cache.map((c) => (c.id === id ? updated : c)))
    return updated
  }

  // Keep tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === key) {
      cache = load()
      listeners.forEach((l) => l())
    }
  })

  return {
    list: () => cache,
    get: (id) => cache.find((c) => c.id === id),
    create(input) {
      const now = new Date().toISOString()
      const child: Child = {
        ...input,
        id: crypto.randomUUID(),
        clinicId,
        journey: firstPosition(),
        protocol: '',
        history: [],
        dayNotes: {},
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      }
      save([child, ...cache])
      return child
    },
    update: (id, input) => patch(id, (c) => ({ ...c, ...input })),
    setJourney: (id, journey) => patch(id, (c) => ({ ...c, journey })),
    advanceTo: (id, journey) => patch(id, (c) => ({ ...c, journey, history: [...c.history, c.journey] })),
    goBack: (id) =>
      patch(id, (c) => {
        const { journey } = c
        const previous = c.history[c.history.length - 1]
        // Past day 1 of a step, "voltar" steps one day back; the history is only popped when it holds that same step.
        if (journey.count > 1) {
          const sameStep = previous?.stepId === journey.stepId && previous.cycle === journey.cycle
          return {
            ...c,
            journey: { ...journey, count: journey.count - 1, reached: Math.max(journey.count, journey.reached ?? 0) },
            history: sameStep ? c.history.slice(0, -1) : c.history,
          }
        }
        if (!previous) return c
        const sameStep = previous.stepId === journey.stepId && previous.cycle === journey.cycle
        const reached = sameStep ? Math.max(journey.count, journey.reached ?? 0, previous.reached ?? 0) : previous.reached
        return { ...c, journey: { ...previous, reached }, history: c.history.slice(0, -1) }
      }),
    setDayNote: (id, noteKey, note) => patch(id, (c) => ({ ...c, dayNotes: { ...c.dayNotes, [noteKey]: note } })),
    setProtocol: (id, protocol) => patch(id, (c) => ({ ...c, protocol })),
    remove(id) {
      save(cache.filter((c) => c.id !== id))
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const childRepo = createLocalRepository(currentClinic.id, currentUser.id)

export function useChildren() {
  return useSyncExternalStore(childRepo.subscribe, childRepo.list)
}

export function useChild(id: ID | undefined) {
  const list = useChildren()
  return list.find((c) => c.id === id)
}
