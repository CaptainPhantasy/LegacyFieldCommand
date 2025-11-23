/**
 * GET /api/columns - List columns for a board
 * POST /api/columns - Create a new column
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

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

const createColumnSchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  title: z.string().min(1, 'Column title is required').max(200),
  column_type: columnTypeEnum,
  position: z.number().int().min(0).optional(),
  width: z.number().int().min(50).max(1000).optional(),
  settings: z.record(z.unknown()).optional(),
});

const listColumnsQuerySchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
});

/**
 * GET /api/columns
 * List columns for a board
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listColumnsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    const { board_id } = queryResult.data!;

    // Get columns
    const { data: columns, error } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', board_id)
      .eq('is_archived', false)
      .order('position');

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { columns: columns || [] },
      },
      {
        headers: getCacheHeaders(300), // 5 minutes cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/columns');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/columns
 * Create a new column
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createColumnSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const columnData = validationResult.data!;

    // Verify board access
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('id', columnData.board_id)
      .single();

    if (!board) {
      throw new ApiError('Board not found', 404, 'NOT_FOUND');
    }

    // Get max position if not provided
    let position = columnData.position;
    if (position === undefined) {
      const { data: lastColumn } = await supabase
        .from('columns')
        .select('position')
        .eq('board_id', columnData.board_id)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      position = lastColumn ? lastColumn.position + 1 : 0;
    }

    // Create column
    const { data: column, error } = await supabase
      .from('columns')
      .insert({
        ...columnData,
        position,
        settings: columnData.settings || {},
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(column, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/columns');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

