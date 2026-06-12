import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge, OrderStatusBadge } from '@/components/ui/Badge'
import { formatDate, formatCurrency, calculateAge } from '@/lib/utils'
import { ChevronLeft, User as UserIcon, Phone, Mail, MapPin, Calendar, Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations('patients')
  const tc = await getTranslations('common')
  const tOrders = await getTranslations('orders')

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      orders: {
        include: { analyses: true, payments: true },
        orderBy: { orderedAt: 'desc' },
      },
    },
  })

  if (!patient) notFound()

  const totalPaid = patient.orders.reduce(
    (sum, o) => sum + o.payments.reduce((s, p) => s + p.amount, 0),
    0,
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/patients`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('backToPatients')}
        </Link>
        <Link
          href={`/${locale}/orders/new?patientId=${patient.id}`}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {tOrders('newOrder')}
        </Link>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold flex-shrink-0">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {patient.firstName} {patient.lastName}
                </h1>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <Badge variant={patient.gender === 'M' ? 'info' : 'purple'}>
                    {patient.gender === 'M' ? t('male') : t('female')}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    {calculateAge(patient.dateOfBirth)} {tc('years')}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-slate-400">
                <p>{t('registeredOn')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(patient.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{t('dateOfBirth')}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(patient.dateOfBirth)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{tc('phone')}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{patient.phone}</p>
                </div>
              </div>

              {patient.email && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{tc('email')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{patient.email}</p>
                  </div>
                </div>
              )}

              {patient.address && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{tc('address')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{patient.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{patient.orders.length}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{tOrders('title')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(patient.orders.reduce((s, o) => s + o.totalAmount, 0))}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('totalBilled')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{tc('paid')}</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('orderHistory')}</h2>
        </div>

        {patient.orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500">
            <p className="text-sm">{t('noOrders')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
                  <th className="text-start px-4 py-3 font-medium text-gray-500 dark:text-slate-400">ID</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('date')}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tOrders('analysisList')}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('total')}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('paid')}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('status')}</th>
                  <th className="text-end px-4 py-3 font-medium text-gray-500 dark:text-slate-400">{tc('details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {patient.orders.map((order) => {
                  const paid = order.payments.reduce((s, p) => s + p.amount, 0)
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                        {formatDate(order.orderedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                        {order.analyses.length}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">
                        {formatCurrency(paid)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Link
                          href={`/${locale}/orders/${order.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                        >
                          {tc('view')}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
