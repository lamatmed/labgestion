import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import PrintButton from '@/components/pdf/PrintButton'

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations('pdf')
  const tOrders = await getTranslations('orders')
  const isRtl = locale === 'ar'

  const order = await prisma.analysisOrder.findUnique({
    where: { id },
    include: {
      patient: true,
      analyses: { include: { analysisType: true } },
      payments: { orderBy: { paidAt: 'asc' } },
    },
  })

  if (!order) notFound()

  const totalPaid = order.payments.reduce((s, p) => s + p.amount, 0)
  const balance = order.totalAmount - totalPaid
  const labAddress = isRtl
    ? 'نواكشوط، موريتانيا • هاتف: 00 00 00 00'
    : 'Nouakchott, Mauritanie • Tél: 00 00 00 00'

  function methodLabel(method: string) {
    return tOrders(`paymentMethod.${method}` as any)
  }

  return (
    <div
      className="min-h-screen bg-gray-100 dark:bg-slate-900 py-8 px-4 print:bg-white print:py-0 print:px-0"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end gap-3 mb-6 print:hidden">
          <PrintButton />
          <a
            href={`/${locale}/orders/${id}`}
            className="px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            {t('backButton')}
          </a>
        </div>

        <div className="bg-white shadow-sm rounded-2xl print:shadow-none print:rounded-none p-8">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-5 mb-5">
            <h1 className="text-xl font-bold text-gray-900">{t('labName')}</h1>
            <p className="text-sm text-gray-500">{labAddress}</p>
            <div className="mt-3 inline-block border-2 border-gray-800 px-6 py-1.5 rounded">
              <h2 className="text-base font-bold tracking-widest uppercase text-gray-900">
                {t('receiptTitle')}
              </h2>
            </div>
          </div>

          {/* Receipt number and date */}
          <div className="flex justify-between text-sm mb-5">
            <div>
              <span className="text-gray-500">{t('receiptNumber')}:</span>{' '}
              <span className="font-bold text-gray-900">REC-{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-gray-500">{isRtl ? 'التاريخ' : 'Date'}:</span>{' '}
              <span className="font-semibold">{formatDate(new Date())}</span>
            </div>
          </div>

          {/* Patient */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <div>
                <span className="text-gray-500">{t('patient')}:</span>{' '}
                <span className="font-semibold text-gray-900">
                  {order.patient.firstName} {order.patient.lastName}
                </span>
              </div>
              {order.patient.phone && (
                <div>
                  <span className="text-gray-500">{isRtl ? 'هاتف' : 'Tél'}:</span>{' '}
                  <span>{order.patient.phone}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">{t('orderedAt')}:</span>{' '}
                <span>{formatDate(order.orderedAt)}</span>
              </div>
            </div>
          </div>

          {/* Analyses table */}
          <table className="w-full text-sm mb-5 border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-start py-2 font-semibold text-gray-700">{t('analysisName')}</th>
                <th className="text-end py-2 font-semibold text-gray-700">{isRtl ? 'السعر' : 'Prix'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.analyses.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 text-gray-700">{a.analysisType.name}</td>
                  <td className="py-2 text-end font-medium text-gray-900">
                    {formatCurrency(a.analysisType.price)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-800">
              <tr>
                <td className="py-2 font-bold text-gray-900">{t('totalAmount')}</td>
                <td className="py-2 text-end font-bold text-gray-900 text-base">
                  {formatCurrency(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payments */}
          {order.payments.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                {isRtl ? 'المدفوعات' : 'Paiements effectués'}
              </h3>
              <div className="space-y-1.5">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {formatDate(p.paidAt)} — {methodLabel(p.method)}
                    </span>
                    <span className="font-semibold text-green-700">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Balance */}
          <div
            className={`rounded-xl border-2 p-4 text-center mb-5 ${
              balance <= 0 ? 'border-green-600 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {balance <= 0 ? (isRtl ? 'مدفوع بالكامل' : 'Entièrement payé') : t('remainingAmount')}
            </p>
            <p className={`text-3xl font-bold ${balance <= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(balance))}
            </p>
          </div>

          {/* Signature */}
          <div className="grid grid-cols-2 gap-8 mt-8 pt-5 border-t border-gray-200">
            <div>
              <div className="h-12 border-b border-gray-300 mb-1.5"></div>
              <p className="text-xs text-gray-400 text-center">
                {isRtl ? 'توقيع أمين الصندوق' : 'Signature du caissier'}
              </p>
            </div>
            <div>
              <div className="h-12 border-b border-gray-300 mb-1.5"></div>
              <p className="text-xs text-gray-400 text-center">{t('signature')}</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              {t('printedAt')} {formatDateTime(new Date())} • {t('labName')}
            </p>
            <p className="text-xs text-gray-300 mt-0.5">{t('officialDoc')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
