'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const AnalysisSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).toUpperCase(),
  price: z.coerce.number().positive(),
  unit: z.string().optional(),
  category: z.string().optional(),
  refRangeMin: z.coerce.number().optional().nullable(),
  refRangeMax: z.coerce.number().optional().nullable(),
  refRangeText: z.string().optional(),
})

export async function createAnalysisType(data: z.infer<typeof AnalysisSchema>) {
  try {
    const parsed = AnalysisSchema.parse(data)
    await prisma.analysisType.create({ data: parsed })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Ce code existe déjà' }
    return { success: false, error: 'Erreur lors de la création' }
  }
}

export async function updateAnalysisType(id: string, data: z.infer<typeof AnalysisSchema>) {
  try {
    const parsed = AnalysisSchema.parse(data)
    await prisma.analysisType.update({ where: { id }, data: parsed })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteAnalysisType(id: string) {
  try {
    await prisma.analysisType.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}
