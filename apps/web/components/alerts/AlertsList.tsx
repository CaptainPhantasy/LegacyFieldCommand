/**
 * Alerts List Component
 */

'use client';

import { useState } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import Link from 'next/link';

const severityColors: Record<string, string> = {
  low: 'var(--accent)',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

export function AlertsList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  const { data, isLoading, error } = useAlerts({
    page,
    limit: 20,
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading alerts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading alerts. Please try again.
      </div>
    );
  }

  const alerts = data?.alerts || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-basic card-glass p-4 flex flex-col sm:flex-row gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border border-[var(--glass-border)] px-3 text-sm bg-[var(--input-bg)] text-[var(--text-primary)]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border border-[var(--glass-border)] px-3 text-sm bg-[var(--input-bg)] text-[var(--text-primary)]"
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="glass-basic card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Title
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
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No alerts found.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-b transition-colors hover:bg-[var(--hover-bg-subtle)]"
                    style={{ borderColor: 'var(--glass-border)' }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                        style={{
                          background: severityColors[alert.severity] || 'var(--accent)',
                          color: '#ffffff',
                        }}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {alert.title}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {alert.message.substring(0, 60)}...
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {alert.jobs ? (
                        <Link
                          href={`/field/jobs/${alert.jobs.id}`}
                          className="hover:opacity-80"
                          style={{ color: 'var(--accent)' }}
                        >
                          {alert.jobs.title}
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
                            alert.status === 'active'
                              ? 'var(--error)'
                              : alert.status === 'resolved'
                              ? 'var(--success)'
                              : 'var(--accent)',
                          color: '#ffffff',
                        }}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(alert.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/alerts/${alert.id}`}
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} alerts
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

