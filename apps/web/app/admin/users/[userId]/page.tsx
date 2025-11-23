/**
 * User Detail Page
 * View and edit user details
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserDetail } from '@/components/admin/UserDetail'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Check admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return redirect(`/unauthorized?requiredRole=admin,owner&feature=User Details`)
  }

  const { userId } = await params;

  return (
    <div className="app-shell">
      <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              User Details
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              View and manage user information.
            </p>
          </div>
          <Link href="/admin/users" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            ← Back to Users
          </Link>
        </div>
      </header>

      <main>
        <div className="app-shell-inner py-6">
          <UserDetail userId={userId} />
        </div>
      </main>
    </div>
  )
}

