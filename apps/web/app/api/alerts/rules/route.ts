import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, parsePagination, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/alerts/rules
 * List alert rules
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request)
    const { page, limit, offset } = parsePagination(request)
    const searchParams = request.nextUrl.searchParams

    let query = supabase
      .from('alert_rules')
      .select('*', { count: 'exact' })

    // Filter by enabled status
    const enabled = searchParams.get('enabled')
    if (enabled !== null) {
      query = query.eq('enabled', enabled === 'true')
    }

    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data: rules, error, count } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      rules: rules || [],
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
 * POST /api/alerts/rules
 * Create alert rule
 * 
 * Body:
 * {
 *   name: string (required)
 *   description?: string
 *   rule_type: string (required) - 'stale_job', 'missing_artifact', 'compliance', 'custom'
 *   conditions: object (required) - Rule conditions
 *   severity: string (default: 'medium')
 *   enabled: boolean (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAdmin(request)
    const body = await request.json()

    if (!body.name || !body.rule_type || !body.conditions) {
      throw new ApiError('name, rule_type, and conditions are required', 400)
    }

    const { data: rule, error } = await supabase
      .from('alert_rules')
      .insert({
        name: body.name,
        description: body.description || null,
        rule_type: body.rule_type,
        conditions: body.conditions,
        severity: body.severity || 'medium',
        enabled: body.enabled !== false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({ rule }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

