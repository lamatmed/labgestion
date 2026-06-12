import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { formatDate, formatDateTime } from '@/lib/utils'
import PrintButton from '@/components/pdf/PrintButton'

export default async function ReportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations('pdf')
  const isRtl = locale === 'ar'

  const order = await prisma.analysisOrder.findUnique({
    where: { id },
    include: {
      patient: true,
      analyses: { include: { analysisType: true } },
      payments: true,
    },
  })

  if (!order) notFound()

  const labAddress = isRtl
    ? 'نواكشوط، موريتانيا • هاتف: 00 00 00 00'
    : 'Nouakchott, Mauritanie • Tél: 00 00 00 00'

  const statusLabel =
    order.status === 'PENDING' ? (isRtl ? 'في الانتظار' : 'En attente') :
    order.status === 'IN_PROGRESS' ? (isRtl ? 'جاري' : 'En cours') :
    order.status === 'COMPLETED' ? (isRtl ? 'مكتمل' : 'Terminé') :
    (isRtl ? 'ملغى' : 'Annulé')

  const genderLabel = order.patient.gender === 'M'
    ? (isRtl ? 'ذكر' : 'Masculin')
    : (isRtl ? 'أنثى' : 'Féminin')

  return (
    <div
      className="min-h-screen bg-gray-100 dark:bg-slate-900 py-8 px-4 print:bg-white print:py-0 print:px-0"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-3xl mx-auto">
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
          <div className="flex items-start justify-between border-b-2 border-blue-600 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">{t('labName')}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{labAddress}</p>
            </div>
            <div className={isRtl ? 'text-left' : 'text-right'}>
              <div className="inline-block bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wide">
                {t('reportTitle')}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {t('orderNumber')}: {order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Patient info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {t('patient')}
              </h3>
              <p className="font-bold text-gray-900 text-lg">
                {order.patient.firstName} {order.patient.lastName}
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  {isRtl ? 'تاريخ الميلاد' : 'Né(e) le'}: {formatDate(order.patient.dateOfBirth)}
                </p>
                <p>{isRtl ? 'الجنس' : 'Sexe'}: {genderLabel}</p>
                {order.patient.phone && (
                  <p>{isRtl ? 'هاتف' : 'Tél'}: {order.patient.phone}</p>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {isRtl ? 'معلومات الطلب' : 'Informations'}
              </h3>
              <p>{t('orderedAt')}: {formatDate(order.orderedAt)}</p>
              {order.completedAt && (
                <p>{t('completedAt')}: {formatDate(order.completedAt)}</p>
              )}
              <p>
                {isRtl ? 'الحالة' : 'Statut'}:{' '}
                <span className="font-medium">{statusLabel}</span>
              </p>
            </div>
          </div>

          {/* Results table */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              {isRtl ? 'نتائج التحاليل' : 'Résultats des analyses'}
            </h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="text-start px-4 py-2.5 font-semibold text-gray-700 border border-blue-100">{t('analysisName')}</th>
                  <th className="text-start px-4 py-2.5 font-semibold text-gray-700 border border-blue-100">{t('result')}</th>
                  <th className="text-start px-4 py-2.5 font-semibold text-gray-700 border border-blue-100">{t('refRange')}</th>
                  <th className="text-start px-4 py-2.5 font-semibold text-gray-700 border border-blue-100">{t('unit')}</th>
                  <th className="text-start px-4 py-2.5 font-semibold text-gray-700 border border-blue-100">{t('flag')}</th>
                </tr>
              </thead>
              <tbody>
                {order.analyses.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2.5 border border-gray-200 font-medium text-gray-800">
                      {a.analysisType.name}
                    </td>
                    <td className="px-4 py-2.5 border border-gray-200">
                      {a.result ? (
                        <span
                          className={`font-semibold ${
                            a.flag === 'HIGH' ? 'text-red-600' :
                            a.flag === 'LOW' ? 'text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          {a.result}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">
                          {isRtl ? 'في الانتظار' : 'En attente'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 border border-gray-200 text-gray-500">
                      {a.refRange ?? a.analysisType.refRangeText ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 border border-gray-200 text-gray-500">
                      {a.unit ?? a.analysisType.unit ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 border border-gray-200">
                      {a.flag && a.flag !== 'NORMAL' ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            a.flag === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {a.flag === 'HIGH' ? (isRtl ? 'مرتفع' : 'HAUT') : (isRtl ? 'منخفض' : 'BAS')}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {order.notes && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-xs font-semibold text-yellow-700 uppercase mb-1">
                {isRtl ? 'ملاحظات' : 'Remarques'}
              </h4>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="h-16 border-b border-gray-300 mb-2"></div>
              <p className="text-xs text-gray-500">
                {isRtl ? 'توقيع التقني' : 'Signature du technicien'}
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b border-gray-300 mb-2"></div>
              <p className="text-xs text-gray-500">{t('signature')}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              {isRtl ? 'طُبع في' : 'Imprimé le'} {formatDateTime(new Date())} • {t('labName')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
