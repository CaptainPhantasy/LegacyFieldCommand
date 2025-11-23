/**
 * GET /api/columns/[columnId] - Get column details
 * PUT /api/columns/[columnId] - Update column
 * DELETE /api/columns/[columnId] - Delete column
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';

const columnTypeEnum = z.enum([
  'text',
  'long_text',
  'numbers',
  'status',
  'date',
  'people',
  'tags',
  'timeline',
  'link',
  'file',
  'checkbox',
  'rating',
  'formula',
  'dependency',
]);

const updateColumnSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  column_type: columnTypeEnum.optional(),
  position: z.number().int().min(0).optional(),
  width: z.number().int().min(50).max(1000).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  is_archived: z.boolean().optional(),
});

const columnIdSchema = z.object({
  columnId: z.string().uuid('Invalid column ID'),
});

/**
 * GET /api/columns/[columnId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { columnId } = await params;

    const paramResult = validateParams({ columnId }, columnIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const { data: column, error } = await supabase
      .from('columns')
      .select('*')
      .eq('id', columnId)
      .single();

    if (error || !column) {
      throw new ApiError('Column not found', 404, 'NOT_FOUND');
    }

    return successResponse({ column });
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/columns/[columnId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/columns/[columnId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { columnId } = await params;

    const paramResult = validateParams({ columnId }, columnIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const validationResult = await validateRequest(request, updateColumnSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    const { data: column, error } = await supabase
      .from('columns')
      .update(updateData)
      .eq('id', columnId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    if (!column) {
      throw new ApiError('Column not found', 404, 'NOT_FOUND');
    }

    return successResponse(column);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/columns/[columnId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/columns/[columnId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { columnId } = await params;

    const paramResult = validateParams({ columnId }, columnIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Archive column instead of deleting (preserves data)
    const { error } = await supabase
      .from('columns')
      .update({ is_archived: true })
      .eq('id', columnId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/columns/[columnId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

