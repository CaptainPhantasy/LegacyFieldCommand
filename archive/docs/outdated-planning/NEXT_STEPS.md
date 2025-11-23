# Next Steps - LLM Implementation Project

## ✅ Completed

### Phase 1.1: LLM Infrastructure ✅
- ✅ LLM Orchestrator (`lib/llm/orchestrator.ts`)
- ✅ Base Agent Interface (`lib/llm/agents/base.ts`)
- ✅ Model Clients (OpenAI, Anthropic) (`lib/llm/models/`)
- ✅ Context Management (`lib/llm/context/`)
- ✅ Utils (prompts, cache, errors) (`lib/llm/utils/`)
- ✅ Resources Manager (`lib/llm/resources/manager.ts`)

### Phase 1.2: MCP Server ✅
- ✅ MCP Tools (15 tools: job, estimate, policy, voice)
- ✅ MCP Resources (4 resource types)
- ✅ MCP Prompts (7 prompt templates)
- ✅ MCP Server Core (`lib/mcp/server.ts`)
- ✅ API Route (`app/api/mcp/route.ts`)

---

## 🎯 Next Steps (In Priority Order)

### Step 1: Create Specialized LLM Agents (HIGH PRIORITY)

**Why:** The orchestrator needs agents to route requests to. Currently only the base interface exists.

**Files to Create:**
```
lib/llm/agents/
├── estimate-agent.ts      # Generate estimates from job data
├── policy-agent.ts         # Parse policies using OCR + LLM
├── voice-agent.ts          # Process voice commands
└── photo-agent.ts          # Analyze photos (optional, Phase 3)
```

**Implementation Pattern:**
```typescript
import { BaseAgent } from './base'
import { callAnthropic } from '../models/anthropic'
import { buildPrompt, ESTIMATE_GENERATION_PROMPT } from '../utils/prompts'
import { ResourcesManager } from '../resources/manager'

export class EstimateAgent extends BaseAgent {
  name = 'Estimate Agent'
  useCase = 'estimate_generation'
  defaultModel = 'claude-haiku-4-20251015' // Cost-effective
  defaultProvider = 'anthropic'

  async process(input: AgentInput, context: SharedContext): Promise<AgentOutput> {
    // 1. Get job data from ResourcesManager
    // 2. Build prompt with job data
    // 3. Call LLM
    // 4. Parse response (JSON line items)
    // 5. Return structured output
  }
}
```

**Success Criteria:**
- [ ] Estimate Agent created and tested
- [ ] Policy Agent created and tested
- [ ] Voice Agent created and tested
- [ ] All agents registered with orchestrator

---

### Step 2: Register Agents with Orchestrator

**File to Create/Modify:**
```
lib/llm/index.ts  # Main entry point that registers all agents
```

**Implementation:**
```typescript
import { getOrchestrator } from './orchestrator'
import { EstimateAgent } from './agents/estimate-agent'
import { PolicyAgent } from './agents/policy-agent'
import { VoiceAgent } from './agents/voice-agent'

// Initialize and register agents
const orchestrator = getOrchestrator()

orchestrator.registerAgent('estimate_generation', new EstimateAgent())
orchestrator.registerAgent('policy_parsing', new PolicyAgent())
orchestrator.registerAgent('voice_command', new VoiceAgent())
orchestrator.registerAgent('voice_interpretation', new VoiceAgent())

export { orchestrator }
```

**Success Criteria:**
- [ ] All agents registered
- [ ] Orchestrator can route to agents
- [ ] Test with sample requests

---

### Step 3: Enhance Stub Endpoints (HIGH PRIORITY)

**Why:** Connect the LLM infrastructure to existing endpoints so they actually use AI.

#### 3.1 Enhance `/api/estimates/generate`

**File:** `app/api/estimates/generate/route.ts`

**Changes:**
- Add `useAI` flag (default: true)
- Try LLM orchestrator first
- Fallback to stub on error
- Keep backward compatibility

**Implementation:**
```typescript
const { jobId, policyId, useAI = true } = body

let lineItems
if (useAI) {
  try {
    const orchestrator = getOrchestrator()
    const result = await orchestrator.process({
      useCase: 'estimate_generation',
      input: `Generate estimate for job ${jobId}`,
      context: { jobId, policyId, userId: user.id },
    })
    // Parse result.response as JSON line items
    lineItems = JSON.parse(result.response)
  } catch (error) {
    console.warn('LLM failed, using stub:', error)
    lineItems = mockLineItems // Existing stub
  }
} else {
  lineItems = mockLineItems
}
```

#### 3.2 Enhance `/api/admin/policies/parse`

**File:** `app/api/admin/policies/parse/route.ts`

**Changes:**
- Add OCR step (if PDF exists)
- Use Policy Agent for parsing
- Fallback to stub

#### 3.3 Enhance `/api/field/voice/command`

**File:** `app/api/field/voice/command/route.ts`

**Changes:**
- Replace pattern matching with Voice Agent
- Keep pattern matching as fallback
- Add `useLLM` flag

#### 3.4 Enhance `/api/communications/voice/interpret`

**File:** `app/api/communications/voice/interpret/route.ts`

**Changes:**
- Use Voice Agent for interpretation
- Fallback to stub

