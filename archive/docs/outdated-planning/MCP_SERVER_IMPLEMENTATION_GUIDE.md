# MCP Server Implementation Guide for ElevenLabs Integration

## Quick Start: Copy-Paste Implementation Guide

This guide provides a step-by-step methodology for implementing an MCP (Model Context Protocol) server to integrate with ElevenLabs Voice Agents. Follow these steps in order.

---

## Step 1: Install Dependencies

```bash
npm install @modelcontextprotocol/sdk --legacy-peer-deps
```

---

## Step 2: Create Directory Structure

```bash
mkdir -p lib/mcp/{tools,resources,prompts}
mkdir -p app/api/mcp
```

---

## Step 3: Implement MCP Tools

### 3.1 Create Tool Files

Create tool files in `lib/mcp/tools/` for each domain (e.g., `user-tools.ts`, `data-tools.ts`, etc.)

**Template: `lib/mcp/tools/[domain]-tools.ts`**

```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
// Import your orchestrator/service if using AI
// import { getOrchestrator } from '../../llm/orchestrator'

export const [domain]Tools: Tool[] = [
  {
    name: 'tool_name',
    description: 'Tool description for MCP client',
    inputSchema: {
      type: 'object',
      properties: {
        param1: {
          type: 'string',
          description: 'Parameter description',
        },
      },
      required: ['param1'],
    },
  },
  // Add more tools...
]

export async function handle[Domain]Tool(
  name: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  switch (name) {
    case 'tool_name': {
      const { param1 } = args as { param1: string }
      
      // Option 1: Call LLM orchestrator for AI tasks
      // const orchestrator = getOrchestrator()
      // const result = await orchestrator.process({...})
      
      // Option 2: Call your platform API
      // const response = await fetch('/api/your-endpoint', {...})
      
      return {
        result: 'Tool response data',
      }
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
```

### 3.2 Create Tools Index

**File: `lib/mcp/tools/index.ts`**

```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { [domain]Tools, handle[Domain]Tool } from './[domain]-tools'
// Import other tool sets...

export const allTools: Tool[] = [
  ...domainTools,
  // ...other tools
]

export type ToolHandler = (
  name: string,
  args: Record<string, unknown>,
  userId?: string
) => Promise<unknown>

const toolHandlers: Record<string, ToolHandler> = {
  tool_name: handle[Domain]Tool,
  // ...other handlers
}

export function getTool(name: string): Tool | undefined {
  return allTools.find((tool) => tool.name === name)
}

export function getToolHandler(name: string): ToolHandler | undefined {
  return toolHandlers[name]
}

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

export function listTools(): Tool[] {
  return allTools
}
```

---

## Step 4: Implement MCP Resources (Optional)

### 4.1 Create Resources File

**File: `lib/mcp/resources/platform-resources.ts`**

```typescript
import type { Resource } from '@modelcontextprotocol/sdk/types.js'

export const platformResources: Resource[] = [
  {
    uri: 'resource://*',
    name: 'Resource Name',
    description: 'Resource description. Format: resource://{id}',
    mimeType: 'application/json',
  },
  // Add more resources...
]

export async function readPlatformResource(
  uri: string
): Promise<{ contents: Array<{ uri: string; mimeType: string; text?: string; blob?: string }> }> {
  const [scheme, id] = uri.split('://')

  switch (scheme) {
    case 'resource': {
      // Fetch data from your API
      // const data = await fetch(`/api/resource/${id}`)
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ id, data: 'resource data' }),
          },
        ],
      }
    }
    default:
      throw new Error(`Unknown resource scheme: ${scheme}`)
  }
}
```

### 4.2 Create Resources Index

**File: `lib/mcp/resources/index.ts`**

```typescript
import type { Resource } from '@modelcontextprotocol/sdk/types.js'
import { platformResources, readPlatformResource } from './platform-resources'

export const allResources: Resource[] = [...platformResources]

export function getResource(uri: string): Resource | undefined {
  return allResources.find((resource) => {
    const pattern = resource.uri.replace('*', '.*')
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(uri)
  })
}

export function listResources(): Resource[] {
  return allResources
}

export async function readResource(
  uri: string
): Promise<{ contents: Array<{ uri: string; mimeType: string; text?: string; blob?: string }> }> {
  if (uri.startsWith('resource://')) {
    return readPlatformResource(uri)
  }
  throw new Error(`Unknown resource URI: ${uri}`)
}
```

