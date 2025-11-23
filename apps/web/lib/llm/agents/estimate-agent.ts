/**
 * Estimate Generation Agent
 * 
 * Generates estimates from job data using LLM
 */

import { BaseAgent, type AgentInput, type AgentOutput } from './base'
import type { SharedContext } from '../context/types'
import { callAnthropic, getRecommendedModel } from '../models/anthropic'
import { buildPrompt, ESTIMATE_GENERATION_PROMPT } from '../utils/prompts'
import { ResourcesManager } from '../resources/manager'
import { createClient } from '@/utils/supabase/server'
import { handleLLMError } from '../utils/errors'

export class EstimateAgent extends BaseAgent {
  name = 'Estimate Agent'
  useCase = 'estimate_generation'
  defaultModel = 'claude-haiku-4-20251015' // Cost-effective, fast
  defaultProvider: 'openai' | 'anthropic' = 'anthropic'

  async process(
    input: AgentInput,
    context: SharedContext
  ): Promise<AgentOutput> {
    try {
      const { jobId, policyId } = context

      if (!jobId) {
        throw new Error('Job ID is required for estimate generation')
      }

      // Get Supabase client for ResourcesManager
      const supabase = await createClient()
      const resourcesManager = new ResourcesManager(supabase)

      // Get job data
      const jobData = await resourcesManager.getJobData(jobId)
      if (!jobData) {
        throw new Error(`Job not found: ${jobId}`)
      }

      // Get policy data if provided
      let policyData = null
      if (policyId) {
        policyData = await resourcesManager.getPolicyData(policyId)
      }

      // Get historical estimates for context
      const historicalEstimates = await resourcesManager.getHistoricalEstimates(jobId)

      // Build prompt with job data
      // Note: jobData from ResourcesManager doesn't include all fields, so we'll use what we have
      let prompt = buildPrompt(ESTIMATE_GENERATION_PROMPT, {
        jobTitle: jobData.title || 'Unknown Job',
        lossType: 'water', // Default, can be enhanced with actual job data
        rooms: jobData.gates?.map(g => g.stage_name).join(', ') || 'Unknown',
        damageDescription: `Job at ${jobData.address_line_1 || 'unknown location'}`,
        photoCount: jobData.photos?.length || 0,
        scopeNotes: `Job status: ${jobData.status}`,
        measurements: 'See gates for details',
        deductible: policyData?.deductible || 0,
        coverageLimits: JSON.stringify(policyData?.coverage_limits || {}),
        exclusions: policyData?.coverage_summary?.includes('exclusion') 
          ? 'See policy for exclusions' 
          : 'None specified',
      })

      // Add context about historical estimates
      if (historicalEstimates.length > 0) {
        const historicalContext = `\n\nHistorical Estimates for this job:\n${historicalEstimates.map(est => 
          `- ${est.estimate_number}: $${est.total_amount.toFixed(2)}`
        ).join('\n')}`
        prompt += historicalContext
      }

      // Call LLM
      const model = input.options.model || this.getRecommendedModel()
      const response = await callAnthropic(prompt, {
        model,
        temperature: input.options.temperature || 0.3, // Lower temperature for structured output
        maxTokens: input.options.maxTokens || 4000,
        system: 'You are an expert restoration estimator. Generate accurate, detailed line items based on job data. Return valid JSON only.',
      })

      // Parse response as JSON
      let lineItems
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = response.content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          lineItems = JSON.parse(jsonMatch[0])
        } else {
          lineItems = JSON.parse(response.content)
        }
      } catch (parseError) {
        // If parsing fails, try to extract structured data
        console.error('Failed to parse LLM response as JSON:', parseError)
        throw new Error('LLM response is not valid JSON. Please try again.')
      }

      // Validate line items structure
      if (!Array.isArray(lineItems)) {
        throw new Error('LLM response must be an array of line items')
      }

      // Calculate totals
      const totalAmount = lineItems.reduce((sum, item) => {
        return sum + (item.quantity || 0) * (item.unit_cost || 0)
      }, 0)

      return {
        response: JSON.stringify(lineItems),
        actions: [
          {
            type: 'create_estimate',
            data: {
              jobId,
              policyId,
              lineItems,
              totalAmount,
            },
            endpoint: '/api/estimates/generate',
            method: 'POST',
          },
        ],
        context: {
          jobId,
          policyId,
        },
        intent: 'generate_estimate',
        confidence: 0.9,
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
}

