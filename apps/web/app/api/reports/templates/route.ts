/**
 * GET /api/reports/templates - List report templates
 * POST /api/reports/templates - Create report template
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateQuery } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  template_type: z.enum(['initial', 'hydro', 'full', 'custom']),
  description: z.string().max(1000).optional(),
  sections: z.array(z.record(z.string(), z.unknown())).optional(),
  is_default: z.boolean().optional(),
});

const listTemplatesQuerySchema = z.object({
  template_type: z.enum(['initial', 'hydro', 'full', 'custom']).optional(),
});

/**
 * GET /api/reports/templates
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Only admins can view templates
    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: Only admins can view templates', 403, 'FORBIDDEN');
    }

    const queryResult = validateQuery(request, listTemplatesQuerySchema);
    if (queryResult.error) {
      return queryResult.error;
    }
    const { template_type } = queryResult.data || {};

    let query = supabase
      .from('report_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (template_type) {
      query = query.eq('template_type', template_type);
    }

    const { data: templates, error } = await query;

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { templates: templates || [] },
      },
      {
        headers: getCacheHeaders(300),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/reports/templates');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

/**
 * POST /api/reports/templates
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    // Only admins can create templates
    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: Only admins can create templates', 403, 'FORBIDDEN');
    }

    const validationResult = await validateRequest(request, createTemplateSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    if (!validationResult.data) {
      throw new ApiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    const templateData = validationResult.data;

    // If setting as default, unset other defaults of same type
    if (templateData.is_default) {
      await supabase
        .from('report_templates')
        .update({ is_default: false })
        .eq('template_type', templateData.template_type)
        .eq('is_default', true);
    }

    const { data: template, error } = await supabase
      .from('report_templates')
      .insert({
        ...templateData,
        created_by: user.id,
        sections: templateData.sections || [],
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return successResponse(template, 201);
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/reports/templates');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

