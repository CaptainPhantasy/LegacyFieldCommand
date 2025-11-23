/**
 * Kanban View Component
 * Kanban board with drag and drop support
 */

'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { ItemDetailsPanel } from '@/components/boards/ItemDetailsPanel';
import { useItems, useCreateItem, useUpdateItem } from '@/hooks/useItems';
import type { Column, Group, Item } from '@/types/boards';

interface KanbanViewProps {
  boardId: string;
  groups: Group[];
  columns: Column[];
}

export function KanbanView({ boardId, groups, columns }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const { data } = useItems({ board_id: boardId, limit: 100 });
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const items = useMemo(() => data?.items || [], [data?.items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group items by group_id
  const itemsByGroup = useMemo(() => {
    const grouped: Record<string, Item[]> = {};
    groups.forEach((g) => {
      grouped[g.id] = [];
    });

    items.forEach((item) => {
      const groupId = item.group_id;
      if (!groupId || !grouped[groupId]) {
        return;
      }
      grouped[groupId].push(item);
    });

    // Sort by position within groups
    Object.keys(grouped).forEach((groupId) => {
      grouped[groupId].sort((a, b) => a.position - b.position);
    });

    return grouped;
  }, [items, groups]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeItem = items.find(i => i.id === active.id);
    if (!activeItem) {
      setActiveId(null);
      return;
    }

    // Check if dropped on another item (for reordering within column)
    const overItem = items.find(i => i.id === over.id);
    if (overItem) {
      // Dropped on another item - reorder within same group
      const sameGroup = activeItem.group_id === overItem.group_id;
      if (sameGroup) {
        const groupItems = itemsByGroup[activeItem.group_id] || [];
        const oldIndex = groupItems.findIndex(i => i.id === activeItem.id);
        const newIndex = groupItems.findIndex(i => i.id === overItem.id);
        
        if (oldIndex !== newIndex) {
          const reordered = arrayMove(groupItems, oldIndex, newIndex);
          // Update position for all affected items
          reordered.forEach((item, index) => {
            if (item.position !== index) {
              updateItem.mutate({
                itemId: item.id,
                data: { position: index }
              });
            }
          });
        }
      } else {
        // Moving to different group - update group_id and position
        const targetGroupItems = itemsByGroup[overItem.group_id] || [];
        const newPosition = targetGroupItems.findIndex(i => i.id === overItem.id);
        
        updateItem.mutate({
          itemId: activeItem.id,
          data: { 
            group_id: overItem.group_id,
            position: newPosition
          }
        });
      }
    } else {
      // Dropped on column (group) - move to that group
      const overGroupId = groups.find(g => g.id === over.id)?.id;
      if (overGroupId && activeItem.group_id !== overGroupId) {
        const targetGroupItems = itemsByGroup[overGroupId] || [];
        const newPosition = targetGroupItems.length;
        
        updateItem.mutate({
          itemId: activeItem.id,
          data: { 
            group_id: overGroupId,
            position: newPosition
          }
        });
      }
    }

    setActiveId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Find the containers
    const activeItem = items.find(i => i.id === active.id);
    const overGroupId = groups.find(g => g.id === over.id)?.id;

    if (activeItem && overGroupId && activeItem.group_id !== overGroupId) {
      // Optimistic update could happen here for smoother UX
    }
  };

  const handleAddItem = (groupId: string) => {
    createItem.mutate({
      board_id: boardId,
      group_id: groupId,
      name: 'New Item',
    });
  };

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full">
          {groups.map((group) => (
            <KanbanColumn
              key={group.id}
              group={group}
              items={itemsByGroup[group.id] || []}
              onItemClick={setSelectedItemId}
              onAddItem={handleAddItem}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <KanbanCard
              item={items.find((i) => i.id === activeId)!}
              onClick={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ItemDetailsPanel
        itemId={selectedItemId}
        boardId={boardId}
        columns={columns}
        onClose={() => setSelectedItemId(null)}
      />
    </div>
  );
}

