/**
 * Shared Resources Manager
 * 
 * Provides centralized access to shared data and documents
 * Used by agents to access job data, policies, templates, etc.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface JobData {
  id: string
  title: string
  status: string
  address_line_1?: string
  lead_tech_id?: string
  gates?: Array<{
    id: string
    stage_name: string
    status: string
    metadata?: Record<string, unknown>
  }>
  photos?: Array<{
    id: string
    storage_path: string
    metadata?: Record<string, unknown>
  }>
}

export interface PolicyData {
  id: string
  policy_number?: string
  carrier_name?: string
  deductible?: number
  coverage_limits?: Record<string, unknown>
  coverage_summary?: string
  pdf_storage_path?: string
  parsed_data?: Record<string, unknown>
}

export interface TemplateData {
  id: string
  name: string
  template_type: string
  sections?: Record<string, unknown>
}

export class ResourcesManager {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Get job data with related information
   */
  async getJobData(jobId: string): Promise<JobData | null> {
    const { data: job, error } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return null
    }

    // Get gates
    const { data: gates } = await this.supabase
      .from('job_gates')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at')

    // Get photos
    const { data: photos } = await this.supabase
      .from('job_photos')
      .select('id, storage_path, metadata')
      .eq('job_id', jobId)
      .order('created_at')

    return {
      id: job.id,
      title: job.title,
      status: job.status,
      address_line_1: job.address_line_1,
      lead_tech_id: job.lead_tech_id,
      gates: gates || [],
      photos: photos || [],
    }
  }

  /**
   * Get policy data
   */
  async getPolicyData(policyId: string): Promise<PolicyData | null> {
    const { data: policy, error } = await this.supabase
      .from('policies')
      .select('*')
      .eq('id', policyId)
      .single()

    if (error || !policy) {
      return null
    }

    return {
      id: policy.id,
      policy_number: policy.policy_number,
      carrier_name: policy.carrier_name,
      deductible: policy.deductible ? parseFloat(policy.deductible.toString()) : undefined,
      coverage_limits: policy.coverage_limits as Record<string, unknown> | undefined,
      coverage_summary: policy.coverage_summary,
      pdf_storage_path: policy.pdf_storage_path,
      parsed_data: policy.parsed_data as Record<string, unknown> | undefined,
    }
  }

  /**
   * Get template data
   */
  async getTemplateData(templateId: string): Promise<TemplateData | null> {
    const { data: template, error } = await this.supabase
      .from('job_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error || !template) {
      return null
    }

    return {
      id: template.id,
      name: template.name,
      template_type: template.template_type,
      sections: template.sections as Record<string, unknown> | undefined,
    }
  }

  /**
   * Get historical estimates for a job
   */
  async getHistoricalEstimates(jobId: string): Promise<Array<{
    id: string
    estimate_number: string
    total_amount: number
    line_items: Array<unknown>
  }>> {
    const { data: estimates } = await this.supabase
      .from('estimates')
      .select(`
        id,
        estimate_number,
        total_amount,
        estimate_line_items (*)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(5)

    return (estimates || []).map((est: any) => ({
      id: est.id,
      estimate_number: est.estimate_number,
      total_amount: parseFloat(est.total_amount?.toString() || '0'),
      line_items: est.estimate_line_items || [],
    }))
  }

  /**
   * Get email templates
   */
  async getEmailTemplates(): Promise<Array<{
    id: string
    name: string
    subject: string
    body: string
  }>> {
    const { data: templates } = await this.supabase
      .from('email_templates')
      .select('id, name, subject, body')
      .order('name')

    return (templates || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      body: t.body,
    }))
  }
}

