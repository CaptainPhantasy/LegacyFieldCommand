/**
 * PUT /api/items/[itemId]/column-values - Update column values for an item
 * This endpoint handles updating multiple column values at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { fireTriggers } from '@/lib/automation/trigger';

const updateColumnValuesSchema = z.object({
  values: z.array(
    z.object({
      column_id: z.string().uuid(),
      value: z.unknown().optional().nullable(),
      text_value: z.string().optional().nullable(),
      numeric_value: z.number().optional().nullable(),
    })
  ),
});

const itemIdSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

/**
 * PUT /api/items/[itemId]/column-values
 * Update column values for an item
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
    const validationResult = await validateRequest(request, updateColumnValuesSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const { values } = validationResult.data!;

    // Verify item exists
    const { data: item } = await supabase
      .from('items')
      .select('id')
      .eq('id', itemId)
      .single();

    if (!item) {
      throw new ApiError('Item not found', 404, 'NOT_FOUND');
    }

    // Upsert column values
    const updates = values.map((val) => ({
      item_id: itemId,
      column_id: val.column_id,
      value: val.value,
      text_value: val.text_value || (typeof val.value === 'string' ? val.value : null),
      numeric_value: val.numeric_value || (typeof val.value === 'number' ? val.value : null),
    }));

    const { data: columnValues, error } = await supabase
      .from('column_values')
      .upsert(updates, {
        onConflict: 'item_id,column_id',
      })
      .select('*');

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    // Fire automation triggers for column changes
    try {
      // Get board_id from item
      const { data: itemData } = await supabase
        .from('items')
        .select('board_id')
        .eq('id', itemId)
        .single();

      if (itemData) {
        // Fire trigger for each changed column
        for (const val of values) {
          await fireTriggers('column_changed', {
            item_id: itemId,
            column_id: val.column_id,
            board_id: itemData.board_id,
            user_id: user.id,
            new_value: val.value,
          }, supabase);
        }
      }
    } catch (triggerError) {
      // Log but don't fail the request
      console.error('Error firing automation triggers:', triggerError);
    }

    return successResponse({ column_values: columnValues });
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/items/[itemId]/column-values');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

