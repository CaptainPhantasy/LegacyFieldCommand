/**
 * Estimate Management Tools for MCP Server
 * 
 * Tools for generating and managing estimates
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getOrchestrator } from '../../llm/orchestrator'

export const estimateTools: Tool[] = [
  {
    name: 'generate_estimate',
    description: 'Generate an estimate for a job using AI. Analyzes job data, photos, and policy to create line items.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'The UUID of the job to generate estimate for',
        },
        policyId: {
          type: 'string',
          description: 'The UUID of the policy (optional)',
        },
        useAI: {
          type: 'boolean',
          description: 'Whether to use AI/LLM for generation (default: true)',
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'get_estimate',
    description: 'Get estimate details by ID. Returns estimate information including line items and totals.',
    inputSchema: {
      type: 'object',
      properties: {
        estimateId: {
          type: 'string',
          description: 'The UUID of the estimate to retrieve',
        },
      },
      required: ['estimateId'],
    },
  },
  {
    name: 'update_estimate',
    description: 'Update estimate line items or metadata. Returns the updated estimate.',
    inputSchema: {
      type: 'object',
      properties: {
        estimateId: {
          type: 'string',
          description: 'The UUID of the estimate to update',
        },
        lineItems: {
          type: 'array',
          description: 'Array of line items to update (optional)',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata to update (optional)',
        },
      },
      required: ['estimateId'],
    },
  },
  {
    name: 'get_estimate_line_items',
    description: 'Get all line items for an estimate. Returns detailed line item information.',
    inputSchema: {
      type: 'object',
      properties: {
        estimateId: {
          type: 'string',
          description: 'The UUID of the estimate',
        },
      },
      required: ['estimateId'],
    },
  },
]

/**
 * Handle estimate tool calls
 */
export async function handleEstimateTool(
  name: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  switch (name) {
    case 'generate_estimate': {
      const { jobId, policyId, useAI = true } = args as {
        jobId: string
        policyId?: string
        useAI?: boolean
      }

      if (useAI) {
        // Use LLM orchestrator
        const orchestrator = getOrchestrator()
        const result = await orchestrator.process({
          useCase: 'estimate_generation',
          input: `Generate estimate for job ${jobId}${policyId ? ` with policy ${policyId}` : ''}`,
          context: {
            jobId,
            policyId,
            userId: userId || '',
            userRole: 'field_tech',
          },
          options: {
            includeActions: true,
          },
        })

        return {
          estimate: result.response,
          actions: result.actions,
          metadata: result.metadata,
        }
      } else {
        // Call platform API directly
        return {
          message: 'Non-AI estimate generation will call /api/estimates/generate',
          jobId,
        }
      }
    }

    case 'get_estimate': {
      const { estimateId } = args as { estimateId: string }
      return {
        estimate: {
          id: estimateId,
          message: 'Will call GET /api/estimates/[estimateId]',
        },
      }
    }

    case 'update_estimate': {
      const { estimateId, lineItems, metadata } = args as {
        estimateId: string
        lineItems?: unknown[]
        metadata?: Record<string, unknown>
      }
      return {
        estimate: {
          id: estimateId,
          lineItems,
          metadata,
          message: 'Will call PUT /api/estimates/[estimateId]',
        },
      }
    }

    case 'get_estimate_line_items': {
      const { estimateId } = args as { estimateId: string }
      return {
        lineItems: [],
        estimateId,
        message: 'Will call GET /api/estimates/[estimateId]/line-items',
      }
    }

    default:
      throw new Error(`Unknown estimate tool: ${name}`)
  }
}

