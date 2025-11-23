import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin, errorResponse, successResponse, parsePagination, parseSort, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/templates
 * List job templates
 * 
 * Query params:
 * - page, limit: pagination
 * - type: filter by template_type
 * - carrier: filter by carrier_name
 * - enabled: filter by enabled status
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)
    const { page, limit, offset } = parsePagination(request)
    const { sortBy, sortOrder } = parseSort(request, 'created_at')
    const searchParams = request.nextUrl.searchParams

    let query = supabase
      .from('job_templates')
      .select('*', { count: 'exact' })

    // Apply filters
    const type = searchParams.get('type')
    if (type) {
      query = query.eq('template_type', type)
    }

    const carrier = searchParams.get('carrier')
    if (carrier) {
      query = query.eq('carrier_name', carrier)
    }

    const enabled = searchParams.get('enabled')
    if (enabled !== null) {
      query = query.eq('enabled', enabled === 'true')
    } else {
      // Default to only enabled templates
      query = query.eq('enabled', true)
    }

    query = query.order(sortBy || 'created_at', { ascending: sortOrder === 'asc' })
    query = query.range(offset, offset + limit - 1)

    const { data: templates, error, count } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      templates: templates || [],
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
 * POST /api/templates
 * Create job template
 * 
 * Body:
 * {
 *   name: string (required)
 *   description?: string
 *   template_type: string (required)
 *   carrier_name?: string
 *   program_name?: string
 *   default_line_items?: object[]
 *   required_gates?: string[]
 *   required_fields?: object
 *   default_metadata?: object
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAdmin(request)
    const body = await request.json()

    if (!body.name || !body.template_type) {
      throw new ApiError('name and template_type are required', 400)
    }

    const { data: template, error } = await supabase
      .from('job_templates')
      .insert({
        name: body.name,
        description: body.description || null,
        template_type: body.template_type,
        carrier_name: body.carrier_name || null,
        program_name: body.program_name || null,
        default_line_items: body.default_line_items || [],
        required_gates: body.required_gates || [],
        required_fields: body.required_fields || {},
        default_metadata: body.default_metadata || {},
        enabled: body.enabled !== false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({ template }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

