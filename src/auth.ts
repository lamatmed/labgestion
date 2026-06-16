import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'
import { checkRateLimit, recordFailedAttempt, resetAttempts } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
// Validate required env vars at startup
import '@/lib/env'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        ip: { label: 'IP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const ip = (credentials.ip as string) ?? 'unknown'
        const { allowed, retryAfterMs } = checkRateLimit(ip)

        if (!allowed) {
          const minutes = Math.ceil((retryAfterMs ?? 0) / 60000)
          audit('auth.login_blocked', undefined, ip, { reason: `rate_limit`, retryAfterMinutes: minutes })
          throw new Error(`Trop de tentatives. Réessayez dans ${minutes} min.`)
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          recordFailedAttempt(ip)
          return null
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password)

        if (!isValid) {
          recordFailedAttempt(ip)
          return null
        }

        // Successful login — reset counter
        resetAttempts(ip)
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
})
