import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/measurements/upload
 * Upload a measurement/3D file
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuth(request)
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string
    const room = formData.get('room') as string | null
    const fileType = formData.get('fileType') as string
    const metadataStr = formData.get('metadata') as string | null

    if (!file || !jobId || !fileType) {
      throw new ApiError('file, jobId, and fileType are required', 400)
    }

    const allowedTypes = ['3d_scan', 'lidar', 'floorplan', 'measurement_file']
    if (!allowedTypes.includes(fileType)) {
      throw new ApiError(`Invalid fileType. Allowed: ${allowedTypes.join(', ')}`, 400)
    }

    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      throw new ApiError('File size exceeds 100MB limit', 400)
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
    const isAssignedTech = job.lead_tech_id === user.id

    if (!isAdmin && !isAssignedTech) {
      throw new ApiError('Unauthorized', 403)
    }

    const fileName = `${Date.now()}-${file.name}`
    const storagePath = `measurements/${jobId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('measurements')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new ApiError(`Upload failed: ${uploadError.message}`, 500)
    }

    const metadata = metadataStr ? JSON.parse(metadataStr) : {}
    const { data: measurement, error: insertError } = await supabase
      .from('measurements')
      .insert({
        job_id: jobId,
        file_storage_path: storagePath,
        file_name: file.name,
        file_type: fileType,
        room: room || null,
        uploaded_by: user.id,
        metadata: metadata,
      })
      .select()
      .single()

    if (insertError) {
      throw new ApiError(`Failed to create measurement record: ${insertError.message}`, 500)
    }

    return successResponse({
      measurement,
      message: 'Measurement uploaded successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}
