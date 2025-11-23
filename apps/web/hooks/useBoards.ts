/**
 * React Query hooks for boards
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/react-query';

interface Board {
  id: string;
  name: string;
  description?: string;
  board_type: string;
  account_id?: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface BoardsResponse {
  boards: Board[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  };
}

interface BoardsFilters {
  account_id?: string;
  board_type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch boards from API
 */
async function fetchBoards(filters?: BoardsFilters): Promise<BoardsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.account_id) params.set('account_id', filters.account_id);
  if (filters?.board_type) params.set('board_type', filters.board_type);
  if (filters?.limit) params.set('limit', filters.limit.toString());
  if (filters?.offset) params.set('offset', filters.offset.toString());

  const response = await fetch(`/api/boards?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch boards');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Fetch single board
 */
async function fetchBoard(boardId: string): Promise<{
  board: Board;
  groups: unknown[];
  columns: unknown[];
  items: unknown[];
  views: unknown[];
}> {
  const response = await fetch(`/api/boards/${boardId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch board');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch boards list
 */
export function useBoards(filters?: BoardsFilters) {
  return useQuery({
    queryKey: ['boards', 'list', filters],
    queryFn: () => fetchBoards(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch single board
 */
export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ['boards', 'detail', boardId],
    queryFn: () => fetchBoard(boardId),
    enabled: !!boardId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create board
 */
export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardData: Partial<Board>) => {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create board');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', 'list'] });
    },
  });
}

/**
 * Hook to update board
 */
export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, data }: { boardId: string; data: Partial<Board> }) => {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update board');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['boards', 'detail', variables.boardId] });
    },
  });
}

