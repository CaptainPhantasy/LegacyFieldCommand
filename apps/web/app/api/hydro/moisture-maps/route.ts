/**
 * GET /api/hydro/moisture-maps - List moisture maps for a floor plan
 * POST /api/hydro/moisture-maps - Create a new moisture map
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createMoistureMapSchema = z.object({
  floor_plan_id: z.string().uuid('Invalid floor plan ID'),
  chamber_id: z.string().uuid('Invalid chamber ID'),
  map_date: z.string().date('Invalid date'),
  overlay_image_storage_path: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listMoistureMapsQuerySchema = z.object({
  floor_plan_id: z.string().uuid('Invalid floor plan ID'),
  chamber_id: z.string().uuid().optional(),
});

/**
 * GET /api/hydro/moisture-maps
 * List moisture maps for a floor plan
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listMoistureMapsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    if (!queryResult.data) {
      throw new ApiError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }
    const { floor_plan_id, chamber_id } = queryResult.data;

    // Verify floor plan access via job
    const { data: floorPlan } = await supabase
      .from('floor_plans')
      .select('job_id, jobs!floor_plans_job_id_fkey(lead_tech_id)')
      .eq('id', floor_plan_id)
      .single();

    if (!floorPlan) {
      throw new ApiError('Floor plan not found', 404, 'NOT_FOUND');
    }

    const job = floorPlan.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Build query
    let query = supabase
      .from('moisture_maps')
      .select(`
        *,
        floor_plan:floor_plan_id (
          id,
          name,
          level
        ),
        chamber:chamber_id (
          id,
          name
        )
      `)
      .eq('floor_plan_id', floor_plan_id);

    if (chamber_id) {
      query = query.eq('chamber_id', chamber_id);
    }

    const { data: moistureMaps, error } = await query
      .order('map_date', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { moisture_maps: moistureMaps || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/moisture-maps');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/hydro/moisture-maps
 * Create a new moisture map
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createMoistureMapSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const mapData = validationResult.data;

    // Verify floor plan access via job
    const { data: floorPlan } = await supabase
      .from('floor_plans')
      .select('job_id, jobs!floor_plans_job_id_fkey(lead_tech_id)')
      .eq('id', mapData.floor_plan_id)
      .single();

    if (!floorPlan) {
      throw new ApiError('Floor plan not found', 404, 'NOT_FOUND');
    }

    const job = floorPlan.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Verify chamber belongs to same job
    const { data: chamber } = await supabase
      .from('chambers')
      .select('id, job_id')
      .eq('id', mapData.chamber_id)
      .single();

    if (!chamber) {
      throw new ApiError('Chamber not found', 404, 'NOT_FOUND');
    }

    if (chamber.job_id !== floorPlan.job_id) {
      throw new ApiError('Chamber must belong to the same job as the floor plan', 400, 'VALIDATION_ERROR');
    }

    // Create moisture map
    const { data: moistureMap, error } = await supabase
      .from('moisture_maps')
      .insert({
        ...mapData,
        created_by: user.id,
        metadata: mapData.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(moistureMap, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/moisture-maps');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

