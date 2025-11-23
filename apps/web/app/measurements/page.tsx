/**
 * Measurements Page
 * Lists measurements and allows upload
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MeasurementsList } from '@/components/measurements/MeasurementsList'

export default async function MeasurementsPage() {
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
              3D Measurements
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Upload and manage 3D measurement files.
            </p>
          </div>
          <Link href="/" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            ← Dashboard
          </Link>
        </div>
      </header>

      <main>
        <div className="app-shell-inner py-6">
          <MeasurementsList />
        </div>
      </main>
    </div>
  )
}

