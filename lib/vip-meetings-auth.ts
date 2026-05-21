import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function requireAdminSession() {
  const session = await getServerSession(authOptions)
  const role = (session as { role?: string } | null)?.role
  if (!session || role !== 'admin') return null
  return session
}
