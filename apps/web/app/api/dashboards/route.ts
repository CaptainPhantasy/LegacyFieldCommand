/**
 * GET /api/dashboards - List dashboards
 * POST /api/dashboards - Create a new dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createDashboardSchema = z.object({
  account_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Dashboard name is required').max(200),
  description: z.string().max(1000).optional(),
  layout: z.record(z.string(), z.unknown()).optional(),
});

const listDashboardsQuerySchema = z.object({
  account_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * GET /api/dashboards
 * List dashboards with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Validate query parameters
    const queryResult = validateQuery(request, listDashboardsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    const { account_id, limit = 50, offset = 0 } = queryResult.data || {};

    // Build query
    let query = supabase
      .from('dashboards')
      .select('*, created_by:profiles!dashboards_created_by_fkey(id, email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (account_id) {
      query = query.eq('account_id', account_id);
    }

    // Non-admins only see dashboards in their account
    if (user.role !== 'admin' && user.role !== 'owner') {
      // Get user's account from their jobs
      const { data: userJobs } = await supabase
        .from('jobs')
        .select('account_id')
        .eq('lead_tech_id', user.id)
        .limit(1)
        .single();

      if (userJobs?.account_id) {
        query = query.eq('account_id', userJobs.account_id);
      } else {
        // No account access, return empty
        return successResponse({ dashboards: [], pagination: { total: 0, limit, offset } });
      }
    }

    const { data: dashboards, error, count } = await query;

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          dashboards: dashboards || [],
          pagination: {
            total: count || 0,
            limit,
            offset,
            totalPages: Math.ceil((count || 0) / limit),
          },
        },
      },
      {
        headers: getCacheHeaders(300), // 5 minutes cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/dashboards');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/dashboards
 * Create a new dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Only admins and owners can create dashboards
    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: Only admins can create dashboards', 403, 'FORBIDDEN');
    }

    // Validate request body
    const validationResult = await validateRequest(request, createDashboardSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const dashboardData = validationResult.data!;

    // Create dashboard
    const { data: dashboard, error } = await supabase
      .from('dashboards')
      .insert({
        ...dashboardData,
        created_by: user.id,
        layout: dashboardData.layout || [],
      })
      .select('*, created_by:profiles!dashboards_created_by_fkey(id, email, full_name)')
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(dashboard, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/dashboards');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

