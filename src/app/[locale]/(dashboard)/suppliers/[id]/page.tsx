import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Truck, ShoppingCart, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DebtStatusBadge } from '@/components/ui/Badge'
import { getTranslations } from 'next-intl/server'

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations('suppliers')
  const tc = await getTranslations('common')
  const tDebts = await getTranslations('debts')
  const tPurchases = await getTranslations('purchases')

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchases: {
        orderBy: { purchasedAt: 'desc' },
        include: { items: { include: { product: true } } },
      },
      debts: {
        orderBy: { createdAt: 'desc' },
        include: { payments: true },
      },
    },
  })

  if (!supplier) notFound()

  const totalPurchases = supplier.purchases.reduce((sum, p) => sum + p.totalAmount, 0)
  const totalDebt = supplier.debts
    .filter((d) => d.status !== 'PAID')
    .reduce((sum, d) => sum + d.remaining, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/suppliers`} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.phone} {supplier.email ? `· ${supplier.email}` : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t('totalPurchases'), value: formatCurrency(totalPurchases), icon: ShoppingCart, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40' },
          { label: t('purchaseCount'), value: supplier.purchases.length, icon: Truck, color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/40' },
          { label: t('debtRemaining'), value: formatCurrency(totalDebt), icon: AlertCircle, color: totalDebt > 0 ? 'text-red-600 bg-red-100 dark:bg-red-950/40' : 'text-green-600 bg-green-100 dark:bg-green-950/40' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Purchases */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('purchaseHistory')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="text-start px-5 py-3 font-medium">{tc('date')}</th>
                <th className="text-start px-5 py-3 font-medium">{tPurchases('items')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('total')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('paid')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('remaining')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {supplier.purchases.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">{t('noPurchases')}</td></tr>
              ) : supplier.purchases.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{formatDate(p.purchasedAt)}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{p.items.length} {tPurchases('itemsCount')}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{formatCurrency(p.totalAmount)}</td>
                  <td className="px-5 py-3.5 text-green-600 dark:text-green-400">{formatCurrency(p.paidAmount)}</td>
                  <td className="px-5 py-3.5 text-red-600 dark:text-red-400">{formatCurrency(p.totalAmount - p.paidAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debts */}
      {supplier.debts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('debtHistory')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="text-start px-5 py-3 font-medium">{tDebts('createdAt')}</th>
                  <th className="text-start px-5 py-3 font-medium">{tDebts('amount')}</th>
                  <th className="text-start px-5 py-3 font-medium">{tc('remaining')}</th>
                  <th className="text-start px-5 py-3 font-medium">{tDebts('dueDate')}</th>
                  <th className="text-start px-5 py-3 font-medium">{tc('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {supplier.debts.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{formatDate(d.createdAt)}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{formatCurrency(d.amount)}</td>
                    <td className="px-5 py-3.5 text-red-600 dark:text-red-400 font-medium">{formatCurrency(d.remaining)}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{d.dueDate ? formatDate(d.dueDate) : '—'}</td>
                    <td className="px-5 py-3.5"><DebtStatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
