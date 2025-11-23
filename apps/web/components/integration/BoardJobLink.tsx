/**
 * Board Job Link Component
 * Shows linked job on board item
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BoardJobLinkProps {
  itemId: string;
}

export function BoardJobLink({ itemId }: BoardJobLinkProps) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJob();
  }, [itemId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/items/${itemId}/job`);
      if (!response.ok) {
        if (response.status === 404) {
          setJob(null);
          return;
        }
        throw new Error('Failed to fetch job');
      }
      const data = await response.json();
      setJob(data.data?.job || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Loading job link...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        No job linked.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Linked job:
      </span>
      <Link
        href={`/field/jobs/${job.id}`}
        className="text-sm font-medium"
        style={{ color: 'var(--accent)' }}
      >
        {job.title}
      </Link>
      <SyncButton itemId={itemId} onSync={fetchJob} />
    </div>
  );
}

function SyncButton({ itemId, onSync }: { itemId: string; onSync: () => void }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/items/${itemId}/sync-to-job`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      onSync();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="text-xs px-2 py-1 rounded border disabled:opacity-50"
      style={{
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-secondary)',
      }}
    >
      {syncing ? 'Syncing...' : 'Sync'}
    </button>
  );
}

