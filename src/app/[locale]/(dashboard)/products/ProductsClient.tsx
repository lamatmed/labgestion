'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Search, Edit2, Trash2, Loader2, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { createProduct, updateProduct, deleteProduct } from '@/actions/products'
import { formatCurrency } from '@/lib/utils'
import { StockBadge } from '@/components/ui/Badge'
import type { Product } from '@prisma/client'

type FormData = {
  name: string; reference: string; category: string; unit: string;
  quantity: number; minQuantity: number; unitPrice: number;
}

export default function ProductsClient({ products, locale }: { products: Product[]; locale: string }) {
  const t = useTranslations('products')
  const tc = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; product?: Product } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const filtered = products.filter((p) =>
    [p.name, p.reference, p.category].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  )

  const lowStock = products.filter((p) => p.quantity <= p.minQuantity).length

  function openCreate() {
    reset({ name: '', reference: '', category: '', unit: 'unité', quantity: 0, minQuantity: 0, unitPrice: 0 })
    setError('')
    setModal({ mode: 'create' })
  }

  function openEdit(product: Product) {
    reset({
      name: product.name, reference: product.reference ?? '', category: product.category ?? '',
      unit: product.unit, quantity: product.quantity, minQuantity: product.minQuantity, unitPrice: product.unitPrice,
    })
    setError('')
    setModal({ mode: 'edit', product })
  }

  function onSubmit(data: FormData) {
    setError('')
    startTransition(async () => {
      const res = modal?.mode === 'edit' && modal.product
        ? await updateProduct(modal.product.id, data)
        : await createProduct(data)
      if (res.success) { setModal(null); router.refresh() }
      else setError(res.error ?? tc('error'))
    })
  }

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      await deleteProduct(deleteId)
      setDeleteId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {products.length} {t('registered')}
            {lowStock > 0 && <span className="text-amber-600 dark:text-amber-400 ms-2">· {lowStock} {t('lowStockCount')}</span>}
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> {t('addProduct')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="relative max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tc('search')}
              className="w-full ps-9 pe-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="text-start px-5 py-3 font-medium">{t('productName')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('category')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('currentStock')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('minStock')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('unitPrice')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('stockStatus')}</th>
                <th className="text-end px-5 py-3 font-medium">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">{tc('noResults')}</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                        {p.reference && <p className="text-xs text-gray-400">{p.reference}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{p.category ?? '—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">{p.quantity} {p.unit}</td>
                  <td className="px-5 py-3.5 text-gray-400">{p.minQuantity} {p.unit}</td>
                  <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{formatCurrency(p.unitPrice)}</td>
                  <td className="px-5 py-3.5"><StockBadge quantity={p.quantity} min={p.minQuantity} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">{modal.mode === 'create' ? t('addProduct') : t('editProduct')}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>}
              {[
                { label: t('productName'), name: 'name' as const, required: true },
                { label: t('reference'), name: 'reference' as const },
                { label: t('category'), name: 'category' as const },
                { label: t('unit'), name: 'unit' as const, required: true },
              ].map(({ label, name, required }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}{required && ' *'}</label>
                  <input {...register(name, { required: required ? tc('required') : false })}
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>}
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('currentStock'), name: 'quantity' as const },
                  { label: t('minStock'), name: 'minQuantity' as const },
                  { label: t('unitPrice'), name: 'unitPrice' as const },
                ].map(({ label, name }) => (
                  <div key={name}>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                    <input type="number" step="0.01" {...register(name, { valueAsNumber: true })}
                      className="w-full px-2.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700">{tc('cancel')}</button>
                <button type="submit" disabled={isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />} {tc('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-fade-in">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{tc('confirmDelete')}</h3>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">{tc('cancel')}</button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />} {tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
