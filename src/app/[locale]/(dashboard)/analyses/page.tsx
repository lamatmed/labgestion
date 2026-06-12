import { prisma } from '@/lib/prisma'
import AnalysesClient from './AnalysesClient'

export default async function AnalysesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const analyses = await prisma.analysisType.findMany({ orderBy: { createdAt: 'desc' } })
  return <AnalysesClient analyses={analyses} locale={locale} />
}
