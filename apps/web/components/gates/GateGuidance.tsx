/**
 * Gate Guidance Component
 * Shows step-by-step guidance, requirements, progress, and next steps
 */

'use client';

import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { JobGate, GateStageName, JobWithGates } from '@/types/gates';

interface GateGuidanceProps {
  currentGate: JobGate;
  job: JobWithGates;
  completedRequirements?: string[];
  optionalRequirements?: string[];
}

const GATE_REQUIREMENTS: Record<GateStageName, { required: string[]; optional: string[]; tips: string[] }> = {
  Arrival: {
    required: [
      'Arrival timestamp (auto-captured)',
      'Arrival photo (exterior of property/unit)',
    ],
    optional: [
      'Location/GPS confirmation',
    ],
    tips: [
      'Take a clear photo of the property exterior showing the address if possible',
      'Ensure GPS is enabled for accurate location tracking',
    ],
  },
  Intake: {
    required: [
      'Customer contact info (name, phone) OR confirmation customer unavailable',
      'Loss type selection (Water, Fire, Mold, Storm, Other)',
      'At least one affected area with damage type',
    ],
    optional: [
      'Customer signature/acknowledgment',
    ],
    tips: [
      'If customer is unavailable, document the reason clearly',
      'Select the most accurate loss type for proper categorization',
    ],
  },
  Photos: {
    required: [
      'At least ONE room documented with photos',
      'Minimum 3 photos per documented room (wide, close-up, context)',
      'Each photo tagged with room and photo type',
    ],
    optional: [
      'PPE photo (if required for job type)',
    ],
    tips: [
      'Take wide shots to show context, close-ups to show damage details',
      'Ensure photos are clear and well-lit',
      'Tag photos accurately for easy reference later',
    ],
  },
  'Moisture/Equipment': {
    required: [
      'Moisture readings (at least one per affected room) OR "No moisture detected"',
      'Equipment deployment status',
    ],
    optional: [
      'Equipment placement photos',
    ],
    tips: [
      'Take moisture readings in multiple locations per room',
      'Document equipment placement with photos for reference',
      'Note any equipment that needs to be left on-site',
    ],
  },
  Scope: {
    required: [
      'Affected rooms list (must match rooms with photos)',
      'Damage type per room',
      'Measurements OR "Visual estimate only" flag',
      'Scope notes',
    ],
    optional: [
      'Detailed measurements (sqft, linear ft)',
    ],
    tips: [
      'Ensure rooms listed match rooms documented in Photos gate',
      'Be specific with damage types for accurate estimating',
      'Include detailed notes about what needs repair vs replacement',
    ],
  },
  'Sign-offs': {
    required: [
      'Work authorization signature OR exception reason',
      'Insurance claim number OR "Customer pay" flag',
      'Next steps acknowledgment',
    ],
    optional: [
      'Customer signature',
    ],
    tips: [
      'Get clear authorization before proceeding with work',
      'Document claim numbers accurately',
      'Set clear expectations for next steps',
    ],
  },
  Departure: {
    required: [
      'Departure timestamp (auto-captured)',
      'Equipment status',
      'Job status update',
    ],
    optional: [
      'Final notes',
    ],
    tips: [
      'Verify all equipment status before leaving',
      'Update job status accurately for proper workflow',
      'Add any important notes for follow-up',
    ],
  },
};

const GATE_ORDER: GateStageName[] = [
  'Arrival',
  'Intake',
  'Photos',
  'Moisture/Equipment',
  'Scope',
  'Sign-offs',
  'Departure',
];

export function GateGuidance({ currentGate, job, completedRequirements = [], optionalRequirements = [] }: GateGuidanceProps) {
  const gateInfo = GATE_REQUIREMENTS[currentGate.stage_name];
  const allGates = job.gates || [];
  
  // Calculate progress
  const completedGates = allGates.filter(g => g.status === 'complete' || g.status === 'skipped').length;
  const totalGates = GATE_ORDER.length;
  const progressPercentage = Math.round((completedGates / totalGates) * 100);
  
  // Find next gate
  const currentIndex = GATE_ORDER.indexOf(currentGate.stage_name);
  const nextGateName = currentIndex < GATE_ORDER.length - 1 ? GATE_ORDER[currentIndex + 1] : null;
  const nextGate = nextGateName ? allGates.find(g => g.stage_name === nextGateName) : null;

  // Check which requirements are completed
  const isRequirementComplete = (req: string) => {
    return completedRequirements.some(completed => 
      completed.toLowerCase().includes(req.toLowerCase().split('(')[0].trim())
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="glass-basic card-glass p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Gate Progress
          </h3>
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            {completedGates}/{totalGates} Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2" style={{ backgroundColor: 'var(--border-subtle)' }}>
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: 'var(--accent)',
            }}
          />
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {progressPercentage}% of gates completed
        </p>
      </div>

      {/* Requirements Section */}
      <div className="glass-basic card-glass p-4">
        <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>
          Requirements
        </h3>
        
        {/* Required Items */}
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Required:
          </p>
          <ul className="space-y-2">
            {gateInfo.required.map((req, index) => {
              const isComplete = isRequirementComplete(req);
              return (
                <li key={index} className="flex items-start gap-2 text-sm">
                  {isComplete ? (
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  ) : (
                    <Circle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  )}
                  <span style={{ color: isComplete ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {req}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Optional Items */}
        {gateInfo.optional.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Optional:
            </p>
            <ul className="space-y-2">
              {gateInfo.optional.map((req, index) => {
                const isComplete = optionalRequirements.some(completed => 
                  completed.toLowerCase().includes(req.toLowerCase().split('(')[0].trim())
                );
                return (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Circle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {req}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Next Steps */}
      {nextGate && (
        <div className="glass-basic card-glass p-4">
          <h3 className="font-semibold mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            Next Steps
          </h3>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            After completing this gate, you'll proceed to:
          </p>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} style={{ color: 'var(--accent)' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--accent)' }}>
              {nextGate.stage_name} Gate
            </span>
          </div>
          {nextGate.status === 'pending' && (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              This gate will unlock after completing the current one.
            </p>
          )}
        </div>
      )}

      {/* Tips Section */}
      {gateInfo.tips.length > 0 && (
        <div className="glass-basic card-glass p-4">
          <h3 className="font-semibold mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            Tips
          </h3>
          <ul className="space-y-1.5">
            {gateInfo.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

