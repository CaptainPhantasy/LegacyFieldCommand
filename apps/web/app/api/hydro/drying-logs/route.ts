/**
 * GET /api/hydro/drying-logs - List drying logs for a chamber
 * POST /api/hydro/drying-logs - Create a new drying log
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createDryingLogSchema = z.object({
  chamber_id: z.string().uuid('Invalid chamber ID'),
  log_date: z.string().date('Invalid date'),
  summary_data: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(2000).optional(),
});

const listDryingLogsQuerySchema = z.object({
  chamber_id: z.string().uuid('Invalid chamber ID'),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
});

/**
 * GET /api/hydro/drying-logs
 * List drying logs for a chamber
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listDryingLogsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    if (!queryResult.data) {
      throw new ApiError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }
    const { chamber_id, start_date, end_date } = queryResult.data;

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
      .from('drying_logs')
      .select('*')
      .eq('chamber_id', chamber_id);

    if (start_date) {
      query = query.gte('log_date', start_date);
    }

    if (end_date) {
      query = query.lte('log_date', end_date);
    }

    const { data: dryingLogs, error } = await query
      .order('log_date', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { drying_logs: dryingLogs || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/drying-logs');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/hydro/drying-logs
 * Create a new drying log
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate request body
    const validationResult = await validateRequest(request, createDryingLogSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const logData = validationResult.data;

    // Verify chamber access via job
    const { data: chamber } = await supabase
      .from('chambers')
      .select('job_id, jobs!chambers_job_id_fkey(lead_tech_id)')
      .eq('id', logData.chamber_id)
      .single();

    if (!chamber) {
      throw new ApiError('Chamber not found', 404, 'NOT_FOUND');
    }

    const job = chamber.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Check if log already exists for this date
    const { data: existing } = await supabase
      .from('drying_logs')
      .select('id')
      .eq('chamber_id', logData.chamber_id)
      .eq('log_date', logData.log_date)
      .single();

    if (existing) {
      throw new ApiError('Drying log already exists for this date', 409, 'CONFLICT');
    }

    // Create drying log
    const { data: dryingLog, error } = await supabase
      .from('drying_logs')
      .insert({
        ...logData,
        logged_by: user.id,
        summary_data: logData.summary_data || {},
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(dryingLog, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/drying-logs');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

