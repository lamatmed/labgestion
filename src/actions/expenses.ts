'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'

const ExpenseSchema = z.object({
  description: z.string().min(2).max(300),
  amount: z.coerce.number().positive(),
  category: z.string().max(100).optional(),
  date: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Date invalide'),
})

export async function createExpense(data: z.infer<typeof ExpenseSchema>) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    const parsed = ExpenseSchema.parse(data)
    await prisma.expense.create({ data: { ...parsed, date: new Date(parsed.date) } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la création' }
  }
}

export async function deleteExpense(id: string) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    await prisma.expense.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}
