'use client';

import React from 'react';
import { ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Job, JobGate, GateStageName, MoistureData, Reading } from '@/types/gates';
import { useRouter } from 'next/navigation';
import { addMoistureReading, completeGate, logException } from '@/app/actions/gates';
import ReadingDialog, { ReadingData } from './ReadingDialog';

const GATES_ORDER: GateStageName[] = ['Arrival', 'Intake', 'Photos', 'Moisture/Equipment', 'Scope', 'Sign-offs', 'Departure'];

const GATE_DESCRIPTIONS: Record<GateStageName, string> = {
  'Arrival': 'Confirm arrival at the job site.',
  'Intake': 'Collect initial customer information and signatures.',
  'Photos': 'Take and upload photos of the job site.',
  'Moisture/Equipment': 'Inspect affected areas and add moisture readings.',
  'Scope': 'Define the scope of work and damage assessment.',
  'Sign-offs': 'Get customer sign-offs for work performed.',
  'Departure': 'Final checks and departure.'
};

interface JobDetailProps {
  job: Job & { gates: JobGate[]; currentGate?: JobGate };
  userEmail?: string;
}

export default function JobDetail({
  job,
  userEmail = 'tech@legacy.com',
}: JobDetailProps) {
  const router = useRouter();
  const [isReadingDialogOpen, setIsReadingDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Determine current gate index
  const currentGateIndex = GATES_ORDER.findIndex(stage => stage === job.currentGate?.stage_name);

  // Extract readings if current gate is Moisture/Equipment
  const moistureMetadata = (job.currentGate?.metadata as MoistureData) || {};
  const readings: Reading[] = moistureMetadata.readings || [];

  const handleAddReading = async (data: ReadingData) => {
    if (!job.currentGate) return;
    
    setIsSubmitting(true);
    try {
      // Add timestamp to the reading
      const readingWithTimestamp: Reading = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      await addMoistureReading(job.currentGate.id, readingWithTimestamp);
      router.refresh(); // Refresh to get updated data
    } catch (error) {
      console.error('Failed to save reading', error);
      alert('Failed to save reading. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsReadingDialogOpen(false);
    }
  };

  const handleCompleteGate = async () => {
    if (!job.currentGate) return;
    
    setIsSubmitting(true);
    try {
      await completeGate(job.currentGate.id);
      router.refresh(); // Refresh to get updated gate status
      router.push('/field'); // Navigate back to dashboard
    } catch (error) {
      console.error('Failed to complete gate', error);
      alert('Failed to complete gate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/field');
  };

  const handleLogException = async () => {
    if (!job.currentGate) return;
    
    const reason = prompt('Enter exception reason:');
    if (!reason) return;
    
    setIsSubmitting(true);
    try {
      await logException(job.currentGate.id, reason);
      router.refresh();
      alert('Exception logged successfully.');
    } catch (error) {
      console.error('Failed to log exception', error);
      alert('Failed to log exception.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app text-main font-sans pb-24">
      <ReadingDialog 
        open={isReadingDialogOpen} 
        onOpenChange={setIsReadingDialogOpen}
        onSubmit={handleAddReading}
      />
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-border-subtle bg-app sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="p-1 -ml-1 text-muted hover:text-main">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-main">Job Detail</h1>
        </div>
        <span className="text-sm text-muted">{userEmail}</span>
      </header>

      <main className="px-4 py-6 max-w-3xl mx-auto space-y-8">
        {/* Job Summary Block */}
        <section className="space-y-2">
          <h2 className="text-2xl font-bold text-main">{job.title}</h2>
          <p className="text-muted">{job.address_line_1}</p>
          <div className="flex items-center gap-3 pt-1">
            <StatusPill status={job.status} />
            <span className="text-xs text-soft">Visit started at 9:32 AM</span>
          </div>
        </section>

        {/* Gate Stepper */}
        <section className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex items-start min-w-max gap-0 relative">
            {GATES_ORDER.map((stage, idx) => {
              // Logic for stepper state:
              // Complete if gate status is 'complete' OR if index < currentGateIndex
              // Current if it matches currentGateIndex
              const gate = job.gates.find(g => g.stage_name === stage);
              const isComplete = gate?.status === 'complete';
              const isCurrent = job.currentGate?.stage_name === stage;
              
              return (
                <div key={stage} className="flex flex-col items-center w-[80px] gap-2 group relative">
                  {/* Connecting Line */}
                  {idx !== GATES_ORDER.length - 1 && (
                    <div className={cn(
                      "absolute top-[9px] left-[50%] w-full h-[2px] z-0",
                      isComplete ? "bg-accent" : "bg-border-strong"
                    )} />
                  )}
                  
                  {/* Dot */}
                  <div className={cn(
                    "w-[20px] h-[20px] rounded-full z-10 flex items-center justify-center border-2 transition-colors",
                    isComplete ? "bg-accent border-accent" : 
                    isCurrent ? "bg-app border-accent ring-4 ring-accent-soft" : 
                    "bg-app border-border-strong"
                  )}>
                    {isComplete && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                    {isCurrent && <div className="w-2 h-2 bg-accent rounded-full" />}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    "text-[10px] text-center leading-tight max-w-[70px]",
                    isComplete ? "text-main" : 
                    isCurrent ? "text-main font-bold" : 
                    "text-soft"
                  )}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Current Gate Panel */}
        {job.currentGate && (
          <section className="bg-elevated border border-border-subtle rounded-card p-5 shadow-soft space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-main">{job.currentGate.stage_name} Gate</h3>
              <p className="text-muted text-sm">
                {GATE_DESCRIPTIONS[job.currentGate.stage_name] || 'Complete gate requirements.'}
              </p>
            </div>

            {/* Content Area - Dynamic based on gate type */}
            <div className="space-y-4">
              {job.currentGate.stage_name === 'Moisture/Equipment' ? (
                <>
                  {/* Readings List */}
                  {readings.length > 0 && (
                    <div className="grid gap-3">
                      {readings.map((reading, i) => (
                        <div key={reading.id || i} className="bg-subtle rounded-lg p-3 flex items-center justify-between border border-border-subtle">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-main">{reading.room}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-elevated border border-border-strong text-muted">
                                {reading.material}
                              </span>
                            </div>
                            <p className="text-xs text-soft mt-0.5">{reading.location}</p>
                          </div>
                          <div className="text-right">
                             <div className="text-lg font-bold text-main">{reading.value}</div>
                             <div className="text-[10px] text-muted">Goal: {reading.goal}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={() => setIsReadingDialogOpen(true)}
                    disabled={isSubmitting}
                    className="bg-subtle hover:bg-bg-subtle border border-border-strong border-dashed rounded-lg px-8 py-12 w-full text-center transition-colors group disabled:opacity-50"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-bg-subtle flex items-center justify-center group-hover:bg-border-subtle transition-colors">
                         <span className="text-2xl">+</span>
                      </div>
                      <span className="text-main font-medium">Add reading</span>
                      <span className="text-sm text-muted">Record moisture levels</span>
                    </div>
                  </button>
                </>
              ) : (
                 // Generic Placeholder for other gates
                 <div className="py-12 text-center text-muted border border-dashed border-border-subtle rounded-lg">
                    Gate specific content for {job.currentGate.stage_name} will go here.
                 </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-elevated border-t border-border-subtle p-4 z-20">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button 
            onClick={handleLogException}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-pill border border-border-strong text-muted font-medium hover:bg-subtle hover:text-main transition-colors"
          >
            <AlertTriangle size={18} />
            <span>Log exception</span>
          </button>
          
          <button 
            onClick={handleCompleteGate}
            disabled={isSubmitting || !job.currentGate} 
            className="flex-[2] bg-accent text-white px-4 py-3 rounded-pill font-medium hover:bg-blue-600 shadow-lg shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'Complete gate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  let label = status.replace(/_/g, ' ');
  label = label.charAt(0).toUpperCase() + label.slice(1);
  
  let classes = "bg-subtle text-muted";
  if (status === 'active_work') classes = "bg-emerald-900/30 text-emerald-400 border border-emerald-900/50";
  
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-transparent", classes)}>
      {label}
    </span>
  );
}
