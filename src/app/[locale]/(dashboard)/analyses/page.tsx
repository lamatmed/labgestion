import { prisma } from '@/lib/prisma'
import AnalysesClient from './AnalysesClient'

export default async function AnalysesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [analyses, products] = await Promise.all([
    prisma.analysisType.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reagents: {
          include: { product: { select: { id: true, name: true, unit: true } } },
        },
      },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, unit: true, quantity: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return <AnalysesClient analyses={analyses} products={products} locale={locale} />
}
