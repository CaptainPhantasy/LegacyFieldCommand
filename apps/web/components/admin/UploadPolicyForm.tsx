/**
 * Upload Policy Form Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUploadPolicy } from '@/hooks/usePolicies';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function UploadPolicyForm() {
  const router = useRouter();
  const uploadPolicy = useUploadPolicy();
  const [formData, setFormData] = useState({
    file: null as File | null,
    policyNumber: '',
    carrierName: '',
    jobId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setError('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, file });
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.file) {
      setError('Please select a PDF file');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      if (formData.policyNumber) uploadFormData.append('policyNumber', formData.policyNumber);
      if (formData.carrierName) uploadFormData.append('carrierName', formData.carrierName);
      if (formData.jobId) uploadFormData.append('jobId', formData.jobId);

      await uploadPolicy.mutateAsync(uploadFormData);
      router.push('/admin/policies');
    } catch (err: any) {
      setError(err.message || 'Failed to upload policy');
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
            Policy PDF *
          </label>
          <Input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            required
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Maximum file size: 10MB
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Policy Number
          </label>
          <Input
            type="text"
            value={formData.policyNumber}
            onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
            placeholder="Optional - will be extracted if not provided"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Carrier Name
          </label>
          <Input
            type="text"
            value={formData.carrierName}
            onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
            placeholder="Optional - will be extracted if not provided"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Link to Job (Optional)
          </label>
          <Input
            type="text"
            value={formData.jobId}
            onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
            placeholder="Job ID (can link later)"
          />
        </div>

        <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <Button type="submit" disabled={isSubmitting || !formData.file}>
            {isSubmitting ? 'Uploading...' : 'Upload Policy'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/policies')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

