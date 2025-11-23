export type UserRole = 'field_tech' | 'lead_tech' | 'estimator' | 'admin' | 'owner' | 'program_admin';

export type JobStatus = 'lead' | 'inspection_scheduled' | 'job_created' | 'active_work' | 'ready_to_invoice' | 'paid' | 'closed';

export type GateStatus = 'pending' | 'in_progress' | 'complete' | 'skipped';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title: string;
  account_id: string | null;
  status: JobStatus;
  
  // Address
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  
  // Assignments
  lead_tech_id: string | null;
  estimator_id: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface JobGate {
  id: string;
  job_id: string;
  stage_name: string;
  status: GateStatus;
  
  completed_at: string | null;
  completed_by: string | null;
  
  requires_exception: boolean;
  exception_reason: string | null;
  
  created_at: string;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  gate_id: string | null;
  taken_by: string | null;
  
  storage_path: string;
  metadata: Record<string, any>;
  
  is_ppe: boolean;
  
  created_at: string;
}

