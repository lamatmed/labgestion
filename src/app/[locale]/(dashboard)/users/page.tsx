import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import UsersClient from './UsersClient'

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    redirect(`/${locale}`)
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <UsersClient
      users={users}
      currentUserId={session.user.id}
      locale={locale}
    />
  )
}
