/**
 * Alert Detail Page
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertDetail } from '@/components/alerts/AlertDetail'

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ alertId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { alertId } = await params;

  return (
    <div className="app-shell">
      <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Alert Details
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              View and manage alert information.
            </p>
          </div>
          <Link href="/alerts" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            ← Back to Alerts
          </Link>
        </div>
      </header>

      <main>
        <div className="app-shell-inner py-6">
          <AlertDetail alertId={alertId} />
        </div>
      </main>
    </div>
  )
}

