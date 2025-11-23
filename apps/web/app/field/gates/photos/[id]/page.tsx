'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import PhotoCapture from '@/components/PhotoCapture'
import { validateGate } from '@/utils/gateValidation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const ROOMS = ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Basement', 'Attic', 'Exterior', 'Other']
const PHOTO_TYPES = ['Wide room shot', 'Close-up of damage', 'Context/equipment photo'] as const
type PhotoType = typeof PHOTO_TYPES[number]

interface RoomPhotoProgress {
  [key: string]: {
    'Wide room shot': boolean
    'Close-up of damage': boolean
    'Context/equipment photo': boolean
  }
}

export default function PhotosGatePage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [gate, setGate] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType | null>(null)
  const [roomPhotoProgress, setRoomPhotoProgress] = useState<RoomPhotoProgress>({})
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, Array<{ file: File; type: PhotoType; uploaded: boolean }>>>({})
  const [isCompleting, setIsCompleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [photos, setPhotos] = useState<any[]>([])
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [gateId, setGateId] = useState<string>('')

  useEffect(() => {
    let mounted = true
    params.then(p => {
      if (mounted) {
        setGateId(p.id)
        loadData(p.id)
      }
    })
    return () => { mounted = false }
  }, [params])

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
      setPhotos(photosData || [])

      // Build progress from existing photos
      if (photosData && photosData.length > 0) {
        const progress: RoomPhotoProgress = {}
        photosData.forEach((photo: any) => {
          // Handle metadata - could be object or string
          let metadata = photo.metadata
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata)
            } catch (e) {
              metadata = {}
            }
          }
          const room = metadata?.room
          const type = metadata?.type
          if (room && type && PHOTO_TYPES.includes(type as PhotoType)) {
            if (!progress[room]) {
              progress[room] = {
                'Wide room shot': false,
                'Close-up of damage': false,
                'Context/equipment photo': false,
              }
            }
            // Mark this type as taken (only need one of each type)
            progress[room][type as PhotoType] = true
          }
        })
        setRoomPhotoProgress(progress)
      }
    }
  }

  // Get the next photo type needed for the selected room
  function getNextPhotoType(room: string): PhotoType | null {
    if (!roomPhotoProgress[room]) {
      return 'Wide room shot' // First photo
    }
    const progress = roomPhotoProgress[room]
    if (!progress['Wide room shot']) return 'Wide room shot'
    if (!progress['Close-up of damage']) return 'Close-up of damage'
    if (!progress['Context/equipment photo']) return 'Context/equipment photo'
    return null // All photos taken
  }

  // Get photo count for a room
  function getRoomPhotoCount(room: string): number {
    if (!roomPhotoProgress[room]) return 0
    const progress = roomPhotoProgress[room]
    return Object.values(progress).filter(Boolean).length
  }

  // Check if room is complete (all 3 photos taken)
  function isRoomComplete(room: string): boolean {
    return getRoomPhotoCount(room) >= 3
  }

  // Check if gate can be completed (at least one room with all 3 photos)
  function canCompleteGate() {
    return ROOMS.some(room => isRoomComplete(room))
  }

  async function handlePhotoTaken(file: File) {
    if (!selectedRoom || !currentPhotoType) {
      setBanner({
        type: 'error',
        message: 'Please select a room first.',
      })
      return
    }

    setIsUploading(true)

    try {
      // Get user for upload
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error(`Authentication failed: ${authError?.message || 'Not logged in'}`)
      }

      if (!gate || !job) {
        throw new Error('Gate or job not loaded')
      }

      // Verify job assignment
      const { data: jobAssignment, error: jobCheckError } = await supabase
        .from('jobs')
        .select('id, lead_tech_id, title')
        .eq('id', job.id)
        .single()

      if (jobCheckError || !jobAssignment) {
        throw new Error(`Cannot verify job assignment: ${jobCheckError?.message || 'Job not found'}`)
      }

      if (jobAssignment.lead_tech_id !== user.id) {
        throw new Error(`Job is not assigned to you. Please assign this job in the admin dashboard.`)
      }

      // Upload photo to storage
      const fileName = `${selectedRoom}_${currentPhotoType.replace(/\s+/g, '_')}_${Date.now()}.jpg`
      const filePath = `jobs/${job.id}/photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(filePath, file, { contentType: 'image/jpeg' })

      if (uploadError) {
        if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
          throw new Error(
            `Storage RLS Policy Violation: Cannot upload to storage bucket 'job-photos'. ` +
            `Run: supabase/fix_storage_rls.sql in Supabase SQL Editor.`
          )
        }
        throw new Error(`Failed to upload photo: ${uploadError.message}`)
      }

      // Create photo record in database
      const { error: photoError } = await supabase.from('job_photos').insert({
        job_id: job.id,
        gate_id: gateId,
        taken_by: user.id,
        storage_path: filePath,
        metadata: {
          room: selectedRoom,
          type: currentPhotoType,
        },
        is_ppe: false,
      })

      if (photoError) {
        if (photoError.message?.includes('row-level security') || photoError.message?.includes('RLS')) {
          throw new Error(
            `RLS Policy Violation: Cannot insert photo record. ` +
            `Verify job assignment and RLS policies.`
          )
        }
        throw photoError
      }

      // Update progress
      setRoomPhotoProgress(prev => ({
        ...prev,
        [selectedRoom]: {
          ...(prev[selectedRoom] || {}),
          [currentPhotoType]: true,
        },
      }))

      // Store uploaded photo info
      setUploadedPhotos(prev => ({
        ...prev,
        [selectedRoom]: [...(prev[selectedRoom] || []), { file, type: currentPhotoType, uploaded: true }],
      }))

      // Reload photos list and rebuild progress from database
      const { data: photosData } = await supabase
        .from('job_photos')
        .select('*')
        .eq('job_id', job.id)
      setPhotos(photosData || [])

      // Rebuild progress from all photos in database to ensure accuracy
      const progress: RoomPhotoProgress = {}
      if (photosData && photosData.length > 0) {
        photosData.forEach((photo: any) => {
          // Handle metadata - could be object or string
          let metadata = photo.metadata
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata)
            } catch (e) {
              metadata = {}
            }
          }
          const room = metadata?.room
          const type = metadata?.type
          if (room && type && PHOTO_TYPES.includes(type as PhotoType)) {
            if (!progress[room]) {
              progress[room] = {
                'Wide room shot': false,
                'Close-up of damage': false,
                'Context/equipment photo': false,
              }
            }
            progress[room][type as PhotoType] = true
          }
        })
      }
      setRoomPhotoProgress(progress)

      // Move to next photo type or clear selection if room is complete
      const nextType = getNextPhotoType(selectedRoom)
      if (nextType) {
        setCurrentPhotoType(nextType)
      } else {
        // Room complete - show success message
        setBanner({
          type: 'success',
          message: `${selectedRoom} complete. All 3 required photos have been taken.`,
        })
        setCurrentPhotoType(null)
      }
    } catch (error: any) {
      setBanner({
        type: 'error',
        message: error.message || 'Failed to upload photo.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleComplete() {
    if (!gate || !job) return

    // Validate
    const validation = await validateGate(gateId, job.id, gate, photos)
    if (!validation.isValid) {
      setBanner({
        type: 'error',
        message: validation.errors.join('\n\n'),
      })
      return
    }

    if (!canCompleteGate()) {
      setBanner({
        type: 'error',
        message:
          'You must document at least one room with all 3 required photos: wide room shot, close-up of damage, and context/equipment photo.',
      })
      return
    }

    setIsCompleting(true)

    try {
      // Get user first (needed for both photo upload and gate update)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
        
      if (authError || !user) {
        console.error('Auth error:', authError)
        throw new Error(`Authentication failed: ${authError?.message || 'Not logged in'}`)
      }

      console.log('User authenticated:', { userId: user.id, email: user.email })

      // Get full job details to check assignment (once, before loop)
      const { data: jobAssignment, error: jobCheckError } = await supabase
        .from('jobs')
        .select('id, lead_tech_id, title')
        .eq('id', job.id)
        .single()

      if (jobCheckError || !jobAssignment) {
        console.error('Job check error:', jobCheckError)
        throw new Error(`Cannot verify job assignment: ${jobCheckError?.message || 'Job not found'}`)
      }

      // Detailed assignment check
      const isAssigned = jobAssignment.lead_tech_id === user.id
      console.log('Job Assignment Check:', {
        jobId: job.id,
        jobTitle: jobAssignment.title,
        jobLeadTechId: jobAssignment.lead_tech_id,
        currentUserId: user.id,
        isAssigned,
        match: jobAssignment.lead_tech_id === user.id
      })

      if (!isAssigned) {
        const assignmentStatus = jobAssignment.lead_tech_id 
          ? `assigned to user ${jobAssignment.lead_tech_id}` 
          : 'UNASSIGNED (lead_tech_id is NULL)'
        throw new Error(
          `Job "${jobAssignment.title || job.id}" is not assigned to you. ` +
          `Current assignment: ${assignmentStatus}. ` +
          `Your user ID: ${user.id}. ` +
          `Please assign this job to your user account in the admin dashboard.`
        )
      }

      // Photos are already uploaded during capture, just verify we have at least one complete room

      // Update gate status (user already fetched above)
      const { error: gateError } = await supabase
        .from('job_gates')
        .update({
          status: 'complete',
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
        })
        .eq('id', gateId)

      if (gateError) throw gateError

      setBanner({
        type: 'success',
        message: 'Photos gate completed.',
      })
      router.push(`/field/jobs/${job.id}`)
    } catch (error: any) {
      setBanner({
        type: 'error',
        message: error.message || 'Failed to complete gate.',
      })
    } finally {
      setIsCompleting(false)
    }
  }

  if (!gate || !job) {
    return (
      <div className="app-shell">
        <main className="app-shell-inner max-w-3xl">
          <div className="glass-basic card-glass">
            <p style={{ color: 'var(--text-secondary)' }}>Loading photos gate...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* Header with glass effect */}
      <header className="glass-basic sticky top-0 z-10 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="app-shell-inner max-w-4xl py-6">
          <button
            onClick={() => router.push(`/field/jobs/${job.id}`)}
            className="text-sm mb-4 transition-colors hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            ← Back to Job
          </button>
          <h1 className="text-4xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Photos Gate</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Document rooms with photos</p>
        </div>
      </header>

      <main className="app-shell-inner max-w-4xl space-y-6">
        {banner && (
          <div
            className="glass-basic card-glass border-l-4"
            style={{
              borderColor:
                banner.type === 'success'
                  ? 'var(--success)'
                  : 'var(--error)',
            }}
          >
            <p
              className="text-sm whitespace-pre-line"
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
        {/* Requirements card with glass */}
        <div className="glass-basic p-6 rounded-2xl">
          <h3 className="font-semibold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>Required per room:</h3>
          <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-center gap-2">
              <span className="text-[var(--accent)]">•</span>
              <span>Wide room shot</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--accent)]">•</span>
              <span>Close-up of damage</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--accent)]">•</span>
              <span>Context/equipment photo</span>
            </li>
            <li className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="font-semibold" style={{ color: 'var(--success)' }}>Complete</span>
              <span className="font-medium">Minimum 3 photos per documented room</span>
            </li>
          </ul>
        </div>

        {/* Room selection with glass cards */}
        <div className="glass-basic p-6 rounded-2xl">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Select Room to Document</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {ROOMS.map(room => {
              const count = getRoomPhotoCount(room)
              const complete = isRoomComplete(room)
              const isSelected = selectedRoom === room
              return (
                <button
                  key={room}
                  type="button"
                  onClick={() => {
                    setSelectedRoom(room)
                    const nextType = getNextPhotoType(room)
                    setCurrentPhotoType(nextType)
                  }}
                  className={`p-5 rounded-xl text-center transition-all duration-200 min-h-[100px] flex flex-col items-center justify-center ${
                    isSelected
                      ? 'ring-2 ring-[var(--accent)]'
                      : complete
                      ? 'ring-2 ring-[var(--success)]'
                      : ''
                  }`}
                  style={{
                    background: isSelected 
                      ? 'var(--accent)' 
                      : complete 
                      ? 'var(--success)' 
                      : 'var(--glass-bg)',
                    color: isSelected || complete ? 'white' : 'var(--text-primary)',
                    backdropFilter: isSelected || complete ? 'none' : 'blur(20px)',
                    WebkitBackdropFilter: isSelected || complete ? 'none' : 'blur(20px)',
                  }}
                >
                  <div className="font-semibold text-base mb-1">{room}</div>
                  <div className="text-sm opacity-90">
                    {count}/3 photos
                  </div>
                  {complete && (
                    <div className="mt-2 text-sm font-semibold">Complete</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Photo capture section */}
        {selectedRoom && (
          <div className="glass-basic p-8 rounded-2xl">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
              Photos for {selectedRoom} ({getRoomPhotoCount(selectedRoom)}/3)
            </h2>
            
            {currentPhotoType ? (
              <div className="space-y-6">
                <div className="glass-advanced p-6 rounded-xl">
                  <h3 className="font-bold text-xl mb-3" style={{ color: 'var(--text-primary)' }}>
                    Take Photo: {currentPhotoType}
                  </h3>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {currentPhotoType === 'Wide room shot' && 'Capture a wide-angle view of the entire room showing the overall condition and layout.'}
                    {currentPhotoType === 'Close-up of damage' && 'Take a detailed close-up photo of the specific damage or affected area.'}
                    {currentPhotoType === 'Context/equipment photo' && 'Document any equipment, context, or additional details relevant to the job.'}
                  </p>
                </div>
                
                <PhotoCapture
                  onPhotoTaken={handlePhotoTaken}
                  label={`Take ${currentPhotoType}`}
                  required={true}
                />
                
                {isUploading && (
                  <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading photo...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-advanced p-6 rounded-xl" style={{ background: 'var(--success)', color: 'white' }}>
                <p className="font-semibold text-lg">
                  {selectedRoom} is complete! All 3 required photos have been taken.
                </p>
              </div>
            )}

            {/* Progress indicator */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--glass-border)' }}>
              <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Photo Progress:</h3>
              <div className="space-y-3">
                {PHOTO_TYPES.map(type => {
                  const taken = roomPhotoProgress[selectedRoom]?.[type] || false
                  return (
                    <div key={type} className="flex items-center gap-3">
                      {taken ? (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--success)]">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--text-tertiary)' }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-tertiary)' }}></span>
                        </span>
                      )}
                      <span className={taken ? 'line-through opacity-60' : ''} style={{ color: taken ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        {type}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Complete button */}
        <button
          type="button"
          onClick={handleComplete}
          disabled={!canCompleteGate() || isCompleting}
          className="w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
          style={{
            background: canCompleteGate() && !isCompleting ? 'var(--success)' : 'var(--text-tertiary)',
            color: 'white',
          }}
        >
          {isCompleting ? (
            <span className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Completing...
            </span>
          ) : (
            'Complete Gate'
          )}
        </button>
      </main>
    </div>
  )
}

