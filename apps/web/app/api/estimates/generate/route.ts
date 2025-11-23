import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'
import { orchestrator } from '@/lib/llm'

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

    // Try LLM to generate estimate, fallback to stub if it fails
    const useAI = body.useAI !== false // Default to true
    let lineItems: Array<{
      code: string
      xactimate_code: string
      description: string
      category: string
      room: string
      quantity: number
      unit_cost: number
      coverage_bucket: string
    }> = []
    let generationMethod = 'stub'
    let llmMetadata: any = null

    if (useAI) {
      try {
        // Use LLM orchestrator to generate estimate
        const llmResult = await orchestrator.process({
          useCase: 'estimate_generation',
          input: `Generate estimate for job ${body.jobId}`,
          context: {
            jobId: body.jobId,
            policyId: body.policyId,
            userId: user.id,
          },
          options: {
            includeActions: true,
            includeContext: true,
          },
        })

        // Parse line items from LLM response
        try {
          lineItems = JSON.parse(llmResult.response)
          generationMethod = llmResult.metadata?.provider === 'anthropic' 
            ? 'claude-haiku-4.5' 
            : llmResult.metadata?.model || 'llm'
          llmMetadata = {
            model: llmResult.metadata?.model,
            provider: llmResult.metadata?.provider,
            usage: llmResult.metadata?.usage,
            confidence: llmResult.metadata?.confidence,
          }
        } catch (parseError) {
          console.error('Failed to parse LLM response as JSON:', parseError)
          throw new Error('LLM returned invalid JSON')
        }

        // Validate line items structure
        if (!Array.isArray(lineItems) || lineItems.length === 0) {
          throw new Error('LLM returned empty or invalid line items')
        }
      } catch (llmError) {
        console.warn('LLM estimate generation failed, falling back to stub:', llmError)
        // Fall through to stub implementation
      }
    }

    // Fallback to stub if LLM not used or failed
    if (lineItems.length === 0) {
      lineItems = [
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
    }

    // Create estimate
    const estimateNumber = `EST-${Date.now()}`
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .insert({
        job_id: body.jobId,
        policy_id: body.policyId || null,
        estimate_number: estimateNumber,
        status: 'draft',
        generated_by_ai: useAI && generationMethod !== 'stub',
        generation_metadata: {
          method: generationMethod,
          gates_analyzed: gates?.length || 0,
          photos_analyzed: photos?.length || 0,
          policy_applied: !!policy,
          ...(llmMetadata ? { llm: llmMetadata } : {}),
        },
        created_by: user.id,
      })
      .select()
      .single()

    if (estimateError) {
      throw new ApiError(estimateError.message, 500)
    }

    // Create line items
    const lineItemsData = lineItems.map(item => ({
      estimate_id: estimate.id,
      ...item,
      covered_amount: item.coverage_bucket === 'insurance' ? item.quantity * item.unit_cost : 0,
      customer_pay_amount: item.coverage_bucket === 'customer_pay' ? item.quantity * item.unit_cost : 0,
      non_covered_amount: item.coverage_bucket === 'non_covered' ? item.quantity * item.unit_cost : 0,
    }))

    const { data: insertedLineItems, error: lineItemsError } = await supabase
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
      lineItems: insertedLineItems || [],
      message: generationMethod !== 'stub' 
        ? `Estimate generated successfully using ${generationMethod}.`
        : 'Estimate generated successfully (stub implementation).',
    }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

