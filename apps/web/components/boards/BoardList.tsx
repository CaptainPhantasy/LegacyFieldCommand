/**
 * Board List Component
 * Displays a list of boards with filtering
 */

'use client';

import { useState } from 'react';
import { useBoards, useCreateBoard } from '@/hooks/useBoards';
import { BoardCard } from './BoardCard';

const boardTypes = [
  { value: '', label: 'All Types' },
  { value: 'sales_leads', label: 'Sales/Leads' },
  { value: 'estimates', label: 'Estimates' },
  { value: 'bdm_accounts', label: 'BDM/Accounts' },
  { value: 'field', label: 'Field' },
  { value: 'mitigation_ar', label: 'Mitigation AR' },
  { value: 'shop_equipment', label: 'Shop/Equipment' },
  { value: 'commissions', label: 'Commissions' },
  { value: 'active_jobs', label: 'Active Jobs' },
];

export function BoardList() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardType, setNewBoardType] = useState('sales_leads');

  const { data, isLoading, error } = useBoards({
    board_type: selectedType || undefined,
    limit: 50,
  });

  const createBoard = useCreateBoard();

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;

    try {
      await createBoard.mutateAsync({
        name: newBoardName,
        board_type: newBoardType,
      });
      setShowCreateModal(false);
      setNewBoardName('');
      setNewBoardType('sales_leads');
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
          Loading boards...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-500">
          Error loading boards. Please try again.
        </div>
      </div>
    );
  }

  const boards = data?.boards || [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Boards
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage your work boards
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + New Board
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          {boardTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Board Grid */}
      {boards.length === 0 ? (
        <div className="text-center py-12">
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            No boards found. Create your first board to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg font-medium text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Create Board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-elevated rounded-xl p-6 w-full max-w-md"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Create New Board
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Board Name
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Enter board name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Board Type
                </label>
                <select
                  value={newBoardType}
                  onChange={(e) => setNewBoardType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {boardTypes.slice(1).map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim() || createBoard.isPending}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {createBoard.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

