/**
 * Policy Detail Component
 */

'use client';

import { useState } from 'react';
import { usePolicy, useParsePolicy, useLinkPolicyToJob } from '@/hooks/usePolicies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface PolicyDetailProps {
  policyId: string;
}

export function PolicyDetail({ policyId }: PolicyDetailProps) {
  const { data, isLoading, error } = usePolicy(policyId);
  const parsePolicy = useParsePolicy();
  const linkPolicy = useLinkPolicyToJob();
  const [linkJobId, setLinkJobId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

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
              {new Date(data.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--glass-border)' }}>
          {data.status !== 'parsed' && (
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
                      ${typeof value === 'number' ? value.toLocaleString() : value}
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
                ${data.deductible.toLocaleString()}
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

