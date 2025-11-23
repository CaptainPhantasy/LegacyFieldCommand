/**
 * GET /api/hydro/chambers/[chamberId] - Get chamber details
 * PUT /api/hydro/chambers/[chamberId] - Update chamber
 * DELETE /api/hydro/chambers/[chamberId] - Delete chamber
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateChamberSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  chamber_type: z.enum(['standard', 'containment', 'negative_pressure']).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

const chamberIdSchema = z.object({
  chamberId: z.string().uuid('Invalid chamber ID'),
});

/**
 * GET /api/hydro/chambers/[chamberId]
 * Get chamber with all related data (rooms, readings, moisture points, equipment)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chamberId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { chamberId } = await params;

    const paramResult = validateParams({ chamberId }, chamberIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Get chamber with all related data
    const { data: chamber, error: chamberError } = await supabase
      .from('chambers')
      .select(`
        *,
        job:job_id (
          id,
          title,
          status
        ),
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
      .eq('id', chamberId)
      .single();

    if (chamberError || !chamber) {
      throw new ApiError('Chamber not found', 404, 'NOT_FOUND');
    }

    // Get latest psychrometric readings
    const { data: latestReadings } = await supabase
      .from('psychrometric_readings')
      .select('*')
      .eq('chamber_id', chamberId)
      .order('reading_date', { ascending: false })
      .order('reading_time', { ascending: false })
      .limit(10);

    // Get moisture points count
    const { count: moistureCount } = await supabase
      .from('moisture_points')
      .select('*', { count: 'exact', head: true })
      .eq('chamber_id', chamberId);

    // Get active equipment
    const { data: equipment } = await supabase
      .from('equipment_logs')
      .select('*')
      .eq('chamber_id', chamberId)
      .eq('is_active', true);

    return NextResponse.json(
      {
        success: true,
        data: {
          chamber,
          latest_readings: latestReadings || [],
          moisture_point_count: moistureCount || 0,
          active_equipment: equipment || [],
        },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/chambers/[chamberId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/hydro/chambers/[chamberId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chamberId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { chamberId } = await params;

    const paramResult = validateParams({ chamberId }, chamberIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const validationResult = await validateRequest(request, updateChamberSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Verify chamber access via job
    const { data: chamber } = await supabase
      .from('chambers')
      .select('job_id, jobs!chambers_job_id_fkey(lead_tech_id)')
      .eq('id', chamberId)
      .single();

    if (!chamber) {
      throw new ApiError('Chamber not found', 404, 'NOT_FOUND');
    }

    // Check access
    const job = chamber.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    const { data: updatedChamber, error } = await supabase
      .from('chambers')
      .update(updateData)
      .eq('id', chamberId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedChamber);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/hydro/chambers/[chamberId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/hydro/chambers/[chamberId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chamberId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { chamberId } = await params;

    const paramResult = validateParams({ chamberId }, chamberIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify access
    const { data: chamber } = await supabase
      .from('chambers')
      .select('job_id, jobs!chambers_job_id_fkey(lead_tech_id)')
      .eq('id', chamberId)
      .single();

    if (!chamber) {
      throw new ApiError('Chamber not found', 404, 'NOT_FOUND');
    }

    const job = chamber.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    const { error } = await supabase
      .from('chambers')
      .delete()
      .eq('id', chamberId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/hydro/chambers/[chamberId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

