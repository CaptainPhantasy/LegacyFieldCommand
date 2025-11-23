/**
 * GET /api/items/[itemId] - Get item details
 * PUT /api/items/[itemId] - Update item
 * DELETE /api/items/[itemId] - Delete item
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';
import { fireTriggers } from '@/lib/automation/trigger'
import { onBoardItemUpdated } from '@/lib/integration/automation-rules';

const updateItemSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  group_id: z.string().uuid().optional().nullable(),
  position: z.number().int().min(0).optional(),
  is_archived: z.boolean().optional(),
});

const itemIdSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

/**
 * GET /api/items/[itemId]
 * Get item with all column values and subitems
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

    // Get item with column values and subitems
    const { data: item, error } = await supabase
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
            column_type,
            settings
          )
        ),
        subitems (
          id,
          name,
          position,
          is_completed,
          completed_by,
          completed_at
        ),
        group:group_id (
          id,
          name,
          color
        ),
        board:board_id (
          id,
          name,
          board_type
        )
      `)
      .eq('id', itemId)
      .single();

    if (error || !item) {
      throw new ApiError('Item not found', 404, 'NOT_FOUND');
    }

    return NextResponse.json(
      {
        success: true,
        data: { item },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/items/[itemId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/items/[itemId]
 * Update item
 */
export async function PUT(
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

    // Validate request body
    const validationResult = await validateRequest(request, updateItemSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Update item
    const { data: item, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', itemId)
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

    if (!item) {
      throw new ApiError('Item not found', 404, 'NOT_FOUND');
    }

    // Fire automation triggers for item update
    try {
      await fireTriggers('item_updated', {
        item_id: itemId,
        board_id: item.board_id,
        user_id: user.id,
      }, supabase);
    } catch (triggerError) {
      // Log but don't fail the request
      console.error('Error firing automation triggers:', triggerError);
    }

    // Sync board item to job if linked (async, don't wait)
    onBoardItemUpdated(itemId, supabase, user.id).catch(
      (err) => console.error('Error syncing board item to job:', err)
    );

    return successResponse(item);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/items/[itemId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/items/[itemId]
 * Delete item (cascades to subitems and column values)
 */
export async function DELETE(
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

    // Delete item
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/items/[itemId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

