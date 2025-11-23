/**
 * Policy Management Tools for MCP Server
 * 
 * Tools for parsing and managing insurance policies
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getOrchestrator } from '../../llm/orchestrator'

export const policyTools: Tool[] = [
  {
    name: 'parse_policy',
    description: 'Parse an insurance policy document using AI/OCR. Extracts structured data from PDF.',
    inputSchema: {
      type: 'object',
      properties: {
        policyId: {
          type: 'string',
          description: 'The UUID of the policy to parse',
        },
        forceReparse: {
          type: 'boolean',
          description: 'Force re-parsing even if already parsed (default: false)',
        },
        useAI: {
          type: 'boolean',
          description: 'Whether to use AI/LLM for parsing (default: true)',
        },
      },
      required: ['policyId'],
    },
  },
  {
    name: 'get_policy',
    description: 'Get policy details by ID. Returns policy information including coverage limits and parsed data.',
    inputSchema: {
      type: 'object',
      properties: {
        policyId: {
          type: 'string',
          description: 'The UUID of the policy to retrieve',
        },
      },
      required: ['policyId'],
    },
  },
  {
    name: 'search_policies',
    description: 'Search policies by carrier, policy number, or other criteria. Returns matching policies.',
    inputSchema: {
      type: 'object',
      properties: {
        carrier: {
          type: 'string',
          description: 'Filter by carrier name (optional)',
        },
        policyNumber: {
          type: 'string',
          description: 'Filter by policy number (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
    },
  },
  {
    name: 'get_policy_coverage',
    description: 'Get coverage summary for a policy. Returns coverage limits, deductibles, and exclusions.',
    inputSchema: {
      type: 'object',
      properties: {
        policyId: {
          type: 'string',
          description: 'The UUID of the policy',
        },
      },
      required: ['policyId'],
    },
  },
]

/**
 * Handle policy tool calls
 */
export async function handlePolicyTool(
  name: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  switch (name) {
    case 'parse_policy': {
      const { policyId, forceReparse = false, useAI = true } = args as {
        policyId: string
        forceReparse?: boolean
        useAI?: boolean
      }

      if (useAI) {
        // Use LLM orchestrator
        const orchestrator = getOrchestrator()
        const result = await orchestrator.process({
          useCase: 'policy_parsing',
          input: `Parse policy ${policyId}${forceReparse ? ' (force reparse)' : ''}`,
          context: {
            policyId,
            userId: userId || '',
            userRole: 'admin',
          },
          options: {
            includeActions: true,
          },
        })

        return {
          policy: result.response,
          actions: result.actions,
          metadata: result.metadata,
        }
      } else {
        // Call platform API directly
        return {
          message: 'Non-AI policy parsing will call /api/admin/policies/parse',
          policyId,
        }
      }
    }

    case 'get_policy': {
      const { policyId } = args as { policyId: string }
      return {
        policy: {
          id: policyId,
          message: 'Will call GET /api/admin/policies/[policyId]',
        },
      }
    }

    case 'search_policies': {
      const { carrier, policyNumber, limit = 50 } = args as {
        carrier?: string
        policyNumber?: string
        limit?: number
      }
      return {
        policies: [],
        filters: { carrier, policyNumber, limit },
        message: 'Will call search endpoint',
      }
    }

    case 'get_policy_coverage': {
      const { policyId } = args as { policyId: string }
      return {
        coverage: {},
        policyId,
        message: 'Will call GET /api/admin/policies/[policyId]/coverage',
      }
    }

    default:
      throw new Error(`Unknown policy tool: ${name}`)
  }
}

