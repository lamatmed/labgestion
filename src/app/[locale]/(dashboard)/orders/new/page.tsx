import { prisma } from '@/lib/prisma'
import NewOrderForm from './NewOrderForm'

export default async function NewOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ patientId?: string }>
}) {
  const { locale } = await params
  const { patientId } = await searchParams

  const [patients, analyses] = await Promise.all([
    prisma.patient.findMany({ orderBy: { lastName: 'asc' } }),
    prisma.analysisType.findMany({ orderBy: { category: 'asc' } }),
  ])

  return <NewOrderForm patients={patients} analyses={analyses} locale={locale} defaultPatientId={patientId} />
}
