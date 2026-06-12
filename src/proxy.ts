import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const intlMiddleware = createIntlMiddleware(routing)

const PUBLIC_PATHS = ['/login', '/register']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.endsWith(p))
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Let intl handle public auth pages
  if (isPublicPath(pathname)) {
    return intlMiddleware(req)
  }

  // Skip static files and API routes
  if (pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const session = await auth()

  if (!session?.user) {
    const locale = pathname.startsWith('/ar') ? 'ar' : 'fr'
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
