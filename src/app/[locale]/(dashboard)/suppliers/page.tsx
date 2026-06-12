import { prisma } from '@/lib/prisma'
import SuppliersClient from './SuppliersClient'

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { purchases: true, debts: true } },
      debts: {
        where: { status: { not: 'PAID' } },
        select: { remaining: true },
      },
    },
  })
  return <SuppliersClient suppliers={suppliers as any} locale={locale} />
}
