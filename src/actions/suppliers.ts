'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'

const SupplierSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(300).optional(),
})

export async function createSupplier(data: z.infer<typeof SupplierSchema>) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

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
  const { error } = await requireAuth()
  if (error) return { success: false, error }

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
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    await prisma.supplier.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}
