/**
 * LLM Module Entry Point
 * 
 * Initializes and registers all LLM agents with the orchestrator
 */

import { getOrchestrator } from './orchestrator'
import { EstimateAgent } from './agents/estimate-agent'
import { PolicyAgent } from './agents/policy-agent'
import { VoiceAgent } from './agents/voice-agent'

// Initialize orchestrator
const orchestrator = getOrchestrator()

// Register agents
const estimateAgent = new EstimateAgent()
const policyAgent = new PolicyAgent()
const voiceAgent = new VoiceAgent()

orchestrator.registerAgent('estimate_generation', estimateAgent)
orchestrator.registerAgent('policy_parsing', policyAgent)
orchestrator.registerAgent('voice_command', voiceAgent)
orchestrator.registerAgent('voice_interpretation', voiceAgent) // Same agent, different use case

// Export orchestrator instance
export { orchestrator }
export { getOrchestrator } from './orchestrator'

// Export agents for direct access if needed
export { EstimateAgent } from './agents/estimate-agent'
export { PolicyAgent } from './agents/policy-agent'
export { VoiceAgent } from './agents/voice-agent'

// Export types
export type { LLMRequest, LLMResponse } from './orchestrator'
export type { SharedContext } from './context/types'
export type { AgentInput, AgentOutput } from './agents/base'

