/**
 * Report Builder Component
 * UI for generating and managing reports
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReportBuilderProps {
  jobId: string;
}

export function ReportBuilder({ jobId }: ReportBuilderProps) {
  const router = useRouter();
  const [reportType, setReportType] = useState<'initial' | 'hydro' | 'full' | 'custom'>('full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          report_type: reportType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate report');
      }

      const data = await response.json();
      
      // Redirect to report view or show success
      router.push(`/jobs/${jobId}/reports/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Generate Report
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Select a report type to generate a PDF report for this job.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Report Type *
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="initial">Initial Report</option>
            <option value="hydro">Hydro/Drying Report</option>
            <option value="full">Full Report</option>
            <option value="custom">Custom Report</option>
          </select>
        </div>

        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {reportType === 'initial' && 'Basic job information and workflow gates.'}
            {reportType === 'hydro' && 'Drying chambers, psychrometric readings, moisture points, and equipment.'}
            {reportType === 'full' && 'Complete report with all job data, gates, photos, chambers, and equipment.'}
            {reportType === 'custom' && 'Customizable report with selected sections.'}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {isGenerating ? 'Generating Report...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
}

