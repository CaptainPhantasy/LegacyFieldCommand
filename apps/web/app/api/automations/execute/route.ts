/**
 * POST /api/automations/execute
 * Execute automation rules for a trigger event
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { fireTriggers } from '@/lib/automation/trigger';
import { evaluateConditions } from '@/lib/automation/condition';
import { executeActions } from '@/lib/automation/action';
import type { AutomationTriggerType } from '@/lib/automation/trigger';

const executeAutomationSchema = z.object({
  trigger_type: z.enum([
    'item_created',
    'item_updated',
    'column_changed',
    'date_reached',
    'status_changed',
    'dependency_completed',
  ]),
  context: z.object({
    item_id: z.string().uuid().optional(),
    column_id: z.string().uuid().optional(),
    old_value: z.unknown().optional(),
    new_value: z.unknown().optional(),
    board_id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
  }),
});

/**
 * POST /api/automations/execute
 * Execute automation rules
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const validationResult = await validateRequest(request, executeAutomationSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }

    const { trigger_type, context } = validationResult.data;

    // Add user_id to context if not provided
    const fullContext = {
      ...context,
      user_id: context.user_id || user.id,
    };

    // Fire triggers and get matching automations
    await fireTriggers(trigger_type as AutomationTriggerType, fullContext, supabase);

    // Get pending executions for this trigger
    const { data: executions } = await supabase
      .from('automation_executions')
      .select(`
        *,
        automation_rules!automation_executions_rule_id_fkey (
          id,
          conditions,
          actions
        )
      `)
      .eq('execution_status', 'pending')
      .eq('item_id', fullContext.item_id || '');

    if (!executions || executions.length === 0) {
      return successResponse({ executed: 0, message: 'No automations to execute' });
    }

    let executedCount = 0;
    const errors: string[] = [];

    // Execute each automation
    for (const execution of executions) {
      const rule = execution.automation_rules as any;
      if (!rule) continue;

      try {
        // Evaluate conditions
        const conditions = (rule.conditions || []) as Array<{
          column_id?: string;
          operator: string;
          value?: unknown;
          logic?: 'AND' | 'OR';
        }>;

        if (fullContext.item_id) {
          const conditionsMet = await evaluateConditions(
            conditions as any,
            fullContext.item_id,
            supabase
          );

          if (!conditionsMet) {
            // Update execution status to skipped
            await supabase
              .from('automation_executions')
              .update({ execution_status: 'skipped' })
              .eq('id', execution.id);
            continue;
          }
        }

        // Execute actions
        const actions = (rule.actions || []) as Array<{
          type: string;
          config: Record<string, unknown>;
        }>;

        if (fullContext.item_id && fullContext.board_id) {
          await executeActions(
            actions as any,
            fullContext.item_id,
            fullContext.board_id,
            supabase,
            user.id
          );
        }

        // Update execution status to success
        await supabase
          .from('automation_executions')
          .update({
            execution_status: 'success',
            executed_at: new Date().toISOString(),
          })
          .eq('id', execution.id);

        executedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Automation ${rule.id}: ${errorMessage}`);

        // Update execution status to failed
        await supabase
          .from('automation_executions')
          .update({
            execution_status: 'failed',
            error_message: errorMessage,
            executed_at: new Date().toISOString(),
          })
          .eq('id', execution.id);
      }
    }

    return successResponse({
      executed: executedCount,
      total: executions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/automations/execute');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

