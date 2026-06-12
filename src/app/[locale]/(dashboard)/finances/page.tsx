import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Trash2 } from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'
import ExpenseForm from './ExpenseForm'
import DeleteExpenseButton from './DeleteExpenseButton'

export default async function FinancesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('finances')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [totalRevenue, monthRevenue, totalExpenses, monthExpenses, totalDebts, expenses] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { date: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.debt.aggregate({ where: { status: { not: 'PAID' } }, _sum: { remaining: true } }),
    prisma.expense.findMany({ orderBy: { date: 'desc' }, take: 50 }),
  ])

  const revenue = totalRevenue._sum.amount ?? 0
  const expenses_ = totalExpenses._sum.amount ?? 0
  const profit = revenue - expenses_
  const debts = totalDebts._sum.remaining ?? 0
  const mRevenue = monthRevenue._sum.amount ?? 0
  const mExpenses = monthExpenses._sum.amount ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title={t('revenue')} value={formatCurrency(revenue)} icon={TrendingUp} color="green" />
        <StatsCard title={t('expenses')} value={formatCurrency(expenses_)} icon={TrendingDown} color="red" />
        <StatsCard title={t('profit')} value={formatCurrency(profit)} icon={DollarSign} color={profit >= 0 ? 'green' : 'red'} />
        <StatsCard title={t('debts')} value={formatCurrency(debts)} icon={AlertCircle} color="amber" />
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('thisMonth')}</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('revenue')}</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(mRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('expenses')}</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(mExpenses)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-100 dark:border-slate-700 pt-3">
              <span className="text-gray-700 dark:text-gray-300 font-medium">{t('profit')}</span>
              <span className={`font-bold text-base ${mRevenue - mExpenses >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(mRevenue - mExpenses)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('addExpense')}</h2>
          <ExpenseForm locale={locale} />
        </div>
      </div>

      {/* Expenses list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('expensesList')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="text-start px-5 py-3 font-medium">{t('descriptionLabel')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('categoryLabel')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('amountLabel')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('dateLabel')}</th>
                <th className="text-end px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">{t('noExpenses')}</td></tr>
              ) : expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{e.description}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{e.category ?? '—'}</td>
                  <td className="px-5 py-3.5 text-red-600 dark:text-red-400 font-semibold">{formatCurrency(e.amount)}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(e.date)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <DeleteExpenseButton id={e.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
