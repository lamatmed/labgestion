/**
 * Validates required environment variables at module load time.
 * Import this file early (e.g. in auth.ts or layout.tsx) so missing
 * secrets cause a clear startup error rather than a cryptic runtime crash.
 */

const REQUIRED = ['AUTH_SECRET', 'DATABASE_URL'] as const

for (const key of REQUIRED) {
  if (!process.env[key]) {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
      `Make sure it is set in your .env file or hosting environment.`
    )
  }
}

if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
  console.warn('[env] WARNING: AUTH_SECRET is shorter than 32 characters. Use a longer secret for production.')
}

export const env = {
  AUTH_SECRET: process.env.AUTH_SECRET!,
  DATABASE_URL: process.env.DATABASE_URL!,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
}
