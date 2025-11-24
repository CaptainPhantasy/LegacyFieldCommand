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
          <div className="flex items-center gap-2 flex-wrap">
            <nav className="flex items-center gap-2 flex-wrap" aria-label="Main navigation">
              <Link
                href="/boards"
                className="text-sm font-medium transition-colors hover:opacity-80 px-2 py-1"
                style={{ color: 'var(--accent)' }}
              >
                Boards
              </Link>
              <Link
                href="/admin/users"
                className="text-sm font-medium transition-colors hover:opacity-80 px-2 py-1"
                style={{ color: 'var(--accent)' }}
              >
                Users
              </Link>
              <Link
                href="/admin/policies"
                className="text-sm font-medium transition-colors hover:opacity-80 px-2 py-1"
                style={{ color: 'var(--accent)' }}
              >
                Policies
              </Link>
              <Link
                href="/alerts"
                className="text-sm font-medium transition-colors hover:opacity-80 px-2 py-1"
                style={{ color: 'var(--accent)' }}
              >
                Alerts
              </Link>
              <Link
                href="/monitoring"
                className="text-sm font-medium transition-colors hover:opacity-80 px-2 py-1"
                style={{ color: 'var(--accent)' }}
              >
                Monitoring
              </Link>
              <Link
                href="/estimates"
                className="text-sm font-medium transition-colors hover:opacity-80 px-2 py-1"
                style={{ color: 'var(--accent)' }}
              >
                Estimates
              </Link>
              <Link
                href="/communications"
                className="text-sm font-medium transition-colors hover:opacity-80 px-2 py-1"
                style={{ color: 'var(--accent)' }}
              >
                Communications
              </Link>
              <Link
                href="/templates"
                className="text-sm font-medium transition-colors hover:opacity-80 px-2 py-1"
                style={{ color: 'var(--accent)' }}
              >
                Templates
              </Link>
              <Link
                href="/measurements"
                className="text-sm font-medium transition-colors hover:opacity-80 px-2 py-1"
                style={{ color: 'var(--accent)' }}
              >
                Measurements
              </Link>
            </nav>
            <div className="flex items-center gap-3 ml-4 pl-4 border-l" style={{ borderColor: 'var(--glass-border)' }}>
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
        </div>
      </header>

      <main>
        <div className="app-shell-inner space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Link
              href="/boards"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Work Management
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Manage projects, leads, and workflows with boards
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                View Boards →
              </span>
            </Link>
            <Link
              href="/admin/users"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                User Management
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Manage users, roles, and permissions
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                Manage Users →
              </span>
            </Link>
            <Link
              href="/admin/policies"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Policy Management
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Upload and manage insurance policies
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                View Policies →
              </span>
            </Link>
            <Link
              href="/admin/dashboard"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Dashboard Metrics
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                View system statistics and activity
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                View Metrics →
              </span>
            </Link>
            <Link
              href="/alerts"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Alerts
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Monitor system alerts and notifications
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                View Alerts →
              </span>
            </Link>
            <Link
              href="/monitoring"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Monitoring
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                System health and compliance monitoring
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                View Dashboard →
              </span>
            </Link>
            <Link
              href="/estimates"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Estimates
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Generate and manage job estimates
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                View Estimates →
              </span>
            </Link>
            <Link
              href="/communications"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Communications
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Send emails and manage templates
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                View Communications →
              </span>
            </Link>
            <Link
              href="/templates"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Job Templates
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Manage job templates for workflows
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                View Templates →
              </span>
            </Link>
            <Link
              href="/measurements"
              className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                3D Measurements
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Upload and manage 3D measurement files
              </p>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                View Measurements →
              </span>
            </Link>
            <div className="glass-basic card-glass p-6">
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Active Jobs
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {jobs?.length || 0} active job{jobs?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

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
                  <Link href={`/field/jobs/${job.id}`}>
                    <div className="transition-colors duration-150 hover:bg-[var(--hover-bg-subtle)] rounded-xl cursor-pointer">
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
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
