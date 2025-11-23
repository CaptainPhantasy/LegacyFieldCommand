import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/templates/[templateId]
 * Get template details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { templateId } = await params

    const { data: template, error } = await supabase
      .from('job_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error || !template) {
      throw new ApiError('Template not found', 404)
    }

    return successResponse({ template })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PUT /api/templates/[templateId]
 * Update template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { templateId } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.template_type !== undefined) updateData.template_type = body.template_type
    if (body.carrier_name !== undefined) updateData.carrier_name = body.carrier_name
    if (body.program_name !== undefined) updateData.program_name = body.program_name
    if (body.default_line_items !== undefined) updateData.default_line_items = body.default_line_items
    if (body.required_gates !== undefined) updateData.required_gates = body.required_gates
    if (body.required_fields !== undefined) updateData.required_fields = body.required_fields
    if (body.default_metadata !== undefined) updateData.default_metadata = body.default_metadata
    if (body.enabled !== undefined) updateData.enabled = body.enabled

    const { data: template, error } = await supabase
      .from('job_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (error || !template) {
      throw new ApiError(error?.message || 'Template not found', 404)
    }

    return successResponse({ template })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * DELETE /api/templates/[templateId]
 * Delete template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { templateId } = await params

    const { error } = await supabase
      .from('job_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({ message: 'Template deleted' })
  } catch (error) {
    return errorResponse(error)
  }
}

