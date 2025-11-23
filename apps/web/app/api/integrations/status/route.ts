import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * GET /api/integrations/status
 * Get integration status and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)

    // Get export statistics
    const { data: xactimateExports } = await supabase
      .from('estimates')
      .select('id', { count: 'exact', head: true })
      .eq('exported_to_xactimate', true)

    const { data: corelogicExports } = await supabase
      .from('estimates')
      .select('id', { count: 'exact', head: true })
      .eq('exported_to_corelogic', true)

    return successResponse({
      integrations: {
        xactimate: {
          enabled: true,
          exportsCount: xactimateExports?.length || 0,
          formats: ['csv', 'json'],
          status: 'active',
        },
        corelogic: {
          enabled: true,
          exportsCount: corelogicExports?.length || 0,
          formats: ['json', 'xml'],
          status: 'active',
        },
      },
      lastChecked: new Date().toISOString(),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

