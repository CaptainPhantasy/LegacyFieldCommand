/**
 * Automation Rules for Job ↔ Board Integration
 * Creates automation rules for automatic sync
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { syncJobToBoard, syncBoardToJob } from './sync-service';

/**
 * Create automation rule: Auto-create board item when job created
 */
export async function createJobToBoardAutoSyncRule(
  boardId: string,
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  // Check if rule already exists
  const { data: existingRule } = await supabase
    .from('automation_rules')
    .select('id')
    .eq('board_id', boardId)
    .eq('trigger_type', 'item_created')
    .eq('is_active', true)
    .single();

  if (existingRule) {
    return existingRule.id;
  }

  // Create rule
  const { data: rule, error } = await supabase
    .from('automation_rules')
    .insert({
      board_id: boardId,
      name: 'Auto-sync Job to Board',
      description: 'Automatically create board item when job is created',
      is_active: true,
      trigger_type: 'item_created',
      trigger_config: {
        source: 'job',
      },
      conditions: [],
      actions: [
        {
          type: 'create_item',
          config: {
            name: '{{job.title}}',
            board_id: boardId,
          },
        },
        {
          type: 'update_column',
          config: {
            column_type: 'link',
            value: '{{job.id}}',
          },
        },
      ],
      created_by: userId,
    })
    .select('id')
    .single();

  if (error || !rule) {
    console.error('Failed to create automation rule:', error);
    return null;
  }

  return rule.id;
}

/**
 * Setup integration automation rules for a board
 */
export async function setupIntegrationAutomation(
  boardId: string,
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; rule_ids: string[] }> {
  const ruleIds: string[] = [];

  // Note: Actual automation will be handled by webhooks/triggers
  // This function sets up the rules that will be triggered

  // For now, we'll use database triggers or webhooks
  // The automation engine will handle the actual execution

  return {
    success: true,
    rule_ids: ruleIds,
  };
}

/**
 * Trigger sync when job is created (called from job creation endpoint)
 */
export async function onJobCreated(
  jobId: string,
  accountId: string,
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // Find "Active Jobs" board
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('board_type', 'active_jobs')
      .eq('account_id', accountId)
      .single();

    if (board) {
      await syncJobToBoard(jobId, board.id, supabase, userId);
    }
  } catch (error) {
    console.error('Error syncing job to board on creation:', error);
    // Don't throw - sync failure shouldn't break job creation
  }
}

/**
 * Trigger sync when job is updated (called from job update endpoint)
 */
export async function onJobUpdated(
  jobId: string,
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // Find linked board item
    const { data: boardItem } = await supabase
      .from('items')
      .select(`
        id,
        board_id,
        column_values!inner (
          column_id,
          columns!inner (
            column_type
          )
        )
      `)
      .eq('column_values.columns.column_type', 'link')
      .contains('column_values.value', [jobId])
      .single();

    if (boardItem) {
      await syncJobToBoard(jobId, boardItem.board_id, supabase, userId);
    }
  } catch (error) {
    console.error('Error syncing job to board on update:', error);
    // Don't throw - sync failure shouldn't break job update
  }
}

/**
 * Trigger sync when board item is updated (called from item update endpoint)
 */
export async function onBoardItemUpdated(
  itemId: string,
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // Check if item has job link
    const { data: item } = await supabase
      .from('items')
      .select(`
        id,
        column_values (
          column_id,
          value,
          columns:column_id (
            column_type
          )
        )
      `)
      .eq('id', itemId)
      .single();

    if (!item) return;

    const linkColumn = item.column_values?.find(
      (cv: any) => cv.columns?.column_type === 'link'
    );
    const jobId = linkColumn?.value as string | undefined;

    if (jobId) {
      await syncBoardToJob(itemId, supabase, userId);
    }
  } catch (error) {
    console.error('Error syncing board item to job on update:', error);
    // Don't throw - sync failure shouldn't break item update
  }
}

