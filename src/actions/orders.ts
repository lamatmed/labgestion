'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createNotification } from './notifications'
import { requireAuth } from '@/lib/auth-guard'

const CreateOrderSchema = z.object({
  patientId: z.string().cuid(),
  analysisIds: z.array(z.string().cuid()).min(1),
  paidAmount: z.coerce.number().min(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).default('CASH'),
  notes: z.string().max(500).optional(),
})

export async function createOrder(data: z.infer<typeof CreateOrderSchema>) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    const { patientId, analysisIds, paidAmount, paymentMethod, notes } = CreateOrderSchema.parse(data)

    const analyses = await prisma.analysisType.findMany({
      where: { id: { in: analysisIds } },
    })
    if (analyses.length !== analysisIds.length) {
      return { success: false, error: 'Une ou plusieurs analyses sont invalides' }
    }

    const totalAmount = analyses.reduce((sum, a) => sum + a.price, 0)
    const clampedPaid = Math.min(paidAmount, totalAmount)

    const order = await prisma.analysisOrder.create({
      data: {
        patientId,
        totalAmount,
        paidAmount: clampedPaid,
        notes,
        status: 'PENDING',
        analyses: {
          create: analyses.map((a) => ({
            analysisTypeId: a.id,
            unit: a.unit,
            refRange: a.refRangeText ?? (a.refRangeMin != null ? `${a.refRangeMin} - ${a.refRangeMax}` : null),
          })),
        },
        ...(clampedPaid > 0
          ? { payments: { create: [{ amount: clampedPaid, method: paymentMethod }] } }
          : {}),
      },
    })

    await createNotification({
      type: 'NEW_ORDER',
      title: 'Nouvelle ordonnance',
      message: `Ordonnance #${order.id.slice(-6).toUpperCase()} créée`,
      link: `/orders/${order.id}`,
    })

    revalidatePath('/', 'layout')
    return { success: true, orderId: order.id }
  } catch {
    return { success: false, error: 'Erreur lors de la création' }
  }
}

export async function addPayment(
  orderId: string,
  amount: number,
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER',
  notes?: string
) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: 'Montant invalide' }
  }

  try {
    const order = await prisma.analysisOrder.findUnique({ where: { id: orderId } })
    if (!order) return { success: false, error: 'Ordonnance introuvable' }
    if (order.status === 'CANCELLED') return { success: false, error: 'Ordonnance annulée' }

    const remaining = order.totalAmount - order.paidAmount
    if (amount > remaining + 0.01) {
      return { success: false, error: `Montant supérieur au reste dû (${remaining.toFixed(0)} MRU)` }
    }

    const safeAmount = Math.min(amount, remaining)
    const newPaid = order.paidAmount + safeAmount

    await prisma.$transaction([
      prisma.payment.create({ data: { orderId, amount: safeAmount, method, notes } }),
      prisma.analysisOrder.update({ where: { id: orderId }, data: { paidAmount: newPaid } }),
    ])

    if (newPaid >= order.totalAmount) {
      await createNotification({
        type: 'PAYMENT_RECEIVED',
        title: 'Paiement reçu',
        message: `Ordonnance #${orderId.slice(-6).toUpperCase()} entièrement payée`,
        link: `/orders/${orderId}`,
      })
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors du paiement' }
  }
}

export async function saveResults(
  orderId: string,
  results: Array<{ id: string; result: string; flag: 'NORMAL' | 'HIGH' | 'LOW' | null }>
) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  if (!results.length) return { success: false, error: 'Aucun résultat fourni' }

  try {
    // Verify all orderAnalysis records belong to this order (prevent IDOR)
    const owned = await prisma.orderAnalysis.findMany({
      where: { id: { in: results.map((r) => r.id) }, orderId },
      select: { id: true },
    })
    if (owned.length !== results.length) {
      return { success: false, error: 'Résultats invalides' }
    }

    await prisma.$transaction(
      results.map((r) =>
        prisma.orderAnalysis.update({
          where: { id: r.id },
          data: { result: r.result, flag: r.flag, completedAt: new Date() },
        })
      )
    )
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la sauvegarde des résultats' }
  }
}

export async function completeOrder(orderId: string) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    const order = await prisma.analysisOrder.findUnique({ where: { id: orderId } })
    if (!order) return { success: false, error: 'Ordonnance introuvable' }
    if (order.status === 'COMPLETED') return { success: false, error: 'Déjà terminée' }
    if (order.status === 'CANCELLED') return { success: false, error: 'Ordonnance annulée' }

    const orderAnalyses = await prisma.orderAnalysis.findMany({
      where: { orderId },
      include: { analysisType: { include: { reagents: true } } },
    })

    const consumption = new Map<string, number>()
    for (const item of orderAnalyses) {
      for (const reagent of item.analysisType.reagents) {
        consumption.set(reagent.productId, (consumption.get(reagent.productId) ?? 0) + reagent.quantityPerTest)
      }
    }

    await prisma.$transaction([
      prisma.analysisOrder.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      }),
      ...Array.from(consumption.entries()).map(([productId, qty]) =>
        prisma.product.update({ where: { id: productId }, data: { quantity: { decrement: qty } } })
      ),
    ])

    if (consumption.size > 0) {
      const affected = await prisma.product.findMany({
        where: { id: { in: Array.from(consumption.keys()) } },
        select: { id: true, name: true, quantity: true, minQuantity: true },
      })
      for (const p of affected) {
        if (p.minQuantity > 0 && p.quantity <= p.minQuantity) {
          try {
            await createNotification({
              type: 'LOW_STOCK',
              title: p.quantity <= 0 ? `Rupture: ${p.name}` : `Stock faible: ${p.name}`,
              message: `${p.name}: ${p.quantity} restant(s) / min ${p.minQuantity}`,
              link: `/products#${p.id}`,
            })
          } catch { /* non-critical */ }
        }
      }
    }

    await createNotification({
      type: 'ORDER_COMPLETED',
      title: 'Ordonnance terminée',
      message: `Ordonnance #${orderId.slice(-6).toUpperCase()} marquée comme terminée`,
      link: `/orders/${orderId}`,
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la validation' }
  }
}

export async function cancelOrder(orderId: string) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    const order = await prisma.analysisOrder.findUnique({ where: { id: orderId } })
    if (!order) return { success: false, error: 'Ordonnance introuvable' }
    if (order.status === 'COMPLETED') return { success: false, error: 'Impossible d\'annuler une ordonnance terminée' }

    await prisma.analysisOrder.update({ where: { id: orderId }, data: { status: 'CANCELLED' } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de l\'annulation' }
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    await prisma.analysisOrder.update({
      where: { id: orderId },
      data: { status, ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}) },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur' }
  }
}
