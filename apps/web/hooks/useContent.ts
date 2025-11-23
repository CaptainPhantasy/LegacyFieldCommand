/**
 * React Query hooks for content management
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Box {
  id: string;
  job_id: string;
  box_number: string;
  room_id: string | null;
  status: 'packed' | 'in_transit' | 'stored' | 'delivered';
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  box_id: string | null;
  job_id: string;
  item_name: string;
  description: string | null;
  category: string | null;
  condition: 'good' | 'damaged' | 'destroyed';
  photos: string[] | null;
  created_at: string;
  updated_at: string;
}

async function fetchBoxes(jobId: string): Promise<Box[]> {
  const response = await fetch(`/api/content/boxes?jobId=${jobId}`);
  if (!response.ok) throw new Error('Failed to fetch boxes');
  const data = await response.json();
  return data.data.boxes || [];
}

async function fetchContentItems(jobId: string): Promise<ContentItem[]> {
  const response = await fetch(`/api/content/items?jobId=${jobId}`);
  if (!response.ok) throw new Error('Failed to fetch content items');
  const data = await response.json();
  return data.data.items || [];
}

export function useBoxes(jobId: string) {
  return useQuery({
    queryKey: ['content', 'boxes', jobId],
    queryFn: () => fetchBoxes(jobId),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useContentItems(jobId: string) {
  return useQuery({
    queryKey: ['content', 'items', jobId],
    queryFn: () => fetchContentItems(jobId),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });
}

