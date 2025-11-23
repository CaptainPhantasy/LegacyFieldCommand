// Gate validation utilities for web app
// Ported from mobile app

import type { JobGate, JobPhoto, PhotoMetadata } from '@/types/gates'

export interface GateValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export async function validateGate(
  gateId: string,
  jobId: string,
  gate: JobGate,
  photos: JobPhoto[]
): Promise<GateValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  switch (gate.stage_name) {
    case 'Arrival':
      return validateArrivalGate(gate, photos, errors, warnings)
    case 'Photos':
      return validatePhotosGate(gate, photos, errors, warnings)
    case 'Scope':
      return validateScopeGate(gate, errors, warnings)
    default:
      return { isValid: true, errors: [], warnings: [] }
  }
}

function validateArrivalGate(
  gate: JobGate,
  photos: JobPhoto[],
  errors: string[],
  warnings: string[]
): GateValidationResult {
  const arrivalPhotos = photos.filter(p => 
    p.gate_id === gate.id && 
    (typeof p.metadata === 'string' ? JSON.parse(p.metadata || '{}') : p.metadata)?.type === 'arrival'
  )

  if (arrivalPhotos.length === 0 && !gate.requires_exception) {
    errors.push('Arrival photo is required. Take a photo or log an exception.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

function validatePhotosGate(
  gate: JobGate,
  photos: JobPhoto[],
  errors: string[],
  warnings: string[]
): GateValidationResult {
  // Group photos by room and track photo types
  const photosByRoom: Record<string, {
    'Wide room shot': boolean
    'Close-up of damage': boolean
    'Context/equipment photo': boolean
  }> = {}
  
  photos.forEach(photo => {
    try {
      // Handle metadata - could be object or string
      let metadata: PhotoMetadata = {}
      if (typeof photo.metadata === 'string') {
        metadata = JSON.parse(photo.metadata || '{}') as PhotoMetadata
      } else if (photo.metadata) {
        metadata = photo.metadata
      }
      const room = metadata?.room
      const type = metadata?.type
      
      if (room && type) {
        if (!photosByRoom[room]) {
          photosByRoom[room] = {
            'Wide room shot': false,
            'Close-up of damage': false,
            'Context/equipment photo': false,
          }
        }
        // Mark this type as present (only need one of each type)
        if (type === 'Wide room shot') photosByRoom[room]['Wide room shot'] = true
        if (type === 'Close-up of damage') photosByRoom[room]['Close-up of damage'] = true
        if (type === 'Context/equipment photo') photosByRoom[room]['Context/equipment photo'] = true
      }
    } catch (e) {
      // Invalid metadata, skip
    }
  })

  // Check that each room has all 3 required photo types
  Object.entries(photosByRoom).forEach(([room, types]) => {
    const hasAllTypes = types['Wide room shot'] && types['Close-up of damage'] && types['Context/equipment photo']
    if (!hasAllTypes) {
      const missing = []
      if (!types['Wide room shot']) missing.push('Wide room shot')
      if (!types['Close-up of damage']) missing.push('Close-up of damage')
      if (!types['Context/equipment photo']) missing.push('Context/equipment photo')
      errors.push(
        `${room}: Missing required photos: ${missing.join(', ')}`
      )
    }
  })

  // Check for at least one documented room with all 3 photos
  const roomsWithAllPhotos = Object.entries(photosByRoom).filter(([_, types]) => 
    types['Wide room shot'] && types['Close-up of damage'] && types['Context/equipment photo']
  )
  
  if (roomsWithAllPhotos.length === 0 && !gate.requires_exception) {
    errors.push('At least one room must be documented with all 3 required photos (Wide room shot, Close-up of damage, Context/equipment photo), or an exception must be logged.')
  }

  // Check for PPE photo
  const ppePhotos = photos.filter(p => p.is_ppe)
  if (ppePhotos.length === 0) {
    warnings.push('No PPE photos found. Consider adding PPE documentation if required for this job type.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

function validateScopeGate(
  gate: JobGate,
  errors: string[],
  warnings: string[]
): GateValidationResult {
  // Parse scope data from gate metadata
  let scopeData: any = {}
  try {
    if (typeof gate.metadata === 'string') {
      scopeData = JSON.parse(gate.metadata || '{}')
    } else {
      scopeData = gate.metadata || {}
    }
  } catch (e) {
    // Invalid metadata
  }

  const rooms = scopeData.rooms || []
  
  // Check that at least one room is listed
  if (rooms.length === 0 && !gate.requires_exception) {
    errors.push('At least one affected room must be listed, or an exception must be logged.')
  }

  // Check that measurements or "visual estimate only" is present
  const measurements = scopeData.measurements || ''
  const hasMeasurements = measurements.trim().length > 0
  const isVisualEstimate = measurements.toLowerCase().includes('visual estimate only')
  
  if (!hasMeasurements && !gate.requires_exception) {
    errors.push('Measurements are required, or mark as "Visual estimate only".')
  }

  // Check that scope notes are present
  const notes = scopeData.notes || ''
  if (notes.trim().length === 0 && !gate.requires_exception) {
    warnings.push('Scope notes are recommended to document what needs repair vs replacement.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Validate room consistency between Photos and Scope gates
export async function validateRoomConsistency(
  jobId: string,
  photosGate: JobGate,
  scopeGate: JobGate,
  photos: JobPhoto[]
): Promise<GateValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Get rooms from Photos gate
  const photosByRoom: Record<string, boolean> = {}
  photos.forEach(photo => {
    try {
      let metadata: PhotoMetadata = {}
      if (typeof photo.metadata === 'string') {
        metadata = JSON.parse(photo.metadata || '{}') as PhotoMetadata
      } else if (photo.metadata) {
        metadata = photo.metadata
      }
      const room = metadata?.room
      if (room) {
        photosByRoom[room] = true
      }
    } catch (e) {
      // Skip invalid metadata
    }
  })
  const photoRooms = Object.keys(photosByRoom)

  // Get rooms from Scope gate
  let scopeData: { rooms?: string[] } = {}
  try {
    if (typeof scopeGate.metadata === 'string') {
      const parsed = JSON.parse(scopeGate.metadata || '{}') as { rooms?: string[] }
      scopeData = parsed
    } else if (scopeGate.metadata && typeof scopeGate.metadata === 'object') {
      scopeData = scopeGate.metadata as { rooms?: string[] }
    }
  } catch (e) {
    // Invalid metadata
  }
  const scopeRooms = scopeData.rooms || []

  // Check consistency
  if (scopeRooms.length > 0 && photoRooms.length > 0) {
    // Rooms in scope must have photos
    const roomsWithoutPhotos = scopeRooms.filter((room: string) => !photoRooms.includes(room))
    if (roomsWithoutPhotos.length > 0) {
      errors.push(
        `Rooms listed in Scope gate (${roomsWithoutPhotos.join(', ')}) must have photos in Photos gate. ` +
        `Either add photos for these rooms or remove them from scope.`
      )
    }

    // Warn if there are photos for rooms not in scope
    const roomsWithoutScope = photoRooms.filter((room: string) => !scopeRooms.includes(room))
    if (roomsWithoutScope.length > 0) {
      warnings.push(
        `Photos exist for rooms not listed in Scope: ${roomsWithoutScope.join(', ')}. ` +
        `Consider adding these rooms to scope or removing the photos.`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Validate timestamp order (arrival before departure)
export function validateTimestampOrder(
  arrivalGate: JobGate,
  departureGate: JobGate
): GateValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!arrivalGate.completed_at || !departureGate.completed_at) {
    return { isValid: true, errors: [], warnings: [] }
  }

  const arrivalTime = new Date(arrivalGate.completed_at).getTime()
  const departureTime = new Date(departureGate.completed_at).getTime()

  if (departureTime <= arrivalTime) {
    errors.push(
      'Departure timestamp must be after arrival timestamp. ' +
      `Arrival: ${new Date(arrivalGate.completed_at).toLocaleString()}, ` +
      `Departure: ${new Date(departureGate.completed_at).toLocaleString()}`
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export async function checkExceptionFrequency(jobId: string, gates: JobGate[]): Promise<{
  exceptionCount: number
  needsReview: boolean
}> {
  const exceptionCount = gates.filter(g => g.requires_exception).length
  const needsReview = exceptionCount > 2

  return { exceptionCount, needsReview }
}

