/**
 * DELETE /api/items/bulk
 * Delete multiple items
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';

const bulkDeleteSchema = z.object({
  itemIds: z.array(z.string().uuid('Invalid item ID')).min(1, 'At least one item ID is required'),
});

export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, bulkDeleteSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const { itemIds } = validationResult.data;

    // Verify all items exist and user has access
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, board_id')
      .in('id', itemIds);

    if (fetchError) {
      throw new ApiError(fetchError.message, 500, 'DATABASE_ERROR');
    }

    if (!items || items.length === 0) {
      throw new ApiError('No items found', 404, 'NOT_FOUND');
    }

    if (items.length !== itemIds.length) {
      throw new ApiError('Some items were not found', 404, 'NOT_FOUND');
    }

    // Verify board access for all items (all items must be from accessible boards)
    const boardIds = [...new Set(items.map(item => item.board_id))];
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id')
      .in('id', boardIds);

    if (boardsError) {
      throw new ApiError(boardsError.message, 500, 'DATABASE_ERROR');
    }

    if (!boards || boards.length !== boardIds.length) {
      throw new ApiError('Access denied to some boards', 403, 'FORBIDDEN');
    }

    // Delete all items (cascade will handle subitems and column_values)
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .in('id', itemIds);

    if (deleteError) {
      throw new ApiError(deleteError.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ 
      deleted: true, 
      count: itemIds.length 
    });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/items/bulk');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

