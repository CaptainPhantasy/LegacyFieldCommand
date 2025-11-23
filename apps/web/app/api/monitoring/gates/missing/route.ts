import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/monitoring/gates/missing
 * Get report of missing artifacts (gates without required photos/data)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

    // Get gates that are marked complete but may be missing required artifacts
    let query = supabase
      .from('job_gates')
      .select('*, jobs(id, title, lead_tech_id)')
      .eq('status', 'complete')
      .eq('requires_exception', false)

    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    const { data: completedGates, error: gatesError } = await query

    if (gatesError) {
      throw new ApiError(gatesError.message, 500)
    }

    // Check for missing photos for gates that require them
    const gatesWithMissingArtifacts: any[] = []

    for (const gate of completedGates || []) {
      if (gate.stage_name === 'Arrival' || gate.stage_name === 'Photos') {
        // Check if gate has photos
        const { data: photos } = await supabase
          .from('job_photos')
          .select('id')
          .eq('gate_id', gate.id)
          .limit(1)

        if (!photos || photos.length === 0) {
          gatesWithMissingArtifacts.push({
            ...gate,
            missingArtifact: 'photos',
          })
        }
      }

      // Add more artifact checks as needed
    }

    return successResponse({
      gatesWithMissingArtifacts,
      totalChecked: completedGates?.length || 0,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

