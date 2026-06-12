import { prisma } from '@/lib/prisma'
import PatientsClient from './PatientsClient'

export default async function PatientsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const patients = await prisma.patient.findMany({ orderBy: { createdAt: 'desc' } })
  return <PatientsClient patients={patients} locale={locale} />
}
