# Environment Variables Setup Instructions

## Quick Setup

**Add these lines to `apps/web/.env.local`:**

```bash
# LLM API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# ElevenLabs API Key (for voice agents - Phase 3)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# LLM Feature Flags
LLM_ENABLED=true
LLM_OPENAI_ENABLED=true
LLM_ANTHROPIC_ENABLED=true
```

## Verify Keys Work

Once added, test the keys by visiting:
```
GET /api/llm/test
```

Or in browser (while logged in as admin):
```
http://localhost:8765/api/llm/test
```

This will test:
- ✅ OpenAI connection
- ✅ Anthropic connection  
- ✅ ElevenLabs key format

## Next Steps

After adding keys and verifying they work:
1. ✅ Keys added to .env.local
2. ✅ Test endpoint confirms keys work
3. 🔄 Start Phase 1: LLM Infrastructure

