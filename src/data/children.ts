import { useSyncExternalStore } from 'react'
import { firstPosition } from '../domain/journey'
import type { Child, ChildInput, ID, JourneyPosition } from '../domain/types'
import { currentClinic, currentUser } from './session'

// Repository boundary: pages only talk to this interface, so the localStorage
// implementation can be swapped for an HTTP API without touching the UI.
export interface ChildRepository {
  list(): Child[]
  get(id: ID): Child | undefined
  create(input: ChildInput): Child
  update(id: ID, input: Partial<ChildInput>): Child
  setJourney(id: ID, journey: JourneyPosition): Child
  remove(id: ID): void
  subscribe(listener: () => void): () => void
}

function createLocalRepository(clinicId: ID, userId: ID): ChildRepository {
  const key = `abaflower:v1:${clinicId}:children`
  const listeners = new Set<() => void>()
  let cache: Child[] = load()

  function load(): Child[] {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]')
    } catch {
      return []
    }
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
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      }
      save([child, ...cache])
      return child
    },
    update: (id, input) => patch(id, (c) => ({ ...c, ...input })),
    setJourney: (id, journey) => patch(id, (c) => ({ ...c, journey })),
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
