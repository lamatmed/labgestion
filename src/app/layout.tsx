import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LabGestion — Gestion de Laboratoire',
  description: 'Application de gestion de laboratoire médical',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon.svg',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const locale = h.get('x-next-intl-locale') ?? 'fr'
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme')||'light';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}` }} />
      </head>
      <body
        className="h-full bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
