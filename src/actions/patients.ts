'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'

const PatientSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  dateOfBirth: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Date invalide'),
  gender: z.enum(['M', 'F']),
  phone: z.string().min(8, 'Numéro invalide').max(20),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(200).optional(),
})

export async function createPatient(data: z.infer<typeof PatientSchema>) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    const parsed = PatientSchema.parse(data)
    await prisma.patient.create({
      data: { ...parsed, email: parsed.email || null, dateOfBirth: new Date(parsed.dateOfBirth) },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la création du patient' }
  }
}

export async function updatePatient(id: string, data: z.infer<typeof PatientSchema>) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    const parsed = PatientSchema.parse(data)
    await prisma.patient.update({
      where: { id },
      data: { ...parsed, email: parsed.email || null, dateOfBirth: new Date(parsed.dateOfBirth) },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

export async function deletePatient(id: string) {
  const { error } = await requireAuth()
  if (error) return { success: false, error }

  try {
    await prisma.patient.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}
