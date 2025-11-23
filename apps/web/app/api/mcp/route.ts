/**
 * MCP Server API Route
 * 
 * HTTP endpoint for Model Context Protocol server
 * Used by ElevenLabs Voice Agents and other MCP clients
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleMCPRequest } from '@/lib/mcp/server'
import { errorResponse } from '@/lib/api/middleware'
import { requireAuth } from '@/lib/api/middleware'

/**
 * Handle MCP protocol requests (JSON-RPC 2.0)
 */
export async function POST(request: NextRequest) {
  let requestId: string | number | undefined
  try {
    // Get request body (JSON-RPC 2.0 message)
    const body = await request.json()
    requestId = body.id

    // Validate JSON-RPC 2.0 format
    if (!body.jsonrpc || body.jsonrpc !== '2.0' || !body.method) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32600,
            message: 'Invalid Request',
          },
        },
        { status: 400 }
      )
    }

    // Extract authentication
    // Try to get user from session, fallback to API key
    let userId: string | undefined
    try {
      const { user } = await requireAuth(request)
      userId = user.id
    } catch {
      // If auth fails, try API key
      const apiKey = request.headers.get('x-api-key')
      if (apiKey) {
        userId = apiKey // Use API key as userId for now
      }
    }

    // Process MCP request
    const response = await handleMCPRequest(body, userId)

    return NextResponse.json(response)
  } catch (error) {
    console.error('MCP server error:', error)
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      service: 'mcp-server',
      status: 'running',
      version: '1.0.0',
      capabilities: {
        tools: true,
        resources: true,
        prompts: true,
      },
      protocol: 'json-rpc-2.0',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

