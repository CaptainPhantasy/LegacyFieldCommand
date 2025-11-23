import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { orchestrator } from '@/lib/llm'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { command, context, useLLM } = body

  if (!command || typeof command !== 'string') {
    return NextResponse.json({ error: 'Command is required' }, { status: 400 })
  }

  // Try LLM first if enabled (default: true), fallback to pattern matching
  const useAI = useLLM !== false // Default to true
  let intent = 'unknown'
  let action = ''
  let data: any = {}
  let response = ''
  let llmMetadata: any = null

  if (useAI) {
    try {
      // Use LLM orchestrator to process voice command
      const llmResult = await orchestrator.process({
        useCase: 'voice_command',
        input: command,
        context: {
          jobId: context?.jobId,
          gateId: context?.gateId,
          userId: authUser.id,
          userRole: 'field_tech', // Could be enhanced to get from user profile
        },
        options: {
          includeActions: true,
          includeContext: true,
        },
      })

      // Parse intent data from LLM response
      try {
        const intentData = JSON.parse(llmResult.response)
        intent = intentData.intent || 'unknown'
        action = intentData.action || ''
        data = intentData.data || {}
        response = intentData.response || 'Command processed'
        llmMetadata = {
          model: llmResult.metadata?.model,
          provider: llmResult.metadata?.provider,
          confidence: llmResult.metadata?.confidence || intentData.confidence,
        }
      } catch (parseError) {
        console.error('Failed to parse LLM response as JSON:', parseError)
        // Fall through to pattern matching
      }
    } catch (llmError) {
      console.warn('LLM voice command processing failed, falling back to pattern matching:', llmError)
      // Fall through to pattern matching
    }
  }

  // Fallback to pattern matching if LLM not used or failed
  if (intent === 'unknown' && (!useAI || !response)) {
    // Normalize command
    const normalizedCommand = command.toLowerCase().trim()

  // Get user's assigned jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('lead_tech_id', authUser.id)
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
  }

  return NextResponse.json({
    intent,
    action,
    data,
    response,
    ...(llmMetadata ? { metadata: llmMetadata } : {}),
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

