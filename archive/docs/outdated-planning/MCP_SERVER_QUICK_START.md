# MCP Server Quick Start - Copy-Paste Guide

## 1. Install
```bash
npm install @modelcontextprotocol/sdk --legacy-peer-deps
```

## 2. Create Structure
```bash
mkdir -p lib/mcp/{tools,resources,prompts} app/api/mcp
```

## 3. Tool Template (lib/mcp/tools/your-tools.ts)
```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export const yourTools: Tool[] = [{
  name: 'your_tool',
  description: 'Tool description',
  inputSchema: {
    type: 'object',
    properties: { param: { type: 'string', description: 'Param desc' } },
    required: ['param']
  }
}]

export async function handleYourTool(
  name: string, args: Record<string, unknown>, userId?: string
): Promise<unknown> {
  if (name === 'your_tool') {
    const { param } = args as { param: string }
    // Call your API or LLM orchestrator
    return { result: 'data' }
  }
  throw new Error(`Unknown tool: ${name}`)
}
```

## 4. Tools Index (lib/mcp/tools/index.ts)
```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { yourTools, handleYourTool } from './your-tools'

export const allTools: Tool[] = [...yourTools]
const handlers: Record<string, typeof handleYourTool> = { your_tool: handleYourTool }

export async function callTool(name: string, args: Record<string, unknown>, userId?: string) {
  const handler = handlers[name]
  if (!handler) throw new Error(`No handler: ${name}`)
  return handler(name, args, userId)
}
export function listTools(): Tool[] { return allTools }
```

## 5. Resources (lib/mcp/resources/index.ts) - Optional
```typescript
import type { Resource } from '@modelcontextprotocol/sdk/types.js'

export const allResources: Resource[] = [{
  uri: 'data://*', name: 'Data', description: 'Data resource', mimeType: 'application/json'
}]

export async function readResource(uri: string) {
  const [scheme, id] = uri.split('://')
  return {
    contents: [{
      uri, mimeType: 'application/json',
      text: JSON.stringify({ id, data: 'your data' })
    }]
  }
}
export function listResources() { return allResources }
```

## 6. Prompts (lib/mcp/prompts/index.ts) - Optional
```typescript
import type { Prompt } from '@modelcontextprotocol/sdk/types.js'

export const allPrompts: Prompt[] = [{
  name: 'your_prompt',
  description: 'Prompt desc',
  arguments: [{ name: 'arg1', description: 'Arg desc', required: true }]
}]

export function getPrompt(name: string) {
  return allPrompts.find(p => p.name === name)
}
export function getPromptTemplate(name: string): string {
  return name === 'your_prompt' ? 'Template with {{arg1}}' : ''
}
export function listPrompts() { return allPrompts }
```

## 7. MCP Server (lib/mcp/server.ts)
```typescript
import { listTools, callTool } from './tools/index.js'
import { listResources, readResource } from './resources/index.js'
import { listPrompts, getPrompt, getPromptTemplate } from './prompts/index.js'

export async function handleMCPRequest(request: {
  jsonrpc: '2.0', id?: string | number, method: string, params?: Record<string, unknown>
}, userId?: string) {
  const { id, method, params = {} } = request
  try {
    let result: unknown
    switch (method) {
      case 'tools/list': result = { tools: listTools() }; break
      case 'tools/call': {
        const { name, arguments: args } = params as { name: string, arguments?: Record<string, unknown> }
        result = { content: [{ type: 'text', text: JSON.stringify(await callTool(name, args || {}, userId), null, 2) }] }
        break
      }
      case 'resources/list': result = { resources: listResources() }; break
      case 'resources/read': {
        const { uri } = params as { uri: string }
        result = await readResource(uri)
        break
      }
      case 'prompts/list': result = { prompts: listPrompts() }; break
      case 'prompts/get': {
        const { name, arguments: args } = params as { name: string, arguments?: Record<string, unknown> }
        const prompt = getPrompt(name)
        if (!prompt) throw new Error(`Prompt not found: ${name}`)
        let template = getPromptTemplate(name)
        if (args) Object.entries(args).forEach(([k, v]) => {
          template = template.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v))
        })
        result = { messages: [{ role: 'user', content: { type: 'text', text: template } }] }
        break
      }
      default: throw new Error(`Unknown method: ${method}`)
    }
    return { jsonrpc: '2.0' as const, id, result }
  } catch (error) {
    return {
      jsonrpc: '2.0' as const, id,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Unknown error', data: error }
    }
  }
}
```

## 8. API Route (app/api/mcp/route.ts)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { handleMCPRequest } from '@/lib/mcp/server'

export async function POST(request: NextRequest) {
  let requestId: string | number | undefined
  try {
    const body = await request.json()
    requestId = body.id
    if (!body.jsonrpc || body.jsonrpc !== '2.0' || !body.method) {
      return NextResponse.json({ jsonrpc: '2.0', id: requestId, error: { code: -32600, message: 'Invalid Request' } }, { status: 400 })
    }
    const userId = request.headers.get('x-api-key') || undefined
    const response = await handleMCPRequest(body, userId)
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0', id: requestId,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: true, service: 'mcp-server', status: 'running' })
}
```

## 9. ElevenLabs Configuration
- **MCP Server URL**: `https://your-domain.com/api/mcp`
- **Authentication**: Set `x-api-key` header with your API key
- **Protocol**: JSON-RPC 2.0 over HTTP POST

## 10. Test
```bash
curl -X POST https://your-domain.com/api/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Done! ✅
Your MCP server is ready for ElevenLabs integration.