---

## Step 5: Implement MCP Prompts (Optional)

**File: `lib/mcp/prompts/index.ts`**

```typescript
import type { Prompt } from '@modelcontextprotocol/sdk/types.js'
// Import your prompt templates
// import { YOUR_PROMPT_TEMPLATE } from '../../llm/utils/prompts'

export const allPrompts: Prompt[] = [
  {
    name: 'prompt_name',
    description: 'Prompt description',
    arguments: [
      {
        name: 'arg1',
        description: 'Argument description',
        required: true,
      },
    ],
  },
  // Add more prompts...
]

export function getPrompt(name: string): Prompt | undefined {
  return allPrompts.find((prompt) => prompt.name === name)
}

export function getPromptTemplate(name: string): string {
  switch (name) {
    case 'prompt_name':
      return 'Your prompt template with {{placeholders}}'
    default:
      throw new Error(`Unknown prompt: ${name}`)
  }
}

export function listPrompts(): Prompt[] {
  return allPrompts
}
```

---

## Step 6: Create MCP Server Core

**File: `lib/mcp/server.ts`**

```typescript
import { listTools, callTool } from './tools/index.js'
import { listResources, readResource } from './resources/index.js'
import { listPrompts, getPrompt, getPromptTemplate } from './prompts/index.js'

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

export async function handleMCPRequest(
  request: MCPRequest,
  userId?: string
): Promise<MCPResponse> {
  const { id, method, params = {} } = request

  try {
    let result: unknown

    switch (method) {
      case 'tools/list':
        result = { tools: listTools() }
        break

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

      case 'resources/list':
        result = { resources: listResources() }
        break

      case 'resources/read': {
        const { uri } = params as { uri: string }
        result = await readResource(uri)
        break
      }

      case 'prompts/list':
        result = { prompts: listPrompts() }
        break

      case 'prompts/get': {
        const { name, arguments: args } = params as {
          name: string
          arguments?: Record<string, unknown>
        }
        const prompt = getPrompt(name)
        if (!prompt) throw new Error(`Prompt not found: ${name}`)

        let template = getPromptTemplate(name)
        if (args) {
          Object.entries(args).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
            template = template.replace(regex, String(value))
          })
        }

        result = {
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: template },
            },
          ],
        }
        break
      }

      default:
        throw new Error(`Unknown method: ${method}`)
    }

    return { jsonrpc: '2.0', id, result }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: error,
      },
    }
  }
}
```

---

## Step 7: Create API Route

**File: `app/api/mcp/route.ts`** (Next.js) or equivalent for your framework

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { handleMCPRequest } from '@/lib/mcp/server'
// Import your auth middleware
// import { requireAuth } from '@/lib/api/middleware'

export async function POST(request: NextRequest) {
  let requestId: string | number | undefined
  try {
    const body = await request.json()
    requestId = body.id

    // Validate JSON-RPC 2.0 format
    if (!body.jsonrpc || body.jsonrpc !== '2.0' || !body.method) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: requestId,
          error: { code: -32600, message: 'Invalid Request' },
        },
        { status: 400 }
      )
    }

    // Extract authentication
    let userId: string | undefined
    try {
      // Use your auth middleware
      // const { user } = await requireAuth(request)
      // userId = user.id
    } catch {
      // Fallback to API key
      const apiKey = request.headers.get('x-api-key')
      if (apiKey) userId = apiKey
    }

    // Process MCP request
    const response = await handleMCPRequest(body, userId)
    return NextResponse.json(response)
  } catch (error) {
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

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    service: 'mcp-server',
    status: 'running',
    capabilities: { tools: true, resources: true, prompts: true },
  })
}
```

---

## Step 8: Configure ElevenLabs Voice Agent

### 8.1 In ElevenLabs Dashboard

1. Go to Voice Agents → Create/Edit Agent
2. Configure agent settings:
   - **Name**: Your agent name
   - **Voice**: Select appropriate voice
   - **Model**: Choose LLM model (or custom endpoint)

### 8.2 Configure MCP Integration

**Option A: Custom LLM Endpoint (Recommended)**
- Set **Custom LLM Endpoint**: `https://your-domain.com/api/mcp`
- Set **API Key**: Your platform API key
- Agent will discover tools automatically via MCP protocol

