'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/components/providers/ThemeProvider'
import { User, Mail, Shield, Sun, Moon, Monitor, Loader2, CheckCircle2 } from 'lucide-react'
import { updateUser } from '@/actions/users'

type UserData = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

export default function SettingsClient({ user, locale: _locale }: { user: UserData; locale: string }) {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    password: '',
    confirmPassword: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) {
      setError(tc('error'))
      return
    }
    setError('')
    setSuccess(false)
    startTransition(async () => {
      const res = await updateUser(user.id, {
        name: form.name,
        email: form.email,
        role: user.role as any,
        password: form.password || undefined,
      })
      if (res.success) {
        setSuccess(true)
        setForm((f) => ({ ...f, password: '', confirmPassword: '' }))
        router.refresh()
      } else {
        setError(res.error ?? tc('error'))
      }
    })
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>

      {/* Profile card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}>
              <Shield className="w-3 h-3 mr-1" />
              {user.role === 'ADMIN' ? t('admin') : t('technician')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {t('profileUpdated')}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                <User className="inline w-3.5 h-3.5 mr-1 -mt-0.5" /> {t('fullName')}
              </label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                required minLength={2} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>
                <Mail className="inline w-3.5 h-3.5 mr-1 -mt-0.5" /> {tc('email')}
              </label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required className={inputCls} />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('changePassword')} <span className="text-gray-400 font-normal">({t('passwordHint')})</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('newPassword')}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6} autoComplete="new-password" placeholder="••••••••" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('confirmPassword')}</label>
                <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  autoComplete="new-password" placeholder="••••••••"
                  className={`${inputCls} ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-400 dark:border-red-600' : ''}`} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors text-sm">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('saveProfile')}
            </button>
          </div>
        </form>
      </div>

      {/* Theme */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('appearance')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { value: 'light', label: t('themeLight'), icon: Sun },
              { value: 'dark', label: t('themeDark'), icon: Moon },
              { value: 'system', label: t('themeSystem'), icon: Monitor },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === value ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500'}`}>
              <Icon className={`w-5 h-5 ${theme === value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
              <span className={`text-xs font-medium ${theme === value ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('information')}</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('version')}</span>
            <span className="text-gray-900 dark:text-white font-medium">LabGestion v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('accountCreatedAt')}</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
