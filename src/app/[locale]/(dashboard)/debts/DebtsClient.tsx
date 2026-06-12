'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AlertCircle, Loader2, TrendingDown } from 'lucide-react'
import { payDebt } from '@/actions/debts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DebtStatusBadge } from '@/components/ui/Badge'

type Debt = {
  id: string; amount: number; remaining: number; status: string;
  dueDate: Date | null; createdAt: Date;
  supplier: { id: string; name: string };
  purchase: { id: string; totalAmount: number } | null;
  payments: { id: string; amount: number; paidAt: Date }[];
}

export default function DebtsClient({ debts, locale }: { debts: Debt[]; locale: string }) {
  const t = useTranslations('debts')
  const tc = useTranslations('common')
  const router = useRouter()
  const [payModal, setPayModal] = useState<Debt | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payNotes, setPayNotes] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const unpaidDebts = debts.filter((d) => d.status !== 'PAID')
  const totalRemaining = unpaidDebts.reduce((sum, d) => sum + d.remaining, 0)

  const overdue = unpaidDebts.filter((d) => d.dueDate && new Date(d.dueDate) < new Date())

  function openPay(debt: Debt) {
    setPayAmount(debt.remaining)
    setPayNotes('')
    setError('')
    setPayModal(debt)
  }

  function handlePay() {
    if (!payModal) return
    startTransition(async () => {
      const res = await payDebt(payModal.id, payAmount, payNotes)
      if (res.success) { setPayModal(null); router.refresh() }
      else setError(res.error ?? tc('error'))
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{unpaidDebts.length} {t('unpaidCount')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalDebt')}</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalRemaining)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('overdueDebts')}</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{overdue.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('title')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{debts.length}</p>
          </div>
        </div>
      </div>

      {/* Debts table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="text-start px-5 py-3 font-medium">{t('supplier')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('amount')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('remaining')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('dueDate')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('createdAt')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('status')}</th>
                <th className="text-end px-5 py-3 font-medium">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {debts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">{t('noDebts')}</td></tr>
              ) : debts.map((d) => {
                const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'PAID'
                return (
                  <tr key={d.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${isOverdue ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}>
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{d.supplier.name}</td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{formatCurrency(d.amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${d.remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(d.remaining)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {d.dueDate ? (
                        <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                          {formatDate(d.dueDate)}
                          {isOverdue && ' ⚠'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(d.createdAt)}</td>
                    <td className="px-5 py-3.5"><DebtStatusBadge status={d.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        {d.status !== 'PAID' && (
                          <button type="button" onClick={() => openPay(d)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            {t('payDebt')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('payTitle')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{payModal.supplier.name} — {t('remaining')} {formatCurrency(payModal.remaining)}</p>
            {error && <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('paymentAmount')} (MRU)</label>
                <input type="number" min={1} max={payModal.remaining} value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))}
                  title={t('paymentAmount')} placeholder="0"
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('paymentNotes')}</label>
                <input value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                  title={t('paymentNotes')} placeholder="Notes optionnelles"
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700">{tc('cancel')}</button>
              <button type="button" onClick={handlePay} disabled={isPending || payAmount <= 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />} {tc('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
