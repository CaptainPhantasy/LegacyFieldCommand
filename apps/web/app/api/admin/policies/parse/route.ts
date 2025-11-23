import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'
import { orchestrator } from '@/lib/llm'

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

    // Try LLM to parse policy, fallback to stub if it fails
    const useAI = body.useAI !== false // Default to true
    let parsedData: any = null
    let coverageSummary = ''
    let extractionMethod = 'stub'
    let llmMetadata: any = null

    if (useAI) {
      try {
        // Use LLM orchestrator to parse policy
        const llmResult = await orchestrator.process({
          useCase: 'policy_parsing',
          input: `Parse policy ${body.policyId}`,
          context: {
            policyId: body.policyId,
          },
          options: {
            includeActions: true,
            includeContext: true,
          },
        })

        // Parse structured data from LLM response
        try {
          parsedData = JSON.parse(llmResult.response)
          extractionMethod = llmResult.metadata?.provider === 'anthropic' 
            ? 'claude-haiku-4.5' 
            : llmResult.metadata?.model || 'llm'
          llmMetadata = {
            model: llmResult.metadata?.model,
            provider: llmResult.metadata?.provider,
            usage: llmResult.metadata?.usage,
            confidence: llmResult.metadata?.confidence,
          }

          // Generate coverage summary from parsed data
          if (parsedData.policyNumber || parsedData.carrier) {
            const parts: string[] = []
            if (parsedData.policyNumber) {
              parts.push(`Policy ${parsedData.policyNumber}`)
            }
            if (parsedData.carrier) {
              parts.push(`with ${parsedData.carrier}`)
            }
            if (parsedData.coverageLimits) {
              const limits = Object.entries(parsedData.coverageLimits)
                .map(([key, value]) => `${key}: $${Number(value).toLocaleString()}`)
                .join(', ')
              parts.push(`Coverage includes: ${limits}`)
            }
            if (parsedData.deductible) {
              parts.push(`Deductible: $${Number(parsedData.deductible).toLocaleString()}`)
            }
            coverageSummary = parts.join('. ') + '.'
          } else {
            // Fallback summary
            coverageSummary = `Policy parsed using ${extractionMethod}.`
          }
        } catch (parseError) {
          console.error('Failed to parse LLM response as JSON:', parseError)
          throw new Error('LLM returned invalid JSON')
        }
      } catch (llmError) {
        console.warn('LLM policy parsing failed, falling back to stub:', llmError)
        // Fall through to stub implementation
      }
    }

    // Fallback to stub if LLM not used or failed
    if (!parsedData) {
      parsedData = {
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
        confidence: 0.85,
        extractionMethod: 'stub',
      }

      coverageSummary = `Policy ${parsedData.extracted.policyNumber} with ${parsedData.extracted.carrier}. 
Coverage includes: Dwelling ${parsedData.extracted.coverageLimits.dwelling.toLocaleString()}, 
Personal Property ${parsedData.extracted.coverageLimits.personalProperty.toLocaleString()}, 
Liability ${parsedData.extracted.coverageLimits.liability.toLocaleString()}. 
Deductible: $${parsedData.extracted.deductible.toLocaleString()}.`
    }

    // Normalize parsed data structure for database
    const extracted = parsedData.extracted || parsedData
    const normalizedParsedData = {
      extracted: {
        policyNumber: extracted.policyNumber || extracted.policy_number,
        carrier: extracted.carrier || extracted.carrier_name,
        effectiveDate: extracted.effectiveDate || extracted.effective_date,
        expirationDate: extracted.expirationDate || extracted.expiration_date,
        deductible: extracted.deductible,
        coverageLimits: extracted.coverageLimits || extracted.coverage_limits,
      },
      confidence: parsedData.confidence || 0.85,
      extractionMethod: extractionMethod,
      ...(llmMetadata ? { llm: llmMetadata } : {}),
    }

    // Update policy with parsed data
    const { data: updatedPolicy, error: updateError } = await supabase
      .from('policies')
      .update({
        parsed_data: normalizedParsedData,
        coverage_limits: normalizedParsedData.extracted.coverageLimits,
        coverage_summary: coverageSummary,
        deductible: normalizedParsedData.extracted.deductible,
        effective_date: normalizedParsedData.extracted.effectiveDate,
        expiration_date: normalizedParsedData.extracted.expirationDate,
        policy_number: normalizedParsedData.extracted.policyNumber,
        carrier_name: normalizedParsedData.extracted.carrier,
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
      message: extractionMethod !== 'stub' 
        ? `Policy parsed successfully using ${extractionMethod}.`
        : 'Policy parsed successfully (stub implementation).',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

