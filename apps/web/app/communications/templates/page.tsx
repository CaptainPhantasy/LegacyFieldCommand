/**
 * Email Templates Page
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { EmailTemplatesList } from '@/components/communications/EmailTemplatesList'

export default async function EmailTemplatesPage() {
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
              Email Templates
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Manage email templates for common communications.
            </p>
          </div>
          <Link href="/communications" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            ← Back to Communications
          </Link>
        </div>
      </header>

      <main>
        <div className="app-shell-inner py-6">
          <EmailTemplatesList />
        </div>
      </main>
    </div>
  )
}

