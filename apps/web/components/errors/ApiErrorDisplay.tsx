/**
 * API Error Display Component
 * Shows user-friendly error messages from API responses
 */

'use client';

import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { getPermissionDenialMessage, type UserRole } from '@/lib/permissions';

interface ApiErrorDisplayProps {
  error: {
    error?: boolean;
    message?: string;
    code?: string;
    statusCode?: number;
  };
  userRole?: UserRole;
  onDismiss?: () => void;
}

export function ApiErrorDisplay({ error, userRole, onDismiss }: ApiErrorDisplayProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Handle permission errors with role-specific messages
  if (error.statusCode === 403 || error.code === 'FORBIDDEN') {
    // Try to extract role information from error message
    let denialMessage = error.message || 'You do not have permission to perform this action.';
    
    // If we have user role, provide more specific message
    if (userRole && error.message?.includes('Admin access required')) {
      const denial = getPermissionDenialMessage(userRole, ['admin', 'owner']);
      denialMessage = denial.message;
    }

    return (
      <div className="p-4 rounded-lg border mb-4 relative" style={{ borderColor: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        )}
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--error)' }} />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--error)' }}>
              Access Denied
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {denialMessage}
            </p>
            {userRole && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Your current role: {userRole.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle unauthorized errors
  if (error.statusCode === 401 || error.code === 'UNAUTHORIZED') {
    return (
      <div className="p-4 rounded-lg border mb-4 relative" style={{ borderColor: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        )}
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--error)' }} />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--error)' }}>
              Authentication Required
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {error.message || 'You must be logged in to perform this action.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle other errors
  return (
    <div className="p-4 rounded-lg border mb-4 relative" style={{ borderColor: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--error)' }} />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--error)' }}>
            {error.code || 'Error'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
      </div>
    </div>
  );
}

