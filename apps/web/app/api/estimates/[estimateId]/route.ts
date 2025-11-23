import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/estimates/[estimateId]
 * Get estimate details with line items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { estimateId } = await params

    // Get estimate
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('*, jobs(id, title), policies(id, policy_number, carrier_name)')
      .eq('id', estimateId)
      .single()

    if (estimateError || !estimate) {
      throw new ApiError('Estimate not found', 404)
    }

    // Get line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at')

    if (lineItemsError) {
      throw new ApiError(lineItemsError.message, 500)
    }

    return successResponse({
      estimate,
      lineItems: lineItems || [],
    })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PUT /api/estimates/[estimateId]
 * Update estimate
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { estimateId } = await params
    const body = await request.json()

    // Verify estimate exists
    const { data: existingEstimate, error: checkError } = await supabase
      .from('estimates')
      .select('id, status')
      .eq('id', estimateId)
      .single()

    if (checkError || !existingEstimate) {
      throw new ApiError('Estimate not found', 404)
    }

    // Build update object
    const updateData: any = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.policy_id !== undefined) updateData.policy_id = body.policy_id
    if (body.version !== undefined) updateData.version = body.version

    const { data: estimate, error: updateError } = await supabase
      .from('estimates')
      .update(updateData)
      .eq('id', estimateId)
      .select()
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    return successResponse({ estimate })
  } catch (error) {
    return errorResponse(error)
  }
}

