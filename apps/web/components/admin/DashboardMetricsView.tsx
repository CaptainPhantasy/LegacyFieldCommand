/**
 * Dashboard Metrics View Component
 * Displays comprehensive statistics
 */

'use client';

import { useDashboardMetrics } from '@/hooks/useAdmin';
import Link from 'next/link';

export function DashboardMetricsView() {
  const { data, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading metrics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading metrics. Please try again.
      </div>
    );
  }

  const { summary, jobsByStatus, gateStats, userCounts, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Jobs"
          value={summary.totalJobs}
          subtitle={`${summary.assignedJobs} assigned, ${summary.unassignedJobs} unassigned`}
        />
        <MetricCard
          title="Total Users"
          value={summary.totalUsers}
          subtitle={`${userCounts.field_tech || 0} field techs, ${userCounts.admin || 0} admins`}
        />
        <MetricCard
          title="Total Gates"
          value={summary.totalGates}
          subtitle={`${gateStats.complete || 0} complete, ${gateStats.pending || 0} pending`}
        />
        <MetricCard
          title="Active Jobs"
          value={jobsByStatus.active_work || 0}
          subtitle={`${jobsByStatus.ready_to_invoice || 0} ready to invoice`}
        />
      </div>

      {/* Jobs by Status */}
      <div className="glass-basic card-glass p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Jobs by Status
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(jobsByStatus).map(([status, count]) => (
            <div key={status} className="p-4 rounded-lg" style={{ background: 'var(--hover-bg-subtle)' }}>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gate Statistics */}
      <div className="glass-basic card-glass p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Gate Statistics
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(gateStats).map(([status, count]) => (
            <div key={status} className="p-4 rounded-lg" style={{ background: 'var(--hover-bg-subtle)' }}>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Counts by Role */}
      <div className="glass-basic card-glass p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Users by Role
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(userCounts).map(([role, count]) => (
            <div key={role} className="p-4 rounded-lg" style={{ background: 'var(--hover-bg-subtle)' }}>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.jobsCreated.length > 0 && (
        <div className="glass-basic card-glass p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recent Activity (Last 7 Days)
          </h2>
          <div className="space-y-2">
            {recentActivity.jobsCreated.map((job) => (
              <div
                key={job.id}
                className="p-3 rounded-lg transition-colors hover:bg-[var(--hover-bg-subtle)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {job.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Created {new Date(job.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/field/jobs/${job.id}`}
                    className="text-xs font-medium transition-colors hover:opacity-80"
                    style={{ color: 'var(--accent)' }}
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
  return (
    <div className="glass-basic card-glass p-6">
      <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      <div className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {subtitle}
      </p>
    </div>
  );
}

