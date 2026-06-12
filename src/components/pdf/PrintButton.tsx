'use client'

import { Printer } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function PrintButton() {
  const t = useTranslations('common')
  return (
    <button type="button" onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
      <Printer className="w-4 h-4" /> {t('print')}
    </button>
  )
}
