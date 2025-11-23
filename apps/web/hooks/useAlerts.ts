/**
 * React Query hooks for alerts
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Alert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  job_id: string | null;
  gate_id: string | null;
  rule_id: string | null;
  details: any;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
  jobs?: { id: string; title: string } | null;
  alert_rules?: { id: string; name: string } | null;
}

export interface AlertsResponse {
  alerts: Alert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchAlerts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  jobId?: string;
}): Promise<AlertsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.severity) searchParams.set('severity', params.severity);
  if (params?.jobId) searchParams.set('jobId', params.jobId);

  const response = await fetch(`/api/alerts?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch alerts');
  const data = await response.json();
  return data.data;
}

async function fetchAlert(alertId: string): Promise<Alert> {
  const response = await fetch(`/api/alerts/${alertId}`);
  if (!response.ok) throw new Error('Failed to fetch alert');
  const data = await response.json();
  return data.data.alert;
}

async function acknowledgeAlert(alertId: string): Promise<Alert> {
  const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to acknowledge alert');
  }
  const data = await response.json();
  return data.data.alert;
}

export function useAlerts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  jobId?: string;
}) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => fetchAlerts(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useAlert(alertId: string) {
  return useQuery({
    queryKey: ['alerts', 'detail', alertId],
    queryFn: () => fetchAlert(alertId),
    enabled: !!alertId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: (_, alertId) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'detail', alertId] });
    },
  });
}

