import { prisma } from '@/lib/prisma'
import ProductsClient from './ProductsClient'

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
  return <ProductsClient products={products} locale={locale} />
}
