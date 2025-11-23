/**
 * Context Manager
 * 
 * Manages shared context across agents and requests
 * Stores context in memory (can be extended to use Redis/database)
 */

import type { SharedContext, ContextUpdate } from './types'

export class ContextManager {
  private contexts: Map<string, SharedContext> = new Map()
  private ttl: number = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Get context for a session, or create new if doesn't exist
   */
  async getContext(
    sessionId: string,
    initialContext?: Partial<SharedContext>
  ): Promise<SharedContext> {
    // Check if context exists
    let context = this.contexts.get(sessionId)

    // Create new context if doesn't exist
    if (!context) {
      context = {
        sessionId,
        userId: initialContext?.userId || '',
        userRole: initialContext?.userRole || '',
        jobId: initialContext?.jobId,
        gateId: initialContext?.gateId,
        policyId: initialContext?.policyId,
        jobData: initialContext?.jobData,
        gateData: initialContext?.gateData,
        policyData: initialContext?.policyData,
        conversationHistory: initialContext?.conversationHistory || [],
        platform: initialContext?.platform,
        metadata: initialContext?.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.contexts.set(sessionId, context)
    } else {
      // Merge with initial context if provided
      if (initialContext) {
        context = {
          ...context,
          ...initialContext,
          updatedAt: new Date(),
        }
        this.contexts.set(sessionId, context)
      }
    }

    return context
  }

  /**
   * Update context
   */
  async updateContext(sessionId: string, updates: ContextUpdate): Promise<void> {
    const context = this.contexts.get(sessionId)
    if (!context) {
      // Create new context if doesn't exist
      await this.getContext(sessionId, updates as Partial<SharedContext>)
      return
    }

    // Merge updates
    const updated: SharedContext = {
      ...context,
      ...updates,
      updatedAt: new Date(),
    }

    // Merge conversation history if provided
    if (updates.conversationHistory) {
      updated.conversationHistory = [
        ...(context.conversationHistory || []),
        ...updates.conversationHistory,
      ]
    }

    // Merge metadata
    if (updates.metadata) {
      updated.metadata = {
        ...(context.metadata || {}),
        ...updates.metadata,
      }
    }

    this.contexts.set(sessionId, updated)
  }

  /**
   * Clear context for a session
   */
  async clearContext(sessionId: string): Promise<void> {
    this.contexts.delete(sessionId)
  }

  /**
   * Clean up expired contexts
   */
  cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.contexts.entries())
    for (const [sessionId, context] of entries) {
      const age = now - context.updatedAt.getTime()
      if (age > this.ttl) {
        this.contexts.delete(sessionId)
      }
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.contexts.keys())
  }
}

