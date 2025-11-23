/**
 * GET /api/items/[itemId]/attachments - List attachments for an item
 * POST /api/items/[itemId]/attachments - Upload a new attachment
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const itemIdSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

/**
 * GET /api/items/[itemId]/attachments
 * List attachments for an item (ordered by created_at desc)
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

    // Get attachments with user info
    const { data: attachments, error } = await supabase
      .from('item_attachments')
      .select(`
        id,
        item_id,
        user_id,
        file_name,
        storage_path,
        file_size,
        mime_type,
        created_at,
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

    // Get public URLs for attachments
    const attachmentsWithUrls = (attachments || []).map((attachment) => {
      const { data: urlData } = supabase.storage
        .from('item-attachments')
        .getPublicUrl(attachment.storage_path);

      return {
        ...attachment,
        url: urlData.publicUrl,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: { attachments: attachmentsWithUrls },
      },
      {
        headers: getCacheHeaders(60), // 1 minute cache
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/items/[itemId]/attachments');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/items/[itemId]/attachments
 * Upload a new attachment (handles FormData with file)
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

    // Verify item access via board
    const { data: item } = await supabase
      .from('items')
      .select('id, board_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      throw new ApiError('Item not found', 404, 'NOT_FOUND');
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError('File is required', 400, 'VALIDATION_ERROR');
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new ApiError('File size must be less than 50MB', 400, 'VALIDATION_ERROR');
    }

    // Generate storage path
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${itemId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `items/${itemId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('item-attachments')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new ApiError(`Upload failed: ${uploadError.message}`, 500, 'UPLOAD_ERROR');
    }

    // Create attachment record
    const { data: attachment, error: insertError } = await supabase
      .from('item_attachments')
      .insert({
        item_id: itemId,
        user_id: user.id,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select(`
        id,
        item_id,
        user_id,
        file_name,
        storage_path,
        file_size,
        mime_type,
        created_at,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `)
      .single();

    if (insertError) {
      // Try to clean up uploaded file if database insert fails
      await supabase.storage
        .from('item-attachments')
        .remove([storagePath])
        .catch(() => {}); // Ignore cleanup errors

      throw new ApiError(insertError.message, 500, 'DATABASE_ERROR');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('item-attachments')
      .getPublicUrl(storagePath);

    // Log activity
    try {
      await supabase
        .from('item_activity_logs')
        .insert({
          item_id: itemId,
          user_id: user.id,
          action: 'attachment_added',
          details: { attachment_id: attachment.id, file_name: file.name },
        });
    } catch (activityError) {
      // Log but don't fail the request
      console.error('Error logging activity:', activityError);
    }

    return successResponse(
      {
        ...attachment,
        url: urlData.publicUrl,
      },
      201
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/items/[itemId]/attachments');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

