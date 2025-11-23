/**
 * Estimate Detail Component
 */

'use client';

import { useState } from 'react';
import { useEstimate, useExportEstimate } from '@/hooks/useEstimates';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EstimateDetailProps {
  estimateId: string;
}

export function EstimateDetail({ estimateId }: EstimateDetailProps) {
  const { data, isLoading, error } = useEstimate(estimateId);
  const exportEstimate = useExportEstimate();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportEstimate.mutateAsync(estimateId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estimate-${estimateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export estimate:', err);
      alert('Failed to export estimate');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading estimate...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading estimate. Please try again.
      </div>
    );
  }

  const { estimate, lineItems } = data;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Estimate Info */}
      <div className="glass-basic card-glass p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Estimate Information
          </h2>
          <div className="flex gap-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background:
                  estimate.status === 'approved'
                    ? 'var(--success)'
                    : estimate.status === 'rejected'
                    ? 'var(--error)'
                    : estimate.status === 'pending'
                    ? '#f59e0b'
                    : 'var(--accent)',
                color: '#ffffff',
              }}
            >
              {estimate.status}
            </span>
            <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm">
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Job
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {estimate.jobs ? (
                <Link
                  href={`/field/jobs/${estimate.jobs.id}`}
                  className="hover:opacity-80"
                  style={{ color: 'var(--accent)' }}
                >
                  {estimate.jobs.title}
                </Link>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Policy
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {estimate.policies
                ? `${estimate.policies.policy_number} (${estimate.policies.carrier_name})`
                : 'Not linked'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Total Amount
            </label>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ${estimate.total_amount.toLocaleString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Version
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {estimate.version}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Created
            </label>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {new Date(estimate.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="glass-basic card-glass p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Line Items
        </h2>
        {lineItems.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No line items yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--glass-border)' }}>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Line #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b"
                    style={{ borderColor: 'var(--glass-border)' }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {item.line_number}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      ${item.unit_price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
                      ${item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2" style={{ borderColor: 'var(--glass-border)' }}>
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Total:
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${estimate.total_amount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

