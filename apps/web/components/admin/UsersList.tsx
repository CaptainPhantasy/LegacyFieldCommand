/**
 * Users List Component
 * Displays users with filtering, search, and pagination
 */

'use client';

import { useState } from 'react';
import { useUsers, useCreateUser, type UserRole } from '@/hooks/useAdmin';
import { Modal } from '@/components/ui/modal';
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

export function UsersList() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'field_tech' as UserRole,
  });

  const { data, isLoading, error } = useUsers({
    page,
    limit: 20,
    role: roleFilter || undefined,
    search: search || undefined,
  });

  const createUser = useCreateUser();

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      alert('Email and password are required');
      return;
    }

    try {
      await createUser.mutateAsync(newUser);
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'field_tech' });
    } catch (error: any) {
      alert(error.message || 'Failed to create user');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading users. Please try again.
      </div>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-basic card-glass p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | '');
            setPage(1);
          }}
          className="h-11 rounded-lg border border-[var(--glass-border)] px-3 text-sm bg-[var(--input-bg)] text-[var(--text-primary)]"
        >
          <option value="">All Roles</option>
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="glass-basic card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Created
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b transition-colors hover:bg-[var(--hover-bg-subtle)]"
                    style={{ borderColor: 'var(--glass-border)' }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {user.full_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                        style={{
                          background: 'var(--accent)',
                          color: '#ffffff',
                        }}
                      >
                        {roleOptions.find((r) => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-sm font-medium transition-colors hover:opacity-80"
                        style={{ color: 'var(--accent)' }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        onSubmit={handleCreateUser}
        submitLabel="Create User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Email *
            </label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Password *
            </label>
            <Input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Full Name
            </label>
            <Input
              type="text"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Role *
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
              className="h-11 w-full rounded-lg border border-[var(--glass-border)] px-3 text-sm bg-[var(--input-bg)] text-[var(--text-primary)]"
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

