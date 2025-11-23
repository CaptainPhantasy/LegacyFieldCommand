/**
 * React Query hooks for job templates
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface JobTemplate {
  id: string;
  name: string;
  description: string | null;
  board_type: string | null;
  default_gates: string[] | null;
  default_line_items: any | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

async function fetchTemplates(): Promise<JobTemplate[]> {
  const response = await fetch('/api/templates');
  if (!response.ok) throw new Error('Failed to fetch templates');
  const data = await response.json();
  return data.data.templates || [];
}

async function fetchTemplate(templateId: string): Promise<JobTemplate> {
  const response = await fetch(`/api/templates/${templateId}`);
  if (!response.ok) throw new Error('Failed to fetch template');
  const data = await response.json();
  return data.data.template;
}

async function applyTemplateToJob(jobId: string, templateId: string): Promise<any> {
  const response = await fetch(`/api/jobs/${jobId}/apply-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to apply template');
  }
  return response.json();
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTemplate(templateId: string) {
  return useQuery({
    queryKey: ['templates', 'detail', templateId],
    queryFn: () => fetchTemplate(templateId),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, templateId }: { jobId: string; templateId: string }) =>
      applyTemplateToJob(jobId, templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', variables.jobId] });
    },
  });
}

