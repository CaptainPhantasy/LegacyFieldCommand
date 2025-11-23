/**
 * GET /api/automations - List automation rules
 * POST /api/automations - Create automation rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createAutomationSchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  is_active: z.boolean().optional(),
  trigger_type: z.enum([
    'item_created',
    'item_updated',
    'column_changed',
    'date_reached',
    'status_changed',
    'dependency_completed',
  ]),
  trigger_config: z.record(z.string(), z.unknown()).optional(),
  conditions: z.array(z.record(z.string(), z.unknown())).optional(),
  actions: z.array(z.record(z.string(), z.unknown())).min(1, 'At least one action is required'),
});

const listAutomationsQuerySchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
});

/**
 * GET /api/automations
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const queryResult = validateQuery(request, listAutomationsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    if (!queryResult.data) {
      throw new ApiError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }
    const { board_id } = queryResult.data;

    const { data: automations, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('board_id', board_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { automations: automations || [] },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/automations');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/automations
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const validationResult = await validateRequest(request, createAutomationSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const automationData = validationResult.data;

    // Verify board access
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('id', automationData.board_id)
      .single();

    if (!board) {
      throw new ApiError('Board not found', 404, 'NOT_FOUND');
    }

    // Create automation rule
    const { data: automation, error } = await supabase
      .from('automation_rules')
      .insert({
        ...automationData,
        created_by: user.id,
        trigger_config: automationData.trigger_config || {},
        conditions: automationData.conditions || [],
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(automation, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/automations');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

