import { prisma } from '@/lib/prisma'
import DebtsClient from './DebtsClient'

export default async function DebtsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const debts = await prisma.debt.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      supplier: true,
      purchase: true,
      payments: { orderBy: { paidAt: 'desc' } },
    },
  })

  return <DebtsClient debts={debts as any} locale={locale} />
}
