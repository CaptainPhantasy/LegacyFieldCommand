/**
 * GET /api/hydro/moisture - List moisture points
 * POST /api/hydro/moisture - Create a new moisture point
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createMoisturePointSchema = z.object({
  chamber_id: z.string().uuid('Invalid chamber ID'),
  room_id: z.string().uuid().optional().nullable(),
  floor_plan_id: z.string().uuid().optional().nullable(),
  x_position: z.number().optional().nullable(),
  y_position: z.number().optional().nullable(),
  material_type: z.string().max(100).optional().nullable(),
  moisture_reading: z.number().min(0).max(1000).optional().nullable(),
  reading_unit: z.enum(['percent', 'mc', 'other']).optional(),
  notes: z.string().max(1000).optional().nullable(),
  photo_id: z.string().uuid().optional().nullable(),
});

const listMoisturePointsQuerySchema = z.object({
  chamber_id: z.string().uuid('Invalid chamber ID'),
  room_id: z.string().uuid().optional(),
  floor_plan_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * GET /api/hydro/moisture
 * List moisture points for a chamber
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const queryResult = validateQuery(request, listMoisturePointsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    const { chamber_id, room_id, floor_plan_id, limit = 100 } = queryResult.data!;

    // Verify chamber access
    const { data: chamber } = await supabase
      .from('chambers')
      .select('job_id, jobs!chambers_job_id_fkey(lead_tech_id)')
      .eq('id', chamber_id)
      .single();

    if (!chamber) {
      throw new ApiError('Chamber not found', 404, 'NOT_FOUND');
    }

    const job = chamber.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Build query
    let query = supabase
      .from('moisture_points')
      .select('*, taken_by:profiles!moisture_points_taken_by_fkey(id, email, full_name)')
      .eq('chamber_id', chamber_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (room_id) {
      query = query.eq('room_id', room_id);
    }

    if (floor_plan_id) {
      query = query.eq('floor_plan_id', floor_plan_id);
    }

    const { data: points, error } = await query;

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { moisture_points: points || [] },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/moisture');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/hydro/moisture
 * Create a new moisture point
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const validationResult = await validateRequest(request, createMoisturePointSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const pointData = validationResult.data!;

    // Verify chamber access
    const { data: chamber } = await supabase
      .from('chambers')
      .select('job_id, jobs!chambers_job_id_fkey(lead_tech_id)')
      .eq('id', pointData.chamber_id)
      .single();

    if (!chamber) {
      throw new ApiError('Chamber not found', 404, 'NOT_FOUND');
    }

    const job = chamber.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Create moisture point
    const { data: point, error } = await supabase
      .from('moisture_points')
      .insert({
        ...pointData,
        taken_by: user.id,
        reading_unit: pointData.reading_unit || 'percent',
      })
      .select('*, taken_by:profiles!moisture_points_taken_by_fkey(id, email, full_name)')
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(point, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/moisture');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

