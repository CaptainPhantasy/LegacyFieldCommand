/**
 * DELETE /api/hydro/chambers/[chamberId]/rooms/[roomId] - Remove room from chamber
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';

const paramsSchema = z.object({
  chamberId: z.string().uuid('Invalid chamber ID'),
  roomId: z.string().uuid('Invalid room ID'),
});

/**
 * DELETE /api/hydro/chambers/[chamberId]/rooms/[roomId]
 * Remove room from chamber
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chamberId: string; roomId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { chamberId, roomId } = await params;

    const paramResult = validateParams({ chamberId, roomId }, paramsSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify chamber access via job
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

    // Remove room from chamber
    const { error } = await supabase
      .from('chamber_rooms')
      .delete()
      .eq('chamber_id', chamberId)
      .eq('room_id', roomId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ removed: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/hydro/chambers/[chamberId]/rooms/[roomId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

