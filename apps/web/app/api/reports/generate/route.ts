/**
 * POST /api/reports/generate
 * Generate a report for a job
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { generateReportPDF } from '@/lib/reports/pdf-generator';

const generateReportSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  template_id: z.string().uuid().optional(),
  report_type: z.enum(['initial', 'hydro', 'full', 'custom']),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/reports/generate
 * Generate a report PDF
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const validationResult = await validateRequest(request, generateReportSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }

    const { job_id, template_id, report_type, configuration } = validationResult.data;

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, title, lead_tech_id')
      .eq('id', job_id)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    // Check access
    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Generate report number
    const reportNumber = `RPT-${Date.now()}-${job_id.slice(0, 8).toUpperCase()}`;

    // Create report record
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        job_id,
        template_id: template_id || null,
        report_number: reportNumber,
        report_type,
        status: 'generating',
        configuration: configuration || {},
        generated_by: user.id,
      })
      .select()
      .single();

    if (reportError) {
      throw new ApiError(reportError.message, 500, 'DATABASE_ERROR');
    }

    // Generate PDF (async - update status when complete)
    try {
      const pdfPath = await generateReportPDF(job_id, report_type, configuration, supabase);

      // Update report with PDF path
      await supabase
        .from('reports')
        .update({
          status: 'completed',
          pdf_storage_path: pdfPath,
          generated_at: new Date().toISOString(),
        })
        .eq('id', report.id);
    } catch (pdfError) {
      // Update report status to failed
      await supabase
        .from('reports')
        .update({
          status: 'failed',
          error_message: pdfError instanceof Error ? pdfError.message : 'PDF generation failed',
        })
        .eq('id', report.id);

      throw new ApiError('Failed to generate PDF', 500, 'PDF_GENERATION_ERROR');
    }

    return successResponse(report);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/reports/generate');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

