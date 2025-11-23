/**
 * React Query hooks for item attachments
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Attachment {
  id: string;
  item_id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  url?: string;
  profiles?: {
    id: string;
    email: string;
    full_name?: string | null;
  };
}

interface AttachmentsResponse {
  attachments: Attachment[];
}

/**
 * Fetch attachments for an item
 */
async function fetchAttachments(itemId: string): Promise<AttachmentsResponse> {
  const response = await fetch(`/api/items/${itemId}/attachments`);
  if (!response.ok) {
    throw new Error('Failed to fetch attachments');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch attachments for an item
 */
export function useAttachments(itemId: string) {
  return useQuery({
    queryKey: ['attachments', itemId],
    queryFn: () => fetchAttachments(itemId),
    enabled: !!itemId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to upload attachment
 */
export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, file }: { itemId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/items/${itemId}/attachments`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to upload attachment' }));
        throw new Error(error.message || 'Failed to upload attachment');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['activity', variables.itemId] });
    },
  });
}

/**
 * Hook to delete attachment
 */
export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, attachmentId }: { itemId: string; attachmentId: string }) => {
      const response = await fetch(`/api/items/${itemId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete attachment' }));
        throw new Error(error.message || 'Failed to delete attachment');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['activity', variables.itemId] });
    },
  });
}

