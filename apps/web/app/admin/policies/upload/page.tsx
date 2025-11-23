/**
 * Upload Policy Page
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UploadPolicyForm } from '@/components/admin/UploadPolicyForm'

export default async function UploadPolicyPage() {
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
    return redirect(`/unauthorized?requiredRole=admin,owner&feature=Upload Policy`)
  }

  return (
    <div className="app-shell">
      <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Upload Policy
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Upload a new insurance policy PDF.
            </p>
          </div>
          <Link href="/admin/policies" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            ← Back to Policies
          </Link>
        </div>
      </header>

      <main>
        <div className="app-shell-inner py-6">
          <UploadPolicyForm />
        </div>
      </main>
    </div>
  )
}

