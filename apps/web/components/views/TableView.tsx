/**
 * Table View Component
 * Displays items in a table format with inline editing
 */

'use client';

import { useState, useMemo, useRef } from 'react';
import { useItems, useCreateItem, useUpdateColumnValues, useDeleteItems } from '@/hooks/useItems';
import { TableCell } from './TableCell';
import { ItemDetailsPanel } from '@/components/boards/ItemDetailsPanel';
import type { Column, Group } from '@/types/boards';
import { Trash2 } from 'lucide-react';

interface TableViewProps {
  boardId: string;
  columns: Column[];
  groups: Group[];
}

export function TableView({ boardId, columns, groups }: TableViewProps) {
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const addRowInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading } = useItems({ board_id: boardId, limit: 100 });
  const createItem = useCreateItem();
  const updateColumnValues = useUpdateColumnValues();
  const deleteItems = useDeleteItems();

  // Sort columns by position
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => a.position - b.position);
  }, [columns]);

  // Sort items by position
  const sortedItems = useMemo(() => {
    if (!data?.items) return [];
    return [...data.items].sort((a, b) => a.position - b.position);
  }, [data?.items]);

  const handleCellEdit = async (itemId: string, columnId: string, value: unknown) => {
    try {
      await updateColumnValues.mutateAsync({
        itemId,
        values: [{
          column_id: columnId,
          value,
          text_value: typeof value === 'string' ? value : undefined,
          numeric_value: typeof value === 'number' ? value : undefined,
        }],
      });
      setEditingCell(null);
    } catch (error) {
      console.error('Failed to update cell:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      setAddItemError('Item name is required');
      return;
    }

    setAddItemError(null);
    setIsCreating(true);
    try {
      await createItem.mutateAsync({
        board_id: boardId,
        name: newItemName.trim(),
      });
      setNewItemName('');
      setAddItemError(null);
      // Keep input focused for quick addition of multiple items
      addRowInputRef.current?.focus();
    } catch (error: any) {
      console.error('Failed to create item:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to create item. Please try again.';
      setAddItemError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSelection = (itemId: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === sortedItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(sortedItems.map((item) => item.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItemIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedItemIds.size} items?`)) return;

    try {
      await deleteItems.mutateAsync(Array.from(selectedItemIds));
      setSelectedItemIds(new Set());
    } catch (error) {
      console.error('Failed to delete items:', error);
      alert('Failed to delete items');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        Loading items...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto relative">
      {/* Bulk Actions Toolbar */}
      {selectedItemIds.size > 0 && (
        <div className="sticky top-0 left-0 right-0 z-20 bg-[var(--elevated)] border-b border-[var(--border-subtle)] px-4 py-2 flex items-center justify-between shadow-md mb-[-1px]">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {selectedItemIds.size} selected
            </span>
            <div className="h-4 w-px bg-[var(--border-subtle)]" />
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--error)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
          <button
            onClick={() => setSelectedItemIds(new Set())}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Clear selection
          </button>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {/* Checkbox column */}
            <th
              className="w-10 px-4 py-3 sticky left-0 z-10 bg-[var(--elevated)]"
            >
              <input
                type="checkbox"
                checked={sortedItems.length > 0 && selectedItemIds.size === sortedItems.length}
                onChange={toggleSelectAll}
                className="cursor-pointer"
              />
            </th>
            {/* Name column */}
            <th
              className="px-4 py-3 text-left text-sm font-semibold sticky left-10 z-10"
              style={{
                backgroundColor: 'var(--elevated)',
                color: 'var(--text-primary)',
                minWidth: '200px',
              }}
            >
              Name
            </th>
            {/* Dynamic columns */}
            {sortedColumns.map((column) => (
              <th
                key={column.id}
                className="px-4 py-3 text-left text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--elevated)',
                  color: 'var(--text-primary)',
                  minWidth: '150px',
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Existing items */}
          {sortedItems.map((item) => (
            <tr
              key={item.id}
              className={`hover:bg-hover-subtle transition-colors ${
                selectedItemIds.has(item.id) ? 'bg-[var(--accent-subtle)]' : ''
              }`}
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              {/* Checkbox cell */}
              <td className="px-4 py-3 sticky left-0 z-10 bg-inherit">
                <input
                  type="checkbox"
                  checked={selectedItemIds.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="cursor-pointer"
                />
              </td>
              {/* Name cell */}
              <td
                className="px-4 py-3 sticky left-10 z-10 cursor-pointer hover:text-[var(--accent)] bg-inherit"
                style={{
                  color: 'var(--text-primary)',
                }}
                onClick={() => setSelectedItemId(item.id)}
              >
                {item.name}
              </td>
              {/* Dynamic column cells */}
              {sortedColumns.map((column) => {
                const columnValue = item.column_values?.find((cv) => cv.column_id === column.id);
                const isEditing = editingCell?.itemId === item.id && editingCell?.columnId === column.id;

                return (
                  <td
                    key={column.id}
                    className="px-4 py-3"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => setEditingCell({ itemId: item.id, columnId: column.id })}
                  >
                    <TableCell
                      column={column}
                      value={columnValue?.value}
                      isEditing={isEditing}
                      onSave={(value) => handleCellEdit(item.id, column.id, value)}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Always-visible add new item row */}
          <tr
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
            className="hover:bg-hover-subtle transition-colors"
            onClick={(e) => {
              // Focus input when clicking anywhere in the row
              if (e.target !== addRowInputRef.current && !addRowInputRef.current?.contains(e.target as Node)) {
                addRowInputRef.current?.focus();
              }
            }}
          >
            <td className="px-4 py-3 sticky left-0 z-10 bg-[var(--elevated)]" />
              <td
              className="px-4 py-3 sticky left-10 z-10"
                style={{
                  backgroundColor: 'var(--elevated)',
                }}
              >
              <div className="flex items-center gap-2">
                <input
                  ref={addRowInputRef}
                  type="text"
                  value={newItemName}
                  onChange={(e) => {
                    setNewItemName(e.target.value);
                    setAddItemError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      e.preventDefault();
                      handleAddItem();
                    } else if (e.key === 'Escape') {
                      setNewItemName('');
                      setAddItemError(null);
                    }
                  }}
                  className="w-full px-2 py-1 rounded border"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: addItemError ? 'var(--error)' : 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Item name"
                  disabled={isCreating}
                />
                {isCreating && (
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Creating...
                  </span>
                )}
              </div>
              {addItemError && (
                <p className="mt-1 text-xs" style={{ color: 'var(--error)' }}>
                  {addItemError}
                </p>
              )}
              </td>
              {sortedColumns.map((column) => (
                <td key={column.id} className="px-4 py-3" />
              ))}
            </tr>
        </tbody>
      </table>

      <ItemDetailsPanel
        itemId={selectedItemId}
        boardId={boardId}
        columns={columns}
        onClose={() => setSelectedItemId(null)}
      />
    </div>
  );
}

