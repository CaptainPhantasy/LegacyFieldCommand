/**
 * Alert Detail Component
 */

'use client';

import { useState } from 'react';
import { useAlert, useAcknowledgeAlert } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AlertDetailProps {
  alertId: string;
}

const severityColors: Record<string, string> = {
  low: 'var(--accent)',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

export function AlertDetail({ alertId }: AlertDetailProps) {
  const { data, isLoading, error } = useAlert(alertId);
  const acknowledgeAlert = useAcknowledgeAlert();
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const handleAcknowledge = async () => {
    if (!data || data.status !== 'active') return;
    setIsAcknowledging(true);
    try {
      await acknowledgeAlert.mutateAsync(alertId);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading alert...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading alert. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Alert Info */}
      <div className="glass-basic card-glass p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {data.title}
          </h2>
          <div className="flex gap-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: severityColors[data.severity] || 'var(--accent)',
                color: '#ffffff',
              }}
            >
              {data.severity}
            </span>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background:
                  data.status === 'active'
                    ? 'var(--error)'
                    : data.status === 'resolved'
                    ? 'var(--success)'
                    : 'var(--accent)',
                color: '#ffffff',
              }}
            >
              {data.status}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Message
          </label>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {data.message}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Alert Type
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {data.alert_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Created
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {new Date(data.created_at).toLocaleString()}
            </p>
          </div>
          {data.jobs && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Related Job
              </label>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <Link
                  href={`/field/jobs/${data.jobs.id}`}
                  className="hover:opacity-80"
                  style={{ color: 'var(--accent)' }}
                >
                  {data.jobs.title}
                </Link>
              </p>
            </div>
          )}
          {data.acknowledged_at && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Acknowledged
              </label>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {new Date(data.acknowledged_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {data.status === 'active' && (
          <div className="pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <Button onClick={handleAcknowledge} disabled={isAcknowledging}>
              {isAcknowledging ? 'Acknowledging...' : 'Acknowledge Alert'}
            </Button>
          </div>
        )}

        {data.details && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Additional Details
            </label>
            <pre className="p-4 rounded-lg text-xs overflow-auto" style={{ background: 'var(--hover-bg-subtle)', color: 'var(--text-primary)' }}>
              {JSON.stringify(data.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

