'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Search, Edit2, Trash2, Eye, X, Loader2, Truck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { createSupplier, updateSupplier, deleteSupplier } from '@/actions/suppliers'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

type SupplierWithMeta = {
  id: string; name: string; phone: string | null; email: string | null;
  address: string | null; createdAt: Date;
  _count: { purchases: number; debts: number };
  debts: { remaining: number }[];
}

type FormData = { name: string; phone: string; email: string; address: string }

export default function SuppliersClient({ suppliers, locale }: { suppliers: SupplierWithMeta[]; locale: string }) {
  const t = useTranslations('suppliers')
  const tc = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; supplier?: SupplierWithMeta } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const filtered = suppliers.filter((s) =>
    [s.name, s.phone, s.email].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  )

  function openCreate() {
    reset({ name: '', phone: '', email: '', address: '' })
    setError('')
    setModal({ mode: 'create' })
  }

  function openEdit(supplier: SupplierWithMeta) {
    reset({ name: supplier.name, phone: supplier.phone ?? '', email: supplier.email ?? '', address: supplier.address ?? '' })
    setError('')
    setModal({ mode: 'edit', supplier })
  }

  function onSubmit(data: FormData) {
    setError('')
    startTransition(async () => {
      const res = modal?.mode === 'edit' && modal.supplier
        ? await updateSupplier(modal.supplier.id, data)
        : await createSupplier(data)
      if (res.success) { setModal(null); router.refresh() }
      else setError(res.error ?? tc('error'))
    })
  }

  function confirmDelete(id: string) { setDeleteId(id) }

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      await deleteSupplier(deleteId)
      setDeleteId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{suppliers.length} {t('registered')}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> {t('addSupplier')}
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
                <th className="text-start px-5 py-3 font-medium">{tc('name')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('phone')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('purchaseHistory')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('totalDebt')}</th>
                <th className="text-end px-5 py-3 font-medium">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 dark:text-gray-500">{tc('noResults')}</td></tr>
              ) : filtered.map((s) => {
                const totalDebt = s.debts.reduce((sum, d) => sum + d.remaining, 0)
                return (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                          <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                          {s.email && <p className="text-xs text-gray-400">{s.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">{s.phone ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">{s._count.purchases}</td>
                    <td className="px-5 py-3.5">
                      {totalDebt > 0
                        ? <span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(totalDebt)}</span>
                        : <span className="text-green-600 dark:text-green-400 text-xs">{t('noDebts')}</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/${locale}/suppliers/${s.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => confirmDelete(s.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{modal.mode === 'create' ? t('addSupplier') : t('editSupplier')}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>}
              {[
                { label: tc('name'), name: 'name' as const, required: true },
                { label: tc('phone'), name: 'phone' as const },
                { label: tc('email'), name: 'email' as const, type: 'email' },
                { label: tc('address'), name: 'address' as const },
              ].map(({ label, name, required, type }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}{required && ' *'}</label>
                  <input type={type ?? 'text'} {...register(name, { required: required ? tc('required') : false })}
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  {tc('cancel')}
                </button>
                <button type="submit" disabled={isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />} {tc('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-fade-in">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{tc('confirmDelete')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('deleteConfirm')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">{tc('cancel')}</button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />} {tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
