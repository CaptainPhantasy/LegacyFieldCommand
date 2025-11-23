import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, parsePagination, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/admin/policies
 * List all policies with pagination and filtering
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: string filter (pending, parsed, error)
 * - jobId: string filter (policies for specific job)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request)
    const { page, limit, offset } = parsePagination(request)
    const searchParams = request.nextUrl.searchParams

    // Build query
    let query = supabase
      .from('policies')
      .select('*, jobs(id, title), profiles!policies_created_by_fkey(id, email, full_name)', { count: 'exact' })

    // Apply filters
    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    const jobId = searchParams.get('jobId')
    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    // Apply sorting (newest first)
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: policies, error, count } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      policies: policies || [],
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

