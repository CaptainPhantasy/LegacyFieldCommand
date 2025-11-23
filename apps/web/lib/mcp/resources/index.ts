/**
 * MCP Resources Registry
 * 
 * Central registry for all MCP resources
 */

import type { Resource } from '@modelcontextprotocol/sdk/types.js'
import { platformResources, readPlatformResource } from './platform-resources'

/**
 * All available resources
 */
export const allResources: Resource[] = [...platformResources]

/**
 * Get resource by URI pattern
 */
export function getResource(uri: string): Resource | undefined {
  // Match URI pattern (e.g., "job://*" matches "job://123")
  return allResources.find((resource) => {
    const pattern = resource.uri.replace('*', '.*')
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(uri)
  })
}

/**
 * List all available resources
 */
export function listResources(): Resource[] {
  return allResources
}

/**
 * Read a resource
 */
export async function readResource(
  uri: string
): Promise<{ contents: Array<{ uri: string; mimeType: string; text?: string; blob?: string }> }> {
  // Check if it's a platform resource
  if (uri.startsWith('job://') || uri.startsWith('policy://') || uri.startsWith('estimate://') || uri.startsWith('context://')) {
    return readPlatformResource(uri)
  }

  throw new Error(`Unknown resource URI: ${uri}`)
}

