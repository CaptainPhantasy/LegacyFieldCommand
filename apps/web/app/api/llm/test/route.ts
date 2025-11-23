/**
 * GET /api/llm/test
 * Test endpoint to verify LLM API keys are working
 * 
 * This endpoint tests:
 * - OpenAI API connection
 * - Anthropic API connection
 * - Basic functionality of both
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api/middleware'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins can test LLM keys
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const results: {
      openai?: { status: string; message: string; error?: string }
      anthropic?: { status: string; message: string; error?: string }
      elevenlabs?: { status: string; message: string; error?: string }
    } = {}

    // Test OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          results.openai = {
            status: 'success',
            message: `Connected - ${data.data?.length || 0} models available`,
          }
        } else {
          const error = await response.text()
          results.openai = {
            status: 'error',
            message: 'API key invalid or error',
            error: error.substring(0, 200),
          }
        }
      } catch (error) {
        results.openai = {
          status: 'error',
          message: 'Connection failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    } else {
      results.openai = {
        status: 'missing',
        message: 'OPENAI_API_KEY not set in environment',
      }
    }

    // Test Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-20251015', // Latest Claude Haiku 4.5 (cost-effective, fast)
            max_tokens: 10,
            messages: [
              {
                role: 'user',
                content: 'Say "test"',
              },
            ],
          }),
        })

        if (response.ok) {
          const data = await response.json()
          results.anthropic = {
            status: 'success',
            message: `Connected - Claude responded: "${data.content[0]?.text || 'OK'}"`,
          }
        } else {
          const error = await response.text()
          results.anthropic = {
            status: 'error',
            message: 'API key invalid or error',
            error: error.substring(0, 200),
          }
        }
      } catch (error) {
        results.anthropic = {
          status: 'error',
          message: 'Connection failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    } else {
      results.anthropic = {
        status: 'missing',
        message: 'ANTHROPIC_API_KEY not set in environment',
      }
    }

    // Test ElevenLabs (basic check - just verify key format)
    if (process.env.ELEVENLABS_API_KEY) {
      // ElevenLabs doesn't have a simple test endpoint, so we just check if key exists
      const keyFormat = process.env.ELEVENLABS_API_KEY.startsWith('sk_')
      results.elevenlabs = {
        status: keyFormat ? 'configured' : 'invalid_format',
        message: keyFormat
          ? 'API key format looks valid (starts with sk_)'
          : 'API key format invalid (should start with sk_)',
      }
    } else {
      results.elevenlabs = {
        status: 'missing',
        message: 'ELEVENLABS_API_KEY not set in environment',
      }
    }

    // Summary
    const allWorking =
      results.openai?.status === 'success' &&
      results.anthropic?.status === 'success'

    return successResponse({
      summary: allWorking
        ? 'All LLM API keys are working!'
        : 'Some API keys need attention',
      results,
      ready: allWorking,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

