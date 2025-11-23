/**
 * Reports Page for a Job
 * Lists all reports and allows generating new ones
 */

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import Link from 'next/link';

export default async function JobReportsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { jobId } = await params;

  // Verify job access
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, lead_tech_id')
    .eq('id', jobId)
    .single();

  if (!job) {
    redirect('/field');
  }

  // Check access
  if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
    redirect('/field');
  }

  // Get existing reports
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/field/jobs/${jobId}`}
              className="text-sm mb-2 inline-block"
              style={{ color: 'var(--accent)' }}
            >
              ← Back to Job
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Reports - {job.title}
            </h1>
          </div>
        </div>

        {/* Report Builder */}
        <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevated)' }}>
          <ReportBuilder jobId={jobId} />
        </div>

        {/* Existing Reports */}
        {reports && reports.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Generated Reports
            </h2>
            <div className="space-y-3">
              {reports.map((report: any) => (
                <div
                  key={report.id}
                  className="p-4 rounded-lg border flex items-center justify-between"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--elevated)',
                  }}
                >
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {report.report_number}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {report.report_type} • {new Date(report.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Status: {report.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {report.status === 'completed' && report.pdf_storage_path && (
                      <a
                        href={`/api/reports/${report.id}/download`}
                        target="_blank"
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

