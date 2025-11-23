/**
 * GET /api/reports/[reportId] - Get report details
 * DELETE /api/reports/[reportId] - Delete report
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const reportIdSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
});

/**
 * GET /api/reports/[reportId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { reportId } = await params;

    const paramResult = validateParams({ reportId }, reportIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      throw new ApiError('Report not found', 404, 'NOT_FOUND');
    }

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', report.job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Get signed URL for PDF if available
    let pdfUrl: string | null = null;
    if (report.pdf_storage_path) {
      const { data: urlData } = await supabase.storage
        .from('reports')
        .createSignedUrl(report.pdf_storage_path, 3600); // 1 hour expiry

      pdfUrl = urlData?.signedUrl || null;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          report: {
            ...report,
            pdf_url: pdfUrl,
          },
        },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/reports/[reportId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * DELETE /api/reports/[reportId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { reportId } = await params;

    const paramResult = validateParams({ reportId }, reportIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify access
    const { data: report } = await supabase
      .from('reports')
      .select('job_id, jobs!reports_job_id_fkey(lead_tech_id)')
      .eq('id', reportId)
      .single();

    if (!report) {
      throw new ApiError('Report not found', 404, 'NOT_FOUND');
    }

    const job = report.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Delete PDF from storage if exists
    const reportData = report as any;
    if (reportData.pdf_storage_path) {
      await supabase.storage
        .from('reports')
        .remove([reportData.pdf_storage_path]);
    }

    // Delete report record
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    const sanitized = sanitizeError(error, 'DELETE /api/reports/[reportId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

