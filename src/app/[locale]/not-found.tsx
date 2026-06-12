import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { headers } from 'next/headers'

export default async function NotFound() {
  const h = await headers()
  const locale = h.get('x-next-intl-locale') ?? 'fr'
  const t = await getTranslations({ locale, namespace: 'common' })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-6">
          <FlaskConical className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-black text-gray-900 dark:text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {t('notFound')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
          {t('notFoundDesc')}
        </p>
        <Link href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm">
          {t('backToDashboard')}
        </Link>
      </div>
    </div>
  )
}
