'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { Notification } from '@prisma/client'

interface Props {
  user: { id: string; name: string; email: string; role: string }
  locale: string
  notifications: Notification[]
  children: React.ReactNode
}

export function DashboardShell({ user, locale, notifications, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar
        locale={locale}
        role={user.role}
        mobileOpen={mobileOpen}
        desktopCollapsed={desktopCollapsed}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Header
        user={user}
        locale={locale}
        notifications={notifications}
        sidebarCollapsed={desktopCollapsed}
        onMobileMenuClick={() => setMobileOpen(true)}
        onDesktopToggle={() => setDesktopCollapsed((v) => !v)}
      />

      {/* Main content — shifts based on sidebar width */}
      <div className={desktopCollapsed ? 'lg:ps-[68px]' : 'lg:ps-64'}>
        <main className="min-h-screen pt-16 px-4 pb-6 lg:px-6 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}
