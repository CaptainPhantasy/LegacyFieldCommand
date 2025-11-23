import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/monitoring/dashboard
 * Get monitoring dashboard data (alerts, compliance, stale jobs, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)

    // Get active alerts count
    const { data: activeAlerts, count: alertsCount } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get compliance metrics
    const { data: gates } = await supabase
      .from('job_gates')
      .select('status, requires_exception')

    const totalGates = gates?.length || 0
    const completedGates = gates?.filter(g => g.status === 'complete').length || 0
    const complianceRate = totalGates > 0 ? (completedGates / totalGates) * 100 : 0

    // Get stale jobs (no update in 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: staleJobs, count: staleJobsCount } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .or(`updated_at.lt.${sevenDaysAgo.toISOString()},updated_at.is.null`)
      .neq('status', 'closed')

    // Get jobs by status
    const { data: jobsByStatus } = await supabase
      .from('jobs')
      .select('status')

    const statusCounts = (jobsByStatus || []).reduce((acc: Record<string, number>, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {})

    return successResponse({
      summary: {
        activeAlerts: alertsCount || 0,
        staleJobs: staleJobsCount || 0,
        complianceRate: Math.round(complianceRate * 100) / 100,
        totalGates,
        completedGates,
      },
      jobsByStatus: statusCounts,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

