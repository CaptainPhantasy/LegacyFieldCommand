import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's most recent job
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('lead_tech_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentJob = jobs?.[0]

  // Get first pending gate for current job
  let currentGate = null
  if (currentJob) {
    const { data: gates } = await supabase
      .from('job_gates')
      .select('*')
      .eq('job_id', currentJob.id)
      .eq('status', 'pending')
      .order('created_at')
      .limit(1)
    
    currentGate = gates?.[0]
  }

  return NextResponse.json({
    currentJob: currentJob ? {
      id: currentJob.id,
      title: currentJob.title,
      address: currentJob.address_line_1,
    } : null,
    currentGate: currentGate ? {
      id: currentGate.id,
      stage_name: currentGate.stage_name,
      status: currentGate.status,
    } : null,
    sessionState: {
      userId: user.id,
      timestamp: new Date().toISOString(),
    },
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { jobId, gateId } = body

  // Store context in session or return it
  // For now, just validate and return
  if (jobId) {
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('lead_tech_id', user.id)
      .single()
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found or not assigned' }, { status: 404 })
    }
  }

  if (gateId) {
    const { data: gate } = await supabase
      .from('job_gates')
      .select('*, jobs!inner(lead_tech_id)')
      .eq('id', gateId)
      .single()
    
    if (!gate || (gate.jobs as any).lead_tech_id !== user.id) {
      return NextResponse.json({ error: 'Gate not found or not accessible' }, { status: 404 })
    }
  }

  return NextResponse.json({ success: true, context: { jobId, gateId } })
}

