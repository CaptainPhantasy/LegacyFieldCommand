import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/integrations/xactimate/export
 * Export job/estimate data to Xactimate format
 * 
 * Body:
 * {
 *   jobId: string (required)
 *   estimateId?: string (optional, if not provided, uses latest estimate)
 *   format?: 'csv' | 'json' (default: 'csv')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)
    const body = await request.json()

    if (!body.jobId) {
      throw new ApiError('jobId is required', 400)
    }

    // Get job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', body.jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    // Get estimate (use provided estimateId or latest)
    let estimate
    if (body.estimateId) {
      const { data: est } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', body.estimateId)
        .eq('job_id', body.jobId)
        .single()
      estimate = est
    } else {
      const { data: est } = await supabase
        .from('estimates')
        .select('*')
        .eq('job_id', body.jobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      estimate = est
    }

    if (!estimate) {
      throw new ApiError('No estimate found for this job', 404)
    }

    // Get line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', estimate.id)
      .order('created_at')

    if (lineItemsError) {
      throw new ApiError(lineItemsError.message, 500)
    }

    const format = body.format || 'csv'

    if (format === 'json') {
      // Xactimate JSON format
      const xactimateData = {
        job: {
          number: job.id,
          title: job.title,
          address: job.address_line_1,
        },
        estimate: {
          number: estimate.estimate_number,
          total: estimate.total_amount,
          insurance: estimate.insurance_amount,
          customerPay: estimate.customer_pay_amount,
        },
        lineItems: (lineItems || []).map((item: any) => ({
          code: item.xactimate_code || item.code,
          description: item.description,
          quantity: item.quantity,
          unit: 'EA',
          unitCost: item.unit_cost,
          total: item.total_cost,
          category: item.category,
          room: item.room,
          coverageBucket: item.coverage_bucket,
        })),
        exportedAt: new Date().toISOString(),
        format: 'xactimate-json',
      }

      // Mark as exported
      await supabase
        .from('estimates')
        .update({
          exported_to_xactimate: true,
          export_metadata: {
            ...estimate.export_metadata,
            xactimate: {
              exportedAt: new Date().toISOString(),
              format: 'json',
            },
          },
        })
        .eq('id', estimate.id)

      return NextResponse.json({
        success: true,
        data: xactimateData,
      })
    }

    // CSV format (default)
    const csvHeaders = ['Code', 'Description', 'Quantity', 'Unit', 'Unit Cost', 'Total', 'Category', 'Room', 'Coverage']
    const csvRows = (lineItems || []).map((item: any) => [
      item.xactimate_code || item.code,
      item.description,
      item.quantity,
      'EA',
      item.unit_cost,
      item.total_cost,
      item.category || '',
      item.room || '',
      item.coverage_bucket,
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell)}"`).join(',')),
    ].join('\n')

    // Mark as exported
    await supabase
      .from('estimates')
      .update({
        exported_to_xactimate: true,
        export_metadata: {
          ...estimate.export_metadata,
          xactimate: {
            exportedAt: new Date().toISOString(),
            format: 'csv',
          },
        },
      })
      .eq('id', estimate.id)

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="xactimate-export-${estimate.estimate_number}.csv"`,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

