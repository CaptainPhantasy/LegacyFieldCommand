import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gateId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { gateId } = await params
  const body = await request.json()

  // Fetch gate and verify permissions
  const { data: gate, error: gateError } = await supabase
    .from('job_gates')
    .select('*, jobs!inner(lead_tech_id, id)')
    .eq('id', gateId)
    .single()

  if (gateError || !gate) {
    return NextResponse.json({ error: 'Gate not found' }, { status: 404 })
  }

  if ((gate.jobs as any).lead_tech_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update gate status
  const { data: updatedGate, error: updateError } = await supabase
    .from('job_gates')
    .update({
      status: 'complete',
      completed_at: new Date().toISOString(),
      completed_by: user.id,
    })
    .eq('id', gateId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ gate: updatedGate, success: true })
}

