'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'TECHNICIAN']),
})

export async function createUser(data: z.infer<typeof UserSchema>) {
  try {
    const parsed = UserSchema.parse(data)
    if (!parsed.password) return { success: false, error: 'Mot de passe requis' }

    const hashed = await bcrypt.hash(parsed.password, 10)
    await prisma.user.create({
      data: { name: parsed.name, email: parsed.email, password: hashed, role: parsed.role },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Cet email existe déjà' }
    return { success: false, error: 'Erreur lors de la création' }
  }
}

export async function updateUser(id: string, data: Omit<z.infer<typeof UserSchema>, 'password'> & { password?: string }) {
  try {
    const updateData: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      role: data.role,
    }
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }
    await prisma.user.update({ where: { id }, data: updateData })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}
