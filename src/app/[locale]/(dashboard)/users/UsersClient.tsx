'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { User } from '@prisma/client'
import { createUser, updateUser, deleteUser } from '@/actions/users'
import { Badge } from '@/components/ui/Badge'
import { formatDate, getInitials } from '@/lib/utils'
import { Plus, Search, Edit2, Trash2, X, Loader2, User as UserIcon, ShieldCheck, Eye, EyeOff, Key } from 'lucide-react'
import { updateUserPermissions } from '@/actions/users'
import { ALL_PAGES } from '@/lib/permissions'

const PAGE_LABELS: Record<string, string> = {
  patients: 'Patients',
  analyses: "Types d'analyses",
  orders: 'Ordonnances',
  suppliers: 'Fournisseurs',
  products: 'Produits',
  purchases: 'Achats',
  debts: 'Dettes',
  finances: 'Finances',
}

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'TECHNICIAN']),
})

const EditUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'TECHNICIAN']),
})

type UserCreateForm = z.infer<typeof CreateUserSchema>
type UserEditForm = z.infer<typeof EditUserSchema>

interface Props {
  users: User[]
  currentUserId: string
  locale: string
}

export default function UsersClient({ users, currentUserId, locale }: Props) {
  const t = useTranslations('users')
  const tc = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const [permissionsTarget, setPermissionsTarget] = useState<User | null>(null)
  const [localPerms, setLocalPerms] = useState<string[]>([])
  const [savingPerms, setSavingPerms] = useState(false)

  const schema = editingUser ? EditUserSchema : CreateUserSchema
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserCreateForm | UserEditForm>({ resolver: zodResolver(schema) })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    )
  }, [users, search])

  function openCreate() {
    setEditingUser(null)
    setChangePassword(false)
    setShowPassword(false)
    reset({ name: '', email: '', password: '', role: 'TECHNICIAN' })
    setFormError(null)
    setFormSuccess(null)
    setModalOpen(true)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setChangePassword(false)
    setShowPassword(false)
    reset({ name: user.name, email: user.email, password: '', role: user.role })
    setFormError(null)
    setFormSuccess(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingUser(null)
    setFormError(null)
    setFormSuccess(null)
  }

  async function onSubmit(data: UserCreateForm | UserEditForm) {
    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)
    try {
      let result: { success: boolean; error?: string }
      if (editingUser) {
        const payload: { name: string; email: string; role: 'ADMIN' | 'TECHNICIAN'; password?: string } = {
          name: data.name,
          email: data.email,
          role: data.role,
        }
        if (changePassword && data.password) {
          payload.password = data.password
        }
        result = await updateUser(editingUser.id, payload)
      } else {
        result = await createUser(data as UserCreateForm)
      }

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

  function openPermissions(u: User) {
    setPermissionsTarget(u)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (u as any).permissions as string[] | undefined
    setLocalPerms(existing && existing.length > 0 ? existing : [...ALL_PAGES])
  }

  async function handleSavePermissions() {
    if (!permissionsTarget) return
    setSavingPerms(true)
    try {
      const res = await updateUserPermissions(permissionsTarget.id, localPerms)
      if (res.success) { router.refresh(); setPermissionsTarget(null) }
    } finally {
      setSavingPerms(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await deleteUser(deleteTarget.id)
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
            {users.length} {t('registered')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addUser')}
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
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('user')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('email')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('role')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{t('createdAt')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 dark:text-slate-500">
                    <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>{tc('noResults')}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                          user.role === 'ADMIN'
                            ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                            : 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400'
                        }`}>
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          {user.id === currentUserId && (
                            <p className="text-xs text-blue-500 dark:text-blue-400">{tc('you')}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'ADMIN' ? 'info' : 'success'}>
                        {user.role === 'ADMIN' ? (
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {t('roles.ADMIN')}
                          </span>
                        ) : (
                          t('roles.TECHNICIAN')
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {user.role === 'TECHNICIAN' && (
                          <button
                            type="button"
                            onClick={() => openPermissions(user)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors"
                            title={t('permissions')}
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition-colors"
                          title={tc('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user)}
                          disabled={user.id === currentUserId}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={user.id === currentUserId ? t('cannotDeleteSelf') : tc('delete')}
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
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUser ? t('editUser') : t('addUser')}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {t('fullName')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {tc('email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {t('role')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('role')}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TECHNICIAN">{t('roles.TECHNICIAN')}</option>
                  <option value="ADMIN">{t('roles.ADMIN')}</option>
                </select>
              </div>

              {/* Password section */}
              {editingUser ? (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300">{t('changePassword')}</span>
                  </label>
                  {changePassword && (
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        placeholder={t('newPassword')}
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {errors.password && (
                        <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('newPassword')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? tc('save') : tc('add')}
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
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal (TECHNICIAN only) */}
      {permissionsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPermissionsTarget(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('permissionsTitle')}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{permissionsTarget.name}</p>
              </div>
              <button type="button" onClick={() => setPermissionsTarget(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">{t('permissionsDesc')}</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PAGES.map((page) => {
                  const checked = localPerms.includes(page)
                  return (
                    <label key={page} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700' : 'border-gray-200 dark:border-slate-700 hover:border-blue-200'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setLocalPerms(e.target.checked ? [...localPerms, page] : localPerms.filter((p) => p !== page))}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${checked ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-slate-300'}`}>
                        {PAGE_LABELS[page]}
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button type="button" onClick={() => setPermissionsTarget(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  {tc('cancel')}
                </button>
                <button type="button" onClick={handleSavePermissions} disabled={savingPerms} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                  {savingPerms && <Loader2 className="w-4 h-4 animate-spin" />}
                  {tc('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
