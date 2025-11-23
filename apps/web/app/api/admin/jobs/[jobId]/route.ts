import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/admin/jobs/[jobId]
 * Get job details with gates and related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { jobId } = await params

    // Get job with lead tech info
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, profiles!jobs_lead_tech_id_fkey(id, email, full_name, role)')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    // Get gates for this job
    const { data: gates, error: gatesError } = await supabase
      .from('job_gates')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at')

    if (gatesError) {
      console.error('Error fetching gates:', gatesError)
    }

    return successResponse({
      job,
      gates: gates || [],
    })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PUT /api/admin/jobs/[jobId]
 * Update job
 * 
 * Body: Partial job fields (title, address_line_1, status, lead_tech_id, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { jobId } = await params
    const body = await request.json()

    // Verify job exists
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .single()

    if (checkError || !existingJob) {
      throw new ApiError('Job not found', 404)
    }

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.address_line_1 !== undefined) updateData.address_line_1 = body.address_line_1
    if (body.address_line_2 !== undefined) updateData.address_line_2 = body.address_line_2
    if (body.status !== undefined) updateData.status = body.status
    if (body.lead_tech_id !== undefined) updateData.lead_tech_id = body.lead_tech_id || null

    // Update job
    const { data: job, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select('*, profiles!jobs_lead_tech_id_fkey(id, email, full_name, role)')
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    return successResponse({ job })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * DELETE /api/admin/jobs/[jobId]
 * Delete job (soft delete by setting status to 'closed' or hard delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { jobId } = await params
    const searchParams = request.nextUrl.searchParams
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - remove from database
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (deleteError) {
        throw new ApiError(deleteError.message, 500)
      }

      return successResponse({ message: 'Job deleted' })
    } else {
      // Soft delete - set status to 'closed'
      const { data: job, error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', jobId)
        .select()
        .single()

      if (updateError) {
        throw new ApiError(updateError.message, 500)
      }

      return successResponse({ job, message: 'Job closed' })
    }
  } catch (error) {
    return errorResponse(error)
  }
}

