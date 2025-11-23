import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: {
    id: string
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { id } = await params

  // Verify user is assigned to this job
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('lead_tech_id', user.id)
    .single()

  if (!job) {
    return redirect('/field')
  }

  // Fetch gates for this job
  const { data: gates } = await supabase
    .from('job_gates')
    .select('*')
    .eq('job_id', id)
    .order('created_at')

  const gateOrder = ['Arrival', 'Intake', 'Photos', 'Moisture/Equipment', 'Scope', 'Sign-offs', 'Departure']
  const orderedGates = gateOrder.map(stageName => 
    gates?.find(g => g.stage_name === stageName)
  ).filter(Boolean)

  return (
    <div className="app-shell">
      <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner">
          <Link
            href="/field"
            className="mb-4 inline-block text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            ← Back to Jobs
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {job.title}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {job.address_line_1 || 'No address'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Status: {job.status}
          </p>
        </div>
      </header>

      <main>
        <div className="app-shell-inner max-w-3xl">
          <h2 className="mb-6 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Visit Workflow
          </h2>
          
          <div className="space-y-4">
            {orderedGates.map((gate) => (
              <Link
                key={gate.id}
                href={`/field/gates/${gate.id}`}
                className="block glass-basic card-glass border border-[var(--glass-border)] transition-colors hover:border-[var(--accent)]"
                >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-8 items-center rounded-full bg-[var(--badge-bg)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                      {gate.status === 'complete'
                        ? 'Complete'
                        : gate.status === 'in_progress'
                        ? 'In progress'
                        : gate.status === 'skipped'
                        ? 'Skipped'
                        : 'Pending'}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {gate.stage_name}
                      </h3>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    Open
                  </Button>
                </div>
                {gate.requires_exception && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Exception:</strong> {gate.exception_reason}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

