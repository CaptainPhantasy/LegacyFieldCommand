import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/measurements/by-id/[measurementId]/link
 * Link measurement to line items and/or gates
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ measurementId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { measurementId } = await params
    const body = await request.json()

    // Verify measurement exists
    const { data: measurement, error: measurementError } = await supabase
      .from('measurements')
      .select('*')
      .eq('id', measurementId)
      .single()

    if (measurementError || !measurement) {
      throw new ApiError('Measurement not found', 404)
    }

    // Verify line items exist if provided
    if (body.lineItemIds && Array.isArray(body.lineItemIds) && body.lineItemIds.length > 0) {
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('estimate_line_items')
        .select('id')
        .in('id', body.lineItemIds)

      if (lineItemsError) {
        throw new ApiError(lineItemsError.message, 500)
      }

      if (lineItems.length !== body.lineItemIds.length) {
        throw new ApiError('Some line items not found', 404)
      }
    }

    // Verify gates exist if provided
    if (body.gateIds && Array.isArray(body.gateIds) && body.gateIds.length > 0) {
      const { data: gates, error: gatesError } = await supabase
        .from('job_gates')
        .select('id')
        .in('id', body.gateIds)

      if (gatesError) {
        throw new ApiError(gatesError.message, 500)
      }

      if (gates.length !== body.gateIds.length) {
        throw new ApiError('Some gates not found', 404)
      }
    }

    // Update measurement with links
    const { data: updatedMeasurement, error: updateError } = await supabase
      .from('measurements')
      .update({
        linked_to_line_items: body.lineItemIds || [],
        linked_to_gates: body.gateIds || [],
      })
      .eq('id', measurementId)
      .select()
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    return successResponse({
      measurement: updatedMeasurement,
      message: 'Measurement linked successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}
