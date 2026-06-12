'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Plus, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { createOrder } from '@/actions/orders'
import { formatCurrency } from '@/lib/utils'
import type { Patient, AnalysisType } from '@prisma/client'

export default function NewOrderForm({
  patients, analyses, locale, defaultPatientId,
}: {
  patients: Patient[]; analyses: AnalysisType[]; locale: string; defaultPatientId?: string
}) {
  const t = useTranslations('orders')
  const tc = useTranslations('common')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [patientId, setPatientId] = useState(defaultPatientId ?? '')
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([])
  const [analysisSearch, setAnalysisSearch] = useState('')
  const [paidAmount, setPaidAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH')
  const [notes, setNotes] = useState('')

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const filteredAnalyses = analyses.filter((a) =>
    `${a.name} ${a.code} ${a.category ?? ''}`.toLowerCase().includes(analysisSearch.toLowerCase())
  )

  const selectedAnalysisObjects = analyses.filter((a) => selectedAnalyses.includes(a.id))
  const totalAmount = selectedAnalysisObjects.reduce((sum, a) => sum + a.price, 0)

  function toggleAnalysis(id: string) {
    setSelectedAnalyses((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) { setError(t('selectPatientError')); return }
    if (selectedAnalyses.length === 0) { setError(t('selectAnalysesError')); return }

    setError('')
    startTransition(async () => {
      const res = await createOrder({ patientId, analysisIds: selectedAnalyses, paidAmount, paymentMethod, notes })
      if (res.success) router.push(`/${locale}/orders/${res.orderId}`)
      else setError(res.error ?? tc('error'))
    })
  }

  const selectedPatient = patients.find((p) => p.id === patientId)

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/orders`} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('newOrder')}</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('selectPatient')}</h2>
            <div className="relative mb-3">
              <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder={t('searchPatient')}
                className="w-full ps-9 pe-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {filteredPatients.map((p) => (
                <button key={p.id} type="button" onClick={() => setPatientId(p.id)}
                  className={`w-full text-start px-3 py-2.5 rounded-xl text-sm transition-colors ${patientId === p.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>
                  <p className="font-medium">{p.firstName} {p.lastName}</p>
                  <p className={`text-xs ${patientId === p.id ? 'text-blue-100' : 'text-gray-400'}`}>{p.phone}</p>
                </button>
              ))}
            </div>
            <Link href={`/${locale}/patients/new`} className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
              <Plus className="w-3.5 h-3.5" /> {t('newPatient')}
            </Link>
          </div>

          {/* Analyses selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('selectAnalyses')}</h2>
            <div className="relative mb-3">
              <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={analysisSearch} onChange={(e) => setAnalysisSearch(e.target.value)} placeholder={t('searchAnalysis')}
                className="w-full ps-9 pe-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {filteredAnalyses.map((a) => {
                const selected = selectedAnalyses.includes(a.id)
                return (
                  <button key={a.id} type="button" onClick={() => toggleAnalysis(a.id)}
                    className={`w-full text-start px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between gap-2 ${selected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className={`text-xs ${selected ? 'text-blue-100' : 'text-gray-400'}`}>{a.code} {a.category ? `· ${a.category}` : ''}</p>
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${selected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{formatCurrency(a.price)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Order summary + payment */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('paymentSummary')}</h2>

          {selectedAnalysisObjects.length > 0 && (
            <div className="space-y-1.5">
              {selectedAnalysisObjects.map((a) => (
                <div key={a.id} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{a.name}</span>
                  <span>{formatCurrency(a.price)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-slate-700">
                <span>{tc('total')}</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('paidAmountLabel')}</label>
              <input type="number" min={0} max={totalAmount} value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('paymentMethodLabel')}</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="CASH">{t('paymentMethod.CASH')}</option>
                <option value="CARD">{t('paymentMethod.CARD')}</option>
                <option value="BANK_TRANSFER">{t('paymentMethod.BANK_TRANSFER')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tc('notes')} ({tc('optional')})</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {paidAmount < totalAmount && totalAmount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
              {t('debtAutoCreate', { amount: formatCurrency(totalAmount - paidAmount) })}
            </div>
          )}

          {selectedPatient && (
            <p className="text-xs text-gray-400">{t('selectPatient')}: <strong className="text-gray-700 dark:text-gray-300">{selectedPatient.firstName} {selectedPatient.lastName}</strong></p>
          )}

          <div className="flex gap-3 pt-2">
            <Link href={`/${locale}/orders`} className="flex-1 text-center py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              {tc('cancel')}
            </Link>
            <button type="submit" disabled={isPending || !patientId || selectedAnalyses.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white rounded-xl text-sm font-medium transition-colors">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {tc('add')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
