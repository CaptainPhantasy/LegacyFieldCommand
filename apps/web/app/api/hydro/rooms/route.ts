/**
 * GET /api/hydro/rooms - List rooms for a job
 * POST /api/hydro/rooms - Create a new room
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createRoomSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  floor_plan_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Room name is required').max(200),
  room_type: z.string().max(100).optional(),
  level: z.number().int().min(0).optional(),
  coordinates: z.record(z.string(), z.unknown()).optional(),
  area_sqft: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listRoomsQuerySchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  floor_plan_id: z.string().uuid().optional(),
});

/**
 * GET /api/hydro/rooms
 * List rooms for a job
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listRoomsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    if (!queryResult.data) {
      throw new ApiError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }
    const { job_id, floor_plan_id } = queryResult.data;

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
      .from('rooms')
      .select('*')
      .eq('job_id', job_id);

    if (floor_plan_id) {
      query = query.eq('floor_plan_id', floor_plan_id);
    }

    const { data: rooms, error } = await query
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { rooms: rooms || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/rooms');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/hydro/rooms
 * Create a new room
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createRoomSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const roomData = validationResult.data;

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', roomData.job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    // Check access
    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: You do not have access to this job', 403, 'FORBIDDEN');
    }

    // Create room
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        ...roomData,
        level: roomData.level || 1,
        metadata: roomData.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(room, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/rooms');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

