'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'
import { requireAuth } from '@/lib/auth-guard'

export async function markNotificationRead(id: string) {
  const { session, error } = await requireAuth()
  if (error || !session) return

  // Only mark notifications belonging to the current user
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  })
  revalidatePath('/', 'layout')
}

export async function markAllNotificationsRead(userId: string) {
  const { session, error } = await requireAuth()
  if (error || !session) return
  // Ignore the passed userId — always use the session's own id
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })
  revalidatePath('/', 'layout')
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId?: string
  type: NotificationType
  title: string
  message: string
  link?: string
}) {
  await prisma.notification.create({
    data: { userId, type, title, message, link },
  })
}
