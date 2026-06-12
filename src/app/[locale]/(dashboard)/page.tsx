import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import { StatsCard } from '@/components/ui/StatsCard'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, ClipboardList, TrendingUp, Clock, DollarSign, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { TimeGreeting } from '@/components/ui/TimeGreeting'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  const t = await getTranslations('dashboard')
  const tOrders = await getTranslations('orders')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalPatients,
    totalOrders,
    pendingOrders,
    completedOrders,
    todayPayments,
    totalDebts,
    recentOrders,
    allProductsRaw,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.analysisOrder.count(),
    prisma.analysisOrder.count({ where: { status: 'PENDING' } }),
    prisma.analysisOrder.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: today } },
      _sum: { amount: true },
    }),
    prisma.debt.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { remaining: true },
    }),
    prisma.analysisOrder.findMany({
      take: 8,
      orderBy: { orderedAt: 'desc' },
      include: { patient: true },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, quantity: true, minQuantity: true, unit: true },
    }),
  ])

  const todayRevenue = todayPayments._sum.amount ?? 0
  const totalDebt = totalDebts._sum.remaining ?? 0
  const lowStockProducts = allProductsRaw
    .filter((p) => p.minQuantity > 0 && p.quantity <= p.minQuantity)
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <TimeGreeting name={session?.user?.name?.split(' ')[0] ?? ''} />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          }).format(new Date())}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatsCard title={t('totalPatients')} value={totalPatients} icon={Users} color="blue" />
        <StatsCard title={t('totalOrders')} value={totalOrders} icon={ClipboardList} color="purple" />
        <StatsCard title={t('todayRevenue')} value={formatCurrency(todayRevenue)} icon={TrendingUp} color="green" />
        <StatsCard title={t('pendingOrders')} value={pendingOrders} icon={Clock} color="amber" />
        <StatsCard title={t('completedOrders')} value={completedOrders} icon={DollarSign} color="green" />
        <StatsCard title={t('totalDebts')} value={formatCurrency(totalDebt)} icon={AlertCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('recentOrders')}</h2>
            <Link
              href={`/${locale}/orders`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t('viewAll')}
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {recentOrders.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">{tOrders('noOrders')}</p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/${locale}/orders/${order.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors group"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {order.patient.firstName} {order.patient.lastName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      #{order.id.slice(-6).toUpperCase()} · {formatDate(order.orderedAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low stock alert */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('lowStockAlert')}</h2>
            <Link href={`/${locale}/products`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              {t('viewAll')}
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('stockOk')}</p>
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {p.quantity} / {p.minQuantity} {p.unit}
                    </p>
                  </div>
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
