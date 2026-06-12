import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { LocaleHydrater } from '@/components/providers/LocaleHydrater'
import PWARegister from '@/components/providers/PWARegister'
import { SplashScreen } from '@/components/ui/SplashScreen'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'fr' | 'ar')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages}>
        <SplashScreen locale={locale} />
        <LocaleHydrater locale={locale} />
        <PWARegister />
        {children}
      </NextIntlClientProvider>
    </ThemeProvider>
  )
}
