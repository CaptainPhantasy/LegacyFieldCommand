import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/communications/email/send
 * Send a templated email
 * 
 * Body:
 * {
 *   jobId?: string
 *   templateId?: string (optional, if using template)
 *   recipientEmail: string (required)
 *   recipientName?: string
 *   subject: string (required if no template)
 *   body: string (required if no template)
 *   variables?: Record<string, string> (for template variable substitution)
 * }
 * 
 * Note: In production, this would integrate with an email service (SendGrid, Mailgun, etc.)
 * For MVP, we'll create a stub that can be replaced with real email integration.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuth(request)
    const body = await request.json()

    if (!body.recipientEmail) {
      throw new ApiError('recipientEmail is required', 400)
    }

    let subject = body.subject
    let emailBody = body.body

    // If templateId provided, load template and substitute variables
    if (body.templateId) {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', body.templateId)
        .single()

      if (templateError || !template) {
        throw new ApiError('Email template not found', 404)
      }

      subject = template.subject
      emailBody = template.body

      // Substitute template variables
      const variables = body.variables || {}
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
        subject = subject.replace(regex, String(value))
        emailBody = emailBody.replace(regex, String(value))
      })
    } else {
      // No template, use provided subject and body
      if (!subject || !emailBody) {
        throw new ApiError('subject and body are required when templateId is not provided', 400)
      }
    }

    // Verify job exists if jobId provided
    if (body.jobId) {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('id', body.jobId)
        .single()

      if (jobError || !job) {
        throw new ApiError('Job not found', 404)
      }
    }

    // TODO: Integrate with email service (SendGrid, Mailgun, AWS SES, etc.)
    // For now, we'll create a stub that logs the email and saves it to the database
    // In production, this would:
    // 1. Call email service API
    // 2. Handle delivery status
    // 3. Store email record

    const emailServiceResponse = {
      messageId: `stub-${Date.now()}`,
      status: 'sent',
      provider: 'stub', // Will be 'sendgrid', 'mailgun', etc. in production
    }

    // Save communication record
    const { data: communication, error: commError } = await supabase
      .from('communications')
      .insert({
        job_id: body.jobId || null,
        type: 'email',
        direction: 'outbound',
        subject,
        body: emailBody,
        recipient_email: body.recipientEmail,
        recipient_name: body.recipientName || null,
        template_id: body.templateId || null,
        status: emailServiceResponse.status,
        metadata: {
          emailServiceResponse,
          variables: body.variables || {},
        },
        created_by: user.id,
      })
      .select()
      .single()

    if (commError) {
      throw new ApiError(commError.message, 500)
    }

    return successResponse({
      communication,
      message: 'Email sent successfully (stub implementation). Replace with real email service.',
    }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

