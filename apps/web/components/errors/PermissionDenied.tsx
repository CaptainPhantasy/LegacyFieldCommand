/**
 * Permission Denied Component
 * Displays a user-friendly message when access is denied
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPermissionDenialMessage, getRoleDisplayName, type UserRole } from '@/lib/permissions';
import { ShieldX, ArrowLeft } from 'lucide-react';

interface PermissionDeniedProps {
  userRole: UserRole;
  requiredRole: UserRole | UserRole[];
  featureName?: string;
  onBack?: () => void;
}

export function PermissionDenied({
  userRole,
  requiredRole,
  featureName = 'this feature',
  onBack,
}: PermissionDeniedProps) {
  const denial = getPermissionDenialMessage(userRole, requiredRole);

  return (
    <div className="app-shell">
      <div className="app-shell-inner py-12">
        <div className="w-full max-w-4xl">
          <div className="glass-basic card-glass p-8 text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className="rounded-full p-4"
                style={{
                  background: 'var(--error)',
                  color: '#ffffff',
                }}
              >
                <ShieldX size={48} />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Access Denied
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You don't have permission to access {featureName}
              </p>
            </div>

            {/* Message */}
            <div className="p-4 rounded-lg text-left" style={{ background: 'var(--hover-bg-subtle)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                <strong>Current Role:</strong> {getRoleDisplayName(userRole)}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <strong>Required Role:</strong>{' '}
                {Array.isArray(requiredRole)
                  ? requiredRole.map((r) => getRoleDisplayName(r)).join(' or ')
                  : getRoleDisplayName(requiredRole)}
              </p>
            </div>

            {/* Suggestion */}
            {denial.suggestion && (
              <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--glass-border)', background: 'var(--hover-bg-subtle)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {denial.suggestion}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              {onBack ? (
                <Button onClick={onBack} variant="outline">
                  <ArrowLeft size={16} className="mr-2" />
                  Go Back
                </Button>
              ) : (
                <Link href="/">
                  <Button variant="outline">
                    <ArrowLeft size={16} className="mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              )}
              <Link href="/admin/users">
                <Button variant="default" style={{ display: ['admin', 'owner'].includes(userRole) ? 'inline-flex' : 'none' }}>
                  Manage Users
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

