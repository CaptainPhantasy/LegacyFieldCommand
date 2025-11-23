/**
 * Anthropic Claude Client Wrapper
 * Supports latest models: Claude 4 Sonnet, Claude 4 Opus, Claude 3.7 Sonnet
 * 
 * Last Updated: November 2025
 */

import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('ANTHROPIC_API_KEY not set in environment variables')
}

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null

export interface AnthropicOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  system?: string
}

export interface AnthropicResponse {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  model: string
}

/**
 * Call Anthropic Claude API
 */
export async function callAnthropic(
  prompt: string,
  options: AnthropicOptions = {}
): Promise<AnthropicResponse> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured')
  }

  const {
    model = 'claude-haiku-4-20251015', // Default to Claude Haiku 4.5 (cost-effective, fast, matches Sonnet 4)
    temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '4000'),
    system,
  } = options

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: system || undefined,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content =
      response.content.find((block) => block.type === 'text')?.text || ''
    const usage = response.usage

    return {
      content,
      usage: usage
        ? {
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
          }
        : undefined,
      model: response.model,
    }
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error: ${error.message}`)
    }
    throw error
  }
}

/**
 * Call Anthropic with structured output (JSON mode)
 */
export async function callAnthropicStructured(
  prompt: string,
  schema: Record<string, unknown>,
  options: AnthropicOptions = {}
): Promise<AnthropicResponse> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured')
  }

  const {
    model = 'claude-haiku-4-20251015', // Default to Haiku 4.5 for structured output
    temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '4000'),
    system,
  } = options

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: system || undefined,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nReturn a valid JSON object matching this schema: ${JSON.stringify(schema)}`,
        },
      ],
    })

    const content =
      response.content.find((block) => block.type === 'text')?.text || ''
    const usage = response.usage

    // Try to parse JSON from response
    let jsonContent = content
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonContent = jsonMatch[0]
      }
    } catch {
      // If parsing fails, return content as-is
    }

    return {
      content: jsonContent,
      usage: usage
        ? {
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
          }
        : undefined,
      model: response.model,
    }
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error: ${error.message}`)
    }
    throw error
  }
}

/**
 * Available Anthropic Models (November 2025)
 */
export const ANTHROPIC_MODELS = {
  // Latest cost-effective model (October 2025) - RECOMMENDED
  CLAUDE_HAIKU_4_5: 'claude-haiku-4-20251015',
  
  // Latest models (May 2025)
  CLAUDE_SONNET_4: 'claude-sonnet-4-20250514',
  CLAUDE_OPUS_4: 'claude-opus-4-20250514',
  
  // Hybrid reasoning (February 2025)
  CLAUDE_3_7_SONNET: 'claude-3-7-sonnet-20250224',
  
  // Previous generation (still available)
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20241022',
} as const

/**
 * Get recommended model for use case
 */
export function getRecommendedModel(useCase: string): string {
  switch (useCase) {
    case 'complex_reasoning':
    case 'agent_workflows':
    case 'long_horizon':
      // Claude Opus 4 for complex tasks
      return ANTHROPIC_MODELS.CLAUDE_OPUS_4
    
    case 'coding':
    case 'instruction_following':
    case 'document_understanding':
    case 'writing':
    case 'voice_commands':
    case 'high_volume':
    case 'real_time':
    case 'cost_sensitive':
      // Claude Haiku 4.5 for most tasks (1/3 cost, 2x faster, matches Sonnet 4)
      return ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5
    
    case 'transparency':
    case 'reasoning_scratchpad':
      // Claude 3.7 Sonnet for visible reasoning
      return ANTHROPIC_MODELS.CLAUDE_3_7_SONNET
    
    default:
      return ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5 // Safe default - cost-effective
  }
}

export default anthropic

