'server-only'

/**
 * Lightweight audit logger. Writes to stdout in structured JSON so logs
 * can be collected by any observability stack (Vercel logs, Datadog, etc.).
 * Extend to write to a DB table if persistence is needed.
 */

type AuditAction =
  | 'user.create' | 'user.update' | 'user.delete' | 'user.permissions_change'
  | 'order.create' | 'order.complete' | 'order.cancel' | 'order.payment'
  | 'patient.create' | 'patient.update' | 'patient.delete'
  | 'product.create' | 'product.update' | 'product.delete'
  | 'analysis.create' | 'analysis.update' | 'analysis.delete'
  | 'purchase.create'
  | 'expense.create' | 'expense.delete'
  | 'debt.payment'
  | 'auth.login_blocked'

export function audit(
  action: AuditAction,
  actorId: string | undefined,
  targetId: string,
  meta?: Record<string, unknown>
) {
  const entry = {
    ts: new Date().toISOString(),
    action,
    actorId: actorId ?? 'system',
    targetId,
    ...meta,
  }
  // Structured log — collected by Vercel/hosting platform automatically
  console.log('[AUDIT]', JSON.stringify(entry))
}
