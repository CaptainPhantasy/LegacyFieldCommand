import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/admin/policies/parse
 * Parse/extract data from a policy PDF
 * 
 * Body:
 * {
 *   policyId: string (required)
 *   forceReparse?: boolean (default: false)
 * }
 * 
 * Note: This endpoint triggers OCR/extraction. In production, this would:
 * 1. Call an OCR service (e.g., AWS Textract, Google Cloud Vision, or OpenAI Vision)
 * 2. Extract structured data (policy number, dates, limits, deductibles)
 * 3. Generate coverage summary
 * 
 * For MVP, we'll implement a stub that can be replaced with real OCR integration.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request)
    const body = await request.json()

    if (!body.policyId) {
      throw new ApiError('policyId is required', 400)
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

    // If already parsed and not forcing, return existing data
    if (policy.status === 'parsed' && !body.forceReparse) {
      return successResponse({
        policy,
        message: 'Policy already parsed. Use forceReparse=true to reparse.',
      })
    }

    // TODO: Integrate with OCR service
    // For now, we'll create a stub that returns mock extracted data
    // In production, this would:
    // 1. Download PDF from storage
    // 2. Send to OCR service (AWS Textract, Google Vision, etc.)
    // 3. Extract structured data
    // 4. Parse coverage limits, deductibles, dates
    // 5. Generate plain-language summary

    const mockParsedData = {
      extracted: {
        policyNumber: policy.policy_number || 'EXTRACTED-12345',
        carrier: policy.carrier_name || 'Extracted Carrier',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deductible: 1000,
        coverageLimits: {
          dwelling: 500000,
          personalProperty: 250000,
          liability: 300000,
          lossOfUse: 100000,
        },
      },
      confidence: 0.85, // OCR confidence score
      extractionMethod: 'stub', // Will be 'aws-textract', 'google-vision', etc. in production
    }

    const coverageSummary = `Policy ${mockParsedData.extracted.policyNumber} with ${mockParsedData.extracted.carrier}. 
Coverage includes: Dwelling ${mockParsedData.extracted.coverageLimits.dwelling.toLocaleString()}, 
Personal Property ${mockParsedData.extracted.coverageLimits.personalProperty.toLocaleString()}, 
Liability ${mockParsedData.extracted.coverageLimits.liability.toLocaleString()}. 
Deductible: $${mockParsedData.extracted.deductible.toLocaleString()}.`

    // Update policy with parsed data
    const { data: updatedPolicy, error: updateError } = await supabase
      .from('policies')
      .update({
        parsed_data: mockParsedData,
        coverage_limits: mockParsedData.extracted.coverageLimits,
        coverage_summary: coverageSummary,
        deductible: mockParsedData.extracted.deductible,
        effective_date: mockParsedData.extracted.effectiveDate,
        expiration_date: mockParsedData.extracted.expirationDate,
        policy_number: mockParsedData.extracted.policyNumber,
        carrier_name: mockParsedData.extracted.carrier,
        status: 'parsed',
      })
      .eq('id', body.policyId)
      .select()
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    return successResponse({
      policy: updatedPolicy,
      message: 'Policy parsed successfully (stub implementation). Replace with real OCR service.',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

