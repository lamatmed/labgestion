'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Menu, LogOut, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { NotificationDropdown } from './NotificationDropdown'
import { getInitials } from '@/lib/utils'
import type { Notification } from '@prisma/client'

interface HeaderProps {
  user: { id: string; name: string; email: string; role: string }
  locale: string
  notifications: Notification[]
  sidebarCollapsed: boolean
  onMobileMenuClick: () => void
  onDesktopToggle: () => void
}

export function Header({ user, locale, notifications, sidebarCollapsed, onMobileMenuClick, onDesktopToggle }: HeaderProps) {
  const t = useTranslations('nav')
  const tAuth = useTranslations('auth')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Derive locale from pathname so SSR and client always agree
  const currentLocale = pathname.startsWith('/ar') ? 'ar' : 'fr'

  function switchLocale() {
    const newLocale = currentLocale === 'fr' ? 'ar' : 'fr'
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <header
      className={`fixed top-0 end-0 z-10 h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2 px-4 lg:px-4 transition-all duration-300 ${sidebarCollapsed ? 'start-0 lg:start-[68px]' : 'start-0 lg:start-64'}`}
    >
      {/* Mobile: hamburger */}
      <button
        type="button"
        onClick={onMobileMenuClick}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop: sidebar toggle */}
      <button
        type="button"
        onClick={onDesktopToggle}
        className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        aria-label={sidebarCollapsed ? 'Afficher la barre latérale' : 'Réduire la barre latérale'}
        title={sidebarCollapsed ? 'Afficher' : 'Réduire'}
      >
        {sidebarCollapsed
          ? <PanelLeftOpen className="w-5 h-5" />
          : <PanelLeftClose className="w-5 h-5" />
        }
      </button>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Language toggle — shows current locale flag, click to switch */}
        <button
          type="button"
          onClick={switchLocale}
          title={currentLocale === 'fr' ? 'Passer en Arabe — موريتانيا' : 'التبديل إلى الفرنسية — France'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700"
        >
          <span className="text-base leading-none select-none">
            {currentLocale === 'fr' ? '🇫🇷' : '🇲🇷'}
          </span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {currentLocale === 'fr' ? 'FR' : 'AR'}
          </span>
        </button>

        <ThemeToggle />

        <NotificationDropdown notifications={notifications} userId={user.id} />

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 ms-1 ps-2 pe-1 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {getInitials(user.name)}
            </div>
            <div className="hidden sm:block text-start">
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{user.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight capitalize">{user.role.toLowerCase()}</p>
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute end-0 top-11 z-50 w-48 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xl shadow-black/10 animate-fade-in">
                <div className="p-2">
                  <Link
                    href={`/${currentLocale}/settings`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    {t('profile')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: `/${currentLocale}/login` })}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {tAuth('logout')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
