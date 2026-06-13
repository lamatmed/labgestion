'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle, XCircle, Plus, FileText, Loader2, Download, Package, AlertTriangle } from 'lucide-react'
import { addPayment, saveResults, completeOrder, cancelOrder } from '@/actions/orders'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/ui/Badge'
import Link from 'next/link'

type OrderDetail = {
  id: string; status: string; totalAmount: number; paidAmount: number;
  orderedAt: Date; completedAt: Date | null; notes: string | null;
  patient: { id: string; firstName: string; lastName: string; phone: string; dateOfBirth: Date; gender: string };
  analyses: Array<{
    id: string; result: string | null; flag: string | null; unit: string | null; refRange: string | null; completedAt: Date | null;
    analysisType: {
      name: string; code: string; price: number;
      reagents: Array<{
        productId: string; quantityPerTest: number;
        product: { id: string; name: string; unit: string; quantity: number };
      }>;
    };
  }>;
  payments: Array<{ id: string; amount: number; method: string; paidAt: Date; notes: string | null }>;
}

const FLAG_COLORS: Record<string, string> = {
  NORMAL: 'text-green-600 dark:text-green-400',
  HIGH: 'text-red-600 dark:text-red-400',
  LOW: 'text-blue-600 dark:text-blue-400',
}

export default function OrderDetailClient({ order, locale }: { order: OrderDetail; locale: string }) {
  const t = useTranslations('orders')
  const tc = useTranslations('common')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Aggregate reagent consumption across all analyses in this order
  const reagentConsumption = (() => {
    const map = new Map<string, { product: { name: string; unit: string; quantity: number }; total: number }>()
    for (const item of order.analyses) {
      for (const r of item.analysisType.reagents) {
        const existing = map.get(r.productId)
        if (existing) {
          existing.total += r.quantityPerTest
        } else {
          map.set(r.productId, { product: r.product, total: r.quantityPerTest })
        }
      }
    }
    return Array.from(map.values())
  })()
  const [results, setResults] = useState<Record<string, { result: string; flag: '' | 'NORMAL' | 'HIGH' | 'LOW' }>>(
    Object.fromEntries(order.analyses.map((a) => [a.id, { result: a.result ?? '', flag: (a.flag ?? '') as any }]))
  )
  const [payAmount, setPayAmount] = useState<number | ''>('')
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH')
  const [payNotes, setPayNotes] = useState('')
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [error, setError] = useState('')

  const remaining = order.totalAmount - order.paidAmount
  const canEdit = order.status !== 'COMPLETED' && order.status !== 'CANCELLED'

  function handleSaveResults() {
    startTransition(async () => {
      const res = await saveResults(order.id, Object.entries(results).map(([id, r]) => ({
        id, result: r.result, flag: r.flag || null,
      })))
      if (!res.success) setError(res.error ?? tc('error'))
      else router.refresh()
    })
  }

  function handleComplete() {
    startTransition(async () => {
      const res = await completeOrder(order.id)
      if (!res.success) setError(res.error ?? tc('error'))
      else router.refresh()
    })
  }

  function handleCancel() {
    if (!confirm(t('cancelConfirm'))) return
    startTransition(async () => {
      await cancelOrder(order.id)
      router.refresh()
    })
  }

  function handlePay() {
    const amount = Number(payAmount)
    if (!amount || amount <= 0) return
    startTransition(async () => {
      const res = await addPayment(order.id, amount, payMethod, payNotes)
      if (res.success) { setPayModalOpen(false); setPayAmount(''); router.refresh() }
      else setError(res.error ?? tc('error'))
    })
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>
      )}

      {/* Patient + summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">{tc('patient')}</h3>
          <Link href={`/${locale}/patients/${order.patient.id}`} className="font-semibold text-lg text-blue-600 dark:text-blue-400 hover:underline">
            {order.patient.firstName} {order.patient.lastName}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{order.patient.phone}</p>
          {order.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">{tc('notes')}: {order.notes}</p>}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">{t('paymentSection')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{tc('total')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{tc('paid')}</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 dark:border-slate-700 pt-2">
              <span className="text-gray-500 dark:text-gray-400">{tc('remaining')}</span>
              <span className={`font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
          {remaining > 0 && canEdit && (
            <button type="button" onClick={() => setPayModalOpen(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors">
              <Plus className="w-3.5 h-3.5" /> {t('addPayment')}
            </button>
          )}
        </div>
      </div>

      {/* Analyses / Results */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('results')}</h3>
          <div className="flex gap-2">
            {canEdit && (
              <button type="button" onClick={handleSaveResults} disabled={isPending}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors">
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {tc('save')}
              </button>
            )}
            <Link href={`/${locale}/orders/${order.id}/report`}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Download className="w-3.5 h-3.5" /> {t('downloadReport')}
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="text-start px-5 py-3 font-medium">{t('analysisLabel')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('result')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('unit')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('normalValues')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('flagLabel')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('price')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {order.analyses.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{a.analysisType.name}</p>
                    <p className="text-xs text-gray-400">{a.analysisType.code}</p>
                  </td>
                  <td className="px-5 py-3">
                    {canEdit ? (
                      <input value={results[a.id]?.result ?? ''} onChange={(e) => setResults((prev) => ({ ...prev, [a.id]: { ...prev[a.id], result: e.target.value } }))}
                        className="w-28 px-2.5 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    ) : (
                      <span className={`font-medium ${a.flag ? FLAG_COLORS[a.flag] : 'text-gray-700 dark:text-gray-300'}`}>{a.result ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{a.unit ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{a.refRange ?? '—'}</td>
                  <td className="px-5 py-3">
                    {canEdit ? (
                      <select value={results[a.id]?.flag ?? ''} onChange={(e) => setResults((prev) => ({ ...prev, [a.id]: { ...prev[a.id], flag: e.target.value as any } }))}
                        className="px-2.5 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">—</option>
                        <option value="NORMAL">{t('flag.NORMAL')}</option>
                        <option value="HIGH">{t('flag.HIGH')}</option>
                        <option value="LOW">{t('flag.LOW')}</option>
                      </select>
                    ) : (
                      a.flag ? <span className={`text-xs font-medium ${FLAG_COLORS[a.flag]}`}>{t(`flag.${a.flag}` as any)}</span> : <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs font-medium">{formatCurrency(a.analysisType.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment history */}
      {order.payments.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('paymentHistory')}</h3>
            <Link href={`/${locale}/orders/${order.id}/receipt`}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <FileText className="w-3.5 h-3.5" /> {t('downloadReceipt')}
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {order.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(p.paidAt)} · {t(`paymentMethod.${p.method}` as any)}</p>
                </div>
                {p.notes && <p className="text-xs text-gray-400 italic">{p.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reagent consumption preview — shown only when order is not yet complete */}
      {canEdit && reagentConsumption.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Réactifs consommés à la validation
            </span>
          </div>
          <div className="space-y-1.5">
            {reagentConsumption.map((r) => {
              const insufficient = r.product.quantity < r.total
              return (
                <div key={r.product.name} className="flex items-center justify-between text-sm">
                  <span className="text-amber-900 dark:text-amber-200">{r.product.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${insufficient ? 'text-red-600 dark:text-red-400' : 'text-amber-800 dark:text-amber-300'}`}>
                      −{r.total} {r.product.unit}
                    </span>
                    <span className="text-amber-600 dark:text-amber-500 text-xs">
                      (stock: {r.product.quantity})
                    </span>
                    {insufficient && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleComplete} disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors">
            <CheckCircle className="w-4 h-4" /> {t('markCompleted')}
          </button>
          <button type="button" onClick={handleCancel} disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-sm font-medium rounded-xl transition-colors hover:bg-red-100 dark:hover:bg-red-950/50">
            <XCircle className="w-4 h-4" /> {t('cancelOrder')}
          </button>
        </div>
      )}

      {/* Payment modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('addPayment')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('paymentAmount', { amount: formatCurrency(remaining) })}
                </label>
                <input
                  type="number"
                  min={1}
                  max={remaining}
                  value={payAmount}
                  placeholder={String(remaining)}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('paymentMode')}</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="CASH">{t('paymentMethod.CASH')}</option>
                  <option value="CARD">{t('paymentMethod.CARD')}</option>
                  <option value="BANK_TRANSFER">{t('paymentMethod.BANK_TRANSFER')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tc('notes')}</label>
                <input value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setPayModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700">{tc('cancel')}</button>
              <button type="button" onClick={handlePay} disabled={isPending || !payAmount || Number(payAmount) <= 0}
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
