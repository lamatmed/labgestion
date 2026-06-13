'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AnalysisType } from '@prisma/client'
import { createAnalysisType, updateAnalysisType, deleteAnalysisType } from '@/actions/analyses'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Edit2, Trash2, X, Loader2, FlaskConical, Package, PlusCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const AnalysisSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  price: z.number().positive(),
  unit: z.string().optional(),
  category: z.string().optional(),
  refRangeMin: z.number().nullable().optional(),
  refRangeMax: z.number().nullable().optional(),
  refRangeText: z.string().optional(),
})
type AnalysisForm = z.infer<typeof AnalysisSchema>

type AnalysisReagent = {
  productId: string
  quantityPerTest: number
}

type AnalysisWithReagents = AnalysisType & {
  reagents: Array<{
    id: string
    productId: string
    quantityPerTest: number
    product: { id: string; name: string; unit: string | null; unitPrice: number }
  }>
}

type Product = { id: string; name: string; unit: string; quantity: number; unitPrice: number }

function calcCost(reagents: AnalysisWithReagents['reagents']): number {
  return reagents.reduce((sum, r) => sum + r.quantityPerTest * r.product.unitPrice, 0)
}

interface Props {
  analyses: AnalysisWithReagents[]
  products: Product[]
  locale: string
}

