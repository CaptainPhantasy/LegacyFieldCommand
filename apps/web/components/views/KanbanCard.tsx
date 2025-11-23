/**
 * Kanban Card Component
 * Draggable card for Kanban view
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User } from 'lucide-react';
import type { Item } from '@/types/boards';

interface KanbanCardProps {
  item: Item;
  onClick: () => void;
}

export function KanbanCard({ item, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-[var(--elevated)] p-3 rounded-lg border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
          {item.name}
        </h4>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex -space-x-2 overflow-hidden">
          {/* Placeholder for assignees - in real app this would map over person column values */}
          <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--elevated)]">
            <User size={12} className="text-[var(--text-secondary)]" />
          </div>
        </div>
        
        {/* Optional: Show due date or other indicators */}
      </div>
    </div>
  );
}

