/**
 * Policy Parsing Agent
 * 
 * Parses insurance policy documents using OCR + LLM
 */

import { BaseAgent, type AgentInput, type AgentOutput } from './base'
import type { SharedContext } from '../context/types'
import { callAnthropic, getRecommendedModel } from '../models/anthropic'
import { buildPrompt, POLICY_PARSING_PROMPT } from '../utils/prompts'
import { ResourcesManager } from '../resources/manager'
import { createClient } from '@/utils/supabase/server'
import { handleLLMError } from '../utils/errors'

export class PolicyAgent extends BaseAgent {
  name = 'Policy Agent'
  useCase = 'policy_parsing'
  defaultModel = 'claude-haiku-4-20251015' // Cost-effective for document parsing
  defaultProvider: 'openai' | 'anthropic' = 'anthropic'

  async process(
    input: AgentInput,
    context: SharedContext
  ): Promise<AgentOutput> {
    try {
      const { policyId } = context

      if (!policyId) {
        throw new Error('Policy ID is required for policy parsing')
      }

      // Get Supabase client
      const supabase = await createClient()
      const resourcesManager = new ResourcesManager(supabase)

      // Get policy data
      const policyData = await resourcesManager.getPolicyData(policyId)
      if (!policyData) {
        throw new Error(`Policy not found: ${policyId}`)
      }

      // TODO: Implement OCR extraction
      // For now, we'll use the PDF path if available
      // In production, this would:
      // 1. Download PDF from storage
      // 2. Extract text using OCR (AWS Textract, Google Vision, etc.)
      // 3. Pass extracted text to LLM

      let extractedText = ''

      if (policyData.pdf_storage_path) {
        // TODO: Download and extract text from PDF
        // For now, use existing parsed data or policy metadata
        extractedText = policyData.coverage_summary || JSON.stringify(policyData)
      } else {
        // Use existing policy data as context
        extractedText = JSON.stringify({
          policy_number: policyData.policy_number,
          carrier_name: policyData.carrier_name,
          deductible: policyData.deductible,
          coverage_limits: policyData.coverage_limits,
        })
      }

      // Build prompt with policy data
      // The POLICY_PARSING_PROMPT template doesn't have placeholders, so we'll append the data
      const prompt = `${POLICY_PARSING_PROMPT}\n\nExtracted Policy Text:\n${extractedText}\n\nExtract structured data from the above policy information.`

      // Call LLM
      const model = input.options.model || this.getRecommendedModel()
      const response = await callAnthropic(prompt, {
        model,
        temperature: input.options.temperature || 0.2, // Very low temperature for extraction
        maxTokens: input.options.maxTokens || 2000,
        system: 'You are an expert at extracting structured data from insurance policy documents. Return valid JSON only.',
      })

      // Parse response as JSON
      let parsedData
      try {
        // Extract JSON from response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0])
        } else {
          parsedData = JSON.parse(response.content)
        }
      } catch (parseError) {
        console.error('Failed to parse LLM response as JSON:', parseError)
        throw new Error('LLM response is not valid JSON. Please try again.')
      }

      // Validate parsed data structure
      if (!parsedData.policyNumber && !parsedData.carrier) {
        throw new Error('LLM response missing required fields (policyNumber or carrier)')
      }

      // Generate coverage summary
      const coverageSummary = this.generateCoverageSummary(parsedData)

      return {
        response: JSON.stringify(parsedData),
        actions: [
          {
            type: 'update_policy',
            data: {
              policyId,
              parsedData,
              coverageSummary,
            },
            endpoint: `/api/admin/policies/${policyId}`,
            method: 'PUT',
          },
        ],
        context: {
          policyId,
        },
        intent: 'parse_policy',
        confidence: parsedData.confidence || 0.8,
        model: response.model,
        provider: 'anthropic',
        usage: response.usage
          ? {
              inputTokens: response.usage.inputTokens,
              outputTokens: response.usage.outputTokens,
              totalTokens: response.usage.inputTokens + response.usage.outputTokens,
            }
          : undefined,
      }
    } catch (error) {
      const llmError = handleLLMError(error)
      throw llmError
    }
  }

  /**
   * Generate human-readable coverage summary
   */
  private generateCoverageSummary(parsedData: {
    policyNumber?: string
    carrier?: string
    deductible?: number
    coverageLimits?: Record<string, number>
    exclusions?: string[]
  }): string {
    const parts: string[] = []

    if (parsedData.policyNumber) {
      parts.push(`Policy ${parsedData.policyNumber}`)
    }

    if (parsedData.carrier) {
      parts.push(`with ${parsedData.carrier}`)
    }

    if (parsedData.coverageLimits) {
      const limits = Object.entries(parsedData.coverageLimits)
        .map(([key, value]) => `${key}: $${value.toLocaleString()}`)
        .join(', ')
      parts.push(`Coverage includes: ${limits}`)
    }

    if (parsedData.deductible) {
      parts.push(`Deductible: $${parsedData.deductible.toLocaleString()}`)
    }

    if (parsedData.exclusions && parsedData.exclusions.length > 0) {
      parts.push(`Exclusions: ${parsedData.exclusions.join(', ')}`)
    }

    return parts.join('. ') + '.'
  }
}

