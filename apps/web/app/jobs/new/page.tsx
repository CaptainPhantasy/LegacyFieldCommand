import { createClient } from '@/utils/supabase/server'
import { createJob } from './actions'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default async function NewJobPage() {
  const supabase = await createClient()
  
  // Fetch techs
  const { data: techs } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'field_tech')

  return (
    <div className="app-shell">
      <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner">
          <Link
            href="/"
            className="mb-4 inline-block text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Create New Job
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Add a new restoration job and assign it to a field tech
          </p>
        </div>
      </header>

      <main>
        <div className="app-shell-inner">
          <form action={createJob} className="glass-basic card-glass space-y-6">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Smith Residence - Water Loss"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                type="text"
                required
                placeholder="123 Main St, City, State ZIP"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="leadTechId">Assign Lead Tech</Label>
              <Select
                id="leadTechId"
                name="leadTechId"
                className="mt-2"
              >
                <option value="unassigned">Unassigned</option>
                {techs?.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name || tech.id}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href="/">Cancel</Link>
              </Button>
              <Button
                type="submit"
                style={{ background: 'var(--accent)', color: '#ffffff' }}
              >
                Create Job
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

