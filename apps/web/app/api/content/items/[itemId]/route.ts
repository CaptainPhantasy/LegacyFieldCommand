/**
 * GET /api/content/items/[itemId] - Get content item details
 * PUT /api/content/items/[itemId] - Update content item
 * DELETE /api/content/items/[itemId] - Delete content item
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateContentItemSchema = z.object({
  description: z.string().min(1).max(2000).optional(),
  box_id: z.string().uuid().optional().nullable(),
  room_id: z.string().uuid().optional().nullable(),
  condition_before: z.string().max(100).optional(),
  condition_after: z.string().max(100).optional(),
  estimated_value: z.number().nonnegative().optional(),
  photos: z.array(z.string().uuid()).optional(),
  notes: z.string().max(1000).optional(),
});

const itemIdSchema = z.object({
  itemId: z.string().uuid('Invalid content item ID'),
});

/**
 * GET /api/content/items/[itemId]
 * Get content item details
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

    // Get content item with job and related info
    const { data: contentItem, error } = await supabase
      .from('content_items')
      .select(`
        *,
        job:job_id (
          id,
          title,
          status,
          lead_tech_id
        ),
        box:box_id (
          id,
          box_number
        ),
        room:room_id (
          id,
          name,
          room_type
        )
      `)
      .eq('id', itemId)
      .single();

    if (error || !contentItem) {
      throw new ApiError('Content item not found', 404, 'NOT_FOUND');
    }

    // Check access via job
    const job = contentItem.job as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    return NextResponse.json(
      {
        success: true,
        data: { content_item: contentItem },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/content/items/[itemId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/content/items/[itemId]
 * Update content item
 */
export async function PUT(
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

    const validationResult = await validateRequest(request, updateContentItemSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Verify content item access via job
    const { data: contentItem } = await supabase
      .from('content_items')
      .select('job_id, jobs!content_items_job_id_fkey(lead_tech_id)')
      .eq('id', itemId)
      .single();

    if (!contentItem) {
      throw new ApiError('Content item not found', 404, 'NOT_FOUND');
    }

    const job = contentItem.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Update content item
    const { data: updatedContentItem, error } = await supabase
      .from('content_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedContentItem);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/content/items/[itemId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/content/items/[itemId]
 * Delete content item
 */
export async function DELETE(
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

    // Verify access
    const { data: contentItem } = await supabase
      .from('content_items')
      .select('job_id, jobs!content_items_job_id_fkey(lead_tech_id)')
      .eq('id', itemId)
      .single();

    if (!contentItem) {
      throw new ApiError('Content item not found', 404, 'NOT_FOUND');
    }

    const job = contentItem.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Delete content item
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/content/items/[itemId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

