import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/estimates/[estimateId]/line-items
 * Get line items for an estimate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { estimateId } = await params

    // Verify estimate exists
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('id')
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

    return successResponse({ lineItems: lineItems || [] })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/estimates/[estimateId]/line-items
 * Add a line item to an estimate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { estimateId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.code || !body.description || body.quantity === undefined || body.unit_cost === undefined) {
      throw new ApiError('code, description, quantity, and unit_cost are required', 400)
    }

    // Verify estimate exists
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('id')
      .eq('id', estimateId)
      .single()

    if (estimateError || !estimate) {
      throw new ApiError('Estimate not found', 404)
    }

    // Create line item
    const { data: lineItem, error: lineItemError } = await supabase
      .from('estimate_line_items')
      .insert({
        estimate_id: estimateId,
        code: body.code,
        xactimate_code: body.xactimate_code || null,
        description: body.description,
        category: body.category || null,
        room: body.room || null,
        quantity: body.quantity,
        unit_cost: body.unit_cost,
        coverage_bucket: body.coverage_bucket || 'insurance',
        covered_amount: body.coverage_bucket === 'insurance' ? body.quantity * body.unit_cost : 0,
        customer_pay_amount: body.coverage_bucket === 'customer_pay' ? body.quantity * body.unit_cost : 0,
        non_covered_amount: body.coverage_bucket === 'non_covered' ? body.quantity * body.unit_cost : 0,
        notes: body.notes || null,
        metadata: body.metadata || null,
      })
      .select()
      .single()

    if (lineItemError) {
      throw new ApiError(lineItemError.message, 500)
    }

    // Recalculate estimate totals
    await supabase.rpc('recalculate_estimate_totals', { estimate_uuid: estimateId })

    return successResponse({ lineItem }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

