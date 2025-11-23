/**
 * React Query hooks for communications
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: string;
  job_id: string | null;
  communication_type: 'email' | 'voice' | 'sms';
  recipient_email: string | null;
  recipient_name: string | null;
  subject: string | null;
  body: string | null;
  status: 'sent' | 'failed' | 'pending';
  template_id: string | null;
  created_by: string;
  created_at: string;
}

async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch('/api/communications/email/templates');
  if (!response.ok) throw new Error('Failed to fetch email templates');
  const data = await response.json();
  return data.data.templates || [];
}

async function fetchCommunicationHistory(jobId: string): Promise<Communication[]> {
  const response = await fetch(`/api/communications/history/${jobId}`);
  if (!response.ok) throw new Error('Failed to fetch communication history');
  const data = await response.json();
  return data.data.communications || [];
}

async function sendEmail(emailData: {
  jobId?: string;
  templateId?: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, string>;
}): Promise<Communication> {
  const response = await fetch('/api/communications/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send email');
  }
  const data = await response.json();
  return data.data.communication;
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['communications', 'email', 'templates'],
    queryFn: fetchEmailTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCommunicationHistory(jobId: string) {
  return useQuery({
    queryKey: ['communications', 'history', jobId],
    queryFn: () => fetchCommunicationHistory(jobId),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendEmail,
    onSuccess: (_, variables) => {
      if (variables.jobId) {
        queryClient.invalidateQueries({ queryKey: ['communications', 'history', variables.jobId] });
      }
    },
  });
}

