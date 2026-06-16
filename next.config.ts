import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const securityHeaders = [
  // Prevent framing (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limit referrer info leakage
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable DNS prefetch
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Disable browser features not needed by a lab app
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  // Force HTTPS for 1 year (only meaningful in production)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // Content-Security-Policy
  // next/script and Tailwind require 'unsafe-inline' for styles.
  // Next.js needs 'unsafe-eval' in development (removed automatically in prod via env check).
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Service-Worker-Allowed', value: '/' },
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
      ],
    },
    {
      // Apply security headers to all routes
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
}

export default withNextIntl(nextConfig)
