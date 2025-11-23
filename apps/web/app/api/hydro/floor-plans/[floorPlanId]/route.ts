/**
 * GET /api/hydro/floor-plans/[floorPlanId] - Get floor plan details
 * PUT /api/hydro/floor-plans/[floorPlanId] - Update floor plan
 * DELETE /api/hydro/floor-plans/[floorPlanId] - Delete floor plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateFloorPlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  level: z.number().int().min(0).optional(),
  image_storage_path: z.string().max(500).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  scale_factor: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const floorPlanIdSchema = z.object({
  floorPlanId: z.string().uuid('Invalid floor plan ID'),
});

/**
 * GET /api/hydro/floor-plans/[floorPlanId]
 * Get floor plan details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ floorPlanId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { floorPlanId } = await params;

    const paramResult = validateParams({ floorPlanId }, floorPlanIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Get floor plan with job info
    const { data: floorPlan, error } = await supabase
      .from('floor_plans')
      .select(`
        *,
        job:job_id (
          id,
          title,
          status,
          lead_tech_id
        )
      `)
      .eq('id', floorPlanId)
      .single();

    if (error || !floorPlan) {
      throw new ApiError('Floor plan not found', 404, 'NOT_FOUND');
    }

    // Check access via job
    const job = floorPlan.job as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    return NextResponse.json(
      {
        success: true,
        data: { floor_plan: floorPlan },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/floor-plans/[floorPlanId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/hydro/floor-plans/[floorPlanId]
 * Update floor plan
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ floorPlanId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { floorPlanId } = await params;

    const paramResult = validateParams({ floorPlanId }, floorPlanIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const validationResult = await validateRequest(request, updateFloorPlanSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Verify floor plan access via job
    const { data: floorPlan } = await supabase
      .from('floor_plans')
      .select('job_id, jobs!floor_plans_job_id_fkey(lead_tech_id)')
      .eq('id', floorPlanId)
      .single();

    if (!floorPlan) {
      throw new ApiError('Floor plan not found', 404, 'NOT_FOUND');
    }

    const job = floorPlan.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Update floor plan
    const { data: updatedFloorPlan, error } = await supabase
      .from('floor_plans')
      .update(updateData)
      .eq('id', floorPlanId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedFloorPlan);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/hydro/floor-plans/[floorPlanId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/hydro/floor-plans/[floorPlanId]
 * Delete floor plan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ floorPlanId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { floorPlanId } = await params;

    const paramResult = validateParams({ floorPlanId }, floorPlanIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify access
    const { data: floorPlan } = await supabase
      .from('floor_plans')
      .select('job_id, jobs!floor_plans_job_id_fkey(lead_tech_id)')
      .eq('id', floorPlanId)
      .single();

    if (!floorPlan) {
      throw new ApiError('Floor plan not found', 404, 'NOT_FOUND');
    }

    const job = floorPlan.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Delete floor plan
    const { error } = await supabase
      .from('floor_plans')
      .delete()
      .eq('id', floorPlanId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/hydro/floor-plans/[floorPlanId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

