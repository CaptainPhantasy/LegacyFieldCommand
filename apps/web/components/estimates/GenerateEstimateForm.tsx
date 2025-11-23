/**
 * Generate Estimate Form Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenerateEstimate } from '@/hooks/useEstimates';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function GenerateEstimateForm() {
  const router = useRouter();
  const generateEstimate = useGenerateEstimate();
  const [formData, setFormData] = useState({
    jobId: '',
    policyId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.jobId.trim()) {
      setError('Job ID is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const estimate = await generateEstimate.mutateAsync({
        jobId: formData.jobId,
        policyId: formData.policyId || undefined,
      });
      router.push(`/estimates/${estimate.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate estimate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit} className="glass-basic card-glass p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Job ID *
          </label>
          <Input
            type="text"
            value={formData.jobId}
            onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
            placeholder="Enter job ID"
            required
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            The job to generate an estimate for
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Policy ID (Optional)
          </label>
          <Input
            type="text"
            value={formData.policyId}
            onChange={(e) => setFormData({ ...formData, policyId: e.target.value })}
            placeholder="Enter policy ID to apply coverage"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Link a policy to apply coverage limits
          </p>
        </div>

        <div className="p-4 rounded-lg" style={{ background: 'var(--hover-bg-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> This will use AI to analyze job data (photos, gates, scope) and generate line items.
            Currently using stub implementation - replace with real AI integration.
          </p>
        </div>

        <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <Button type="submit" disabled={isSubmitting || !formData.jobId.trim()}>
            {isSubmitting ? 'Generating...' : 'Generate Estimate'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/estimates')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

