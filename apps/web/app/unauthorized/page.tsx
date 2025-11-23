/**
 * Unauthorized Access Page
 * Shown when user tries to access a feature they don't have permission for
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PermissionDenied } from '@/components/errors/PermissionDenied'
import type { UserRole } from '@/lib/permissions'

interface UnauthorizedPageProps {
  searchParams: Promise<{
    requiredRole?: string
    feature?: string
  }>
}

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Get user's role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return redirect('/login')
  }

  const params = await searchParams
  const requiredRole = (params.requiredRole?.split(',') as UserRole[]) || ['admin', 'owner']
  const featureName = params.feature || 'this feature'

  return (
    <PermissionDenied
      userRole={profile.role as UserRole}
      requiredRole={requiredRole.length === 1 ? requiredRole[0] : requiredRole}
      featureName={featureName}
    />
  )
}

