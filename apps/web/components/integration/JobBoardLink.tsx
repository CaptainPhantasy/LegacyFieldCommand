/**
 * Job Board Link Component
 * Shows linked board item on job detail page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface JobBoardLinkProps {
  jobId: string;
}

export function JobBoardLink({ jobId }: JobBoardLinkProps) {
  const [boardItem, setBoardItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoardItem();
  }, [jobId]);

  const fetchBoardItem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/board-item`);
      if (!response.ok) {
        if (response.status === 404) {
          setBoardItem(null);
          return;
        }
        throw new Error('Failed to fetch board item');
      }
      const data = await response.json();
      setBoardItem(data.data?.board_item || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Loading board link...
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

  if (!boardItem) {
    return (
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        No board item linked. <SyncButton jobId={jobId} onSync={fetchBoardItem} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Linked to:
      </span>
      <Link
        href={`/boards/${boardItem.board_id}?item=${boardItem.id}`}
        className="text-sm font-medium"
        style={{ color: 'var(--accent)' }}
      >
        {boardItem.name}
      </Link>
      <SyncButton jobId={jobId} onSync={fetchBoardItem} />
    </div>
  );
}

function SyncButton({ jobId, onSync }: { jobId: string; onSync: () => void }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/sync-to-board`, {
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

