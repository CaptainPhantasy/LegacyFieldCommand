import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/admin/policies/upload
 * Upload a policy PDF file
 * 
 * Body: FormData with:
 * - file: File (PDF)
 * - jobId?: string (optional, can link later)
 * - policyNumber?: string
 * - carrierName?: string
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAdmin(request)
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string | null
    const policyNumber = formData.get('policyNumber') as string | null
    const carrierName = formData.get('carrierName') as string | null

    if (!file) {
      throw new ApiError('File is required', 400)
    }

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      throw new ApiError('Only PDF files are allowed', 400)
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new ApiError('File size exceeds 10MB limit', 400)
    }

    // If jobId provided, verify it exists
    if (jobId) {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .single()

      if (jobError || !job) {
        throw new ApiError('Job not found', 404)
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `policy_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const storagePath = `policies/${fileName}`

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('policies')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      throw new ApiError(`Failed to upload file: ${uploadError.message}`, 500)
    }

    // Create policy record
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .insert({
        job_id: jobId || null,
        policy_number: policyNumber || null,
        carrier_name: carrierName || null,
        pdf_storage_path: storagePath,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single()

    if (policyError) {
      // Clean up uploaded file if policy creation fails
      await supabase.storage.from('policies').remove([storagePath])
      throw new ApiError(policyError.message, 500)
    }

    return successResponse({
      policy,
      message: 'Policy uploaded successfully. Ready for parsing.',
    }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

