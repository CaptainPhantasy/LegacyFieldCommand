import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gateId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { gateId } = await params

  // Fetch gate
  const { data: gate, error: gateError } = await supabase
    .from('job_gates')
    .select('*, jobs!inner(lead_tech_id)')
    .eq('id', gateId)
    .single()

  if (gateError || !gate) {
    return NextResponse.json({ error: 'Gate not found' }, { status: 404 })
  }

  // Verify user is assigned to the job
  if ((gate.jobs as any).lead_tech_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Determine requirements based on gate type
  const requirements = getGateRequirements(gate.stage_name)
  
  // Check if gate can be completed
  const { data: photos } = await supabase
    .from('job_photos')
    .select('*')
    .eq('gate_id', gateId)

  const canComplete = checkGateCompletion(gate, photos || [])

  return NextResponse.json({
    gate: {
      id: gate.id,
      stage_name: gate.stage_name,
      status: gate.status,
      requires_exception: gate.requires_exception,
      exception_reason: gate.exception_reason,
    },
    requirements,
    canComplete,
  })
}

function getGateRequirements(stageName: string): string[] {
  switch (stageName) {
    case 'Arrival':
      return ['Arrival photo (exterior of property/unit)', 'Timestamp (auto-captured)']
    case 'Photos':
      return [
        'Minimum 3 photos per documented room',
        'Wide room shot',
        'Close-up of damage',
        'Context/equipment photo'
      ]
    case 'Intake':
      return ['Customer information', 'Initial assessment notes']
    case 'Moisture/Equipment':
      return ['Moisture readings', 'Equipment documentation']
    case 'Scope':
      return ['Damage scope', 'Measurements or visual estimate']
    case 'Sign-offs':
      return ['Customer signature', 'Documentation complete']
    case 'Departure':
      return ['Departure photo', 'Final notes']
    default:
      return []
  }
}

function checkGateCompletion(gate: any, photos: any[]): boolean {
  if (gate.requires_exception) return true
  
  switch (gate.stage_name) {
    case 'Arrival':
      return photos.some(p => JSON.parse(p.metadata || '{}').type === 'arrival')
    case 'Photos':
      const roomsWithPhotos: Record<string, number> = {}
      photos.forEach(p => {
        const metadata = JSON.parse(p.metadata || '{}')
        const room = metadata.room
        if (room) {
          roomsWithPhotos[room] = (roomsWithPhotos[room] || 0) + 1
        }
      })
      return Object.values(roomsWithPhotos).some(count => count >= 3)
    default:
      return false
  }
}

