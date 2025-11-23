import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/estimates/[estimateId]/apply-coverage
 * Apply policy coverage to estimate (deductibles, limits, coverage buckets)
 * 
 * Body:
 * {
 *   policyId: string (required)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const { supabase } = await requireAuth(request)
    const { estimateId } = await params
    const body = await request.json()

    if (!body.policyId) {
      throw new ApiError('policyId is required', 400)
    }

    // Get estimate
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single()

    if (estimateError || !estimate) {
      throw new ApiError('Estimate not found', 404)
    }

    // Get policy
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('*')
      .eq('id', body.policyId)
      .single()

    if (policyError || !policy) {
      throw new ApiError('Policy not found', 404)
    }

    // Get all line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at')

    if (lineItemsError) {
      throw new ApiError(lineItemsError.message, 500)
    }

    // Apply coverage logic
    const deductible = parseFloat(policy.deductible?.toString() || '0')
    const coverageLimits = policy.coverage_limits || {}
    let remainingDeductible = deductible
    let appliedDeductible = 0

    // Update line items with coverage application
    const updates = (lineItems || []).map((item: any) => {
      const totalCost = parseFloat(item.total_cost?.toString() || '0')
      let coveredAmount = 0
      let customerPayAmount = 0
      let nonCoveredAmount = 0

      if (item.coverage_bucket === 'insurance') {
        // Apply deductible first
        if (remainingDeductible > 0) {
          const deductibleToApply = Math.min(remainingDeductible, totalCost)
          customerPayAmount += deductibleToApply
          remainingDeductible -= deductibleToApply
          appliedDeductible += deductibleToApply
          coveredAmount = totalCost - deductibleToApply
        } else {
          coveredAmount = totalCost
        }

        // Apply coverage limits if applicable
        // This is simplified - in production, would check specific limit types
        const dwellingLimit = parseFloat(coverageLimits.dwelling?.toString() || '0')
        if (dwellingLimit > 0 && coveredAmount > dwellingLimit) {
          nonCoveredAmount = coveredAmount - dwellingLimit
          coveredAmount = dwellingLimit
        }
      } else if (item.coverage_bucket === 'customer_pay') {
        customerPayAmount = totalCost
      } else if (item.coverage_bucket === 'non_covered') {
        nonCoveredAmount = totalCost
      }

      return {
        id: item.id,
        covered_amount: coveredAmount,
        customer_pay_amount: customerPayAmount,
        non_covered_amount: nonCoveredAmount,
      }
    })

    // Update line items
    for (const update of updates) {
      await supabase
        .from('estimate_line_items')
        .update({
          covered_amount: update.covered_amount,
          customer_pay_amount: update.customer_pay_amount,
          non_covered_amount: update.non_covered_amount,
        })
        .eq('id', update.id)
    }

    // Update estimate
    const { data: updatedEstimate, error: updateError } = await supabase
      .from('estimates')
      .update({
        policy_id: body.policyId,
        deductible_applied: appliedDeductible,
        coverage_limits_applied: coverageLimits,
      })
      .eq('id', estimateId)
      .select()
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    // Recalculate totals
    await supabase.rpc('recalculate_estimate_totals', { estimate_uuid: estimateId })

    // Fetch final estimate
    const { data: finalEstimate } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single()

    return successResponse({
      estimate: finalEstimate,
      message: 'Coverage applied successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

