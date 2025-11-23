import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/field/photos/[photoId]/url
 * Get a signed URL for a job photo
 * 
 * This ensures photos are only accessible to authorized users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { supabase, user } = await requireAuth(request)
    const { photoId } = await params

    // Get photo record
    const { data: photo, error: photoError } = await supabase
      .from('job_photos')
      .select('*, jobs!inner(id, lead_tech_id)')
      .eq('id', photoId)
      .single()

    if (photoError || !photo) {
      throw new ApiError('Photo not found', 404)
    }

    // Verify user has access to this job
    const job = photo.jobs as any
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'estimator'
    const isAssignedTech = job.lead_tech_id === user.id

    if (!isAdmin && !isAssignedTech) {
      throw new ApiError('Forbidden', 403)
    }

    // Create signed URL (1 hour expiry)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('job-photos')
      .createSignedUrl(photo.storage_path, 3600)

    if (urlError || !urlData) {
      throw new ApiError('Failed to generate photo URL', 500)
    }

    return successResponse({
      url: urlData.signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

