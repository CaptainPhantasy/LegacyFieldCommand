/**
 * Board View Component
 * Container for board views (table, kanban, etc.)
 */

'use client';

import { useState, useEffect } from 'react';
import { useBoard } from '@/hooks/useBoards';
import { TableView } from '@/components/views/TableView';
import { KanbanView } from '@/components/views/KanbanView';
import type { View } from '@/types/boards';

interface BoardViewProps {
  boardId: string;
}

export function BoardView({ boardId }: BoardViewProps) {
  const { data, isLoading, error } = useBoard(boardId);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        Loading board...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading board. Please try again.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        Board not found.
      </div>
    );
  }

  const { board, groups, columns, views } = data;

  // Find default view or first view - initialize selectedViewId on client only
  useEffect(() => {
    if (!selectedViewId && views && views.length > 0) {
      const defaultView = views.find((v: View) => v.is_default) || views[0];
      if (defaultView) {
        setSelectedViewId(defaultView.id);
      }
    }
  }, [views, selectedViewId]);

  const defaultView = views?.find((v: View) => v.is_default) || views?.[0];
  const currentView = selectedViewId
    ? views?.find((v: View) => v.id === selectedViewId)
    : defaultView;

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        Loading board...
      </div>
    );
  }

  // Render view based on type
  const renderView = () => {
    if (!currentView) {
      return (
        <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
          No view selected. Create a view to get started.
        </div>
      );
    }

    const view = currentView;
    switch (view.view_type) {
      case 'table':
        return <TableView boardId={boardId} columns={columns || []} groups={groups || []} />;
      case 'kanban':
        return <KanbanView boardId={boardId} groups={groups || []} columns={columns || []} />;
      default:
        return (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            View type &quot;{currentView.view_type}&quot; not yet implemented.
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {board.name}
            </h1>
            {board.description && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {board.description}
              </p>
            )}
          </div>
        </div>

        {/* View Switcher */}
        {views && views.length > 0 && (
          <div className="flex gap-2">
            {views.map((view: View) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setSelectedViewId(view.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (selectedViewId === view.id || (!selectedViewId && view.is_default))
                    ? 'text-white'
                    : ''
                }`}
                style={{
                  backgroundColor:
                    selectedViewId === view.id || (!selectedViewId && view.is_default)
                      ? 'var(--accent)'
                      : 'var(--elevated)',
                  color:
                    selectedViewId === view.id || (!selectedViewId && view.is_default)
                      ? 'white'
                      : 'var(--text-primary)',
                }}
              >
                {view.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderView()}
      </div>
    </div>
  );
}

