import type { Clinic, User } from '../domain/types'

// Mock session. In the MVP this comes from auth (JWT claims: userId, clinicId, role).
export const currentClinic: Clinic = { id: 'clinica-demo', name: 'Clínica Demo' }

export const currentUser: User = {
  id: 'usuario-demo',
  clinicId: currentClinic.id,
  name: 'Psicóloga',
  role: 'psicologo',
}
