'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createNotification } from './notifications'

const ProductSchema = z.object({
  name: z.string().min(2),
  reference: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().min(1),
  quantity: z.coerce.number().min(0),
  minQuantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().positive(),
})

export async function createProduct(data: z.infer<typeof ProductSchema>) {
  try {
    const parsed = ProductSchema.parse(data)
    const product = await prisma.product.create({ data: parsed })

    if (product.quantity <= product.minQuantity) {
      await createNotification({
        type: 'LOW_STOCK',
        title: 'Stock faible',
        message: `Le produit "${product.name}" a un stock faible (${product.quantity} ${product.unit})`,
        link: '/products',
      })
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la création' }
  }
}

export async function updateProduct(id: string, data: z.infer<typeof ProductSchema>) {
  try {
    const parsed = ProductSchema.parse(data)
    await prisma.product.update({ where: { id }, data: parsed })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}
