'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ExpenseSchema = z.object({
  description: z.string().min(2),
  amount: z.coerce.number().positive(),
  category: z.string().optional(),
  date: z.string(),
})

export async function createExpense(data: z.infer<typeof ExpenseSchema>) {
  try {
    const parsed = ExpenseSchema.parse(data)
    await prisma.expense.create({
      data: { ...parsed, date: new Date(parsed.date) },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la création' }
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}
