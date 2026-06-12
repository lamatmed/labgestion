import { prisma } from '@/lib/prisma'
import OrdersClient from './OrdersClient'

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const orders = await prisma.analysisOrder.findMany({
    orderBy: { orderedAt: 'desc' },
    include: {
      patient: true,
      analyses: { include: { analysisType: true } },
      payments: true,
    },
  })

  return <OrdersClient orders={orders as any} locale={locale} />
}
