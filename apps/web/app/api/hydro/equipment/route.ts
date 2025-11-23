/**
 * GET /api/hydro/equipment - List equipment logs
 * POST /api/hydro/equipment - Create a new equipment log
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const equipmentTypeEnum = z.enum([
  'dehumidifier',
  'air_mover',
  'air_scrubber',
  'heater',
  'moisture_meter',
  'thermal_imaging',
  'other',
]);

const createEquipmentLogSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  chamber_id: z.string().uuid().optional().nullable(),
  room_id: z.string().uuid().optional().nullable(),
  equipment_type: equipmentTypeEnum,
  equipment_name: z.string().max(200).optional().nullable(),
  asset_id: z.string().max(100).optional().nullable(),
  quantity: z.number().int().min(1).optional(),
  start_date: z.string().date(),
  end_date: z.string().date().optional().nullable(),
  is_active: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listEquipmentQuerySchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  chamber_id: z.string().uuid().optional(),
  is_active: z.coerce.boolean().optional(),
});

/**
 * GET /api/hydro/equipment
 * List equipment logs for a job
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const queryResult = validateQuery(request, listEquipmentQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    const { job_id, chamber_id, is_active } = queryResult.data!;

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Build query
    let query = supabase
      .from('equipment_logs')
      .select('*, placed_by:profiles!equipment_logs_placed_by_fkey(id, email, full_name)')
      .eq('job_id', job_id)
      .order('start_date', { ascending: false });

    if (chamber_id) {
      query = query.eq('chamber_id', chamber_id);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }

    const { data: equipment, error } = await query;

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { equipment: equipment || [] },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/hydro/equipment');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/hydro/equipment
 * Create a new equipment log
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const validationResult = await validateRequest(request, createEquipmentLogSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const equipmentData = validationResult.data!;

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', equipmentData.job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Create equipment log
    const { data: equipment, error } = await supabase
      .from('equipment_logs')
      .insert({
        ...equipmentData,
        placed_by: user.id,
        quantity: equipmentData.quantity || 1,
        is_active: equipmentData.is_active !== undefined ? equipmentData.is_active : true,
        metadata: equipmentData.metadata || {},
      })
      .select('*, placed_by:profiles!equipment_logs_placed_by_fkey(id, email, full_name)')
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(equipment, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/equipment');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

