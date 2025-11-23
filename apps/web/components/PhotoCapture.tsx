'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera } from 'lucide-react'

interface PhotoCaptureProps {
  onPhotoTaken: (file: File) => void
  label?: string
  required?: boolean
  'aria-label'?: string
}

export default function PhotoCapture({ onPhotoTaken, label = 'Take Photo', required = false, 'aria-label': ariaLabel }: PhotoCaptureProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputId = `camera-input-${Math.random().toString(36).substr(2, 9)}`
  const libraryInputId = `library-input-${Math.random().toString(36).substr(2, 9)}`

  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreview(previewUrl)
      onPhotoTaken(file)
    }
    // Reset input so same file can be selected again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }, [onPhotoTaken])

  const handleLibrarySelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreview(previewUrl)
      onPhotoTaken(file)
    }
    // Reset input so same file can be selected again
    if (libraryInputRef.current) {
      libraryInputRef.current.value = ''
    }
  }, [onPhotoTaken])

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

      {photoPreview && (
        <div className="space-y-3 glass-basic p-4 rounded-xl" role="status" aria-live="polite">
          <img src={photoPreview} alt="Photo preview" className="w-full rounded-lg max-h-64 object-contain bg-[var(--bg-tertiary)]" />
          <p className="text-sm text-[var(--success)] text-center font-medium">
            Photo selected. You can add more photos above.
          </p>
        </div>
      )}
    </div>
  )
}

