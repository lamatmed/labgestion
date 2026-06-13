'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import type { Notification } from '@prisma/client'
import { markAllNotificationsRead, markNotificationRead } from '@/actions/notifications'

const typeConfig: Record<string, { dot: string; bg: string }> = {
  ORDER_COMPLETED: { dot: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-950/20' },
  DEBT_DUE:        { dot: 'bg-red-500',   bg: 'bg-red-50 dark:bg-red-950/20' },
  LOW_STOCK:       { dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  PAYMENT_RECEIVED:{ dot: 'bg-blue-500',  bg: 'bg-blue-50 dark:bg-blue-950/20' },
  NEW_ORDER:       { dot: 'bg-purple-500',bg: 'bg-purple-50 dark:bg-purple-950/20' },
}

export function NotificationDropdown({
  notifications,
  userId,
  locale,
}: {
  notifications: Notification[]
  userId: string
  locale: string
}) {
  const t = useTranslations('notifications')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState(notifications)
  const ref = useRef<HTMLDivElement>(null)
  const unread = local.filter((n) => !n.read).length

  // Sync when server refreshes
  useEffect(() => { setLocal(notifications) }, [notifications])

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  async function handleClick(n: Notification) {
    setOpen(false)
    // Optimistically mark read
    if (!n.read) {
      setLocal((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
      markNotificationRead(n.id)
    }
    if (n.link) {
      router.push(`/${locale}${n.link}`)
    }
  }

  async function handleMarkAll() {
    setLocal((prev) => prev.map((n) => ({ ...n, read: true })))
    await markAllNotificationsRead(userId)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t('title')}
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span className="absolute top-1 end-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-11 z-50 w-84 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-2xl shadow-black/10 animate-fade-in overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('title')}</span>
                {unread > 0 && (
                  <span className="inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 text-[10px] font-bold text-red-600 dark:text-red-400">
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {t('markAllRead')}
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {local.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                  <Bell className="w-9 h-9 mb-3 opacity-20" />
                  <p className="text-sm">{t('noNotifications')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-slate-700/40">
                  {local.map((n) => {
                    const cfg = typeConfig[n.type] ?? { dot: 'bg-gray-400', bg: '' }
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`group relative flex gap-3 px-4 py-3.5 transition-colors ${
                          n.link ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40' : ''
                        } ${!n.read ? cfg.bg : ''}`}
                      >
                        {/* Type dot */}
                        <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${cfg.dot}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-snug truncate ${!n.read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              {n.title}
                            </p>
                            {n.link && (
                              <ExternalLink className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                            {formatDateTime(n.createdAt)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!n.read && (
                          <div className="absolute end-3 top-4 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
