'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, AlertCircle, CheckCircle2, X } from 'lucide-react'

interface PhotoCaptureProps {
  onPhotoTaken: (file: File) => void
  label?: string
  required?: boolean
  'aria-label'?: string
  photoType?: 'wide' | 'close-up' | 'context' | 'equipment' | 'ppe' | 'other'
  minResolution?: { width: number; height: number }
  maxFileSize?: number // in bytes
}

interface PhotoQuality {
  isValid: boolean
  resolution: { width: number; height: number } | null
  fileSize: number
  errors: string[]
  warnings: string[]
}

const DEFAULT_MIN_RESOLUTION = { width: 640, height: 480 }
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function PhotoCapture({ 
  onPhotoTaken, 
  label = 'Take Photo', 
  required = false, 
  'aria-label': ariaLabel,
  photoType,
  minResolution = DEFAULT_MIN_RESOLUTION,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
}: PhotoCaptureProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [qualityCheck, setQualityCheck] = useState<PhotoQuality | null>(null)
  const [isCheckingQuality, setIsCheckingQuality] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputId = `camera-input-${Math.random().toString(36).substr(2, 9)}`
  const libraryInputId = `library-input-${Math.random().toString(36).substr(2, 9)}`

  const checkPhotoQuality = useCallback(async (file: File): Promise<PhotoQuality> => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (${(maxFileSize / 1024 / 1024).toFixed(2)}MB)`)
    } else if (file.size > maxFileSize * 0.8) {
      warnings.push('File size is close to the maximum limit')
    }

    // Check resolution
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        const resolution = { width: img.width, height: img.height }
        
        if (img.width < minResolution.width || img.height < minResolution.height) {
          errors.push(`Resolution (${img.width}x${img.height}) is below minimum (${minResolution.width}x${minResolution.height})`)
        } else if (img.width < minResolution.width * 1.5 || img.height < minResolution.height * 1.5) {
          warnings.push('Resolution is acceptable but could be higher for better quality')
        }

        URL.revokeObjectURL(url)
        
        resolve({
          isValid: errors.length === 0,
          resolution,
          fileSize: file.size,
          errors,
          warnings,
        })
      }
      
      img.onerror = () => {
        errors.push('Unable to read image file')
        URL.revokeObjectURL(url)
        resolve({
          isValid: false,
          resolution: null,
          fileSize: file.size,
          errors,
          warnings,
        })
      }
      
      img.src = url
    })
  }, [minResolution, maxFileSize])

  const handleFileSelect = useCallback(async (file: File) => {
    setIsCheckingQuality(true)
    setCurrentFile(file)
    
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    
    const quality = await checkPhotoQuality(file)
    setQualityCheck(quality)
    setIsCheckingQuality(false)
    
    // Only call onPhotoTaken if quality is valid
    if (quality.isValid) {
      onPhotoTaken(file)
    }
  }, [onPhotoTaken, checkPhotoQuality])

  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input so same file can be selected again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }, [handleFileSelect])

  const handleLibrarySelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input so same file can be selected again
    if (libraryInputRef.current) {
      libraryInputRef.current.value = ''
    }
  }, [handleFileSelect])

  const handleRetake = useCallback(() => {
    setPhotoPreview(null)
    setCurrentFile(null)
    setQualityCheck(null)
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
    if (libraryInputRef.current) {
      libraryInputRef.current.value = ''
    }
  }, [])

  const handleAcceptAnyway = useCallback(() => {
    if (currentFile) {
      onPhotoTaken(currentFile)
    }
  }, [currentFile, onPhotoTaken])

  const handleLibraryLabelClick = useCallback((e: React.MouseEvent<HTMLLabelElement>) => {
    e.preventDefault()
    if (libraryInputRef.current) {
      libraryInputRef.current.click()
    }
  }, [])

  const handleCameraLabelClick = useCallback((e: React.MouseEvent<HTMLLabelElement>) => {
    e.preventDefault()
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <input
          id={cameraInputId}
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />
        <label 
          htmlFor={cameraInputId} 
          onClick={handleCameraLabelClick} 
          className="block cursor-pointer"
          aria-label={ariaLabel || label}
        >
          <div className="w-full bg-[var(--accent)] text-white px-6 py-4 rounded-xl font-semibold text-center transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.98] min-h-[44px] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
            <Camera className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </div>
        </label>
        <input
          id={libraryInputId}
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          onChange={handleLibrarySelect}
          className="hidden"
        />
        <label 
          htmlFor={libraryInputId} 
          onClick={handleLibraryLabelClick} 
          className="block cursor-pointer"
          aria-label="Choose photo from device library"
        >
          <div className="w-full glass-basic px-6 py-4 rounded-xl font-medium text-center transition-all duration-200 hover:shadow-lg active:scale-[0.98] min-h-[44px] flex items-center justify-center text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
            Choose from Library
          </div>
        </label>
        {required && (
          <p className="text-sm text-[var(--error)] px-2">* This photo is required</p>
        )}
      </div>

      {isCheckingQuality && (
        <div className="glass-basic p-4 rounded-xl" role="status" aria-live="polite">
          <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            Checking photo quality...
          </p>
        </div>
      )}

      {photoPreview && qualityCheck && (
        <div className="space-y-3 glass-basic p-4 rounded-xl" role="status" aria-live="polite">
          <img src={photoPreview} alt="Photo preview" className="w-full rounded-lg max-h-64 object-contain bg-[var(--bg-tertiary)]" />
          
          {/* Quality Feedback */}
          <div className="space-y-2">
            {qualityCheck.isValid ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }}>
                <CheckCircle2 size={16} />
                <span className="font-medium">Photo quality is good</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--error)' }}>
                  <AlertCircle size={16} />
                  <span className="font-medium">Photo quality issues detected</span>
                </div>
                {qualityCheck.errors.length > 0 && (
                  <ul className="list-disc list-inside text-xs space-y-1" style={{ color: 'var(--error)' }}>
                    {qualityCheck.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
                {qualityCheck.warnings.length > 0 && (
                  <ul className="list-disc list-inside text-xs space-y-1" style={{ color: 'var(--warning)' }}>
                    {qualityCheck.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-4 py-2 text-sm font-medium rounded border"
                    style={{
                      backgroundColor: 'var(--background)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Retake Photo
                  </button>
                  {!required && (
                    <button
                      type="button"
                      onClick={handleAcceptAnyway}
                      className="px-4 py-2 text-sm font-medium rounded"
                      style={{
                        backgroundColor: 'var(--warning)',
                        color: 'white',
                      }}
                    >
                      Accept Anyway
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {qualityCheck.isValid && qualityCheck.resolution && (
              <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <p>Resolution: {qualityCheck.resolution.width} × {qualityCheck.resolution.height}px</p>
                <p>File size: {(qualityCheck.fileSize / 1024 / 1024).toFixed(2)}MB</p>
                {photoType && <p>Type: {photoType}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

