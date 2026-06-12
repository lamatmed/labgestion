import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function PurchasesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('purchases')
  const tc = await getTranslations('common')

  const [purchases, suppliers, products] = await Promise.all([
    prisma.purchase.findMany({
      orderBy: { purchasedAt: 'desc' },
      include: {
        supplier: true,
        items: { include: { product: true } },
        debt: true,
      },
      take: 100,
    }),
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
  ])

  const totalPurchases = purchases.reduce((s, p) => s + p.totalAmount, 0)
  const totalPaid = purchases.reduce((s, p) => s + p.paidAmount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{purchases.length} {t('orders')}</p>
        </div>
        <Link href={`/${locale}/purchases/new`}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> {t('newPurchase')}
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('totalPurchases')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalPurchases)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{tc('paid')}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('debtGenerated')}</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(totalPurchases - totalPaid)}</p>
        </div>
      </div>

      {/* Purchases table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="text-start px-5 py-3 font-medium">{t('supplier')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('products')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('total')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('paid')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('remaining')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('date')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('debt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {purchases.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">{t('noPurchases')}</td></tr>
              ) : purchases.map((p) => {
                const rest = p.totalAmount - p.paidAmount
                return (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{p.supplier.name}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                      {p.items.map((i) => `${i.product.name} ×${i.quantity}`).join(', ')}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">{formatCurrency(p.totalAmount)}</td>
                    <td className="px-5 py-3.5 text-green-600 dark:text-green-400">{formatCurrency(p.paidAmount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${rest > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(rest)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(p.purchasedAt)}</td>
                    <td className="px-5 py-3.5">
                      {p.debt ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.debt.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                          {p.debt.status === 'PAID' ? t('debtSettled') : t('debtOngoing')}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