export default function AnalysesClient({ analyses, products, locale: _locale }: Props) {
  const t = useTranslations('analyses')
  const tc = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnalysis, setEditingAnalysis] = useState<AnalysisWithReagents | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnalysisWithReagents | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  // Reagent state (managed outside RHF)
  const [reagents, setReagents] = useState<AnalysisReagent[]>([])
  const [newReagentProductId, setNewReagentProductId] = useState('')
  const [newReagentQty, setNewReagentQty] = useState('1')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AnalysisForm>({ resolver: zodResolver(AnalysisSchema) })

  const watchedPrice = watch('price') ?? 0

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return analyses
    return analyses.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.category ?? '').toLowerCase().includes(q),
    )
  }, [analyses, search])

  function openCreate() {
    setEditingAnalysis(null)
    setReagents([])
    setNewReagentProductId('')
    setNewReagentQty('1')
    reset({ name: '', code: '', price: 0, unit: '', category: '', refRangeMin: null, refRangeMax: null, refRangeText: '' })
    setFormError(null)
    setFormSuccess(null)
    setModalOpen(true)
  }

  function openEdit(analysis: AnalysisWithReagents) {
    setEditingAnalysis(analysis)
    setReagents(analysis.reagents.map((r) => ({ productId: r.productId, quantityPerTest: r.quantityPerTest })))
    setNewReagentProductId('')
    setNewReagentQty('1')
    reset({
      name: analysis.name,
      code: analysis.code,
      price: analysis.price,
      unit: analysis.unit ?? '',
      category: analysis.category ?? '',
      refRangeMin: analysis.refRangeMin ?? null,
      refRangeMax: analysis.refRangeMax ?? null,
      refRangeText: analysis.refRangeText ?? '',
    })
    setFormError(null)
    setFormSuccess(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingAnalysis(null)
    setReagents([])
    setFormError(null)
    setFormSuccess(null)
  }

  function addReagent() {
    if (!newReagentProductId || reagents.some((r) => r.productId === newReagentProductId)) return
    const qty = parseFloat(newReagentQty)
    if (isNaN(qty) || qty <= 0) return
    setReagents([...reagents, { productId: newReagentProductId, quantityPerTest: qty }])
    setNewReagentProductId('')
    setNewReagentQty('1')
  }

  function removeReagent(productId: string) {
    setReagents(reagents.filter((r) => r.productId !== productId))
  }

  async function onSubmit(data: AnalysisForm) {
    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)
    try {
      const payload = { ...data, reagents }
      const result = editingAnalysis
        ? await updateAnalysisType(editingAnalysis.id, payload)
        : await createAnalysisType(payload)

      if (!result.success) {
        setFormError(result.error ?? tc('error'))
      } else {
        setFormSuccess(tc('saveSuccess'))
        router.refresh()
        setTimeout(() => closeModal(), 800)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await deleteAnalysisType(deleteTarget.id)
      if (result.success) {
        router.refresh()
        setDeleteTarget(null)
      }
    } finally {
      setDeleting(false)
    }
  }

  function refRangeDisplay(a: AnalysisType): string {
    if (a.refRangeText) return a.refRangeText
    if (a.refRangeMin != null && a.refRangeMax != null)
      return `${a.refRangeMin} – ${a.refRangeMax} ${a.unit ?? ''}`.trim()
    return '—'
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {analyses.length} {t('configured')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addAnalysis')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('code')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('analysisName')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('category')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('unit')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('price')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('referenceRange')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('reagents')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">Rentabilité</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 dark:text-slate-500">
                    <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>{tc('noResults')}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2 py-1 rounded-lg">
                        {analysis.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{analysis.name}</td>
                    <td className="px-4 py-3">
                      {analysis.category ? (
                        <Badge variant="default">{analysis.category}</Badge>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{analysis.unit ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{formatCurrency(analysis.price)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">{refRangeDisplay(analysis)}</td>
                    <td className="px-4 py-3">
                      {analysis.reagents.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {analysis.reagents.map((r) => (
                            <span key={r.id} className="inline-flex items-center gap-1 text-[11px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-md">
                              <Package className="w-2.5 h-2.5" />
                              {r.product.name} × {r.quantityPerTest}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const cost = calcCost(analysis.reagents)
                        const profit = analysis.price - cost
                        if (analysis.reagents.length === 0) return <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
                        const pct = cost > 0 ? Math.round((profit / analysis.price) * 100) : 100
                        if (profit < 0) return (
                          <div className="flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <div>
                              <div className="text-xs font-semibold text-red-600 dark:text-red-400">{profit < 0 ? '-' : '+'}{formatCurrency(Math.abs(profit))}</div>
                              <div className="text-[10px] text-red-500">coût: {formatCurrency(cost)}</div>
                            </div>
                          </div>
                        )
                        if (profit === 0) return (
                          <div className="flex items-center gap-1">
                            <Minus className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="text-xs text-gray-500">Seuil zéro</span>
                          </div>
                        )
                        return (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <div>
                              <div className="text-xs font-semibold text-green-600 dark:text-green-400">+{formatCurrency(profit)}</div>
                              <div className="text-[10px] text-gray-500">marge {pct}%</div>
                            </div>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => openEdit(analysis)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition-colors" title={tc('edit')}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(analysis)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors" title={tc('delete')}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingAnalysis ? t('editAnalysis') : t('addAnalysis')}
              </h2>
              <button type="button" onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {formError && <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">{formError}</div>}
              {formSuccess && <div className="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm">{formSuccess}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('analysisName')} <span className="text-red-500">*</span></label>
                  <input {...register('name')} className={inputCls} />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>{t('code')} <span className="text-red-500">*</span></label>
                  <input {...register('code')} className={`${inputCls} font-mono uppercase`} style={{ textTransform: 'uppercase' }} />
                  {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('price')} <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className={inputCls} />
                  {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>{t('unit')}</label>
                  <input {...register('unit')} placeholder="ex: g/dL, mg/L" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('category')}</label>
                <input {...register('category')} placeholder="ex: Hématologie, Biochimie" className={inputCls} />
              </div>

              <div>
                <label className={`${labelCls} mb-2`}>{t('referenceRange')}</label>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{t('refRangeMin')}</label>
                    <input type="number" step="any" {...register('refRangeMin', { setValueAs: v => (v === '' || v === null || isNaN(Number(v)) ? null : Number(v)) })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{t('refRangeMax')}</label>
                    <input type="number" step="any" {...register('refRangeMax', { setValueAs: v => (v === '' || v === null || isNaN(Number(v)) ? null : Number(v)) })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{t('refRangeOr')}</label>
                  <input {...register('refRangeText')} className={inputCls} />
                </div>
              </div>

              {/* Reagents section */}
              {products.length > 0 && (
                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-amber-500" />
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('reagents')}</label>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{t('reagentsHint')}</span>
                  </div>

                  {/* Existing reagents */}
                  {reagents.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {reagents.map((r) => {
                        const prod = products.find((p) => p.id === r.productId)
                        return (
                          <div key={r.productId} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2 min-w-0">
                              <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="text-sm text-gray-900 dark:text-white truncate">{prod?.name ?? r.productId}</span>
                              <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">× {r.quantityPerTest} {prod?.unit}</span>
                              {prod && prod.unitPrice > 0 && (
                                <span className="text-xs text-gray-400 dark:text-slate-500">= {formatCurrency(r.quantityPerTest * prod.unitPrice)}</span>
                              )}
                            </div>
                            <button type="button" onClick={() => removeReagent(r.productId)} className="shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Add reagent row */}
                  <div className="flex gap-2">
                    <select
                      value={newReagentProductId}
                      onChange={(e) => setNewReagentProductId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('selectProduct')}</option>
                      {products
                        .filter((p) => !reagents.some((r) => r.productId === p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.unit}) — {formatCurrency(p.unitPrice)}/unité — stock: {p.quantity}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      value={newReagentQty}
                      onChange={(e) => setNewReagentQty(e.target.value)}
                      placeholder="Qté"
                      className="w-20 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addReagent}
                      disabled={!newReagentProductId}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Live profitability preview */}
                  {reagents.length > 0 && (() => {
                    const cost = reagents.reduce((s, r) => {
                      const prod = products.find((p) => p.id === r.productId)
                      return s + r.quantityPerTest * (prod?.unitPrice ?? 0)
                    }, 0)
                    const price = Number(watchedPrice) || 0
                    const profit = price - cost
                    const profitable = profit >= 0
                    return (
                      <div className={`mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border ${profitable ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                        {profitable ? <TrendingUp className="w-4 h-4 shrink-0" /> : <TrendingDown className="w-4 h-4 shrink-0" />}
                        <span>Coût réactifs : <strong>{formatCurrency(cost)}</strong></span>
                        <span className="ml-auto font-bold">{profit >= 0 ? '+' : ''}{formatCurrency(profit)}</span>
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  {tc('cancel')}
                </button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAnalysis ? tc('save') : tc('add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('deleteTitle')}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{tc('irreversible')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
              {tc('confirmDelete')}{' '}
              <span className="font-medium text-gray-900 dark:text-white">{deleteTarget.name}</span> ?
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                {tc('cancel')}
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium transition-colors">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
