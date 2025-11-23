/**
 * POST /api/hydro/floor-plans/[floorPlanId]/upload - Upload floor plan image
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';

const floorPlanIdSchema = z.object({
  floorPlanId: z.string().uuid('Invalid floor plan ID'),
});

/**
 * POST /api/hydro/floor-plans/[floorPlanId]/upload
 * Upload floor plan image (handles FormData with file)
 */
export async function POST(
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

    // Verify floor plan access via job
    const { data: floorPlan } = await supabase
      .from('floor_plans')
      .select('job_id, jobs!floor_plans_job_id_fkey(lead_tech_id)')
      .eq('id', floorPlanId)
      .single();

    if (!floorPlan) {
      throw new ApiError('Floor plan not found', 404, 'NOT_FOUND');
    }

    // Get job to verify access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', floorPlan.job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError('File is required', 400, 'VALIDATION_ERROR');
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      throw new ApiError('File must be an image', 400, 'VALIDATION_ERROR');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new ApiError('File size must be less than 10MB', 400, 'VALIDATION_ERROR');
    }

    // Generate storage path
    const fileExt = file.name.split('.').pop();
    const fileName = `${floorPlanId}-${Date.now()}.${fileExt}`;
    const storagePath = `floor-plans/${floorPlan.job_id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('job-documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new ApiError(`Upload failed: ${uploadError.message}`, 500, 'UPLOAD_ERROR');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('job-documents')
      .getPublicUrl(storagePath);

    // Update floor plan with storage path
    const { data: updatedFloorPlan, error: updateError } = await supabase
      .from('floor_plans')
      .update({ image_storage_path: storagePath })
      .eq('id', floorPlanId)
      .select()
      .single();

    if (updateError) {
      throw new ApiError(updateError.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({
      floor_plan: updatedFloorPlan,
      storage_url: urlData.publicUrl,
    });
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/hydro/floor-plans/[floorPlanId]/upload');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

