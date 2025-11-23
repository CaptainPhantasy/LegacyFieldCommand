import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/integrations/corelogic/export
 * Export job/estimate data to CoreLogic/NextGen format
 * 
 * Body:
 * {
 *   jobId: string (required)
 *   estimateId?: string (optional)
 *   format?: 'json' | 'xml' (default: 'json')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request)
    const body = await request.json()

    if (!body.jobId) {
      throw new ApiError('jobId is required', 400)
    }

    // Get job with gates
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', body.jobId)
      .single()

    if (jobError || !job) {
      throw new ApiError('Job not found', 404)
    }

    // Get estimate
    let estimate
    if (body.estimateId) {
      const { data: est } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', body.estimateId)
        .eq('job_id', body.jobId)
        .single()
      estimate = est
    } else {
      const { data: est } = await supabase
        .from('estimates')
        .select('*')
        .eq('job_id', body.jobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      estimate = est
    }

    // Get gates
    const { data: gates } = await supabase
      .from('job_gates')
      .select('*')
      .eq('job_id', body.jobId)

    // Get photos
    const { data: photos } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', body.jobId)

    const format = body.format || 'json'

    // CoreLogic/NextGen JSON format
    const corelogicData = {
      job: {
        id: job.id,
        title: job.title,
        address: job.address_line_1,
        status: job.status,
        createdAt: job.created_at,
      },
      gates: (gates || []).map((gate: any) => ({
        stage: gate.stage_name,
        status: gate.status,
        completedAt: gate.completed_at,
        requiresException: gate.requires_exception,
      })),
      photos: {
        count: photos?.length || 0,
        total: photos?.length || 0,
      },
      estimate: estimate ? {
        number: estimate.estimate_number,
        total: estimate.total_amount,
        status: estimate.status,
      } : null,
      exportedAt: new Date().toISOString(),
      format: 'corelogic-json',
    }

    if (format === 'xml') {
      // Simple XML format (can be enhanced)
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CoreLogicExport>
  <Job>
    <Id>${job.id}</Id>
    <Title>${job.title}</Title>
    <Address>${job.address_line_1}</Address>
    <Status>${job.status}</Status>
  </Job>
  <Gates>
    ${(gates || []).map((gate: any) => `
    <Gate>
      <Stage>${gate.stage_name}</Stage>
      <Status>${gate.status}</Status>
    </Gate>`).join('')}
  </Gates>
  <ExportedAt>${new Date().toISOString()}</ExportedAt>
</CoreLogicExport>`

      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="corelogic-export-${job.id}.xml"`,
        },
      })
    }

    // Mark estimate as exported if it exists
    if (estimate) {
      await supabase
        .from('estimates')
        .update({
          exported_to_corelogic: true,
          export_metadata: {
            ...estimate.export_metadata,
            corelogic: {
              exportedAt: new Date().toISOString(),
              format: 'json',
            },
          },
        })
        .eq('id', estimate.id)
    }

    return NextResponse.json({
      success: true,
      data: corelogicData,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

