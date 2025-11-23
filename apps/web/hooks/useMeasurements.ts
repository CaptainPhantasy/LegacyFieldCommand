/**
 * React Query hooks for measurements
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Measurement {
  id: string;
  job_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  measurement_type: '3d_scan' | 'lidar' | 'floor_plan' | 'other';
  linked_to: string | null;
  created_by: string;
  created_at: string;
}

async function fetchMeasurementsByJob(jobId: string): Promise<Measurement[]> {
  const response = await fetch(`/api/measurements/by-job/${jobId}`);
  if (!response.ok) throw new Error('Failed to fetch measurements');
  const data = await response.json();
  return data.data.measurements || [];
}

async function uploadMeasurement(formData: FormData): Promise<Measurement> {
  const response = await fetch('/api/measurements/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload measurement');
  }
  const data = await response.json();
  return data.data.measurement;
}

export function useMeasurementsByJob(jobId: string) {
  return useQuery({
    queryKey: ['measurements', 'job', jobId],
    queryFn: () => fetchMeasurementsByJob(jobId),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUploadMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadMeasurement,
    onSuccess: (_, variables) => {
      const jobId = variables.get('jobId') as string;
      if (jobId) {
        queryClient.invalidateQueries({ queryKey: ['measurements', 'job', jobId] });
      }
    },
  });
}

