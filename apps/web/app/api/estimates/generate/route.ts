import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/estimates/generate
 * Generate an estimate from job data
 * 
 * Body:
 * {
 *   jobId: string (required)
 *   policyId?: string (optional, for coverage application)
 *   useAI?: boolean (default: true) - Use AI to generate estimate
 * }
 * 
 * Note: In production, this would use AI/LLM to analyze job data (photos, gates, scope)
 * and generate line items. For MVP, we'll create a stub that can be replaced with real AI.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuth(request)
    const body = await request.json()

    if (!body.jobId) {
      throw new ApiError('jobId is required', 400)
    }

    // Verify job exists and user has access
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, profiles!jobs_lead_tech_id_fkey(id, email, full_name)')
      .eq('id', body.jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    // Check if estimate already exists
    const { data: existingEstimate } = await supabase
      .from('estimates')
      .select('id')
      .eq('job_id', body.jobId)
      .eq('status', 'draft')
      .single()

    if (existingEstimate) {
      throw new ApiError('Draft estimate already exists for this job', 400)
    }

    // Get job gates and photos for context
    const { data: gates } = await supabase
      .from('job_gates')
      .select('*')
      .eq('job_id', body.jobId)

    const { data: photos } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', body.jobId)

    // Get policy if provided
    let policy = null
    if (body.policyId) {
      const { data: policyData } = await supabase
        .from('policies')
        .select('*')
        .eq('id', body.policyId)
        .single()
      policy = policyData
    }

    // TODO: Use AI to generate estimate from job data
    // For now, we'll create a stub that generates basic line items
    // In production, this would:
    // 1. Analyze photos (damage assessment)
    // 2. Analyze scope gate data (rooms, damage types, measurements)
    // 3. Analyze moisture/equipment gate (equipment needs)
    // 4. Use AI/LLM to generate appropriate line items
    // 5. Map to internal codes and Xactimate codes

    const mockLineItems = [
      {
        code: 'DEM-001',
        xactimate_code: 'DMO001',
        description: 'Demolition - Water damaged drywall',
        category: 'Demolition',
        room: 'Kitchen',
        quantity: 100,
        unit_cost: 2.50,
        coverage_bucket: 'insurance',
      },
      {
        code: 'DRY-001',
        xactimate_code: 'DRY001',
        description: 'Drying equipment - Air movers',
        category: 'Drying',
        room: 'Kitchen',
        quantity: 3,
        unit_cost: 45.00,
        coverage_bucket: 'insurance',
      },
      {
        code: 'REC-001',
        xactimate_code: 'REC001',
        description: 'Reconstruction - Drywall replacement',
        category: 'Reconstruction',
        room: 'Kitchen',
        quantity: 100,
        unit_cost: 3.50,
        coverage_bucket: 'insurance',
      },
    ]

    // Create estimate
    const estimateNumber = `EST-${Date.now()}`
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .insert({
        job_id: body.jobId,
        policy_id: body.policyId || null,
        estimate_number: estimateNumber,
        status: 'draft',
        generated_by_ai: body.useAI !== false,
        generation_metadata: {
          method: 'stub', // Will be 'openai-gpt4', 'claude', etc. in production
          gates_analyzed: gates?.length || 0,
          photos_analyzed: photos?.length || 0,
          policy_applied: !!policy,
        },
        created_by: user.id,
      })
      .select()
      .single()

    if (estimateError) {
      throw new ApiError(estimateError.message, 500)
    }

    // Create line items
    const lineItemsData = mockLineItems.map(item => ({
      estimate_id: estimate.id,
      ...item,
      covered_amount: item.coverage_bucket === 'insurance' ? item.quantity * item.unit_cost : 0,
      customer_pay_amount: item.coverage_bucket === 'customer_pay' ? item.quantity * item.unit_cost : 0,
      non_covered_amount: item.coverage_bucket === 'non_covered' ? item.quantity * item.unit_cost : 0,
    }))

    const { data: lineItems, error: lineItemsError } = await supabase
      .from('estimate_line_items')
      .insert(lineItemsData)
      .select()

    if (lineItemsError) {
      // Clean up estimate if line items fail
      await supabase.from('estimates').delete().eq('id', estimate.id)
      throw new ApiError(lineItemsError.message, 500)
    }

    // Recalculate totals
    await supabase.rpc('recalculate_estimate_totals', { estimate_uuid: estimate.id })

    // Fetch updated estimate with totals
    const { data: updatedEstimate } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimate.id)
      .single()

    return successResponse({
      estimate: updatedEstimate,
      lineItems: lineItems || [],
      message: 'Estimate generated successfully (stub implementation). Replace with real AI service.',
    }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

