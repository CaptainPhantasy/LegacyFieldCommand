/**
 * GET /api/subitems - List subitems for an item
 * POST /api/subitems - Create a new subitem
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createSubitemSchema = z.object({
  item_id: z.string().uuid('Invalid item ID'),
  name: z.string().min(1, 'Subitem name is required').max(500),
  position: z.number().int().min(0).optional(),
  is_completed: z.boolean().optional(),
});

const listSubitemsQuerySchema = z.object({
  item_id: z.string().uuid('Invalid item ID'),
});

/**
 * GET /api/subitems
 * List subitems for an item
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listSubitemsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    if (!queryResult.data) {
      throw new ApiError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }
    const { item_id } = queryResult.data;

    // Verify item access via board
    const { data: item } = await supabase
      .from('items')
      .select('id, board_id')
      .eq('id', item_id)
      .single();

    if (!item) {
      throw new ApiError('Item not found', 404, 'NOT_FOUND');
    }

    // Get subitems for item
    const { data: subitems, error } = await supabase
      .from('subitems')
      .select('*')
      .eq('item_id', item_id)
      .order('position', { ascending: true });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { subitems: subitems || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/subitems');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/subitems
 * Create a new subitem
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createSubitemSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const subitemData = validationResult.data;

    // Verify item access
    const { data: item } = await supabase
      .from('items')
      .select('id, board_id')
      .eq('id', subitemData.item_id)
      .single();

    if (!item) {
      throw new ApiError('Item not found', 404, 'NOT_FOUND');
    }

    // Get max position if not provided
    let position = subitemData.position;
    if (position === undefined) {
      const { data: maxSubitem } = await supabase
        .from('subitems')
        .select('position')
        .eq('item_id', subitemData.item_id)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      position = maxSubitem ? (maxSubitem.position as number) + 1 : 0;
    }

    // Create subitem
    const { data: subitem, error } = await supabase
      .from('subitems')
      .insert({
        ...subitemData,
        position,
        is_completed: subitemData.is_completed || false,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(subitem, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/subitems');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

