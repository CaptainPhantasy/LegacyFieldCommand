/**
 * Platform Resources for MCP Server
 * 
 * Resources expose platform data via MCP protocol
 */

import type { Resource } from '@modelcontextprotocol/sdk/types.js'

export const platformResources: Resource[] = [
  {
    uri: 'job://*',
    name: 'Job Resource',
    description: 'Access job data by ID. Format: job://{jobId}',
    mimeType: 'application/json',
  },
  {
    uri: 'policy://*',
    name: 'Policy Resource',
    description: 'Access policy data by ID. Format: policy://{policyId}',
    mimeType: 'application/json',
  },
  {
    uri: 'estimate://*',
    name: 'Estimate Resource',
    description: 'Access estimate data by ID. Format: estimate://{estimateId}',
    mimeType: 'application/json',
  },
  {
    uri: 'context://*',
    name: 'Context Resource',
    description: 'Access conversation context by session ID. Format: context://{sessionId}',
    mimeType: 'application/json',
  },
]

/**
 * Read a platform resource
 */
export async function readPlatformResource(
  uri: string
): Promise<{ contents: Array<{ uri: string; mimeType: string; text?: string; blob?: string }> }> {
  const [scheme, id] = uri.split('://')

  switch (scheme) {
    case 'job': {
      // TODO: Call platform API to get job data
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              id,
              message: 'Job resource - will call GET /api/field/jobs/[jobId]',
            }),
          },
        ],
      }
    }

    case 'policy': {
      // TODO: Call platform API to get policy data
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              id,
              message: 'Policy resource - will call GET /api/admin/policies/[policyId]',
            }),
          },
        ],
      }
    }

    case 'estimate': {
      // TODO: Call platform API to get estimate data
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              id,
              message: 'Estimate resource - will call GET /api/estimates/[estimateId]',
            }),
          },
        ],
      }
    }

    case 'context': {
      // Get context from orchestrator
      const { getOrchestrator } = await import('../../llm/orchestrator')
      const orchestrator = getOrchestrator()
      const context = await orchestrator.getContext(id)

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(context || { sessionId: id, message: 'Context not found' }),
          },
        ],
      }
    }

    default:
      throw new Error(`Unknown resource scheme: ${scheme}`)
  }
}

