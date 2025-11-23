/**
 * GET /api/dashboards/[dashboardId] - Get dashboard details
 * PUT /api/dashboards/[dashboardId] - Update dashboard
 * DELETE /api/dashboards/[dashboardId] - Delete dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const updateDashboardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  layout: z.record(z.string(), z.unknown()).optional(),
});

const dashboardIdSchema = z.object({
  dashboardId: z.string().uuid('Invalid dashboard ID'),
});

/**
 * GET /api/dashboards/[dashboardId]
 * Get dashboard details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dashboardId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { dashboardId } = await params;

    const paramResult = validateParams({ dashboardId }, dashboardIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Get dashboard
    const { data: dashboard, error } = await supabase
      .from('dashboards')
      .select('*, created_by:profiles!dashboards_created_by_fkey(id, email, full_name)')
      .eq('id', dashboardId)
      .single();

    if (error || !dashboard) {
      throw new ApiError('Dashboard not found', 404, 'NOT_FOUND');
    }

    return NextResponse.json(
      {
        success: true,
        data: { dashboard },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/dashboards/[dashboardId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * PUT /api/dashboards/[dashboardId]
 * Update dashboard
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ dashboardId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { dashboardId } = await params;

    const paramResult = validateParams({ dashboardId }, dashboardIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const validationResult = await validateRequest(request, updateDashboardSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const updateData = validationResult.data!;

    // Verify dashboard exists
    const { data: dashboard } = await supabase
      .from('dashboards')
      .select('id, account_id')
      .eq('id', dashboardId)
      .single();

    if (!dashboard) {
      throw new ApiError('Dashboard not found', 404, 'NOT_FOUND');
    }

    // Update dashboard
    const { data: updatedDashboard, error } = await supabase
      .from('dashboards')
      .update(updateData)
      .eq('id', dashboardId)
      .select('*, created_by:profiles!dashboards_created_by_fkey(id, email, full_name)')
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(updatedDashboard);
  } catch (error) {
    const sanitized = sanitizeError(error, 'PUT /api/dashboards/[dashboardId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/dashboards/[dashboardId]
 * Delete dashboard
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dashboardId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { dashboardId } = await params;

    const paramResult = validateParams({ dashboardId }, dashboardIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify dashboard exists
    const { data: dashboard } = await supabase
      .from('dashboards')
      .select('id')
      .eq('id', dashboardId)
      .single();

    if (!dashboard) {
      throw new ApiError('Dashboard not found', 404, 'NOT_FOUND');
    }

    // Delete dashboard
    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', dashboardId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/dashboards/[dashboardId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

