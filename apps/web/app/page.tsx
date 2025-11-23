import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Get user's role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Route based on role
  if (profile?.role === 'field_tech') {
    return redirect('/field')
  }

  // Admin/Owner/Estimator see the admin dashboard
  // Fetch Jobs
  const { data: jobs } = await supabase.from('jobs').select('*, profiles:lead_tech_id(full_name)')

  return (
    <div className="app-shell">
      <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Monitor jobs, assignments, and field activity.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</span>
            <Link
              href="/auth/signout"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--error)' }}
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <main>
        <div className="app-shell-inner space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Active Jobs
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Create, assign, and track restoration jobs in real time.
              </p>
            </div>
            <Link href="/jobs/new" className={buttonVariants({ variant: "default" })}>
              + New Job
            </Link>
          </div>

          <div className="glass-basic card-glass">
            <ul role="list" className="divide-y divide-gray-200/40">
              {jobs?.length === 0 && (
                <li className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No jobs found. Create one to get started.
                </li>
              )}
              {jobs?.map((job) => (
                <li key={job.id}>
                  <div className="transition-colors duration-150 hover:bg-[var(--hover-bg-subtle)] rounded-xl">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between gap-4">
                        <p className="truncate text-sm font-medium" style={{ color: 'var(--accent)' }}>
                          {job.title}
                        </p>
                        <div className="flex flex-shrink-0">
                          <p
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ background: 'var(--success)', color: '#ffffff' }}
                          >
                            {job.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <p style={{ color: 'var(--text-secondary)' }}>
                          Tech: {(job.profiles as any)?.full_name || 'Unassigned'}
                        </p>
                        <p style={{ color: 'var(--text-tertiary)' }}>
                          Created{" "}
                          {new Date(job.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
