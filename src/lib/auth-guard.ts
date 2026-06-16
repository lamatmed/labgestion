'server-only'

import { auth } from '@/auth'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    return { session: null, error: 'Non autorisé' as const }
  }
  return { session, error: null }
}

export async function requireAdmin() {
  const { session, error } = await requireAuth()
  if (error || !session) return { session: null, error: 'Non autorisé' as const }
  if (session.user.role !== 'ADMIN') return { session: null, error: 'Accès refusé' as const }
  return { session, error: null }
}
