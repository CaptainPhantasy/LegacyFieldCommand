import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/admin/users/[userId]
 * Get user details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { userId } = await params

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      throw new ApiError('User not found', 404)
    }

    return successResponse({ user })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PUT /api/admin/users/[userId]
 * Update user
 * 
 * Body: Partial user fields (email, full_name, role)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { userId } = await params
    const body = await request.json()

    // Verify user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkError || !existingUser) {
      throw new ApiError('User not found', 404)
    }

    // Build update object
    const updateData: any = {}
    if (body.full_name !== undefined) updateData.full_name = body.full_name
    if (body.role !== undefined) updateData.role = body.role

    // Update email in auth if provided
    if (body.email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(userId, {
        email: body.email,
      })
      if (emailError) {
        throw new ApiError(`Failed to update email: ${emailError.message}`, 500)
      }
      updateData.email = body.email
    }

    // Update profile
    const { data: user, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      throw new ApiError(updateError.message, 500)
    }

    return successResponse({ user })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Deactivate user (soft delete by removing from active profiles)
 * Note: This doesn't delete the auth user, just marks them inactive
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { supabase } = await requireAdmin(request)
    const { userId } = await params
    const searchParams = request.nextUrl.searchParams
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - remove auth user (this cascades to profile)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

      if (deleteError) {
        throw new ApiError(deleteError.message, 500)
      }

      return successResponse({ message: 'User deleted' })
    } else {
      // Soft delete - we could add an 'active' field to profiles
      // For now, just return success (actual deactivation would require schema change)
      return successResponse({ message: 'User deactivation not yet implemented. Use ?hard=true for deletion.' })
    }
  } catch (error) {
    return errorResponse(error)
  }
}

