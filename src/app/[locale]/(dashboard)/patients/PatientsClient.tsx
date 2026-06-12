'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Patient } from '@prisma/client'
import { createPatient, updatePatient, deletePatient } from '@/actions/patients'
import { Badge } from '@/components/ui/Badge'
import { formatDate, calculateAge, getInitials } from '@/lib/utils'
import {
  Plus, Search, Edit2, Trash2, Eye, X, Loader2, User as UserIcon,
} from 'lucide-react'

const PatientSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  dateOfBirth: z.string().min(1),
  gender: z.enum(['M', 'F']),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
})
type PatientForm = z.infer<typeof PatientSchema>

interface Props {
  patients: Patient[]
  locale: string
}

export default function PatientsClient({ patients, locale }: Props) {
  const t = useTranslations('patients')
  const tc = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientForm>({ resolver: zodResolver(PatientSchema) })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return patients
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.phone.includes(q),
    )
  }, [patients, search])

  function openCreate() {
    setEditingPatient(null)
    reset({ firstName: '', lastName: '', dateOfBirth: '', gender: 'M', phone: '', email: '', address: '' })
    setFormError(null)
    setFormSuccess(null)
    setModalOpen(true)
  }

  function openEdit(patient: Patient) {
    setEditingPatient(patient)
    reset({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: new Date(patient.dateOfBirth).toISOString().split('T')[0],
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email ?? '',
      address: patient.address ?? '',
    })
    setFormError(null)
    setFormSuccess(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingPatient(null)
    setFormError(null)
    setFormSuccess(null)
  }

  async function onSubmit(data: PatientForm) {
    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)
    try {
      const result = editingPatient
        ? await updatePatient(editingPatient.id, data)
        : await createPatient(data)

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
      const result = await deletePatient(deleteTarget.id)
      if (result.success) {
        router.refresh()
        setDeleteTarget(null)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {patients.length} {t('registered')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addPatient')}
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
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('fullName')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('phone')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('gender')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('age')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('registeredOn')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-slate-500">
                    <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>{tc('noResults')}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {getInitials(`${patient.firstName} ${patient.lastName}`)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{patient.phone}</td>
                    <td className="px-4 py-3">
                      <Badge variant={patient.gender === 'M' ? 'info' : 'purple'}>
                        {patient.gender === 'M' ? t('male') : t('female')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                      {calculateAge(patient.dateOfBirth)} {tc('years')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                      {formatDate(patient.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/${locale}/patients/${patient.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors"
                          title={tc('view')}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEdit(patient)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition-colors"
                          title={tc('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(patient)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                          title={tc('delete')}
                        >
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
                {editingPatient ? t('editPatient') : t('addPatient')}
              </h2>
              <button type="button" onClick={closeModal} title={tc('close')} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {formError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('firstName')} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('firstName')} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('lastName')} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('lastName')} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('dateOfBirth')} <span className="text-red-500">*</span>
                  </label>
                  <input type="date" {...register('dateOfBirth')} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('gender')} <span className="text-red-500">*</span>
                  </label>
                  <select {...register('gender')} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="M">{t('male')}</option>
                    <option value="F">{t('female')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {tc('phone')} <span className="text-red-500">*</span>
                </label>
                <input type="tel" {...register('phone')} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{tc('email')}</label>
                <input type="email" {...register('email')} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{tc('address')}</label>
                <textarea {...register('address')} rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  {tc('cancel')}
                </button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPatient ? tc('save') : tc('add')}
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
                <p className="text-sm text-gray-500 dark:text-slate-400">{t('deleteWarning')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
              {t('areYouSure')}{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>{' '}?
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
