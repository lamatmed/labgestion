'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SupplierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
})

export async function createSupplier(data: z.infer<typeof SupplierSchema>) {
  try {
    const parsed = SupplierSchema.parse(data)
    await prisma.supplier.create({ data: { ...parsed, email: parsed.email || null } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la création' }
  }
}

export async function updateSupplier(id: string, data: z.infer<typeof SupplierSchema>) {
  try {
    const parsed = SupplierSchema.parse(data)
    await prisma.supplier.update({ where: { id }, data: { ...parsed, email: parsed.email || null } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteSupplier(id: string) {
  try {
    await prisma.supplier.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}
