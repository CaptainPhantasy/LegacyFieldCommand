/**
 * People Cell Component
 * Displays and edits assigned people
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { User, X, Plus } from 'lucide-react';
import { useUsers } from '@/hooks/useAdmin';

interface PeopleCellProps {
  value: string[]; // Array of user IDs
  isEditing: boolean;
  onSave: (value: string[]) => void;
  onCancel: () => void;
}

export function PeopleCell({ value, isEditing, onSave, onCancel }: PeopleCellProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(Array.isArray(value) ? value : []);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: usersData } = useUsers({ limit: 100 });
  const allUsers = usersData?.users || [];

  // Initialize selected IDs from value
  useEffect(() => {
    if (Array.isArray(value)) {
      setSelectedIds(value);
    } else if (typeof value === 'string') {
      // Handle potential legacy string data
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) setSelectedIds(parsed);
        else setSelectedIds([value]);
      } catch {
        setSelectedIds([value]);
      }
    } else {
      setSelectedIds([]);
    }
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isEditing) {
          onSave(selectedIds);
        }
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, onSave, selectedIds]);

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedUsers = allUsers.filter((u) => selectedIds.includes(u.id));
  const filteredUsers = allUsers.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isEditing) {
    if (selectedUsers.length === 0) {
      return (
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <User size={16} className="inline-block mr-1 opacity-50" />
        </span>
      );
    }

    return (
      <div className="flex -space-x-2 overflow-hidden">
        {selectedUsers.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full ring-2 ring-white text-[10px] font-medium"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'white',
            }}
            title={user.full_name || user.email}
          >
            {getInitials(user.full_name || user.email)}
          </div>
        ))}
        {selectedUsers.length > 3 && (
          <div
            className="inline-flex items-center justify-center w-6 h-6 rounded-full ring-2 ring-white text-[10px] font-medium"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            +{selectedUsers.length - 3}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full min-w-[200px]" ref={dropdownRef}>
      <div className="p-2 bg-[var(--elevated)] border border-[var(--border-subtle)] rounded-md shadow-lg z-50">
        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search people..."
          className="w-full px-2 py-1 mb-2 text-sm rounded border border-[var(--border-subtle)] bg-[var(--background)]"
          autoFocus
        />

        {/* Selected Users List (Tags) */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedUsers.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-[var(--accent-subtle)] text-[var(--accent)]"
              >
                {user.full_name || user.email}
                <button
                  onClick={() => toggleUser(user.id)}
                  className="ml-1 hover:text-[var(--error)]"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* User List */}
        <div className="max-h-48 overflow-y-auto space-y-1">
          {filteredUsers.map((user) => {
            const isSelected = selectedIds.includes(user.id);
            return (
              <div
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm transition-colors ${
                  isSelected ? 'bg-[var(--accent-subtle)]' : 'hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: isSelected ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {getInitials(user.full_name || user.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.full_name || 'Unknown'}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {user.email}
                  </p>
                </div>
                {isSelected && <Plus size={14} className="rotate-45 text-[var(--accent)]" />}
              </div>
            );
          })}
          {filteredUsers.length === 0 && (
            <p className="text-xs text-center py-2" style={{ color: 'var(--text-tertiary)' }}>
              No users found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

