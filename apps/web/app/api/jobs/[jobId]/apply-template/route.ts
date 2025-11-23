import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/jobs/[jobId]/apply-template
 * Apply a template to a job
 * 
 * Body:
 * {
 *   templateId: string (required)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { jobId } = await params
    const body = await request.json()

    if (!body.templateId) {
      throw new ApiError('templateId is required', 400)
    }

    // Verify job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('job_templates')
      .select('*')
      .eq('id', body.templateId)
      .single()

    if (templateError || !template) {
      throw new ApiError('Template not found', 404)
    }

    // Apply template default metadata to job
    if (template.default_metadata) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update(template.default_metadata)
        .eq('id', jobId)

      if (updateError) {
        throw new ApiError(updateError.message, 500)
      }
    }

    // If template has default line items and an estimate exists, add them
    if (template.default_line_items && Array.isArray(template.default_line_items)) {
      const { data: estimate } = await supabase
        .from('estimates')
        .select('id')
        .eq('job_id', jobId)
        .eq('status', 'draft')
        .single()

      if (estimate) {
        const lineItemsData = template.default_line_items.map((item: any) => ({
          estimate_id: estimate.id,
          code: item.code,
          xactimate_code: item.xactimate_code || null,
          description: item.description,
          category: item.category || null,
          room: item.room || null,
          quantity: item.quantity || 1,
          unit_cost: item.unit_cost || 0,
          coverage_bucket: item.coverage_bucket || 'insurance',
          covered_amount: item.coverage_bucket === 'insurance' ? (item.quantity || 1) * (item.unit_cost || 0) : 0,
          customer_pay_amount: item.coverage_bucket === 'customer_pay' ? (item.quantity || 1) * (item.unit_cost || 0) : 0,
          non_covered_amount: item.coverage_bucket === 'non_covered' ? (item.quantity || 1) * (item.unit_cost || 0) : 0,
        }))

        await supabase
          .from('estimate_line_items')
          .insert(lineItemsData)

        // Recalculate estimate totals
        await supabase.rpc('recalculate_estimate_totals', { estimate_uuid: estimate.id })
      }
    }

    return successResponse({
      job,
      template,
      message: 'Template applied successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

