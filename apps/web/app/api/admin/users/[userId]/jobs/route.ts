import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/admin/users/[userId]/jobs
 * Get all jobs assigned to a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { userId } = await params

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new ApiError('User not found', 404)
    }

    // Get jobs assigned to this user
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('lead_tech_id', userId)
      .order('created_at', { ascending: false })

    if (jobsError) {
      throw new ApiError(jobsError.message, 500)
    }

    return successResponse({ jobs: jobs || [] })
  } catch (error) {
    return errorResponse(error)
  }
}

