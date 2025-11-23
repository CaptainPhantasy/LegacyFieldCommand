/**
 * Voice Processing Tools for MCP Server
 * 
 * Tools for processing voice commands and interpreting voice text
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getOrchestrator } from '../../llm/orchestrator'

export const voiceTools: Tool[] = [
  {
    name: 'process_voice_command',
    description: 'Process a voice command using AI. Understands natural language and returns intent and actions.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The voice command text to process',
        },
        context: {
          type: 'object',
          description: 'Optional context (jobId, gateId, etc.)',
          properties: {
            jobId: {
              type: 'string',
            },
            gateId: {
              type: 'string',
            },
          },
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'interpret_voice_text',
    description: 'Interpret transcribed voice text and extract structured data. Useful for voice notes and communications.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The transcribed voice text to interpret',
        },
        jobId: {
          type: 'string',
          description: 'Optional job ID for context',
        },
        communicationId: {
          type: 'string',
          description: 'Optional communication ID',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'get_voice_context',
    description: 'Get current voice interaction context. Returns job, gate, and conversation state.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'The session ID for the voice interaction',
        },
      },
      required: ['sessionId'],
    },
  },
]

/**
 * Handle voice tool calls
 */
export async function handleVoiceTool(
  name: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  switch (name) {
    case 'process_voice_command': {
      const { command, context } = args as {
        command: string
        context?: { jobId?: string; gateId?: string }
      }

      // Use LLM orchestrator
      const orchestrator = getOrchestrator()
      const result = await orchestrator.process({
        useCase: 'voice_command',
        input: command,
        context: {
          userId: userId || '',
          userRole: 'field_tech',
          jobId: context?.jobId,
          gateId: context?.gateId,
          platform: '11labs',
        },
        options: {
          includeActions: true,
          includeContext: true,
        },
      })

      return {
        intent: result.metadata?.intent,
        response: result.response,
        actions: result.actions,
        context: result.context,
        confidence: result.metadata?.confidence,
      }
    }

    case 'interpret_voice_text': {
      const { text, jobId, communicationId } = args as {
        text: string
        jobId?: string
        communicationId?: string
      }

      // Use LLM orchestrator
      const orchestrator = getOrchestrator()
      const result = await orchestrator.process({
        useCase: 'voice_interpretation',
        input: text,
        context: {
          userId: userId || '',
          userRole: 'field_tech',
          jobId,
          metadata: {
            communicationId,
          },
        },
        options: {
          includeActions: true,
        },
      })

      return {
        interpretation: result.response,
        actions: result.actions,
        metadata: result.metadata,
      }
    }

    case 'get_voice_context': {
      const { sessionId } = args as { sessionId: string }

      // Get context from orchestrator
      const orchestrator = getOrchestrator()
      const context = await orchestrator.getContext(sessionId)

      return {
        context: context || null,
        sessionId,
      }
    }

    default:
      throw new Error(`Unknown voice tool: ${name}`)
  }
}

