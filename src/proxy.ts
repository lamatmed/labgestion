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

  // Build modified request headers with x-pathname so server components can read the
  // current page slug for permission enforcement (via headers() in layout.tsx)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)

  // Let intl handle public auth pages
  if (isPublicPath(pathname)) {
    return intlMiddleware(req)
  }

  // Skip static files — API routes (only /api/auth/*) still go through auth check
  if (pathname.includes('.')) {
    return NextResponse.next()
  }

  // Allow only the NextAuth API routes without custom auth logic
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // All other /api/* routes require authentication
  if (pathname.startsWith('/api')) {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const session = await auth()

  if (!session?.user) {
    const locale = pathname.startsWith('/ar') ? 'ar' : 'fr'
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
  }

  // Run intl middleware to handle locale redirect if needed
  const intlRes = intlMiddleware(req)

  // If intl wants to redirect (e.g. / → /fr), honor that and skip header injection
  if (intlRes && intlRes.status >= 300 && intlRes.status < 400) {
    return intlRes
  }

  // For pass-through responses, return a new NextResponse.next with x-pathname injected
  // so dashboard layout can read it via headers()
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Preserve any cookies that intl middleware may have set (e.g. NEXT_LOCALE)
  if (intlRes) {
    intlRes.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value)
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
