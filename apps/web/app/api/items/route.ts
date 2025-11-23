/**
 * GET /api/items - List items in a board
 * POST /api/items - Create a new item
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';
import { fireTriggers } from '@/lib/automation/trigger';

const createItemSchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  group_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Item name is required').max(500),
  position: z.number().int().min(0).optional(),
});

const listItemsQuerySchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  group_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * GET /api/items
 * List items with column values
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listItemsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    const { board_id, group_id, limit = 50, offset = 0 } = queryResult.data!;

    // Verify board access
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('id', board_id)
      .single();

    if (!board) {
      throw new ApiError('Board not found', 404, 'NOT_FOUND');
    }

    // Build query
    let query = supabase
      .from('items')
      .select(`
        *,
        column_values (
          id,
          column_id,
          value,
          text_value,
          numeric_value,
          columns:column_id (
            id,
            title,
            column_type
          )
        ),
        group:group_id (
          id,
          name,
          color
        )
      `, { count: 'exact' })
      .eq('board_id', board_id)
      .eq('is_archived', false)
      .order('position')
      .range(offset, offset + limit - 1);

    // Filter by group if provided
    if (group_id) {
      query = query.eq('group_id', group_id);
    }

    const { data: items, error, count } = await query;

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          items: items || [],
          pagination: {
            total: count || 0,
            limit,
            offset,
            totalPages: Math.ceil((count || 0) / limit),
          },
        },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/items');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/items
 * Create a new item
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createItemSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const itemData = validationResult.data!;

    // Verify board access
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('id', itemData.board_id)
      .single();

    if (!board) {
      throw new ApiError('Board not found', 404, 'NOT_FOUND');
    }

    // Get max position if not provided
    let position = itemData.position;
    if (position === undefined) {
      const { data: lastItem } = await supabase
        .from('items')
        .select('position')
        .eq('board_id', itemData.board_id)
        .eq('group_id', itemData.group_id || null)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      position = lastItem ? lastItem.position + 1 : 0;
    }

    // Create item
    const { data: item, error } = await supabase
      .from('items')
      .insert({
        ...itemData,
        position,
        created_by: user.id,
      })
      .select(`
        *,
        column_values (
          id,
          column_id,
          value,
          text_value,
          numeric_value
        )
      `)
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    // Fire automation triggers for item creation
    try {
      await fireTriggers('item_created', {
        item_id: item.id,
        board_id: itemData.board_id,
        user_id: user.id,
      }, supabase);
    } catch (triggerError) {
      // Log but don't fail the request
      console.error('Error firing automation triggers:', triggerError);
    }

    return successResponse(item, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/items');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

