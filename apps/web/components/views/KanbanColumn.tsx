/**
 * Kanban Column Component
 * Droppable column for Kanban view
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { Group, Item } from '@/types/boards';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  group: Group;
  items: Item[];
  onItemClick: (itemId: string) => void;
  onAddItem: (groupId: string) => void;
}

export function KanbanColumn({ group, items, onItemClick, onAddItem }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: group.id,
  });

  return (
    <div className="flex flex-col w-72 min-w-[288px] h-full max-h-full">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 rounded-t-lg mb-2"
        style={{ backgroundColor: group.color || 'var(--accent)' }}
      >
        <h3 className="text-sm font-semibold text-white truncate">
          {group.name}
        </h3>
        <span className="text-xs text-white/80 bg-black/10 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 bg-[var(--bg-secondary)]/50 rounded-lg"
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item.id)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Item Button */}
      <button
        onClick={() => onAddItem(group.id)}
        className="mt-2 flex items-center justify-center gap-2 w-full p-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
      >
        <Plus size={16} />
        Add Item
      </button>
    </div>
  );
}

