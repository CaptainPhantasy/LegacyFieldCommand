# API Endpoints for Natural Language Interface

## Overview
RESTful API endpoints to enable natural language interaction via ElevenLabs frontend. Field techs can use voice commands to interact with the application.

## Base URL
`/api/field`

## Authentication
All endpoints require Supabase session cookie or Bearer token.

## Endpoints

### 1. Job Operations

#### Get Assigned Jobs
`GET /api/field/jobs`
- Returns: List of jobs assigned to authenticated field tech
- Response: `{ jobs: Job[] }`

#### Get Job Details
`GET /api/field/jobs/:jobId`
- Returns: Job details with gates
- Response: `{ job: Job, gates: JobGate[] }`

### 2. Gate Operations

#### Get Gate Status
`GET /api/field/gates/:gateId`
- Returns: Current gate status and requirements
- Response: `{ gate: JobGate, requirements: string[], canComplete: boolean }`

#### Complete Gate
`POST /api/field/gates/:gateId/complete`
- Body: `{ photoData?: string, exceptionReason?: string }`
- Returns: Updated gate status
- Response: `{ gate: JobGate, success: boolean }`

#### Log Exception
`POST /api/field/gates/:gateId/exception`
- Body: `{ reason: string }`
- Returns: Updated gate with exception
- Response: `{ gate: JobGate }`

### 3. Photo Operations

#### Upload Photo
`POST /api/field/photos/upload`
- Body: `FormData` with `file`, `jobId`, `gateId`, `metadata`
- Returns: Photo record
- Response: `{ photo: JobPhoto, storageUrl: string }`

### 4. Natural Language Interface

#### Process Voice Command
`POST /api/field/voice/command`
- Body: `{ command: string, context?: { jobId?: string, gateId?: string } }`
- Returns: Interpreted command and action
- Response: `{ intent: string, action: string, data?: any, response: string }`

Supported commands:
- "Show my jobs" → Returns assigned jobs
- "Start arrival gate" → Opens/activates arrival gate for current job
- "Take arrival photo" → Triggers photo capture
- "Complete arrival gate" → Completes arrival gate if requirements met
- "Log exception: [reason]" → Logs exception for current gate
- "Show gate status" → Returns current gate requirements
- "Next gate" → Moves to next pending gate
- "What's required?" → Lists requirements for current gate

### 5. Context Management

#### Get Current Context
`GET /api/field/context`
- Returns: Current job, gate, and session state
- Response: `{ currentJob?: Job, currentGate?: JobGate, sessionState: object }`

#### Set Context
`POST /api/field/context`
- Body: `{ jobId?: string, gateId?: string }`
- Sets active job/gate for voice commands

## Error Responses
All endpoints return errors in format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Implementation Notes
- Voice command processing uses intent recognition
- Context-aware: commands work relative to current job/gate
- Photo uploads support base64 or multipart/form-data
- All operations validate user permissions (RLS)

