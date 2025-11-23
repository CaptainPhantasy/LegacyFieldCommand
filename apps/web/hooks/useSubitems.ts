/**
 * React Query hooks for subitems
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Subitem {
  id: string;
  item_id: string;
  name: string;
  position: number;
  is_completed: boolean;
  completed_by?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface SubitemsResponse {
  subitems: Subitem[];
}

/**
 * Fetch subitems for an item
 */
async function fetchSubitems(itemId: string): Promise<SubitemsResponse> {
  const params = new URLSearchParams();
  params.set('item_id', itemId);

  const response = await fetch(`/api/subitems?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch subitems');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch subitems for an item
 */
export function useSubitems(itemId: string) {
  return useQuery({
    queryKey: ['subitems', itemId],
    queryFn: () => fetchSubitems(itemId),
    enabled: !!itemId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create subitem
 */
export function useCreateSubitem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subitemData: { item_id: string; name: string; position?: number; is_completed?: boolean }) => {
      const response = await fetch('/api/subitems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subitemData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create subitem');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subitems', variables.item_id] });
    },
  });
}

/**
 * Hook to update subitem
 */
export function useUpdateSubitem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subitemId, data }: { subitemId: string; data: Partial<Subitem> }) => {
      const response = await fetch(`/api/subitems/${subitemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subitem');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate all subitems queries - we'd need item_id to be more specific
      queryClient.invalidateQueries({ queryKey: ['subitems'] });
    },
  });
}

/**
 * Hook to delete subitem
 */
export function useDeleteSubitem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subitemId: string) => {
      const response = await fetch(`/api/subitems/${subitemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete subitem');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subitems'] });
    },
  });
}

/**
 * Hook to toggle subitem completion
 */
export function useToggleSubitemCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subitemId: string) => {
      const response = await fetch(`/api/subitems/${subitemId}/complete`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle subitem completion');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subitems'] });
    },
  });
}

