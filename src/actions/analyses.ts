'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'

const ReagentSchema = z.object({
  productId: z.string().cuid(),
  quantityPerTest: z.number().positive(),
})

const AnalysisSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(20).toUpperCase(),
  price: z.coerce.number().positive(),
  unit: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  refRangeMin: z.coerce.number().optional().nullable(),
  refRangeMax: z.coerce.number().optional().nullable(),
  refRangeText: z.string().max(200).optional(),
  reagents: z.array(ReagentSchema).optional().default([]),
})

export async function createAnalysisType(data: z.infer<typeof AnalysisSchema>) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

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
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    const { reagents, ...parsed } = AnalysisSchema.parse(data)
    // Use transaction to ensure delete + recreate is atomic
    await prisma.$transaction(async (tx) => {
      await tx.analysisTypeReagent.deleteMany({ where: { analysisTypeId: id } })
      await tx.analysisType.update({
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
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteAnalysisType(id: string) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    await prisma.analysisType.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}
