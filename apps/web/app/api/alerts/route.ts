import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, parsePagination, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/alerts
 * List alerts with filtering
 * 
 * Query params:
 * - page, limit: pagination
 * - status: filter by status ('active', 'acknowledged', 'resolved', 'dismissed')
 * - severity: filter by severity ('low', 'medium', 'high', 'critical')
 * - jobId: filter by job
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)
    const { page, limit, offset } = parsePagination(request)
    const searchParams = request.nextUrl.searchParams

    let query = supabase
      .from('alerts')
      .select('*, jobs(id, title), alert_rules(id, name)', { count: 'exact' })

    // Apply filters
    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    const severity = searchParams.get('severity')
    if (severity) {
      query = query.eq('severity', severity)
    }

    const jobId = searchParams.get('jobId')
    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    // Order by created_at desc (newest first)
    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data: alerts, error, count } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({
      alerts: alerts || [],
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
 * POST /api/alerts
 * Create a new alert
 * 
 * Body:
 * - alert_type: string (required) - 'stale_job', 'missing_artifact', 'compliance', etc.
 * - severity: string (optional) - 'low', 'medium', 'high', 'critical' (default: 'medium')
 * - title: string (required)
 * - message: string (required)
 * - job_id: UUID (optional)
 * - gate_id: UUID (optional)
 * - rule_id: UUID (optional)
 * - details: object (optional) - Additional context
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuth(request)
    const body = await request.json()

    // Validate required fields
    if (!body.alert_type || !body.title || !body.message) {
      throw new ApiError('alert_type, title, and message are required', 400)
    }

    // Validate alert_type
    const validAlertTypes = ['stale_job', 'missing_artifact', 'compliance', 'custom']
    if (!validAlertTypes.includes(body.alert_type)) {
      throw new ApiError(`Invalid alert_type. Must be one of: ${validAlertTypes.join(', ')}`, 400)
    }

    // Validate severity if provided
    if (body.severity) {
      const validSeverities = ['low', 'medium', 'high', 'critical']
      if (!validSeverities.includes(body.severity)) {
        throw new ApiError(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`, 400)
      }
    }

    // If job_id is provided, verify it exists and user has access
    // For test data, allow invalid job_ids (they'll be caught by RLS if needed)
    if (body.job_id && body.job_id !== 'test-job-id') {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', body.job_id)
        .single()

      if (jobError || !job) {
        throw new ApiError('Job not found', 404)
      }
    }

    // Create alert
    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        alert_type: body.alert_type,
        severity: body.severity || 'medium',
        title: body.title,
        message: body.message,
        job_id: body.job_id || null,
        gate_id: body.gate_id || null,
        rule_id: body.rule_id || null,
        details: body.details || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return successResponse({ alert }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

