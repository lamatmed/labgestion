'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, FlaskConical, ClipboardList,
  Truck, Package, ShoppingCart, AlertCircle, BarChart3,
  Settings, UserCog, FlaskRound, X, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { key: 'dashboard', href: '', icon: LayoutDashboard },
  { key: 'patients', href: '/patients', icon: Users },
  { key: 'analyses', href: '/analyses', icon: FlaskConical },
  { key: 'orders', href: '/orders', icon: ClipboardList },
  { key: 'divider1', isDivider: true },
  { key: 'suppliers', href: '/suppliers', icon: Truck },
  { key: 'products', href: '/products', icon: Package },
  { key: 'purchases', href: '/purchases', icon: ShoppingCart },
  { key: 'debts', href: '/debts', icon: AlertCircle },
  { key: 'divider2', isDivider: true },
  { key: 'finances', href: '/finances', icon: BarChart3 },
  { key: 'users', href: '/users', icon: UserCog },
]

interface SidebarProps {
  locale: string
  role: string
  mobileOpen: boolean
  desktopCollapsed: boolean
  onMobileClose: () => void
}

export function Sidebar({ locale, role, mobileOpen, desktopCollapsed, onMobileClose }: SidebarProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const base = `/${locale}`
  const isRtl = locale === 'ar'

  function isActive(href: string) {
    const full = base + href
    if (href === '') return pathname === base || pathname === base + '/'
    return pathname.startsWith(full)
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-30 flex flex-col bg-white dark:bg-slate-900 border-e border-gray-100 dark:border-slate-800 transition-all duration-300 overflow-hidden',
          // Mobile: full width drawer
          'w-64',
          mobileOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full'),
          // Desktop: always visible, width depends on collapsed state
          desktopCollapsed
            ? 'lg:translate-x-0 lg:w-[68px]'
            : 'lg:translate-x-0 lg:w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-[18px] border-b border-gray-100 dark:border-slate-800 flex-shrink-0 overflow-hidden">
          <Link href={base} className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0">
              <FlaskRound className="w-4 h-4 text-white" />
            </div>
            <span className={cn(
              'font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap transition-all duration-300',
              desktopCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'
            )}>
              LabGestion
            </span>
          </Link>
          {/* Mobile close */}
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden ms-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-0.5">
          {navItems.map((item) => {
            if ('isDivider' in item) {
              return (
                <div key={item.key} className={cn(
                  'my-2 border-t border-gray-100 dark:border-slate-800 transition-all duration-300',
                  desktopCollapsed ? 'lg:mx-1' : ''
                )} />
              )
            }
            if (item.key === 'users' && role !== 'ADMIN') return null

            const Icon = item.icon!
            const active = isActive(item.href)

            return (
              <Link
                key={item.key}
                href={base + item.href}
                onClick={onMobileClose}
                title={desktopCollapsed ? t(item.key as any) : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl text-sm font-medium transition-all group relative',
                  desktopCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5' : 'px-3 py-2.5',
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className={cn(
                  'flex-shrink-0 transition-all duration-300',
                  desktopCollapsed ? 'lg:w-5 lg:h-5 w-4.5 h-4.5' : 'w-4.5 h-4.5',
                  active ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )} />

                <span className={cn(
                  'truncate whitespace-nowrap transition-all duration-300',
                  desktopCollapsed ? 'lg:hidden' : ''
                )}>
                  {t(item.key as any)}
                </span>

                {/* Tooltip on collapsed desktop */}
                {desktopCollapsed && (
                  <span className={cn(
                    'hidden lg:block absolute start-full ms-3 px-2.5 py-1.5 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded-lg whitespace-nowrap',
                    'opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50',
                    'shadow-lg'
                  )}>
                    {t(item.key as any)}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2.5 border-t border-gray-100 dark:border-slate-800 flex-shrink-0 space-y-0.5">
          <Link
            href={base + '/settings'}
            onClick={onMobileClose}
            title={desktopCollapsed ? t('settings') : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-all group relative',
              desktopCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5' : 'px-3 py-2.5'
            )}
          >
            <Settings className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 flex-shrink-0" />
            <span className={cn(
              'truncate whitespace-nowrap transition-all duration-300',
              desktopCollapsed ? 'lg:hidden' : ''
            )}>
              {t('settings')}
            </span>
            {desktopCollapsed && (
              <span className="hidden lg:block absolute start-full ms-3 px-2.5 py-1.5 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                {t('settings')}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
            title={desktopCollapsed ? t('logout') : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-300 transition-all group relative',
              desktopCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5' : 'px-3 py-2.5'
            )}
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            <span className={cn(
              'truncate whitespace-nowrap transition-all duration-300',
              desktopCollapsed ? 'lg:hidden' : ''
            )}>
              {t('logout')}
            </span>
            {desktopCollapsed && (
              <span className="hidden lg:block absolute start-full ms-3 px-2.5 py-1.5 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                {t('logout')}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
