/**
 * Automation Trigger System
 * Detects when automation triggers should fire
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type AutomationTriggerType =
  | 'item_created'
  | 'item_updated'
  | 'column_changed'
  | 'date_reached'
  | 'status_changed'
  | 'dependency_completed';

export interface TriggerContext {
  item_id?: string;
  column_id?: string;
  old_value?: unknown;
  new_value?: unknown;
  board_id?: string;
  user_id?: string;
}

/**
 * Check if a trigger should fire based on context
 */
export async function checkTrigger(
  triggerType: AutomationTriggerType,
  triggerConfig: Record<string, unknown>,
  context: TriggerContext,
  supabase: SupabaseClient
): Promise<boolean> {
  switch (triggerType) {
    case 'item_created':
      return context.item_id !== undefined;

    case 'item_updated':
      return context.item_id !== undefined && context.old_value !== context.new_value;

    case 'column_changed':
      if (!context.column_id || !context.item_id) return false;
      // Check if the changed column matches the trigger config
      if (triggerConfig.column_id) {
        return context.column_id === triggerConfig.column_id;
      }
      return true;

    case 'status_changed':
      if (!context.item_id) return false;
      // Check if status changed to specific value
      if (triggerConfig.target_status) {
        return context.new_value === triggerConfig.target_status;
      }
      return context.old_value !== context.new_value;

    case 'date_reached':
      // Check if current date matches trigger date
      const targetDate = triggerConfig.date as string;
      if (!targetDate) return false;
      const today = new Date().toISOString().split('T')[0];
      return today >= targetDate;

    case 'dependency_completed':
      if (!context.item_id) return false;
      // Check if dependency item is complete
      const dependencyItemId = triggerConfig.dependency_item_id as string;
      if (!dependencyItemId) return false;
      
      const { data: dependencyItem } = await supabase
        .from('items')
        .select('is_archived')
        .eq('id', dependencyItemId)
        .single();
      
      return dependencyItem?.is_archived === false;

    default:
      return false;
  }
}

/**
 * Get all active automation rules for a board
 */
export async function getActiveAutomations(
  boardId: string,
  triggerType: AutomationTriggerType,
  supabase: SupabaseClient
) {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('board_id', boardId)
    .eq('is_active', true)
    .eq('trigger_type', triggerType);

  if (error) {
    console.error('Error fetching automations:', error);
    return [];
  }

  return data || [];
}

/**
 * Fire triggers for an event
 */
export async function fireTriggers(
  triggerType: AutomationTriggerType,
  context: TriggerContext,
  supabase: SupabaseClient
): Promise<void> {
  if (!context.board_id) {
    console.warn('No board_id in context, cannot fire triggers');
    return;
  }

  const automations = await getActiveAutomations(context.board_id, triggerType, supabase);

  for (const automation of automations) {
    // Check if trigger should fire
    const shouldFire = await checkTrigger(
      triggerType,
      automation.trigger_config as Record<string, unknown>,
      context,
      supabase
    );

    if (shouldFire) {
      // Queue automation execution (will be handled by executor)
      await queueAutomationExecution(automation.id, context, supabase);
    }
  }
}

/**
 * Queue automation execution
 */
async function queueAutomationExecution(
  ruleId: string,
  context: TriggerContext,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from('automation_executions')
    .insert({
      rule_id: ruleId,
      item_id: context.item_id,
      trigger_data: context as unknown as Record<string, unknown>,
      execution_status: 'pending',
    });

  if (error) {
    console.error('Error queueing automation execution:', error);
  }
}

