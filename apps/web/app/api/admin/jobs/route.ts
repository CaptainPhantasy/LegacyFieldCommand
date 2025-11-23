import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, parsePagination, parseSort, ApiError } from '@/lib/api/middleware'
import { onJobCreated } from '@/lib/integration/automation-rules'

/**
 * GET /api/admin/jobs
 * List all jobs with pagination, filtering, and sorting
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sortBy: string (default: 'created_at')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * - status: job_status filter
 * - leadTechId: uuid filter
 * - search: string (searches title and address)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request)
    const { page, limit, offset } = parsePagination(request)
    const { sortBy, sortOrder } = parseSort(request)
    const searchParams = request.nextUrl.searchParams

    // Build query
    let query = supabase
      .from('jobs')
      .select('*, profiles!jobs_lead_tech_id_fkey(id, email, full_name, role)', { count: 'exact' })

    // Apply filters
    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    const leadTechId = searchParams.get('leadTechId')
    if (leadTechId) {
      query = query.eq('lead_tech_id', leadTechId)
    }

    const search = searchParams.get('search')
    if (search) {
      query = query.or(`title.ilike.%${search}%,address_line_1.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy || 'created_at', { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: jobs, error, count } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      jobs: jobs || [],
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
 * POST /api/admin/jobs
 * Create a new job
 * 
 * Body:
 * {
 *   title: string (required)
 *   address_line_1: string (required)
 *   lead_tech_id?: string | null
 *   status?: job_status (default: 'lead')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request)
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.address_line_1) {
      throw new ApiError('Title and address_line_1 are required', 400)
    }

    // Get user's account_id for job creation
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('id', user?.id)
      .single()

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title: body.title,
        address_line_1: body.address_line_1,
        lead_tech_id: body.lead_tech_id || null,
        status: body.status || 'lead',
        account_id: profile?.account_id || body.account_id || null,
      })
      .select()
      .single()

    if (jobError) {
      throw new ApiError(jobError.message, 500)
    }

    // Create default gates (all 7 gates)
    const gates = [
      { job_id: job.id, stage_name: 'Arrival', status: 'pending' },
      { job_id: job.id, stage_name: 'Intake', status: 'pending' },
      { job_id: job.id, stage_name: 'Photos', status: 'pending' },
      { job_id: job.id, stage_name: 'Moisture/Equipment', status: 'pending' },
      { job_id: job.id, stage_name: 'Scope', status: 'pending' },
      { job_id: job.id, stage_name: 'Sign-offs', status: 'pending' },
      { job_id: job.id, stage_name: 'Departure', status: 'pending' },
    ]

    const { error: gatesError } = await supabase.from('job_gates').insert(gates)

    if (gatesError) {
      // Log error but don't fail the request - gates can be created later
      console.error('Error creating default gates:', gatesError)
    }

    // Sync job to board (async, don't wait)
    if (job.account_id) {
      onJobCreated(job.id, job.account_id, supabase, user?.id || '').catch(
        (err) => console.error('Error syncing job to board:', err)
      )
    }

    return successResponse({ job }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

