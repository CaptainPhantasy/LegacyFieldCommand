import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/monitoring/compliance
 * Get compliance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

    // Get all gates
    let gatesQuery = supabase
      .from('job_gates')
      .select('*')

    if (jobId) {
      gatesQuery = gatesQuery.eq('job_id', jobId)
    }

    const { data: gates, error: gatesError } = await gatesQuery

    if (gatesError) {
      throw new ApiError(gatesError.message, 500)
    }

    // Calculate compliance metrics
    const totalGates = gates?.length || 0
    const completedGates = gates?.filter(g => g.status === 'complete').length || 0
    const skippedGates = gates?.filter(g => g.status === 'skipped' || g.requires_exception).length || 0
    const pendingGates = gates?.filter(g => g.status === 'pending').length || 0

    const complianceRate = totalGates > 0 ? (completedGates / totalGates) * 100 : 0
    const exceptionRate = totalGates > 0 ? (skippedGates / totalGates) * 100 : 0

    // Check for gates with exceptions (potential fudging indicator)
    const gatesWithExceptions = gates?.filter(g => g.requires_exception).length || 0

    return successResponse({
      metrics: {
        totalGates,
        completedGates,
        skippedGates,
        pendingGates,
        complianceRate: Math.round(complianceRate * 100) / 100,
        exceptionRate: Math.round(exceptionRate * 100) / 100,
        gatesWithExceptions,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

