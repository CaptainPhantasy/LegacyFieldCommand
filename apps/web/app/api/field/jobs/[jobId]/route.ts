import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params

  // Verify user is assigned to this job
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('lead_tech_id', user.id)
    .single()

  if (!job) {
    return NextResponse.json({ error: 'Job not found or not assigned' }, { status: 404 })
  }

  // Fetch gates
  const { data: gates, error } = await supabase
    .from('job_gates')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ job, gates: gates || [] })
}

