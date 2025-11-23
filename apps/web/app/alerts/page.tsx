/**
 * Alerts List Page
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { AlertsList } from '@/components/alerts/AlertsList'

export default async function AlertsPage() {
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
              Alerts
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Monitor system alerts and notifications.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
              ← Dashboard
            </Link>
            <Link href="/alerts/rules" className={buttonVariants({ variant: "outline" })}>
              Alert Rules
            </Link>
          </div>
        </div>
      </header>

      <main>
        <div className="app-shell-inner py-6">
          <AlertsList />
        </div>
      </main>
    </div>
  )
}

