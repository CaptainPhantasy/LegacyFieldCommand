# ElevenLabs Voice Agents Integration Guide

## Overview

ElevenLabs Voice Agents is a conversational AI platform that enables real-time voice interactions with AI agents. This document outlines the key components, API structure, and integration requirements for incorporating ElevenLabs Voice Agents into the platform.

## Key Components

### 1. **Agents Platform**
The core of ElevenLabs Voice Agents is the Agents API, which allows you to create, manage, and interact with conversational AI agents.

### 2. **Knowledge Base**
A RAG (Retrieval Augmented Generation) system that allows agents to access custom knowledge from documents, URLs, or text.

### 3. **Tools**
Custom functions that agents can call to perform actions or retrieve data.

### 4. **Webhooks**
Event notifications for agent interactions, conversation events, and system updates.

### 5. **Conversations**
Management of ongoing conversations between users and agents.

## API Authentication

**Header**: `xi-api-key`
- This is the standard ElevenLabs API key (starts with `sk_`)
- Required for all API requests
- Note: The user mentioned having both `ELEVENLABS_API_KEY` and `ELEVENLABS_KEY_ID` - we need to clarify which is used for Voice Agents

## Core API Endpoints

### Agents Management

#### Create Agent
**Endpoint**: `POST /v1/convai/agents/create`

**Request Structure**:
```json
{
  "conversation_config": {
    "asr": {},              // Automatic Speech Recognition config
    "turn": {},             // Turn detection config
    "tts": {},              // Text-to-Speech config (11 properties)
    "conversation": {},     // Conversational events config
    "language_presets": {}, // Language presets
    "vad": {},             // Voice Activity Detection config
    "agent": {}            // Agent-specific config (5 properties)
  },
  "platform_settings": {},  // Optional: Platform-specific settings (10 properties)
  "workflow": {},           // Optional: Conversation workflow (2 properties)
  "name": "string",         // Optional: Agent name
  "tags": ["string"]        // Optional: Tags for organization
}
```

**Response**:
```json
{
  "agent_id": "J3Pbu5gP6NNKBscdCdwB"
}
```

#### Other Agent Endpoints
- `GET /v1/convai/agents/{agent_id}` - Get agent details
- `GET /v1/convai/agents` - List all agents
- `PATCH /v1/convai/agents/{agent_id}` - Update agent
- `DELETE /v1/convai/agents/{agent_id}` - Delete agent
- `POST /v1/convai/agents/{agent_id}/duplicate` - Duplicate agent
- `GET /v1/convai/agents/{agent_id}/link` - Get agent link
- `POST /v1/convai/agents/{agent_id}/simulate-conversation` - Test conversation
- `POST /v1/convai/agents/{agent_id}/simulate-conversation-stream` - Stream test conversation
- `POST /v1/convai/agents/{agent_id}/calculate` - Calculate expected LLM usage

### Knowledge Base Management

#### Create Knowledge Base Document
- `POST /v1/convai/knowledge-base/create-from-url` - From URL
- `POST /v1/convai/knowledge-base/create-from-text` - From text
- `POST /v1/convai/knowledge-base/create-from-file` - From file

#### Manage Knowledge Base
- `GET /v1/convai/knowledge-base` - List documents
- `GET /v1/convai/knowledge-base/{document_id}` - Get document
- `PATCH /v1/convai/knowledge-base/{document_id}` - Update document
- `DELETE /v1/convai/knowledge-base/{document_id}` - Delete document
- `POST /v1/convai/knowledge-base/{document_id}/compute-rag-index` - Compute RAG index
- `GET /v1/convai/knowledge-base/{document_id}/rag-indexes` - Get RAG indexes
- `GET /v1/convai/knowledge-base/{document_id}/rag-index-overview` - Get RAG overview
- `DELETE /v1/convai/knowledge-base/{document_id}/rag-indexes/{index_id}` - Delete RAG index
- `GET /v1/convai/knowledge-base/{document_id}/agents` - Get dependent agents
- `GET /v1/convai/knowledge-base/{document_id}/content` - Get document content
- `GET /v1/convai/knowledge-base/{document_id}/chunks/{chunk_id}` - Get document chunk
- `GET /v1/convai/knowledge-base/size` - Get knowledge base size

### Conversations

Endpoints for managing ongoing conversations between users and agents.

### Tools

Custom functions that agents can call to perform actions or retrieve data from your platform.

### Webhooks

Event notifications for:
- Agent interactions
- Conversation events
- System updates

## Integration Architecture

### Recommended Integration Pattern

```
User Voice Input
    ↓
ElevenLabs Voice Agent (handles STT + TTS)
    ↓
Webhook to Platform API
    ↓
Platform LLM Orchestrator
    ↓
Specialized Agents (Job Agent, Policy Agent, etc.)
    ↓
Platform Resources (Database, APIs)
    ↓
Response back through ElevenLabs Agent
    ↓
User Voice Output
```

