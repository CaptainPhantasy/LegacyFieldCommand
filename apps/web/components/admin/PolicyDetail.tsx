/**
 * Policy Detail Component
 */

'use client';

import { useState } from 'react';
import { usePolicy, useParsePolicy, useLinkPolicyToJob, useUploadPolicy } from '@/hooks/usePolicies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PolicyDetailProps {
  policyId: string;
}

export function PolicyDetail({ policyId }: PolicyDetailProps) {
  const router = useRouter();
  const { data, isLoading, error } = usePolicy(policyId);
  const parsePolicy = useParsePolicy();
  const linkPolicy = useLinkPolicyToJob();
  const uploadPolicy = useUploadPolicy();
  const [linkJobId, setLinkJobId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleParse = async () => {
    setActionError(null);
    setIsParsing(true);
    try {
      await parsePolicy.mutateAsync({ policyId, forceReparse: false });
    } catch (err: any) {
      setActionError(err.message || 'Failed to parse policy');
    } finally {
      setIsParsing(false);
    }
  };

  const handleLink = async () => {
    if (!linkJobId.trim()) {
      setActionError('Please enter a job ID');
      return;
    }
    setActionError(null);
    setIsLinking(true);
    try {
      await linkPolicy.mutateAsync({ policyId, jobId: linkJobId });
      setLinkJobId('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to link policy');
    } finally {
      setIsLinking(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setActionError('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setActionError('File size must be less than 10MB');
        return;
      }
      setUploadFile(file);
      setActionError(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setActionError('Please select a PDF file');
      return;
    }
    setActionError(null);
    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', uploadFile);
      if (data?.policy_number) uploadFormData.append('policyNumber', data.policy_number);
      if (data?.carrier_name) uploadFormData.append('carrierName', data.carrier_name);
      uploadFormData.append('jobId', linkJobId || '');

      await uploadPolicy.mutateAsync(uploadFormData);
      router.refresh(); // Refresh to show new policy
      setUploadFile(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to upload PDF');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading policy...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading policy. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Policy Info */}
      <div className="glass-basic card-glass p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Policy Information
          </h2>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background:
                data.status === 'parsed'
                  ? 'var(--success)'
                  : data.status === 'error'
                  ? 'var(--error)'
                  : 'var(--accent)',
              color: '#ffffff',
            }}
          >
            {data.status}
          </span>
        </div>

        {actionError && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-500">{actionError}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Policy Number
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {data.policy_number || '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Carrier
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {data.carrier_name || '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Linked Job
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {data.jobs ? (
                <Link
                  href={`/field/jobs/${data.jobs.id}`}
                  className="hover:opacity-80"
                  style={{ color: 'var(--accent)' }}
                >
                  {data.jobs.title}
                </Link>
              ) : (
                'Not linked'
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Created
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {typeof window !== 'undefined' ? new Date(data.created_at).toLocaleString() : data.created_at}
            </p>
          </div>
        </div>

        {/* PDF Upload Section - Show if no PDF exists */}
        {!data.pdf_url && !data.pdf_storage_path && (
          <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--glass-border)' }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Upload Policy PDF
              </label>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Maximum file size: 10MB
                  </p>
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading || !uploadFile}
                >
                  {isUploading ? 'Uploading...' : 'Upload PDF'}
                </Button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Or <Link href="/admin/policies/upload" className="underline" style={{ color: 'var(--accent)' }}>upload a new policy</Link>
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--glass-border)' }}>
          {data.status !== 'parsed' && data.pdf_url && (
            <div>
              <Button onClick={handleParse} disabled={isParsing}>
                {isParsing ? 'Parsing...' : 'Parse Policy'}
              </Button>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Extract data from PDF (stub implementation - replace with real OCR)
              </p>
            </div>
          )}

          {!data.jobs && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Link to Job
                </label>
                <Input
                  type="text"
                  value={linkJobId}
                  onChange={(e) => setLinkJobId(e.target.value)}
                  placeholder="Enter job ID"
                />
              </div>
              <Button onClick={handleLink} disabled={isLinking || !linkJobId.trim()}>
                {isLinking ? 'Linking...' : 'Link'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Coverage Summary */}
      {data.status === 'parsed' && (
        <div className="glass-basic card-glass p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Coverage Summary
          </h2>
          {data.coverage_summary ? (
            <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
              <p className="whitespace-pre-wrap">{data.coverage_summary}</p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No coverage summary available.
            </p>
          )}

          {data.coverage_limits && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Coverage Limits
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(data.coverage_limits).map(([key, value]) => (
                  <div key={key} className="p-2 rounded" style={{ background: 'var(--hover-bg-subtle)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ${typeof value === 'number' && typeof window !== 'undefined' ? value.toLocaleString() : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.deductible && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Deductible
              </h3>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                ${typeof window !== 'undefined' ? data.deductible.toLocaleString() : data.deductible}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer */}
      {data.pdf_url && (
        <div className="glass-basic card-glass p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Policy PDF
          </h2>
          <iframe
            src={data.pdf_url}
            className="w-full h-[600px] rounded-lg border"
            style={{ borderColor: 'var(--glass-border)' }}
            title="Policy PDF"
          />
        </div>
      )}
    </div>
  );
}

