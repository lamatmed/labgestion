export const ALL_PAGES = [
  'patients',
  'analyses',
  'orders',
  'suppliers',
  'products',
  'purchases',
  'debts',
  'finances',
] as const

export type PageSlug = (typeof ALL_PAGES)[number]

export function hasPageAccess(
  role: string,
  permissions: string[],
  page: string
): boolean {
  if (role === 'ADMIN') return true
  if (page === 'users') return false
  if (page === '' || page === 'settings') return true
  // empty permissions = legacy user → full access
  if (permissions.length === 0) return true
  return permissions.includes(page)
}
