/**
 * Error handling and sanitization utilities
 */

import { ApiError } from '@/lib/api/middleware';
import { getUserFriendlyMessage } from './error-messages';

/**
 * Sanitized error result
 */
export interface SanitizedError {
  userMessage: string;
  errorCode: string;
  statusCode: number;
  logMessage: string;
}

/**
 * Sanitize error for client response
 * Logs detailed error server-side, returns generic message to client
 */
export function sanitizeError(
  error: unknown,
  context?: string
): SanitizedError {
  // Log detailed error internally
  const logContext = context ? `[${context}]` : '';
  console.error(`${logContext} Error:`, error);

  // Handle ApiError instances
  if (error instanceof ApiError) {
    const errorMessage = getUserFriendlyMessage(error.code || `ERROR_${error.statusCode}`);
    
    return {
      userMessage: errorMessage.userMessage,
      errorCode: error.code || errorMessage.errorCode,
      statusCode: error.statusCode,
      logMessage: error.message,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();

    // Database/constraint errors
    if (message.includes('violates') || message.includes('constraint')) {
      const errorMessage = getUserFriendlyMessage('CONSTRAINT_VIOLATION');
      return {
        userMessage: errorMessage.userMessage,
        errorCode: errorMessage.errorCode,
        statusCode: errorMessage.statusCode,
        logMessage: error.message,
      };
    }

    // Not found errors
    if (message.includes('not found') || message.includes('does not exist')) {
      const errorMessage = getUserFriendlyMessage('NOT_FOUND');
      return {
        userMessage: errorMessage.userMessage,
        errorCode: errorMessage.errorCode,
        statusCode: errorMessage.statusCode,
        logMessage: error.message,
      };
    }

    // Permission errors
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      const errorMessage = getUserFriendlyMessage('FORBIDDEN');
      return {
        userMessage: errorMessage.userMessage,
        errorCode: errorMessage.errorCode,
        statusCode: errorMessage.statusCode,
        logMessage: error.message,
      };
    }

    // Generic error for unknown Error instances
    const errorMessage = getUserFriendlyMessage('INTERNAL_ERROR');
    return {
      userMessage: errorMessage.userMessage,
      errorCode: errorMessage.errorCode,
      statusCode: errorMessage.statusCode,
      logMessage: error.message,
    };
  }

  // Handle unknown error types
  const errorMessage = getUserFriendlyMessage('UNKNOWN_ERROR');
  return {
    userMessage: errorMessage.userMessage,
    errorCode: errorMessage.errorCode,
    statusCode: errorMessage.statusCode,
    logMessage: String(error),
  };
}

/**
 * Create ApiError from sanitized error
 */
export function createApiErrorFromSanitized(sanitized: SanitizedError): ApiError {
  return new ApiError(
    sanitized.userMessage,
    sanitized.statusCode,
    sanitized.errorCode
  );
}

