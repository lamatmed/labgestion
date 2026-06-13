'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ReagentSchema = z.object({
  productId: z.string().min(1),
  quantityPerTest: z.number().positive(),
})

const AnalysisSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).toUpperCase(),
  price: z.coerce.number().positive(),
  unit: z.string().optional(),
  category: z.string().optional(),
  refRangeMin: z.coerce.number().optional().nullable(),
  refRangeMax: z.coerce.number().optional().nullable(),
  refRangeText: z.string().optional(),
  reagents: z.array(ReagentSchema).optional().default([]),
})

export async function createAnalysisType(data: z.infer<typeof AnalysisSchema>) {
  try {
    const { reagents, ...parsed } = AnalysisSchema.parse(data)
    await prisma.analysisType.create({
      data: {
        ...parsed,
        ...(reagents.length > 0 && {
          reagents: {
            create: reagents.map((r) => ({ productId: r.productId, quantityPerTest: r.quantityPerTest })),
          },
        }),
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Ce code existe déjà' }
    return { success: false, error: 'Erreur lors de la création' }
  }
}

export async function updateAnalysisType(id: string, data: z.infer<typeof AnalysisSchema>) {
  try {
    const { reagents, ...parsed } = AnalysisSchema.parse(data)
    // Delete old reagents then recreate — simpler than upsert
    await prisma.analysisTypeReagent.deleteMany({ where: { analysisTypeId: id } })
    await prisma.analysisType.update({
      where: { id },
      data: {
        ...parsed,
        ...(reagents.length > 0 && {
          reagents: {
            create: reagents.map((r) => ({ productId: r.productId, quantityPerTest: r.quantityPerTest })),
          },
        }),
      },
    })
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
