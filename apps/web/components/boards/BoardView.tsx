/**
 * Board View Component
 * Container for board views (table, kanban, etc.)
 */

'use client';

import { useState } from 'react';
import { useBoard } from '@/hooks/useBoards';
import { TableView } from '@/components/views/TableView';

interface BoardViewProps {
  boardId: string;
}

export function BoardView({ boardId }: BoardViewProps) {
  const { data, isLoading, error } = useBoard(boardId);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);

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

  const { board, groups, columns, items, views } = data;

  // Find default view or first view
  const defaultView = views?.find((v: { is_default: boolean }) => v.is_default) || views?.[0];
  const currentView = selectedViewId
    ? views?.find((v: { id: string }) => v.id === selectedViewId)
    : defaultView;

  // Render view based on type
  const renderView = () => {
    if (!currentView) {
      return (
        <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
          No view selected. Create a view to get started.
        </div>
      );
    }

    switch (currentView.view_type) {
      case 'table':
        return <TableView boardId={boardId} columns={columns || []} groups={groups || []} />;
      case 'kanban':
        // TODO: Implement Kanban view
        return (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            Kanban view coming soon...
          </div>
        );
      default:
        return (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            View type "{currentView.view_type}" not yet implemented.
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
            {views.map((view: { id: string; name: string; view_type: string; is_default: boolean }) => (
              <button
                key={view.id}
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

