/**
 * React Query hooks for items
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ColumnValue {
  id: string;
  column_id: string;
  value: unknown;
  text_value?: string;
  numeric_value?: number;
  columns?: {
    id: string;
    title: string;
    column_type: string;
  };
}

interface Item {
  id: string;
  board_id: string;
  group_id?: string;
  name: string;
  position: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  column_values?: ColumnValue[];
  group?: {
    id: string;
    name: string;
    color?: string;
  };
}

interface ItemsResponse {
  items: Item[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  };
}

interface ItemsFilters {
  board_id: string;
  group_id?: string;
  limit?: number;
  offset?: number;
}

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
 * Hook to update column values
 */
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items', 'detail', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['items', 'list'] });
    },
  });
}

