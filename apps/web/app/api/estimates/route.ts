import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, parsePagination, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/estimates
 * List estimates with pagination and filtering
 * 
 * Query params:
 * - page, limit: pagination
 * - jobId: filter by job
 * - status: filter by status
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)
    const { page, limit, offset } = parsePagination(request)
    const searchParams = request.nextUrl.searchParams

    let query = supabase
      .from('estimates')
      .select('*, jobs(id, title), policies(id, policy_number, carrier_name)', { count: 'exact' })

    // Apply filters
    const jobId = searchParams.get('jobId')
    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data: estimates, error, count } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      estimates: estimates || [],
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

