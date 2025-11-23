/**
 * React Query hooks for item activity logs
 */

'use client';

import { useQuery } from '@tanstack/react-query';

export interface Activity {
  id: string;
  item_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name?: string | null;
  } | null;
}

interface ActivityResponse {
  activities: Activity[];
}

/**
 * Fetch activity logs for an item
 */
async function fetchActivity(itemId: string): Promise<ActivityResponse> {
  const response = await fetch(`/api/items/${itemId}/activity`);
  if (!response.ok) {
    throw new Error('Failed to fetch activity');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch activity logs for an item
 */
export function useActivity(itemId: string) {
  return useQuery({
    queryKey: ['activity', itemId],
    queryFn: () => fetchActivity(itemId),
    enabled: !!itemId,
    staleTime: 30 * 1000, // 30 seconds (activity changes frequently)
  });
}

