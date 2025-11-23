/**
 * React Query hooks for estimates
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface EstimateLineItem {
  id: string;
  estimate_id: string;
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  category: string | null;
  code: string | null;
  created_at: string;
}

export interface Estimate {
  id: string;
  job_id: string;
  policy_id: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  version: number;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  jobs?: { id: string; title: string } | null;
  policies?: { id: string; policy_number: string; carrier_name: string } | null;
}

export interface EstimatesResponse {
  estimates: Estimate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EstimateDetail {
  estimate: Estimate;
  lineItems: EstimateLineItem[];
}

async function fetchEstimates(params?: {
  page?: number;
  limit?: number;
  jobId?: string;
  status?: string;
}): Promise<EstimatesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.jobId) searchParams.set('jobId', params.jobId);
  if (params?.status) searchParams.set('status', params.status);

  const response = await fetch(`/api/estimates?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch estimates');
  const data = await response.json();
  return data.data;
}

async function fetchEstimate(estimateId: string): Promise<EstimateDetail> {
  const response = await fetch(`/api/estimates/${estimateId}`);
  if (!response.ok) throw new Error('Failed to fetch estimate');
  const data = await response.json();
  return data.data;
}

async function generateEstimate(jobId: string, policyId?: string): Promise<Estimate> {
  const response = await fetch('/api/estimates/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, policyId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate estimate');
  }
  const data = await response.json();
  return data.data.estimate;
}

async function exportEstimate(estimateId: string): Promise<Blob> {
  const response = await fetch(`/api/estimates/${estimateId}/export`);
  if (!response.ok) throw new Error('Failed to export estimate');
  return response.blob();
}

export function useEstimates(params?: {
  page?: number;
  limit?: number;
  jobId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['estimates', params],
    queryFn: () => fetchEstimates(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEstimate(estimateId: string) {
  return useQuery({
    queryKey: ['estimates', 'detail', estimateId],
    queryFn: () => fetchEstimate(estimateId),
    enabled: !!estimateId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGenerateEstimate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, policyId }: { jobId: string; policyId?: string }) =>
      generateEstimate(jobId, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
}

export function useExportEstimate() {
  return useMutation({
    mutationFn: exportEstimate,
  });
}

