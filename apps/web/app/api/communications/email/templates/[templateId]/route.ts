import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/communications/email/templates/[templateId]
 * Get template details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { templateId } = await params

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*, profiles!email_templates_created_by_fkey(id, email, full_name)')
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
 * PUT /api/communications/email/templates/[templateId]
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
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.body !== undefined) updateData.body = body.body
    if (body.template_type !== undefined) updateData.template_type = body.template_type
    if (body.variables !== undefined) updateData.variables = body.variables

    const { data: template, error } = await supabase
      .from('email_templates')
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
 * DELETE /api/communications/email/templates/[templateId]
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
      .from('email_templates')
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

