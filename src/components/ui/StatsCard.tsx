import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
  className?: string
}

const colors = {
  blue:   { icon: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/40' },
  green:  { icon: 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400', border: 'border-green-100 dark:border-green-900/40' },
  amber:  { icon: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/40' },
  red:    { icon: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400', border: 'border-red-100 dark:border-red-900/40' },
  purple: { icon: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/40' },
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'blue', className }: StatsCardProps) {
  const c = colors[color]
  return (
    <div className={cn('bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0', c.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
