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
import { Plus, Search, Edit2, Trash2, X, Loader2, FlaskConical } from 'lucide-react'

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

interface Props {
  analyses: AnalysisType[]
  locale: string
}

export default function AnalysesClient({ analyses, locale: _locale }: Props) {
  const t = useTranslations('analyses')
  const tc = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnalysis, setEditingAnalysis] = useState<AnalysisType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnalysisType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnalysisForm>({ resolver: zodResolver(AnalysisSchema) })

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
    reset({ name: '', code: '', price: 0, unit: '', category: '', refRangeMin: null, refRangeMax: null, refRangeText: '' })
    setFormError(null)
    setFormSuccess(null)
    setModalOpen(true)
  }

  function openEdit(analysis: AnalysisType) {
    setEditingAnalysis(analysis)
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
    setFormError(null)
    setFormSuccess(null)
  }

  async function onSubmit(data: AnalysisForm) {
    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)
    try {
      const result = editingAnalysis
        ? await updateAnalysisType(editingAnalysis.id, data)
        : await createAnalysisType(data)

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
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-slate-500">
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
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(analysis)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition-colors" title={tc('edit')}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(analysis)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors" title={tc('delete')}>
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
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {formError && <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">{formError}</div>}
              {formSuccess && <div className="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm">{formSuccess}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('analysisName')} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('name')} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('code')} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('code')} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" style={{ textTransform: 'uppercase' }} />
                  {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('price')} <span className="text-red-500">*</span>
                  </label>
                  <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('unit')}</label>
                  <input {...register('unit')} placeholder="ex: g/dL, mg/L" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('category')}</label>
                <input {...register('category')} placeholder="ex: Hématologie, Biochimie" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('referenceRange')}</label>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{t('refRangeMin')}</label>
                    <input type="number" step="any" {...register('refRangeMin', { setValueAs: v => (v === '' || v === null || isNaN(Number(v)) ? null : Number(v)) })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{t('refRangeMax')}</label>
                    <input type="number" step="any" {...register('refRangeMax', { setValueAs: v => (v === '' || v === null || isNaN(Number(v)) ? null : Number(v)) })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{t('refRangeOr')}</label>
                  <input {...register('refRangeText')} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

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
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
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
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                {tc('cancel')}
              </button>
              <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium transition-colors">
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
