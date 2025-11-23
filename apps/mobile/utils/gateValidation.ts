import JobGate from '../db/model/JobGate';
import JobPhoto from '../db/model/JobPhoto';
import { database } from '../db';
import { Q } from '@nozbe/watermelondb';

export interface GateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that a gate meets all requirements before completion
 */
export async function validateGate(gateId: string, jobId: string): Promise<GateValidationResult> {
  const gatesCollection = database.collections.get<JobGate>('job_gates');
  const gate = await gatesCollection.find(gateId);
  
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (gate.stageName) {
    case 'Arrival':
      return await validateArrivalGate(gate, jobId);
    case 'Photos':
      return await validatePhotosGate(gate, jobId);
    case 'Scope':
      return await validateScopeGate(gate, jobId);
    default:
      // Other gates have minimal requirements
      return { isValid: true, errors: [], warnings: [] };
  }
}

async function validateArrivalGate(gate: JobGate, jobId: string): Promise<GateValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for arrival photo
  const photosCollection = database.collections.get<JobPhoto>('job_photos');
  const arrivalPhotos = await photosCollection
    .query(
      Q.where('job_id', jobId),
      Q.where('gate_id', gate.id)
    )
    .fetch();

  if (arrivalPhotos.length === 0 && !gate.requiresException) {
    errors.push('Arrival photo is required. Take a photo or log an exception.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validatePhotosGate(gate: JobGate, jobId: string): Promise<GateValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const photosCollection = database.collections.get<JobPhoto>('job_photos');
  const allPhotos = await photosCollection
    .query(Q.where('job_id', jobId))
    .fetch();

  // Group photos by room
  const photosByRoom: Record<string, JobPhoto[]> = {};
  allPhotos.forEach(photo => {
    try {
      const metadata = JSON.parse(photo.metadata || '{}');
      const room = metadata.room;
      if (room) {
        if (!photosByRoom[room]) {
          photosByRoom[room] = [];
        }
        photosByRoom[room].push(photo);
      }
    } catch (e) {
      // Invalid metadata, skip
    }
  });

  // Check minimum photos per room
  const roomsWithInsufficientPhotos: string[] = [];
  Object.entries(photosByRoom).forEach(([room, photos]) => {
    if (photos.length < 3) {
      roomsWithInsufficientPhotos.push(room);
      errors.push(`${room}: Minimum 3 photos required (currently ${photos.length}). Need: wide shot, close-up, context.`);
    }
  });

  // Check for at least one documented room
  if (Object.keys(photosByRoom).length === 0 && !gate.requiresException) {
    errors.push('At least one room must be documented with photos, or an exception must be logged.');
  }

  // Check for PPE photo if required (based on job type - this would need job context)
  const ppePhotos = allPhotos.filter(p => p.isPpe);
  if (ppePhotos.length === 0) {
    warnings.push('No PPE photos found. Consider adding PPE documentation if required for this job type.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateScopeGate(gate: JobGate, jobId: string): Promise<GateValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Scope gate validation would check:
  // - If rooms are listed in scope, photos must exist for those rooms
  // - Measurements are present or "visual estimate only" flag is set
  // This would require additional scope data structure
  
  // For now, basic validation
  if (gate.status === 'complete' && !gate.requiresException) {
    // Scope should have some data - this is a placeholder
    // In full implementation, would check scope data model
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a gate can be completed (all requirements met or exception logged)
 */
export async function canCompleteGate(gateId: string, jobId: string): Promise<boolean> {
  const validation = await validateGate(gateId, jobId);
  return validation.isValid;
}

/**
 * Gets validation errors for a gate (for display to user)
 */
export async function getGateValidationErrors(gateId: string, jobId: string): Promise<string[]> {
  const validation = await validateGate(gateId, jobId);
  return validation.errors;
}

/**
 * Checks exception frequency for a job (anti-fudging)
 */
export async function checkExceptionFrequency(jobId: string): Promise<{
  exceptionCount: number;
  needsReview: boolean;
}> {
  const gatesCollection = database.collections.get<JobGate>('job_gates');
  const gates = await gatesCollection
    .query(Q.where('job_id', jobId))
    .fetch();

  const exceptionCount = gates.filter(g => g.requiresException).length;
  const needsReview = exceptionCount > 2; // More than 2 exceptions triggers review

  return { exceptionCount, needsReview };
}

