'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'

export async function markNotificationRead(id: string) {
  await prisma.notification.update({ where: { id }, data: { read: true } })
  revalidatePath('/', 'layout')
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
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
