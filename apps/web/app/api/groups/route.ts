/**
 * GET /api/groups - List groups for a board
 * POST /api/groups - Create a new group
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createGroupSchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  name: z.string().min(1, 'Group name is required').max(200),
  position: z.number().int().min(0).optional(),
  color: z.string().max(20).optional(),
  is_archived: z.boolean().optional(),
});

const listGroupsQuerySchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
});

/**
 * GET /api/groups
 * List groups for a board
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listGroupsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    if (!queryResult.data) {
      throw new ApiError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }
    const { board_id } = queryResult.data;

    // Verify board access
    const { data: board } = await supabase
      .from('boards')
      .select('id, account_id')
      .eq('id', board_id)
      .single();

    if (!board) {
      throw new ApiError('Board not found', 404, 'NOT_FOUND');
    }

    // Get groups for board
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .eq('board_id', board_id)
      .eq('is_archived', false)
      .order('position', { ascending: true });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { groups: groups || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/groups');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/groups
 * Create a new group
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createGroupSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const groupData = validationResult.data;

    // Verify board access
    const { data: board } = await supabase
      .from('boards')
      .select('id, account_id')
      .eq('id', groupData.board_id)
      .single();

    if (!board) {
      throw new ApiError('Board not found', 404, 'NOT_FOUND');
    }

    // Get max position if not provided
    let position = groupData.position;
    if (position === undefined) {
      const { data: maxGroup } = await supabase
        .from('groups')
        .select('position')
        .eq('board_id', groupData.board_id)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      position = maxGroup ? (maxGroup.position as number) + 1 : 0;
    }

    // Create group
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        ...groupData,
        position,
        is_archived: groupData.is_archived || false,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(group, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/groups');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

