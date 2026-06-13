import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { hasPageAccess } from '@/lib/permissions'
import type { Notification } from '@prisma/client'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  // Fetch user with permissions for access control
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, permissions: true },
  })
  const permissions = dbUser?.permissions ?? []

  // Enforce page-level permissions via x-pathname set by middleware
  const h = await headers()
  const pathname = h.get('x-pathname') ?? ''
  const segments = pathname.split('/').filter(Boolean) // ['fr', 'patients']
  const pageSlug = segments[1] ?? ''

  if (!hasPageAccess(dbUser?.role ?? session.user.role, permissions, pageSlug)) {
    redirect(`/${locale}`)
  }

  // Auto-create LOW_STOCK notifications (max once per 12h per product)
  // Column-to-column comparison requires JS filtering after fetch
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, quantity: true, minQuantity: true },
  })
  const lowStockProducts = allProducts.filter(
    (p) => p.minQuantity > 0 && p.quantity <= p.minQuantity
  )
  if (lowStockProducts.length > 0) {
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000)
    const recentIds = await prisma.notification.findMany({
      where: { userId: session.user.id, type: 'LOW_STOCK', createdAt: { gte: cutoff } },
      select: { link: true },
    })
    const alreadyNotified = new Set(recentIds.map((n) => n.link))
    try {
      await Promise.all(
        lowStockProducts
          .filter((p) => !alreadyNotified.has(`/products#${p.id}`))
          .map((p) =>
            prisma.notification.create({
              data: {
                userId: session.user.id,
                type: 'LOW_STOCK',
                title: p.quantity <= 0 ? `Rupture: ${p.name}` : `Stock faible: ${p.name}`,
                message: `${p.name}: ${p.quantity} / ${p.minQuantity} min`,
                link: `/products#${p.id}`,
              },
            })
          )
      )
    } catch {
      // Notification creation is non-critical — ignore errors silently
    }
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }) as Notification[]

  return (
    <DashboardShell
      user={{
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        role: session.user.role,
      }}
      locale={locale}
      notifications={notifications}
      permissions={permissions}
    >
      {children}
    </DashboardShell>
  )
}
