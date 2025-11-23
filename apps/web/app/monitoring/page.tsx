/**
 * Monitoring Dashboard Page
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard'

export default async function MonitoringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="app-shell">
      <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Monitoring Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              System health, compliance, and activity monitoring.
            </p>
          </div>
          <Link href="/" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            ← Dashboard
          </Link>
        </div>
      </header>

      <main>
        <div className="app-shell-inner py-6">
          <MonitoringDashboard />
        </div>
      </main>
    </div>
  )
}

