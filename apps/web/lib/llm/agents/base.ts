/**
 * Base Agent Interface
 * 
 * All specialized agents extend this base class
 */

import type { SharedContext } from '../context/types'
import type { LLMResponse } from '../orchestrator'

export interface AgentInput {
  input: string
  context: SharedContext
  options: {
    model?: string
    provider?: 'openai' | 'anthropic'
    temperature?: number
    maxTokens?: number
    [key: string]: unknown
  }
}

export interface AgentOutput {
  response: string
  actions?: Array<{
    type: string
    data: any
    endpoint: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  }>
  context?: Partial<SharedContext>
  intent?: string
  confidence?: number
  model?: string
  provider?: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}

/**
 * Base Agent Class
 * 
 * All specialized agents should extend this class
 */
export abstract class BaseAgent {
  abstract name: string
  abstract useCase: string
  abstract defaultModel: string
  abstract defaultProvider: 'openai' | 'anthropic'

  /**
   * Process input and return response
   */
  abstract process(
    input: AgentInput,
    context: SharedContext
  ): Promise<AgentOutput>

  /**
   * Validate output before returning
   */
  validate(output: AgentOutput): boolean {
    // Basic validation - can be overridden
    return !!output.response
  }

  /**
   * Get recommended model for this agent
   */
  getRecommendedModel(): string {
    return this.defaultModel
  }

  /**
   * Get recommended provider for this agent
   */
  getRecommendedProvider(): 'openai' | 'anthropic' {
    return this.defaultProvider
  }
}

