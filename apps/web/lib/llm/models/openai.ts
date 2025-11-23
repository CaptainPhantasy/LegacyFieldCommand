/**
 * OpenAI Client Wrapper
 * Supports latest models: GPT-5, GPT-4.5, GPT-4o, o3 series
 * 
 * Last Updated: November 2025
 */

import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set in environment variables')
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export interface OpenAIOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: { type: 'json_object' } | { type: 'text' }
}

export interface OpenAIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
}

/**
 * Call OpenAI API with text prompt
 */
export async function callOpenAI(
  prompt: string,
  options: OpenAIOptions = {}
): Promise<OpenAIResponse> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  const {
    model = 'gpt-4o', // Default to GPT-4o (multimodal, cost-effective)
    temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '4000'),
    responseFormat,
  } = options

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat && { response_format: responseFormat }),
    })

    const content = response.choices[0]?.message?.content || ''
    const usage = response.usage

    return {
      content,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
      model: response.model,
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`)
    }
    throw error
  }
}

/**
 * Call OpenAI Vision API (GPT-4o) with image
 */
export async function callOpenAIVision(
  prompt: string,
  imageUrl: string,
  options: OpenAIOptions = {}
): Promise<OpenAIResponse> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  const {
    model = 'gpt-4o', // GPT-4o has vision capabilities
    temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '4000'),
  } = options

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature,
      max_tokens: maxTokens,
    })

    const content = response.choices[0]?.message?.content || ''
    const usage = response.usage

    return {
      content,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
      model: response.model,
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI Vision API error: ${error.message}`)
    }
    throw error
  }
}

/**
 * Available OpenAI Models (November 2025)
 */
export const OPENAI_MODELS = {
  // Latest models (2025)
  GPT5: 'gpt-5',
  GPT5_TURBO: 'gpt-5-turbo',
  GPT4_5: 'gpt-4.5',
  GPT4_5_TURBO: 'gpt-4.5-turbo',
  
  // Multimodal (2024)
  GPT4O: 'gpt-4o',
  GPT4O_LATEST: 'gpt-4o-2024-08-06',
  
  // Reasoning models (2025)
  O3_PRO: 'o3-pro',
  O3_MINI: 'o3-mini',
} as const

/**
 * Get recommended model for use case
 */
export function getRecommendedModel(useCase: string): string {
  switch (useCase) {
    case 'vision':
    case 'photo_analysis':
    case 'image_understanding':
      return OPENAI_MODELS.GPT4O
    
    case 'complex_reasoning':
    case 'estimate_generation':
    case 'code_generation':
      // Try GPT-5 first, fallback to GPT-4.5
      return OPENAI_MODELS.GPT5 || OPENAI_MODELS.GPT4_5
    
    case 'structured_output':
    case 'extraction':
      return OPENAI_MODELS.GPT4_5 || OPENAI_MODELS.GPT4O
    
    case 'mathematical':
    case 'scientific':
      return OPENAI_MODELS.O3_PRO || OPENAI_MODELS.GPT5
    
    default:
      return OPENAI_MODELS.GPT4O // Safe default
  }
}

export default openai

