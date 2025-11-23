/**
 * React Query hooks for policies
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Policy {
  id: string;
  job_id: string | null;
  policy_number: string | null;
  carrier_name: string | null;
  policy_type: string | null;
  deductible: number | null;
  coverage_limits: Record<string, number> | null;
  coverage_summary: string | null;
  pdf_storage_path: string | null;
  pdf_url?: string | null;
  status: 'pending' | 'parsed' | 'error';
  effective_date: string | null;
  expiration_date: string | null;
  parsed_data: any;
  created_by: string;
  created_at: string;
  updated_at: string;
  jobs?: { id: string; title: string } | null;
  profiles?: { id: string; email: string; full_name: string | null } | null;
}

export interface PoliciesResponse {
  policies: Policy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch policies
 */
async function fetchPolicies(params?: {
  page?: number;
  limit?: number;
  status?: string;
  jobId?: string;
}): Promise<PoliciesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.jobId) searchParams.set('jobId', params.jobId);

  const response = await fetch(`/api/admin/policies?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch policies');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Fetch single policy
 */
async function fetchPolicy(policyId: string): Promise<Policy> {
  const response = await fetch(`/api/admin/policies/${policyId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch policy');
  }
  
  const data = await response.json();
  return data.data.policy;
}

/**
 * Upload policy
 */
async function uploadPolicy(formData: FormData): Promise<Policy> {
  const response = await fetch('/api/admin/policies/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload policy');
  }
  
  const data = await response.json();
  return data.data.policy;
}

/**
 * Parse policy
 */
async function parsePolicy(policyId: string, forceReparse = false): Promise<Policy> {
  const response = await fetch('/api/admin/policies/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policyId, forceReparse }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to parse policy');
  }
  
  const data = await response.json();
  return data.data.policy;
}

/**
 * Link policy to job
 */
async function linkPolicyToJob(policyId: string, jobId: string): Promise<Policy> {
  const response = await fetch(`/api/admin/policies/${policyId}/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to link policy');
  }
  
  const data = await response.json();
  return data.data.policy;
}

/**
 * Hook to fetch policies list
 */
export function usePolicies(params?: {
  page?: number;
  limit?: number;
  status?: string;
  jobId?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'policies', params],
    queryFn: () => fetchPolicies(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch single policy
 */
export function usePolicy(policyId: string) {
  return useQuery({
    queryKey: ['admin', 'policies', 'detail', policyId],
    queryFn: () => fetchPolicy(policyId),
    enabled: !!policyId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to upload policy
 */
export function useUploadPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
    },
  });
}

/**
 * Hook to parse policy
 */
export function useParsePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ policyId, forceReparse }: { policyId: string; forceReparse?: boolean }) =>
      parsePolicy(policyId, forceReparse),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies', 'detail', variables.policyId] });
    },
  });
}

/**
 * Hook to link policy to job
 */
export function useLinkPolicyToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ policyId, jobId }: { policyId: string; jobId: string }) =>
      linkPolicyToJob(policyId, jobId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies', 'detail', variables.policyId] });
    },
  });
}

