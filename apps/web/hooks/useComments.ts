/**
 * React Query hooks for item comments
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Comment {
  id: string;
  item_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name?: string | null;
  };
}

interface CommentsResponse {
  comments: Comment[];
}

/**
 * Fetch comments for an item
 */
async function fetchComments(itemId: string): Promise<CommentsResponse> {
  const response = await fetch(`/api/items/${itemId}/comments`);
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch comments for an item
 */
export function useComments(itemId: string) {
  return useQuery({
    queryKey: ['comments', itemId],
    queryFn: () => fetchComments(itemId),
    enabled: !!itemId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, content }: { itemId: string; content: string }) => {
      const response = await fetch(`/api/items/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create comment' }));
        throw new Error(error.message || 'Failed to create comment');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['activity', variables.itemId] });
    },
  });
}

