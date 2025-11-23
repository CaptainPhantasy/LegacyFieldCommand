/**
 * Monitoring Dashboard Component
 */

'use client';

import { useMonitoringDashboard, useMissingGates, useStaleJobs } from '@/hooks/useMonitoring';
import Link from 'next/link';

export function MonitoringDashboard() {
  const { data: dashboard, isLoading: dashboardLoading } = useMonitoringDashboard();
  const { data: missingGates, isLoading: gatesLoading } = useMissingGates();
  const { data: staleJobs, isLoading: jobsLoading } = useStaleJobs();

  if (dashboardLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading monitoring data...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading monitoring data.
      </div>
    );
  }

  const { summary, jobsByStatus } = dashboard;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Alerts"
          value={summary.activeAlerts}
          subtitle="Requires attention"
          color="var(--error)"
        />
        <MetricCard
          title="Stale Jobs"
          value={summary.staleJobs}
          subtitle="No update in 7+ days"
          color="var(--error)"
        />
        <MetricCard
          title="Compliance Rate"
          value={`${summary.complianceRate.toFixed(1)}%`}
          subtitle={`${summary.completedGates} of ${summary.totalGates} gates complete`}
          color="var(--success)"
        />
        <MetricCard
          title="Total Gates"
          value={summary.totalGates}
          subtitle={`${summary.completedGates} completed`}
          color="var(--accent)"
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

      {/* Missing Gates */}
      {!gatesLoading && missingGates && missingGates.length > 0 && (
        <div className="glass-basic card-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Missing Gates
            </h2>
            <Link
              href="/monitoring/gates"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {missingGates.slice(0, 5).map((gate: any) => (
              <div
                key={gate.id}
                className="p-3 rounded-lg transition-colors hover:bg-[var(--hover-bg-subtle)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {gate.job_title || 'Unknown Job'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Missing: {gate.stage_name}
                    </p>
                  </div>
                  {gate.job_id && (
                    <Link
                      href={`/field/jobs/${gate.job_id}`}
                      className="text-xs font-medium transition-colors hover:opacity-80"
                      style={{ color: 'var(--accent)' }}
                    >
                      View Job →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stale Jobs */}
      {!jobsLoading && staleJobs && staleJobs.length > 0 && (
        <div className="glass-basic card-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Stale Jobs
            </h2>
            <Link
              href="/monitoring/jobs"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {staleJobs.slice(0, 5).map((job: any) => (
              <div
                key={job.id}
                className="p-3 rounded-lg transition-colors hover:bg-[var(--hover-bg-subtle)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {job.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Last updated: {job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <Link
                    href={`/field/jobs/${job.id}`}
                    className="text-xs font-medium transition-colors hover:opacity-80"
                    style={{ color: 'var(--accent)' }}
                  >
                    View Job →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/monitoring/compliance"
          className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Compliance
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            View detailed compliance metrics
          </p>
        </Link>
        <Link
          href="/alerts"
          className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Alerts
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            View all system alerts
          </p>
        </Link>
        <Link
          href="/monitoring/gates"
          className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Missing Gates
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            View all missing gates
          </p>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle: string; color?: string }) {
  return (
    <div className="glass-basic card-glass p-6">
      <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      <div className="text-3xl font-bold mb-2" style={{ color: color || 'var(--text-primary)' }}>
        {value}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {subtitle}
      </p>
    </div>
  );
}

