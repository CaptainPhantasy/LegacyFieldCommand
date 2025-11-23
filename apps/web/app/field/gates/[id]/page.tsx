'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import PhotoCapture from '@/components/PhotoCapture'
import { validateGate, validateRoomConsistency, validateTimestampOrder } from '@/utils/gateValidation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { SkeletonCard, SkeletonButton, Skeleton } from '@/components/ui/skeleton'
import { HydroSystemSection } from '@/components/hydro/HydroSystemSection'
import type { 
  JobGate, 
  Job, 
  JobPhoto, 
  IntakeData, 
  MoistureData, 
  ScopeData, 
  SignoffData, 
  DepartureData,
  GateMetadata
} from '@/types/gates'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const LOSS_TYPES = ['Water', 'Fire', 'Mold', 'Storm', 'Other']
const DAMAGE_TYPES = ['Visible water', 'Smoke damage', 'Structural', 'Flooring', 'Drywall', 'Cabinets', 'HVAC', 'Other']
const EQUIPMENT_TYPES = ['Air movers', 'Dehumidifiers', 'HEPA filters', 'None']
const NEXT_STEPS = ['Wait for adjuster', 'Proceed with work', 'Quote pending']
const EQUIPMENT_STATUS = ['All removed', 'Left on-site', 'Customer pickup scheduled']
const JOB_STATUS = ['Ready for estimate', 'Needs follow-up', 'Complete']

