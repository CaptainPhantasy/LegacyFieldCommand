/**
 * GET /api/groups/[groupId] - Get group details
 * PUT /api/groups/[groupId] - Update group
 * DELETE /api/groups/[groupId] - Delete group
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  position: z.number().int().min(0).optional(),
  color: z.string().max(20).optional(),
  is_archived: z.boolean().optional(),
});

const groupIdSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

/**
 * GET /api/groups/[groupId]
 * Get group details
 */
export async function GET(
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

    // Get group with board info
    const { data: group, error } = await supabase
      .from('groups')
      .select(`
        *,
        board:board_id (
          id,
          name,
          board_type
        )
      `)
      .eq('id', groupId)
      .single();

    if (error || !group) {
      throw new ApiError('Group not found', 404, 'NOT_FOUND');
    }

    return NextResponse.json(
      {
        success: true,
        data: { group },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/groups/[groupId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/groups/[groupId]
 * Update group
 */
export async function PUT(
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

    const validationResult = await validateRequest(request, updateGroupSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Verify group exists
    const { data: group } = await supabase
      .from('groups')
      .select('id, board_id')
      .eq('id', groupId)
      .single();

    if (!group) {
      throw new ApiError('Group not found', 404, 'NOT_FOUND');
    }

    // Update group
    const { data: updatedGroup, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedGroup);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/groups/[groupId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/groups/[groupId]
 * Delete group (items will be moved to null group_id)
 */
export async function DELETE(
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

    // Verify group exists
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single();

    if (!group) {
      throw new ApiError('Group not found', 404, 'NOT_FOUND');
    }

    // Delete group (cascade will handle items)
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/groups/[groupId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

