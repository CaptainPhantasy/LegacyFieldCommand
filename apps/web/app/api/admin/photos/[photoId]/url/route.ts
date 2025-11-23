import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/admin/photos/[photoId]/url
 * Get a signed URL for a job photo (admin access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { photoId } = await params

    // Get photo record
    const { data: photo, error: photoError } = await supabase
      .from('job_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single()

    if (photoError || !photo) {
      throw new ApiError('Photo not found', 404)
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

