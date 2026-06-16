'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Eye, EyeOff, FlaskConical, Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale() {
    const newLocale = locale === 'fr' ? 'ar' : 'fr'
    router.push(pathname.replace(`/${locale}`, `/${newLocale}`))
  }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      ip: '', // IP is injected server-side; empty string is safe fallback
    })

    if (res?.error) {
      setError(t('invalidCredentials'))
      setLoading(false)
    } else {
      router.push(`/${locale}`)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language switcher */}
      <div className="fixed top-4 end-4">
        <button
          type="button"
          onClick={switchLocale}
          title={locale === 'fr' ? 'Passer en Arabe' : 'التبديل إلى الفرنسية'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
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
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {t('loginTitle')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors shadow-sm shadow-blue-600/20"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('loginButton')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          {t('noAccount')}{' '}
          <Link href={`/${locale}/register`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium underline-offset-2 hover:underline">
            {t('createAccount')}
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          {t('footer', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  )
}
