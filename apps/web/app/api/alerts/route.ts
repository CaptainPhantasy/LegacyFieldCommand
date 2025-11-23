import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, parsePagination, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/alerts
 * List alerts with filtering
 * 
 * Query params:
 * - page, limit: pagination
 * - status: filter by status ('active', 'acknowledged', 'resolved', 'dismissed')
 * - severity: filter by severity ('low', 'medium', 'high', 'critical')
 * - jobId: filter by job
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)
    const { page, limit, offset } = parsePagination(request)
    const searchParams = request.nextUrl.searchParams

    let query = supabase
      .from('alerts')
      .select('*, jobs(id, title), alert_rules(id, name)', { count: 'exact' })

    // Apply filters
    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    const severity = searchParams.get('severity')
    if (severity) {
      query = query.eq('severity', severity)
    }

    const jobId = searchParams.get('jobId')
    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    // Order by created_at desc (newest first)
    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data: alerts, error, count } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      alerts: alerts || [],
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

