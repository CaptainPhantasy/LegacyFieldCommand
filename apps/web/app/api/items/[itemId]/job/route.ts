/**
 * GET /api/items/[itemId]/job - Get linked job for a board item
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const itemIdSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

/**
 * GET /api/items/[itemId]/job
 * Get the job linked to a board item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { itemId } = await params;

    const paramResult = validateParams({ itemId }, itemIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify item access
    const { data: item } = await supabase
      .from('items')
      .select('id, board_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      throw new ApiError('Board item not found', 404, 'NOT_FOUND');
    }

    // Get item with column values to find job_id
    const { data: itemWithColumns } = await supabase
      .from('items')
      .select(`
        id,
        column_values (
          column_id,
          value,
          columns:column_id (
            id,
            column_type
          )
        )
      `)
      .eq('id', itemId)
      .single();

    if (!itemWithColumns) {
      throw new ApiError('Board item not found', 404, 'NOT_FOUND');
    }

    // Find job_id from link column
    const linkColumn = (itemWithColumns as any).column_values?.find(
      (cv: any) => cv.columns?.column_type === 'link'
    );
    const jobId = linkColumn?.value as string | undefined;

    if (!jobId) {
      return successResponse({ job: null });
    }

    // Get job
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      return successResponse({ job: null });
    }

    return NextResponse.json(
      {
        success: true,
        data: { job },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/items/[itemId]/job');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

