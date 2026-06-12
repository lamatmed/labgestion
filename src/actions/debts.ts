'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function payDebt(debtId: string, amount: number, notes?: string) {
  try {
    const debt = await prisma.debt.findUnique({ where: { id: debtId } })
    if (!debt) return { success: false, error: 'Dette introuvable' }
    if (amount > debt.remaining) return { success: false, error: 'Montant supérieur au reste dû' }

    const newRemaining = debt.remaining - amount
    const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL'

    await prisma.$transaction([
      prisma.debtPayment.create({ data: { debtId, amount, notes } }),
      prisma.debt.update({
        where: { id: debtId },
        data: { remaining: newRemaining, status: newStatus },
      }),
    ])

    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors du paiement' }
  }
}
