import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/estimates/[estimateId]/export
 * Export estimate to Xactimate format
 * 
 * Query params:
 * - format: 'csv' | 'excel' | 'json' (default: 'csv')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { estimateId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    // Get estimate with line items
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('*, jobs(id, title)')
      .eq('id', estimateId)
      .single()

    if (estimateError || !estimate) {
      throw new ApiError('Estimate not found', 404)
    }

    const { data: lineItems, error: lineItemsError } = await supabase
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at')

    if (lineItemsError) {
      throw new ApiError(lineItemsError.message, 500)
    }

    // Generate export based on format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          estimate,
          lineItems: lineItems || [],
          exportFormat: 'xactimate-json',
          exportedAt: new Date().toISOString(),
        },
      })
    }

    if (format === 'csv') {
      // Generate CSV format compatible with Xactimate
      const csvHeaders = ['Code', 'Description', 'Quantity', 'Unit', 'Unit Cost', 'Total', 'Category', 'Room']
      const csvRows = (lineItems || []).map((item: any) => [
        item.xactimate_code || item.code,
        item.description,
        item.quantity,
        'EA', // Unit (Each)
        item.unit_cost,
        item.total_cost,
        item.category || '',
        item.room || '',
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n')

      // Mark as exported
      await supabase
        .from('estimates')
        .update({
          exported_to_xactimate: true,
          export_metadata: {
            format: 'csv',
            exportedAt: new Date().toISOString(),
          },
        })
        .eq('id', estimateId)

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="estimate-${estimate.estimate_number}.csv"`,
        },
      })
    }

    throw new ApiError('Unsupported format. Use csv, excel, or json', 400)
  } catch (error) {
    return errorResponse(error)
  }
}

