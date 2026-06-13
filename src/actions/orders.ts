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
    // Fetch reagent requirements for all analyses in this order
    const orderAnalyses = await prisma.orderAnalysis.findMany({
      where: { orderId },
      include: { analysisType: { include: { reagents: true } } },
    })

    // Aggregate total consumption per product
    const consumption = new Map<string, number>()
    for (const item of orderAnalyses) {
      for (const reagent of item.analysisType.reagents) {
        consumption.set(reagent.productId, (consumption.get(reagent.productId) ?? 0) + reagent.quantityPerTest)
      }
    }

    // Mark complete + deduct stock atomically
    await prisma.$transaction([
      prisma.analysisOrder.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      }),
      ...Array.from(consumption.entries()).map(([productId, qty]) =>
        prisma.product.update({ where: { id: productId }, data: { quantity: { decrement: qty } } })
      ),
    ])

    // Alert for products that went low/out after deduction
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
