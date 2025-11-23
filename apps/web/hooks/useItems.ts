/**
 * React Query hooks for items
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Item, ColumnValue, ItemsResponse, ItemsFilters } from '@/types/boards';

/**
 * Fetch items from API
 */
async function fetchItems(filters: ItemsFilters): Promise<ItemsResponse> {
  const params = new URLSearchParams();
  params.set('board_id', filters.board_id);
  if (filters.group_id) params.set('group_id', filters.group_id);
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.offset) params.set('offset', filters.offset.toString());

  const response = await fetch(`/api/items?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Fetch single item
 */
async function fetchItem(itemId: string): Promise<{ item: Item }> {
  const response = await fetch(`/api/items/${itemId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch item');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch items list
 */
export function useItems(filters: ItemsFilters) {
  return useQuery({
    queryKey: ['items', 'list', filters],
    queryFn: () => fetchItems(filters),
    enabled: !!filters.board_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch single item
 */
export function useItem(itemId: string) {
  return useQuery({
    queryKey: ['items', 'detail', itemId],
    queryFn: () => fetchItem(itemId),
    enabled: !!itemId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create item
 */
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: Partial<Item>) => {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create item');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['items', 'list', { board_id: variables.board_id }] 
      });
    },
  });
}

/**
 * Hook to update item
 */
export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Partial<Item> }) => {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['items', 'detail', variables.itemId] });
    },
  });
}

/**
 * Hook to delete items
 */
export function useDeleteItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemIds: string[]) => {
      const response = await fetch('/api/items/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete items');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', 'list'] });
    },
  });
}
export function useUpdateColumnValues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      values 
    }: { 
      itemId: string; 
      values: Array<{
        column_id: string;
        value?: unknown;
        text_value?: string;
        numeric_value?: number;
      }>;
    }) => {
      const response = await fetch(`/api/items/${itemId}/column-values`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update column values');
      }
      
      return response.json();
    },
    onMutate: async ({ itemId, values }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['items', 'list'] });
      await queryClient.cancelQueries({ queryKey: ['items', 'detail', itemId] });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(['items', 'list']);
      const previousItem = queryClient.getQueryData(['items', 'detail', itemId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['items', 'list'], (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: any) => {
            if (item.id !== itemId) return item;
            // Update the specific column value in the item
            const newColumnValues = [...(item.column_values || [])];
            values.forEach(update => {
              const existingIndex = newColumnValues.findIndex(cv => cv.column_id === update.column_id);
              if (existingIndex >= 0) {
                newColumnValues[existingIndex] = { ...newColumnValues[existingIndex], ...update };
              } else {
                newColumnValues.push({ id: 'optimistic-' + update.column_id, ...update });
              }
            });
            return { ...item, column_values: newColumnValues };
          }),
        };
      });

      return { previousItems, previousItem };
    },
    onError: (err, variables, context) => {
      // Rollback to the previous value
      if (context?.previousItems) {
        queryClient.setQueryData(['items', 'list'], context.previousItems);
      }
      if (context?.previousItem) {
        queryClient.setQueryData(['items', 'detail', variables.itemId], context.previousItem);
      }
    },
    onSettled: (_, __, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['items', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['items', 'detail', variables.itemId] });
    },
  });
}

