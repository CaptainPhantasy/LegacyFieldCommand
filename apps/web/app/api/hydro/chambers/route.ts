/**
 * GET /api/hydro/chambers - List chambers for a job
 * POST /api/hydro/chambers - Create a new chamber
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createChamberSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  name: z.string().min(1, 'Chamber name is required').max(200),
  description: z.string().max(1000).optional(),
  chamber_type: z.enum(['standard', 'containment', 'negative_pressure']).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

const listChambersQuerySchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
});

/**
 * GET /api/hydro/chambers
 * List chambers for a job with room associations
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listChambersQuerySchema);
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

    // Get chambers with rooms
    const { data: chambers, error } = await supabase
      .from('chambers')
      .select(`
        *,
        chamber_rooms (
          room_id,
          rooms:room_id (
            id,
            name,
            room_type,
            level
          )
        )
      `)
      .eq('job_id', job_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { chambers: chambers || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/chambers');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/hydro/chambers
 * Create a new chamber
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createChamberSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const chamberData = validationResult.data;

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', chamberData.job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    // Check access
    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: You do not have access to this job', 403, 'FORBIDDEN');
    }

    // Create chamber
    const { data: chamber, error } = await supabase
      .from('chambers')
      .insert({
        ...chamberData,
        created_by: user.id,
        status: chamberData.status || 'active',
        chamber_type: chamberData.chamber_type || 'standard',
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(chamber, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/chambers');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

