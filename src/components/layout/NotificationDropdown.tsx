'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatDateTime } from '@/lib/utils'
import type { Notification } from '@prisma/client'
import { markAllNotificationsRead, markNotificationRead } from '@/actions/notifications'

const typeColors: Record<string, string> = {
  ORDER_COMPLETED: 'bg-green-500',
  DEBT_DUE: 'bg-red-500',
  LOW_STOCK: 'bg-amber-500',
  PAYMENT_RECEIVED: 'bg-blue-500',
  NEW_ORDER: 'bg-purple-500',
}

export function NotificationDropdown({
  notifications,
  userId,
}: {
  notifications: Notification[]
  userId: string
}) {
  const t = useTranslations('notifications')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span className="absolute top-1.5 end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-11 z-50 w-80 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xl shadow-black/10 animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('title')}</h3>
            {unread > 0 && (
              <button
                onClick={() => markAllNotificationsRead(userId)}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700/50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                {t('noNotifications')}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                    !n.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${typeColors[n.type] || 'bg-gray-400'} mt-1.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
