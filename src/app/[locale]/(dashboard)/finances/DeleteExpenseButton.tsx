'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteExpense } from '@/actions/expenses'

export default function DeleteExpenseButton({ id }: { id: string }) {
  const t = useTranslations('finances')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm(t('deleteExpenseConfirm'))) return
    startTransition(async () => {
      await deleteExpense(id)
      router.refresh()
    })
  }

  return (
    <button type="button" onClick={handleDelete} disabled={isPending}
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
