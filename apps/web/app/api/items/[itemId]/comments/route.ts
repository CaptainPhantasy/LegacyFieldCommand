/**
 * GET /api/items/[itemId]/comments - List comments for an item
 * POST /api/items/[itemId]/comments - Create a new comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const itemIdSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment too long'),
});

/**
 * GET /api/items/[itemId]/comments
 * List comments for an item (ordered by created_at desc)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { itemId } = await params;

    // Validate params
    const paramResult = validateParams({ itemId }, itemIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify item access via board
    const { data: item } = await supabase
      .from('items')
      .select('id, board_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      throw new ApiError('Item not found', 404, 'NOT_FOUND');
    }

    // Get comments with user info
    const { data: comments, error } = await supabase
      .from('item_comments')
      .select(`
        id,
        item_id,
        user_id,
        content,
        created_at,
        updated_at,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { comments: comments || [] },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/items/[itemId]/comments');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/items/[itemId]/comments
 * Create a new comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { itemId } = await params;

    // Validate params
    const paramResult = validateParams({ itemId }, itemIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Validate request body
    const validationResult = await validateRequest(request, createCommentSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const { content } = validationResult.data;

    // Verify item access via board
    const { data: item } = await supabase
      .from('items')
      .select('id, board_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      throw new ApiError('Item not found', 404, 'NOT_FOUND');
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('item_comments')
      .insert({
        item_id: itemId,
        user_id: user.id,
        content,
      })
      .select(`
        id,
        item_id,
        user_id,
        content,
        created_at,
        updated_at,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `)
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    // Log activity
    try {
      await supabase
        .from('item_activity_logs')
        .insert({
          item_id: itemId,
          user_id: user.id,
          action: 'comment_added',
          details: { comment_id: comment.id },
        });
    } catch (activityError) {
      // Log but don't fail the request
      console.error('Error logging activity:', activityError);
    }

    return successResponse(comment, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/items/[itemId]/comments');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

