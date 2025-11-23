/**
 * GET /api/hydro/rooms/[roomId] - Get room details
 * PUT /api/hydro/rooms/[roomId] - Update room
 * DELETE /api/hydro/rooms/[roomId] - Delete room
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateRoomSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  room_type: z.string().max(100).optional(),
  level: z.number().int().min(0).optional(),
  floor_plan_id: z.string().uuid().optional().nullable(),
  coordinates: z.record(z.string(), z.unknown()).optional(),
  area_sqft: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const roomIdSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
});

/**
 * GET /api/hydro/rooms/[roomId]
 * Get room details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { roomId } = await params;

    const paramResult = validateParams({ roomId }, roomIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Get room with job info
    const { data: room, error } = await supabase
      .from('rooms')
      .select(`
        *,
        job:job_id (
          id,
          title,
          status,
          lead_tech_id
        ),
        floor_plan:floor_plan_id (
          id,
          name,
          level
        )
      `)
      .eq('id', roomId)
      .single();

    if (error || !room) {
      throw new ApiError('Room not found', 404, 'NOT_FOUND');
    }

    // Check access via job
    const job = room.job as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    return NextResponse.json(
      {
        success: true,
        data: { room },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/rooms/[roomId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/hydro/rooms/[roomId]
 * Update room
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { roomId } = await params;

    const paramResult = validateParams({ roomId }, roomIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const validationResult = await validateRequest(request, updateRoomSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Verify room access via job
    const { data: room } = await supabase
      .from('rooms')
      .select('job_id, jobs!rooms_job_id_fkey(lead_tech_id)')
      .eq('id', roomId)
      .single();

    if (!room) {
      throw new ApiError('Room not found', 404, 'NOT_FOUND');
    }

    const job = room.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Update room
    const { data: updatedRoom, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedRoom);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/hydro/rooms/[roomId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/hydro/rooms/[roomId]
 * Delete room
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { roomId } = await params;

    const paramResult = validateParams({ roomId }, roomIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify access
    const { data: room } = await supabase
      .from('rooms')
      .select('job_id, jobs!rooms_job_id_fkey(lead_tech_id)')
      .eq('id', roomId)
      .single();

    if (!room) {
      throw new ApiError('Room not found', 404, 'NOT_FOUND');
    }

    const job = room.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Delete room
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/hydro/rooms/[roomId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

