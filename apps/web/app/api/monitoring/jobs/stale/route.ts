import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/monitoring/jobs/stale
 * Get stale jobs report (jobs without updates for X days)
 * 
 * Query params:
 * - days: number (default: 7) - Days without update to consider stale
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7', 10)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Get jobs without updates in the last X days
    const { data: staleJobs, error } = await supabase
      .from('jobs')
      .select('*, profiles!jobs_lead_tech_id_fkey(id, email, full_name)')
      .or(`updated_at.lt.${cutoffDate.toISOString()},updated_at.is.null`)
      .neq('status', 'closed')
      .order('updated_at', { ascending: true, nullsFirst: true })

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      staleJobs: staleJobs || [],
      cutoffDate: cutoffDate.toISOString(),
      days,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

