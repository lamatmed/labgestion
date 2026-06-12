'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createNotification } from './notifications'

const CreateOrderSchema = z.object({
  patientId: z.string(),
  analysisIds: z.array(z.string()).min(1),
  paidAmount: z.coerce.number().min(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).default('CASH'),
  notes: z.string().optional(),
})

export async function createOrder(data: z.infer<typeof CreateOrderSchema>) {
  try {
    const { patientId, analysisIds, paidAmount, paymentMethod, notes } = CreateOrderSchema.parse(data)

    const analyses = await prisma.analysisType.findMany({
      where: { id: { in: analysisIds } },
    })

    const totalAmount = analyses.reduce((sum, a) => sum + a.price, 0)

    const order = await prisma.analysisOrder.create({
      data: {
        patientId,
        totalAmount,
        paidAmount,
        notes,
        status: 'PENDING',
        analyses: {
          create: analyses.map((a) => ({
            analysisTypeId: a.id,
            unit: a.unit,
            refRange: a.refRangeText ?? (a.refRangeMin != null ? `${a.refRangeMin} - ${a.refRangeMax}` : null),
          })),
        },
        ...(paidAmount > 0
          ? {
              payments: {
                create: [{ amount: paidAmount, method: paymentMethod }],
              },
            }
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

export async function addPayment(orderId: string, amount: number, method: 'CASH' | 'CARD' | 'BANK_TRANSFER', notes?: string) {
  try {
    const order = await prisma.analysisOrder.findUnique({ where: { id: orderId } })
    if (!order) return { success: false, error: 'Ordonnance introuvable' }

    const newPaid = order.paidAmount + amount
    await prisma.$transaction([
      prisma.payment.create({ data: { orderId, amount, method, notes } }),
      prisma.analysisOrder.update({
        where: { id: orderId },
        data: { paidAmount: newPaid },
      }),
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
  try {
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
  try {
    await prisma.analysisOrder.update({
      where: { id: orderId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
    await createNotification({
      type: 'ORDER_COMPLETED',
      title: 'Ordonnance terminée',
      message: `Ordonnance #${orderId.slice(-6).toUpperCase()} marquée comme terminée`,
      link: `/orders/${orderId}`,
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur' }
  }
}

export async function cancelOrder(orderId: string) {
  try {
    await prisma.analysisOrder.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur' }
  }
}

export async function updateOrderStatus(orderId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') {
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
