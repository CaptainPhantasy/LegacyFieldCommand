/**
 * DELETE /api/items/[itemId]/attachments/[attachmentId] - Delete an attachment
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';

const paramsSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  attachmentId: z.string().uuid('Invalid attachment ID'),
});

/**
 * DELETE /api/items/[itemId]/attachments/[attachmentId]
 * Delete an attachment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string; attachmentId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const resolvedParams = await params;
    const { itemId, attachmentId } = resolvedParams;

    // Validate params
    const paramResult = validateParams({ itemId, attachmentId }, paramsSchema);
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

    // Get attachment to verify it exists and get storage path
    const { data: attachment, error: fetchError } = await supabase
      .from('item_attachments')
      .select('id, storage_path, user_id')
      .eq('id', attachmentId)
      .eq('item_id', itemId)
      .single();

    if (fetchError || !attachment) {
      throw new ApiError('Attachment not found', 404, 'NOT_FOUND');
    }

    // Check permissions: user can delete their own attachments, or admin can delete any
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
    const isOwner = attachment.user_id === user.id;

    if (!isAdmin && !isOwner) {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('item-attachments')
      .remove([attachment.storage_path]);

    if (storageError) {
      // Log but continue with database deletion
      console.error('Error deleting file from storage:', storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('item_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      throw new ApiError(deleteError.message, 500, 'DATABASE_ERROR');
    }

    // Log activity
    try {
      await supabase
        .from('item_activity_logs')
        .insert({
          item_id: itemId,
          user_id: user.id,
          action: 'attachment_deleted',
          details: { attachment_id: attachmentId },
        });
    } catch (activityError) {
      // Log but don't fail the request
      console.error('Error logging activity:', activityError);
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/items/[itemId]/attachments/[attachmentId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

