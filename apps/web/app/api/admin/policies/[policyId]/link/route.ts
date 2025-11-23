import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/admin/policies/[policyId]/link
 * Link policy to a job
 * 
 * Body:
 * {
 *   jobId: string (required)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { policyId } = await params
    const body = await request.json()

    if (!body.jobId) {
      throw new ApiError('jobId is required', 400)
    }

    // Verify policy exists
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('id')
      .eq('id', policyId)
      .single()

    if (policyError || !policy) {
      throw new ApiError('Policy not found', 404)
    }

    // Verify job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', body.jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    // Link policy to job
    const { data: updatedPolicy, error: updateError } = await supabase
      .from('policies')
      .update({ job_id: body.jobId })
      .eq('id', policyId)
      .select('*, jobs(id, title)')
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    return successResponse({
      policy: updatedPolicy,
      message: `Policy linked to job: ${job.title}`,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

