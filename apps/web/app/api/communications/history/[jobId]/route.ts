import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, parsePagination, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/communications/history/[jobId]
 * Get communication history for a job
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - type: string (filter by 'email', 'voice', 'sms')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { jobId } = await params
    const { page, limit, offset } = parsePagination(request)
    const searchParams = request.nextUrl.searchParams

    // Verify job exists and user has access
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    // Check if user has access (admin or assigned tech)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role && ['admin', 'owner', 'estimator'].includes(profile.role)
    const isAssignedTech = job.lead_tech_id === user.id

    if (!isAdmin && !isAssignedTech) {
      throw new ApiError('Forbidden: Access denied', 403)
    }

    // Build query
    let query = supabase
      .from('communications')
      .select('*, profiles!communications_created_by_fkey(id, email, full_name), email_templates(id, name)', { count: 'exact' })
      .eq('job_id', jobId)

    // Filter by type if provided
    const type = searchParams.get('type')
    if (type) {
      query = query.eq('type', type)
    }

    // Order by created_at desc (newest first)
    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data: communications, error, count } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      communications: communications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

