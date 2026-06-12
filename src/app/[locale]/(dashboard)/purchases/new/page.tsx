import { prisma } from '@/lib/prisma'
import NewPurchaseForm from './NewPurchaseForm'

export default async function NewPurchasePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
  ])

  return <NewPurchaseForm locale={locale} suppliers={suppliers as any} products={products as any} />
}
