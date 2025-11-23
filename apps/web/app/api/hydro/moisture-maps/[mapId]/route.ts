/**
 * GET /api/hydro/moisture-maps/[mapId] - Get moisture map details
 * DELETE /api/hydro/moisture-maps/[mapId] - Delete moisture map
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const mapIdSchema = z.object({
  mapId: z.string().uuid('Invalid moisture map ID'),
});

/**
 * GET /api/hydro/moisture-maps/[mapId]
 * Get moisture map details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { mapId } = await params;

    const paramResult = validateParams({ mapId }, mapIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Get moisture map with related info
    const { data: moistureMap, error } = await supabase
      .from('moisture_maps')
      .select(`
        *,
        floor_plan:floor_plan_id (
          id,
          name,
          level,
          job_id,
          jobs!floor_plans_job_id_fkey(lead_tech_id)
        ),
        chamber:chamber_id (
          id,
          name
        )
      `)
      .eq('id', mapId)
      .single();

    if (error || !moistureMap) {
      throw new ApiError('Moisture map not found', 404, 'NOT_FOUND');
    }

    // Check access via floor plan -> job
    const floorPlan = moistureMap.floor_plan as any;
    const job = floorPlan?.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    return NextResponse.json(
      {
        success: true,
        data: { moisture_map: moistureMap },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/moisture-maps/[mapId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/hydro/moisture-maps/[mapId]
 * Delete moisture map
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { mapId } = await params;

    const paramResult = validateParams({ mapId }, mapIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify access via floor plan -> job
    const { data: moistureMap } = await supabase
      .from('moisture_maps')
      .select(`
        id,
        floor_plan_id,
        floor_plans!moisture_maps_floor_plan_id_fkey (
          job_id,
          jobs!floor_plans_job_id_fkey(lead_tech_id)
        )
      `)
      .eq('id', mapId)
      .single();

    if (!moistureMap) {
      throw new ApiError('Moisture map not found', 404, 'NOT_FOUND');
    }

    const floorPlan = moistureMap.floor_plans as any;
    const job = floorPlan?.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Delete moisture map
    const { error } = await supabase
      .from('moisture_maps')
      .delete()
      .eq('id', mapId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/hydro/moisture-maps/[mapId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