**Option B: Tools Configuration**
- In agent settings, add tools that call your MCP server
- Tools should POST to `/api/mcp` with JSON-RPC 2.0 format

### 8.3 Test Connection

```bash
# Test MCP server health
curl https://your-domain.com/api/mcp

# Test tools/list
curl -X POST https://your-domain.com/api/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

---

## Step 9: Implementation Checklist

- [ ] Install MCP SDK
- [ ] Create directory structure
- [ ] Implement tools (at least 1 tool file)
- [ ] Create tools index
- [ ] (Optional) Implement resources
- [ ] (Optional) Implement prompts
- [ ] Create MCP server core
- [ ] Create API route
- [ ] Test MCP server locally
- [ ] Configure ElevenLabs agent
- [ ] Test end-to-end voice interaction

---

## Key Patterns

### Tool Pattern
1. Define tool schema with `name`, `description`, `inputSchema`
2. Create handler function that processes tool calls
3. Register handler in tools index
4. Handler can call LLM orchestrator OR platform APIs

### Resource Pattern
1. Define resource with URI pattern (e.g., `data://*`)
2. Create reader function that fetches data
3. Return MCP resource format with contents array

### Prompt Pattern
1. Define prompt with name and arguments
2. Create template with `{{placeholders}}`
3. Replace placeholders when prompt is requested

### Authentication Pattern
1. Try session-based auth first
2. Fallback to API key from header
3. Pass userId to tool handlers for authorization

---

## Common Issues & Solutions

### Issue: "Cannot find module @modelcontextprotocol/sdk"
**Solution**: Install with `--legacy-peer-deps` flag

### Issue: "Unknown method" errors
**Solution**: Ensure method names match MCP spec: `tools/list`, `tools/call`, `resources/list`, etc.

### Issue: Tools not discovered by ElevenLabs
**Solution**: Verify `/api/mcp` returns valid JSON-RPC 2.0 responses, check authentication

### Issue: TypeScript errors with Map.entries()
**Solution**: Convert to array: `Array.from(map.entries())`

---

## Testing

### Test MCP Server Locally

```typescript
// test-mcp.ts
import { handleMCPRequest } from './lib/mcp/server'

const request = {
  jsonrpc: '2.0' as const,
  id: 1,
  method: 'tools/list',
}

const response = await handleMCPRequest(request)
console.log(JSON.stringify(response, null, 2))
```

### Test with MCP Inspector

```bash
npm install -g @modelcontextprotocol/inspector
mcp dev lib/mcp/server.ts
```

---

## Next Steps After Implementation

1. **Add More Tools**: Identify common operations, create tools for each
2. **Connect to APIs**: Replace placeholder handlers with actual API calls
3. **Add Error Handling**: Use try-catch, return proper error responses
4. **Add Caching**: Cache common tool results to reduce API calls
5. **Add Logging**: Log tool calls for debugging and monitoring
6. **Add Rate Limiting**: Protect your API from abuse
7. **Test Thoroughly**: Test all tools, resources, prompts
8. **Deploy**: Deploy to production, configure ElevenLabs

---

## Summary

This methodology provides:
- ✅ Single interface (MCP server) instead of multiple webhooks
- ✅ Standard protocol (JSON-RPC 2.0) for tool integration
- ✅ Automatic tool discovery by ElevenLabs
- ✅ Easy extension (just add new tools)
- ✅ Clean separation (protocol layer vs business logic)

**Total Implementation Time**: 2-4 hours for basic setup, 1-2 days for full tool suite

---

## Quick Reference

**MCP Protocol Methods:**
- `tools/list` - List all available tools
- `tools/call` - Execute a tool
- `resources/list` - List all available resources
- `resources/read` - Read a resource by URI
- `prompts/list` - List all available prompts
- `prompts/get` - Get a prompt template

**File Structure:**
```
lib/mcp/
├── server.ts          # MCP protocol handler
├── tools/
│   ├── index.ts       # Tool registry
│   └── [domain]-tools.ts
├── resources/
│   ├── index.ts       # Resource registry
│   └── platform-resources.ts
└── prompts/
    └── index.ts       # Prompt registry

app/api/mcp/
└── route.ts           # HTTP endpoint
```

**ElevenLabs Configuration:**
- MCP Server URL: `https://your-domain.com/api/mcp`
- Authentication: API key in `x-api-key` header
- Protocol: JSON-RPC 2.0 over HTTP POST

---

**End of Guide**

