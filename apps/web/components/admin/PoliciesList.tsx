/**
 * Policies List Component
 */

'use client';

import { useState } from 'react';
import { usePolicies } from '@/hooks/usePolicies';
import Link from 'next/link';

export function PoliciesList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = usePolicies({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading policies...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading policies. Please try again.
      </div>
    );
  }

  const policies = data?.policies || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-basic card-glass p-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border border-[var(--glass-border)] px-3 text-sm bg-[var(--input-bg)] text-[var(--text-primary)]"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="parsed">Parsed</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Policies Table */}
      <div className="glass-basic card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Policy Number
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Carrier
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Job
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Status
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
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No policies found. Upload one to get started.
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr
                    key={policy.id}
                    className="border-b transition-colors hover:bg-[var(--hover-bg-subtle)]"
                    style={{ borderColor: 'var(--glass-border)' }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {policy.policy_number || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {policy.carrier_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {policy.jobs?.title ? (
                        <Link
                          href={`/field/jobs/${policy.jobs.id}`}
                          className="hover:opacity-80"
                          style={{ color: 'var(--accent)' }}
                        >
                          {policy.jobs.title}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                        style={{
                          background:
                            policy.status === 'parsed'
                              ? 'var(--success)'
                              : policy.status === 'error'
                              ? 'var(--error)'
                              : 'var(--accent)',
                          color: '#ffffff',
                        }}
                      >
                        {policy.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(policy.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/policies/${policy.id}`}
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} policies
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm rounded-lg border transition-colors disabled:opacity-50"
                style={{
                  borderColor: 'var(--glass-border)',
                  color: pagination.page === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm rounded-lg border transition-colors disabled:opacity-50"
                style={{
                  borderColor: 'var(--glass-border)',
                  color: pagination.page === pagination.totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

