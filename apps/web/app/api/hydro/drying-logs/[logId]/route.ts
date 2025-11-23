/**
 * GET /api/hydro/drying-logs/[logId] - Get drying log details
 * PUT /api/hydro/drying-logs/[logId] - Update drying log
 * DELETE /api/hydro/drying-logs/[logId] - Delete drying log
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateDryingLogSchema = z.object({
  log_date: z.string().date().optional(),
  summary_data: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(2000).optional(),
});

const logIdSchema = z.object({
  logId: z.string().uuid('Invalid drying log ID'),
});

/**
 * GET /api/hydro/drying-logs/[logId]
 * Get drying log details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { logId } = await params;

    const paramResult = validateParams({ logId }, logIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Get drying log with chamber and job info
    const { data: dryingLog, error } = await supabase
      .from('drying_logs')
      .select(`
        *,
        chamber:chamber_id (
          id,
          name,
          job_id,
          jobs!chambers_job_id_fkey(lead_tech_id)
        )
      `)
      .eq('id', logId)
      .single();

    if (error || !dryingLog) {
      throw new ApiError('Drying log not found', 404, 'NOT_FOUND');
    }

    // Check access via chamber -> job
    const chamber = dryingLog.chamber as any;
    const job = chamber?.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    return NextResponse.json(
      {
        success: true,
        data: { drying_log: dryingLog },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/drying-logs/[logId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/hydro/drying-logs/[logId]
 * Update drying log
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { logId } = await params;

    const paramResult = validateParams({ logId }, logIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const validationResult = await validateRequest(request, updateDryingLogSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Verify access via chamber -> job
    const { data: dryingLog } = await supabase
      .from('drying_logs')
      .select(`
        id,
        chamber_id,
        chambers!drying_logs_chamber_id_fkey (
          job_id,
          jobs!chambers_job_id_fkey(lead_tech_id)
        )
      `)
      .eq('id', logId)
      .single();

    if (!dryingLog) {
      throw new ApiError('Drying log not found', 404, 'NOT_FOUND');
    }

    const chamber = dryingLog.chambers as any;
    const job = chamber?.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // If updating log_date, check for conflicts
    if (updateData.log_date) {
      const { data: existing } = await supabase
        .from('drying_logs')
        .select('id')
        .eq('chamber_id', (dryingLog as any).chamber_id)
        .eq('log_date', updateData.log_date)
        .neq('id', logId)
        .single();

      if (existing) {
        throw new ApiError('Drying log already exists for this date', 409, 'CONFLICT');
      }
    }

    // Update drying log
    const { data: updatedDryingLog, error } = await supabase
      .from('drying_logs')
      .update(updateData)
      .eq('id', logId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedDryingLog);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/hydro/drying-logs/[logId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/hydro/drying-logs/[logId]
 * Delete drying log
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { logId } = await params;

    const paramResult = validateParams({ logId }, logIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify access
    const { data: dryingLog } = await supabase
      .from('drying_logs')
      .select(`
        id,
        chamber_id,
        chambers!drying_logs_chamber_id_fkey (
          job_id,
          jobs!chambers_job_id_fkey(lead_tech_id)
        )
      `)
      .eq('id', logId)
      .single();

    if (!dryingLog) {
      throw new ApiError('Drying log not found', 404, 'NOT_FOUND');
    }

    const chamber = dryingLog.chambers as any;
    const job = chamber?.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Delete drying log
    const { error } = await supabase
      .from('drying_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/hydro/drying-logs/[logId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

