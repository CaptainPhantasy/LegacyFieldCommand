import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/admin/policies/[policyId]
 * Get policy details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { policyId } = await params

    const { data: policy, error } = await supabase
      .from('policies')
      .select('*, jobs(id, title), profiles!policies_created_by_fkey(id, email, full_name)')
      .eq('id', policyId)
      .single()

    if (error || !policy) {
      throw new ApiError('Policy not found', 404)
    }

    // Get signed URL for PDF if it exists
    let pdfUrl = null
    if (policy.pdf_storage_path) {
      const { data: urlData } = await supabase.storage
        .from('policies')
        .createSignedUrl(policy.pdf_storage_path, 3600) // 1 hour expiry
      
      pdfUrl = urlData?.signedUrl || null
    }

    return successResponse({
      policy: {
        ...policy,
        pdf_url: pdfUrl,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PUT /api/admin/policies/[policyId]
 * Update policy
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { policyId } = await params
    const body = await request.json()

    // Verify policy exists
    const { data: existingPolicy, error: checkError } = await supabase
      .from('policies')
      .select('id')
      .eq('id', policyId)
      .single()

    if (checkError || !existingPolicy) {
      throw new ApiError('Policy not found', 404)
    }

    // Build update object
    const updateData: any = {}
    if (body.policy_number !== undefined) updateData.policy_number = body.policy_number
    if (body.carrier_name !== undefined) updateData.carrier_name = body.carrier_name
    if (body.policy_type !== undefined) updateData.policy_type = body.policy_type
    if (body.deductible !== undefined) updateData.deductible = body.deductible
    if (body.coverage_limits !== undefined) updateData.coverage_limits = body.coverage_limits
    if (body.coverage_summary !== undefined) updateData.coverage_summary = body.coverage_summary
    if (body.effective_date !== undefined) updateData.effective_date = body.effective_date
    if (body.expiration_date !== undefined) updateData.expiration_date = body.expiration_date
    if (body.status !== undefined) updateData.status = body.status

    const { data: policy, error: updateError } = await supabase
      .from('policies')
      .update(updateData)
      .eq('id', policyId)
      .select()
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    return successResponse({ policy })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * DELETE /api/admin/policies/[policyId]
 * Delete policy
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { policyId } = await params

    // Get policy to find PDF path
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('pdf_storage_path')
      .eq('id', policyId)
      .single()

    if (policyError || !policy) {
      throw new ApiError('Policy not found', 404)
    }

    // Delete PDF from storage if it exists
    if (policy.pdf_storage_path) {
      await supabase.storage.from('policies').remove([policy.pdf_storage_path])
    }

    // Delete policy record
    const { error: deleteError } = await supabase
      .from('policies')
      .delete()
      .eq('id', policyId)

    if (deleteError) {
      throw new ApiError(deleteError.message, 500)
    }

    return successResponse({ message: 'Policy deleted' })
  } catch (error) {
    return errorResponse(error)
  }
}

