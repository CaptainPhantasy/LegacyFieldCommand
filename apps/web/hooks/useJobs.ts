/**
 * React Query hooks for jobs
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/react-query';

interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    cursor: string | null;
    limit: number;
    hasMore: boolean;
  };
}

interface JobsFilters {
  status?: string;
  leadTechId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

/**
 * Fetch jobs from API
 */
async function fetchJobs(filters?: JobsFilters): Promise<JobsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.status) params.set('status', filters.status);
  if (filters?.leadTechId) params.set('leadTechId', filters.leadTechId);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.cursor) params.set('cursor', filters.cursor);
  if (filters?.limit) params.set('limit', filters.limit.toString());
  if (filters?.direction) params.set('direction', filters.direction);

  const response = await fetch(`/api/admin/jobs?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Fetch single job
 */
async function fetchJob(jobId: string): Promise<{ job: Job; gates: unknown[] }> {
  const response = await fetch(`/api/admin/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch job');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch jobs list
 */
export function useJobs(filters?: JobsFilters) {
  return useQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: () => fetchJobs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch single job
 */
export function useJob(jobId: string) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: () => fetchJob(jobId),
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create job
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData: Partial<Job>) => {
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create job');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate jobs list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
    },
  });
}

/**
 * Hook to update job
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, data }: { jobId: string; data: Partial<Job> }) => {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update job');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(variables.jobId) });
    },
  });
}

