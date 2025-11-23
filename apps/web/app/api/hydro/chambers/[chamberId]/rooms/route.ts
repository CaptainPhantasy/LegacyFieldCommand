/**
 * GET /api/hydro/chambers/[chamberId]/rooms - List rooms in chamber
 * POST /api/hydro/chambers/[chamberId]/rooms - Add room to chamber
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const addRoomSchema = z.object({
  room_id: z.string().uuid('Invalid room ID'),
});

const chamberIdSchema = z.object({
  chamberId: z.string().uuid('Invalid chamber ID'),
});

/**
 * GET /api/hydro/chambers/[chamberId]/rooms
 * List rooms in chamber
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

    // Get rooms in chamber
    const { data: chamberRooms, error } = await supabase
      .from('chamber_rooms')
      .select(`
        room_id,
        assigned_at,
        rooms:room_id (
          id,
          name,
          room_type,
          level,
          area_sqft
        )
      `)
      .eq('chamber_id', chamberId)
      .order('assigned_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { rooms: chamberRooms || [] },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/chambers/[chamberId]/rooms');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/hydro/chambers/[chamberId]/rooms
 * Add room to chamber
 */
export async function POST(
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

    const validationResult = await validateRequest(request, addRoomSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const { room_id } = validationResult.data!;

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

    // Verify room belongs to same job
    const { data: room } = await supabase
      .from('rooms')
      .select('id, job_id')
      .eq('id', room_id)
      .single();

    if (!room) {
      throw new ApiError('Room not found', 404, 'NOT_FOUND');
    }

    if (room.job_id !== chamber.job_id) {
      throw new ApiError('Room must belong to the same job as the chamber', 400, 'VALIDATION_ERROR');
    }

    // Check if already associated
    const { data: existing } = await supabase
      .from('chamber_rooms')
      .select('chamber_id, room_id')
      .eq('chamber_id', chamberId)
      .eq('room_id', room_id)
      .single();

    if (existing) {
      throw new ApiError('Room is already in this chamber', 409, 'CONFLICT');
    }

    // Add room to chamber
    const { data: chamberRoom, error } = await supabase
      .from('chamber_rooms')
      .insert({
        chamber_id: chamberId,
        room_id: room_id,
      })
      .select(`
        room_id,
        assigned_at,
        rooms:room_id (
          id,
          name,
          room_type,
          level
        )
      `)
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(chamberRoom, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/chambers/[chamberId]/rooms');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

