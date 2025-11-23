/**
 * Error Handling Utilities
 * 
 * Standardized error handling for LLM operations
 */

export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'LLMError'
  }
}

export class LLMAPIError extends LLMError {
  constructor(
    message: string,
    public provider: 'openai' | 'anthropic',
    public originalError?: unknown
  ) {
    super(message, 'LLM_API_ERROR', 502, { provider, originalError })
    this.name = 'LLMAPIError'
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(message: string = 'LLM request timed out') {
    super(message, 'LLM_TIMEOUT', 504)
    this.name = 'LLMTimeoutError'
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 'LLM_RATE_LIMIT', 429, { retryAfter })
    this.name = 'LLMRateLimitError'
  }
}

export class LLMValidationError extends LLMError {
  constructor(message: string, public validationErrors?: unknown) {
    super(message, 'LLM_VALIDATION', 400, { validationErrors })
    this.name = 'LLMValidationError'
  }
}

/**
 * Handle LLM errors gracefully
 */
export function handleLLMError(error: unknown): LLMError {
  if (error instanceof LLMError) {
    return error
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return new LLMTimeoutError(error.message)
    }

    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return new LLMRateLimitError(error.message)
    }

    if (error.message.includes('API key') || error.message.includes('authentication')) {
      return new LLMError(
        'LLM API authentication failed',
        'LLM_AUTH_ERROR',
        401,
        { originalError: error.message }
      )
    }

    return new LLMError(
      error.message || 'Unknown LLM error',
      'LLM_UNKNOWN_ERROR',
      500,
      { originalError: error }
    )
  }

  return new LLMError(
    'Unknown error occurred',
    'LLM_UNKNOWN_ERROR',
    500,
    { originalError: error }
  )
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof LLMRateLimitError) {
    return true
  }

  if (error instanceof LLMTimeoutError) {
    return true
  }

  if (error instanceof LLMAPIError) {
    // Network errors are retryable
    return true
  }

  return false
}

/**
 * Get retry delay in milliseconds
 */
export function getRetryDelay(error: unknown, attempt: number): number {
  if (error instanceof LLMRateLimitError && error.retryAfter) {
    return error.retryAfter * 1000
  }

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attempt - 1), 16000)
}

