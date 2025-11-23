/**
 * Send Email Form Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSendEmail, useEmailTemplates } from '@/hooks/useCommunications';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function SendEmailForm() {
  const router = useRouter();
  const sendEmail = useSendEmail();
  const { data: templates } = useEmailTemplates();
  const [formData, setFormData] = useState({
    recipientEmail: '',
    recipientName: '',
    jobId: '',
    templateId: '',
    subject: '',
    body: '',
  });
  const [useTemplate, setUseTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTemplate = templates?.find((t) => t.id === formData.templateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.recipientEmail.trim()) {
      setError('Recipient email is required');
      return;
    }

    if (useTemplate && !formData.templateId) {
      setError('Please select a template');
      return;
    }

    if (!useTemplate && (!formData.subject || !formData.body)) {
      setError('Subject and body are required when not using a template');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendEmail.mutateAsync({
        recipientEmail: formData.recipientEmail,
        recipientName: formData.recipientName || undefined,
        jobId: formData.jobId || undefined,
        templateId: useTemplate ? formData.templateId : undefined,
        subject: useTemplate ? undefined : formData.subject,
        body: useTemplate ? undefined : formData.body,
      });
      router.push('/communications');
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="glass-basic card-glass p-6 space-y-6 max-w-4xl">
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Recipient Email *
          </label>
            <Input
              type="email"
              value={formData.recipientEmail}
              onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
              placeholder="recipient@example.com"
              required
            />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Recipient Name
          </label>
          <Input
            type="text"
            value={formData.recipientName}
            onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Job ID (Optional)
          </label>
          <Input
            type="text"
            value={formData.jobId}
            onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
            placeholder="Link to a job"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={useTemplate}
              onChange={(e) => setUseTemplate(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Use Email Template
            </span>
          </label>
          {useTemplate && (
            <select
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              className="h-11 w-full rounded-lg border border-[var(--glass-border)] px-3 text-sm bg-[var(--input-bg)] text-[var(--text-primary)]"
            >
              <option value="">Select a template</option>
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {!useTemplate && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Subject *
              </label>
              <Input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject"
                required={!useTemplate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Body *
              </label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Email body"
                rows={8}
                required={!useTemplate}
              />
            </div>
          </>
        )}

        {useTemplate && selectedTemplate && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--hover-bg-subtle)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Template: {selectedTemplate.name}
            </p>
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Subject: {selectedTemplate.subject}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {selectedTemplate.body.substring(0, 100)}...
            </p>
          </div>
        )}

        <div className="p-4 rounded-lg" style={{ background: 'var(--hover-bg-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> Currently using stub implementation. Replace with real email service integration (SendGrid, Mailgun, etc.).
          </p>
        </div>

        <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Email'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/communications')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

