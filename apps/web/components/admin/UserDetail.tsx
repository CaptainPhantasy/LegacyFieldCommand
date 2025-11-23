/**
 * User Detail Component
 * Displays user information and allows editing
 */

'use client';

import { useState } from 'react';
import { useUser, useUpdateUser, type UserRole } from '@/hooks/useAdmin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'field_tech', label: 'Field Tech' },
  { value: 'lead_tech', label: 'Lead Tech' },
  { value: 'estimator', label: 'Estimator' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
  { value: 'program_admin', label: 'Program Admin' },
];

interface UserDetailProps {
  userId: string;
}

export function UserDetail({ userId }: UserDetailProps) {
  const { data, isLoading, error } = useUser(userId);
  const updateUser = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'field_tech' as UserRole,
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when user loads
  if (data && !isEditing && formData.email === '') {
    setFormData({
      email: data.email,
      full_name: data.full_name || '',
      role: data.role,
    });
  }

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      await updateUser.mutateAsync({
        userId,
        data: {
          email: formData.email,
          full_name: formData.full_name || null,
          role: formData.role,
        },
      });
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading user...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading user. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* User Info Card */}
      <div className="glass-basic card-glass p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            User Information
          </h2>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {saveError && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-500">{saveError}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Email
            </label>
            {isEditing ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            ) : (
              <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>
                {data.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Full Name
            </label>
            {isEditing ? (
              <Input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            ) : (
              <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>
                {data.full_name || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Role
            </label>
            {isEditing ? (
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="h-11 w-full rounded-lg border border-[var(--glass-border)] px-3 text-sm bg-[var(--input-bg)] text-[var(--text-primary)]"
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm py-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                  }}
                >
                  {roleOptions.find((r) => r.value === data.role)?.label || data.role}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Created At
            </label>
            <p className="text-sm py-2" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(data.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  email: data.email,
                  full_name: data.full_name || '',
                  role: data.role,
                });
                setSaveError(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* User's Jobs */}
      <div className="glass-basic card-glass p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Assigned Jobs
        </h2>
        <Link
          href={`/admin/users/${userId}/jobs`}
          className="text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--accent)' }}
        >
          View all jobs for this user →
        </Link>
      </div>
    </div>
  );
}

