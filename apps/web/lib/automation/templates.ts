/**
 * Automation Templates
 * Pre-configured automation rules for common workflows
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface AutomationTemplate {
  name: string;
  description: string;
  trigger_type: 'item_created' | 'item_updated' | 'column_changed' | 'status_changed';
  trigger_config: Record<string, unknown>;
  conditions: Array<{
    column_id?: string;
    operator: string;
    value?: unknown;
    logic?: 'AND' | 'OR';
  }>;
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
}

/**
 * Automation templates for common workflows
 */
export const AUTOMATION_TEMPLATES: Record<string, AutomationTemplate> = {
  // Sales → Job Creation
  sales_to_job: {
    name: 'Create Job from Sales Item',
    description: 'When a sales item status changes to "Won", create a job',
    trigger_type: 'status_changed',
    trigger_config: {
      target_status: 'Won',
    },
    conditions: [],
    actions: [
      {
        type: 'create_item',
        config: {
          name: 'New Job from {{item.name}}',
          board_id: 'active_jobs', // Will be replaced with actual board ID
        },
      },
    ],
  },

  // Job → Estimate Creation
  job_to_estimate: {
    name: 'Create Estimate from Job',
    description: 'When a job status changes to "Ready for Estimate", create an estimate',
    trigger_type: 'status_changed',
    trigger_config: {
      target_status: 'Ready for Estimate',
    },
    conditions: [],
    actions: [
      {
        type: 'create_item',
        config: {
          name: 'Estimate for {{item.name}}',
          board_id: 'estimates', // Will be replaced
        },
      },
      {
        type: 'update_column',
        config: {
          column_id: 'job_link_column_id', // Will be replaced
          value: '{{item.id}}',
        },
      },
    ],
  },

  // Estimate → AR Creation
  estimate_to_ar: {
    name: 'Create AR from Approved Estimate',
    description: 'When estimate status changes to "Approved", create AR item',
    trigger_type: 'status_changed',
    trigger_config: {
      target_status: 'Approved',
    },
    conditions: [],
    actions: [
      {
        type: 'create_item',
        config: {
          name: 'AR for {{item.name}}',
          board_id: 'mitigation_ar', // Will be replaced
        },
      },
    ],
  },

  // AR → Commission Update
  ar_to_commission: {
    name: 'Update Commission from AR',
    description: 'When AR status changes to "Paid", update commission board',
    trigger_type: 'status_changed',
    trigger_config: {
      target_status: 'Paid',
    },
    conditions: [],
    actions: [
      {
        type: 'create_item',
        config: {
          name: 'Commission - {{item.name}}',
          board_id: 'commissions', // Will be replaced
        },
      },
    ],
  },

  // Auto-assign based on column
  auto_assign_estimator: {
    name: 'Auto-assign Estimator',
    description: 'When job type is set, assign to appropriate estimator',
    trigger_type: 'column_changed',
    trigger_config: {
      column_id: 'job_type_column_id', // Will be replaced
    },
    conditions: [
      {
        column_id: 'job_type_column_id',
        operator: 'equals',
        value: 'Water Damage',
      },
    ],
    actions: [
      {
        type: 'assign_person',
        config: {
          people_column_id: 'estimator_column_id', // Will be replaced
          person_id: 'water_estimator_id', // Will be replaced
        },
      },
    ],
  },
};

/**
 * Create automation from template
 */
export async function createAutomationFromTemplate(
  templateKey: string,
  boardId: string,
  configOverrides: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const template = AUTOMATION_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }

  // Merge template with overrides
  const automationData = {
    board_id: boardId,
    name: template.name,
    description: template.description,
    is_active: true,
    trigger_type: template.trigger_type,
    trigger_config: { ...template.trigger_config, ...configOverrides },
    conditions: template.conditions.map((c) => ({
      ...c,
      column_id: configOverrides[`${c.column_id}_override`] || c.column_id,
    })),
    actions: template.actions.map((a) => ({
      ...a,
      config: {
        ...a.config,
        ...configOverrides,
        board_id: boardId,
      },
    })),
  };

  const { data: automation, error } = await supabase
    .from('automation_rules')
    .insert({
      ...automationData,
      created_by: userId,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create automation: ${error.message}`);
  }

  return automation.id;
}

