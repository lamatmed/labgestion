'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createNotification } from './notifications'

const PurchaseItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
})

const PurchaseSchema = z.object({
  supplierId: z.string(),
  paidAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(PurchaseItemSchema).min(1),
})

export async function createPurchase(data: z.infer<typeof PurchaseSchema>) {
  try {
    const { supplierId, paidAmount, notes, dueDate, items } = PurchaseSchema.parse(data)

    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
    const remaining = totalAmount - paidAmount

    const purchase = await prisma.purchase.create({
      data: {
        supplierId,
        totalAmount,
        paidAmount,
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
                  dueDate: dueDate ? new Date(dueDate) : null,
                },
              },
            }
          : {}),
      },
    })

    // Update product stock
    await Promise.all(
      items.map((i) =>
        prisma.product.update({
          where: { id: i.productId },
          data: { quantity: { increment: i.quantity } },
        })
      )
    )

    if (remaining > 0) {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } })
      await createNotification({
        type: 'DEBT_DUE',
        title: 'Nouvelle dette fournisseur',
        message: `Dette de ${remaining.toFixed(2)} MRU envers ${supplier?.name}`,
        link: '/debts',
      })
    }

    revalidatePath('/', 'layout')
    return { success: true, purchaseId: purchase.id }
  } catch {
    return { success: false, error: 'Erreur lors de la création de l\'achat' }
  }
}
