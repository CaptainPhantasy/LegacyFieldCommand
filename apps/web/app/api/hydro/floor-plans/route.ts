/**
 * GET /api/hydro/floor-plans - List floor plans for a job
 * POST /api/hydro/floor-plans - Create a new floor plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createFloorPlanSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  name: z.string().min(1, 'Floor plan name is required').max(200),
  level: z.number().int().min(0).optional(),
  image_storage_path: z.string().max(500).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  scale_factor: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listFloorPlansQuerySchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
});

/**
 * GET /api/hydro/floor-plans
 * List floor plans for a job
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listFloorPlansQuerySchema);
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

    // Get floor plans for job
    const { data: floorPlans, error } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('job_id', job_id)
      .order('level', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { floor_plans: floorPlans || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/floor-plans');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/hydro/floor-plans
 * Create a new floor plan
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createFloorPlanSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const floorPlanData = validationResult.data;

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', floorPlanData.job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    // Check access
    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: You do not have access to this job', 403, 'FORBIDDEN');
    }

    // Create floor plan
    const { data: floorPlan, error } = await supabase
      .from('floor_plans')
      .insert({
        ...floorPlanData,
        created_by: user.id,
        level: floorPlanData.level || 1,
        metadata: floorPlanData.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(floorPlan, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/floor-plans');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

