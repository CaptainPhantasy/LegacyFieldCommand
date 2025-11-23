/**
 * GET /api/reports/[reportId]/download
 * Download report PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';

const reportIdSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
});

/**
 * GET /api/reports/[reportId]/download
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
      .select('job_id, pdf_storage_path, jobs!reports_job_id_fkey(lead_tech_id)')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      throw new ApiError('Report not found', 404, 'NOT_FOUND');
    }

    const job = report.jobs as any;
    if (job?.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    if (!report.pdf_storage_path) {
      throw new ApiError('PDF not available', 404, 'PDF_NOT_FOUND');
    }

    // Get PDF from storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('reports')
      .download(report.pdf_storage_path);

    if (downloadError || !pdfData) {
      throw new ApiError('Failed to download PDF', 500, 'DOWNLOAD_ERROR');
    }

    // Convert blob to buffer
    const arrayBuffer = await pdfData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${reportId}.pdf"`,
      },
    });
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/reports/[reportId]/download');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

