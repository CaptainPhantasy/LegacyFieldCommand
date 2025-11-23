/**
 * LLM Orchestrator
 * 
 * Single entry point for all LLM requests
 * Routes to appropriate agents, manages context, coordinates multi-agent workflows
 * 
 * Last Updated: November 2025
 */

import type { BaseAgent } from './agents/base'
import { ContextManager } from './context/manager'
import type { SharedContext } from './context/types'

export interface LLMRequest {
  input: string
  useCase: string
  context?: Partial<SharedContext>
  options?: {
    model?: string
    provider?: 'openai' | 'anthropic'
    temperature?: number
    maxTokens?: number
    includeActions?: boolean
    includeContext?: boolean
  }
}

export interface LLMResponse {
  response: string
  actions?: Array<{
    type: string
    data: any
    endpoint: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  }>
  context?: Partial<SharedContext>
  metadata?: {
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
}

export interface AgentRegistry {
  [useCase: string]: BaseAgent
}

/**
 * LLM Orchestrator
 * 
 * Routes requests to appropriate agents, manages shared context,
 * coordinates multi-agent workflows
 */
export class Orchestrator {
  private agents: AgentRegistry = {}
  private contextManager: ContextManager
  private enabled: boolean

  constructor() {
    this.contextManager = new ContextManager()
    this.enabled = process.env.LLM_ENABLED !== 'false'
  }

  /**
   * Register an agent for a specific use case
   */
  registerAgent(useCase: string, agent: BaseAgent): void {
    this.agents[useCase] = agent
  }

  /**
   * Process an LLM request
   */
  async process(request: LLMRequest): Promise<LLMResponse> {
    // Check if LLM is enabled
    if (!this.enabled) {
      throw new Error('LLM features are disabled. Set LLM_ENABLED=true in environment.')
    }

    const { useCase, input, context, options } = request

    // Get or create context
    const sessionId = context?.sessionId || this.generateSessionId()
    const sharedContext = await this.contextManager.getContext(sessionId, context)

    // Find appropriate agent
    const agent = this.agents[useCase]
    if (!agent) {
      throw new Error(`No agent registered for use case: ${useCase}`)
    }

    try {
      // Process with agent
      const result = await agent.process(
        {
          input,
          context: sharedContext,
          options: options || {},
        },
        sharedContext
      )

      // Update context
      if (result.context) {
        await this.contextManager.updateContext(sessionId, result.context)
      }

      // Format response
      return {
        response: result.response,
        actions: result.actions,
        context: result.context,
        metadata: {
          intent: result.intent,
          confidence: result.confidence,
          model: result.model,
          provider: result.provider,
          usage: result.usage,
        },
      }
    } catch (error) {
      // Log error but don't expose internal details
      console.error(`Orchestrator error for use case ${useCase}:`, error)
      throw new Error(`LLM processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Coordinate multiple agents for complex workflows
   */
  async coordinate(
    agents: Array<{ useCase: string; input: string }>,
    sharedContext: SharedContext
  ): Promise<{
    results: Array<{ useCase: string; response: LLMResponse }>
    aggregatedContext: SharedContext
  }> {
    const results: Array<{ useCase: string; response: LLMResponse }> = []
    let aggregatedContext = { ...sharedContext }

    // Process each agent sequentially (can be parallelized later if needed)
    for (const agentRequest of agents) {
      const agent = this.agents[agentRequest.useCase]
      if (!agent) {
        console.warn(`Agent not found for use case: ${agentRequest.useCase}`)
        continue
      }

      try {
        const result = await agent.process(
          {
            input: agentRequest.input,
            context: aggregatedContext,
            options: {},
          },
          aggregatedContext
        )

        results.push({
          useCase: agentRequest.useCase,
          response: {
            response: result.response,
            actions: result.actions,
            context: result.context,
            metadata: {
              intent: result.intent,
              confidence: result.confidence,
              model: result.model,
              provider: result.provider,
              usage: result.usage,
            },
          },
        })

        // Merge context from this agent
        if (result.context) {
          aggregatedContext = {
            ...aggregatedContext,
            ...result.context,
          }
        }
      } catch (error) {
        console.error(`Error in agent ${agentRequest.useCase}:`, error)
        // Continue with other agents even if one fails
      }
    }

    return {
      results,
      aggregatedContext,
    }
  }

  /**
   * Get context for a session
   */
  async getContext(sessionId: string): Promise<SharedContext | null> {
    return this.contextManager.getContext(sessionId)
  }

  /**
   * Clear context for a session
   */
  async clearContext(sessionId: string): Promise<void> {
    return this.contextManager.clearContext(sessionId)
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Check if orchestrator is ready (has agents registered)
   */
  isReady(): boolean {
    return Object.keys(this.agents).length > 0
  }

  /**
   * Get list of registered agents
   */
  getRegisteredAgents(): string[] {
    return Object.keys(this.agents)
  }
}

// Singleton instance
let orchestratorInstance: Orchestrator | null = null

/**
 * Get orchestrator instance (singleton)
 */
export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator()
  }
  return orchestratorInstance
}

// Export default
export default getOrchestrator

