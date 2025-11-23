/**
 * Estimates List Component
 */

'use client';

import { useState } from 'react';
import { useEstimates } from '@/hooks/useEstimates';
import Link from 'next/link';

export function EstimatesList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = useEstimates({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading estimates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading estimates. Please try again.
      </div>
    );
  }

  const estimates = data?.estimates || [];
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
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Estimates Table */}
      <div className="glass-basic card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Job
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total Amount
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Policy
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
              {estimates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No estimates found. Generate one to get started.
                  </td>
                </tr>
              ) : (
                estimates.map((estimate) => (
                  <tr
                    key={estimate.id}
                    className="border-b transition-colors hover:bg-[var(--hover-bg-subtle)]"
                    style={{ borderColor: 'var(--glass-border)' }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {estimate.jobs ? (
                        <Link
                          href={`/field/jobs/${estimate.jobs.id}`}
                          className="hover:opacity-80"
                          style={{ color: 'var(--accent)' }}
                        >
                          {estimate.jobs.title}
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
                            estimate.status === 'approved'
                              ? 'var(--success)'
                              : estimate.status === 'rejected'
                              ? 'var(--error)'
                              : estimate.status === 'pending'
                              ? '#f59e0b'
                              : 'var(--accent)',
                          color: '#ffffff',
                        }}
                      >
                        {estimate.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ${estimate.total_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {estimate.policies?.policy_number || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(estimate.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/estimates/${estimate.id}`}
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} estimates
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

