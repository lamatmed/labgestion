'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { createExpense } from '@/actions/expenses'

const CATEGORIES = ['SALARY', 'RENT', 'UTILITIES', 'EQUIPMENT', 'SUPPLIES', 'MAINTENANCE', 'OTHER']

export default function ExpenseForm({ locale: _locale }: { locale: string }) {
  const t = useTranslations('finances')
  const tc = useTranslations('common')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    description: '', amount: '', category: 'OTHER',
    date: new Date().toISOString().split('T')[0],
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setError('')
    startTransition(async () => {
      const res = await createExpense({
        description: form.description,
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
      })
      if (res.success) {
        setForm({ description: '', amount: '', category: 'OTHER', date: new Date().toISOString().split('T')[0] })
        router.refresh()
      } else {
        setError(res.error ?? tc('error'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        placeholder={t('expenseDescription')} value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })} required
        className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number" placeholder={t('expenseAmount')} value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })} required min={0}
          className="px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required
          title={t('expenseDate')}
          className="px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
        title={t('expenseCategory')}
        aria-label={t('expenseCategory')}
        className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{t(`expenseCategories.${c}` as any)}</option>
        ))}
      </select>
      <button type="submit" disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors">
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />} {t('addButton')}
      </button>
    </form>
  )
}
