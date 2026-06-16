'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'

export async function payDebt(debtId: string, amount: number, notes?: string) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: 'Montant invalide' }
  }

  try {
    const debt = await prisma.debt.findUnique({ where: { id: debtId } })
    if (!debt) return { success: false, error: 'Dette introuvable' }
    if (amount > debt.remaining + 0.01) {
      return { success: false, error: 'Montant supérieur au reste dû' }
    }

    const safeAmount = Math.min(amount, debt.remaining)
    const newRemaining = debt.remaining - safeAmount
    const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL'

    await prisma.$transaction([
      prisma.debtPayment.create({ data: { debtId, amount: safeAmount, notes } }),
      prisma.debt.update({ where: { id: debtId }, data: { remaining: newRemaining, status: newStatus } }),
    ])

    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors du paiement' }
  }
}
