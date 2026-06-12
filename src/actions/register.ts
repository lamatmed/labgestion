'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export async function registerUser(data: {
  name: string
  email: string
  password: string
  confirmPassword: string
}) {
  if (data.password !== data.confirmPassword) {
    return { success: false, error: 'Les mots de passe ne correspondent pas' }
  }

  try {
    const parsed = RegisterSchema.parse(data)
    const hashed = await bcrypt.hash(parsed.password, 10)

    await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashed,
        role: 'TECHNICIAN',
      },
    })

    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Cet email est déjà utilisé' }
    if (e.errors) return { success: false, error: e.errors[0]?.message ?? 'Données invalides' }
    return { success: false, error: 'Erreur lors de la création du compte' }
  }
}
