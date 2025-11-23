/**
 * GET /api/dashboards/[dashboardId]/metrics - Get dashboard metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const dashboardIdSchema = z.object({
  dashboardId: z.string().uuid('Invalid dashboard ID'),
});

/**
 * GET /api/dashboards/[dashboardId]/metrics
 * Get dashboard metrics from materialized view
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

    // Verify dashboard exists
    const { data: dashboard } = await supabase
      .from('dashboards')
      .select('id')
      .eq('id', dashboardId)
      .single();

    if (!dashboard) {
      throw new ApiError('Dashboard not found', 404, 'NOT_FOUND');
    }

    // Get metrics from secure function (requires admin role)
    // This function enforces admin check and prevents direct access to materialized view
    const { data: metrics, error } = await supabase
      .rpc('get_dashboard_metrics')
      .single();

    if (error) {
      // If function doesn't exist, user is not admin, or no data, return empty metrics
      // Check if it's an access denied error
      if (error.message?.includes('Access denied') || error.message?.includes('Admin role required')) {
        throw new ApiError('Access denied. Admin role required.', 403, 'FORBIDDEN');
      }
      
      // Otherwise return empty metrics (function may not exist yet or no data)
      return NextResponse.json(
        {
          success: true,
          data: {
            metrics: {
              leads_count: 0,
              active_jobs_count: 0,
              ready_to_invoice_count: 0,
              jobs_last_7_days: 0,
              avg_job_duration_seconds: 0,
            },
          },
        },
        {
          headers: getCacheHeaders(60),
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { metrics: metrics || {} },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/dashboards/[dashboardId]/metrics');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

