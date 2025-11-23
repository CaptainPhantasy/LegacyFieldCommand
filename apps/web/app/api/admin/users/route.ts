import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, parsePagination, parseSort, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/admin/users
 * List all users with pagination, filtering, and sorting
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - role: user_role filter
 * - search: string (searches email and full_name)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request)
    const { page, limit, offset } = parsePagination(request)
    const { sortBy, sortOrder } = parseSort(request, 'created_at')
    const searchParams = request.nextUrl.searchParams

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    // Apply filters
    const role = searchParams.get('role')
    if (role) {
      query = query.eq('role', role)
    }

    const search = searchParams.get('search')
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy || 'created_at', { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 * 
 * Body:
 * {
 *   email: string (required)
 *   password: string (required)
 *   full_name?: string
 *   role: user_role (required, default: 'field_tech')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request)
    const body = await request.json()

    // Validate required fields
    if (!body.email || !body.password) {
      throw new ApiError('Email and password are required', 400)
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm for admin-created users
    })

    if (authError || !authData.user) {
      throw new ApiError(authError?.message || 'Failed to create user', 500)
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: body.email,
        full_name: body.full_name || null,
        role: body.role || 'field_tech',
      })
      .select()
      .single()

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new ApiError(profileError.message, 500)
    }

    return successResponse({ user: profile }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

