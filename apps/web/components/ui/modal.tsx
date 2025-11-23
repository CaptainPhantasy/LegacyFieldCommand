'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onSubmit?: () => void
  submitLabel?: string
  submitVariant?: 'default' | 'destructive'
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Submit',
  submitVariant = 'default',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      
      // Focus trap: Keep focus within modal
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return
        
        const modal = modalRef.current
        if (!modal) return

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }

      document.addEventListener('keydown', handleTab)
      
      // Focus first input in modal
      const firstInput = modalRef.current?.querySelector<HTMLElement>('input, textarea, button')
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100)
      }

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('keydown', handleTab)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="glass-basic card-glass w-full max-w-md p-6 space-y-4"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Close modal"
            type="button"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div style={{ color: 'var(--text-secondary)' }}>{children}</div>

        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {onSubmit && (
            <Button
              onClick={onSubmit}
              style={
                submitVariant === 'destructive'
                  ? { background: 'var(--error)', color: '#ffffff' }
                  : { background: 'var(--accent)', color: '#ffffff' }
              }
            >
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

