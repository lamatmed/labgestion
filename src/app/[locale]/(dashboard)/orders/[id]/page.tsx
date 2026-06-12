import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import OrderDetailClient from './OrderDetailClient'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  const order = await prisma.analysisOrder.findUnique({
    where: { id },
    include: {
      patient: true,
      analyses: { include: { analysisType: true } },
      payments: { orderBy: { paidAt: 'desc' } },
    },
  })

  if (!order) notFound()

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/orders`} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Ordonnance #{id.slice(-6).toUpperCase()}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {order.patient.firstName} {order.patient.lastName} · {formatDate(order.orderedAt)}
          </p>
        </div>
      </div>

      <OrderDetailClient order={order as any} locale={locale} />
    </div>
  )
}
