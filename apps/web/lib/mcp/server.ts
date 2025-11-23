/**
 * MCP Server Implementation
 * 
 * Model Context Protocol server for ElevenLabs Voice Agents integration
 * Handles JSON-RPC 2.0 protocol messages over HTTP
 */

import { listTools, callTool } from './tools/index'
import { listResources, readResource } from './resources/index'
import { listPrompts, getPrompt, getPromptTemplate } from './prompts/index'

export interface MCPRequest {
  jsonrpc: '2.0'
  id?: string | number
  method: string
  params?: Record<string, unknown>
}

export interface MCPResponse {
  jsonrpc: '2.0'
  id?: string | number
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

/**
 * Handle MCP protocol request
 */
export async function handleMCPRequest(
  request: MCPRequest,
  userId?: string
): Promise<MCPResponse> {
  const { id, method, params = {} } = request

  try {
    let result: unknown

    switch (method) {
      case 'tools/list': {
        result = {
          tools: listTools(),
        }
        break
      }

      case 'tools/call': {
        const { name, arguments: args } = params as {
          name: string
          arguments?: Record<string, unknown>
        }
        result = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await callTool(name, args || {}, userId), null, 2),
            },
          ],
        }
        break
      }

      case 'resources/list': {
        result = {
          resources: listResources(),
        }
        break
      }

      case 'resources/read': {
        const { uri } = params as { uri: string }
        result = await readResource(uri)
        break
      }

      case 'prompts/list': {
        result = {
          prompts: listPrompts(),
        }
        break
      }

      case 'prompts/get': {
        const { name, arguments: args } = params as {
          name: string
          arguments?: Record<string, unknown>
        }

        const prompt = getPrompt(name)
        if (!prompt) {
          throw new Error(`Prompt not found: ${name}`)
        }

        // Get template and build prompt with arguments
        let template = getPromptTemplate(name)

        if (args) {
          // Replace placeholders in template
          Object.entries(args).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
            template = template.replace(regex, String(value))
          })
        }

        result = {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: template,
              },
            },
          ],
        }
        break
      }

      default:
        throw new Error(`Unknown method: ${method}`)
    }

    return {
      jsonrpc: '2.0',
      id,
      result,
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603, // Internal error
        message: error instanceof Error ? error.message : 'Unknown error',
        data: error,
      },
    }
  }
}

