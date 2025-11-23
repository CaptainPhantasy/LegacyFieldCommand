/**
 * Voice Processing Agent
 * 
 * Processes voice commands and interprets voice text
 */

import { BaseAgent, type AgentInput, type AgentOutput } from './base'
import type { SharedContext } from '../context/types'
import { callAnthropic, getRecommendedModel } from '../models/anthropic'
import {
  buildPrompt,
  VOICE_COMMAND_PROMPT,
  VOICE_INTERPRETATION_PROMPT,
} from '../utils/prompts'
import { ResourcesManager } from '../resources/manager'
import { createClient } from '@/utils/supabase/server'
import { handleLLMError } from '../utils/errors'

export class VoiceAgent extends BaseAgent {
  name = 'Voice Processing Agent'
  useCase = 'voice_command' // Also handles 'voice_interpretation'
  defaultModel = 'claude-haiku-4-20251015' // Fast, cost-effective for real-time
  defaultProvider: 'openai' | 'anthropic' = 'anthropic'

  async process(
    input: AgentInput,
    context: SharedContext
  ): Promise<AgentOutput> {
    try {
      // Determine use case from context or input
      const useCase = context.metadata?.useCase as string || this.useCase

      if (useCase === 'voice_interpretation') {
        return this.interpretVoiceText(input, context)
      } else {
        return this.processVoiceCommand(input, context)
      }
    } catch (error) {
      const llmError = handleLLMError(error)
      throw llmError
    }
  }

  /**
   * Process voice command (intent recognition)
   */
  private async processVoiceCommand(
    input: AgentInput,
    context: SharedContext
  ): Promise<AgentOutput> {
    const command = input.input

    if (!command) {
      throw new Error('Voice command is required')
    }

    // Get job context if available
    let jobTitle = 'No job selected'
    let gateName = 'No gate selected'

    if (context.jobId) {
      const supabase = await createClient()
      const resourcesManager = new ResourcesManager(supabase)
      const jobData = await resourcesManager.getJobData(context.jobId)

      if (jobData) {
        jobTitle = jobData.title || 'Unknown Job'

        if (context.gateId) {
          const gate = jobData.gates?.find((g) => g.id === context.gateId)
          if (gate) {
            gateName = gate.stage_name || 'Unknown Gate'
          }
        }
      }
    }

    // Build prompt
    const prompt = buildPrompt(VOICE_COMMAND_PROMPT, {
      jobTitle,
      jobId: context.jobId || '',
      gateName,
      gateId: context.gateId || '',
      userRole: context.userRole || 'field_tech',
      command,
    })

    // Call LLM
    const model = input.options.model || this.getRecommendedModel()
    const response = await callAnthropic(prompt, {
      model,
      temperature: input.options.temperature || 0.5,
      maxTokens: input.options.maxTokens || 1000,
      system: 'You are a voice assistant for field technicians. Understand natural language commands and return structured intent data. Keep responses concise for voice output.',
    })

    // Parse response as JSON
    let intentData
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        intentData = JSON.parse(jsonMatch[0])
      } else {
        intentData = JSON.parse(response.content)
      }
    } catch (parseError) {
      // If parsing fails, create basic intent structure
      console.warn('Failed to parse voice command response:', parseError)
      intentData = {
        intent: 'unknown',
        action: 'Could not understand command',
        data: {},
        response: "I didn't understand that. Please try again.",
        confidence: 0.3,
      }
    }

    // Determine action endpoint based on intent
    let actionEndpoint = ''
    let actionMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'

    switch (intentData.intent) {
      case 'show_jobs':
        actionEndpoint = '/api/field/jobs'
        actionMethod = 'GET'
        break
      case 'open_gate':
        actionEndpoint = `/api/field/gates/${intentData.data?.gateId}`
        actionMethod = 'GET'
        break
      case 'complete_gate':
        actionEndpoint = `/api/field/gates/${intentData.data?.gateId}/complete`
        actionMethod = 'POST'
        break
      case 'log_exception':
        actionEndpoint = `/api/field/gates/${intentData.data?.gateId}/exception`
        actionMethod = 'POST'
        break
      case 'take_photo':
        actionEndpoint = '/api/field/photos/upload'
        actionMethod = 'POST'
        break
    }

    return {
      response: intentData.response || 'Command processed',
      actions: actionEndpoint
        ? [
            {
              type: intentData.intent,
              data: intentData.data || {},
              endpoint: actionEndpoint,
              method: actionMethod,
            },
          ]
        : undefined,
      context: {
        jobId: intentData.data?.jobId || context.jobId,
        gateId: intentData.data?.gateId || context.gateId,
      },
      intent: intentData.intent,
      confidence: intentData.confidence || 0.7,
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
  }

  /**
   * Interpret voice text (extract structured data)
   */
  private async interpretVoiceText(
    input: AgentInput,
    context: SharedContext
  ): Promise<AgentOutput> {
    const text = input.input

    if (!text) {
      throw new Error('Voice text is required for interpretation')
    }

    // Get job context
    let lossType = 'water' // Default

      if (context.jobId) {
        const supabase = await createClient()
        const resourcesManager = new ResourcesManager(supabase)
        const jobData = await resourcesManager.getJobData(context.jobId)

        // Default to water damage (most common)
        lossType = 'water'
      }

    // Build prompt
    const prompt = buildPrompt(VOICE_INTERPRETATION_PROMPT, {
      transcription: text,
      jobId: context.jobId || '',
      lossType,
    })

    // Call LLM
    const model = input.options.model || this.getRecommendedModel()
    const response = await callAnthropic(prompt, {
      model,
      temperature: input.options.temperature || 0.3,
      maxTokens: input.options.maxTokens || 2000,
      system: 'You are an expert at extracting structured data from voice transcriptions. Return valid JSON only.',
    })

    // Parse response as JSON
    let interpretation
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        interpretation = JSON.parse(jsonMatch[0])
      } else {
        interpretation = JSON.parse(response.content)
      }
    } catch (parseError) {
      console.error('Failed to parse interpretation response:', parseError)
      throw new Error('LLM response is not valid JSON. Please try again.')
    }

    return {
      response: JSON.stringify(interpretation),
      actions: interpretation.actionItems?.map((item: string) => ({
        type: 'action_item',
        data: { item },
        endpoint: '/api/field/actions',
        method: 'POST',
      })),
      context: {
        jobId: context.jobId,
      },
      intent: interpretation.intent,
      confidence: interpretation.confidence || 0.8,
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
  }
}

