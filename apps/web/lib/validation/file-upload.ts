/**
 * File upload validation utilities
 */

import { z } from 'zod';

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  PHOTO: 10 * 1024 * 1024, // 10MB
  PDF: 50 * 1024 * 1024, // 50MB
  VOICE: 25 * 1024 * 1024, // 25MB
  MEASUREMENT: 20 * 1024 * 1024, // 20MB
} as const;

/**
 * Allowed MIME types
 */
export const ALLOWED_MIME_TYPES = {
  PHOTO: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  PDF: ['application/pdf'],
  VOICE: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm'],
  MEASUREMENT: ['application/json', 'text/plain'],
} as const;

/**
 * Photo file validation schema
 */
export const photoFileSchema = z.instanceof(File)
  .refine(
    (file) => file.size <= FILE_SIZE_LIMITS.PHOTO,
    `File size must be less than ${FILE_SIZE_LIMITS.PHOTO / 1024 / 1024}MB`
  )
  .refine(
    (file) => ALLOWED_MIME_TYPES.PHOTO.includes(file.type as any),
    'File must be an image (JPEG, PNG, WebP, HEIC, or HEIF)'
  );

/**
 * PDF file validation schema
 */
export const pdfFileSchema = z.instanceof(File)
  .refine(
    (file) => file.size <= FILE_SIZE_LIMITS.PDF,
    `File size must be less than ${FILE_SIZE_LIMITS.PDF / 1024 / 1024}MB`
  )
  .refine(
    (file) => ALLOWED_MIME_TYPES.PDF.includes(file.type as any),
    'File must be a PDF'
  );

/**
 * Voice file validation schema
 */
export const voiceFileSchema = z.instanceof(File)
  .refine(
    (file) => file.size <= FILE_SIZE_LIMITS.VOICE,
    `File size must be less than ${FILE_SIZE_LIMITS.VOICE / 1024 / 1024}MB`
  )
  .refine(
    (file) => ALLOWED_MIME_TYPES.VOICE.includes(file.type as any),
    'File must be an audio file (MP3, WAV, or WebM)'
  );

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and dangerous characters
  return fileName
    .replace(/[\/\\]/g, '_')
    .replace(/[<>:"|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255); // Limit length
}

/**
 * Validate file name
 */
export function validateFileName(fileName: string): { valid: boolean; error?: string } {
  if (!fileName || fileName.length === 0) {
    return { valid: false, error: 'File name is required' };
  }

  if (fileName.length > 255) {
    return { valid: false, error: 'File name must be less than 255 characters' };
  }

  // Check for dangerous characters
  const dangerousChars = /[\/\\<>:"|?*]/;
  if (dangerousChars.test(fileName)) {
    return { valid: false, error: 'File name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'application/pdf': 'pdf',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
  };

  return mimeToExt[mimeType] || 'bin';
}

