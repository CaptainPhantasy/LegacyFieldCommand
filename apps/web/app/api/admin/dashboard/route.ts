import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request)

    // Get job counts by status
    const { data: jobsByStatus, error: statusError } = await supabase
      .from('jobs')
      .select('status')

    if (statusError) {
      throw new ApiError(statusError.message, 500)
    }

    const statusCounts = (jobsByStatus || []).reduce((acc: Record<string, number>, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {})

    // Get total jobs
    const totalJobs = (jobsByStatus || []).length

    // Get jobs by tech assignment
    const { data: jobsByTech, error: techError } = await supabase
      .from('jobs')
      .select('lead_tech_id')

    if (techError) {
      throw new ApiError(techError.message, 500)
    }

    const assignedJobs = (jobsByTech || []).filter((j: any) => j.lead_tech_id).length
    const unassignedJobs = totalJobs - assignedJobs

    // Get gate completion stats
    const { data: gates, error: gatesError } = await supabase
      .from('job_gates')
      .select('status')

    if (gatesError) {
      throw new ApiError(gatesError.message, 500)
    }

    const gateStats = (gates || []).reduce((acc: Record<string, number>, gate: any) => {
      acc[gate.status] = (acc[gate.status] || 0) + 1
      return acc
    }, {})

    // Get user counts by role
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('role')

    if (usersError) {
      throw new ApiError(usersError.message, 500)
    }

    const userCounts = (users || []).reduce((acc: Record<string, number>, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentJobs, error: recentError } = await supabase
      .from('jobs')
      .select('id, title, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      throw new ApiError(recentError.message, 500)
    }

    return successResponse({
      summary: {
        totalJobs,
        assignedJobs,
        unassignedJobs,
        totalUsers: (users || []).length,
        totalGates: (gates || []).length,
      },
      jobsByStatus: statusCounts,
      gateStats,
      userCounts,
      recentActivity: {
        jobsCreated: recentJobs || [],
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

