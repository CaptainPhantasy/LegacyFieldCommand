/**
 * React Query hooks for monitoring
 */

'use client';

import { useQuery } from '@tanstack/react-query';

export interface MonitoringDashboard {
  summary: {
    activeAlerts: number;
    staleJobs: number;
    complianceRate: number;
    totalGates: number;
    completedGates: number;
  };
  jobsByStatus: Record<string, number>;
  lastUpdated: string;
}

export interface ComplianceData {
  complianceRate: number;
  totalGates: number;
  completedGates: number;
  exceptions: number;
  // Add more fields as needed
}

async function fetchMonitoringDashboard(): Promise<MonitoringDashboard> {
  const response = await fetch('/api/monitoring/dashboard');
  if (!response.ok) throw new Error('Failed to fetch monitoring dashboard');
  const data = await response.json();
  return data.data;
}

async function fetchCompliance(): Promise<ComplianceData> {
  const response = await fetch('/api/monitoring/compliance');
  if (!response.ok) throw new Error('Failed to fetch compliance data');
  const data = await response.json();
  return data.data;
}

async function fetchMissingGates(): Promise<any[]> {
  const response = await fetch('/api/monitoring/gates/missing');
  if (!response.ok) throw new Error('Failed to fetch missing gates');
  const data = await response.json();
  return data.data.gatesWithMissingArtifacts || [];
}

async function fetchStaleJobs(): Promise<any[]> {
  const response = await fetch('/api/monitoring/jobs/stale');
  if (!response.ok) throw new Error('Failed to fetch stale jobs');
  const data = await response.json();
  return data.data.staleJobs || [];
}

export function useMonitoringDashboard() {
  return useQuery({
    queryKey: ['monitoring', 'dashboard'],
    queryFn: fetchMonitoringDashboard,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useCompliance() {
  return useQuery({
    queryKey: ['monitoring', 'compliance'],
    queryFn: fetchCompliance,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMissingGates() {
  return useQuery({
    queryKey: ['monitoring', 'gates', 'missing'],
    queryFn: fetchMissingGates,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStaleJobs() {
  return useQuery({
    queryKey: ['monitoring', 'jobs', 'stale'],
    queryFn: fetchStaleJobs,
    staleTime: 2 * 60 * 1000,
  });
}

