/**
 * GET /api/subitems/[subitemId] - Get subitem details
 * PUT /api/subitems/[subitemId] - Update subitem
 * DELETE /api/subitems/[subitemId] - Delete subitem
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateSubitemSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  position: z.number().int().min(0).optional(),
  is_completed: z.boolean().optional(),
});

const subitemIdSchema = z.object({
  subitemId: z.string().uuid('Invalid subitem ID'),
});

/**
 * GET /api/subitems/[subitemId]
 * Get subitem details
 */
export async function GET(
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

    // Get subitem with item info
    const { data: subitem, error } = await supabase
      .from('subitems')
      .select(`
        *,
        item:item_id (
          id,
          name,
          board_id
        )
      `)
      .eq('id', subitemId)
      .single();

    if (error || !subitem) {
      throw new ApiError('Subitem not found', 404, 'NOT_FOUND');
    }

    return NextResponse.json(
      {
        success: true,
        data: { subitem },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/subitems/[subitemId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/subitems/[subitemId]
 * Update subitem
 */
export async function PUT(
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

    const validationResult = await validateRequest(request, updateSubitemSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Verify subitem exists
    const { data: subitem } = await supabase
      .from('subitems')
      .select('id, item_id')
      .eq('id', subitemId)
      .single();

    if (!subitem) {
      throw new ApiError('Subitem not found', 404, 'NOT_FOUND');
    }

    // If marking as completed, set completed_by and completed_at
    const updatePayload: any = { ...updateData };
    if (updatePayload.is_completed === true) {
      updatePayload.completed_by = user.id;
      updatePayload.completed_at = new Date().toISOString();
    } else if (updatePayload.is_completed === false) {
      updatePayload.completed_by = null;
      updatePayload.completed_at = null;
    }

    // Update subitem
    const { data: updatedSubitem, error } = await supabase
      .from('subitems')
      .update(updatePayload)
      .eq('id', subitemId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedSubitem);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/subitems/[subitemId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/subitems/[subitemId]
 * Delete subitem
 */
export async function DELETE(
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

    // Verify subitem exists
    const { data: subitem } = await supabase
      .from('subitems')
      .select('id')
      .eq('id', subitemId)
      .single();

    if (!subitem) {
      throw new ApiError('Subitem not found', 404, 'NOT_FOUND');
    }

    // Delete subitem
    const { error } = await supabase
      .from('subitems')
      .delete()
      .eq('id', subitemId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/subitems/[subitemId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

