/**
 * GET /api/views - List views for a board
 * POST /api/views - Create a new view
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const viewTypeEnum = z.enum(['table', 'kanban', 'calendar', 'timeline', 'chart', 'gantt']);

const createViewSchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  name: z.string().min(1, 'View name is required').max(200),
  view_type: viewTypeEnum,
  settings: z.record(z.unknown()).optional(),
  is_default: z.boolean().optional(),
});

const listViewsQuerySchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
});

/**
 * GET /api/views
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const queryResult = validateQuery(request, listViewsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    const { board_id } = queryResult.data!;

    const { data: views, error } = await supabase
      .from('views')
      .select('*')
      .eq('board_id', board_id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { views: views || [] },
      },
      {
        headers: getCacheHeaders(300),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/views');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/views
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const validationResult = await validateRequest(request, createViewSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const viewData = validationResult.data!;

    // Verify board access
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('id', viewData.board_id)
      .single();

    if (!board) {
      throw new ApiError('Board not found', 404, 'NOT_FOUND');
    }

    // If setting as default, unset other defaults
    if (viewData.is_default) {
      await supabase
        .from('views')
        .update({ is_default: false })
        .eq('board_id', viewData.board_id)
        .eq('is_default', true);
    }

    const { data: view, error } = await supabase
      .from('views')
      .insert({
        ...viewData,
        created_by: user.id,
        settings: viewData.settings || {},
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(view, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/views');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

