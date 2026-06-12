'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { createPurchase } from '@/actions/purchases'

type Supplier = { id: string; name: string }
type Product = { id: string; name: string; price: number; unit: string | null }
type LineItem = { productId: string; quantity: number; unitPrice: number }

export default function NewPurchaseForm({
  locale, suppliers, products,
}: {
  locale: string; suppliers: Supplier[]; products: Product[]
}) {
  const t = useTranslations('purchases')
  const tc = useTranslations('common')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [paidAmount, setPaidAmount] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1, unitPrice: 0 }])

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  function addItem() {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    const updated = items.map((item, i) => {
      if (i !== idx) return item
      if (field === 'productId') {
        const prod = products.find((p) => p.id === value)
        return { ...item, productId: value as string, unitPrice: prod?.price ?? 0 }
      }
      return { ...item, [field]: Number(value) }
    })
    setItems(updated)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId || items.some((i) => !i.productId)) {
      setError(t('supplierError'))
      return
    }
    setError('')
    startTransition(async () => {
      const res = await createPurchase({
        supplierId, paidAmount, dueDate: dueDate || undefined, notes: notes || undefined, items,
      })
      if (res.success) router.push(`/${locale}/purchases`)
      else setError(res.error ?? tc('error'))
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('newPurchase')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>}

        {/* Supplier */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('supplierLabel')}</h2>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t('selectSupplier')} *</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('productsLabel')}</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> {t('addItem')}
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <select value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{tc('select')} *</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} placeholder={t('qty')} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-3">
                  <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} placeholder={t('unitPrice')} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title={t('removeItem')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-700">
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('orderTotal')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total.toLocaleString()} {tc('mru')}</p>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('payment')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('paidAmount')}</label>
              <input type="number" min={0} max={total} value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('dueDate')}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {total - paidAmount > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl text-sm">
              {t('debtAutoMsg', { amount: (total - paidAmount).toLocaleString() })}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tc('notes')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            {tc('cancel')}
          </button>
          <button type="submit" disabled={isPending || total === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />} {t('saveOrder')}
          </button>
        </div>
      </form>
    </div>
  )
}
