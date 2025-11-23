import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/admin/jobs/[jobId]/assign
 * Assign job to a field tech
 * 
 * Body:
 * {
 *   lead_tech_id: string | null (required)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { jobId } = await params
    const body = await request.json()

    if (body.lead_tech_id === undefined) {
      throw new ApiError('lead_tech_id is required (can be null to unassign)', 400)
    }

    // Verify job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    // If assigning to a tech, verify they exist and are a field tech
    if (body.lead_tech_id) {
      const { data: tech, error: techError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', body.lead_tech_id)
        .single()

      if (techError || !tech) {
        throw new ApiError('Field tech not found', 404)
      }

      if (tech.role !== 'field_tech' && tech.role !== 'lead_tech') {
        throw new ApiError('User must be a field tech or lead tech', 400)
      }
    }

    // Update job assignment
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({ lead_tech_id: body.lead_tech_id || null })
      .eq('id', jobId)
      .select('*, profiles!jobs_lead_tech_id_fkey(id, email, full_name, role)')
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    return successResponse({
      job: updatedJob,
      message: body.lead_tech_id
        ? 'Job assigned successfully'
        : 'Job unassigned successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

