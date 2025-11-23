/**
 * Hydro System Section Component
 * Wrapper for all hydro system components in Moisture/Equipment gate
 */

'use client';

import { ChamberSetup } from './ChamberSetup';
import { PsychrometricCapture } from './PsychrometricCapture';
import { useChambers } from '@/hooks/useHydro';

interface HydroSystemSectionProps {
  jobId: string;
}

export function HydroSystemSection({ jobId }: HydroSystemSectionProps) {
  const { data: chambersData, isLoading } = useChambers(jobId);
  const chambers = chambersData?.chambers || [];

  return (
    <div className="space-y-6">
      <div className="glass-basic card-glass">
        <ChamberSetup jobId={jobId} />
      </div>
      
      {/* Psychrometric Readings - Show for each chamber */}
      {!isLoading && chambers.length > 0 && (
        <div className="glass-basic card-glass space-y-4">
          {chambers.map((chamber) => (
            <div
              key={chamber.id}
              className="border-b pb-4 last:border-b-0 last:pb-0"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                {chamber.name} - Psychrometric Readings
              </h4>
              <PsychrometricCapture chamberId={chamber.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