### Key Integration Points

1. **Webhook Configuration**
   - Configure webhooks in ElevenLabs to receive conversation events
   - Platform endpoint: `/api/communications/voice/elevenlabs/webhook`
   - Handle: conversation_start, user_message, agent_response, conversation_end

2. **Knowledge Base Integration**
   - Upload platform documentation, policies, templates to ElevenLabs Knowledge Base
   - Enable RAG for agents to access platform-specific information
   - Sync knowledge base when platform data changes

3. **Tool Integration**
   - Create custom tools in ElevenLabs that call platform APIs
   - Tools for: job lookup, policy retrieval, estimate generation, etc.
   - Tools should use platform authentication (Supabase tokens)

4. **LLM Integration**
   - ElevenLabs agents can use custom LLM providers
   - Can integrate with our LLM orchestrator via webhooks
   - Or use ElevenLabs' built-in LLM with custom knowledge base

## Environment Variables

Based on the user's setup, we have:
- `ELEVENLABS_API_KEY` - Standard API key (starts with `sk_`)
- `ELEVENLABS_KEY_ID` - Purpose unclear, needs clarification

**Required for Voice Agents**:
- `ELEVENLABS_API_KEY` - Used as `xi-api-key` header

## SDK Installation

### Node.js
```bash
npm install @elevenlabs/elevenlabs-js
```

### Python
```bash
pip install elevenlabs
```

## Implementation Considerations

### 1. **Agent Configuration**
- **Voice Selection**: Choose appropriate voice for field operations
- **Language**: Configure for English (US) with field-specific terminology
- **Response Style**: Professional, concise, action-oriented
- **Knowledge Base**: Link to platform documentation and policies

### 2. **Webhook Security**
- Verify webhook signatures from ElevenLabs
- Use HTTPS endpoints
- Implement rate limiting
- Validate request payloads

### 3. **Error Handling**
- Graceful fallbacks when ElevenLabs is unavailable
- Retry logic for webhook failures
- User-friendly error messages
- Logging for debugging

### 4. **Cost Management**
- Monitor API usage
- Implement usage limits per user/role
- Cache responses where appropriate
- Use knowledge base to reduce LLM calls

### 5. **Testing**
- Use `simulate-conversation` endpoint for testing
- Test webhook handling
- Verify knowledge base retrieval
- Test tool integrations

## Integration with Platform LLM Orchestrator

### Option 1: ElevenLabs as Voice Interface Only
- ElevenLabs handles STT/TTS
- Webhooks forward to platform LLM orchestrator
- Platform orchestrator routes to specialized agents
- Response flows back through ElevenLabs

### Option 2: ElevenLabs with Custom LLM
- ElevenLabs handles STT/TTS + LLM
- Custom LLM endpoint points to platform orchestrator
- Knowledge base provides context
- Tools provide platform access

### Recommended: Hybrid Approach
- Use ElevenLabs for voice I/O
- Use platform orchestrator for complex reasoning
- Use ElevenLabs knowledge base for quick lookups
- Use platform tools for data access

## Next Steps

1. **Clarify API Keys**
   - Determine purpose of `ELEVENLABS_KEY_ID`
   - Verify `ELEVENLABS_API_KEY` format and permissions

2. **Create Test Agent**
   - Set up basic agent with minimal config
   - Test voice input/output
   - Verify webhook connectivity

3. **Implement Webhook Handler**
   - Create `/api/communications/voice/elevenlabs/webhook` endpoint
   - Handle conversation events
   - Integrate with LLM orchestrator

4. **Set Up Knowledge Base**
   - Upload platform documentation
   - Create RAG indexes
   - Link to agents

5. **Create Custom Tools**
   - Job lookup tool
   - Policy retrieval tool
   - Estimate generation tool
   - Other platform-specific tools

6. **Integration Testing**
   - End-to-end voice conversation flow
   - Test with real field scenarios
   - Verify accuracy and latency

## Resources

- [ElevenLabs API Documentation](https://elevenlabs.io/docs/api-reference)
- [ElevenLabs Developer Portal](https://elevenlabs.io/app/developers)
- [ElevenLabs JavaScript SDK](https://github.com/elevenlabs/elevenlabs-js)
- [ElevenLabs Python SDK](https://github.com/elevenlabs/elevenlabs-python)
- [ElevenLabs Discord Community](https://discord.gg/elevenlabs)

## Notes

- Voice Agents is a separate platform from basic TTS/STT
- Requires different API endpoints (`/v1/convai/*`)
- Supports real-time bidirectional voice conversations
- Can integrate with custom LLMs and knowledge bases
- Webhooks are essential for platform integration
- Knowledge base enables RAG for context-aware responses

