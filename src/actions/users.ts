'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'
import { ALL_PAGES } from '@/lib/permissions'
import { audit } from '@/lib/audit'

const BCRYPT_ROUNDS = 12

const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'TECHNICIAN']),
})

export async function createUser(data: z.infer<typeof UserSchema>) {
  const { session, error } = await requireAdmin()
  if (error || !session) return { success: false, error }

  try {
    const parsed = UserSchema.parse(data)
    if (!parsed.password) return { success: false, error: 'Mot de passe requis' }

    const hashed = await bcrypt.hash(parsed.password, BCRYPT_ROUNDS)
    const created = await prisma.user.create({
      data: { name: parsed.name, email: parsed.email, password: hashed, role: parsed.role },
    })
    audit('user.create', session!.user.id, created.id, { role: parsed.role })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Cet email existe déjà' }
    return { success: false, error: 'Erreur lors de la création' }
  }
}

export async function updateUser(id: string, data: Omit<z.infer<typeof UserSchema>, 'password'> & { password?: string }) {
  const { session, error } = await requireAuth()
  if (error || !session) return { success: false, error }

  // A technician can only update their own profile (not role changes)
  const isAdmin = session.user.role === 'ADMIN'
  const isSelf = session.user.id === id
  if (!isAdmin && !isSelf) return { success: false, error: 'Accès refusé' }

  try {
    const updateData: Record<string, unknown> = { name: data.name, email: data.email }
    // Only admins can change roles
    if (isAdmin) updateData.role = data.role
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, BCRYPT_ROUNDS)
    }
    await prisma.user.update({ where: { id }, data: updateData })
    audit('user.update', session.user.id, id)
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteUser(id: string) {
  const { session, error } = await requireAdmin()
  if (error || !session) return { success: false, error }
  if (session.user.id === id) return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' }

  try {
    await prisma.user.delete({ where: { id } })
    audit('user.delete', session.user.id, id)
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}

export async function updateUserPermissions(userId: string, permissions: string[]) {
  const { session, error } = await requireAdmin()
  if (error || !session) return { success: false, error }

  // Validate: only known page slugs are accepted
  const validSlugs = ALL_PAGES as readonly string[]
  const sanitized = permissions.filter((p) => validSlugs.includes(p))

  try {
    await prisma.user.update({ where: { id: userId }, data: { permissions: sanitized } })
    audit('user.permissions_change', session.user.id, userId, { granted: sanitized })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Erreur lors de la mise à jour des permissions' }
  }
}
