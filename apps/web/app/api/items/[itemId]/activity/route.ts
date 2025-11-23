/**
 * GET /api/items/[itemId]/activity - Get activity log for an item
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const itemIdSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

/**
 * GET /api/items/[itemId]/activity
 * Get activity log entries for an item (ordered by created_at desc)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { itemId } = await params;

    // Validate params
    const paramResult = validateParams({ itemId }, itemIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify item access via board
    const { data: item } = await supabase
      .from('items')
      .select('id, board_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      throw new ApiError('Item not found', 404, 'NOT_FOUND');
    }

    // Get activity logs with user info
    const { data: activities, error } = await supabase
      .from('item_activity_logs')
      .select(`
        id,
        item_id,
        user_id,
        action,
        details,
        created_at,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to most recent 100 activities

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { activities: activities || [] },
      },
      {
        headers: getCacheHeaders(30), // 30 second cache (activity changes frequently)
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/items/[itemId]/activity');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

