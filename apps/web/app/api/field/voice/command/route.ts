import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { command, context } = body

  if (!command || typeof command !== 'string') {
    return NextResponse.json({ error: 'Command is required' }, { status: 400 })
  }

  // Normalize command
  const normalizedCommand = command.toLowerCase().trim()

  // Intent recognition
  let intent = 'unknown'
  let action = ''
  let data: any = {}
  let response = ''

  // Get user's assigned jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('lead_tech_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentJob = context?.jobId 
    ? jobs?.find(j => j.id === context.jobId) 
    : jobs?.[0]

  if (normalizedCommand.includes('show') && normalizedCommand.includes('job')) {
    intent = 'list_jobs'
    action = 'GET /api/field/jobs'
    response = `You have ${jobs?.length || 0} assigned job${jobs?.length !== 1 ? 's' : ''}.`
    if (jobs && jobs.length > 0) {
      response += ` Your current job is: ${jobs[0].title} at ${jobs[0].address_line_1}.`
    }
  } else if (normalizedCommand.includes('start') || normalizedCommand.includes('open')) {
    if (normalizedCommand.includes('arrival')) {
      intent = 'open_gate'
      action = 'navigate_to_arrival'
      if (currentJob) {
        const { data: gates } = await supabase
          .from('job_gates')
          .select('*')
          .eq('job_id', currentJob.id)
          .eq('stage_name', 'Arrival')
          .single()
        
        if (gates) {
          data = { gateId: gates.id, jobId: currentJob.id }
          response = `Opening Arrival gate for ${currentJob.title}. Please take an arrival photo.`
        } else {
          response = 'Arrival gate not found for current job.'
        }
      } else {
        response = 'No job selected. Please select a job first.'
      }
    }
  } else if (normalizedCommand.includes('take') || normalizedCommand.includes('capture')) {
    if (normalizedCommand.includes('photo') || normalizedCommand.includes('picture')) {
      intent = 'capture_photo'
      action = 'trigger_camera'
      response = 'Please take a photo now. The camera should be activated.'
    }
  } else if (normalizedCommand.includes('complete')) {
    if (normalizedCommand.includes('arrival')) {
      intent = 'complete_gate'
      action = 'POST /api/field/gates/:gateId/complete'
      if (context?.gateId) {
        data = { gateId: context.gateId }
        response = 'Completing Arrival gate. Please ensure you have taken the required arrival photo.'
      } else {
        response = 'No gate specified. Please open a gate first.'
      }
    }
  } else if (normalizedCommand.includes('exception') || normalizedCommand.includes('skip')) {
    intent = 'log_exception'
    action = 'POST /api/field/gates/:gateId/exception'
    const reasonMatch = normalizedCommand.match(/exception[:\s]+(.+)|skip[:\s]+(.+)/i)
    const reason = reasonMatch?.[1] || reasonMatch?.[2] || 'Exception logged via voice command'
    if (context?.gateId) {
      data = { gateId: context.gateId, reason }
      response = `Exception logged: ${reason}`
    } else {
      response = 'No gate specified. Please open a gate first.'
    }
  } else if (normalizedCommand.includes('status') || normalizedCommand.includes('required')) {
    intent = 'get_requirements'
    action = 'GET /api/field/gates/:gateId'
    if (context?.gateId) {
      const { data: gate } = await supabase
        .from('job_gates')
        .select('*')
        .eq('id', context.gateId)
        .single()
      
      if (gate) {
        const requirements = getGateRequirements(gate.stage_name)
        response = `For ${gate.stage_name} gate, you need: ${requirements.join(', ')}.`
      } else {
        response = 'Gate not found.'
      }
    } else {
      response = 'No gate specified. Please open a gate first.'
    }
  } else if (normalizedCommand.includes('next')) {
    intent = 'next_gate'
    action = 'navigate_to_next_gate'
    if (currentJob) {
      const { data: gates } = await supabase
        .from('job_gates')
        .select('*')
        .eq('job_id', currentJob.id)
        .eq('status', 'pending')
        .order('created_at')
        .limit(1)
      
      if (gates && gates.length > 0) {
        data = { gateId: gates[0].id, jobId: currentJob.id }
        response = `Next gate is ${gates[0].stage_name}. Opening now.`
      } else {
        response = 'No pending gates remaining.'
      }
    } else {
      response = 'No job selected.'
    }
  } else {
    response = `I didn't understand that command. Try: "show my jobs", "start arrival gate", "take photo", "complete arrival gate", or "log exception: [reason]".`
  }

  return NextResponse.json({
    intent,
    action,
    data,
    response,
  })
}

function getGateRequirements(stageName: string): string[] {
  switch (stageName) {
    case 'Arrival':
      return ['Arrival photo', 'Timestamp']
    case 'Photos':
      return ['3 photos per room', 'Wide shot', 'Close-up', 'Context photo']
    case 'Intake':
      return ['Customer information', 'Initial assessment']
    case 'Moisture/Equipment':
      return ['Moisture readings', 'Equipment documentation']
    case 'Scope':
      return ['Damage scope', 'Measurements']
    case 'Sign-offs':
      return ['Customer signature', 'Documentation']
    case 'Departure':
      return ['Departure photo', 'Final notes']
    default:
      return []
  }
}

