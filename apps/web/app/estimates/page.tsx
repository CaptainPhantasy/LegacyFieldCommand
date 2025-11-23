/**
 * Estimates List Page
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { EstimatesList } from '@/components/estimates/EstimatesList'

export default async function EstimatesPage() {
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
              Estimates
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Generate and manage job estimates.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
              ← Dashboard
            </Link>
            <Link href="/estimates/generate" className={buttonVariants({ variant: "default" })}>
              + Generate Estimate
            </Link>
          </div>
        </div>
      </header>

      <main>
        <div className="app-shell-inner py-6">
          <EstimatesList />
        </div>
      </main>
    </div>
  )
}

