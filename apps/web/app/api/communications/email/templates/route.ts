import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, parsePagination, parseSort, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/communications/email/templates
 * List email templates
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request)
    const { page, limit, offset } = parsePagination(request)
    const { sortBy, sortOrder } = parseSort(request, 'created_at')
    const searchParams = request.nextUrl.searchParams

    let query = supabase
      .from('email_templates')
      .select('*, profiles!email_templates_created_by_fkey(id, email, full_name)', { count: 'exact' })

    // Filter by type if provided
    const type = searchParams.get('type')
    if (type) {
      query = query.eq('template_type', type)
    }

    // Search by name
    const search = searchParams.get('search')
    if (search) {
      query = query.ilike('name', `%${search}%`)
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
 * POST /api/communications/email/templates
 * Create email template
 * 
 * Body:
 * {
 *   name: string (required)
 *   subject: string (required)
 *   body: string (required)
 *   template_type?: string
 *   variables?: string[] (list of variable names like ['customer_name', 'job_title'])
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAdmin(request)
    const body = await request.json()

    if (!body.name || !body.subject || !body.body) {
      throw new ApiError('name, subject, and body are required', 400)
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name: body.name,
        subject: body.subject,
        body: body.body,
        template_type: body.template_type || 'custom',
        variables: body.variables || [],
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

