/**
 * GET /api/content/boxes/[boxId] - Get box details
 * PUT /api/content/boxes/[boxId] - Update box
 * DELETE /api/content/boxes/[boxId] - Delete box
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateBoxSchema = z.object({
  box_number: z.string().min(1).max(100).optional(),
  room_of_origin_id: z.string().uuid().optional().nullable(),
  current_location: z.string().max(200).optional(),
  location_details: z.string().max(500).optional(),
  packed_date: z.string().date().optional(),
});

const boxIdSchema = z.object({
  boxId: z.string().uuid('Invalid box ID'),
});

/**
 * GET /api/content/boxes/[boxId]
 * Get box details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { boxId } = await params;

    const paramResult = validateParams({ boxId }, boxIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Get box with job and room info
    const { data: box, error } = await supabase
      .from('boxes')
      .select(`
        *,
        job:job_id (
          id,
          title,
          status,
          lead_tech_id
        ),
        room_of_origin:room_of_origin_id (
          id,
          name,
          room_type
        )
      `)
      .eq('id', boxId)
      .single();

    if (error || !box) {
      throw new ApiError('Box not found', 404, 'NOT_FOUND');
    }

    // Check access via job
    const job = box.job as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    return NextResponse.json(
      {
        success: true,
        data: { box },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/content/boxes/[boxId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/content/boxes/[boxId]
 * Update box
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { boxId } = await params;

    const paramResult = validateParams({ boxId }, boxIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const validationResult = await validateRequest(request, updateBoxSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Verify box access via job
    const { data: box } = await supabase
      .from('boxes')
      .select('job_id, jobs!boxes_job_id_fkey(lead_tech_id)')
      .eq('id', boxId)
      .single();

    if (!box) {
      throw new ApiError('Box not found', 404, 'NOT_FOUND');
    }

    const job = box.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // If updating box_number, check for conflicts
    if (updateData.box_number) {
      const { data: existingBox } = await supabase
        .from('boxes')
        .select('id')
        .eq('job_id', box.job_id)
        .eq('box_number', updateData.box_number)
        .neq('id', boxId)
        .single();

      if (existingBox) {
        throw new ApiError('Box number already exists for this job', 409, 'CONFLICT');
      }
    }

    // Update box
    const { data: updatedBox, error } = await supabase
      .from('boxes')
      .update(updateData)
      .eq('id', boxId)
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedBox);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/content/boxes/[boxId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/content/boxes/[boxId]
 * Delete box
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { boxId } = await params;

    const paramResult = validateParams({ boxId }, boxIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify access
    const { data: box } = await supabase
      .from('boxes')
      .select('job_id, jobs!boxes_job_id_fkey(lead_tech_id)')
      .eq('id', boxId)
      .single();

    if (!box) {
      throw new ApiError('Box not found', 404, 'NOT_FOUND');
    }

    const job = box.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Delete box
    const { error } = await supabase
      .from('boxes')
      .delete()
      .eq('id', boxId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/content/boxes/[boxId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

