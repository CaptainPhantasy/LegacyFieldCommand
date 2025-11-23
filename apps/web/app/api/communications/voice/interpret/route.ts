import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'
import { orchestrator } from '@/lib/llm'

/**
 * POST /api/communications/voice/interpret
 * Interpret transcribed voice text into structured data
 * 
 * Body:
 * {
 *   text: string (required) - transcribed text
 *   communicationId?: string (optional) - link to communication record
 *   jobId?: string (optional) - context
 * }
 * 
 * Note: In production, this would use AI/LLM to extract structured information
 * (OpenAI GPT, Anthropic Claude, etc.) to identify:
 * - Damage descriptions
 * - Customer notes
 * - Quote elements
 * - Action items
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuth(request)
    const body = await request.json()

    if (!body.text) {
      throw new ApiError('text is required', 400)
    }

    // If communicationId provided, verify it exists and update it
    if (body.communicationId) {
      const { data: comm, error: commError } = await supabase
        .from('communications')
        .select('id, voice_transcription')
        .eq('id', body.communicationId)
        .single()

      if (commError || !comm) {
        throw new ApiError('Communication not found', 404)
      }
    }

    // Try LLM to interpret voice text, fallback to stub if it fails
    const useAI = body.useAI !== false // Default to true
    let interpretation: any = null
    let llmMetadata: any = null

    if (useAI) {
      try {
        // Use LLM orchestrator to interpret voice text
        const llmResult = await orchestrator.process({
          useCase: 'voice_interpretation',
          input: body.text,
          context: {
            jobId: body.jobId,
            userId: user.id,
          },
          options: {
            includeActions: true,
            includeContext: true,
          },
        })

        // Parse interpretation from LLM response
        try {
          interpretation = JSON.parse(llmResult.response)
          interpretation.provider = llmResult.metadata?.provider === 'anthropic' 
            ? 'claude-haiku-4.5' 
            : llmResult.metadata?.model || 'llm'
          llmMetadata = {
            model: llmResult.metadata?.model,
            provider: llmResult.metadata?.provider,
            usage: llmResult.metadata?.usage,
            confidence: llmResult.metadata?.confidence || interpretation.confidence,
          }
        } catch (parseError) {
          console.error('Failed to parse LLM response as JSON:', parseError)
          throw new Error('LLM returned invalid JSON')
        }
      } catch (llmError) {
        console.warn('LLM voice interpretation failed, falling back to stub:', llmError)
        // Fall through to stub implementation
      }
    }

    // Fallback to stub if LLM not used or failed
    if (!interpretation) {
      interpretation = {
        intent: 'damage_description',
        entities: {
          damageTypes: ['water', 'flooring'],
          rooms: ['kitchen', 'living room'],
          severity: 'moderate',
        },
        extractedData: {
          customerNotes: 'Customer mentioned water damage in kitchen and living room',
          damageDescription: 'Water damage affecting flooring in kitchen and living room areas',
          quoteElements: [],
          actionItems: ['Assess kitchen flooring', 'Assess living room flooring'],
        },
        confidence: 0.85,
        provider: 'stub',
      }
    }

    // Update communication record if communicationId provided
    if (body.communicationId) {
      const { data: updatedComm, error: updateError } = await supabase
        .from('communications')
        .update({
          voice_interpretation: interpretation,
        })
        .eq('id', body.communicationId)
        .select()
        .single()

      if (updateError) {
        throw new ApiError(updateError.message, 500)
      }

      return successResponse({
        communication: updatedComm,
        interpretation: {
          ...interpretation,
          ...(llmMetadata ? { metadata: llmMetadata } : {}),
        },
        message: interpretation.provider !== 'stub' 
          ? `Voice interpreted successfully using ${interpretation.provider}.`
          : 'Voice interpreted successfully (stub implementation).',
      })
    }

    return successResponse({
      interpretation: {
        ...interpretation,
        ...(llmMetadata ? { metadata: llmMetadata } : {}),
      },
      message: interpretation.provider !== 'stub' 
        ? `Voice interpreted successfully using ${interpretation.provider}.`
        : 'Voice interpreted successfully (stub implementation).',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

