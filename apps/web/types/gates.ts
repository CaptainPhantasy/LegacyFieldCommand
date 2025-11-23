export type GateStageName = 
  | 'Arrival' 
  | 'Intake' 
  | 'Photos' 
  | 'Moisture/Equipment' 
  | 'Scope' 
  | 'Sign-offs' 
  | 'Departure'

export type GateStatus = 'pending' | 'in_progress' | 'complete' | 'skipped'

export type JobStatus = 
  | 'lead' 
  | 'inspection_scheduled' 
  | 'job_created' 
  | 'active_work' 
  | 'ready_to_invoice' 
  | 'paid' 
  | 'closed'

export interface JobGate {
  id: string
  job_id: string
  stage_name: GateStageName
  status: GateStatus
  metadata: GateMetadata | null
  requires_exception: boolean
  exception_reason: string | null
  completed_at: string | null
  completed_by: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  title: string
  address_line_1: string | null
  lead_tech_id: string | null
  status: JobStatus
  created_at: string
  updated_at: string
}

export interface JobPhoto {
  id: string
  job_id: string
  gate_id: string
  storage_path: string
  metadata: PhotoMetadata | string
  is_ppe: boolean
  created_at: string
  updated_at: string
}

export interface PhotoMetadata {
  type?: string
  stage?: string
  room?: string
}

export interface IntakeData {
  customerName: string
  customerPhone: string
  lossType: string
  affectedAreas: Array<{
    room: string
    damageType: string
  }>
  customerSignature: boolean
}

// -- UPDATED MOISTURE TYPES --
export interface Reading {
  id: string
  room: string
  location: string
  material: string
  value: string
  goal: string
  timestamp: string
}

export interface MoistureData {
  readings: Reading[]
  equipment: string[]
  equipmentPhotos: string[] // paths
}
// ----------------------------

export interface ScopeData {
  rooms: string[]
  damageTypes: Record<string, string>
  measurements: string
  notes: string
}

export interface SignoffData {
  signature: boolean
  claimNumber: string
  customerPay: boolean
  nextSteps: string
}

export interface DepartureData {
  equipmentStatus: string
  notes: string
  jobStatus: string
}

export type GateMetadata = 
  | IntakeData 
  | MoistureData 
  | ScopeData 
  | SignoffData 
  | DepartureData
  | Record<string, never>
