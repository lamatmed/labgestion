'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Eye, EyeOff, FlaskConical, Loader2, User, Mail, Lock, CheckCircle2 } from 'lucide-react'
import { registerUser } from '@/actions/register'
import { usePathname } from 'next/navigation'

function passwordScore(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Très faible', color: 'bg-red-500' }
  if (score === 2) return { score, label: 'Faible', color: 'bg-orange-500' }
  if (score === 3) return { score, label: 'Moyen', color: 'bg-yellow-500' }
  if (score === 4) return { score, label: 'Fort', color: 'bg-blue-500' }
  return { score, label: 'Très fort', color: 'bg-green-500' }
}

function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = passwordScore(password)
  if (password.length < 8) {
    return <p className="text-xs text-amber-500 mt-1.5">Minimum 8 caractères requis</p>
  }
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? color : 'bg-gray-200 dark:bg-slate-600'}`} />
        ))}
      </div>
      <p className={`text-xs ${score <= 2 ? 'text-orange-500' : score === 3 ? 'text-yellow-600' : 'text-green-600 dark:text-green-400'}`}>
        {label}
      </p>
    </div>
  )
}

export default function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchLocale() {
    const newLocale = locale === 'fr' ? 'ar' : 'fr'
    router.push(pathname.replace(`/${locale}`, `/${newLocale}`))
  }
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await registerUser(form)
      if (res.success) {
        setSuccess(true)
      } else {
        setError(res.error ?? t('genericError'))
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 shadow-lg shadow-green-500/30 mb-6">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('accountCreated')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('accountCreatedMsg')}
            </p>
            <Link href={`/${locale}/login`}
              className="block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-center">
              {t('goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="fixed top-4 end-4">
        <button type="button" onClick={switchLocale}
          title={locale === 'fr' ? 'Passer en Arabe' : 'التبديل إلى الفرنسية'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          <span className="text-base leading-none select-none">{locale === 'fr' ? '🇫🇷' : '🇲🇷'}</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{locale === 'fr' ? 'FR' : 'AR'}</span>
        </button>
      </div>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-4">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LabGestion</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('registerSubtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {t('register')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('fullName')}
              </label>
              <div className="relative">
                <User className="absolute inset-y-0 start-3.5 my-auto w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  required
                  minLength={2}
                  autoComplete="name"
                  placeholder={t('namePlaceholder')}
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute inset-y-0 start-3.5 my-auto w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  required
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute inset-y-0 start-3.5 my-auto w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full ps-10 pe-11 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <PasswordStrength password={form.password} />
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute inset-y-0 start-3.5 my-auto w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`w-full ps-10 pe-11 py-2.5 rounded-xl border bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    form.confirmPassword && form.confirmPassword !== form.password
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-gray-200 dark:border-slate-600'
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 end-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="text-xs text-red-500 mt-1">{t('passwordMismatch')}</p>
              )}
            </div>

            {/* Role info */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <div className="w-4 h-4 mt-0.5 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">i</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('roleInfo')}
              </p>
            </div>

            <button
              type="submit"
              disabled={
                isPending ||
                form.password.length < 8 ||
                (!!form.confirmPassword && form.confirmPassword !== form.password)
              }
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors shadow-sm shadow-blue-600/20"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('registerButton')}
            </button>
          </form>
        </div>

        {/* Link to login */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          {t('alreadyAccount')}{' '}
          <Link href={`/${locale}/login`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium underline-offset-2 hover:underline">
            {t('goToLogin')}
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          {t('footer', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  )
}
