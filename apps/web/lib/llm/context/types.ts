/**
 * Shared Context Types
 * 
 * Context shared across agents in multi-agent workflows
 */

export interface SharedContext {
  // Session
  sessionId: string
  userId: string
  userRole: string

  // Job context
  jobId?: string
  jobData?: {
    id: string
    title: string
    status: string
    address_line_1?: string
    lead_tech_id?: string
  }

  // Gate context
  gateId?: string
  gateData?: {
    id: string
    stage_name: string
    status: string
    metadata?: Record<string, unknown>
  }

  // Policy context
  policyId?: string
  policyData?: {
    id: string
    policy_number?: string
    carrier_name?: string
    coverage_limits?: Record<string, unknown>
  }

  // Conversation history
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp?: Date
  }>

  // Platform context
  platform?: 'web' | 'mobile' | '11labs' | 'alternative'

  // Additional metadata
  metadata?: Record<string, unknown>

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface ContextUpdate {
  jobId?: string
  gateId?: string
  policyId?: string
  conversationHistory?: SharedContext['conversationHistory']
  metadata?: Record<string, unknown>
}

