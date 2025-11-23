/**
 * Table Cell Component
 * Handles inline editing of cell values based on column type
 */

'use client';

import { useState, useEffect } from 'react';

interface TableCellProps {
  column: {
    id: string;
    title: string;
    column_type: string;
    settings?: Record<string, unknown>;
  };
  value: unknown;
  isEditing: boolean;
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

export function TableCell({ column, value, isEditing, onSave, onCancel }: TableCellProps) {
  const [editValue, setEditValue] = useState<string>(() => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return JSON.stringify(value);
  });

  useEffect(() => {
    if (isEditing) {
      setEditValue(() => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        return JSON.stringify(value);
      });
    }
  }, [isEditing, value]);

  const handleSave = () => {
    let parsedValue: unknown = editValue;

    // Parse based on column type
    switch (column.column_type) {
      case 'numbers':
        parsedValue = parseFloat(editValue) || 0;
        break;
      case 'checkbox':
        parsedValue = editValue === 'true' || editValue === 'checked';
        break;
      case 'date':
        // Keep as string for date
        break;
      case 'text':
      case 'long_text':
      default:
        parsedValue = editValue;
        break;
    }

    onSave(parsedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  if (!isEditing) {
    // Display mode
    if (value === null || value === undefined) {
      return (
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          —
        </span>
      );
    }

    switch (column.column_type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            readOnly
            className="cursor-default"
          />
        );
      case 'status':
        const statusOptions = (column.settings?.options as Array<{ label: string; color: string }>) || [];
        const statusOption = statusOptions.find((opt) => opt.label === String(value));
        return (
          <span
            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: statusOption?.color || 'var(--border-subtle)',
              color: 'white',
            }}
          >
            {String(value)}
          </span>
        );
      case 'date':
        return (
          <span className="text-sm">
            {value ? new Date(String(value)).toLocaleDateString() : '—'}
          </span>
        );
      case 'numbers':
        return (
          <span className="text-sm font-mono">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        );
      default:
        return <span className="text-sm">{String(value)}</span>;
    }
  }

  // Edit mode
  switch (column.column_type) {
    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={editValue === 'true' || editValue === 'checked'}
          onChange={(e) => setEditValue(e.target.checked ? 'true' : 'false')}
          onBlur={handleSave}
          autoFocus
          className="cursor-pointer"
        />
      );
    case 'status':
      const statusOptions = (column.settings?.options as Array<{ label: string; color: string }>) || [];
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          autoFocus
          className="w-full px-2 py-1 rounded border text-sm"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          {statusOptions.map((opt) => (
            <option key={opt.label} value={opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case 'date':
      return (
        <input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="w-full px-2 py-1 rounded border text-sm"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
      );
    case 'numbers':
      return (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="w-full px-2 py-1 rounded border text-sm font-mono"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
      );
    case 'long_text':
      return (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          rows={3}
          className="w-full px-2 py-1 rounded border text-sm"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
      );
    default:
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="w-full px-2 py-1 rounded border text-sm"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
      );
  }
}

