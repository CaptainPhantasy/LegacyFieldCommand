/**
 * LLM Model Types and Definitions
 * 
 * Last Updated: November 2025
 */

export type LLMProvider = 'openai' | 'anthropic'

export type LLMModel =
  // OpenAI Models
  | 'gpt-5'
  | 'gpt-5-turbo'
  | 'gpt-4.5'
  | 'gpt-4.5-turbo'
  | 'gpt-4o'
  | 'gpt-4o-2024-08-06'
  | 'o3-pro'
  | 'o3-mini'
  // Anthropic Models
  | 'claude-haiku-4-20251015'
  | 'claude-sonnet-4-20250514'
  | 'claude-opus-4-20250514'
  | 'claude-3-7-sonnet-20250224'
  | 'claude-3-5-sonnet-20241022'

export interface LLMRequest {
  prompt: string
  model?: LLMModel
  provider?: LLMProvider
  temperature?: number
  maxTokens?: number
  system?: string
  responseFormat?: 'json' | 'text'
}

export interface LLMResponse {
  content: string
  model: string
  provider: LLMProvider
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    promptTokens?: number
    completionTokens?: number
  }
  error?: string
}

export interface LLMOptions {
  temperature?: number
  maxTokens?: number
  system?: string
  responseFormat?: 'json' | 'text'
}

/**
 * Model capabilities mapping
 */
export interface ModelCapabilities {
  vision: boolean
  audio: boolean
  structuredOutput: boolean
  longContext: boolean
  reasoning: 'basic' | 'enhanced' | 'advanced'
  cost: 'low' | 'medium' | 'high' | 'premium'
}

export const MODEL_CAPABILITIES: Record<LLMModel, ModelCapabilities> = {
  // OpenAI Models
  'gpt-5': {
    vision: true,
    audio: true,
    structuredOutput: true,
    longContext: true,
    reasoning: 'advanced',
    cost: 'premium',
  },
  'gpt-5-turbo': {
    vision: true,
    audio: true,
    structuredOutput: true,
    longContext: true,
    reasoning: 'advanced',
    cost: 'high',
  },
  'gpt-4.5': {
    vision: true,
    audio: true,
    structuredOutput: true,
    longContext: true,
    reasoning: 'enhanced',
    cost: 'high',
  },
  'gpt-4.5-turbo': {
    vision: true,
    audio: true,
    structuredOutput: true,
    longContext: true,
    reasoning: 'enhanced',
    cost: 'medium',
  },
  'gpt-4o': {
    vision: true,
    audio: true,
    structuredOutput: true,
    longContext: true,
    reasoning: 'enhanced',
    cost: 'medium',
  },
  'gpt-4o-2024-08-06': {
    vision: true,
    audio: true,
    structuredOutput: true,
    longContext: true,
    reasoning: 'enhanced',
    cost: 'medium',
  },
  'o3-pro': {
    vision: false,
    audio: false,
    structuredOutput: true,
    longContext: true,
    reasoning: 'advanced',
    cost: 'premium',
  },
  'o3-mini': {
    vision: false,
    audio: false,
    structuredOutput: true,
    longContext: true,
    reasoning: 'advanced',
    cost: 'high',
  },
  // Anthropic Models
  'claude-haiku-4-20251015': {
    vision: false,
    audio: false,
    structuredOutput: true,
    longContext: true, // 200K tokens
    reasoning: 'enhanced',
    cost: 'low', // 1/3 cost of Sonnet 4
  },
  'claude-sonnet-4-20250514': {
    vision: false,
    audio: false,
    structuredOutput: true,
    longContext: true, // 200K tokens
    reasoning: 'enhanced',
    cost: 'low',
  },
  'claude-opus-4-20250514': {
    vision: false,
    audio: false,
    structuredOutput: true,
    longContext: true, // 200K tokens
    reasoning: 'advanced',
    cost: 'high',
  },
  'claude-3-7-sonnet-20250224': {
    vision: false,
    audio: false,
    structuredOutput: true,
    longContext: true,
    reasoning: 'enhanced',
    cost: 'low',
  },
  'claude-3-5-sonnet-20241022': {
    vision: false,
    audio: false,
    structuredOutput: true,
    longContext: true,
    reasoning: 'basic',
    cost: 'low',
  },
}

/**
 * Get model capabilities
 */
export function getModelCapabilities(model: LLMModel): ModelCapabilities {
  return MODEL_CAPABILITIES[model] || MODEL_CAPABILITIES['gpt-4o']
}

/**
 * Check if model supports vision
 */
export function supportsVision(model: LLMModel): boolean {
  return getModelCapabilities(model).vision
}

/**
 * Check if model supports structured output
 */
export function supportsStructuredOutput(model: LLMModel): boolean {
  return getModelCapabilities(model).structuredOutput
}

