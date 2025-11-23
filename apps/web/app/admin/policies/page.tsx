/**
 * Admin Policies List Page
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { PoliciesList } from '@/components/admin/PoliciesList'

export default async function AdminPoliciesPage() {
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
    return redirect(`/unauthorized?requiredRole=admin,owner&feature=Policy Management`)
  }

  return (
    <div className="app-shell">
      <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Policy Management
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Upload, parse, and manage insurance policies.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
              ← Dashboard
            </Link>
            <Link href="/admin/policies/upload" className={buttonVariants({ variant: "default" })}>
              + Upload Policy
            </Link>
          </div>
        </div>
      </header>

      <main>
        <div className="app-shell-inner py-6">
          <PoliciesList />
        </div>
      </main>
    </div>
  )
}

