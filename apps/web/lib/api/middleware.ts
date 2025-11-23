/**
 * Shared API middleware utilities
 * Used across all API routes for consistent authentication, authorization, and error handling
 */

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'field_tech' | 'lead_tech' | 'estimator' | 'admin' | 'owner' | 'program_admin'
}

/**
 * Verify user is authenticated and get their profile
 */
export async function requireAuth(request: NextRequest): Promise<{
  user: AuthenticatedUser
  supabase: SupabaseClient
}> {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    throw new ApiError('Unauthorized', 401)
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    throw new ApiError('Profile not found', 404)
  }

  return {
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role as AuthenticatedUser['role'],
    },
    supabase,
  }
}

/**
 * Verify user has admin role
 */
export async function requireAdmin(request: NextRequest): Promise<{
  user: AuthenticatedUser
  supabase: SupabaseClient
}> {
  const { user, supabase } = await requireAuth(request)

  const adminRoles: AuthenticatedUser['role'][] = ['admin', 'owner', 'program_admin']
  if (!adminRoles.includes(user.role)) {
    throw new ApiError(
      `This action requires administrator privileges. Your current role is ${user.role}. Please contact your administrator if you need access.`,
      403,
      'FORBIDDEN_ADMIN_REQUIRED'
    )
  }

  return { user, supabase }
}

/**
 * Standard API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toJSON() {
    return {
      error: true,
      message: this.message,
      code: this.code || `ERROR_${this.statusCode}`,
      statusCode: this.statusCode,
    }
  }
}

/**
 * Standard error response handler
 * Now uses sanitized error handling
 */
export function errorResponse(error: unknown, statusCode?: number, code?: string): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode })
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: true,
        message: error.message,
        code: code || 'INTERNAL_ERROR',
        statusCode: statusCode || 500,
      },
      { status: statusCode || 500 }
    )
  }

  return NextResponse.json(
    {
      error: true,
      message: 'An unexpected error occurred',
      code: code || 'UNKNOWN_ERROR',
      statusCode: statusCode || 500,
    },
    { status: statusCode || 500 }
  )
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export function parsePagination(request: NextRequest): {
  page: number
  limit: number
  offset: number
} {
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function parseSort(request: NextRequest, defaultSort: string = 'created_at'): SortParams {
  const searchParams = request.nextUrl.searchParams
  const sortBy = searchParams.get('sortBy') || defaultSort
  const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'

  return { sortBy, sortOrder }
}

