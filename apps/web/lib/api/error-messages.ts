/**
 * Centralized error message mapping
 * Maps internal error codes to user-friendly messages
 */

export interface ErrorMessage {
  userMessage: string;
  errorCode: string;
  statusCode: number;
}

/**
 * Error code to message mapping
 */
const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Authentication errors
  UNAUTHORIZED: {
    userMessage: 'You must be logged in to perform this action.',
    errorCode: 'UNAUTHORIZED',
    statusCode: 401,
  },
  FORBIDDEN: {
    userMessage: 'You do not have permission to perform this action.',
    errorCode: 'FORBIDDEN',
    statusCode: 403,
  },
  FORBIDDEN_ADMIN_REQUIRED: {
    userMessage: 'This action requires administrator privileges. Please contact your administrator if you need access.',
    errorCode: 'FORBIDDEN_ADMIN_REQUIRED',
    statusCode: 403,
  },
  FORBIDDEN_ESTIMATOR_REQUIRED: {
    userMessage: 'This action requires estimator privileges. Please contact your administrator to upgrade your account.',
    errorCode: 'FORBIDDEN_ESTIMATOR_REQUIRED',
    statusCode: 403,
  },
  FORBIDDEN_OWNER_REQUIRED: {
    userMessage: 'This action requires owner privileges. Only system owners can perform this action.',
    errorCode: 'FORBIDDEN_OWNER_REQUIRED',
    statusCode: 403,
  },
  PROFILE_NOT_FOUND: {
    userMessage: 'Your user profile could not be found. Please contact support.',
    errorCode: 'PROFILE_NOT_FOUND',
    statusCode: 404,
  },

  // Validation errors
  VALIDATION_ERROR: {
    userMessage: 'The provided data is invalid. Please check your input and try again.',
    errorCode: 'VALIDATION_ERROR',
    statusCode: 400,
  },
  INVALID_JSON: {
    userMessage: 'The request data is malformed. Please try again.',
    errorCode: 'INVALID_JSON',
    statusCode: 400,
  },

  // Resource errors
  NOT_FOUND: {
    userMessage: 'The requested resource could not be found.',
    errorCode: 'NOT_FOUND',
    statusCode: 404,
  },
  JOB_NOT_FOUND: {
    userMessage: 'The requested job could not be found.',
    errorCode: 'JOB_NOT_FOUND',
    statusCode: 404,
  },
  USER_NOT_FOUND: {
    userMessage: 'The requested user could not be found.',
    errorCode: 'USER_NOT_FOUND',
    statusCode: 404,
  },

  // File upload errors
  FILE_TOO_LARGE: {
    userMessage: 'The file is too large. Please use a smaller file.',
    errorCode: 'FILE_TOO_LARGE',
    statusCode: 400,
  },
  INVALID_FILE_TYPE: {
    userMessage: 'The file type is not supported. Please use a different file format.',
    errorCode: 'INVALID_FILE_TYPE',
    statusCode: 400,
  },
  UPLOAD_FAILED: {
    userMessage: 'The file upload failed. Please try again.',
    errorCode: 'UPLOAD_FAILED',
    statusCode: 500,
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    userMessage: 'Too many requests. Please wait a moment and try again.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
  },

  // Database errors
  DATABASE_ERROR: {
    userMessage: 'A database error occurred. Please try again later.',
    errorCode: 'DATABASE_ERROR',
    statusCode: 500,
  },
  CONSTRAINT_VIOLATION: {
    userMessage: 'The operation violates a data constraint. Please check your input.',
    errorCode: 'CONSTRAINT_VIOLATION',
    statusCode: 400,
  },

  // Generic errors
  INTERNAL_ERROR: {
    userMessage: 'An unexpected error occurred. Please try again later.',
    errorCode: 'INTERNAL_ERROR',
    statusCode: 500,
  },
  UNKNOWN_ERROR: {
    userMessage: 'An unknown error occurred. Please contact support if this persists.',
    errorCode: 'UNKNOWN_ERROR',
    statusCode: 500,
  },
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(errorCode: string): ErrorMessage {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Check if error code exists
 */
export function hasErrorCode(errorCode: string): boolean {
  return errorCode in ERROR_MESSAGES;
}

