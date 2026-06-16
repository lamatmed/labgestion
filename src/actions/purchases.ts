'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createNotification } from './notifications'
import { requireAuth } from '@/lib/auth-guard'

const PurchaseItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
})

const PurchaseSchema = z.object({
  supplierId: z.string().cuid(),
  paidAmount: z.coerce.number().min(0),
  notes: z.string().max(500).optional(),
  dueDate: z.string().optional(),
  items: z.array(PurchaseItemSchema).min(1),
})

export async function createPurchase(data: z.infer<typeof PurchaseSchema>) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    const { supplierId, paidAmount, notes, dueDate, items } = PurchaseSchema.parse(data)

    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
    const clampedPaid = Math.min(paidAmount, totalAmount)
    const remaining = totalAmount - clampedPaid

    // Validate dueDate if provided
    let parsedDueDate: Date | null = null
    if (dueDate) {
      parsedDueDate = new Date(dueDate)
      if (isNaN(parsedDueDate.getTime())) {
        return { success: false, error: 'Date d\'échéance invalide' }
      }
    }

    // All stock updates + purchase creation in a single transaction
    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          supplierId,
          totalAmount,
          paidAmount: clampedPaid,
          notes,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: i.quantity * i.unitPrice,
            })),
          },
          ...(remaining > 0
            ? {
                debt: {
                  create: {
                    supplierId,
                    amount: remaining,
                    remaining,
                    status: 'PENDING',
                    dueDate: parsedDueDate,
                  },
                },
              }
            : {}),
        },
      })

      // Atomic stock increments within the same transaction
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
            unitPrice: item.unitPrice,
          },
        })
      }

      return created
    })

    if (remaining > 0) {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } })
      await createNotification({
        type: 'DEBT_DUE',
        title: 'Nouvelle dette fournisseur',
        message: `Dette de ${remaining.toFixed(0)} MRU envers ${supplier?.name}`,
        link: '/debts',
      })
    }

    revalidatePath('/', 'layout')
    return { success: true, purchaseId: purchase.id }
  } catch {
    return { success: false, error: 'Erreur lors de la création de l\'achat' }
  }
}
