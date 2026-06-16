/**
 * In-memory rate limiter for login attempts (single-instance deployment).
 * Tracks failed attempts per IP. Clears stale entries every hour.
 */

type Entry = { count: number; firstAt: number; blockedUntil?: number }

const store = new Map<string, Entry>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000  // 15 minutes
const BLOCK_MS = 30 * 60 * 1000   // 30 minutes lockout after MAX_ATTEMPTS

// Purge stale entries periodically to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now - entry.firstAt > BLOCK_MS) store.delete(key)
    }
  }, 60 * 60 * 1000)
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry) {
    store.set(ip, { count: 0, firstAt: now })
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // Blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.blockedUntil - now }
  }

  // Window expired — reset
  if (now - entry.firstAt > WINDOW_MS) {
    store.set(ip, { count: 0, firstAt: now })
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count }
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const entry = store.get(ip) ?? { count: 0, firstAt: now }
  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS
  }
  store.set(ip, entry)
}

export function resetAttempts(ip: string): void {
  store.delete(ip)
}
