/**
 * GET /api/hydro/psychrometrics - List psychrometric readings
 * POST /api/hydro/psychrometrics - Create a new reading
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createReadingSchema = z.object({
  chamber_id: z.string().uuid('Invalid chamber ID'),
  room_id: z.string().uuid().optional().nullable(),
  reading_date: z.string().date(),
  reading_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  location: z.enum(['exterior', 'unaffected', 'affected', 'hvac']),
  ambient_temp_f: z.number().min(-50).max(150).optional().nullable(),
  relative_humidity: z.number().min(0).max(100).optional().nullable(),
  grains_per_pound: z.number().min(0).max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const listReadingsQuerySchema = z.object({
  chamber_id: z.string().uuid('Invalid chamber ID'),
  room_id: z.string().uuid().optional(),
  location: z.enum(['exterior', 'unaffected', 'affected', 'hvac']).optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * GET /api/hydro/psychrometrics
 * List psychrometric readings for a chamber
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const queryResult = validateQuery(request, listReadingsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    const { chamber_id, room_id, location, start_date, end_date, limit = 50 } = queryResult.data!;

    // Verify chamber access via job
    const { data: chamber } = await supabase
      .from('chambers')
      .select('job_id, jobs!chambers_job_id_fkey(lead_tech_id)')
      .eq('id', chamber_id)
      .single();

    if (!chamber) {
      throw new ApiError('Chamber not found', 404, 'NOT_FOUND');
    }

    const job = chamber.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Build query
    let query = supabase
      .from('psychrometric_readings')
      .select('*, taken_by:profiles!psychrometric_readings_taken_by_fkey(id, email, full_name)')
      .eq('chamber_id', chamber_id)
      .order('reading_date', { ascending: false })
      .order('reading_time', { ascending: false })
      .limit(limit);

    if (room_id) {
      query = query.eq('room_id', room_id);
    }

    if (location) {
      query = query.eq('location', location);
    }

    if (start_date) {
      query = query.gte('reading_date', start_date);
    }

    if (end_date) {
      query = query.lte('reading_date', end_date);
    }

    const { data: readings, error } = await query;

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { readings: readings || [] },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/psychrometrics');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/hydro/psychrometrics
 * Create a new psychrometric reading
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const validationResult = await validateRequest(request, createReadingSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const readingData = validationResult.data!;

    // Verify chamber access
    const { data: chamber } = await supabase
      .from('chambers')
      .select('job_id, jobs!chambers_job_id_fkey(lead_tech_id)')
      .eq('id', readingData.chamber_id)
      .single();

    if (!chamber) {
      throw new ApiError('Chamber not found', 404, 'NOT_FOUND');
    }

    const job = chamber.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Create reading
    const { data: reading, error } = await supabase
      .from('psychrometric_readings')
      .insert({
        ...readingData,
        taken_by: user.id,
      })
      .select('*, taken_by:profiles!psychrometric_readings_taken_by_fkey(id, email, full_name)')
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(reading, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/psychrometrics');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

