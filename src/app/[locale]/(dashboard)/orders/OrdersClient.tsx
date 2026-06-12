'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Eye, ClipboardList } from 'lucide-react'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

type Order = {
  id: string; status: string; totalAmount: number; paidAmount: number;
  orderedAt: Date; completedAt: Date | null; notes: string | null;
  patient: { id: string; firstName: string; lastName: string; phone: string };
  analyses: { analysisType: { name: string; price: number } }[];
  payments: { amount: number }[];
}

const STATUS_OPTIONS = ['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export default function OrdersClient({ orders, locale }: { orders: Order[]; locale: string }) {
  const t = useTranslations('orders')
  const tc = useTranslations('common')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = orders.filter((o) => {
    const name = `${o.patient.firstName} ${o.patient.lastName}`.toLowerCase()
    const id = o.id.slice(-6).toUpperCase()
    const matchSearch = name.includes(search.toLowerCase()) || id.includes(search.toUpperCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusLabel: Record<string, string> = {
    '': t('allStatuses'),
    PENDING: t('status.PENDING'),
    IN_PROGRESS: t('status.IN_PROGRESS'),
    COMPLETED: t('status.COMPLETED'),
    CANCELLED: t('status.CANCELLED'),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{orders.length} {t('orderCount')}</p>
        </div>
        <Link
          href={`/${locale}/orders/new`}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> {t('newOrder')}
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlaceholder')}
              className="w-full ps-9 pe-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
                {statusLabel[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="text-start px-5 py-3 font-medium">{t('orderNumber')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('name')}</th>
                <th className="text-start px-5 py-3 font-medium">{t('analysisList')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('total')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('paid')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('status')}</th>
                <th className="text-start px-5 py-3 font-medium">{tc('date')}</th>
                <th className="text-end px-5 py-3 font-medium">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">{tc('noResults')}</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
                    #{o.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{o.patient.firstName} {o.patient.lastName}</p>
                      <p className="text-xs text-gray-400">{o.patient.phone}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{o.analyses.length} {t('analysisCount')}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">{formatCurrency(o.totalAmount)}</td>
                  <td className="px-5 py-3.5 text-green-600 dark:text-green-400">{formatCurrency(o.paidAmount)}</td>
                  <td className="px-5 py-3.5"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{formatDate(o.orderedAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end">
                      <Link href={`/${locale}/orders/${o.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
