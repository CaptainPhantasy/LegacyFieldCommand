/**
 * GET /api/content/boxes - List boxes for a job
 * POST /api/content/boxes - Create a new box
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createBoxSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  box_number: z.string().min(1, 'Box number is required').max(100),
  room_of_origin_id: z.string().uuid().optional().nullable(),
  current_location: z.string().max(200).optional(),
  location_details: z.string().max(500).optional(),
  packed_date: z.string().date().optional(),
});

const listBoxesQuerySchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
});

/**
 * GET /api/content/boxes
 * List boxes for a job
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listBoxesQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    if (!queryResult.data) {
      throw new ApiError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }
    const { job_id } = queryResult.data;

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

    // Get boxes for job
    const { data: boxes, error } = await supabase
      .from('boxes')
      .select(`
        *,
        room_of_origin:room_of_origin_id (
          id,
          name,
          room_type
        )
      `)
      .eq('job_id', job_id)
      .order('box_number', { ascending: true });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { boxes: boxes || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/content/boxes');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/content/boxes
 * Create a new box
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createBoxSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const boxData = validationResult.data;

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', boxData.job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    // Check access
    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: You do not have access to this job', 403, 'FORBIDDEN');
    }

    // Check if box number already exists for this job
    const { data: existingBox } = await supabase
      .from('boxes')
      .select('id')
      .eq('job_id', boxData.job_id)
      .eq('box_number', boxData.box_number)
      .single();

    if (existingBox) {
      throw new ApiError('Box number already exists for this job', 409, 'CONFLICT');
    }

    // Create box
    const { data: box, error } = await supabase
      .from('boxes')
      .insert({
        ...boxData,
        packed_by: user.id,
        packed_date: boxData.packed_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(box, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/content/boxes');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

