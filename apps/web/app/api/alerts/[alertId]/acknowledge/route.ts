import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/alerts/[alertId]/acknowledge
 * Acknowledge an alert
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { supabase, user } = await requireAuth(request)
    const { alertId } = await params

    // Verify alert exists
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('id, status')
      .eq('id', alertId)
      .single()

    if (alertError || !alert) {
      throw new ApiError('Alert not found', 404)
    }

    // Update alert status
    const { data: updatedAlert, error: updateError } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: user.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .select()
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    return successResponse({
      alert: updatedAlert,
      message: 'Alert acknowledged',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

