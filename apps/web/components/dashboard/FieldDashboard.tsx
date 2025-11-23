'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobWithGates, JobGate, GateStageName, GateStatus } from '@/types/gates';

const GATES_ORDER: GateStageName[] = ['Arrival', 'Intake', 'Photos', 'Moisture/Equipment', 'Scope', 'Sign-offs', 'Departure'];

interface FieldDashboardProps {
  jobs: Array<JobWithGates & { nextGate?: JobGate; activeException?: boolean }>;
  userEmail?: string;
  onSignOut?: () => void;
}

export default function FieldDashboard({
  jobs,
  userEmail = 'tech@legacy.com',
  onSignOut,
}: FieldDashboardProps) {
  const router = useRouter();
  
  const handleOpenGate = (jobId: string) => {
    router.push(`/field/jobs/${jobId}`);
  };

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' });
    router.push('/login');
  };

  const handleCleanupTestJobs = async () => {
    if (!confirm('This will delete all test jobs. Are you sure?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/cleanup-test-jobs', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert(`Deleted ${data.data.deleted} test jobs. Page will refresh.`);
        window.location.reload();
      } else {
        alert(`Error: ${data.message || 'Failed to delete test jobs'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete test jobs'}`);
    }
  };

  const stats = {
    visitsToday: jobs.length,
    gatesRemaining: jobs.reduce((acc, job) => acc + (7 - (job.gates?.filter(g => g.status === 'complete').length || 0)), 0), 
    flags: jobs.filter(j => j.activeException).length,
  };

  // Count test jobs
  const testJobPatterns = [
    /^test\s+/i, /^validation\s+test/i, /^assign\s+test/i, /^e2e\s+test/i,
    /^ios\s+test/i, /^api\s+test/i, /^assignment\s+test/i, /^chamber\s+test/i,
    /^floor\s+plan\s+test/i, /^moisture\s+test/i, /^sync\s+test/i, /^manual\s+sync/i,
    /^update\s+test/i, /^link\s+test/i, /^reverse\s+link\s+test/i, /^board\s+sync\s+test/i,
    /^report\s+test/i, /^hydro\s+ui\s+test/i, /^integration\s+ui\s+test/i,
    /^test\s+job\s*-\s*\d+$/i, /^validation\s+test\s*-\s*\d+$/i, /^assign\s+test\s*-\s*\d+$/i,
    /^e2e\s+test\s+job\s*-\s*\d+$/i, /^ios\s+test\s+job\s*-\s*\d+$/i, /^api\s+test\s+job\s*-\s*\d+$/i,
    /^assignment\s+test\s*-\s*\d+$/i,
  ];
  const testJobCount = jobs.filter(job => 
    testJobPatterns.some(pattern => pattern.test((job.title || '').trim()))
  ).length;

  return (
    <div className="app-shell min-h-screen bg-app text-main pb-20 font-sans w-full">
      {/* App Bar */}
      <header className="flex items-center justify-between app-shell-inner py-4 border-b border-border-subtle bg-app sticky top-0 z-10 w-full">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight text-main">My Jobs</h1>
          <p className="text-[13px] text-muted">Today's assigned visits</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted hidden sm:inline-block">{userEmail}</span>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-subtle text-danger text-sm hover:bg-subtle active:scale-95 transition-all"
          >
            <LogOut size={14} />
            <span className="sr-only sm:not-sr-only">Sign out</span>
          </button>
        </div>
      </header>

      <main className="app-shell-inner py-6 space-y-8 w-full">
        {/* Overview Row */}
        <section className="grid grid-cols-3 gap-3">
          <StatsCard label="Visits today" value={stats.visitsToday} helper={`${stats.visitsToday} active jobs`} />
          <StatsCard label="Gates remaining" value={stats.gatesRemaining} helper="Across all active visits" />
          <StatsCard label="Flags" value={stats.flags} helper="Jobs with exceptions" />
        </section>

        {/* Cleanup Test Jobs Button */}
        {testJobCount > 0 && (
          <section className="bg-warning-light border border-warning rounded-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-main">Test Jobs Detected</h3>
                <p className="text-xs text-soft mt-1">
                  Found {testJobCount} test jobs that can be cleaned up
                </p>
              </div>
              <button
                onClick={handleCleanupTestJobs}
                className="px-4 py-2 bg-warning text-white rounded-pill text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Clean Up Test Jobs
              </button>
            </div>
          </section>
        )}

        {/* Job Cards */}
        <section className="space-y-4">
          {jobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              onOpenGate={() => handleOpenGate(job.id)}
            />
          ))}
        </section>
      </main>

      {/* Mobile Bottom Bar - Optional sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-elevated border-t border-border-subtle p-4 sm:hidden">
        {jobs.length > 0 && (
          <div className="flex items-center justify-between">
             <div>
               <p className="text-xs text-muted uppercase tracking-wider">Next Job</p>
               <p className="text-sm font-semibold truncate max-w-[200px]">{jobs[0].title}</p>
             </div>
             <button 
               className="bg-accent text-white px-5 py-2 rounded-pill font-medium text-sm active:scale-95 transition-transform"
               onClick={() => handleOpenGate(jobs[0].id)}
             >
               Open
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="bg-elevated border border-border-subtle rounded-card p-3 shadow-soft flex flex-col items-start">
      <span className="text-[12px] text-muted font-medium">{label}</span>
      <span className="text-2xl font-bold text-main my-1">{value}</span>
      <span className="text-[11px] text-soft leading-tight">{helper}</span>
    </div>
  );
}

function JobCard({ job, onOpenGate }: { job: JobWithGates & { nextGate?: JobGate; activeException?: boolean }, onOpenGate: () => void }) {
  // Calculate gate progress
  // We need to map the gates to the 7 standard gates
  // Assuming job.gates contains the relevant gates.
  
  const totalGates = 7;
  const completedGates = (job.gates || []).filter(g => g.status === 'complete').length;
  const nextGateName = job.nextGate?.stage_name || 'None';

  return (
    <div 
      className="bg-elevated border border-border-subtle rounded-card p-4 shadow-soft space-y-4 active:bg-subtle transition-colors cursor-pointer group"
      onClick={onOpenGate}
    >
      {/* Top Row */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="text-base font-semibold text-main line-clamp-1">{job.title}</h3>
          <p className="text-sm text-soft line-clamp-1">{job.address_line_1}</p>
        </div>
        <StatusPill status={job.status} />
      </div>

      {/* Gate Progress Band */}
      <div className="space-y-2">
        <div className="flex h-2 gap-1">
          {GATES_ORDER.map((stage, idx) => {
            const gate = (job.gates || []).find(g => g.stage_name === stage);
            const status = gate?.status || 'pending';
            
            let bgClass = 'bg-gate-pending';
            let borderClass = '';
            
            if (status === 'complete') bgClass = 'bg-gate-complete';
            else if (status === 'in_progress') {
              bgClass = 'bg-transparent';
              borderClass = 'border border-main';
            }
            else if (status === 'skipped') bgClass = 'bg-neutral-600'; // Neutral gray

            return (
              <div 
                key={stage}
                className={cn(
                  "flex-1 rounded-full",
                  bgClass,
                  borderClass
                )}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between text-xs text-muted">
          <span>{completedGates} of {totalGates} gates complete</span>
          <span>Next: <span className="text-main">{nextGateName}</span></span>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between pt-1">
        <div>
           {job.activeException ? (
             <div className="flex items-center gap-1.5 text-warning">
               <AlertTriangle size={14} />
               <span className="text-xs font-medium">Exceptions logged</span>
             </div>
           ) : (
             <span className="text-xs text-soft">Continue with the {nextGateName} gate</span>
           )}
        </div>
        
        <button 
          disabled={!job.nextGate}
          className={cn(
            "px-4 py-2 rounded-pill text-sm font-medium transition-all",
            job.nextGate 
              ? "bg-accent text-white hover:bg-blue-600 shadow-lg shadow-accent/20" 
              : "bg-subtle text-muted cursor-not-allowed"
          )}
        >
          {job.nextGate ? 'Open next gate' : 'Complete'}
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  let label = status.replace(/_/g, ' ');
  // Capitalize
  label = label.charAt(0).toUpperCase() + label.slice(1);
  
  // Styles based on status could be refined
  let classes = "bg-subtle text-muted";
  if (status === 'active_work') classes = "bg-emerald-900/30 text-emerald-400 border border-emerald-900/50";
  if (status === 'lead') classes = "bg-blue-900/30 text-blue-400 border border-blue-900/50";
  if (status === 'ready_to_invoice') classes = "bg-amber-900/30 text-amber-400 border border-amber-900/50";

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-transparent", classes)}>
      {label}
    </span>
  );
}

