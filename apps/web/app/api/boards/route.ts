/**
 * GET /api/boards - List all boards
 * POST /api/boards - Create a new board
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(200),
  description: z.string().max(1000).optional(),
  board_type: z.enum([
    'sales_leads',
    'estimates',
    'bdm_accounts',
    'field',
    'mitigation_ar',
    'shop_equipment',
    'commissions',
    'active_jobs',
  ]),
  account_id: z.string().uuid().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  is_template: z.boolean().optional(),
  template_id: z.string().uuid().optional(),
});

const listBoardsQuerySchema = z.object({
  account_id: z.string().uuid().optional(),
  board_type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * GET /api/boards
 * List boards with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);
    
    // Validate query parameters
    const queryResult = validateQuery(request, listBoardsQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    const { account_id, board_type, limit = 50, offset = 0 } = queryResult.data!;

    // Build query
    let query = supabase
      .from('boards')
      .select('*, created_by:profiles!boards_created_by_fkey(id, email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (account_id) {
      query = query.eq('account_id', account_id);
    }

    if (board_type) {
      query = query.eq('board_type', board_type);
    }

    // Non-admins only see boards in their account
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
        return successResponse({ boards: [], pagination: { total: 0, limit, offset } });
      }
    }

    const { data: boards, error, count } = await query;

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          boards: boards || [],
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
    const sanitized = sanitizeError(error, 'GET /api/boards');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/boards
 * Create a new board
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Only admins and owners can create boards
    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: Only admins can create boards', 403, 'FORBIDDEN');
    }

    // Validate request body
    const validationResult = await validateRequest(request, createBoardSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const boardData = validationResult.data!;

    // Create board
    const { data: board, error } = await supabase
      .from('boards')
      .insert({
        ...boardData,
        created_by: user.id,
        account_id: boardData.account_id || null,
      })
      .select('*, created_by:profiles!boards_created_by_fkey(id, email, full_name)')
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    // Create default groups for the board
    const defaultGroups = [
      { name: 'Not Started', position: 0, color: '#e0e0e0' },
      { name: 'In Progress', position: 1, color: '#f5a623' },
      { name: 'Done', position: 2, color: '#5cb85c' },
    ];

    const { error: groupsError } = await supabase
      .from('groups')
      .insert(
        defaultGroups.map((group) => ({
          ...group,
          board_id: board.id,
        }))
      );

    if (groupsError) {
      console.error('Error creating default groups:', groupsError);
      // Don't fail the request, groups can be added later
    }

    // Create default table view
    const { error: viewError } = await supabase
      .from('views')
      .insert({
        board_id: board.id,
        name: 'Table',
        view_type: 'table',
        is_default: true,
        created_by: user.id,
        settings: {
          columns: [],
          filters: [],
          sorting: [{ column: 'created_at', direction: 'desc' }],
        },
      });

    if (viewError) {
      console.error('Error creating default view:', viewError);
      // Don't fail the request
    }

    return successResponse(board, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/boards');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

