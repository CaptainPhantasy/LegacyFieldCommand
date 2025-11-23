/**
 * PATCH /api/subitems/[subitemId]/complete - Toggle subitem completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';

const subitemIdSchema = z.object({
  subitemId: z.string().uuid('Invalid subitem ID'),
});

/**
 * PATCH /api/subitems/[subitemId]/complete
 * Toggle subitem completion status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subitemId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { subitemId } = await params;

    const paramResult = validateParams({ subitemId }, subitemIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Get current subitem
    const { data: subitem } = await supabase
      .from('subitems')
      .select('id, is_completed')
      .eq('id', subitemId)
      .single();

    if (!subitem) {
      throw new ApiError('Subitem not found', 404, 'NOT_FOUND');
    }

    // Toggle completion
    const isCompleted = !subitem.is_completed;
    const updateData: any = {
      is_completed: isCompleted,
    };

    if (isCompleted) {
      updateData.completed_by = user.id;
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_by = null;
      updateData.completed_at = null;
    }

    // Update subitem
    const { data: updatedSubitem, error } = await supabase
      .from('subitems')
      .update(updateData)
      .eq('id', subitemId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedSubitem);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PATCH /api/subitems/[subitemId]/complete');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

