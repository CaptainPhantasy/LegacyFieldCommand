/**
 * Job-related API response types
 * Re-exports Job types from gates.ts for convenience
 */

export type { Job, JobStatus, JobGate, JobWithProfile, JobWithGates, JobFull, isJobWithGates, isJobWithProfile } from './gates';

export interface JobsResponse {
  jobs: import('./gates').Job[];
  pagination: {
    cursor: string | null;
    limit: number;
    hasMore: boolean;
  };
}

export interface JobsFilters {
  status?: string;
  leadTechId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

