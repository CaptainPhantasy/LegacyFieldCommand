/**
 * Table View Component
 * Displays items in a table format with inline editing
 */

'use client';

import { useState, useMemo } from 'react';
import { useItems, useCreateItem, useUpdateColumnValues } from '@/hooks/useItems';
import { TableCell } from './TableCell';

interface TableViewProps {
  boardId: string;
  columns: Array<{
    id: string;
    title: string;
    column_type: string;
    position: number;
    settings?: Record<string, unknown>;
  }>;
  groups: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
}

export function TableView({ boardId, columns, groups }: TableViewProps) {
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const { data, isLoading } = useItems({ board_id: boardId, limit: 100 });
  const createItem = useCreateItem();
  const updateColumnValues = useUpdateColumnValues();

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
    if (!newItemName.trim()) return;

    try {
      await createItem.mutateAsync({
        board_id: boardId,
        name: newItemName,
      });
      setNewItemName('');
      setIsAddingItem(false);
    } catch (error) {
      console.error('Failed to create item:', error);
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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {/* Name column */}
            <th
              className="px-4 py-3 text-left text-sm font-semibold sticky left-0 z-10"
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
              className="hover:bg-hover-subtle transition-colors"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              {/* Name cell */}
              <td
                className="px-4 py-3 sticky left-0 z-10"
                style={{
                  backgroundColor: 'var(--elevated)',
                  color: 'var(--text-primary)',
                }}
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

          {/* Add new item row */}
          {isAddingItem ? (
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td
                className="px-4 py-3 sticky left-0 z-10"
                style={{
                  backgroundColor: 'var(--elevated)',
                }}
              >
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem();
                    } else if (e.key === 'Escape') {
                      setIsAddingItem(false);
                      setNewItemName('');
                    }
                  }}
                  className="w-full px-2 py-1 rounded border"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Item name"
                  autoFocus
                />
              </td>
              {sortedColumns.map((column) => (
                <td key={column.id} className="px-4 py-3" />
              ))}
            </tr>
          ) : (
            <tr>
              <td
                colSpan={sortedColumns.length + 1}
                className="px-4 py-3 text-center"
                style={{ color: 'var(--text-secondary)' }}
              >
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="text-sm hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  + Add item
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

