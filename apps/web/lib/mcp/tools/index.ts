/**
 * MCP Tools Registry
 * 
 * Central registry for all MCP tools
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { jobTools, handleJobTool } from './job-tools'
import { estimateTools, handleEstimateTool } from './estimate-tools'
import { policyTools, handlePolicyTool } from './policy-tools'
import { voiceTools, handleVoiceTool } from './voice-tools'

/**
 * All available tools
 */
export const allTools: Tool[] = [
  ...jobTools,
  ...estimateTools,
  ...policyTools,
  ...voiceTools,
]

/**
 * Tool handler registry
 */
export type ToolHandler = (
  name: string,
  args: Record<string, unknown>,
  userId?: string
) => Promise<unknown>

const toolHandlers: Record<string, ToolHandler> = {
  // Job tools
  get_job: handleJobTool,
  list_jobs: handleJobTool,
  update_job: handleJobTool,
  get_job_gates: handleJobTool,

  // Estimate tools
  generate_estimate: handleEstimateTool,
  get_estimate: handleEstimateTool,
  update_estimate: handleEstimateTool,
  get_estimate_line_items: handleEstimateTool,

  // Policy tools
  parse_policy: handlePolicyTool,
  get_policy: handlePolicyTool,
  search_policies: handlePolicyTool,
  get_policy_coverage: handlePolicyTool,

  // Voice tools
  process_voice_command: handleVoiceTool,
  interpret_voice_text: handleVoiceTool,
  get_voice_context: handleVoiceTool,
}

/**
 * Get tool by name
 */
export function getTool(name: string): Tool | undefined {
  return allTools.find((tool) => tool.name === name)
}

/**
 * Get tool handler by name
 */
export function getToolHandler(name: string): ToolHandler | undefined {
  return toolHandlers[name]
}

/**
 * Call a tool by name
 */
export async function callTool(
  name: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  const handler = getToolHandler(name)
  if (!handler) {
    throw new Error(`No handler found for tool: ${name}`)
  }

  return handler(name, args, userId)
}

/**
 * List all available tools
 */
export function listTools(): Tool[] {
  return allTools
}

