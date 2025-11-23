/**
 * PATCH /api/groups/[groupId]/reorder - Reorder groups
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';

const reorderGroupSchema = z.object({
  position: z.number().int().min(0, 'Position must be non-negative'),
});

const groupIdSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

/**
 * PATCH /api/groups/[groupId]/reorder
 * Reorder groups by updating position
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { groupId } = await params;

    const paramResult = validateParams({ groupId }, groupIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const validationResult = await validateRequest(request, reorderGroupSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const { position } = validationResult.data!;

    // Get group to find board_id
    const { data: group } = await supabase
      .from('groups')
      .select('id, board_id, position')
      .eq('id', groupId)
      .single();

    if (!group) {
      throw new ApiError('Group not found', 404, 'NOT_FOUND');
    }

    // Update position
    const { data: updatedGroup, error } = await supabase
      .from('groups')
      .update({ position })
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedGroup);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PATCH /api/groups/[groupId]/reorder');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

