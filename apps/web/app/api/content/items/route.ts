/**
 * GET /api/content/items - List content items for a job
 * POST /api/content/items - Create a new content item
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createContentItemSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  box_id: z.string().uuid().optional().nullable(),
  room_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required').max(2000),
  condition_before: z.string().max(100).optional(),
  condition_after: z.string().max(100).optional(),
  estimated_value: z.number().nonnegative().optional(),
  photos: z.array(z.string().uuid()).optional(),
  notes: z.string().max(1000).optional(),
});

const listContentItemsQuerySchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  box_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
});

/**
 * GET /api/content/items
 * List content items for a job
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listContentItemsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    if (!queryResult.data) {
      throw new ApiError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }
    const { job_id, box_id, room_id } = queryResult.data;

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    // Check access (lead tech or admin)
    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: You do not have access to this job', 403, 'FORBIDDEN');
    }

    // Build query
    let query = supabase
      .from('content_items')
      .select(`
        *,
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
      .eq('job_id', job_id);

    if (box_id) {
      query = query.eq('box_id', box_id);
    }

    if (room_id) {
      query = query.eq('room_id', room_id);
    }

    const { data: contentItems, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { content_items: contentItems || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/content/items');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/content/items
 * Create a new content item
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createContentItemSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const contentItemData = validationResult.data;

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', contentItemData.job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    // Check access
    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: You do not have access to this job', 403, 'FORBIDDEN');
    }

    // Create content item
    const { data: contentItem, error } = await supabase
      .from('content_items')
      .insert({
        ...contentItemData,
        photos: contentItemData.photos || [],
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(contentItem, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/content/items');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

