'use client'

import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const variants: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations('orders')
  const map: Record<string, { variant: Variant; dot: string }> = {
    PENDING:     { variant: 'warning', dot: 'bg-amber-400' },
    IN_PROGRESS: { variant: 'info',    dot: 'bg-blue-400' },
    COMPLETED:   { variant: 'success', dot: 'bg-green-400' },
    CANCELLED:   { variant: 'danger',  dot: 'bg-red-400' },
  }
  const { variant, dot } = map[status] ?? { variant: 'default', dot: 'bg-gray-400' }
  const label = t(`status.${status}` as 'status.PENDING')
  return (
    <Badge variant={variant}>
      <span className={cn('w-1.5 h-1.5 rounded-full me-1.5', dot)} />
      {label}
    </Badge>
  )
}

export function DebtStatusBadge({ status }: { status: string }) {
  const t = useTranslations('debts')
  const map: Record<string, Variant> = {
    PENDING: 'warning',
    PARTIAL: 'purple',
    PAID:    'success',
  }
  const label = t(`status.${status}` as 'status.PENDING')
  return <Badge variant={map[status] ?? 'default'}>{label}</Badge>
}

export function StockBadge({ quantity, min }: { quantity: number; min: number }) {
  const t = useTranslations('products')
  if (quantity === 0) return <Badge variant="danger">{t('outOfStock')}</Badge>
  if (quantity <= min) return <Badge variant="warning">{t('lowStock')}</Badge>
  return <Badge variant="success">{t('stockOk')}</Badge>
}
