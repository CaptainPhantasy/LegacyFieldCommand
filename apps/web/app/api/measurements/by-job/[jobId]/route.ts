import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/measurements/by-job/[jobId]
 * Get all measurements for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { jobId } = await params

    // Verify job exists and user has access
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    // Get measurements
    const { data: measurements, error: measurementsError } = await supabase
      .from('measurements')
      .select('*, profiles!measurements_uploaded_by_fkey(id, email, full_name)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (measurementsError) {
      throw new ApiError(measurementsError.message, 500)
    }

    // Get signed URLs for files
    const measurementsWithUrls = await Promise.all(
      (measurements || []).map(async (measurement: any) => {
        if (measurement.file_storage_path) {
          const { data: urlData } = await supabase.storage
            .from('measurements')
            .createSignedUrl(measurement.file_storage_path, 3600) // 1 hour expiry
          
          return {
            ...measurement,
            file_url: urlData?.signedUrl || null,
          }
        }
        return measurement
      })
    )

    return successResponse({
      measurements: measurementsWithUrls,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