**Success Criteria:**
- [ ] All endpoints enhanced
- [ ] Backward compatible (stubs still work)
- [ ] LLM works when enabled
- [ ] Fallbacks work when LLM fails

---

### Step 4: Test MCP Server Integration

**Tasks:**
1. Test MCP server locally
   ```bash
   curl -X POST http://localhost:8765/api/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```

2. Test tool calls
   ```bash
   curl -X POST http://localhost:8765/api/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"generate_estimate","arguments":{"jobId":"test-id"}}}'
   ```

3. Verify tools call orchestrator correctly
4. Test error handling

**Success Criteria:**
- [ ] MCP server responds correctly
- [ ] Tools are discoverable
- [ ] Tool calls work end-to-end
- [ ] Errors handled gracefully

---

### Step 5: Configure ElevenLabs Voice Agent

**Tasks:**
1. Create ElevenLabs Voice Agent in dashboard
2. Configure MCP server URL: `https://your-domain.com/api/mcp`
3. Set API key authentication
4. Test voice interaction
5. Verify tools are discovered automatically

**Success Criteria:**
- [ ] ElevenLabs agent connects to MCP server
- [ ] Tools are discovered
- [ ] Voice interactions work
- [ ] Responses are voice-optimized

---

### Step 6: Implement Platform API Calls in MCP Tools

**Why:** Currently MCP tools return placeholders. Need to call actual platform APIs.

**Files to Update:**
- `lib/mcp/tools/job-tools.ts` - Call `/api/field/jobs` endpoints
- `lib/mcp/tools/estimate-tools.ts` - Call `/api/estimates` endpoints
- `lib/mcp/tools/policy-tools.ts` - Call `/api/admin/policies` endpoints
- `lib/mcp/tools/voice-tools.ts` - Already calls orchestrator (good)

**Implementation Pattern:**
```typescript
case 'get_job': {
  const { jobId } = args as { jobId: string }
  
  // Call platform API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/field/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${userId}`,
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.statusText}`)
  }
  
  const data = await response.json()
  return { job: data.data.job }
}
```

**Success Criteria:**
- [ ] All tools call real APIs
- [ ] Authentication works
- [ ] Error handling implemented
- [ ] Responses are properly formatted

---

### Step 7: Add Photo Analysis Agent (Phase 3)

**File:** `lib/llm/agents/photo-agent.ts`

**Features:**
- Analyze damage photos
- Categorize photos
- Extract metadata
- Validate compliance

**Integration:**
- Optional enhancement to photo upload flow
- Non-breaking (upload works without analysis)

---

### Step 8: UI Enhancements (Phase 4)

**Tasks:**
- Add "Use AI" toggles in UI forms
- Show AI-generated content
- Display confidence scores
- Add loading states

**Files to Enhance:**
- Estimate generation form
- Policy parsing UI
- Voice command interface

---

## Recommended Implementation Order

1. **Create Specialized Agents** (Step 1) - 2-3 hours
2. **Register Agents** (Step 2) - 30 minutes
3. **Enhance Stub Endpoints** (Step 3) - 3-4 hours
4. **Test MCP Integration** (Step 4) - 1 hour
5. **Configure ElevenLabs** (Step 5) - 1 hour
6. **Implement API Calls** (Step 6) - 2-3 hours
7. **Photo Agent** (Step 7) - 2-3 hours (optional)
8. **UI Enhancements** (Step 8) - 2-3 hours (optional)

**Total Estimated Time:** 12-16 hours for core implementation (Steps 1-6)

---

## Immediate Next Action

**Start with Step 1: Create Specialized LLM Agents**

This is the foundation that enables everything else. Without agents, the orchestrator can't process requests, and the stub endpoints can't use LLM.

**First Agent to Create: Estimate Agent**
- Highest impact (replaces stub estimate generation)
- Clear use case (job data → line items)
- Well-defined input/output

---

## Testing Strategy

### Unit Tests
- Test each agent independently
- Test tool handlers
- Test orchestrator routing

### Integration Tests
- Test endpoint → orchestrator → agent flow
- Test MCP server → orchestrator → agent flow
- Test fallbacks when LLM fails

### End-to-End Tests
- Test voice command → MCP → orchestrator → agent → response
- Test estimate generation with real job data
- Test policy parsing with real PDFs

---

## Success Metrics

### Must Have
- ✅ All existing endpoints still work
- ✅ LLM enhancements work when enabled
- ✅ Fallbacks work when LLM fails
- ✅ MCP server responds to protocol messages
- ✅ ElevenLabs can connect and discover tools

### Should Have
- ✅ Better estimate quality with LLM
- ✅ Better policy parsing with LLM
- ✅ Better voice command understanding
- ✅ Tools call real platform APIs

### Nice to Have
- ✅ Photo analysis working
- ✅ UI enhancements complete
- ✅ Performance optimizations
- ✅ Cost monitoring

---

## Current Status Summary

**Infrastructure:** ✅ 100% Complete
- LLM orchestrator, models, context, utils all ready
- MCP server fully implemented

**Agents:** ⏳ 0% Complete
- Base interface exists
- No specialized agents yet

**Integration:** ⏳ 0% Complete
- Stub endpoints not enhanced yet
- Agents not registered yet

**Next Milestone:** Create first specialized agent (Estimate Agent)

---

**Ready to proceed with Step 1?**

