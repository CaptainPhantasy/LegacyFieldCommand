/**
 * GET /api/boards/[boardId] - Get board details
 * PUT /api/boards/[boardId] - Update board
 * DELETE /api/boards/[boardId] - Delete board
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateBoardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  is_template: z.boolean().optional(),
});

const boardIdSchema = z.object({
  boardId: z.string().uuid('Invalid board ID'),
});

/**
 * GET /api/boards/[boardId]
 * Get board with groups, items, columns, and views
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { boardId } = await params;

    // Validate params
    const paramResult = validateParams({ boardId }, boardIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Get board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*, created_by:profiles!boards_created_by_fkey(id, email, full_name)')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      throw new ApiError('Board not found', 404, 'NOT_FOUND');
    }

    // Get groups
    const { data: groups } = await supabase
      .from('groups')
      .select('*')
      .eq('board_id', boardId)
      .eq('is_archived', false)
      .order('position');

    // Get columns
    const { data: columns } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', boardId)
      .eq('is_archived', false)
      .order('position');

    // Get items with column values
    const { data: items } = await supabase
      .from('items')
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
      .eq('board_id', boardId)
      .eq('is_archived', false)
      .order('position');

    // Get views
    const { data: views } = await supabase
      .from('views')
      .select('*')
      .eq('board_id', boardId)
      .order('is_default', { ascending: false });

    return NextResponse.json(
      {
        success: true,
        data: {
          board,
          groups: groups || [],
          columns: columns || [],
          items: items || [],
          views: views || [],
        },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache for board details
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/boards/[boardId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/boards/[boardId]
 * Update board
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { boardId } = await params;

    // Validate params
    const paramResult = validateParams({ boardId }, boardIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Only admins and owners can update boards
    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: Only admins can update boards', 403, 'FORBIDDEN');
    }

    // Validate request body
    const validationResult = await validateRequest(request, updateBoardSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Update board
    const { data: board, error } = await supabase
      .from('boards')
      .update(updateData)
      .eq('id', boardId)
      .select('*, created_by:profiles!boards_created_by_fkey(id, email, full_name)')
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    if (!board) {
      throw new ApiError('Board not found', 404, 'NOT_FOUND');
    }

    return successResponse(board);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/boards/[boardId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/boards/[boardId]
 * Delete board (cascades to groups, items, columns, etc.)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { boardId } = await params;

    // Validate params
    const paramResult = validateParams({ boardId }, boardIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Only admins and owners can delete boards
    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: Only admins can delete boards', 403, 'FORBIDDEN');
    }

    // Delete board (cascades to related tables)
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/boards/[boardId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