export default function GatePage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [gate, setGate] = useState<JobGate | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [gateId, setGateId] = useState<string>('')
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false)
  const [exceptionReason, setExceptionReason] = useState('')

  // Gate-specific state
  const [arrivalPhoto, setArrivalPhoto] = useState<File | null>(null)
  const [intakeData, setIntakeData] = useState({ customerName: '', customerPhone: '', lossType: '', affectedAreas: [] as Array<{ room: string, damageType: string }>, customerSignature: false })
  const [moistureData, setMoistureData] = useState({ readings: '', equipment: [] as string[], equipmentPhotos: [] as File[] })
  const [scopeData, setScopeData] = useState({ rooms: [] as string[], damageTypes: {} as Record<string, string>, measurements: '', notes: '' })
  const [signoffData, setSignoffData] = useState({ signature: false, claimNumber: '', customerPay: false, nextSteps: '' })
  const [departureData, setDepartureData] = useState({ equipmentStatus: '', notes: '', jobStatus: '' })
  
  // Autosave state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    let mounted = true
    params.then(p => {
      if (mounted) {
        setGateId(p.id)
        loadData(p.id)
      }
    })
    return () => { 
      mounted = false
      isMountedRef.current = false
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [params])

  // Route Photos gate to dedicated screen
  useEffect(() => {
    if (gate?.stage_name === 'Photos') {
      router.replace(`/field/gates/photos/${gateId}`)
    }
  }, [gate, gateId, router])

  // Autosave draft functionality
  async function saveDraft() {
    if (!gate || !gateId || !isMountedRef.current) return
    
    let draftData: GateMetadata = {}
    
    switch (gate.stage_name) {
      case 'Intake':
        draftData = intakeData
        break
      case 'Moisture/Equipment':
        // Don't save File objects in metadata
        draftData = {
          readings: moistureData.readings,
          equipment: moistureData.equipment,
        }
        break
      case 'Scope':
        draftData = scopeData
        break
      case 'Sign-offs':
        draftData = signoffData
        break
      case 'Departure':
        draftData = departureData
        break
      default:
        return // No draft for Arrival or Photos
    }

    if (Object.keys(draftData).length === 0) return

    try {
      setSaveStatus('saving')
      const { error } = await supabase
        .from('job_gates')
        .update({
          metadata: draftData,
        })
        .eq('id', gateId)

      if (error) throw error
      
      if (isMountedRef.current) {
        setSaveStatus('saved')
        // Reset to idle after 2 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setSaveStatus('idle')
          }
        }, 2000)
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        setSaveStatus('error')
        console.error('Autosave error:', error)
        // Reset error status after 3 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setSaveStatus('idle')
          }
        }, 3000)
      }
    }
  }

  // Debounced autosave effect
  useEffect(() => {
    if (!gate || gate.status === 'complete' || gate.status === 'skipped') return
    
    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    // Set new timeout for autosave (2.5 seconds after last change)
    autosaveTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        saveDraft()
      }
    }, 2500)

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [intakeData, moistureData.readings, moistureData.equipment, scopeData, signoffData, departureData, gate])

  // Helper function to parse metadata (handles both string and object formats)
  function parseMetadata(metadata: GateMetadata | string | null): GateMetadata {
    if (!metadata) return {}
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata) as GateMetadata
      } catch (e) {
        return {}
      }
    }
    return (metadata as GateMetadata) || {}
  }

  // Restore gate state from metadata
  function restoreGateState(gate: JobGate) {
    const metadata = parseMetadata(gate.metadata)
    if (!metadata || Object.keys(metadata).length === 0) return

    switch (gate.stage_name) {
      case 'Intake': {
        const intakeMeta = metadata as Partial<IntakeData> & { damageType?: string }
        // Handle backward compatibility: old format had damageType, new format has affectedAreas
        if (intakeMeta.affectedAreas) {
          setIntakeData({
            customerName: intakeMeta.customerName || '',
            customerPhone: intakeMeta.customerPhone || '',
            lossType: intakeMeta.lossType || '',
            affectedAreas: intakeMeta.affectedAreas || [],
            customerSignature: intakeMeta.customerSignature || false,
          })
        } else if (intakeMeta.damageType) {
          // Migrate old format to new format
          const affectedAreas = intakeMeta.damageType ? [{ room: 'Other', damageType: intakeMeta.damageType }] : []
          setIntakeData({
            customerName: intakeMeta.customerName || '',
            customerPhone: intakeMeta.customerPhone || '',
            lossType: intakeMeta.lossType || '',
            affectedAreas,
            customerSignature: intakeMeta.customerSignature || false,
          })
        } else {
          setIntakeData({
            customerName: intakeMeta.customerName || '',
            customerPhone: intakeMeta.customerPhone || '',
            lossType: intakeMeta.lossType || '',
            affectedAreas: [],
            customerSignature: intakeMeta.customerSignature || false,
          })
        }
        break
      }
      case 'Moisture/Equipment': {
        const moistureMeta = metadata as Partial<MoistureData>
        setMoistureData({
          readings: moistureMeta.readings || '',
          equipment: moistureMeta.equipment || [],
          equipmentPhotos: [], // Files can't be restored from metadata
        })
        break
      }
      case 'Scope': {
        const scopeMeta = metadata as Partial<ScopeData>
        setScopeData({
          rooms: scopeMeta.rooms || [],
          damageTypes: scopeMeta.damageTypes || {},
          measurements: scopeMeta.measurements || '',
          notes: scopeMeta.notes || '',
        })
        break
      }
      case 'Sign-offs': {
        const signoffMeta = metadata as Partial<SignoffData>
        setSignoffData({
          signature: signoffMeta.signature || false,
          claimNumber: signoffMeta.claimNumber || '',
          customerPay: signoffMeta.customerPay || false,
          nextSteps: signoffMeta.nextSteps || '',
        })
        break
      }
      case 'Departure': {
        const departureMeta = metadata as Partial<DepartureData>
        setDepartureData({
          equipmentStatus: departureMeta.equipmentStatus || '',
          notes: departureMeta.notes || '',
          jobStatus: departureMeta.jobStatus || '',
        })
        break
      }
    }
  }

  async function loadData(id: string) {
    const { data: gateData } = await supabase
      .from('job_gates')
      .select('*')
      .eq('id', id)
      .single()

    if (gateData) {
      setGate(gateData)
      
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', gateData.job_id)
        .single()
      setJob(jobData)

      const { data: photosData } = await supabase
        .from('job_photos')
        .select('*')
        .eq('job_id', gateData.job_id)
        .eq('gate_id', id)
      setPhotos(photosData || [])
      
      // Restore form state from metadata
      restoreGateState(gateData)
    }
  }

  async function handleComplete() {
    if (!gate || !job) return

    setIsCompleting(true)

    try {
      // Get user first (needed for all operations)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
        
      if (authError || !user) {
        console.error('Auth error:', authError)
        throw new Error(`Authentication failed: ${authError?.message || 'Not logged in'}`)
      }

      console.log('User authenticated:', { userId: user.id, email: user.email })

      // Verify job assignment
      const { data: jobAssignment, error: jobCheckError } = await supabase
        .from('jobs')
        .select('id, lead_tech_id, title')
        .eq('id', job.id)
        .single()

      if (jobCheckError || !jobAssignment) {
        console.error('Job check error:', jobCheckError)
        throw new Error(`Cannot verify job assignment: ${jobCheckError?.message || 'Job not found'}`)
      }

      const isAssigned = jobAssignment.lead_tech_id === user.id
      if (!isAssigned) {
        throw new Error(`Job "${jobAssignment.title || job.id}" is not assigned to you.`)
      }

      // Run gate-specific validation before completion
      const validation = await validateGate(gateId, job.id, gate, photos)
      if (!validation.isValid) {
        throw new Error(validation.errors.join('\n\n'))
      }

      // Additional cross-gate validations
      if (gate.stage_name === 'Scope') {
        // Check room consistency with Photos gate
        const { data: allGates } = await supabase
          .from('job_gates')
          .select('*')
          .eq('job_id', job.id)
        
        const photosGate = allGates?.find(g => g.stage_name === 'Photos')
        if (photosGate) {
          const { data: allPhotos } = await supabase
            .from('job_photos')
            .select('*')
            .eq('job_id', job.id)
          
          const roomValidation = await validateRoomConsistency(job.id, photosGate, gate, allPhotos || [])
          if (!roomValidation.isValid) {
            throw new Error(roomValidation.errors.join('\n\n'))
          }
          if (roomValidation.warnings.length > 0) {
            // Show warnings but don't block
            setBanner({
              type: 'error',
              message: roomValidation.warnings.join('\n\n'),
            })
          }
        }
      }

      if (gate.stage_name === 'Departure') {
        // Check timestamp order (arrival before departure)
        const { data: allGates } = await supabase
          .from('job_gates')
          .select('*')
          .eq('job_id', job.id)
        
        const arrivalGate = allGates?.find(g => g.stage_name === 'Arrival')
        if (arrivalGate && arrivalGate.completed_at) {
          const timestampValidation = validateTimestampOrder(arrivalGate, gate)
          if (!timestampValidation.isValid) {
            throw new Error(timestampValidation.errors.join('\n\n'))
          }
        }
      }

      // Gate-specific completion logic
      switch (gate.stage_name) {
        case 'Arrival':
          await handleArrivalComplete(user.id)
          break
        case 'Intake':
          await handleIntakeComplete(user.id)
          break
        case 'Moisture/Equipment':
          await handleMoistureComplete(user.id)
          break
        case 'Scope':
          await handleScopeComplete(user.id)
          break
        case 'Sign-offs':
          await handleSignoffComplete(user.id)
          break
        case 'Departure':
          await handleDepartureComplete(user.id)
          break
        default:
          throw new Error(`Unknown gate type: ${gate.stage_name}`)
      }

      // Update gate status
      const { error: gateError } = await supabase
        .from('job_gates')
        .update({
          status: 'complete',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
        })
        .eq('id', gateId)

      if (gateError) throw gateError

      setBanner({
        type: 'success',
        message: `${gate.stage_name} gate completed.`,
      })
      
      // Small delay to show success message
      setTimeout(() => {
        router.push(`/field/jobs/${job.id}`)
      }, 1000)
    } catch (error: any) {
      setBanner({
        type: 'error',
        message: error.message || 'Failed to complete gate',
      })
    } finally {
      setIsCompleting(false)
    }
  }

  async function uploadPhotoWithRetry(
    file: File,
    filePath: string,
    metadata: any,
    maxRetries = 3
  ): Promise<void> {
    let lastError: any = null
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('File too large. Please use a smaller image (max 10MB).')
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(filePath, file, { contentType: 'image/jpeg' })

        if (uploadError) {
          if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
            throw new Error('Permission denied. Please contact support if this issue persists.')
          }
          if (uploadError.message?.includes('size') || uploadError.message?.includes('large')) {
            throw new Error('File too large. Please use a smaller image.')
          }
          if (uploadError.message?.includes('network') || uploadError.message?.includes('fetch')) {
            throw new Error('Network connection failed. Please check your internet and try again.')
          }
          throw uploadError
        }

        // Create photo record
        const { error: photoError } = await supabase
          .from('job_photos')
          .insert({
            job_id: job.id,
            gate_id: gateId,
            storage_path: filePath,
            metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
            is_ppe: false,
          })

        if (photoError) {
          if (photoError.message?.includes('network') || photoError.message?.includes('fetch')) {
            throw new Error('Network connection failed. Please check your internet and try again.')
          }
          throw photoError
        }
        
        // Success
        return
      } catch (error: any) {
        lastError = error
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }
    
    // All retries failed - provide user-friendly error message
    let errorMessage = 'Upload failed'
    if (lastError?.message) {
      if (lastError.message.includes('Network') || lastError.message.includes('network') || lastError.message.includes('fetch')) {
        errorMessage = 'Network connection failed. Please check your internet and try again.'
      } else if (lastError.message.includes('Permission') || lastError.message.includes('RLS')) {
        errorMessage = 'Permission denied. Please contact support if this issue persists.'
      } else if (lastError.message.includes('large') || lastError.message.includes('size')) {
        errorMessage = 'File too large. Please use a smaller image.'
      } else {
        errorMessage = `Upload failed: ${lastError.message}`
      }
    } else {
      errorMessage = `Upload failed after ${maxRetries} attempts. Please try again.`
    }
    
    throw new Error(errorMessage)
  }

  async function handleArrivalComplete(userId: string) {
    if (!arrivalPhoto && !gate.requires_exception) {
      throw new Error('Arrival photo is required. Take a photo or log an exception.')
    }

    if (arrivalPhoto) {
      try {
        const fileName = `arrival_${job.id}_${Date.now()}.jpg`
        const filePath = `jobs/${job.id}/photos/${fileName}`

        await uploadPhotoWithRetry(
          arrivalPhoto,
          filePath,
          { type: 'arrival', stage: 'Arrival' }
        )
      } catch (error: any) {
        // Re-throw with user-friendly message (uploadPhotoWithRetry already provides good messages)
        throw error
      }
    }
  }

  async function handleIntakeComplete(userId: string) {
    if (!intakeData.customerName && !intakeData.customerPhone && !gate.requires_exception) {
      throw new Error('Customer contact info is required or log an exception.')
    }
    if (!intakeData.lossType && !gate.requires_exception) {
      throw new Error('Loss type is required or log an exception.')
    }
    if (intakeData.affectedAreas.length === 0 && !gate.requires_exception) {
      throw new Error('At least one affected area is required or log an exception.')
    }
    // Store intake data in gate metadata
    const { error } = await supabase
      .from('job_gates')
      .update({
        metadata: intakeData,
      })
      .eq('id', gateId)
    if (error) throw error
  }

  async function handleMoistureComplete(userId: string) {
    if (moistureData.equipment.length === 0 && !gate.requires_exception) {
      throw new Error('Equipment status is required or log an exception.')
    }

    // Upload equipment photos with retry
    for (const photo of moistureData.equipmentPhotos) {
      const fileName = `equipment_${job.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
      const filePath = `jobs/${job.id}/photos/${fileName}`

      await uploadPhotoWithRetry(
        photo,
        filePath,
        { type: 'equipment', stage: 'Moisture/Equipment' }
      )
    }

    // Store moisture data in gate metadata
    const { error } = await supabase
      .from('job_gates')
      .update({
        metadata: moistureData,
      })
      .eq('id', gateId)
    if (error) throw error
  }

  async function handleScopeComplete(userId: string) {
    if (scopeData.rooms.length === 0 && !gate.requires_exception) {
      throw new Error('At least one affected room is required or log an exception.')
    }
    // Store scope data in gate metadata
    const { error } = await supabase
      .from('job_gates')
      .update({
        metadata: scopeData,
      })
      .eq('id', gateId)
    if (error) throw error
  }

  async function handleSignoffComplete(userId: string) {
    if (!signoffData.signature && !signoffData.claimNumber && !signoffData.customerPay && !gate.requires_exception) {
      throw new Error('Work authorization is required or log an exception.')
    }
    // Store signoff data in gate metadata
    const { error } = await supabase
      .from('job_gates')
      .update({
        metadata: signoffData,
      })
      .eq('id', gateId)
    if (error) throw error
  }

  async function handleDepartureComplete(userId: string) {
    if (!departureData.equipmentStatus && !gate.requires_exception) {
      throw new Error('Equipment status is required.')
    }
    if (!departureData.jobStatus && !gate.requires_exception) {
      throw new Error('Job status is required.')
    }
    // Store departure data in gate metadata and update job status
    const { error: gateError } = await supabase
      .from('job_gates')
      .update({
        metadata: departureData,
      })
      .eq('id', gateId)
    if (gateError) throw gateError

    const { error: jobError } = await supabase
      .from('jobs')
      .update({
        status: departureData.jobStatus.toLowerCase().replace(' ', '_') as any,
      })
      .eq('id', job.id)
    if (jobError) throw jobError
  }

  function openExceptionModal() {
    setExceptionReason('')
    setExceptionModalOpen(true)
  }

  async function handleException() {
    if (!exceptionReason || exceptionReason.trim().length === 0) {
      setBanner({
        type: 'error',
        message: 'Exception reason is required.',
      })
      return
    }

    setExceptionModalOpen(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('job_gates')
        .update({
          status: 'skipped',
          requires_exception: true,
          exception_reason: exceptionReason.trim(),
          completed_at: new Date().toISOString(),
          completed_by: user.id,
        })
        .eq('id', gateId)

      if (error) throw error

      setBanner({
        type: 'success',
        message: 'Exception logged.',
      })
      router.push(`/field/jobs/${gate?.job_id}`)
    } catch (error: any) {
      setBanner({
        type: 'error',
        message: error.message || 'Failed to log exception',
      })
    }
  }

  function renderGateContent() {
    if (!gate) return null

    switch (gate.stage_name) {
      case 'Arrival':
        return (
          <>
            <div className="glass-basic card-glass mb-6">
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Required</h3>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }} role="list">
                <li>Arrival photo (exterior of property/unit)</li>
                <li>Timestamp (auto-captured)</li>
              </ul>
            </div>
            <div className="glass-basic card-glass mb-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Arrival Photo</h2>
              <PhotoCapture
                onPhotoTaken={(file) => setArrivalPhoto(file)}
                label="Take Arrival Photo"
                required={!gate.requires_exception}
                aria-label="Capture arrival photo of property exterior"
              />
              {arrivalPhoto && (
                <p className="mt-2 text-sm" style={{ color: 'var(--success)' }}>
                  Photo captured: {arrivalPhoto.name}
                </p>
              )}
            </div>
          </>
        )

      case 'Intake':
        return (
          <>
            <div className="glass-basic card-glass mb-6">
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Required</h3>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Customer contact info or confirmation unavailable</li>
                <li>Loss type selection</li>
                <li>At least one affected area with damage type</li>
              </ul>
            </div>
            <div className="glass-basic card-glass mb-6 space-y-4">
              <div>
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  value={intakeData.customerName}
                  onChange={(e) =>
                    setIntakeData({ ...intakeData, customerName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Customer Phone</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={intakeData.customerPhone}
                  onChange={(e) =>
                    setIntakeData({ ...intakeData, customerPhone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="loss-type">Loss Type *</Label>
                <Select
                  id="loss-type"
                  value={intakeData.lossType}
                  onChange={(e) =>
                    setIntakeData({ ...intakeData, lossType: e.target.value })
                  }
                >
                  <option value="">Select...</option>
                  {LOSS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                  Affected Areas *
                </p>
                {['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Basement', 'Attic', 'Exterior', 'Other'].map(room => (
                  <label key={room} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      checked={intakeData.affectedAreas.some(a => a.room === room)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIntakeData({
                            ...intakeData,
                            affectedAreas: [...intakeData.affectedAreas, { room, damageType: '' }],
                          })
                        } else {
                          setIntakeData({
                            ...intakeData,
                            affectedAreas: intakeData.affectedAreas.filter(a => a.room !== room),
                          })
                        }
                      }}
                    />
                    <span>{room}</span>
                  </label>
                ))}
              </div>
              {intakeData.affectedAreas.map((area, index) => (
                <div key={`${area.room}-${index}`}>
                  <Label>{area.room} - Damage Type *</Label>
                  <Select
                    value={area.damageType}
                    onChange={(e) => {
                      const updatedAreas = [...intakeData.affectedAreas]
                      updatedAreas[index] = { ...area, damageType: e.target.value }
                      setIntakeData({ ...intakeData, affectedAreas: updatedAreas })
                    }}
                  >
                    <option value="">Select...</option>
                    {DAMAGE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customer-signature"
                  checked={intakeData.customerSignature}
                  onChange={(e) =>
                    setIntakeData({
                      ...intakeData,
                      customerSignature: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="customer-signature" className="mb-0">
                  Customer signature/acknowledgment obtained
                </Label>
              </div>
            </div>
          </>
        )

      case 'Moisture/Equipment':
        return (
          <>
            <div className="glass-basic card-glass mb-6">
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Required</h3>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Chamber setup (at least one chamber)</li>
                <li>Psychrometric readings (ambient temp, RH, GPP)</li>
                <li>Moisture point readings or "No moisture detected"</li>
                <li>Equipment deployment tracking</li>
              </ul>
            </div>
            
            {/* Hydro System Components */}
            {job && <HydroSystemSection jobId={job.id} />}
            
            {/* Legacy moisture readings (keep for backward compatibility) */}
            <div className="glass-basic card-glass mb-6 space-y-4">
                  <div>
                    <Label htmlFor="moisture-readings">Moisture Readings (Legacy)</Label>
                    <Textarea
                      id="moisture-readings"
                      value={moistureData.readings}
                      onChange={(e) =>
                        setMoistureData({ ...moistureData, readings: e.target.value })
                      }
                      placeholder="Enter moisture readings or 'No moisture detected'"
                      rows={3}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                      Equipment Deployed *
                    </p>
                    {EQUIPMENT_TYPES.map((eq) => (
                      <label key={eq} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          checked={moistureData.equipment.includes(eq)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMoistureData({
                                ...moistureData,
                                equipment: [...moistureData.equipment, eq],
                              })
                            } else {
                              setMoistureData({
                                ...moistureData,
                                equipment: moistureData.equipment.filter(
                                  (x) => x !== eq
                                ),
                              })
                            }
                          }}
                        />
                        <span>{eq}</span>
                      </label>
                    ))}
              </div>
              {moistureData.equipment.length > 0 && moistureData.equipment[0] !== 'None' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Photos</label>
                  <PhotoCapture
                    onPhotoTaken={(file) => setMoistureData({...moistureData, equipmentPhotos: [...moistureData.equipmentPhotos, file]})}
                    label="Add Equipment Photo"
                    required={false}
                  />
                  {moistureData.equipmentPhotos.length > 0 && (
                    <p className="mt-2 text-sm" style={{ color: 'var(--success)' }}>
                      {moistureData.equipmentPhotos.length} photo(s) captured
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )

      case 'Scope':
        return (
          <>
            <div className="glass-basic card-glass mb-6">
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Required</h3>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Affected rooms list (must match rooms with photos)</li>
                <li>Damage type per room</li>
                <li>Measurements or "Visual estimate only"</li>
                <li>Scope notes</li>
              </ul>
            </div>
            <div className="glass-basic card-glass mb-6 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                  Affected Rooms *
                </p>
                {['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Basement', 'Attic', 'Exterior', 'Other'].map(room => (
                  <label key={room} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      checked={scopeData.rooms.includes(room)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setScopeData({
                            ...scopeData,
                            rooms: [...scopeData.rooms, room],
                            damageTypes: { ...scopeData.damageTypes, [room]: '' },
                          })
                        } else {
                          const { [room]: _, ...rest } = scopeData.damageTypes
                          setScopeData({
                            ...scopeData,
                            rooms: scopeData.rooms.filter((r) => r !== room),
                            damageTypes: rest,
                          })
                        }
                      }}
                    />
                    <span>{room}</span>
                  </label>
                ))}
              </div>
              {scopeData.rooms.map(room => (
                <div key={room}>
                  <Label>{room} - Damage Type</Label>
                  <Select
                    value={scopeData.damageTypes[room] || ''}
                    onChange={(e) =>
                      setScopeData({
                        ...scopeData,
                        damageTypes: {
                          ...scopeData.damageTypes,
                          [room]: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="">Select...</option>
                    {DAMAGE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
              <div>
                <Label htmlFor="measurements">Measurements</Label>
                <Textarea
                  id="measurements"
                  value={scopeData.measurements}
                  onChange={(e) =>
                    setScopeData({ ...scopeData, measurements: e.target.value })
                  }
                  placeholder="Enter measurements or 'Visual estimate only'"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="scope-notes">Scope Notes</Label>
                <Textarea
                  id="scope-notes"
                  value={scopeData.notes}
                  onChange={(e) =>
                    setScopeData({ ...scopeData, notes: e.target.value })
                  }
                  placeholder="What needs repair, what needs replacement"
                  rows={4}
                />
              </div>
            </div>
          </>
        )

      case 'Sign-offs':
        return (
          <>
            <div className="glass-basic card-glass mb-6">
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Required</h3>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Work authorization signature or exception</li>
                <li>Insurance claim number or "Customer pay"</li>
                <li>Next steps acknowledgment</li>
              </ul>
            </div>
            <div className="glass-basic card-glass mb-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="signature-obtained"
                  checked={signoffData.signature}
                  onChange={(e) =>
                    setSignoffData({
                      ...signoffData,
                      signature: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="signature-obtained" className="mb-0">
                  Work authorization signature obtained
                </Label>
              </div>
              <div>
                <Label htmlFor="claim-number">Insurance Claim Number</Label>
                <Input
                  id="claim-number"
                  value={signoffData.claimNumber}
                  onChange={(e) =>
                    setSignoffData({
                      ...signoffData,
                      claimNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customer-pay"
                  checked={signoffData.customerPay}
                  onChange={(e) =>
                    setSignoffData({
                      ...signoffData,
                      customerPay: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="customer-pay" className="mb-0">
                  Customer pay (no insurance)
                </Label>
              </div>
              <div>
                <Label htmlFor="next-steps">Next Steps *</Label>
                <Select
                  id="next-steps"
                  value={signoffData.nextSteps}
                  onChange={(e) =>
                    setSignoffData({
                      ...signoffData,
                      nextSteps: e.target.value,
                    })
                  }
                >
                  <option value="">Select...</option>
                  {NEXT_STEPS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </>
        )

      case 'Departure':
        return (
          <>
            <div className="glass-basic card-glass mb-6">
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Required</h3>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Departure timestamp (auto-captured)</li>
                <li>Equipment status</li>
                <li>Job status update</li>
              </ul>
            </div>
            <div className="glass-basic card-glass mb-6 space-y-4">
              <div>
                <Label htmlFor="equipment-status">Equipment Status *</Label>
                <Select
                  id="equipment-status"
                  value={departureData.equipmentStatus}
                  onChange={(e) =>
                    setDepartureData({
                      ...departureData,
                      equipmentStatus: e.target.value,
                    })
                  }
                >
                  <option value="">Select...</option>
                  {EQUIPMENT_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="final-notes">Final Notes</Label>
                <Textarea
                  id="final-notes"
                  value={departureData.notes}
                  onChange={(e) =>
                    setDepartureData({
                      ...departureData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="job-status">Job Status *</Label>
                <Select
                  id="job-status"
                  value={departureData.jobStatus}
                  onChange={(e) =>
                    setDepartureData({
                      ...departureData,
                      jobStatus: e.target.value,
                    })
                  }
                >
                  <option value="">Select...</option>
                  {JOB_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </>
        )

      default:
        return (
          <div className="glass-basic card-glass" style={{ borderLeft: '4px solid var(--warning)' }}>
            Gate type "{gate.stage_name}" not yet implemented.
          </div>
        )
    }
  }

  if (!gate || !job) {
    return (
      <div className="app-shell">
        <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="app-shell-inner">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </header>
        <main className="app-shell-inner max-w-3xl space-y-6 py-6">
          <SkeletonCard />
          <SkeletonCard />
          <div className="space-y-4">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </main>
      </div>
    )
  }

  const canComplete = () => {
    if (gate.requires_exception) return true
    switch (gate.stage_name) {
      case 'Arrival': return !!arrivalPhoto
      case 'Intake': 
        return !!(intakeData.customerName || intakeData.customerPhone) && 
               !!intakeData.lossType && 
               intakeData.affectedAreas.length > 0 &&
               intakeData.affectedAreas.every(a => a.damageType)
      case 'Moisture/Equipment': return moistureData.equipment.length > 0
      case 'Scope': return scopeData.rooms.length > 0
      case 'Sign-offs': return !!(signoffData.signature || signoffData.claimNumber || signoffData.customerPay) && !!signoffData.nextSteps
      case 'Departure': return !!departureData.equipmentStatus && !!departureData.jobStatus
      default: return false
    }
  }

  return (
    <div className="app-shell">
      <header className="glass-basic border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner">
          <button
            type="button"
            onClick={() => router.push(`/field/jobs/${job.id}`)}
            className="mb-4 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            ← Back to Job
          </button>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {gate.stage_name} Gate
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Complete the {gate.stage_name.toLowerCase()} workflow.
          </p>
        </div>
      </header>

      <main className="app-shell-inner max-w-3xl space-y-6">
        {banner && (
          <div
            role="alert"
            aria-live={banner.type === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            className="glass-basic card-glass border-l-4"
            style={{
              borderColor:
                banner.type === 'success'
                  ? 'var(--success)'
                  : 'var(--error)',
            }}
          >
            <p
              className="text-sm"
              style={{
                color:
                  banner.type === 'success'
                    ? 'var(--text-primary)'
                    : 'var(--error)',
              }}
            >
              {banner.message}
            </p>
          </div>
        )}

        {/* Autosave status indicator */}
        {gate && gate.status !== 'complete' && gate.status !== 'skipped' && (
          <div className="flex justify-end" role="status" aria-live="polite" aria-atomic="true">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && '✓ Draft saved'}
              {saveStatus === 'error' && '⚠ Save failed - will retry'}
            </p>
          </div>
        )}

        {renderGateContent()}

        <div className="space-y-4" role="group" aria-label="Gate actions">
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isCompleting || !canComplete()}
            className="w-full"
            variant={canComplete() && !isCompleting ? "default" : "subtle"}
            aria-label={isCompleting ? 'Completing gate, please wait' : `Complete ${gate.stage_name} gate`}
            aria-busy={isCompleting}
          >
            {isCompleting ? 'Completing...' : 'Complete Gate'}
          </Button>

          <Button
            type="button"
            onClick={openExceptionModal}
            className="w-full"
            variant="outline"
            aria-label={`Log exception for ${gate.stage_name} gate`}
          >
            Log Exception
          </Button>
        </div>
      </main>

      <Modal
        isOpen={exceptionModalOpen}
        onClose={() => setExceptionModalOpen(false)}
        title={`Log Exception - ${gate.stage_name} Gate`}
        onSubmit={handleException}
        submitLabel="Log Exception"
        submitVariant="destructive"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Please provide a reason why you cannot complete the {gate.stage_name} gate:
          </p>
          <Textarea
            value={exceptionReason}
            onChange={(e) => setExceptionReason(e.target.value)}
            placeholder="Enter exception reason..."
            rows={4}
            required
          />
        </div>
      </Modal>
    </div>
  )
}
