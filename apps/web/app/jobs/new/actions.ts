'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createJob(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const address = formData.get('address') as string
  const leadTechId = formData.get('leadTechId') as string

  // 1. Create Job
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      title,
      address_line_1: address,
      lead_tech_id: leadTechId === 'unassigned' ? null : leadTechId,
      status: 'lead'
    })
    .select()
    .single()

  if (error) {
      console.error(error)
      throw new Error(error.message)
  }

  // 2. Create Default Gates (all 7 gates from requirements)
  const gates = [
      { job_id: job.id, stage_name: 'Arrival', status: 'pending' },
      { job_id: job.id, stage_name: 'Intake', status: 'pending' },
      { job_id: job.id, stage_name: 'Photos', status: 'pending' },
      { job_id: job.id, stage_name: 'Moisture/Equipment', status: 'pending' },
      { job_id: job.id, stage_name: 'Scope', status: 'pending' },
      { job_id: job.id, stage_name: 'Sign-offs', status: 'pending' },
      { job_id: job.id, stage_name: 'Departure', status: 'pending' },
  ]
  
  const { error: gatesError } = await supabase.from('job_gates').insert(gates)
  
  if (gatesError) {
      console.error('Error creating gates:', gatesError)
  }

  revalidatePath('/')
  redirect('/')
}

